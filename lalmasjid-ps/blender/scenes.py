"""Blockout scenes for the Lal Masjid film. Each scene is a composition/lighting guide
that is later re-rendered photoreal with an image model (Blender frame as reference).
Usage: python3 scenes.py OUTDIR [scene ...]"""
import bpy, math, random, json, sys, os
from mathutils import Vector

OUT = sys.argv[1]
ONLY = sys.argv[2:]
HERE = os.path.dirname(os.path.abspath(__file__))
COUNTRIES = json.load(open(os.path.join(HERE, '..', 'data', 'countries.json')))

# ---------------------------------------------------------------- helpers
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.cycles.samples = 48
    s.cycles.use_denoising = True
    s.render.resolution_x, s.render.resolution_y = 720, 1280
    s.render.image_settings.file_format = 'PNG'
    s.view_settings.view_transform = 'AgX'
    s.view_settings.look = 'AgX - Medium High Contrast'
    w = bpy.data.worlds.new('W'); s.world = w; w.use_nodes = True
    return s

def world(col=(0.01, 0.015, 0.035), strength=1.0):
    bg = bpy.context.scene.world.node_tree.nodes['Background']
    bg.inputs[0].default_value = (*col, 1); bg.inputs[1].default_value = strength

def mat(name, col, rough=0.6, metal=0.0, emit=None, estr=0.0):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = estr
    return m

def put(o, m):
    o.data.materials.clear(); o.data.materials.append(m); return o

def box(loc, size, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object; o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    return put(o, m)

def cyl(loc, r, d, m, rot=(0, 0, 0), v=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=d, location=loc, rotation=rot)
    o = bpy.context.object; bpy.ops.object.shade_smooth(); return put(o, m)

def cone(loc, r1, r2, d, m, v=32):
    bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r1, radius2=r2, depth=d, location=loc)
    o = bpy.context.object; bpy.ops.object.shade_smooth(); return put(o, m)

def sphere(loc, r, m, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=48, ring_count=24)
    o = bpy.context.object; o.scale = scale; bpy.ops.object.shade_smooth(); return put(o, m)

