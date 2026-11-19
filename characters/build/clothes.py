"""Garments built from the body itself (rest A-pose), then skinned with the body's own weights.

Pipeline per garment: pick body faces by bone weights + cut planes → copy (keeps UVs and the
vertex→body mapping) → ease along normals → Taubin smoothing (fabric has no muscle detail) →
push out of the body by a minimum gap → extra parametric parts (skirt, lapels, collars, tie,
pockets, insignia, cap) → weights copied from the body → Armature + Solidify + Subdivision.
"""
import math, os
import bpy, bmesh
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

import look
from look import L, N, img, new_mat, obj_coords, principled

TEX = look.TEX
TORSO = ['root', 'spine01', 'spine02', 'spine03', 'spine04', 'spine05', 'pelvis.L', 'pelvis.R', 'clavicle.L', 'clavicle.R',
         'shoulder01.L', 'shoulder01.R', 'breast.L', 'breast.R']
ARMS = [f'{b}.{s}' for b in ('upperarm01', 'upperarm02', 'lowerarm01', 'lowerarm02') for s in 'LR']
LEGS = [f'{b}.{s}' for b in ('upperleg01', 'upperleg02', 'lowerleg01', 'lowerleg02') for s in 'LR']
NECK = ['neck01', 'neck02', 'neck03', 'head', 'jaw']


# =================================================================== body data
class Body:
    def __init__(self, body, rig):
        self.ob, self.rig = body, rig
        me = body.data
        self.V = np.array([v.co[:] for v in me.vertices])
        self.names = [g.name for g in body.vertex_groups]
        self.W = np.zeros((len(self.V), len(self.names)), np.float32)
        for v in me.vertices:
            for g in v.groups:
                self.W[v.index, g.group] = g.weight
        self.F = [list(p.vertices) for p in me.polygons]
        self.bvh = BVHTree.FromPolygons([Vector(v) for v in self.V], self.F)
        self.J = {b.name: (np.array(b.head_local), np.array(b.tail_local)) for b in rig.data.bones}
        hand = [n for n in self.names if n.startswith(('wrist', 'metacarpal', 'finger'))]
        foot = [n for n in self.names if n.startswith(('foot', 'toe'))]
        self.hand_w, self.foot_w = self.wsum(hand), self.wsum(foot)
        self.arm_w, self.neck_w = self.wsum(ARMS), self.wsum(NECK + [n for n in self.names if n not in TORSO + ARMS + LEGS + hand + foot])
        # faces that are not arm/hand: torso-worn parts take their weights only from these
        limb = self.arm_w + self.hand_w
        self.Ft = [i for i, f in enumerate(self.F) if max(limb[v] for v in f) < 0.25]
        self.bvh_t = BVHTree.FromPolygons([Vector(v) for v in self.V], [self.F[i] for i in self.Ft])
        V = self.V
        c = np.abs(V[:, 0]) < 0.012
        self.crotch_z = V[c & (V[:, 2] > self.h('lowerleg01.L')[2] + 0.1) & (V[:, 2] < self.h('upperleg01.L')[2])][:, 2].min()

    def h(self, b):
        return self.J[b][0]

    def wsum(self, bones):
        idx = [self.names.index(b) for b in bones if b in self.names]
        return self.W[:, idx].sum(1) if idx else np.zeros(len(self.V))

    def front_y(self, x, z):
        hit = self.bvh.ray_cast(Vector((x, -0.6, z)), Vector((0, 1, 0)), 2.0)
        return hit


# =================================================================== mesh helpers
def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob


def extract(B, name, faces_idx):
    me0 = B.ob.data
    used = sorted({v for f in faces_idx for v in B.F[f]})
    remap = {v: i for i, v in enumerate(used)}
    me = bpy.data.meshes.new(name)
    me.from_pydata(B.V[used].tolist(), [], [[remap[v] for v in B.F[f]] for f in faces_idx])
    src = me0.uv_layers['UVMap'].data
    uvs = []
    for f in faces_idx:
        p = me0.polygons[f]
        for li in range(p.loop_start, p.loop_start + p.loop_total):
            uvs.extend(src[li].uv)
    me.uv_layers.new(name='UVMap').data.foreach_set('uv', uvs)
    me.shade_smooth()
    ob = link(bpy.data.objects.new(name, me))
    return ob, np.array(used)


def mesh_arrays(ob):
    me = ob.data
    V = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get('co', V)
    E = np.empty(len(me.edges) * 2, dtype=np.int64)
    me.edges.foreach_get('vertices', E)
    return V.reshape(-1, 3), E.reshape(-1, 2)


def set_verts(ob, V):
    ob.data.vertices.foreach_set('co', np.asarray(V, dtype=np.float32).ravel())
    ob.data.update()


def vnormals(ob):
    me = ob.data
    me.update()
    N_ = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get('normal', N_)
    return N_.reshape(-1, 3)


def boundary(ob):
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    b = np.zeros(len(bm.verts), bool)
    be = []
    for e in bm.edges:
        if e.is_boundary:
            b[e.verts[0].index] = b[e.verts[1].index] = True
            be.append((e.verts[0].index, e.verts[1].index))
    bm.free()
    return b, np.array(be, dtype=np.int64).reshape(-1, 2)


def taubin(V, E, iters, lam=0.5, mu=-0.53, weight=None, bnd=None, bnd_edges=None, fixed=None):
    n = len(V)
    V = V.copy()
    deg = np.bincount(E.ravel(), minlength=n).astype(float)
    if bnd is not None and len(bnd_edges):
        bdeg = np.bincount(bnd_edges.ravel(), minlength=n).astype(float)
    for _ in range(iters):
        for f in (lam, mu):
            S = np.zeros_like(V)
            np.add.at(S, E[:, 0], V[E[:, 1]])
            np.add.at(S, E[:, 1], V[E[:, 0]])
            D = S / np.maximum(deg, 1)[:, None] - V
            if bnd is not None and len(bnd_edges):
                Sb = np.zeros_like(V)
                np.add.at(Sb, bnd_edges[:, 0], V[bnd_edges[:, 1]])
                np.add.at(Sb, bnd_edges[:, 1], V[bnd_edges[:, 0]])
                Db = Sb / np.maximum(bdeg, 1)[:, None] - V
                D[bnd] = Db[bnd]
            if weight is not None:
                D *= weight[:, None]
            if fixed is not None:
                D[fixed] = 0
            V += D * f
    return V


def push_out(V, bvh, gap):
    V = V.copy()
    for i, v in enumerate(V):
        loc, nrm, _, _ = bvh.find_nearest(Vector(v))
        if loc is None:
            continue
        d = (Vector(v) - loc).dot(nrm)
        if d < gap:
            V[i] = loc + nrm * gap
    return V


def fit(ob, B, ease, smooth_iters=24, gap=0.005, bvh=None, keep_boundary=False):
    """Ease along normals, smooth away anatomy, then keep at least `gap` outside `bvh` (default: body)."""
    V, E = mesh_arrays(ob)
    Nn = vnormals(ob)
    V = V + Nn * np.asarray(ease).reshape(-1, 1) if np.ndim(ease) else V + Nn * ease
    bnd, be = boundary(ob)
    V = taubin(V, E, smooth_iters, bnd=bnd, bnd_edges=be, fixed=bnd if keep_boundary else None)
    V = push_out(V, bvh or B.bvh, gap)
    V = taubin(V, E, 3, bnd=bnd, bnd_edges=be)
    V = push_out(V, bvh or B.bvh, gap * 0.8)
    set_verts(ob, V)
    return V


