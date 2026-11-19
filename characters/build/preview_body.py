"""Quick clay preview of a body blend: front, side, face. python3 preview_body.py <id>"""
import os, sys, bpy
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import studio
cid = sys.argv[1]
OUT = os.path.join(HERE, '..', 'out')
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, f'{cid}_body.blend'))
def mat(name, col, rough=0.5, sss=0.0):
    m = bpy.data.materials.new(name); b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough
    if sss: b.inputs['Subsurface Weight'].default_value = sss; b.inputs['Subsurface Radius'].default_value = (0.9, 0.4, 0.25); b.inputs['Subsurface Scale'].default_value = 0.01
    return m
clay = mat('clay', (0.72, 0.64, 0.58), 0.55, 0.3)
for ob in bpy.data.objects:
    if ob.type == 'MESH':
        ob.data.materials.clear()
        ob.data.materials.append(mat('eye', (0.9, 0.9, 0.88), 0.1) if '_eye.' in ob.name else mat('dark', (0.05, 0.04, 0.04), 0.6) if 'lashes' in ob.name else clay)
rig = bpy.data.objects[f'{cid}_rig']
studio.relaxed(rig)
studio.cycles(samples=24, res=(600, 800))
studio.backdrop(); studio.three_point(1.0)
cam = studio.camera('Cam', (0, -6.6, 0.95), (0, 0, 0.92), 85)
views = [('front', (0, -6.6, 0.95), (0, 0, 0.92), 85), ('side', (-6.6, 0, 0.95), (0, 0, 0.92), 85),
         ('face', (0, -0.95, 1.66), (0, 0, 1.64), 85), ('face34', (-0.62, -0.72, 1.66), (0, 0, 1.64), 85)]
for name, loc, tgt, lens in views:
    cam.location = loc; studio.look_at(cam, tgt); cam.data.lens = lens
    ztop = max((rig.matrix_world @ b.head).z for b in rig.pose.bones)
    bpy.context.scene.render.filepath = os.path.join(OUT, 'preview', f'{cid}_{name}.png')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', name, flush=True)
