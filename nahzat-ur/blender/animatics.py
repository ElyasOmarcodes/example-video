"""5-second Blender animatics that steer the Higgsfield video model (one generation each):
  title  — dusk flight over the real relief of Pakistan (our DEM + Blue Marble), jets heading north
  nyc    — September morning, lower Manhattan from the Hudson, twin towers, smoke, an airliner
  outro  — Nahzat emblem with glossy amber news/research icon tiles, close camera glide then pull-back
Run: python3 blender/animatics.py <name> [--preview]   → blender/out/<name>.mp4 (720×1280, 24 fps)"""
import math, os, sys, subprocess
import bpy, bmesh
from mathutils import Vector, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
NAME = sys.argv[1]
PREVIEW = '--preview' in sys.argv
OUT = os.path.join(HERE, 'out', NAME)
os.makedirs(OUT, exist_ok=True)
FPS, SECS = 24, 5
N = FPS * SECS

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = 6 if PREVIEW else 14
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 4
sc.render.resolution_x, sc.render.resolution_y = (360, 640) if PREVIEW else (720, 1280)
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 1, N
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Medium High Contrast'
sc.render.image_settings.file_format = 'JPEG'
sc.render.image_settings.quality = 92
sc.render.filepath = os.path.join(OUT, 'f_')
sc.render.use_overwrite = False
sc.render.use_placeholder = False