def plane(loc, size, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_plane_add(size=size, location=loc, rotation=rot)
    return put(bpy.context.object, m)

def text(body, loc, size, m, rot=(math.radians(90), 0, 0), extrude=0.05, align='CENTER'):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    o = bpy.context.object; o.data.body = body; o.data.size = size
    o.data.extrude = extrude; o.data.bevel_depth = extrude * 0.25
    o.data.align_x = align; o.data.align_y = 'CENTER'
    o.data.materials.append(m); return o

def light(kind, loc, energy, col=(1, 1, 1), size=1.0, target=None, spot=40):
    d = bpy.data.lights.new(kind, kind); d.energy = energy; d.color = col
    if kind in ('AREA',): d.size = size
    if kind in ('POINT', 'SPOT'): d.shadow_soft_size = size
    if kind == 'SPOT': d.spot_size = math.radians(spot); d.spot_blend = 0.4
    o = bpy.data.objects.new(kind, d); bpy.context.collection.objects.link(o); o.location = loc
    if target is not None: aim(o, target)
    return o

def aim(o, target):
    dirv = Vector(target) - o.location
    o.rotation_euler = dirv.to_track_quat('-Z', 'Y').to_euler()

def camera(loc, target, lens=35, dof=None):
    d = bpy.data.cameras.new('C'); d.lens = lens
    if dof:
        d.dof.use_dof = True; d.dof.focus_distance = dof[0]; d.dof.aperture_fstop = dof[1]
    o = bpy.data.objects.new('C', d); bpy.context.collection.objects.link(o)
    o.location = loc; aim(o, target); bpy.context.scene.camera = o; return o

def render(name):
    bpy.context.scene.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', name, flush=True)

# ------------------------------------------------------------- set pieces
def mosque(x=0, y=0, s=1.0, lit=True):
    """Red-walled mosque complex: courtyard wall, prayer hall + dome, two minarets, madrasa wing."""
    red = mat('redstone', (0.42, 0.09, 0.06), 0.75)
    white = mat('marble', (0.78, 0.74, 0.66), 0.4)
    gold = mat('domegold', (0.55, 0.42, 0.2), 0.35, 0.6)
    win = mat('window', (0.1, 0.06, 0.02), 0.5, emit=(1.0, 0.62, 0.28), estr=6 if lit else 0.3)
    k = lambda v: v * s
    # courtyard wall
    for (cx, cy, w, d) in [(0, -9, 22, 0.8), (0, 9, 22, 0.8), (-11, 0, 0.8, 18), (11, 0, 0.8, 18)]:
        box((x + k(cx), y + k(cy), k(1.5)), (k(w), k(d), k(3)), red)
    # courtyard floor
    box((x, y, k(0.05)), (k(21), k(17), k(0.1)), white)
    # prayer hall
    box((x, y + k(4), k(3.5)), (k(14), k(7), k(7)), red)
    for i in range(5):
        box((x + k(-5 + i * 2.5), y + k(0.45), k(3)), (k(1.1), k(0.1), k(3.2)), win)
    sphere((x, y + k(4), k(7)), k(3.4), gold, (1, 1, 0.95))
    cone((x, y + k(4), k(10.6)), k(0.25), 0, k(1.2), gold)
    # minarets
    for mx in (-7.5, 7.5):
        cyl((x + k(mx), y + k(7.6), k(8)), k(0.8), k(16), red)
        cyl((x + k(mx), y + k(7.6), k(12)), k(1.05), k(0.4), white)
        cone((x + k(mx), y + k(7.6), k(17.2)), k(0.85), 0, k(2.6), gold)
        box((x + k(mx), y + k(6.79), k(12.8)), (k(0.5), k(0.05), k(1)), win)
    # madrasa wing (L)
    box((x + k(-15.5), y + k(-3), k(3)), (k(8), k(14), k(6)), red)
    for j in range(5):
        for lv in (1.6, 4.2):
            box((x + k(-11.45), y + k(-8 + j * 2.5), k(lv)), (k(0.1), k(1.0), k(1.2)), win)

def city(n=260, radius=120, clear=26, seed=3):
    random.seed(seed)
    con = mat('concrete', (0.32, 0.31, 0.3), 0.85)
    wins = mat('citywin', (0.05, 0.05, 0.05), 0.5, emit=(1.0, 0.75, 0.45), estr=0.9)
    for _ in range(n):
        a = random.random() * math.tau; r = clear + random.random() * radius
        x, y = math.cos(a) * r, math.sin(a) * r
        w, d, h = random.uniform(5, 12), random.uniform(5, 12), random.uniform(4, 22)
        box((x, y, h / 2), (w, d, h), con)
        if random.random() < 0.7:
            box((x, y - d / 2 - 0.02, h * 0.6), (w * 0.7, 0.05, h * 0.25), wins)
    # roads
    road = mat('asphalt', (0.04, 0.04, 0.045), 0.9)
    plane((0, 0, 0), 600, road)
    lamp = mat('lamp', (1, 0.6, 0.25), emit=(1, 0.55, 0.2), estr=40)
    for i in range(-10, 11):
        for (px, py) in [(i * 9, -22), (i * 9, 22), (-22, i * 9), (22, i * 9)]:
            sphere((px, py, 6), 0.35, lamp)

def apc(x, y, rot=0, scale=1.0):
    olive = mat('olive', (0.11, 0.12, 0.08), 0.7, 0.1)
    tyre = mat('tyre', (0.02, 0.02, 0.02), 0.9)
    k = scale
    body = box((x, y, 1.6 * k), (6.5 * k, 2.8 * k, 1.9 * k), olive, rot=(0, 0, rot))
    box((x + math.cos(rot) * 0.8 * k, y + math.sin(rot) * 0.8 * k, 2.85 * k), (2.0 * k, 1.8 * k, 0.8 * k), olive, rot=(0, 0, rot))
    for i in (-2.1, 0, 2.1):
        for sd in (-1.5, 1.5):
            px = x + math.cos(rot) * i * k - math.sin(rot) * sd * k
            py = y + math.sin(rot) * i * k + math.cos(rot) * sd * k
            cyl((px, py, 0.65 * k), 0.65 * k, 0.5 * k, tyre, rot=(math.radians(90), 0, rot))
    return body

def soldier(x, y, h=1.8, face=0):
    dark = mat('fatigue', (0.06, 0.07, 0.05), 0.8)
    cyl((x, y, h * 0.42), h * 0.15, h * 0.84, dark)
    sphere((x, y, h * 0.92), h * 0.1, dark)
    cyl((x, y, h * 0.98), h * 0.12, h * 0.05, dark)

def pedestal(x, y, r=1.2, h=1.0):
    m = mat('pedestal', (0.16, 0.17, 0.2), 0.35, 0.3)
    rim = mat('rim', (0.9, 0.7, 0.35), 0.2, 1.0)
    cyl((x, y, h / 2), r, h, m, v=64)
    cyl((x, y, h + 0.01), r * 1.01, 0.03, rim, v=64)

def studio(col=(0.05, 0.055, 0.07)):
    """Seamless cyclorama like the reference's 'museum' scenes."""
    m = mat('cyc', col, 0.55)
    plane((0, 0, 0), 80, m)
    bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 18, 20), rotation=(math.radians(90), 0, 0))
    put(bpy.context.object, m)
    world((0.004, 0.005, 0.01), 1)

