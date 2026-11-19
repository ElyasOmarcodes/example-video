"""Skin, eyes, teeth, lashes, brows, scalp hair and mustache for a MakeHuman body (Cycles).

Hair is grown by our own groomer (no bundled assets): roots are sampled on the real scalp faces
(MPFB scalp UV island), every strand follows a comb direction field and is projected back onto the
head with a BVH so it hugs the skull with a little volume, then clumped and frizzed.
"""
import gzip, json, math, os
import bpy
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

MH = os.environ.get('MH_DATA', '/home/user/makehumancommunity/mpfb2/src/mpfb/data')
TEX = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'textures')


# ------------------------------------------------------------------ node helpers
def N(nt, type_, loc=(0, 0), **props):
    n = nt.nodes.new(type_)
    n.location = loc
    for k, v in props.items():
        setattr(n, k, v)
    return n


def L(nt, a, b):
    nt.links.new(a, b)


def img(nt, path, colorspace='sRGB', loc=(0, 0), box=False, extension='REPEAT'):
    n = N(nt, 'ShaderNodeTexImage', loc)
    im = bpy.data.images.load(path, check_existing=True)
    im.colorspace_settings.name = colorspace
    n.image = im
    n.extension = extension
    if box:
        n.projection = 'BOX'
        n.projection_blend = 0.25
    return n


def principled(nt):
    return next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')


def new_mat(name):
    m = bpy.data.materials.new(name)
    return m, m.node_tree


def obj_coords(nt, scale, loc=(-1200, 0)):
    tc = N(nt, 'ShaderNodeTexCoord', loc)
    mp = N(nt, 'ShaderNodeMapping', (loc[0] + 200, loc[1]))
    mp.inputs['Scale'].default_value = (scale, scale, scale)
    L(nt, tc.outputs['Object'], mp.inputs['Vector'])
    return mp.outputs['Vector'], tc


# ------------------------------------------------------------------ face landmarks + beard mask
def landmarks(body, eyes):
    V = np.array([v.co[:] for v in body.data.vertices])
    eL = np.array([v.co[:] for v in eyes[0].data.vertices]).mean(0)
    eR = np.array([v.co[:] for v in eyes[1].data.vertices]).mean(0)
    ec = (eL + eR) / 2
    head = V[(V[:, 2] > ec[2] - 0.16) & (np.abs(V[:, 0]) < 0.05)]
    nose = head[np.argmin(head[:, 1])]
    return dict(eyeL=eL, eyeR=eR, eyec=ec, nose=nose, V=V)


def beard_weights(body, lm, strength=1.0):
    """0..1 per vertex: jaw, chin, upper lip and cheeks below the cheekbone (front half of the head)."""
    V = lm['V']
    ec, nose = lm['eyec'], lm['nose']
    z_top = nose[2] - 0.005          # just under the nose
    z_low = ec[2] - 0.155            # under the jaw line
    w = np.zeros(len(V))
    front = V[:, 1] < ec[1] + 0.045   # not the back of the head/neck
    for i, (x, y, z) in enumerate(V):
        if not front[i] or z > nose[2] + 0.012 or z < z_low - 0.02:
            continue
        ax = abs(x)
        # cheek line rises from the mouth corner to the ear
        cheek = nose[2] - 0.02 + (ax - 0.03) * 0.25
        if z > cheek and ax > 0.03:
            continue
        a = min(1.0, (z - (z_low - 0.02)) / 0.03)           # fade under the jaw
        b = min(1.0, max(0.0, (cheek - z) / 0.012)) if ax > 0.03 else 1.0
        c = 1.0 if ax < 0.075 else max(0.0, 1 - (ax - 0.075) / 0.015)
        w[i] = max(0.0, a) * b * c * strength
    # keep the lips themselves clean
    return w


def add_color_attr(ob, name, w):
    me = ob.data
    at = me.color_attributes.get(name) or me.color_attributes.new(name, 'FLOAT_COLOR', 'POINT')
    col = np.repeat(np.clip(w, 0, 1)[:, None], 4, 1).astype(np.float32)
    col[:, 3] = 1
    at.data.foreach_set('color', col.ravel())


# ------------------------------------------------------------------ materials
def srgb_to_lin(c):
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