def mat(name, color, rough=0.5, metal=0.0, emit=None, strength=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = strength
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
    return m


def box(name, size, loc, m, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        bv = o.modifiers.new('b', 'BEVEL')
        bv.width, bv.segments = bevel, 3
    o.data.materials.append(m)
    return o


def key_path(obj, keys, attr='location'):
    for f, v in keys:
        setattr(obj, attr, v)
        obj.keyframe_insert(attr, frame=f)
    if obj.animation_data and obj.animation_data.action:
        try:
            for fc in obj.animation_data.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'BEZIER'
                    kp.easing = 'EASE_IN_OUT'
        except AttributeError:
            pass


def camera(lens=28):
    cd = bpy.data.cameras.new('cam')
    cd.lens = lens
    cd.clip_start, cd.clip_end = 0.01, 400
    c = bpy.data.objects.new('cam', cd)
    sc.collection.objects.link(c)
    sc.camera = c
    tgt = bpy.data.objects.new('tgt', None)
    sc.collection.objects.link(tgt)
    tc = c.constraints.new('TRACK_TO')
    tc.target = tgt
    tc.track_axis, tc.up_axis = 'TRACK_NEGATIVE_Z', 'UP_Y'
    return c, tgt


def sky(strength=1.0, elev=8, rot=200):
    w = bpy.data.worlds.new('w')
    sc.world = w
    nt = w.node_tree
    bgn = nt.nodes['Background']
    s = nt.nodes.new('ShaderNodeTexSky')
    try:
        s.sky_type = 'NISHITA'
    except TypeError:
        pass
    try:
        s.sun_elevation = math.radians(elev)
        s.sun_rotation = math.radians(rot)
    except AttributeError:
        pass
    nt.links.new(s.outputs[0], bgn.inputs[0])
    bgn.inputs[1].default_value = strength
    return w


def sun(energy=4, rot=(50, 0, 30), color=(1, 0.9, 0.8)):
    l = bpy.data.lights.new('sun', 'SUN')
    l.energy = energy
    l.color = color
    l.angle = math.radians(2)
    o = bpy.data.objects.new('sun', l)
    o.rotation_euler = Euler([math.radians(a) for a in rot])
    sc.collection.objects.link(o)
    return o


def jet(name, m):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.05, radius2=0.012, depth=0.5)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    o = bpy.data.objects.new(name, me)
    sc.collection.objects.link(o)
    o.rotation_euler = (math.radians(-90), 0, 0)  # nose along +Y
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.transform_apply(rotation=True)
    o.data.materials.append(m)
    for sx, sz, sy, w in ((0.0, 0.0, -0.02, 0.34), (0.0, 0.03, -0.2, 0.14)):
        wb = bmesh.new()
        bmesh.ops.create_cube(wb, size=1)
        wm = bpy.data.meshes.new(name + 'w')
        wb.to_mesh(wm)
        wo = bpy.data.objects.new(name + 'w', wm)
        wo.scale = (w, 0.1, 0.012)
        wo.location = (sx, sy, sz)
        wo.parent = o
        wo.data.materials.append(m)
        sc.collection.objects.link(wo)
    return o


# =============================================================================== scenes
if NAME == 'title':
    # relief of the region: real DEM displacement + Blue Marble colour
    W, D = 24 * 0.866, 18.0
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=480, y_subdivisions=360, size=1)
    t = bpy.context.object
    t.scale = (W, D, 1)
    bpy.ops.object.transform_apply(scale=True)
    hi = bpy.data.images.load(os.path.join(ROOT, 'geo', 'height.png'))
    hi.colorspace_settings.name = 'Non-Color'
    tx = bpy.data.textures.new('h', 'IMAGE')
    tx.image = hi
    tx.extension = 'EXTEND'
    dm = t.modifiers.new('d', 'DISPLACE')
    dm.texture = tx
    dm.texture_coords = 'UV'
    dm.strength = 8800 * 0.00011
    dm.mid_level = 0
    m = bpy.data.materials.new('terrain')
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    im = nt.nodes.new('ShaderNodeTexImage')
    im.image = bpy.data.images.load(os.path.join(ROOT, 'geo', 'color.jpg'))
    nt.links.new(im.outputs[0], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.9
    t.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    sky(0.6, elev=6, rot=250)
    sun(5.5, rot=(83, 0, 250), color=(1.0, 0.72, 0.48))
    # map lon/lat → xy
    def xy(lon, lat, z=0.0):
        return Vector(((lon - 68) * 0.866, (lat - 30), z))
    jm = mat('jet', (0.42, 0.45, 0.5), 0.35, 0.6)
    jets = []
    for i, (dx, dy) in enumerate(((0, 0), (-0.22, -0.3), (0.22, -0.3))):
        j = jet(f'jet{i}', jm)
        j.scale = (0.55, 0.55, 0.55)
        jets.append(j)
        key_path(j, [(1, xy(63.45 + dx, 22.55 + dy, 1.28)), (N, xy(64.75 + dx, 26.1 + dy, 2.2))])
    sc.view_settings.exposure = -0.4
    gm = mat('farground', (0.5, 0.42, 0.33), 0.95)
    bpy.ops.mesh.primitive_plane_add(size=300, location=(0, 0, -0.02))
    bpy.context.object.data.materials.append(gm)
    cam, tgt = camera(24)
    key_path(cam, [(1, xy(63.2, 21.6, 1.45)), (N, xy(64.4, 24.8, 2.6))])
    key_path(tgt, [(1, xy(64.6, 25.0, 0.6)), (N, xy(65.8, 29.6, 0.2))])
elif NAME == 'nyc':
    import random
    random.seed(4)
    sky(0.22, elev=24, rot=120)
    sun(2.6, rot=(62, 0, 125), color=(1, 0.93, 0.84))
    sc.view_settings.exposure = -0.3
    water = mat('water', (0.06, 0.12, 0.17), 0.08, 0.0)
    bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 0, 0))
    bpy.context.object.data.materials.append(water)
    land = mat('land', (0.32, 0.31, 0.29), 0.85)
    # lower Manhattan: a wedge of land east of the river (x > 0), narrowing to the south (y < 0)
    bm = bmesh.new()
    verts = [bm.verts.new(v) for v in ((1.0, -6, 0.02), (6.5, -5, 0.02), (9, 30, 0.02), (1.5, 30, 0.02))]
    bm.faces.new(verts)
    me = bpy.data.meshes.new('man')
    bm.to_mesh(me)
    mo = bpy.data.objects.new('man', me)
    sc.collection.objects.link(mo)
    mo.data.materials.append(land)
    bmats = [mat(f'b{i}', c, 0.45, 0.2) for i, c in enumerate(((0.42, 0.36, 0.3), (0.3, 0.33, 0.38), (0.55, 0.5, 0.43), (0.22, 0.25, 0.3), (0.5, 0.42, 0.36)))]
    for gx in range(12):
        for gy in range(30):
            x = 1.7 + gx * 0.6 + random.uniform(-0.1, 0.1)
            y = -4.6 + gy * 1.1 + random.uniform(-0.15, 0.15)
            if x > 6.2 + y * 0.09:
                continue
            if 2.3 < x < 4.2 and -1.2 < y < 1.3:
                continue  # WTC plaza
            h = random.uniform(0.2, 1.1) * (1.6 if gy < 6 else 0.9) * (1.5 if random.random() < 0.08 else 1)
            box(f'bd{gx}_{gy}', (0.42, 0.75, h), (x, y, h / 2), random.choice(bmats))
    tw = mat('tower', (0.72, 0.74, 0.78), 0.25, 0.65)
    for i, (x, y) in enumerate(((2.9, 0.35), (3.6, -0.45))):
        box(f'tower{i}', (0.62, 0.62, 4.1), (x, y, 2.05), tw)
    # smoke from the north tower, drifting south-east
    sm = mat('smoke', (0.07, 0.07, 0.075), 1.0)
    sm2 = mat('smoke2', (0.2, 0.19, 0.18), 1.0)
    for k in range(26):
        r = 0.22 + k * 0.045
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=r, location=(2.9 + k * 0.26 + random.uniform(-0.15, 0.15), 0.35 - k * 0.3 + random.uniform(-0.2, 0.2), 3.75 + k * 0.1 + random.uniform(-0.15, 0.2)))
        o = bpy.context.object
        o.scale = (1.0 + random.uniform(0, 0.5), 1.0, 0.75 + random.uniform(0, 0.3))
        o.data.materials.append(sm if k % 3 else sm2)
        dm = o.modifiers.new('d', 'DISPLACE')
        tx = bpy.data.textures.new(f'n{k}', 'CLOUDS')
        tx.noise_scale = 0.25
        dm.texture, dm.strength = tx, 0.18
        bpy.ops.object.shade_smooth()
    am = mat('air', (0.85, 0.87, 0.9), 0.3, 0.4)
    plane = jet('airliner', am)
    plane.scale = (1.4, 1.4, 1.4)
    key_path(plane, [(1, Vector((-5.5, 9.0, 4.6))), (N, Vector((0.6, 3.6, 3.7)))])
    plane.rotation_euler = (0, math.radians(-8), math.radians(-130))
    cam, tgt = camera(30)
    key_path(cam, [(1, Vector((-11.0, -9.0, 1.1))), (N, Vector((-7.0, -5.5, 1.7)))])
    key_path(tgt, [(1, Vector((3.0, 1.5, 2.2))), (N, Vector((3.0, 1.0, 2.6)))])
