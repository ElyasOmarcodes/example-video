"""Stage 1: shaped, rigged, weighted MakeHuman body for each character → characters/out/<id>_body.blend
Run: python3 characters/build/build_body.py [president|general ...]"""
import json, os, sys
import bpy, bmesh
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import mh  # noqa: E402
from specs import CHARACTERS, EXPRESSIONS  # noqa: E402

OUT = os.path.join(HERE, '..', 'out')
os.makedirs(OUT, exist_ok=True)


def split_copy(src, name, groups):
    """Duplicate src (mesh + weights + keys) and keep only the vertices of `groups`."""
    ob = src.copy()
    ob.data = src.data.copy()
    ob.name = ob.data.name = name
    bpy.context.scene.collection.objects.link(ob)
    mh.delete_verts_not_in(ob, groups)
    return ob


def eyeball(name, center, radius, bone):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=32, radius=radius, calc_uvs=True)
    # cornea bulge on the front (-Y is forward)
    for v in bm.verts:
        f = max(0.0, (-v.co.y / radius - 0.72) / 0.28)
        v.co.y -= radius * 0.09 * f * f
    bm.to_mesh(me)
    bm.free()
    me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for v in me.vertices:
        v.co += Vector(center)
    vg = ob.vertex_groups.new(name=bone)
    vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    return ob


def build(cid):
    spec = CHARACTERS[cid]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    od = mh.read_obj()
    V, applied = mh.shaped_vertices(od, spec['macro'], spec['details'])
    body_idx = mh.group_verts(od, 'body')
    Vb = mh.conv(V)
    dz = -Vb[body_idx, 2].min()
    V[:, 1] += dz * 10  # MH y (dm) is Blender z
    Vb = mh.conv(V)

    full = mh.build_mesh(f'{cid}_full', od, V)
    rig, bones = mh.build_rig(f'{cid}_rig', Vb, od)
    nweights = mh.apply_weights(full)
    mh.add_expression_keys(full, spec['macro']['race'], EXPRESSIONS)

    body = split_copy(full, f'{cid}_body', ['grp:body'])
    lashes = split_copy(full, f'{cid}_lashes', ['grp:helper-l-eyelashes-1', 'grp:helper-l-eyelashes-2', 'grp:helper-r-eyelashes-1', 'grp:helper-r-eyelashes-2'])
    teeth = split_copy(full, f'{cid}_teeth', ['grp:helper-upper-teeth', 'grp:helper-lower-teeth'])
    tongue = split_copy(full, f'{cid}_tongue', ['grp:helper-tongue'])
    eyes = []
    for side, g in (('L', 'helper-l-eye'), ('R', 'helper-r-eye')):
        P = Vb[mh.group_verts(od, g)]
        c = P.mean(0)
        r = float(np.median(np.linalg.norm(P - c, axis=1))) * 0.86
        eyes.append(eyeball(f'{cid}_eye.{side}', c, r, f'eye.{side}'))
    bpy.data.objects.remove(full)

    for ob in [body, lashes, teeth, tongue] + eyes:
        # drop the grp:* helper groups from the deforming meshes, keep bone groups
        for vg in [g for g in ob.vertex_groups if g.name.startswith('grp:')]:
            ob.vertex_groups.remove(vg)
        ob.parent = rig
        md = ob.modifiers.new('Armature', 'ARMATURE')
        md.object = rig
    body.modifiers.move(len(body.modifiers) - 1, 0)

    zmax = max(v.co.z for v in body.data.vertices)
    info = dict(id=cid, height_m=round(zmax, 3), body_verts=len(body.data.vertices), body_faces=len(body.data.polygons),
                bones=len(bones), weighted_bones=nweights, shape_keys=[k.name for k in body.data.shape_keys.key_blocks],
                eye_radius_mm=round(r * 1000, 1), targets_applied=len(applied))
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f'{cid}_body.blend'))
    print('@@JSON@@' + json.dumps(info))
    return info


if __name__ == '__main__':
    ids = [a for a in sys.argv[1:] if a in CHARACTERS] or list(CHARACTERS)
    for cid in ids:
        build(cid)