def country_mesh(name, z=0.0, depth=0.3, m=None, scale=1.0, origin=(70.0, 30.0)):
    import bmesh
    me = bpy.data.meshes.new(name); o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    bm = bmesh.new()
    for poly in COUNTRIES[name]:
        ring = poly[0]
        if len(ring) < 8: continue
        vs = [bm.verts.new(((lon - origin[0]) * scale, (lat - origin[1]) * scale, z)) for lon, lat in ring[:-1]]
        try: bm.faces.new(vs)
        except ValueError: pass
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    ext = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
    bmesh.ops.translate(bm, verts=[v for v in ext['geom'] if isinstance(v, bmesh.types.BMVert)], vec=(0, 0, depth))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me); bm.free()
    if m: o.data.materials.append(m)
    return o

def ll(lon, lat, scale=1.0, origin=(70.0, 30.0)):
    return ((lon - origin[0]) * scale, (lat - origin[1]) * scale)

# ------------------------------------------------------------------ scenes
def s01_siege():
    reset(); world((0.006, 0.01, 0.03), 1)
    city(); mosque()
    for i in range(14):
        a = i / 14 * math.tau; r = 21
        apc(math.cos(a) * r, math.sin(a) * r, a + math.pi / 2, 0.8)
    for i in range(6):
        a = i / 6 * math.tau + 0.3
        light('SPOT', (math.cos(a) * 30, math.sin(a) * 30, 14), 9000, (0.85, 0.9, 1.0), 0.3, (0, 2, 4), 14)
    light('SUN', (0, 0, 50), 0.25, (0.5, 0.6, 1.0))
    camera((48, -62, 54), (0, 2, 3), 32)
    render('s01_siege')

def s02_map():
    reset(); world((0.005, 0.008, 0.02), 1)
    gold = mat('pkland', (0.55, 0.42, 0.24), 0.55)
    dim = mat('neigh', (0.07, 0.08, 0.1), 0.8)
    edge = mat('edge', (1, 0.7, 0.3), emit=(1, 0.65, 0.25), estr=5)
    sea = mat('sea', (0.01, 0.02, 0.05), 0.2)
    plane((0, 0, -0.05), 200, sea)
    for n in ('Afghanistan', 'India', 'China', 'Iran'):
        country_mesh(n, 0, 0.15, dim)
    country_mesh('Pakistan', 0, 0.45, gold)
    px, py = ll(73.05, 33.69)
    cyl((px, py, 2.0), 0.08, 3.4, edge)
    sphere((px, py, 0.6), 0.3, edge)
    light('POINT', (px, py, 1.4), 600, (1, 0.6, 0.3), 0.5)
    light('AREA', (-4, -10, 14), 1500, (0.7, 0.8, 1.0), 10, (0, 0, 0))
    camera((px - 1, py - 16, 13), (px - 2.5, py - 3.5, 0), 40)
    render('s02_map')