def bvh_of(ob):
    V, _ = mesh_arrays(ob)
    return BVHTree.FromPolygons([Vector(v) for v in V], [list(p.vertices) for p in ob.data.polygons])


def ribbon(name, rows, outward=None, uv=True):
    nR, nC = len(rows), len(rows[0])
    verts = [tuple(p) for r in rows for p in r]
    faces = [(i * nC + j, i * nC + j + 1, (i + 1) * nC + j + 1, (i + 1) * nC + j) for i in range(nR - 1) for j in range(nC - 1)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    if uv:
        uvs = []
        for i in range(nR - 1):
            for j in range(nC - 1):
                for (a, b) in ((i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j)):
                    uvs.extend((b / (nC - 1), a / (nR - 1)))
        me.uv_layers.new(name='UVMap').data.foreach_set('uv', uvs)
    me.shade_smooth()
    ob = link(bpy.data.objects.new(name, me))
    if outward is not None:
        me.update()
        c = np.mean([f.center[:] for f in me.polygons], 0)
        nn = np.mean([f.normal[:] for f in me.polygons], 0)
        if np.dot(nn, np.asarray(outward)) < 0:
            me.flip_normals()
    return ob


def cast(bvh, origin, direction, dist=2.0):
    hit = bvh.ray_cast(Vector(origin), Vector(direction).normalized(), dist)
    return (hit[0], hit[1]) if hit[0] is not None else (None, None)


# =================================================================== weights + modifiers
def weights_mapped(B, used):
    return B.W[used]


def weights_nearest(B, P, torso_only=True):
    out = np.zeros((len(P), len(B.names)), np.float32)
    tree = B.bvh_t if torso_only else B.bvh
    for i, p in enumerate(P):
        loc, _, fi, _ = tree.find_nearest(Vector(p))
        vs = B.F[B.Ft[fi]] if torso_only else B.F[fi]
        d = np.linalg.norm(B.V[vs] - np.asarray(loc), axis=1)
        w = 1 / (d + 1e-4) ** 2
        out[i] = (B.W[vs] * w[:, None]).sum(0) / w.sum()
    return out


def assign(ob, B, Wv, max_inf=4):
    for g in list(ob.vertex_groups):
        ob.vertex_groups.remove(g)
    groups = {}
    for i, row in enumerate(Wv):
        top = np.argsort(row)[::-1][:max_inf]
        top = [t for t in top if row[t] > 0.005]
        s = sum(row[t] for t in top) or 1.0
        for t in top:
            nm = B.names[t]
            vg = groups.get(nm) or ob.vertex_groups.get(nm) or ob.vertex_groups.new(name=nm)
            groups[nm] = vg
            vg.add([i], float(row[t] / s), 'REPLACE')


def mapped_plus_nearest(ob, B, used):
    V, _ = mesh_arrays(ob)
    n = len(used)
    W = B.W[used]
    return np.vstack([W, weights_nearest(B, V[n:])]) if len(V) > n else W


def finish(ob, B, Wv=None, thickness=0.0025, sub=1, mat=None, rigid=None):
    V, _ = mesh_arrays(ob)
    if rigid:
        Wv = np.zeros((len(V), len(B.names)), np.float32)
        Wv[:, B.names.index(rigid)] = 1
    elif Wv is None:
        Wv = weights_nearest(B, V)
    assign(ob, B, Wv)
    ob.parent = B.rig
    md = ob.modifiers.new('Armature', 'ARMATURE')
    md.object = B.rig
    if thickness:
        s = ob.modifiers.new('Solidify', 'SOLIDIFY')
        s.thickness = thickness
        s.offset = -1
        s.use_even_offset = False
        s.use_quality_normals = True
    if sub:
        ss = ob.modifiers.new('Subdivision', 'SUBSURF')
        ss.levels, ss.render_levels = 1, sub
    if mat:
        ob.data.materials.append(mat)
    return ob


# =================================================================== materials
def fabric(name, tex, tile_m, tint=(1, 1, 1), rough=0.75, sheen=0.35, bump=0.18, normal_tex=True):
    m, nt = new_mat(name)
    b = principled(nt)
    vec, _ = obj_coords(nt, 1.0 / tile_m, (-900, 0))
    t = img(nt, os.path.join(TEX, tex + '.jpg'), 'sRGB', (-600, 150), box=True)
    L(nt, vec, t.inputs['Vector'])
    mx = N(nt, 'ShaderNodeMix', (-300, 200), data_type='RGBA', blend_type='MULTIPLY')
    mx.inputs['Factor'].default_value = 1.0
    L(nt, t.outputs['Color'], mx.inputs[6])
    mx.inputs[7].default_value = (*tint, 1)
    L(nt, mx.outputs[2], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    b.inputs['Sheen Weight'].default_value = sheen
    b.inputs['Sheen Roughness'].default_value = 0.4
    b.inputs['Specular IOR Level'].default_value = 0.35
    bw = N(nt, 'ShaderNodeRGBToBW', (-300, -150))
    L(nt, t.outputs['Color'], bw.inputs[0])
    bp = N(nt, 'ShaderNodeBump', (-100, -200))
    bp.inputs['Strength'].default_value = bump
    bp.inputs['Distance'].default_value = 0.0006
    L(nt, bw.outputs[0], bp.inputs['Height'])
    L(nt, bp.outputs['Normal'], b.inputs['Normal'])
    m['tex'] = tex
    m['tile_m'] = tile_m
    m['tint'] = list(tint)
    return m


def leather(name, tex, tint=(1, 1, 1), rough=0.32, coat=0.4, sole_band=0.0):
    m = fabric(name, tex, 0.12, tint, rough, 0.0, 0.25)
    nt = m.node_tree
    b = principled(nt)
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = 0.15
    b.inputs['Specular IOR Level'].default_value = 0.5
    if sole_band:  # darker, rougher rubber sole band near the floor (object Z)
        tc = N(nt, 'ShaderNodeTexCoord', (-900, -500))
        sep = N(nt, 'ShaderNodeSeparateXYZ', (-700, -500))
        L(nt, tc.outputs['Object'], sep.inputs[0])
        st = N(nt, 'ShaderNodeMath', (-500, -500), operation='LESS_THAN')
        L(nt, sep.outputs['Z'], st.inputs[0])
        st.inputs[1].default_value = sole_band
        mx = next(n for n in nt.nodes if n.type == 'MIX')
        mx2 = N(nt, 'ShaderNodeMix', (-100, 300), data_type='RGBA')
        L(nt, st.outputs[0], mx2.inputs['Factor'])
        L(nt, mx.outputs[2], mx2.inputs[6])
        mx2.inputs[7].default_value = (0.03, 0.025, 0.022, 1)
        L(nt, mx2.outputs[2], b.inputs['Base Color'])
        rr = N(nt, 'ShaderNodeMapRange', (-300, -500))
        L(nt, st.outputs[0], rr.inputs['Value'])
        rr.inputs['To Min'].default_value = rough
        rr.inputs['To Max'].default_value = 0.8
        L(nt, rr.outputs['Result'], b.inputs['Roughness'])
    return m


def metal(name, col=(0.83, 0.62, 0.28), rough=0.28):
    m, nt = new_mat(name)
    b = principled(nt)
    b.inputs['Base Color'].default_value = (*col, 1)
    b.inputs['Metallic'].default_value = 1.0
    b.inputs['Roughness'].default_value = rough
    return m


def decal(name, tex_file, rough=0.55, metallic_from_luma=0.0, alpha=True):
    m, nt = new_mat(name)
    b = principled(nt)
    t = img(nt, os.path.join(TEX, tex_file), 'sRGB', (-500, 100), extension='CLIP')
    uv = N(nt, 'ShaderNodeUVMap', (-750, 100), uv_map='UVMap')
    L(nt, uv.outputs['UV'], t.inputs['Vector'])
    L(nt, t.outputs['Color'], b.inputs['Base Color'])
    if alpha and tex_file.endswith('.png'):
        L(nt, t.outputs['Alpha'], b.inputs['Alpha'])
    b.inputs['Roughness'].default_value = rough
    if metallic_from_luma:   # gold embroidery reads as metal
        hsv = N(nt, 'ShaderNodeSeparateColor', (-250, -150), mode='HSV')
        L(nt, t.outputs['Color'], hsv.inputs[0])
        mr = N(nt, 'ShaderNodeMapRange', (-50, -150))
        L(nt, hsv.outputs[1], mr.inputs['Value'])
        mr.inputs['From Min'].default_value = 0.35
        mr.inputs['From Max'].default_value = 0.7
        mr.inputs['To Max'].default_value = metallic_from_luma
        L(nt, mr.outputs['Result'], b.inputs['Metallic'])
    m['decal'] = tex_file
    return m


# =================================================================== garment builders
def face_select(B, vmask, extra=None):
    fm = [all(vmask[v] for v in f) for f in B.F]
    if extra is not None:
        fm = [a and extra(fi) for fi, a in enumerate(fm)]
    return [i for i, a in enumerate(fm) if a]


def sleeve_mask(B, cut_back=0.018):
    """True for verts that are not past the cuff line (cut_back m above the wrist joint, along the forearm)."""
    ok = np.ones(len(B.V), bool)
    for s in 'LR':
        e, w = B.h(f'lowerarm01.{s}'), B.h(f'wrist.{s}')
        ax = (w - e) / np.linalg.norm(w - e)
        t = (B.V - e) @ ax
        side = np.sign(B.V[:, 0]) == (1 if s == 'L' else -1)
        ok &= ~(side & (t > np.linalg.norm(w - e) - cut_back) & (B.arm_w + B.hand_w > 0.3))
    return ok


def front_opening(B, z_button, z_top, w_top, w_hem, z_hem):
    def width(z):
        if z >= z_button:
            return w_top * min(1.0, (z - z_button) / max(1e-3, z_top - z_button)) ** 1.05
        return w_hem * ((z_button - z) / max(1e-3, z_button - z_hem)) ** 2.0 if w_hem > 0 else 0.0
    return width


def coat(B, name, mat, z_hem, z_button, z_top, w_top, w_hem, ease=0.017, arm_ease=0.013, skirt=0.07, gap=0.007, sleeve_back=0.018):
    """Tailored jacket: torso + sleeves, front V opening (and cutaway below the button), skirt below the seat."""
    V = B.V
    vm = (B.wsum(TORSO + ARMS + LEGS) > 0.3) & (V[:, 2] >= z_hem) & (B.neck_w < 0.62) & (B.hand_w < 0.05) & sleeve_mask(B, sleeve_back)
    width = front_opening(B, z_button, z_top, w_top, w_hem, z_hem)

    def keep(fi):
        c = B.V[B.F[fi]].mean(0)
        return not (c[1] < -0.02 and abs(c[0]) < width(c[2]) and abs(c[0]) < 0.17)
    faces = face_select(B, vm, keep)
    ob, used = extract(B, name, faces)
    armness = B.arm_w[used]
    P = fit(ob, B, ease * (1 - armness) + arm_ease * armness, 50, gap)
    # shoulder pads: square the shoulder line a little
    for s, sg in (('L', 1), ('R', -1)):
        sh = B.h(f'upperarm01.{s}')
        d = np.linalg.norm((P - (sh + np.array([-sg * 0.03, 0.0, 0.035]))) * np.array([1.0, 1.4, 1.0]), axis=1)
        f = np.clip(1 - d / 0.085, 0, 1) ** 2
        P[:, 2] += f * 0.005
        P[:, 0] += f * sg * 0.002
    _, E = mesh_arrays(ob)
    bnd, be = boundary(ob)
    P = taubin(P, E, 4, bnd=bnd, bnd_edges=be)
    set_verts(ob, push_out(P, B.bvh, gap))
    # skirt: extrude the bottom hem straight down with a little flare
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.verts.ensure_lookup_table()
    nu = len(used)
    hem = [e for e in bm.edges if e.is_boundary and all(v.co.z < z_hem + 0.02 and v.index < nu and armness[v.index] < 0.2 for v in e.verts)]
    new_rows = []
    for k in range(2):
        r = bmesh.ops.extrude_edge_only(bm, edges=hem)
        nv = [g for g in r['geom'] if isinstance(g, bmesh.types.BMVert)]
        for v in nv:
            rad = Vector((v.co.x, v.co.y - 0.0, 0))
            v.co.z -= skirt / 2
            v.co += rad.normalized() * 0.006 if rad.length > 1e-6 else Vector()
        hem = [g for g in r['geom'] if isinstance(g, bmesh.types.BMEdge) and g.is_boundary and all(v in nv for v in g.verts)]
        new_rows.append(nv)
    bm.to_mesh(ob.data)
    bm.free()
    ob.data.update()
    # the back hangs straight from the shoulder blades over the seat (no lumbar dip, no seat hugging)
    P, E = mesh_arrays(ob)
    back = P[:, 1] > 0.0
    z_top = z_button + 0.12
    xb = np.round(P[:, 0] / 0.02).astype(int)
    zb = np.round(P[:, 2] / 0.01).astype(int)
    env = {}
    for i in np.where(back & (P[:, 2] < z_top + 0.1))[0]:
        k = (xb[i], zb[i])
        env[k] = max(env.get(k, -1), P[i, 1])
    for x in set(k[0] for k in env):
        run = -1.0
        for z in sorted((k[1] for k in env if k[0] == x), reverse=True):
            run = max(run, env[(x, z)])
            env[(x, z)] = run
    for i in np.where(back & (P[:, 2] < z_top))[0]:
        t = env.get((xb[i], zb[i]))
        if t is not None and t > P[i, 1]:
            side = min(1.0, max(0.0, (0.2 - abs(P[i, 0])) / 0.06))
            P[i, 1] += (t - P[i, 1]) * side
    bnd, be = boundary(ob)
    P = taubin(P, E, 25, bnd=bnd, bnd_edges=be)
    P = push_out(P, B.bvh, gap)
    set_verts(ob, P)
    return ob, used, width


def trousers(B, name, mat, z_waist, ease=0.022, straight=0.072, gap=0.008, hem_z=0.035):
    V = B.V
    vm = (V[:, 2] <= z_waist) & (B.foot_w < 0.35) & (B.hand_w < 0.01) & (B.arm_w < 0.05) & (V[:, 2] > 0.055)
    faces = face_select(B, vm)
    ob, used = extract(B, name, faces)
    P, E = mesh_arrays(ob)
    Nn = vnormals(ob)
    P = P + Nn * ease
    # straight trouser legs below the knee: radius never under `straight`
    for s, sg in (('L', 1), ('R', -1)):
        k, a = B.h(f'lowerleg01.{s}'), B.h(f'foot.{s}')
        sel = (np.sign(P[:, 0]) == sg) & (P[:, 2] < k[2] + 0.06)
        for i in np.where(sel)[0]:
            t = np.clip((P[i, 2] - a[2]) / (k[2] - a[2]), 0, 1)
            c = a + (k - a) * t
            r = P[i, :2] - c[:2]
            n = np.linalg.norm(r)
            R = straight * (1 - 0.06 * t) if P[i, 2] < k[2] else max(n, straight)
            blend = np.clip((k[2] + 0.06 - P[i, 2]) / 0.12, 0, 1)
            P[i, :2] = c[:2] + r / max(n, 1e-6) * (n + (max(n, R) - n) * blend)
    # fill the cleft between the legs at the fly (front) and the seat (back): trousers bridge it
    cz = B.crotch_z
    for i in np.where((np.abs(P[:, 0]) < 0.07) & (P[:, 2] > cz - 0.07) & (P[:, 2] < cz + 0.09))[0]:
        z = P[i, 2]
        sl = (np.abs(P[:, 2] - z) < 0.012) & (np.abs(P[:, 0]) > 0.055) & (np.abs(P[:, 0]) < 0.08)
        if not sl.any():
            continue
        front = P[i, 1] < 0.0
        ref = P[sl & ((P[:, 1] < 0) == front), 1]
        if not len(ref):
            continue
        target = ref.min() if front else ref.max()
        w = (1 - abs(P[i, 0]) / 0.07) * min(1.0, (z - (cz - 0.07)) / 0.05)
        if (front and P[i, 1] > target) or (not front and P[i, 1] < target):
            P[i, 1] += (target - P[i, 1]) * w
    bnd, be = boundary(ob)
    P = taubin(P, E, 30, bnd=bnd, bnd_edges=be)
    P = push_out(P, B.bvh, gap)
    set_verts(ob, P)
    # hem: drop the bottom rings onto the shoe with a small break
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    hem = [e for e in bm.edges if e.is_boundary and all(v.co.z < 0.2 for v in e.verts)]
    r = bmesh.ops.extrude_edge_only(bm, edges=hem)
    for v in [g for g in r['geom'] if isinstance(g, bmesh.types.BMVert)]:
        v.co.z = hem_z + max(0.0, v.co.y) * 0.25
        v.co.x *= 1.0
    bm.to_mesh(ob.data)
    bm.free()
    return ob, used


def shirt(B, name, z_low, sleeve_back=0.004, ease=0.004, gap=0.0035):
    V = B.V
    vm = (B.wsum(TORSO + ARMS + LEGS) > 0.25) & (V[:, 2] >= z_low) & (B.neck_w < 0.8) & (B.hand_w < 0.08) & sleeve_mask(B, sleeve_back)
    ob, used = extract(B, name, face_select(B, vm))
    fit(ob, B, ease, 8, gap)
    return ob, used


def shoe_last(B, name, side, ease=0.006):
    """Classic dress shoe on a parametric last fitted to the foot: superellipse cross-sections along
    the heel→toe axis, instep height profile, rounded toe; plus a slightly wider sole with a heel."""
    sg = 1 if side == 'L' else -1
    V = B.V
    F = V[(B.foot_w > 0.3) & (V[:, 2] < B.h(f'foot.{side}')[2] + 0.03) & (np.sign(V[:, 0]) == sg)]
    heel = F[np.argmax(F[:, 1])]
    toe = F[np.argmin(F[:, 1])]
    ax = np.array([toe[0] - heel[0], toe[1] - heel[1], 0.0])
    Lf = np.linalg.norm(ax)
    ax /= Lf
    lat = np.array([-ax[1], ax[0], 0.0])           # sideways
    # foot half-widths along the axis (measured), then shoe = foot + ease, toe box extended
    s_f = (F[:, :2] - heel[:2]) @ ax[:2] / Lf
    wid = []
    for t in np.linspace(0, 1, 11):
        sel = np.abs(s_f - t) < 0.06
        wid.append(np.abs((F[sel, :2] - heel[:2]) @ lat[:2]).max() if sel.any() else 0.03)
    L = Lf + 0.03
    def half_w(t):          # t along the shoe 0 heel … 1 toe tip
        tf = min(1.0, t * L / Lf)
        w = np.interp(tf, np.linspace(0, 1, 11), wid) + ease
        if t > 0.58:
            w *= math.sqrt(max(0.0, 1 - ((t - 0.58) / 0.42) ** 2.2)) * 0.96
        return max(w, 0.003)
    def height(t):
        if t < 0.35:
            return 0.082 - 0.01 * t
        if t < 0.72:
            return 0.0785 - (t - 0.35) / 0.37 * 0.036
        return 0.006 + 0.0365 * math.sqrt(max(0.0, 1 - ((t - 0.72) / 0.28) ** 2))
    ns, na = 34, 28
    rows = []
    heel_c = np.array([heel[0], heel[1], 0.0]) - ax * 0.012
    for i in range(ns):
        t = (i / (ns - 1)) ** 0.9
        c = heel_c + ax * (t * L)
        w, h = half_w(t), height(t)
        row = []
        for j in range(na):
            a = math.pi * j / (na - 1)          # 0 = outer side at the sole … pi = inner side
            x = math.cos(a)
            z = math.sin(a)
            e = 2.25
            xx = np.sign(x) * abs(x) ** (2 / e) * w
            zz = abs(z) ** (2 / e) * h
            row.append(Vector(c + lat * xx + np.array([0, 0, 0.012 + zz * (1 - 0.012 / max(h, 0.013))])))
        rows.append(row)
    up = ribbon(name, rows, outward=None)
    # close the toe and the heel with fans, flip if needed
    P, E = mesh_arrays(up)
    P = taubin(P, E, 3)
    set_verts(up, P)
    me = up.data
    me.update()
    cen = np.array(F.mean(0))
    flip = sum(np.dot(np.array(p.normal), np.array(p.center) - cen) for p in me.polygons) < 0
    if flip:
        me.flip_normals()
    # sole + heel block (outline a little wider than the upper)
    srows_top, srows_bot = [], []
    for i in range(ns):
        t = (i / (ns - 1)) ** 0.9
        c = heel_c + ax * (t * L)
        w = half_w(t) + 0.004
        hz = 0.026 if t < 0.24 else 0.012
        srows_top.append([Vector(c - lat * w + np.array([0, 0, hz])), Vector(c + lat * w + np.array([0, 0, hz]))])
        srows_bot.append([Vector(c - lat * w), Vector(c + lat * w)])
    sole = ribbon(name + '_sole_top', srows_top)
    bm = bmesh.new()
    bm.from_mesh(sole.data)
    bm.verts.ensure_lookup_table()
    top = list(bm.verts)
    bot = [bm.verts.new(p) for r in srows_bot for p in r]
    for i in range(ns - 1):
        for (a0, a1) in ((0, 0), (1, 1)):
            q = [top[i * 2 + a0], top[(i + 1) * 2 + a0], bot[(i + 1) * 2 + a1], bot[i * 2 + a1]]
            bm.faces.new(q if a0 == 0 else list(reversed(q)))
        bm.faces.new([bot[i * 2], bot[(i + 1) * 2], bot[(i + 1) * 2 + 1], bot[i * 2 + 1]])
    bm.faces.new([top[0], top[1], bot[1], bot[0]])
    bm.faces.new([top[-1], top[-2], bot[-2], bot[-1]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(sole.data)
    bm.free()
    sole.name = sole.data.name = name + '_sole'
    return up, sole


def shoes(B, name, ease=0.007):
    V = B.V
    vm = (B.foot_w > 0.35) & (V[:, 2] < B.h('foot.L')[2] + 0.03)
    ob, used = extract(B, name, face_select(B, vm))
    P, E = mesh_arrays(ob)
    Nn = vnormals(ob)
    P = P + Nn * ease
    bnd, be = boundary(ob)
    P = taubin(P, E, 6, bnd=bnd, bnd_edges=be)
    for s, sg in (('L', 1), ('R', -1)):
        sel = np.sign(P[:, 0]) == sg
        toe_y = P[sel, 1].min()
        f = np.clip((toe_y + 0.07 - P[:, 1]) / 0.07, 0, 1) * sel
        P[:, 1] -= 0.014 * f                       # longer, rounded toe box
        P[:, 2] = np.where(sel & (P[:, 2] < 0.012), 0.0, P[:, 2])   # flat sole on the floor
        P[:, 2] += sel * np.clip((P[:, 1] - 0.0) / 0.06, 0, 1) * (P[:, 2] < 0.03) * 0.0
    P = push_out(P, B.bvh, 0.004)
    P[:, 2] = np.maximum(P[:, 2], 0.0)
    set_verts(ob, P)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.dissolve_degenerate(bm, dist=0.0008, edges=bm.edges)
    bm.to_mesh(ob.data)
    bm.free()
    used = used[:len(ob.data.vertices)]
    return ob, None


def neck_ring(B, z_front, z_back, theta, h):
    """Point around the neck: angle theta (0 = front, +90 = character's left), height h above the collar line."""
    zf = z_front + (z_back - z_front) * (1 - math.cos(theta)) / 2 + h
    n0, n1 = B.h('neck01'), B.h('head')
    t = np.clip((zf - n0[2]) / (n1[2] - n0[2]), 0, 1)
    ay = n0[1] + (n1[1] - n0[1]) * t
    d = Vector((math.sin(theta), -math.cos(theta), 0))
    o = Vector((0, ay, zf))
    loc, nrm = cast(B.bvh, o, d, 0.3)
    r = (loc - o).length if loc is not None else 0.06
    return o, d, r


def shirt_collar(B, name, z_front, z_back, gap_deg=13, height=(0.03, 0.036), off=0.0055):
    rows = [[], [], []]
    ths = np.radians(np.linspace(gap_deg, 360 - gap_deg, 61))
    for th in ths:
        hb = height[0] + (height[1] - height[0]) * (1 - math.cos(th)) / 2
        for k, (hh, extra) in enumerate(((0.0, 0.0), (hb * 0.6, 0.002), (hb, 0.004))):
            o, d, r = neck_ring(B, z_front, z_back, th, hh)
            rows[k].append(o + d * (r + off + extra))
    col = ribbon(name, rows, outward=None)
    # orient normals outward (away from the neck axis)
    me = col.data
    me.update()
    p = me.polygons[len(me.polygons) // 2]
    if (Vector(p.center) - Vector((0, p.center.y - 0.0, p.center.z))).dot(p.normal) < 0 and p.center.y > 0:
        me.flip_normals()
    # collar points (wings) lying on the chest under the tie knot
    wings = []
    for sg in (1, -1):
        th = math.radians(gap_deg) * sg
        o0, d0, r0 = neck_ring(B, z_front, z_back, th, 0.0)
        o1, d1, r1 = neck_ring(B, z_front, z_back, th, height[0])
        a = o0 + d0 * (r0 + off)
        b = o1 + d1 * (r1 + off + 0.004)
        tip_x = sg * 0.04
        loc, nrm = cast(B.bvh, (tip_x, -0.6, a.z - 0.042), (0, 1, 0))
        tip = loc + nrm * (off + 0.002) if loc is not None else a + Vector((tip_x, 0, -0.05))
        o2, d2, r2 = neck_ring(B, z_front, z_back, math.radians(gap_deg + 28) * sg, 0.0)
        side = o2 + d2 * (r2 + off + 0.002)
        rows_w = [[a, a.lerp(tip, 0.5), tip], [b, b.lerp(side, 0.5), side]]
        wings.append(ribbon(f'{name}_wing{sg}', rows_w))
    return col, wings


def jacket_collar(B, name, z_front, z_back, start_deg, off=0.02, fall=0.04):
    rows = [[], [], []]
    for th in np.radians(np.linspace(start_deg, 360 - start_deg, 57)):
        o, d, r = neck_ring(B, z_front, z_back, th, 0.0)
        top = o + d * (r + off)
        mid = o + d * (r + off + 0.008) + Vector((0, 0, -fall * 0.4))
        low = o + d * (r + off + 0.016) + Vector((0, 0, -fall * 0.85))
        rows[0].append(top)
        rows[1].append(mid)
        rows[2].append(low)
    return ribbon(name, rows)


def lapels(jbvh, name, width_fn, z_button, z_notch, lap_w, off=0.004, rows=22, cols=5):
    obs = []
    for sg in (1, -1):
        R = []
        for i in range(rows):
            t = i / (rows - 1)
            z = z_button + (z_notch - z_button) * t
            w0 = width_fn(z)
            lw = lap_w * (t ** 0.7) * (1 - 0.15 * t)
            row = []
            for j in range(cols):
                x = sg * (w0 + lw * j / (cols - 1))
                loc, nrm = cast(jbvh, (x, -0.6, z), (0, 1, 0))
                if loc is None:
                    loc, nrm = Vector((x, -0.12, z)), Vector((0, -1, 0))
                row.append(loc + nrm * off)
            R.append(row)
        obs.append(ribbon(f'{name}{"L" if sg > 0 else "R"}', R, outward=(0, -1, 0)))
    return obs


def patch(bvh, name, center_xz, size, off=0.003, n=(6, 6), direction=(0, 1, 0), origin_y=-0.6, flap_curve=0.0):
    """Rectangle projected onto a surface along `direction` (front by default)."""
    cx, cz = center_xz
    w, h = size
    R = []
    for i in range(n[1]):
        row = []
        for j in range(n[0]):
            x = cx - w / 2 + w * j / (n[0] - 1)
            z = cz - h / 2 + h * i / (n[1] - 1) - flap_curve * (1 - (2 * j / (n[0] - 1) - 1) ** 2) * (i == 0)
            loc, nrm = cast(bvh, (x, origin_y, z), direction)
            if loc is None:
                return None
            row.append(loc + nrm * off)
        R.append(row)
    return ribbon(name, R, outward=(0, -1, 0))


def top_patch(bvh, name, p0, p1, width, off=0.004, n=8):
    """Strip lying on top of the shoulders from p0 to p1 (projected down)."""
    p0, p1 = Vector(p0), Vector(p1)
    d = (p1 - p0)
    side = Vector((0, 1, 0)).cross(d).normalized() if False else Vector((-d.y, d.x, 0)).normalized()
    R = []
    for i in range(n):
        row = []
        t = i / (n - 1)
        for j in range(3):
            q = p0 + d * t + side * (width * (j / 2 - 0.5))
            loc, nrm = cast(bvh, (q.x, q.y, 2.2), (0, 0, -1))
            row.append(loc + nrm * off if loc is not None else q)
        R.append(row)
    return ribbon(name, R, outward=(0, 0, 1))


def button(name, loc, nrm, r=0.0085, mat=None):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=10, radius=r)
    for v in bm.verts:
        v.co.z *= 0.32
    bm.to_mesh(me)
    bm.free()
    me.shade_smooth()
    ob = link(bpy.data.objects.new(name, me))
    q = Vector((0, 0, 1)).rotation_difference(Vector(nrm))
    M = Matrix.Translation(Vector(loc) + Vector(nrm) * r * 0.3) @ q.to_matrix().to_4x4()
    me.transform(M)
    if mat:
        me.materials.append(mat)
    return ob


def tie(B, name, z_knot, z_tip, shirt_off=0.006):
    rows_c, rows_l, rows_r = [], [], []
    n = 26
    for i in range(n):
        t = i / (n - 1)
        z = z_knot - (z_knot - z_tip) * t
        loc, nrm = cast(B.bvh, (0, -0.6, z), (0, 1, 0))
        c = loc + nrm * (shirt_off + 0.004 + 0.004 * t)
        w = 0.022 + (0.044 - 0.022) * t ** 0.8
        if t > 0.93:
            w *= max(0.05, (1 - t) / 0.07)
        side = Vector((1, 0, 0))
        rows_l.append(c - side * w)
        rows_c.append(c + nrm * 0.002 + Vector((0, 0, -0.012 if t > 0.93 else 0)) * 0)
        rows_r.append(c + side * w)
    blade = ribbon(name, [rows_l, rows_c, rows_r], outward=(0, -1, 0))
    # knot: a small tapered block
    loc, nrm = cast(B.bvh, (0, -0.6, z_knot + 0.012), (0, 1, 0))
    k = loc + nrm * (shirt_off + 0.012)
    me = bpy.data.meshes.new(name + '_knot')
    bm = bmesh.new()
    top_w, bot_w, hgt, dep = 0.024, 0.016, 0.034, 0.012
    vs = [bm.verts.new(p) for p in [(-top_w, 0, hgt / 2), (top_w, 0, hgt / 2), (bot_w, 0, -hgt / 2), (-bot_w, 0, -hgt / 2),
                                    (-top_w, dep, hgt / 2), (top_w, dep, hgt / 2), (bot_w, dep, -hgt / 2), (-bot_w, dep, -hgt / 2)]]
    for f in ((0, 1, 2, 3), (5, 4, 7, 6), (4, 5, 1, 0), (3, 2, 6, 7), (4, 0, 3, 7), (1, 5, 6, 2)):
        bm.faces.new([vs[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    knot = link(bpy.data.objects.new(name + '_knot', me))
    me.transform(Matrix.Translation(k - Vector((0, 0.004, 0))))
    sub = knot.modifiers.new('Bevel', 'BEVEL')
    sub.width = 0.004
    sub.segments = 3
    return blade, knot


def belt_from(ob_src, name, z0, z1, off=0.004, allow=None):
    """Band copied from another garment between z0 and z1 (only vertices where allow[v] is True)."""
    V, _ = mesh_arrays(ob_src)
    me0 = ob_src.data
    keep = [p.index for p in me0.polygons if all(z0 <= V[v][2] <= z1 and (allow is None or allow[v]) for v in p.vertices)]
    used = sorted({v for f in keep for v in me0.polygons[f].vertices})
    remap = {v: i for i, v in enumerate(used)}
    Nn = vnormals(ob_src)
    me = bpy.data.meshes.new(name)
    me.from_pydata((V[used] + Nn[used] * off).tolist(), [], [[remap[v] for v in me0.polygons[f].vertices] for f in keep])
    me.shade_smooth()
    return link(bpy.data.objects.new(name, me))


def belt_ring(bvh, name, z, height=0.044, off=0.004, n=96, cy=0.0):
    """A closed belt: rays from outside toward the waist axis at 96 angles, two rows, welded seam."""
    rows = [[], []]
    for k in range(n + 1):
        th = 2 * math.pi * k / n
        d = Vector((math.sin(th), -math.cos(th), 0))
        for r, dz in ((0, -height / 2), (1, height / 2)):
            o = Vector((0, cy, z + dz)) + d * 0.6
            loc, nrm = cast(bvh, o, -d, 1.2)
            if loc is None:
                loc, nrm = Vector((0, cy, z + dz)) + d * 0.16, d
            rows[r].append(loc + nrm * off)
    ob = ribbon(name, rows)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(ob.data)
    bm.free()
    return ob


def buckle(name, loc, nrm, mat, w=0.06, h=0.045):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= w
        v.co.z *= h
        v.co.y *= 0.008
    bm.to_mesh(me)
    bm.free()
    ob = link(bpy.data.objects.new(name, me))
    q = Vector((0, -1, 0)).rotation_difference(Vector(nrm))
    me.transform(Matrix.Translation(Vector(loc) + Vector(nrm) * 0.006) @ q.to_matrix().to_4x4())
    bv = ob.modifiers.new('Bevel', 'BEVEL')
    bv.width = 0.003
    bv.segments = 2
    me.materials.append(mat)
    return ob


# =================================================================== the peaked cap
def peaked_cap(B, name, mats, lm):
    ec = Vector(lm['eyec'])
    z_band_front = ec.z + 0.052
    z_band_back = ec.z + 0.035
    head_c = Vector((0, ec.y + 0.085, 0))
    def head_r(th, z):
        d = Vector((math.sin(th), -math.cos(th), 0))
        o = Vector((0, head_c.y, z))
        loc, _ = cast(B.bvh, o + d * 0.3, -d, 0.6)
        return o, d, ((loc - o).length if loc is not None else 0.09)
    ths = np.radians(np.linspace(180, 540, 49))     # seam at the back
    band_rows, crown_rows = [[], []], [[], [], [], [], []]
    for th in ths:
        zb = z_band_back + (z_band_front - z_band_back) * (1 + math.cos(th)) / 2
        o, d, r = head_r(th, zb + 0.01)
        R = r + 0.012
        band_rows[0].append(Vector((o.x, o.y, zb)) + d * R)
        band_rows[1].append(Vector((o.x, o.y, zb + 0.042)) + d * (R + 0.002))
        # crown: flares out to an oval top that is wider and lifted at the front
        front = (1 + math.cos(th)) / 2
        crown_rows[0].append(Vector((o.x, o.y, zb + 0.042)) + d * (R + 0.002))
        crown_rows[1].append(Vector((o.x, o.y, zb + 0.056 + 0.008 * front)) + d * (R + 0.018 + 0.008 * front))
        crown_rows[2].append(Vector((o.x, o.y, zb + 0.068 + 0.018 * front)) + d * (R + 0.022 + 0.012 * front))
        crown_rows[3].append(Vector((o.x, o.y, zb + 0.073 + 0.017 * front)) + d * (R * 0.62))
        crown_rows[4].append(Vector((o.x, o.y, zb + 0.075 + 0.014 * front)) + d * (R * 0.3))
    band = ribbon(name + '_band', band_rows)
    crown = ribbon(name + '_crown', crown_rows)
    # crown top: close with a fan to the centre
    top_c = sum(crown_rows[4], Vector()) / len(crown_rows[4]) + Vector((0, 0, 0.002))
    me = crown.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    cvert = bm.verts.new(top_c)
    ring = bm.verts[-1 - len(crown_rows[4]): -1]
    for i in range(len(ring) - 1):
        bm.faces.new((ring[i], ring[i + 1], cvert))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    # visor: half disc at the front, sloping down
    vis_rows = [[], [], []]
    for th in np.radians(np.linspace(-78, 78, 25)):
        zb = z_band_front - 0.002 * abs(math.sin(th))
        o, d, r = head_r(th, zb + 0.01)
        R = r + 0.012
        base = Vector((o.x, o.y, zb + 0.004)) + d * R
        ext = 0.062 * math.cos(th) ** 0.7
        vis_rows[0].append(base)
        vis_rows[1].append(base + d * ext * 0.55 + Vector((0, 0, -0.012)))
        vis_rows[2].append(base + d * ext + Vector((0, 0, -0.026)))
    visor = ribbon(name + '_visor', vis_rows)
    # gold embroidery band along the visor edge
    emb_rows = [[p + Vector((0, 0, 0.0025)) for p in vis_rows[1]], [p + Vector((0, 0, 0.0025)) for p in vis_rows[2]]]
    emb = ribbon(name + '_visor_gold', emb_rows)
    # chin strap (gold cord) across the band front
    strap_rows = []
    for k in (0.0, 0.006):
        row = []
        for th in np.radians(np.linspace(-70, 70, 21)):
            zb = z_band_front - 0.0
            o, d, r = head_r(th, zb + 0.01)
            row.append(Vector((o.x, o.y, zb + 0.004 + k)) + d * (r + 0.0155))
        strap_rows.append(row)
    strap = ribbon(name + '_strap', strap_rows)
    # badge on the band front
    o, d, r = head_r(0.0, z_band_front + 0.02)
    bc = Vector((o.x, o.y, z_band_front + 0.03)) + d * (r + 0.0155)
    badge = ribbon(name + '_badge', [[bc + Vector((-0.03, 0, -0.03)), bc + Vector((0.03, 0, -0.03))],
                                     [bc + Vector((-0.03, -0.004, 0.03)), bc + Vector((0.03, -0.004, 0.03))]])
    parts = dict(band=band, crown=crown, visor=visor, gold=emb, strap=strap, badge=badge)
    for o in (band, crown):   # weld the 0°/360° seam
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        bm.to_mesh(o.data)
        bm.free()
    return parts


# =================================================================== outfits
def dress(spec):
    cid = spec['id']
    body = bpy.data.objects[f'{cid}_body']
    rig = bpy.data.objects[f'{cid}_rig']
    eyes = [bpy.data.objects[f'{cid}_eye.L'], bpy.data.objects[f'{cid}_eye.R']]
    B = Body(body, rig)
    lm = look.landmarks(body, eyes)
    cz = B.crotch_z
    neck_front = B.h('clavicle.L')[2] + 0.012
    neck_back = B.h('neck01')[2] + 0.005
    made = []
    if cid == 'president':
        suit = fabric('suit_navy', 'suit_wool', 0.05, (1.0, 1.0, 1.08), 0.7, 0.35, 0.15)
        shirt_m = fabric('shirt_white', 'shirt_cotton', 0.03, (0.97, 0.97, 1.0), 0.6, 0.2, 0.08)
        tie_m = fabric('tie_red', 'tie_silk', 0.07, (1, 1, 1), 0.38, 0.15, 0.06)
        shoe_m = leather('shoe_black', 'leather_black', (1, 1, 1), 0.34, 0.25, sole_band=0.011)
        belt_m = leather('belt_black', 'leather_black', (1, 1, 1), 0.35, 0.3)
        steel = metal('buckle_steel', (0.32, 0.31, 0.3), 0.3)
        z_button = B.h('spine04')[2] - 0.035
        z_waist = z_button - 0.02
        sh, used = shirt(B, f'{cid}_shirt', z_waist - 0.06)
        finish(sh, B, weights_mapped(B, used), 0.0015, 1, shirt_m)
        tr, used = trousers(B, f'{cid}_trousers', None, z_waist)
        finish(tr, B, mapped_plus_nearest(tr, B, used), 0.003, 1, suit)
        bl = belt_from(tr, f'{cid}_belt', z_waist - 0.036, z_waist + 0.01, 0.0035)
        finish(bl, B, None, 0.004, 1, belt_m)
        loc, nrm = cast(B.bvh, (0, -0.6, z_waist - 0.016), (0, 1, 0))
        finish(buckle(f'{cid}_buckle', loc + nrm * 0.024, nrm, steel, 0.038, 0.028), B, None, 0, 0)
        jk, used, width = coat(B, f'{cid}_jacket', suit, cz + 0.03, z_button, neck_front, 0.068, 0.07, ease=0.019, arm_ease=0.012)
        jb = bvh_of(jk)
        z_notch = neck_front - 0.07
        lap = lapels(jb, f'{cid}_lapel', width, z_button, z_notch, 0.072)
        col = jacket_collar(B, f'{cid}_jcollar', neck_front - 0.012, neck_back + 0.012, 38, 0.015, 0.036)
        scol, wings = shirt_collar(B, f'{cid}_scollar', neck_front, neck_back + 0.022)
        blade, knot = tie(B, f'{cid}_tie', neck_front + 0.004, z_waist - 0.012)
        finish(jk, B, mapped_plus_nearest(jk, B, used), 0.003, 2, suit)
        for o in lap + [col]:
            finish(o, B, None, 0.003, 2, suit)
        for o in [scol] + wings:
            finish(o, B, None, 0.0012, 2, shirt_m)
        finish(blade, B, None, 0.002, 2, tie_m)
        finish(knot, B, None, 0, 2, tie_m)
        # two jacket buttons + flag pin on the left lapel
        btn = look.flat_material('btn_horn', (0.018, 0.018, 0.022), 0.3)
        for z in (z_button, z_button - 0.105):
            loc, nrm = cast(jb, (0.0, -0.6, z), (0, 1, 0))
            if loc is not None:
                finish(button(f'{cid}_button', loc, nrm, 0.0095, btn), B, None, 0, 1)
        from PIL import Image
        flag_png = os.path.join(TEX, 'flag_pin.png')
        if not os.path.exists(flag_png):
            im = Image.new('RGB', (120, 64), (178, 34, 52))
            px = im.load()
            for y in range(64):
                for x in range(120):
                    if (y // 5) % 2 == 1:
                        px[x, y] = (245, 245, 245)
                    if x < 50 and y < 35:
                        px[x, y] = (60, 59, 110) if (x + y) % 7 else (240, 240, 240)
            im.save(flag_png)
        pin = patch(bvh_of(lap[0]), f'{cid}_flagpin', (width(z_notch - 0.03) + 0.04, z_notch - 0.03), (0.014, 0.009), 0.0045, (2, 2))
        if pin:
            finish(pin, B, None, 0.0015, 0, decal('flag_pin', 'flag_pin.png', 0.3, alpha=False))
        sole_m = leather('sole_dark', 'leather_black', (0.5, 0.45, 0.42), 0.6, 0.0)
        for s in 'LR':
            up, so = shoe_last(B, f'{cid}_shoe.{s}', s)
            finish(up, B, None, 0.002, 2, shoe_m)
            finish(so, B, None, 0, 1, sole_m)
    else:
        khaki = fabric('uniform_khaki', 'khaki_twill', 0.05, (0.92, 0.88, 0.8), 0.72, 0.3, 0.16)
        shirt_k = fabric('shirt_khaki', 'khaki_twill', 0.04, (1.02, 1.0, 0.94), 0.65, 0.2, 0.08)
        tie_k = fabric('tie_khaki', 'khaki_twill', 0.06, (0.55, 0.5, 0.38), 0.5, 0.2, 0.05)
        shoe_m = leather('shoe_black', 'leather_black', (1, 1, 1), 0.3, 0.3, sole_band=0.011)
        belt_m = leather('belt_brown', 'leather_brown', (1, 1, 1), 0.3, 0.5)
        brass = metal('brass', (0.86, 0.66, 0.3), 0.26)
        z_button = B.h('spine02')[2] + 0.01        # top of the four buttons (closed front below)
        z_waist = B.h('spine04')[2] - 0.06
        sh, used = shirt(B, f'{cid}_shirt', z_waist - 0.06)
        finish(sh, B, weights_mapped(B, used), 0.0015, 1, shirt_k)
        tr, used = trousers(B, f'{cid}_trousers', None, z_waist, ease=0.017)
        finish(tr, B, mapped_plus_nearest(tr, B, used), 0.003, 1, khaki)
        jk, used, width = coat(B, f'{cid}_jacket', khaki, cz + 0.03, z_button, neck_front, 0.062, 0.0, ease=0.021, arm_ease=0.013, skirt=0.08)
        jb = bvh_of(jk)
        z_notch = neck_front - 0.06
        lap = lapels(jb, f'{cid}_lapel', width, z_button, z_notch, 0.058)
        col = jacket_collar(B, f'{cid}_jcollar', neck_front - 0.012, neck_back + 0.012, 40, 0.015, 0.036)
        scol, wings = shirt_collar(B, f'{cid}_scollar', neck_front, neck_back + 0.022)
        blade, knot = tie(B, f'{cid}_tie', neck_front + 0.004, z_button - 0.06)
        # belt over the jacket at the waist
        Vj, _ = mesh_arrays(jk)
        torso_v = np.ones(len(Vj), bool)
        torso_v[:len(used)] = (B.arm_w[used] + B.hand_w[used]) < 0.2
        jb_torso = BVHTree.FromPolygons([Vector(v) for v in Vj], [list(p.vertices) for p in jk.data.polygons if all(torso_v[v] for v in p.vertices)])
        bl = belt_ring(jb_torso, f'{cid}_belt', z_waist, 0.046, 0.0045, cy=float(B.h('spine04')[1]))
        loc, nrm = cast(jb, (0, -0.6, z_waist), (0, 1, 0))
        bk = buckle(f'{cid}_buckle', loc + nrm * 0.004, nrm, brass, 0.055, 0.05)
        # pockets with flaps and buttons, ribbons, rank boards, collar tabs
        parts = []
        for sg in (1, -1):
            pk = patch(jb, f'{cid}_chestpocket', (sg * 0.088, z_button + 0.075), (0.105, 0.115), 0.0025, (6, 7))
            fl = patch(jb, f'{cid}_chestflap', (sg * 0.088, z_button + 0.133), (0.112, 0.042), 0.005, (6, 3), flap_curve=0.006)
            lp = patch(jb, f'{cid}_hippocket', (sg * 0.11, cz + 0.075), (0.14, 0.15), 0.0025, (6, 7))
            lf = patch(jb, f'{cid}_hipflap', (sg * 0.11, cz + 0.148), (0.148, 0.045), 0.005, (6, 3), flap_curve=0.006)
            parts += [p for p in (pk, fl, lp, lf) if p]
            for (x, z) in ((sg * 0.088, z_button + 0.13), (sg * 0.11, cz + 0.145)):
                l2, n2 = cast(jb, (x, -0.6, z), (0, 1, 0))
                if l2 is not None:
                    finish(button(f'{cid}_pbutton', l2 + n2 * 0.006, n2, 0.0068, brass), B, None, 0, 1)
            # rank board along the shoulder top (collar end → shoulder point)
            sh0 = B.h(f'clavicle.{"L" if sg > 0 else "R"}') + np.array([sg * 0.035, 0.01, 0])
            sh1 = B.h(f'upperarm01.{"L" if sg > 0 else "R"}') + np.array([-sg * 0.012, 0.0, 0])
            rb = top_patch(jb, f'{cid}_rank{sg}', sh1, sh0, 0.052, 0.005, 8)
            finish(rb, B, None, 0.003, 1, decal('rank_board', 'rank_board.png', 0.5, 0.9))
            # collar tab (gorget patch) on the upper lapel
            zt = z_notch + 0.05
            ct = patch(jb, f'{cid}_collartab{sg}', (sg * (width(zt) + 0.016), zt), (0.022, 0.055), 0.012, (2, 2))
            if ct:
                finish(ct, B, None, 0.0015, 0, decal('collar_tab', 'collar_tab.png', 0.55, 0.9))
        rib = patch(jb, f'{cid}_ribbons', (0.088, z_button + 0.178), (0.085, 0.034), 0.0045, (4, 2))
        if rib:
            finish(rib, B, None, 0.003, 0, decal('ribbons', 'ribbons.png', 0.6))
        for i in range(4):
            z = z_button - i * 0.095
            l2, n2 = cast(jb, (0.0, -0.6, z), (0, 1, 0))
            if l2 is not None:
                finish(button(f'{cid}_button', l2, n2, 0.0088, brass), B, None, 0, 1)
        finish(jk, B, mapped_plus_nearest(jk, B, used), 0.003, 2, khaki)
        for o in lap + [col] + parts:
            finish(o, B, None, 0.0025, 1, khaki)
        for o in [scol] + wings:
            finish(o, B, None, 0.0012, 2, shirt_k)
        finish(blade, B, None, 0.002, 2, tie_k)
        finish(knot, B, None, 0, 2, tie_k)
        finish(bl, B, None, 0.004, 1, belt_m)
        finish(bk, B, None, 0, 0)
        sole_m = leather('sole_dark', 'leather_black', (0.5, 0.45, 0.42), 0.6, 0.0)
        for s in 'LR':
            up, so = shoe_last(B, f'{cid}_shoe.{s}', s)
            finish(up, B, None, 0.002, 2, shoe_m)
            finish(so, B, None, 0, 1, sole_m)
        # peaked cap, rigid to the head bone
        capm = fabric('cap_khaki', 'khaki_twill', 0.04, (0.9, 0.86, 0.78), 0.65, 0.3, 0.12)
        redm = fabric('cap_red', 'red_wool', 0.05, (1, 1, 1), 0.8, 0.4, 0.1)
        visor_m = leather('visor_black', 'leather_black', (1, 1, 1), 0.12, 1.0)
        gold = metal('gold_thread', (0.95, 0.72, 0.3), 0.33)
        cap = peaked_cap(B, f'{cid}_cap', None, lm)
        for k, o in cap.items():
            m = {'band': redm, 'crown': capm, 'visor': visor_m, 'gold': gold, 'strap': gold,
                 'badge': decal('cap_badge', 'cap_badge.png', 0.45, 0.9)}[k]
            finish(o, B, None, 0.002 if k in ('band', 'crown', 'visor') else 0.0008, 1 if k != 'badge' else 0, m, rigid='head')
    # hide the body under the clothes (Mask modifier) so nothing pokes through
    covered = (B.wsum(TORSO + ARMS + LEGS) > 0.5) & (B.neck_w < 0.15) & (B.hand_w < 0.02) & sleeve_mask(B, 0.03)
    covered |= (B.foot_w > 0.5) & (B.V[:, 2] < B.h('foot.L')[2] + 0.02)
    vg = body.vertex_groups.new(name='Hidden_by_clothes')
    vg.add([int(i) for i in np.where(~covered)[0]], 1.0, 'REPLACE')
    mk = body.modifiers.new('HideCovered', 'MASK')
    mk.vertex_group = 'Hidden_by_clothes'
    body.modifiers.move(len(body.modifiers) - 1, 0)
    n = sum(1 for o in bpy.data.objects if o.parent == rig and o.type == 'MESH')
    return dict(garment_objects=n)