elif NAME == 'outro':
    w = bpy.data.worlds.new('w')
    sc.world = w
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.012, 0.013, 0.016, 1)
    for loc, e, col in (((-3, -4, 4), 900, (1, 0.92, 0.8)), ((4, -2, 2), 500, (0.8, 0.88, 1)), ((0, 5, 3), 700, (1, 0.7, 0.35))):
        l = bpy.data.lights.new('a', 'AREA')
        l.energy, l.size, l.color = e, 3, col
        o = bpy.data.objects.new('a', l)
        o.location = loc
        sc.collection.objects.link(o)
        tc = o.constraints.new('TRACK_TO')
        tgt0 = bpy.data.objects.new('o0', None)
        sc.collection.objects.link(tgt0)
        tc.target = tgt0
        tc.track_axis, tc.up_axis = 'TRACK_NEGATIVE_Z', 'UP_Y'
    # backdrop
    bd = mat('bd', (0.03, 0.032, 0.038), 0.6)
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 8, 0), rotation=(math.radians(90), 0, 0))
    bpy.context.object.data.materials.append(bd)
    # emblem: the logo as an alpha-cut plate with thickness
    li = bpy.data.images.load(os.path.join(ROOT, 'web', 'assets', 'img', 'logo-nahzat.png'))
    lm = bpy.data.materials.new('logo')
    nt = lm.node_tree
    b = nt.nodes['Principled BSDF']
    it = nt.nodes.new('ShaderNodeTexImage')
    it.image = li
    nt.links.new(it.outputs['Color'], b.inputs['Base Color'])
    nt.links.new(it.outputs['Alpha'], b.inputs['Alpha'])
    b.inputs['Metallic'].default_value = 0.55
    b.inputs['Roughness'].default_value = 0.25
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0), rotation=(math.radians(90), 0, 0))
    lo = bpy.context.object
    lo.scale = (2.56, 2.0, 1)
    lo.data.materials.append(lm)
    so = lo.modifiers.new('s', 'SOLIDIFY')
    so.thickness = 0.06
    # icon tiles around it
    amb = mat('amber', (0.96, 0.55, 0.08), 0.28, 0.0)
    names = ['newspaper', 'mic', 'search', 'chart-column', 'file-text', 'globe', 'radar', 'book-open-text']
    tiles = []
    for i, n in enumerate(names):
        a = i / len(names) * math.tau
        r = 2.0
        x, z = math.cos(a) * r * 0.85, math.sin(a) * r * 1.3
        y = -0.3 + 0.35 * math.sin(a * 2)
        t = box(f'tile{i}', (0.72, 0.26, 0.72), (x, y, z), amb, bevel=0.13)
        im = bpy.data.images.load(os.path.join(HERE, 'icons', f'{n}.png'))
        dm = bpy.data.materials.new(f'ic{i}')
        nt = dm.node_tree
        b = nt.nodes['Principled BSDF']
        it = nt.nodes.new('ShaderNodeTexImage')
        it.image = im
        b.inputs['Base Color'].default_value = (1, 1, 1, 1)
        b.inputs['Emission Color'].default_value = (1, 1, 1, 1)
        b.inputs['Emission Strength'].default_value = 1.5
        nt.links.new(it.outputs['Alpha'], b.inputs['Alpha'])
        bpy.ops.mesh.primitive_plane_add(size=0.6, location=(x, y - 0.135, z), rotation=(math.radians(90), 0, 0))
        f = bpy.context.object
        f.data.materials.append(dm)
        f.parent = None
        tiles.append((t, f))
        # icons drift in from further out and settle on the ring
        for o in (t, f):
            p1 = o.location.copy()
            p0 = p1 * 1.45 + Vector((0, -0.6, 0))
            key_path(o, [(1, p0), (int(N * 0.6), p1 * 1.12 + Vector((0, -0.2, 0))), (N, p1)])
            key_path(o, [(1, Euler((0, math.radians(70 * (1 if i % 2 else -1)), 0))), (N, Euler((0, 0, 0)))], 'rotation_euler')
    cam, tgt = camera(35)
    key_path(cam, [(1, Vector((1.7, -2.1, 1.5))), (int(N * 0.45), Vector((-1.1, -2.3, -0.5))), (N, Vector((0, -8.6, 0.15)))])
    key_path(tgt, [(1, Vector((0.9, 0, 0.8))), (int(N * 0.45), Vector((-0.4, 0, -0.2))), (N, Vector((0, 0, 0.0)))])
    for loc in ((3.5, -4.0, 3.5), (-1.5, -3.5, 1.0)):
        l = bpy.data.lights.new('k', 'POINT')
        l.energy, l.color = 260, (1, 0.85, 0.65)
        o = bpy.data.objects.new('k', l)
        o.location = loc
        sc.collection.objects.link(o)

STILLS = [int(a[8:]) for a in sys.argv if a.startswith('--still=')]
if STILLS:
    for f in STILLS:
        sc.frame_set(f)
        sc.render.filepath = os.path.join(OUT, f'still_{f:03d}.jpg')
        bpy.ops.render.render(write_still=True)
    print('STILLS DONE')
    sys.exit(0)
bpy.ops.render.render(animation=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(OUT, 'f_%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', os.path.join(HERE, 'out', f'{NAME}{"_prev" if PREVIEW else ""}.mp4')], check=True)
print('DONE', NAME)
