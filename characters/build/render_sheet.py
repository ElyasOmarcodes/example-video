"""Final character-sheet renders for <id>_char.blend → characters/out/sheets/<id>/*.png
python3 render_sheet.py <id> [--fast]"""
import math, os, sys
import bpy, bmesh
import numpy as np
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import studio  # noqa: E402

cid = sys.argv[1]
FAST = '--fast' in sys.argv
ONLY = [a[7:] for a in sys.argv if a.startswith('--only=')]
ONLY = ONLY[0].split(',') if ONLY else None
OUT = os.path.join(HERE, '..', 'out', 'sheets', cid)
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, '..', 'out', f'{cid}_char.blend'))
rig = bpy.data.objects[f'{cid}_rig']
body = bpy.data.objects[f'{cid}_body']
sc = studio.cycles(samples=16 if FAST else 72, res=(1000, 1600))
studio.backdrop()
lights = studio.three_point(1.0)
eyes = [bpy.data.objects[f'{cid}_eye.{s}'] for s in 'LR']
EC = Vector(np.mean([np.array([v.co[:] for v in o.data.vertices]).mean(0) for o in eyes], axis=0))
H = max(v.co.z for v in body.data.vertices) + (0.09 if cid == 'general' else 0.01)
cam = studio.camera('Cam', (0, -5.4, H / 2), (0, 0, H / 2), 85)


def shot(name, rot_deg, loc, target, lens=85, res=(1000, 1600), spp=None):
    if ONLY and name not in ONLY:
        return
    rig.rotation_euler = (0, 0, math.radians(-rot_deg))
    bpy.context.view_layer.update()
    cam.location = loc
    cam.data.lens = lens
    studio.look_at(cam, target)
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.cycles.samples = spp or (16 if FAST else 72)
    sc.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', name, flush=True)


# --- turnaround: the character turns, camera and lights stay
dist = H * 1.1 / (2 * math.tan(math.atan(18 / 85))) + 0.4
for a in (0, 45, 90, 135, 180, 225, 270, 315):
    shot(f'turn_{a:03d}', a, (0, -dist, H * 0.52), (0, 0, H * 0.5))
# --- face
for nm, a in (('face_front', 0), ('face_34', 35), ('face_profile', 90)):
    shot(nm, a, (0, -1.05, EC.z + 0.01), (0, EC.y + 0.06, EC.z - 0.035), 85, (1000, 1250), 24 if FAST else 128)
# --- details
chest_z = EC.z - 0.36
shot('detail_chest', 0, (0, -1.7, chest_z), (0, 0, chest_z - 0.02), 85, (1000, 1250), 24 if FAST else 110)
hand = rig.pose.bones['wrist.L'].head
shot('detail_hand', 0, (hand.x - 0.05, -1.1, hand.z - 0.03), (hand.x, hand.y, hand.z - 0.07), 85, (1000, 1250), 24 if FAST else 110)

# --- action pose: arm raised and bent, head turned, smile (clothes follow the skin weights)
rig.rotation_euler = (0, 0, 0)
bpy.context.view_layer.update()
studio.aim(rig, 'upperarm01.R', (-0.35, -0.75, 0.2))
studio.aim(rig, 'lowerarm01.R', (-0.05, -0.25, 1.0))
studio.aim(rig, 'wrist.R', (0.0, -0.2, 1.0))
studio.rot_world(rig, 'neck02', (0, 0, 1), -10)
studio.rot_world(rig, 'head', (0, 0, 1), -12)
studio.rot_world(rig, 'head', (1, 0, 0), -4)
studio.rot_world(rig, 'spine01', (0, 0, 1), -6)
kb = body.data.shape_keys.key_blocks
kb['mouth-corner-puller'].value = 0.55
kb['eyebrows-left-up'].value = 0.3
kb['eyebrows-right-up'].value = 0.3
shot('pose_gesture', 25, (0, -dist, H * 0.52), (0, 0, H * 0.5), 85, (1000, 1600), 16 if FAST else 80)
for k in ('mouth-corner-puller', 'eyebrows-left-up', 'eyebrows-right-up'):
    kb[k].value = 0.0
for pb in rig.pose.bones:
    pb.matrix_basis = Matrix()
bpy.context.view_layer.update()

# --- skeleton x-ray: hide clothes/hair, glassy body, glowing bones
deform = {g.name for g in body.vertex_groups}
bone_me = bpy.data.meshes.new('bones_vis')
bm = bmesh.new()
for b in rig.data.bones:
    if b.name not in deform or b.length < 0.004:
        continue
    h, t = Vector(b.head_local), Vector(b.tail_local)
    ax = (t - h)
    L = ax.length
    w = min(0.012, 0.1 * L) + 0.002
    q = Vector((0, 0, 1)).rotation_difference(ax.normalized())
    pts = [Vector((0, 0, 0)), Vector((w, 0, 0.18 * L)), Vector((0, w, 0.18 * L)), Vector((-w, 0, 0.18 * L)), Vector((0, -w, 0.18 * L)), Vector((0, 0, L))]
    vs = [bm.verts.new(h + q @ p) for p in pts]
    for f in ((0, 1, 2), (0, 2, 3), (0, 3, 4), (0, 4, 1), (5, 2, 1), (5, 3, 2), (5, 4, 3), (5, 1, 4)):
        bm.faces.new([vs[i] for i in f])
bm.to_mesh(bone_me)
bm.free()
bones_ob = bpy.data.objects.new('bones_vis', bone_me)
bpy.context.scene.collection.objects.link(bones_ob)
bones_ob.parent = rig
glow = bpy.data.materials.new('glow')
gb = next(n for n in glow.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
gb.inputs['Base Color'].default_value = (0.1, 0.5, 1.0, 1)
gb.inputs['Emission Color'].default_value = (0.25, 0.75, 1.0, 1)
gb.inputs['Emission Strength'].default_value = 6.0
bone_me.materials.append(glow)
glass = bpy.data.materials.new('xray')
nt = glass.node_tree
for n in list(nt.nodes):
    if n.type == 'BSDF_PRINCIPLED':
        nt.nodes.remove(n)
out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
tr = nt.nodes.new('ShaderNodeBsdfTransparent')
em = nt.nodes.new('ShaderNodeEmission')
em.inputs['Color'].default_value = (0.55, 0.75, 1.0, 1)
em.inputs['Strength'].default_value = 0.35
lw = nt.nodes.new('ShaderNodeLayerWeight')
lw.inputs['Blend'].default_value = 0.35
mx = nt.nodes.new('ShaderNodeMixShader')
nt.links.new(lw.outputs['Facing'], mx.inputs['Fac'])
nt.links.new(tr.outputs[0], mx.inputs[1])
nt.links.new(em.outputs[0], mx.inputs[2])
nt.links.new(mx.outputs[0], out.inputs['Surface'])
for o in bpy.data.objects:
    if o.parent == rig and o not in (body, bones_ob):
        o.hide_render = True
body.data.materials.clear()
body.data.materials.append(glass)
for m in body.modifiers:
    if m.type == 'MASK':
        m.show_render = False
sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.3
for l in lights:
    l.data.energy *= 0.3
shot('skeleton_front', 0, (0, -dist, H * 0.52), (0, 0, H * 0.5), 85, (1000, 1600), 16 if FAST else 48)
shot('skeleton_side', 90, (0, -dist, H * 0.52), (0, 0, H * 0.5), 85, (1000, 1600), 16 if FAST else 48)
print('DONE', cid)
