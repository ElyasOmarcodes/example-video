"""Stage 2: dress up a body blend → characters/out/<id>_char.blend (skin, eyes, hair, clothes).
Run: python3 characters/build/build_char.py <id> [--no-clothes]"""
import json, os, sys
import bpy
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import look  # noqa: E402
from specs import CHARACTERS  # noqa: E402

OUT = os.path.join(HERE, '..', 'out')


def apply_look(spec, seed=7):
    cid = spec['id']
    rng = np.random.default_rng(seed)
    body = bpy.data.objects[f'{cid}_body']
    rig = bpy.data.objects[f'{cid}_rig']
    eyes = [bpy.data.objects[f'{cid}_eye.L'], bpy.data.objects[f'{cid}_eye.R']]
    lm = look.landmarks(body, eyes)
    # skin + stubble attribute
    look.add_color_attr(body, 'beard', look.beard_weights(body, lm))
    sw = np.zeros(len(body.data.vertices))
    ec = lm['eyec']
    for fi in look.scalp_faces():
        for v in body.data.polygons[fi].vertices:
            co = body.data.vertices[v].co
            hl = ec[2] + 0.07 + 0.016 * min(1.0, max(0.0, (abs(co.x) - 0.02) / 0.035))
            if co.y < ec[1] + 0.07:
                sw[v] = min(1.0, max(0.0, (co.z - hl) / 0.012))
            else:
                sw[v] = 1.0
    look.add_color_attr(body, 'scalp', sw)
    body.data.materials.clear()
    body.data.materials.append(look.skin_material(spec, beard_strength=0.30 if spec['mustache'] else 0.22))
    sub = body.modifiers.new('Subdivision', 'SUBSURF')
    sub.levels, sub.render_levels = 1, 2
    # eyes
    em = look.eye_material(spec)
    for e in eyes:
        c = np.array([v.co[:] for v in e.data.vertices]).mean(0)
        look.eye_uv(e, c)
        e.data.materials.clear()
        e.data.materials.append(em)
    for nm, col, rough, sss in ((f'{cid}_teeth', (0.86, 0.83, 0.75), 0.25, 0.3), (f'{cid}_tongue', (0.55, 0.24, 0.24), 0.45, 0.4)):
        o = bpy.data.objects[nm]
        o.data.materials.clear()
        o.data.materials.append(look.flat_material(nm + '_m', col, rough, sss))
    # lashes, brows, scalp hair, mustache — hair curves parented to the head bone
    lash_ob = bpy.data.objects[f'{cid}_lashes']
    lashes = look.lashes_from_helper(lash_ob, [lm['eyeL'], lm['eyeR']], rng)
    lash_ob.hide_render = True
    lash_ob.hide_viewport = True
    hs = spec['hair']
    objs = []
    o = look.make_curves(f'{cid}_lash_curves', lashes, 0.00005, 0.000015)
    o.data.materials.append(look.hair_material(f'{cid}_lash_m', 0.95, 0.0, 0.2, 0.35))
    objs.append(o)
    brows = look.groom_brows(body, lm, rng)
    o = look.make_curves(f'{cid}_brows', brows, 0.00006, 0.00002, gray=[1.0 if rng.random() < hs['gray'] * 0.4 else 0.0 for _ in brows])
    o.data.materials.append(look.hair_material(f'{cid}_brow_m', 0.86 if not spec['mustache'] else 0.93, 0.0, 0.12, 0.38))
    objs.append(o)
    strands, gray = look.groom_scalp(body, lm, spec, rng, 62000 if hs['style'] == 'side_part' else 52000)
    o = look.make_curves(f'{cid}_hair', strands, 0.00007, 0.00002, gray=gray)
    o.data.materials.append(look.hair_material(f'{cid}_hair_m', hs['melanin'], hs['gray'], 0.05, 0.32))
    objs.append(o)
    if spec['mustache']:
        ms = look.groom_mustache(body, lm, rng)
        o = look.make_curves(f'{cid}_mustache', ms, 0.00008, 0.00003, gray=[1.0 if rng.random() < 0.35 else 0.0 for _ in ms])
        o.data.materials.append(look.hair_material(f'{cid}_must_m', 0.88, 0.0, 0.3, 0.36))
        objs.append(o)
    for o in objs:
        look.parent_to_bone(o, rig, 'head')
    bpy.context.scene.cycles_curves.shape = 'THICK'
    bpy.context.scene.cycles_curves.subdivisions = 2
    return dict(hair_strands=len(strands), brow_strands=len(brows), lash_strands=len(lashes))


if __name__ == '__main__':
    cid = sys.argv[1]
    spec = CHARACTERS[cid]
    bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, f'{cid}_body.blend'))
    info = apply_look(spec)
    import studio  # noqa: E402
    rig = bpy.data.objects[f'{cid}_rig']
    studio.relaxed(rig)
    studio.bake_pose_as_rest(rig, [o for o in bpy.data.objects if o.type == 'MESH' and o.parent == rig])
    if '--no-clothes' not in sys.argv:
        import clothes  # noqa: E402
        info.update(clothes.dress(spec))
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f'{cid}_char.blend'))
    bpy.ops.file.make_paths_relative()
    bpy.ops.wm.save_mainfile()
    print('@@JSON@@' + json.dumps(info))
