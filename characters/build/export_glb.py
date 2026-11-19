"""Real-time export: <id>_char.blend → characters/out/glb/<id>.glb (skinned, 163 bones, expression morphs).

What changes for real time:
  - skin: the procedural Cycles skin is baked to a 2048 base-colour map on the MakeHuman UVs
  - body faces hidden under the clothes are deleted (shape keys kept)
  - fabrics: box-projected UVs + the (tinted) Higgsfield tile and its normal map
  - hair curves → thin ribbons skinned to the head bone (glTF has no hair curves)
  - Solidify/Subdivision/Bevel modifiers are dropped; materials are double-sided
python3 export_glb.py <id>"""
import math, os, sys
import bpy, bmesh
import numpy as np
from mathutils import Vector
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import look  # noqa: E402

cid = sys.argv[1]
ROOT = os.path.join(HERE, '..')
OUT = os.path.join(ROOT, 'out', 'glb')
TEXO = os.path.join(OUT, 'tex')
os.makedirs(TEXO, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'out', f'{cid}_char.blend'))
rig = bpy.data.objects[f'{cid}_rig']
body = bpy.data.objects[f'{cid}_body']
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = 4


def ctx(ob):
    return bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob], selected_editable_objects=[ob])


def principled_mat(name, base=None, base_img=None, uv='UVMap', normal_img=None, rough=0.6, metal=0.0, alpha_img=False):
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if base is not None:
        b.inputs['Base Color'].default_value = (*base, 1)
    if base_img:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = bpy.data.images.load(base_img, check_existing=True)
        u = nt.nodes.new('ShaderNodeUVMap')
        u.uv_map = uv
        nt.links.new(u.outputs['UV'], t.inputs['Vector'])
        nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
        if alpha_img:
            nt.links.new(t.outputs['Alpha'], b.inputs['Alpha'])
    if normal_img:
        t2 = nt.nodes.new('ShaderNodeTexImage')
        t2.image = bpy.data.images.load(normal_img, check_existing=True)
        t2.image.colorspace_settings.name = 'Non-Color'
        u2 = nt.nodes.new('ShaderNodeUVMap')
        u2.uv_map = uv
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nm.uv_map = uv
        nm.inputs['Strength'].default_value = 0.6
        nt.links.new(u2.outputs['UV'], t2.inputs['Vector'])
        nt.links.new(t2.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    m.use_backface_culling = False
    return m


# ---------------------------------------------------------------- 1. bake the skin colour
img = bpy.data.images.new(f'{cid}_skin_basecolor', 2048, 2048)
skin = body.data.materials[0]
tn = skin.node_tree.nodes.new('ShaderNodeTexImage')
tn.image = img
skin.node_tree.nodes.active = tn
for m in body.modifiers:
    if m.type in ('MASK', 'SUBSURF'):
        m.show_render = m.show_viewport = False
with ctx(body):
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, margin=8, use_clear=True)
skin_png = os.path.join(TEXO, f'{cid}_skin.jpg')
img.filepath_raw = skin_png
img.file_format = 'JPEG'
img.save()
body.data.materials.clear()
body.data.materials.append(principled_mat(f'{cid}_skin_rt', base_img=skin_png, rough=0.5))

# ---------------------------------------------------------------- 2. delete covered body faces (keeps shape keys)
vis = body.vertex_groups.get('Hidden_by_clothes')
keep = set()
if vis:
    for v in body.data.vertices:
        if any(g.group == vis.index and g.weight > 0 for g in v.groups):
            keep.add(v.index)
    bm = bmesh.new()
    bm.from_mesh(body.data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in keep], context='VERTS')
    bm.to_mesh(body.data)
    bm.free()
    body.vertex_groups.remove(vis)
for m in list(body.modifiers):
    if m.type != 'ARMATURE':
        body.modifiers.remove(m)
for k in ('beard', 'scalp'):
    a = body.data.color_attributes.get(k)
    if a:
        body.data.color_attributes.remove(a)

# ---------------------------------------------------------------- 3. eyes, teeth: exporter-friendly materials
spec_iris = 'iris_blue' if cid == 'president' else 'iris_brown'
eye_m = principled_mat(f'{cid}_eye_rt', base_img=os.path.join(ROOT, 'textures', spec_iris + '.jpg'), uv='EyeUV', rough=0.08)
for s in 'LR':
    e = bpy.data.objects[f'{cid}_eye.{s}']
    e.data.materials.clear()
    e.data.materials.append(eye_m)


