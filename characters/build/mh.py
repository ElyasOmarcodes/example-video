"""Minimal MakeHuman (CC0 assets from MPFB2's data folder) loader for headless Blender 5.3.

Reads only data files (OBJ, gzipped .target files, rig/weight JSON) and rebuilds:
  - the base mesh with UVs and one vertex group per OBJ group (body, helpers, joint cubes),
  - the macro target stack (gender/age/muscle/weight/height/proportions/race) exactly as MPFB computes it,
  - detail targets (face, ears, torso ...) and expression units as shape keys,
  - the 163-bone default skeleton placed on the *shaped* body (joint cubes follow the targets),
  - the default skin weights.
Units: MakeHuman decimetres, Y up  →  Blender metres, Z up:  (x, y, z) → (x, -z, y) * 0.1
"""
import gzip, json, os
import bpy
import numpy as np
from mathutils import Vector

MH = os.environ.get('MH_DATA', '/home/user/makehumancommunity/mpfb2/src/mpfb/data')


def conv(a):
    a = np.asarray(a, dtype=np.float64)
    return np.column_stack((a[:, 0], -a[:, 2], a[:, 1])) * 0.1


# ------------------------------------------------------------------ base mesh
def read_obj(path=None):
    path = path or os.path.join(MH, '3dobjs', 'base.obj')
    V, VT, faces, fvt, fgrp, groups = [], [], [], [], [], []
    g = None
    for line in open(path):
        if line.startswith('v '):
            V.append([float(x) for x in line.split()[1:4]])
        elif line.startswith('vt '):
            VT.append([float(x) for x in line.split()[1:3]])
        elif line.startswith('g '):
            g = line.split()[1]
            if g not in groups:
                groups.append(g)
        elif line.startswith('f '):
            parts = [p.split('/') for p in line.split()[1:]]
            faces.append([int(p[0]) - 1 for p in parts])
            fvt.append([int(p[1]) - 1 for p in parts])
            fgrp.append(groups.index(g))
    return dict(V=np.array(V), VT=np.array(VT), F=faces, FVT=fvt, FG=np.array(fgrp), groups=groups)


def read_target(rel):
    """rel like 'head/head-oval' (no extension). Returns (idx int array, delta Nx3 in MH units)."""
    p = os.path.join(MH, 'targets', rel + '.target.gz')
    idx, d = [], []
    with gzip.open(p, 'rt') as f:
        for line in f:
            s = line.split()
            if len(s) == 4 and not line.startswith('#'):
                idx.append(int(s[0]))
                d.append([float(s[1]), float(s[2]), float(s[3])])
    return np.array(idx, dtype=np.int64), np.array(d)


# ------------------------------------------------------------------ macro stack (port of MPFB's TargetService logic)
_MACRO = json.load(open(os.path.join(MH, 'targets', 'macrodetails', 'macro.json')))


def _interp(name, value):
    out = []
    for p in _MACRO['macrotargets'][name]['parts']:
        lo, hi = p['lowest'], p['highest']
        if lo < value < hi:
            pos = (value - lo) / (hi - lo)
            if p['low']:
                out.append([p['low'], round(1 - pos, 4)])
            if p['high']:
                out.append([p['high'], round(pos, 4)])
    return out


def macro_stack(m, cutoff=0.01):
    c = {k: _interp(k, m[k]) for k in ['gender', 'age', 'muscle', 'weight', 'proportions', 'height']}
    t = []
    for race, rw in m['race'].items():
        if rw > 1e-4:
            for a in c['age']:
                for g in c['gender']:
                    w = rw * g[1] * a[1]
                    if w > cutoff:
                        t.append([f'macrodetails/{race}-{g[0]}-{a[0]}', w])
    for g in c['gender']:
        for a in c['age']:
            for mu in c['muscle']:
                for we in c['weight']:
                    w = g[1] * a[1] * mu[1] * we[1]
                    if w > cutoff:
                        t.append([f'macrodetails/universal-{g[0]}-{a[0]}-{mu[0]}-{we[0]}', w])
                    for h in c['height']:
                        wh = w * h[1]
                        if wh > cutoff:
                            t.append([f'macrodetails/height/{g[0]}-{a[0]}-{mu[0]}-{we[0]}-{h[0]}', wh])
                    for p in c['proportions']:
                        wp = w * p[1]
                        if wp > cutoff and '-baby-' not in f'-{a[0]}-':
                            t.append([f'macrodetails/proportions/{g[0]}-{a[0]}-{mu[0]}-{we[0]}-{p[0]}', wp])
    return t


def detail_stack(details):
    """details: {'nose/nose-hump': 0.3, 'eyes/l-eye-bag': -0.2, 'head/head-oval': 0.4}
    bipolar names get -incr/-decr (or the pair given explicitly as 'a|b'); unipolar names are used as-is."""
    out = []
    for k, v in details.items():
        if abs(v) < 1e-4:
            continue
        folder, name = k.split('/')
        base = os.path.join(MH, 'targets', folder)
        if '|' in name:
            neg, pos = name.split('|')
            out.append([f'{folder}/{pos if v > 0 else neg}', abs(v)])
        elif os.path.exists(os.path.join(base, name + '.target.gz')):
            out.append([k, v])
        else:
            for a, b in (('-decr', '-incr'), ('-down', '-up'), ('-in', '-out'), ('-backward', '-forward'), ('-concave', '-convex'),
                         ('-compress', '-uncompress')):
                if os.path.exists(os.path.join(base, f'{name}{b}.target.gz')):
                    out.append([f'{folder}/{name}{b if v > 0 else a}', abs(v)])
                    break
            else:
                raise FileNotFoundError(k)
    return out


