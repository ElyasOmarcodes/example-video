"""Shared render studio + posing helpers for the character sheets."""
import math
import bpy
from mathutils import Matrix, Vector


def cycles(samples=96, res=(1080, 1440), denoise=True):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.02
    sc.cycles.use_denoising = denoise
    sc.cycles.max_bounces = 8
    sc.cycles.diffuse_bounces = 3
    sc.cycles.glossy_bounces = 3
    sc.cycles.transmission_bounces = 6
    sc.cycles.transparent_max_bounces = 16
    sc.cycles.blur_glossy = 0.5
    sc.cycles.sample_clamp_indirect = 8
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.render.use_persistent_data = True
    sc.view_settings.view_transform = 'AgX'
    try:
        sc.view_settings.look = 'AgX - Medium High Contrast'
    except TypeError:
        pass
    sc.view_settings.exposure = -0.35
    sc.render.image_settings.file_format = 'PNG'
    return sc


def backdrop(color=(0.055, 0.06, 0.075), world=(0.03, 0.035, 0.05), world_strength=1.0):
    """Seamless cyclorama + dim world."""
    import bmesh
    me = bpy.data.meshes.new('cyc')
    bm = bmesh.new()
    R, H = 1.6, 6.0
    # build a profile in the Y/Z plane: floor from y=-6 to y=+2.4, curve up to the wall at y=+4
    prof = [(-7.0, 0.0), (2.4, 0.0)]
    for i in range(1, 16):
        a = (i / 15) * (math.pi / 2)
        prof.append((2.4 + R * math.sin(a), R - R * math.cos(a)))
    prof.append((2.4 + R, H))
    rows = []
    for x in (-8.0, 8.0):
        rows.append([bm.verts.new((x, y, z)) for y, z in prof])
    for j in range(len(prof) - 1):
        bm.faces.new((rows[0][j], rows[1][j], rows[1][j + 1], rows[0][j + 1]))
    bm.to_mesh(me)
    bm.free()
    me.shade_smooth()
    ob = bpy.data.objects.new('Cyclorama', me)
    bpy.context.scene.collection.objects.link(ob)
    mat = bpy.data.materials.new('cyc')
    b = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = 0.85
    ob.data.materials.append(mat)
    w = bpy.data.worlds.new('W')
    bpy.context.scene.world = w
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs[0].default_value = (*world, 1)
    bg.inputs[1].default_value = world_strength
    return ob


def area(name, loc, target, power, size, color=(1, 1, 1), shape='RECTANGLE', size_y=None):
    d = bpy.data.lights.new(name, 'AREA')
    d.energy = power
    d.color = color
    d.shape = shape
    d.size = size
    if size_y:
        d.size_y = size_y
    o = bpy.data.objects.new(name, d)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    look_at(o, target)
    return o


def look_at(o, target):
    d = Vector(target) - Vector(o.location)
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def three_point(center_z=1.0, key=260, fill=70, rim=220, warm=(1.0, 0.94, 0.86), cool=(0.8, 0.88, 1.0)):
    """Character is at the origin facing -Y (towards the camera)."""
    t = (0, 0, center_z)
    return [
        area('Key', (-2.2, -2.8, center_z + 1.6), t, key, 1.8, warm, 'RECTANGLE', 2.4),
        area('Fill', (2.8, -2.4, center_z + 0.4), t, fill, 2.5, cool, 'RECTANGLE', 3.0),
        area('RimL', (-1.8, 2.4, center_z + 1.2), t, rim, 0.8, cool, 'RECTANGLE', 2.6),
        area('RimR', (2.0, 2.2, center_z + 1.4), t, rim * 0.8, 0.8, warm, 'RECTANGLE', 2.6),
        area('Top', (0, -0.6, center_z + 3.2), t, key * 0.35, 1.5, warm),
    ]


def camera(name, loc, target, lens=85, sensor=36):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_width = sensor
    cd.clip_start = 0.05
    co = bpy.data.objects.new(name, cd)
    bpy.context.scene.collection.objects.link(co)
    co.location = loc
    look_at(co, target)
    bpy.context.scene.camera = co
    return co


# ------------------------------------------------------------------ posing in world space
def rot_world(rig, bone, axis, deg, pivot='head'):
    """Rotate a pose bone (and therefore its children) about a world-space axis through its head."""
    pb = rig.pose.bones[bone]
    bpy.context.view_layer.update()
    M = pb.matrix.copy()
    p = M.to_translation() if pivot == 'head' else Vector(pivot)
    R = Matrix.Rotation(math.radians(deg), 4, Vector(axis).normalized())
    pb.matrix = Matrix.Translation(p) @ R @ Matrix.Translation(-p) @ M
    bpy.context.view_layer.update()


def rot_local(rig, bone, axis, deg):
    """Rotate around the bone's own axis (X/Y/Z in bone space) — e.g. finger curls."""
    pb = rig.pose.bones[bone]
    pb.rotation_mode = 'XYZ'
    i = 'XYZ'.index(axis)
    r = list(pb.rotation_euler)
    r[i] += math.radians(deg)
    pb.rotation_euler = r
    bpy.context.view_layer.update()