def skin_material(spec, beard_strength):
    sk = dict(spec['skin'])
    sk['base'] = srgb_to_lin(sk['srgb'])
    m, nt = new_mat(f"{spec['id']}_skin")
    b = principled(nt)
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    b.location = (400, 0)
    out.location = (750, 0)
    try:
        b.subsurface_method = 'RANDOM_WALK_SKIN'
    except TypeError:
        pass
    uv = N(nt, 'ShaderNodeUVMap', (-1400, 400), uv_map='UVMap')
    masks = {}
    import shutil
    os.makedirs(os.path.join(TEX, 'mh'), exist_ok=True)
    for i, k in enumerate(['face', 'lips', 'ears', 'eyelids', 'fingernails', 'toenails']):
        local = os.path.join(TEX, 'mh', f'mpfb_{k}.jpg')   # CC0 MakeHuman masks, kept with the project
        if not os.path.exists(local):
            shutil.copy(os.path.join(MH, 'textures', f'mpfb_{k}.jpg'), local)
        n = img(nt, local, 'Non-Color', (-1150, 700 - i * 220), extension='EXTEND')
        L(nt, uv.outputs['UV'], n.inputs['Vector'])
        masks[k] = n.outputs['Color']
    vec, _ = obj_coords(nt, 1.0, (-1500, -400))
    # low-frequency mottling (blotchy redness/brightness), object space
    nz = N(nt, 'ShaderNodeTexNoise', (-1150, -300))
    nz.inputs['Scale'].default_value = 28
    nz.inputs['Detail'].default_value = 4
    L(nt, vec, nz.inputs['Vector'])
    base = N(nt, 'ShaderNodeRGB', (-900, 900))
    base.outputs[0].default_value = (*sk['base'], 1)

    def mix(a, b_, fac, blend='MIX', loc=(0, 0)):
        mx = N(nt, 'ShaderNodeMix', loc, data_type='RGBA', blend_type=blend)
        L(nt, fac, mx.inputs['Factor']) if not isinstance(fac, float) else None
        if isinstance(fac, float):
            mx.inputs['Factor'].default_value = fac
        L(nt, a, mx.inputs[6])
        if isinstance(b_, tuple):
            mx.inputs[7].default_value = (*b_, 1)
        else:
            L(nt, b_, mx.inputs[7])
        return mx.outputs[2]

    c = base.outputs[0]
    # redness on face/ears modulated by noise
    red_fac = N(nt, 'ShaderNodeMath', (-700, 500), operation='MULTIPLY')
    L(nt, masks['face'], red_fac.inputs[0])
    L(nt, nz.outputs['Fac'], red_fac.inputs[1])
    rr = sk['redness']
    c = mix(c, tuple(min(1, v * f) for v, f in zip(sk['base'], (1.0 + 0.10 * rr, 1 - 0.12 * rr, 1 - 0.14 * rr))), red_fac.outputs[0], loc=(-500, 700))
    c = mix(c, tuple(min(1, v * f) for v, f in zip(sk['base'], (1.02, 0.86, 0.86))), masks['ears'], loc=(-300, 700))
    c = mix(c, tuple(v * f for v, f in zip(sk['base'], (0.82, 0.55, 0.55))), masks['lips'], loc=(-100, 700))
    c = mix(c, tuple(v * f for v, f in zip(sk['base'], (0.86, 0.80, 0.84))), masks['eyelids'], loc=(100, 700))
    c = mix(c, tuple(min(1, v * f) for v, f in zip(sk['base'], (1.12, 1.02, 1.0))), masks['fingernails'], loc=(100, 500))
    # scalp under the hair takes the hair colour (no 'bald' look through the strands)
    sat = N(nt, 'ShaderNodeAttribute', (-700, 50), attribute_type='GEOMETRY', attribute_name='scalp')
    sf = N(nt, 'ShaderNodeMath', (-500, 50), operation='MULTIPLY')
    L(nt, sat.outputs['Fac'], sf.inputs[0])
    sf.inputs[1].default_value = 0.85
    c = mix(c, tuple(spec.get('scalp_tint', (0.2, 0.18, 0.16))), sf.outputs[0], loc=(150, 400))
    # stubble shadow from the 'beard' colour attribute
    at = N(nt, 'ShaderNodeAttribute', (-700, 200), attribute_type='GEOMETRY', attribute_name='beard')
    bf = N(nt, 'ShaderNodeMath', (-500, 200), operation='MULTIPLY')
    L(nt, at.outputs['Fac'], bf.inputs[0])
    bf.inputs[1].default_value = beard_strength
    c = mix(c, tuple(v * f for v, f in zip(sk['base'], (0.52, 0.54, 0.58))), bf.outputs[0], loc=(150, 250))
    # overall brightness variation
    vbr = N(nt, 'ShaderNodeMapRange', (-700, -100))
    L(nt, nz.outputs['Fac'], vbr.inputs['Value'])
    vbr.inputs['To Min'].default_value = 0.93
    vbr.inputs['To Max'].default_value = 1.05
    L(nt, c, b.inputs['Base Color'])
    b.inputs['Subsurface Weight'].default_value = 1.0
    b.inputs['Subsurface Radius'].default_value = sk['sss_radius']
    b.inputs['Subsurface Scale'].default_value = 0.006
    b.inputs['Subsurface Anisotropy'].default_value = 0.8
    b.inputs['Specular IOR Level'].default_value = 0.45
    # roughness: oily face, softer lips, shiny nails, + pore variation
    pores = img(nt, os.path.join(TEX, 'skin_pores.jpg'), 'Non-Color', (-900, -500), box=True)
    pv, _ = obj_coords(nt, 22.0, (-1450, -700))
    L(nt, pv, pores.inputs['Vector'])
    bw = N(nt, 'ShaderNodeRGBToBW', (-650, -500))
    L(nt, pores.outputs['Color'], bw.inputs[0])
    r1 = N(nt, 'ShaderNodeMapRange', (-400, -250))
    L(nt, masks['face'], r1.inputs['Value'])
    r1.inputs['To Min'].default_value = 0.5
    r1.inputs['To Max'].default_value = 0.4
    r2 = N(nt, 'ShaderNodeMath', (-200, -250), operation='SUBTRACT')
    L(nt, r1.outputs['Result'], r2.inputs[0])
    L(nt, masks['fingernails'], r2.inputs[1])
    r3 = N(nt, 'ShaderNodeMath', (0, -250), operation='MULTIPLY_ADD')
    L(nt, bw.outputs[0], r3.inputs[0])
    r3.inputs[1].default_value = 0.12
    L(nt, r2.outputs[0], r3.inputs[2])
    L(nt, r3.outputs[0], b.inputs['Roughness'])
    bump = N(nt, 'ShaderNodeBump', (150, -550))
    bump.inputs['Strength'].default_value = 0.22
    bump.inputs['Distance'].default_value = 0.0004
    L(nt, bw.outputs[0], bump.inputs['Height'])
    L(nt, bump.outputs['Normal'], b.inputs['Normal'])
    return m