def shaped_vertices(obj_data, macro, details):
    V = obj_data['V'].copy()
    applied = []
    for rel, w in macro_stack(macro) + detail_stack(details):
        idx, d = read_target(rel)
        if len(idx):
            V[idx] += d * w
        applied.append((rel, round(w, 4)))
    return V, applied


# ------------------------------------------------------------------ Blender objects
def build_mesh(name, obj_data, Vmh):
    me = bpy.data.meshes.new(name)
    Vb = conv(Vmh)
    me.from_pydata(Vb.tolist(), [], obj_data['F'])
    uv = me.uv_layers.new(name='UVMap')
    VT = obj_data['VT']
    flat = np.array([VT[i] for f in obj_data['FVT'] for i in f], dtype=np.float32).ravel()
    uv.data.foreach_set('uv', flat)
    me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    # one vertex group per OBJ group
    F, FG = obj_data['F'], obj_data['FG']
    for gi, g in enumerate(obj_data['groups']):
        vs = sorted({v for fi in np.where(FG == gi)[0] for v in F[fi]})
        vg = ob.vertex_groups.new(name='grp:' + g)
        vg.add(vs, 1.0, 'REPLACE')
    return ob


def group_verts(obj_data, gname):
    gi = obj_data['groups'].index(gname)
    F, FG = obj_data['F'], obj_data['FG']
    return sorted({v for fi in np.where(FG == gi)[0] for v in F[fi]})


def add_expression_keys(ob, race_weights, units):
    """Shape keys from expression units (relative), race-blended."""
    if not ob.data.shape_keys:
        ob.shape_key_add(name='Basis', from_mix=False)
    n = len(ob.data.vertices)
    base = np.empty(n * 3)
    ob.data.vertices.foreach_get('co', base)
    base = base.reshape(-1, 3)
    for u in units:
        D = np.zeros((n, 3))
        for race, rw in race_weights.items():
            if rw <= 0:
                continue
            idx, d = read_target(f'expression/units/{race}/{u}')
            if not len(idx):
                continue
            ok = idx < n
            D[idx[ok]] += conv(d[ok]) * rw
        k = ob.shape_key_add(name=u, from_mix=False)
        k.data.foreach_set('co', (base + D).ravel())
        k.value = 0.0


def joint_positions(Vb, obj_data):
    cubes = {g: Vb[group_verts(obj_data, g)].mean(0) for g in obj_data['groups'] if g.startswith('joint-')}
    return cubes


def build_rig(name, Vb, obj_data, rig_file='rig.default.json'):
    rig = json.load(open(os.path.join(MH, 'rigs', 'standard', rig_file)))
    cubes = joint_positions(Vb, obj_data)

    def pos(spec):
        s = spec['strategy']
        if s == 'CUBE':
            return Vector(cubes[spec['cube_name']])
        if s == 'VERTEX':
            return Vector(Vb[spec['vertex_index']])
        if s == 'MEAN':
            return Vector(Vb[spec['vertex_indices']].mean(0))
        raise ValueError(s)

    arm = bpy.data.armatures.new(name)
    ao = bpy.data.objects.new(name, arm)
    bpy.context.scene.collection.objects.link(ao)
    bpy.context.view_layer.objects.active = ao
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.edit_bones
    for bn, b in rig.items():
        e = eb.new(bn)
        e.head = pos(b['head'])
        e.tail = pos(b['tail'])
        if (e.tail - e.head).length < 1e-4:
            e.tail = e.head + Vector((0, 0, 0.01))
        e.roll = b.get('roll', 0.0)
    for bn, b in rig.items():
        if b.get('parent'):
            eb[bn].parent = eb[b['parent']]
            eb[bn].use_connect = bool(b.get('use_connect')) and (eb[bn].head - eb[b['parent']].tail).length < 1e-4
    bpy.ops.object.mode_set(mode='OBJECT')
    arm.display_type = 'OCTAHEDRAL'
    return ao, list(rig.keys())


def apply_weights(ob, weight_file='weights.default.json'):
    w = json.load(open(os.path.join(MH, 'rigs', 'standard', weight_file)))
    w = w.get('weights', w)
    for bone, pairs in w.items():
        vg = ob.vertex_groups.get(bone) or ob.vertex_groups.new(name=bone)
        for vi, wt in pairs:
            vg.add([vi], wt, 'REPLACE')
    return len(w)


def delete_verts_not_in(ob, keep_groups):
    """Delete every vertex that isn't in one of keep_groups (helpers, joint cubes)."""
    import bmesh
    keep = set()
    for g in keep_groups:
        vg = ob.vertex_groups[g]
        for v in ob.data.vertices:
            for ge in v.groups:
                if ge.group == vg.index and ge.weight > 0:
                    keep.add(v.index)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in keep], context='VERTS')
    bm.to_mesh(ob.data)
    bm.free()