def aim(rig, bone, direction):
    """Rotate a pose bone (minimal rotation about its head) so head→tail points along `direction` (world)."""
    bpy.context.view_layer.update()
    pb = rig.pose.bones[bone]
    cur = (pb.tail - pb.head).normalized()
    q = cur.rotation_difference(Vector(direction).normalized())
    M = pb.matrix.copy()
    h = M.to_translation()
    pb.matrix = Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h) @ M
    bpy.context.view_layer.update()


def twist(rig, bone, deg):
    """Rotate a bone about its own head→tail axis (world), e.g. to turn a forearm/palm."""
    bpy.context.view_layer.update()
    pb = rig.pose.bones[bone]
    rot_world(rig, bone, tuple((pb.tail - pb.head).normalized()), deg)


def palm_normal(rig, s):
    pb = rig.pose.bones
    across = pb[f'finger5-1.{s}'].head - pb[f'finger2-1.{s}'].head
    along = pb[f'finger3-1.{s}'].tail - pb[f'finger3-1.{s}'].head
    n = along.cross(across).normalized()   # this is the back of the hand
    return -n if s == 'L' else n


def curl(rig, s, angles=(14, 22, 18), thumb=(8, 12)):
    """Bend every finger joint toward the palm."""
    for f in range(2, 6):
        for k in (1, 2, 3):
            nm = f'finger{f}-{k}.{s}'
            if nm not in rig.pose.bones:
                continue
            bpy.context.view_layer.update()
            pb = rig.pose.bones[nm]
            d = (pb.tail - pb.head).normalized()
            ax = d.cross(palm_normal(rig, s))
            rot_world(rig, nm, tuple(ax), angles[k - 1] * (1 + (f - 2) * 0.12))
    for k, a in ((2, thumb[0]), (3, thumb[1])):
        nm = f'finger1-{k}.{s}'
        bpy.context.view_layer.update()
        pb = rig.pose.bones[nm]
        d = (pb.tail - pb.head).normalized()
        rot_world(rig, nm, tuple(d.cross(palm_normal(rig, s))), a)


def relaxed(rig, out=0.17, bend=0.22, curl_amt=1.0, head_tilt=0.0):
    """MakeHuman A-pose → natural standing pose. Arms hang beside the body with a soft elbow bend,
    palms turned to the thighs, fingers relaxed. No-op once that pose has been baked as the rest."""
    if rig.get('rest_relaxed'):
        return
    for s, sg in (('L', 1), ('R', -1)):
        aim(rig, f'upperarm01.{s}', (sg * out, 0.04, -1))
        aim(rig, f'lowerarm01.{s}', (sg * out * 0.45, -bend, -1))
        aim(rig, f'wrist.{s}', (sg * out * 0.2, -bend * 0.55, -1))
        # turn the forearm so the palm faces the thigh
        bpy.context.view_layer.update()
        hand = rig.pose.bones[f'wrist.{s}'].head
        want = Vector((-sg, 0.15, 0)).normalized()
        n = palm_normal(rig, s)
        axis = (rig.pose.bones[f'lowerarm01.{s}'].tail - rig.pose.bones[f'lowerarm01.{s}'].head).normalized()
        n_p = (n - axis * n.dot(axis)).normalized()
        w_p = (want - axis * want.dot(axis)).normalized()
        ang = math.degrees(math.atan2(axis.dot(n_p.cross(w_p)), n_p.dot(w_p)))
        # spread the forearm turn like a real arm: humerus 25 %, upper forearm 30 %, lower forearm 45 %
        twist(rig, f'upperarm01.{s}', ang * 0.25)
        twist(rig, f'lowerarm01.{s}', ang * 0.30)
        twist(rig, f'lowerarm02.{s}', ang * 0.45)
        curl(rig, s, tuple(a * curl_amt for a in (14, 22, 18)))
    if head_tilt:
        rot_world(rig, 'head', (1, 0, 0), head_tilt)


def bake_pose_as_rest(rig, meshes):
    """Make the current pose the new rest pose: bake every skinned mesh (and each of its shape keys)
    into the posed shape, then apply the pose to the armature's rest. Garments are then tailored
    on a body whose arms already hang down."""
    import numpy as np
    for ob in meshes:
        others = [m for m in ob.modifiers if m.type != 'ARMATURE' and m.show_viewport]
        for m in others:
            m.show_viewport = False
        me = ob.data
        keys = list(me.shape_keys.key_blocks) if me.shape_keys else []

        def evaluated():
            bpy.context.view_layer.update()
            dg = bpy.context.evaluated_depsgraph_get()
            ev = ob.evaluated_get(dg)
            m2 = ev.to_mesh()
            co = np.empty(len(m2.vertices) * 3)
            m2.vertices.foreach_get('co', co)
            ev.to_mesh_clear()
            return co
        if keys:
            vals = [k.value for k in keys]
            coords = {}
            for k in keys:
                for kk in keys:
                    kk.value = 0.0
                if k.name != keys[0].name:
                    k.value = 1.0
                coords[k.name] = evaluated()
            for k, v in zip(keys, vals):
                k.data.foreach_set('co', coords[k.name])
                k.value = v
            me.vertices.foreach_set('co', coords[keys[0].name])
        else:
            me.vertices.foreach_set('co', evaluated())
        me.update()
        for m in others:
            m.show_viewport = True
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    rig['rest_relaxed'] = True