# ---------------------------------------------------------------- 4. garments: box UVs + baked tint
def box_uv(ob, tile_m, name='BoxUV'):
    me = ob.data
    V = np.array([v.co[:] for v in me.vertices])
    uv = me.uv_layers.get(name) or me.uv_layers.new(name=name)
    out = np.zeros((len(me.loops), 2), np.float32)
    for p in me.polygons:
        n = np.abs(np.array(p.normal))
        ax = int(np.argmax(n))
        for li in p.loop_indices:
            c = V[me.loops[li].vertex_index] / tile_m
            out[li] = (c[1], c[2]) if ax == 0 else (c[0], c[2]) if ax == 1 else (c[0], c[1])
    uv.data.foreach_set('uv', out.ravel())
    return name


tint_cache = {}


def tinted(tex, tint):
    key = (tex, tuple(round(t, 3) for t in tint))
    if key in tint_cache:
        return tint_cache[key]
    im = np.asarray(Image.open(os.path.join(ROOT, 'textures', tex + '.jpg')).convert('RGB'), dtype=np.float32)
    # tint is linear; apply in linear space
    lin = (im / 255.0) ** 2.2 * np.array(tint)
    out = os.path.join(TEXO, f"{tex}_{'_'.join(f'{t:.2f}' for t in tint)}.jpg")
    Image.fromarray((np.clip(lin, 0, 1) ** (1 / 2.2) * 255).astype(np.uint8)).resize((512, 512), Image.LANCZOS).save(out, quality=90)
    tint_cache[key] = out
    return out


