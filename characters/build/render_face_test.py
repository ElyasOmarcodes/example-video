"""Face close-ups of <id>_char.blend: front, 3/4, profile.  python3 render_face_test.py <id> [samples]"""
import os, sys, bpy, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import studio
cid = sys.argv[1]; spp = int(sys.argv[2]) if len(sys.argv) > 2 else 48
OUT = os.path.join(HERE, '..', 'out')
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, f'{cid}_char.blend'))
rig = bpy.data.objects[f'{cid}_rig']
studio.relaxed(rig)
e = [bpy.data.objects[f'{cid}_eye.{s}'] for s in 'LR']
c = np.mean([np.array([v.co[:] for v in o.data.vertices]).mean(0) for o in e], axis=0)
studio.cycles(samples=spp, res=(720, 900))
studio.backdrop(); studio.three_point(c[2] - 0.6)
cam = studio.camera('Cam', (0, -1, c[2]), tuple(c), 85)
tz = c[2] - 0.03
for name, loc in (('front', (0, -0.95, c[2])), ('34', (-0.62, -0.74, c[2] + 0.02)), ('profile', (-0.97, -0.02, c[2]))):
    cam.location = loc; studio.look_at(cam, (0, c[1] + 0.03, tz))
    bpy.context.scene.render.filepath = os.path.join(OUT, 'preview', f'{cid}_look_{name}.png')
    bpy.ops.render.render(write_still=True); print('RENDERED', name, flush=True)
