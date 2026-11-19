"""Quick look at a dressed character: python3 preview_char.py <id> [spp] [views...]"""
import os, sys, bpy, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import studio
cid = sys.argv[1]; spp = int(sys.argv[2]) if len(sys.argv) > 2 else 20
views = sys.argv[3:] or ['front', 'side', 'back', 'q34']
OUT = os.path.join(HERE, '..', 'out')
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, f'{cid}_char.blend'))
rig = bpy.data.objects[f'{cid}_rig']
studio.relaxed(rig)
studio.cycles(samples=spp, res=(600, 800))
studio.backdrop(); studio.three_point(1.0)
cam = studio.camera('Cam', (0, -6.6, 0.95), (0, 0, 0.92), 85)
ANG = {'front': 0, 'q34': -35, 'side': -90, 'back': 180, 'q34b': 145, 'rside': 90}
for v in views:
    rig.rotation_euler = (0, 0, 0)
    if v == 'chest':
        cam.location = (0.0, -2.0, 1.32); studio.look_at(cam, (0, 0, 1.27)); cam.data.lens = 85
    elif v == 'face':
        cam.location = (0.0, -1.1, 1.66); studio.look_at(cam, (0, 0, 1.62)); cam.data.lens = 85
    else:
        rig.rotation_euler = (0, 0, math.radians(-ANG[v])); cam.location = (0, -6.6, 0.95); studio.look_at(cam, (0, 0, 0.92)); cam.data.lens = 85
    bpy.context.view_layer.update()
    bpy.context.scene.render.filepath = os.path.join(OUT, 'preview', f'{cid}_dress_{v}.png')
    bpy.ops.render.render(write_still=True); print('RENDERED', v, flush=True)