rt_cache = {}
for ob in [o for o in bpy.data.objects if o.parent == rig and o.type == 'MESH' and o not in (body,)]:
    for m in list(ob.modifiers):
        if m.type != 'ARMATURE':
            ob.modifiers.remove(m)
    if not ob.data.materials:
        continue
    m = ob.data.materials[0]
    if m.get('tex'):
        uvn = box_uv(ob, m['tile_m'])
        k = (m.name, 'box')
        if k not in rt_cache:
            nimg = os.path.join(ROOT, 'textures', m['tex'] + '_n.png')
            rough = max(0.5, next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Roughness'].default_value)
            rt_cache[k] = principled_mat(m.name + '_rt', base_img=tinted(m['tex'], m['tint']), uv=uvn,
                                         normal_img=nimg if os.path.exists(nimg) else None, rough=rough)
        ob.data.materials[0] = rt_cache[k]
    elif m.get('decal'):
        k = (m.name, 'decal')
        if k not in rt_cache:
            f = m['decal']
            rt_cache[k] = principled_mat(m.name + '_rt', base_img=os.path.join(ROOT, 'textures', f), rough=0.5,
                                         metal=0.35 if f in ('rank_board.png', 'cap_badge.png', 'collar_tab.png') else 0.0,
                                         alpha_img=f.endswith('.png'))
            try:
                rt_cache[k].surface_render_method = 'DITHERED'
            except (AttributeError, TypeError):
                pass
        ob.data.materials[0] = rt_cache[k]


# ---------------------------------------------------------------- 4b. cull shirt faces hidden under the jacket (no poke-through in real time)
from mathutils.bvhtree import BVHTree
cover = [o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith(cid) and any(k in o.name for k in ('_jacket', '_lapel', '_jcollar'))]
if cover:
    verts, polys = [], []
    for o in cover:
        base = len(verts)
        verts += [o.matrix_world @ v.co for v in o.data.vertices]
        polys += [[base + i for i in p.vertices] for p in o.data.polygons]
    jb = BVHTree.FromPolygons(verts, polys)
    sh = bpy.data.objects.get(f'{cid}_shirt')
    if sh:
        me = sh.data
        covered = np.zeros(len(me.vertices), bool)
        for v in me.vertices:
            hit = jb.ray_cast(v.co + v.normal * 0.0005, v.normal, 0.05)
            covered[v.index] = hit[0] is not None
        bm = bmesh.new()
        bm.from_mesh(me)
        bm.faces.ensure_lookup_table()
        dead = [f for f in bm.faces if all(covered[v.index] for v in f.verts)]
        bmesh.ops.delete(bm, geom=dead, context='FACES')
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
        bm.to_mesh(me)
        bm.free()
        print('shirt faces culled', len(dead))

# ---------------------------------------------------------------- 5. hair curves → ribbons on the head bone
def ribbons(cv_ob, every=1, width=(0.0011, 0.0003), npts=None):
    cv = cv_ob.data
    P = np.array([p.vector[:] for p in cv.attributes['position'].data])
    sizes = [c.points_length for c in cv.curves]
    off = np.concatenate([[0], np.cumsum(sizes)])
    head = Vector(np.array(rig.data.bones['head'].head_local) + np.array([0, 0.0, 0.08]))
    verts, faces, uvs = [], [], []
    for ci in range(0, len(sizes), every):
        pts = [Vector(P[j]) for j in range(off[ci], off[ci + 1])]
        if len(pts) < 2:
            continue
        nrm = (pts[0] - head).normalized()
        base = len(verts)
        K = len(pts)
        for k, p in enumerate(pts):
            t = (pts[min(k + 1, K - 1)] - pts[max(k - 1, 0)]).normalized()
            side = t.cross(nrm)
            if side.length < 1e-6:
                side = Vector((1, 0, 0))
            side.normalize()
            w = width[0] + (width[1] - width[0]) * k / (K - 1)
            verts += [p - side * w / 2, p + side * w / 2]
            uvs += [(0.0, k / (K - 1)), (1.0, k / (K - 1))]
        for k in range(K - 1):
            a = base + 2 * k
            faces.append((a, a + 1, a + 3, a + 2))
    me = bpy.data.meshes.new(cv_ob.name + '_rt')
    me.from_pydata([v[:] for v in verts], [], faces)
    luv = me.uv_layers.new(name='UVMap')
    flat = []
    for f in faces:
        for vi in f:
            flat.extend(uvs[vi])
    luv.data.foreach_set('uv', flat)
    me.shade_smooth()
    ob = bpy.data.objects.new(cv_ob.name + '_rt', me)
    sc.collection.objects.link(ob)
    vg = ob.vertex_groups.new(name='head')
    vg.add(list(range(len(verts))), 1.0, 'REPLACE')
    ob.parent = rig
    md = ob.modifiers.new('Armature', 'ARMATURE')
    md.object = rig
    return ob


hair_cols = {'president': (0.16, 0.15, 0.14), 'general': (0.03, 0.027, 0.025)}
for cv_ob in [o for o in bpy.data.objects if o.type == 'CURVES']:
    nm = cv_ob.name
    if nm.endswith('_hair'):
        r = ribbons(cv_ob, 4, (0.0022, 0.0006))
        col = hair_cols[cid]
    elif 'brows' in nm:
        r, col = ribbons(cv_ob, 1, (0.0007, 0.0002)), (0.06, 0.05, 0.045)
    elif 'mustache' in nm:
        r, col = ribbons(cv_ob, 1, (0.0009, 0.0003)), (0.05, 0.045, 0.04)
    else:
        r, col = ribbons(cv_ob, 1, (0.0005, 0.0002)), (0.02, 0.018, 0.016)
    r.data.materials.append(principled_mat(nm + '_rtm', base=col, rough=0.45))
    bpy.data.objects.remove(cv_ob)
for o in [o for o in bpy.data.objects if o.name.endswith('_lashes')]:
    bpy.data.objects.remove(o)
for o in [o for o in bpy.data.objects if o.type in ('LIGHT', 'CAMERA') or o.name == 'Cyclorama']:
    bpy.data.objects.remove(o)

# ---------------------------------------------------------------- 6. export
path = os.path.join(OUT, f'{cid}.glb')
bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_skins=True, export_morph=True, export_animations=False,
                          export_apply=False, export_yup=True, export_texcoords=True, export_normals=True, export_tangents=True,
                          export_image_format='JPEG')
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print('@@JSON@@' + str(dict(glb=path, size_mb=round(os.path.getsize(path) / 1e6, 2), triangles=tris, bones=len(rig.data.bones),
                            morphs=len(body.data.shape_keys.key_blocks) - 1)))