def s03_standoff():
    reset(); world((0.02, 0.03, 0.06), 1)
    ground = mat('dirt', (0.12, 0.1, 0.08), 0.95)
    plane((0, 0, 0), 300, ground)
    mosque(18, 30, 1.0)
    for i in range(4):
        apc(-6 + i * 5, -4 - i * 3, math.radians(50), 1.0)
    for i in range(10):
        soldier(-2 + i * 1.3, 2 + (i % 3), 1.8)
    light('SPOT', (-10, -10, 9), 20000, (0.9, 0.93, 1.0), 0.2, (18, 30, 6), 18)
    light('SUN', (0, 0, 40), 0.4, (0.55, 0.65, 1.0))
    light('POINT', (14, 22, 3), 2000, (1, 0.5, 0.2), 2)
    camera((-14, -26, 3.2), (8, 18, 5), 30)
    render('s03_standoff')

def s04_zia():
    reset(); studio()
    pedestal(0, 0, 2.2, 1.1)
    frame = mat('frame', (0.25, 0.16, 0.08), 0.4, 0.2)
    sepia = mat('sepia', (0.45, 0.36, 0.25), 0.8)
    box((0, 0, 3.0), (2.6, 0.12, 3.2), frame)
    box((0, -0.07, 3.0), (2.3, 0.02, 2.9), sepia)
    gold = mat('goldtxt', (0.9, 0.65, 0.3), 0.25, 1.0)
    text('1977 — 1988', (0, -1.2, 5.3), 0.8, gold)
    light('SPOT', (0, -2, 10), 3500, (1, 0.85, 0.7), 0.4, (0, 0, 2), 35)
    light('AREA', (-5, -6, 4), 200, (0.5, 0.6, 1.0), 4, (0, 0, 2))
    camera((0, -11, 3.4), (0, 0, 3.0), 50)
    render('s04_zia')

def s05_brothers():
    reset(); studio()
    sil = mat('silhouette', (0.015, 0.015, 0.018), 0.6)
    for x in (-1.9, 1.9):
        pedestal(x, 0, 1.3, 1.2)
        cyl((x, 0, 1.9), 0.75, 1.4, sil, v=48)
        sphere((x, 0, 3.0), 0.55, sil, (0.9, 1, 1.1))
        cyl((x, 0, 3.55), 0.6, 0.35, sil)  # turban/cap
        light('AREA', (x, 2.5, 3.2), 300, (1, 0.7, 0.4), 1.5, (x, 0, 2.8))
    light('SPOT', (0, -4, 9), 1500, (0.7, 0.8, 1.0), 0.5, (0, 0, 1.5), 50)
    camera((0, -10, 2.6), (0, 0, 2.4), 50)
    render('s05_brothers')

def s06_escalation():
    reset(); studio()
    book = mat('book', (0.35, 0.08, 0.06), 0.6)
    page = mat('page', (0.85, 0.82, 0.74), 0.7)
    navy = mat('policecap', (0.05, 0.07, 0.15), 0.5)
    wood = mat('gavel', (0.25, 0.12, 0.05), 0.4)
    steel = mat('steel', (0.7, 0.7, 0.72), 0.25, 1.0)
    xs = [-3.3, -1.1, 1.1, 3.3]
    for x in xs: pedestal(x, 0, 0.9, 1.0)
    for i in range(4):  # library: stack of books
        box((xs[0], 0, 1.1 + i * 0.18), (1.0, 0.7, 0.16), book if i % 2 else page, rot=(0, 0, i * 0.2))
    cyl((xs[1], 0, 1.2), 0.45, 0.35, navy); cyl((xs[1], -0.1, 1.05), 0.55, 0.05, navy)  # police cap
    for k in range(3):  # chain links (kidnapping)
        bpy.ops.mesh.primitive_torus_add(location=(xs[2] - 0.35 + k * 0.35, 0, 1.25), rotation=(math.radians(90), 0, k * 1.57), major_radius=0.2, minor_radius=0.05)
        put(bpy.context.object, steel)
    cyl((xs[3], 0, 1.35), 0.17, 0.6, wood, rot=(0, math.radians(90), 0)); cyl((xs[3] + 0.1, 0, 1.15), 0.05, 0.5, wood)
    for x in xs:
        light('SPOT', (x, -1.5, 6), 700, (1, 0.85, 0.7), 0.3, (x, 0, 1.2), 22)
    camera((0, -10, 2.2), (0, 0, 1.4), 45)
    render('s06_escalation')