def eye_material(spec):
    m, nt = new_mat(f"{spec['id']}_eye")
    b = principled(nt)
    tx = img(nt, os.path.join(TEX, f"{spec['iris']}.jpg"), 'sRGB', (-600, 200), extension='EXTEND')
    uvn = N(nt, 'ShaderNodeUVMap', (-850, 200), uv_map='EyeUV')
    L(nt, uvn.outputs['UV'], tx.inputs['Vector'])
    # warm the white sclera a touch
    mx = N(nt, 'ShaderNodeMix', (-300, 200), data_type='RGBA', blend_type='MULTIPLY')
    mx.inputs['Factor'].default_value = 1.0
    L(nt, tx.outputs['Color'], mx.inputs[6])
    mx.inputs[7].default_value = (0.95, 0.9, 0.86, 1)
    L(nt, mx.outputs[2], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.35
    b.inputs['Coat Weight'].default_value = 1.0
    b.inputs['Coat Roughness'].default_value = 0.02
    b.inputs['Coat IOR'].default_value = 1.376
    b.inputs['Subsurface Weight'].default_value = 0.15
    b.inputs['Subsurface Radius'].default_value = (1, 0.4, 0.3)
    b.inputs['Subsurface Scale'].default_value = 0.002
    return m


def flat_material(name, col, rough=0.5, sss=0.0, metal=0.0):
    m, nt = new_mat(name)
    b = principled(nt)
    b.inputs['Base Color'].default_value = (*col, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Scale'].default_value = 0.003
    return m


def hair_material(name, melanin, gray, redness=0.3, rough=0.32):
    """Principled Hair (Chiang). Per-strand 'gray' attribute blends dark strands with white ones."""
    m, nt = new_mat(name)
    for n in list(nt.nodes):
        if n.type == 'BSDF_PRINCIPLED':
            nt.nodes.remove(n)
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    h = N(nt, 'ShaderNodeBsdfHairPrincipled', (0, 0))
    try:
        h.parametrization = 'MELANIN'
    except TypeError:
        pass
    at = N(nt, 'ShaderNodeAttribute', (-600, 100), attribute_type='GEOMETRY', attribute_name='gray')
    mr = N(nt, 'ShaderNodeMapRange', (-350, 100))
    L(nt, at.outputs['Fac'], mr.inputs['Value'])
    mr.inputs['To Min'].default_value = melanin
    mr.inputs['To Max'].default_value = 0.015
    L(nt, mr.outputs['Result'], h.inputs['Melanin'])
    h.inputs['Melanin Redness'].default_value = redness
    h.inputs['Roughness'].default_value = rough
    h.inputs['Radial Roughness'].default_value = 0.3
    h.inputs['Coat'].default_value = 0.0
    h.inputs['Random Color'].default_value = 0.15
    h.inputs['Random Roughness'].default_value = 0.2
    L(nt, h.outputs[0], out.inputs['Surface'])
    return m


# ------------------------------------------------------------------ eyes
def eye_uv(eye_ob, center):
    """Planar front projection: the iris image's 0.4-radius circle lands on 0.5 R of the eyeball."""
    me = eye_ob.data
    P = np.array([v.co[:] for v in me.vertices]) - center
    R = np.median(np.linalg.norm(P, axis=1))
    uv = me.uv_layers.get('EyeUV') or me.uv_layers.new(name='EyeUV')
    loops_v = np.empty(len(me.loops), dtype=np.int64)
    me.loops.foreach_get('vertex_index', loops_v)
    p = P[loops_v]
    u = 0.5 + 0.8 * p[:, 0] / R
    v = 0.5 + 0.8 * p[:, 2] / R
    back = p[:, 1] > 0  # back hemisphere → sclera corner of the image
    u[back] = 0.02
    v[back] = 0.02
    uv.data.foreach_set('uv', np.column_stack([u, v]).astype(np.float32).ravel())


# ------------------------------------------------------------------ hair groomer
def rest_bvh(ob):
    me = ob.data
    V = [v.co.copy() for v in me.vertices]
    F = [list(p.vertices) for p in me.polygons]
    return BVHTree.FromPolygons(V, F), V


def sample_faces(ob, faces, n, rng):
    me = ob.data
    tris, areas = [], []
    for fi in faces:
        p = me.polygons[fi]
        vs = [me.vertices[i].co for i in p.vertices]
        for k in range(1, len(vs) - 1):
            a, b, c = vs[0], vs[k], vs[k + 1]
            tris.append((a, b, c, p.normal))
            areas.append(((b - a).cross(c - a)).length * 0.5)
    areas = np.array(areas)
    pick = rng.choice(len(tris), n, p=areas / areas.sum())
    r1, r2 = rng.random(n), rng.random(n)
    s = np.sqrt(r1)
    out = []
    for i, t in enumerate(pick):
        a, b, c, nrm = tris[t]
        p = a * (1 - s[i]) + b * (s[i] * (1 - r2[i])) + c * (s[i] * r2[i])
        out.append((p, nrm.copy()))
    return out


def grow(bvh, root, normal, comb, length, nseg, lift, volume, rng, frizz=0.0006, droop=0.0):
    """One strand: march along the comb direction, re-project onto the head + offset (volume)."""
    pts = [root + normal * 0.0003]
    p = Vector(root)
    d = (comb - normal * comb.dot(normal)).normalized()
    step = length / nseg
    for k in range(1, nseg + 1):
        p = p + d * step + Vector((0, 0, -droop * step))
        hit = bvh.find_nearest(p)
        if hit[0] is not None:
            q, n = hit[0], hit[1]
            s = k / nseg
            off = lift + volume * (1 - math.exp(-3.5 * s)) + rng.normal(0, frizz * 0.5)
            p = q + n * max(0.0006, off)
            d = (d - n * d.dot(n)).normalized() if (d - n * d.dot(n)).length > 1e-6 else d
        p = p + Vector(rng.normal(0, frizz * (k / nseg), 3))
        pts.append(p.copy())
    return pts


def make_curves(name, strands, radius_root, radius_tip, gray=None):
    cv = bpy.data.hair_curves.new(name)
    sizes = [len(s) for s in strands]
    cv.add_curves(sizes)
    P = np.array([c[:] for s in strands for c in s], dtype=np.float32)
    cv.attributes['position'].data.foreach_set('vector', P.ravel())
    rad = cv.attributes.get('radius') or cv.attributes.new('radius', 'FLOAT', 'POINT')
    R = np.concatenate([np.linspace(radius_root, radius_tip, n) for n in sizes]).astype(np.float32)
    rad.data.foreach_set('value', R)
    if gray is not None:
        g = cv.attributes.new('gray', 'FLOAT', 'CURVE')
        g.data.foreach_set('value', np.asarray(gray, dtype=np.float32))
    ob = bpy.data.objects.new(name, cv)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def parent_to_bone(ob, rig, bone):
    bpy.context.view_layer.update()
    pb = rig.pose.bones[bone]
    tail = rig.matrix_world @ pb.matrix @ Matrix.Translation((0, pb.bone.length, 0))
    ob.parent = rig
    ob.parent_type = 'BONE'
    ob.parent_bone = bone
    ob.matrix_parent_inverse = tail.inverted()


def scalp_faces():
    d = json.load(gzip.open(os.path.join(MH, 'uv_layers', 'scalp_solid.json.gz'), 'rt'))
    return sorted(int(k) for k in d)


def groom_scalp(body, lm, spec, rng, count):
    hs = spec['hair']
    bvh, _ = rest_bvh(body)
    roots = sample_faces(body, scalp_faces(), count, rng)
    ec = Vector(lm['eyec'])
    front_y = min(p.y for p, _ in roots)
    part_x = 0.03
    strands, gray = [], []
    kept = []
    for p, n in roots:
        # hairline: nothing grows on the forehead; temples recede a little
        ax = abs(p.x)
        hl = ec.z + 0.07 + 0.016 * min(1.0, max(0.0, (ax - 0.02) / 0.035))
        if p.y < ec.y + 0.07 and p.z < hl:
            continue
        kept.append((p, n))
    roots = kept
    for p, n in roots:
        top = n.z > 0.5
        rel = p - ec
        if hs['style'] == 'side_part':
            frontline = p.y < ec.y + 0.065 and p.z > ec.z + 0.03       # forehead hairline + temples
            if frontline:
                comb = Vector((-0.9, 0.55, 0.5)) if p.x < part_x else Vector((0.9, 0.6, 0.35))
                L_ = hs['length'] * (0.9 + 0.2 * rng.random())
            elif top or p.z > ec.z + 0.085:
                comb = Vector((-1.0, 0.5, 0.0)) if p.x < part_x else Vector((1.0, 0.5, -0.2))
                L_ = hs['length'] * (0.85 + 0.3 * rng.random())
            else:
                comb = Vector((0.0, 0.4, -1.0))
                L_ = hs['length'] * (0.5 if p.z > ec.z else 0.36) * (0.8 + 0.4 * rng.random())
            vol = 0.0032 if (top or frontline) else 0.0015
        else:  # short military cut, tapered sides
            comb = Vector((0.0, 0.6, -0.6)) if not top else Vector((0.0, 0.9, 0.0))
            L_ = hs['length'] * ((1.0 if top else 0.55 if p.z > ec.z - 0.01 else 0.35)) * (0.8 + 0.4 * rng.random())
            vol = 0.0025 if top else 0.0012
        comb = comb + Vector(rng.normal(0, 0.12, 3))
        strands.append(grow(bvh, p, n, comb.normalized(), L_, 7, 0.0008, vol, rng, frizz=0.0005))
        temple = max(0.0, 1 - abs(abs(p.x) - 0.075) / 0.03) * (p.z < ec.z + 0.05)
        g = hs['gray'] + (0.35 * temple if hs['style'] != 'side_part' else 0)
        gray.append(1.0 if rng.random() < g else rng.random() * 0.3)
    # clumping: pull tips toward a nearby strand's tip
    P = np.array([s[-1][:] for s in strands])
    for i in range(0, len(strands), 1):
        j = rng.integers(0, len(strands))
        if (Vector(P[j]) - strands[i][-1]).length < 0.006:
            for k in range(3, len(strands[i])):
                w = 0.35 * (k / (len(strands[i]) - 1))
                strands[i][k] = strands[i][k].lerp(strands[j][k] if k < len(strands[j]) else strands[i][k], w)
    return strands, gray


def groom_brows(body, lm, rng, per_brow=520):
    bvh, _ = rest_bvh(body)
    strands = []
    for side, E in ((1, Vector(lm['eyeL'])), (-1, Vector(lm['eyeR']))):
        for i in range(per_brow):
            u = -0.017 + rng.random() * 0.05                         # medial → lateral (m)
            t = (u + 0.017) / 0.05
            h = 0.0175 + 0.0045 * (1 - ((t - 0.4) / 0.6) ** 2) - 0.004 * t
            band = (0.0085 * (1 - t) + 0.0035 * t)
            z = E.z + h + (rng.random() - 0.5) * band
            o = Vector((E.x + side * u, E.y - 0.06, z))
            hit = bvh.ray_cast(o, Vector((0, 1, 0)), 0.12)
            if hit[0] is None:
                continue
            p, n = hit[0], hit[1]
            ang = math.radians(75 * (1 - t) ** 2 + 8 - 18 * t)       # up at the head, lateral/down at the tail
            comb = Vector((side * math.cos(ang), 0.0, math.sin(ang)))
            L_ = 0.008 + 0.004 * rng.random()
            strands.append(grow(bvh, p, n, comb, L_, 4, 0.0003, 0.0004, rng, frizz=0.00015))
    return strands


def groom_mustache(body, lm, rng, count=2600):
    bvh, _ = rest_bvh(body)
    nose = Vector(lm['nose'])
    strands = []
    # find the subnasale (bottom of the nose) on the midline
    z_sub = nose.z
    for dz in np.linspace(0, 0.03, 60):
        hit = bvh.ray_cast(Vector((0, nose.y - 0.05, nose.z - dz)), Vector((0, 1, 0)), 0.2)
        if hit[0] is not None and hit[0].y > nose.y + 0.012:
            z_sub = nose.z - dz
            break
    for i in range(count):
        x = (rng.random() * 2 - 1) * 0.033
        ax = abs(x) / 0.033
        z_hi = z_sub - 0.002 - 0.004 * ax
        z_lo = z_sub - 0.014 - 0.006 * ax ** 2
        z = z_lo + (z_hi - z_lo) * rng.random()
        hit = bvh.ray_cast(Vector((x, nose.y - 0.06, z)), Vector((0, 1, 0)), 0.2)
        if hit[0] is None:
            continue
        p, n = hit[0], hit[1]
        comb = Vector((math.copysign(0.35 + 0.4 * ax, x), -0.15, -1.0))
        L_ = 0.012 + 0.005 * rng.random() - 0.004 * ax
        strands.append(grow(bvh, p, n, comb.normalized(), L_, 5, 0.0004, 0.0012, rng, frizz=0.0003, droop=0.2))
    return strands


def lashes_from_helper(lash_ob, eye_centers, rng, per_eye=(110, 70)):
    """Use the MakeHuman lash helper ribbons: inner row = roots, outer row = tips."""
    me = lash_ob.data
    V = np.array([v.co[:] for v in me.vertices])
    strands = []
    for side, c in enumerate(eye_centers):
        sel = V[(np.sign(V[:, 0]) == (1 if side == 0 else -1))]
        if not len(sel):
            continue
        for upper, cnt in ((True, per_eye[0]), (False, per_eye[1])):
            part = sel[(sel[:, 2] > c[2]) == upper]
            if len(part) < 4:
                continue
            d = np.linalg.norm(part - c, axis=1)
            med = np.median(d)
            roots, tips = part[d <= med], part[d > med]
            ang = lambda P: np.arctan2(P[:, 2] - c[2], P[:, 0] - c[0])
            ra, ta = ang(roots), ang(tips)
            ro, to = np.argsort(ra), np.argsort(ta)
            ra, roots, ta, tips = ra[ro], roots[ro], ta[to], tips[to]
            for k in range(cnt):
                a = ra.min() + (ra.max() - ra.min()) * rng.random()
                r = np.array([np.interp(a, ra, roots[:, j]) for j in range(3)])
                tt = np.array([np.interp(a, ta, tips[:, j]) for j in range(3)])
                r, tt = Vector(r), Vector(tt)
                L_ = 0.75 + 0.35 * rng.random()
                mid = r.lerp(tt, 0.5 * L_) + Vector((0, -0.0006, 0.0008 if upper else -0.0006))
                tip = r.lerp(tt, L_) + Vector((0, 0, 0.0012 if upper else -0.0008))
                strands.append([r, mid, tip])
    return strands