def s07_china():
    reset(); world((0.004, 0.006, 0.015), 1)
    land = mat('land2', (0.1, 0.11, 0.13), 0.8)
    pk = mat('pkland', (0.55, 0.42, 0.24), 0.55)
    red = mat('glowred', (1, 0.2, 0.1), emit=(1, 0.25, 0.1), estr=8)
    plane((0, 0, -0.05), 300, mat('sea', (0.01, 0.02, 0.05), 0.2))
    for n in ('Afghanistan', 'India', 'Iran'): country_mesh(n, 0, 0.12, land)
    country_mesh('China', 0, 0.2, mat('cn', (0.32, 0.08, 0.06), 0.7))
    country_mesh('Pakistan', 0, 0.35, pk)
    a = Vector((*ll(73.05, 33.69), 0.4)); b = Vector((*ll(116.4, 39.9), 0.25))
    for i in range(60):  # arc of glowing beads
        t = i / 59; p = a.lerp(b, t); p.z += math.sin(t * math.pi) * 9
        sphere(p, 0.12, red)
    light('AREA', (20, -20, 30), 4000, (0.8, 0.85, 1), 20, (20, 5, 0))
    camera((14, -32, 26), (22, 6, 0), 32)
    render('s07_china')

def s08_clashes():
    reset(); world((0.01, 0.012, 0.025), 1)
    plane((0, 0, 0), 200, mat('dirt', (0.12, 0.1, 0.08), 0.95))
    mosque(0, 14, 1.0, lit=False)
    fire = mat('flash', (1, 0.5, 0.15), emit=(1, 0.45, 0.12), estr=30)
    tracer = mat('tracer', (1, 0.8, 0.4), emit=(1, 0.75, 0.35), estr=25)
    random.seed(8)
    for _ in range(7):
        p = (random.uniform(-12, 12), random.uniform(3, 8), random.uniform(1, 6))
        sphere(p, random.uniform(0.3, 0.9), fire)
        light('POINT', p, 3000, (1, 0.5, 0.2), 1)
    for _ in range(9):
        y0 = random.uniform(-14, -8); x0 = random.uniform(-14, 14)
        cyl((x0, y0 + 6, random.uniform(1.5, 5)), 0.03, 6, tracer, rot=(math.radians(90), 0, random.uniform(-0.2, 0.2)))
    camera((-6, -22, 2.5), (2, 10, 5), 28)
    render('s08_clashes')

def s09_escape():
    reset(); world((0.008, 0.01, 0.022), 1)
    plane((0, 0, 0), 200, mat('asphalt', (0.05, 0.05, 0.055), 0.6))
    stripe = mat('barrier', (0.8, 0.75, 0.6), 0.6)
    for i in range(-5, 6):
        box((i * 2.2, 0, 0.5), (2.0, 0.4, 1.0), stripe)
    for i in range(7):
        soldier(-6 + i * 2, -3 - (i % 2), 1.85)
    burqa = mat('burqa', (0.06, 0.12, 0.22), 0.85)
    cone((0.5, 4, 0.85), 0.55, 0.22, 1.7, burqa); sphere((0.5, 4, 1.8), 0.2, burqa, (1, 1, 1.3))
    light('SPOT', (0.5, -8, 7), 9000, (0.85, 0.9, 1.0), 0.2, (0.5, 4, 1), 12)
    light('POINT', (8, 12, 4), 1500, (1, 0.55, 0.25), 2)
    camera((-3.5, -12, 1.7), (0.5, 4, 1.2), 45, dof=(16.5, 2.8))
    render('s09_escape')

def s10_operation():
    reset(); world((0.008, 0.01, 0.02), 1)
    plane((0, 0, 0), 300, mat('dirt', (0.1, 0.09, 0.07), 0.95))
    mosque(0, 20, 1.0, lit=False)
    blast = mat('blast', (1, 0.6, 0.25), emit=(1, 0.5, 0.15), estr=60)
    sphere((4, 16, 6), 3.2, blast, (1.3, 1, 1))
    light('POINT', (4, 12, 6), 60000, (1, 0.5, 0.2), 3)
    for i in range(8):
        soldier(-8 + i * 1.6, 2 + (i % 2) * 0.6, 1.8)
    camera((-10, -24, 4), (2, 14, 6), 28)
    render('s10_operation')

def s11_hall():
    reset(); world((0.0, 0.0, 0.0), 0)
    wall = mat('hallwall', (0.55, 0.5, 0.42), 0.8)
    carpet = mat('carpet', (0.32, 0.06, 0.05), 0.95)
    plane((0, 0, 0), 30, carpet)
    box((0, 8, 4), (20, 0.4, 8), wall)
    box((-9, 0, 4), (0.4, 20, 8), wall)
    box((9, 0, 4), (0.4, 20, 8), wall)
    win = mat('daylight', (1, 0.95, 0.85), emit=(1, 0.92, 0.8), estr=25)
    for y in (-4, 0, 4):
        box((8.78, y, 5), (0.05, 1.4, 2.4), win)
    rehal = mat('rehal', (0.3, 0.16, 0.07), 0.5)
    for r in range(4):
        for c in range(5):
            box((-5 + c * 2.4, 4 - r * 2.5, 0.25), (0.9, 0.5, 0.5), rehal)
    light('AREA', (12, 0, 5), 4000, (1, 0.9, 0.75), 4, (0, 0, 0))
    camera((-6.5, -9, 2.2), (2, 3, 1.2), 26)
    render('s11_hall')

def s12_numbers():
    reset(); studio()
    gold = mat('goldtxt', (0.9, 0.65, 0.3), 0.25, 1.0)
    white = mat('whitetxt', (0.85, 0.85, 0.88), 0.3)
    for x, s in ((-3.0, '?'), (0, '?'), (3.0, '?')):
        pedestal(x, 0, 1.1, 1.0 + (abs(x) < 1) * 0.6)
        text(s, (x, 0, 2.6 + (abs(x) < 1) * 0.6), 1.6, gold if abs(x) < 1 else white, extrude=0.15)
        light('SPOT', (x, -1.5, 7), 900, (1, 0.85, 0.7), 0.3, (x, 0, 2), 20)
    camera((0, -12, 2.6), (0, 0, 2.2), 45)
    render('s12_numbers')

def s13_court():
    reset(); world((0.5, 0.6, 0.8), 0.5)
    stone = mat('courtstone', (0.8, 0.78, 0.72), 0.6)
    plane((0, 0, 0), 200, mat('plaza', (0.4, 0.39, 0.37), 0.8))
    for i in range(6):
        box((0, 4 + i * 0.6, 0.2 + i * 0.4), (26, 0.6, 0.4 + i * 0.8), stone)
    for i in range(8):
        cyl((-10.5 + i * 3, 9, 7), 0.6, 10, stone, v=24)
    box((0, 9.6, 12.6), (26, 3, 1.2), stone)
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=14, depth=3.2, location=(0, 9.6, 14.8), rotation=(0, 0, math.radians(45)))
    o = bpy.context.object; o.scale = (1, 0.12, 1); put(o, stone)
    light('SUN', (0, 0, 30), 4.5, (1, 0.92, 0.82)).rotation_euler = (math.radians(55), 0, math.radians(30))
    camera((-6, -22, 2.0), (0, 8, 7), 26)
    render('s13_court')

def s14_dawn():
    reset(); world((0.55, 0.45, 0.42), 0.6)
    plane((0, 0, 0), 300, mat('asphalt', (0.15, 0.14, 0.14), 0.7))
    mosque(0, 18, 1.0, lit=False)
    sun = light('SUN', (0, 0, 30), 3.0, (1, 0.72, 0.5)); sun.rotation_euler = (math.radians(82), 0, math.radians(200))
    camera((6, -26, 1.8), (0, 16, 7), 30)
    render('s14_dawn')

SCENES = [s01_siege, s02_map, s03_standoff, s04_zia, s05_brothers, s06_escalation, s07_china,
          s08_clashes, s09_escape, s10_operation, s11_hall, s12_numbers, s13_court, s14_dawn]
for fn in SCENES:
    if ONLY and fn.__name__ not in ONLY: continue
    fn()
