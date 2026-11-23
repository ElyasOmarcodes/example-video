"""Adds ھ (U+06BE, heh doachashmee) to the Al-Quds fonts, which lack it.
All four forms are cut from the font's own two-eyed heh (uniFEEB, 'هـ'):
  init  ھـ  = the two-eyed heh as is (left joining tail)
  medi  ـھـ = the same body with a right joining stroke made of the font's own kashida
  fina  ـھ  = body + right joining stroke, the left tail trimmed to a short rounded foot
  isol  ھ   = body with the short rounded foot only
The stroke thickness, height and rounded end all come from the kashida (uni0640) of the
same weight, so the joins match every other letter. cmap + init/medi/fina GSUB + GDEF.
usage: python3 tools/font_dochashmi.py web/assets/fonts/quds_*.ttf   (in place, idempotent)"""
import sys
import pathops
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen

def path_of(gs, name, dx=0):
    p = pathops.Path()
    gs[name].draw(TransformPen(p.getPen(), (1, 0, 0, 1, dx, 0)))
    return p

def rect(x0, y0, x1, y1):
    p = pathops.Path(); pen = p.getPen()
    pen.moveTo((x0, y0)); pen.lineTo((x1, y0)); pen.lineTo((x1, y1)); pen.lineTo((x0, y1)); pen.closePath()
    return p

def op(a, b, kind):
    return pathops.op(a, b, kind, fix_winding=True, keep_starting_points=False)

def bounds(p):
    return p.bounds  # (xMin, yMin, xMax, yMax)

def to_glyph(p, dx):
    tp = TTGlyphPen(None)
    p.draw(TransformPen(Cu2QuPen(tp, 1.0, reverse_direction=False), (1, 0, 0, 1, dx, 0)))
    return tp.glyph()

def patch(fn):
    f = TTFont(fn)
    cmap = f.getBestCmap()
    if 0x06BE in cmap:
        print(fn, 'already has U+06BE'); return
    gs = f.getGlyphSet(); hm = f['hmtx']
    # kashida: flat on the right at x=adv, rounded cap reaching left of x=0
    kb = BoundsPen(gs); gs['uni0640'].draw(kb); kx0, ky0, kx1, ky1 = kb.bounds
    cap_w = -kx0
    heh = path_of(gs, 'uniFEEB')
    hx0, hy0, hx1, hy1 = bounds(heh)
    adv_init = hm['uniFEEB'][0]
    rsb = adv_init - hx1
    # where the body starts: leftmost outline point clearly above the joining stroke
    rp = RecordingPen(); gs['uniFEEB'].draw(rp)
    pts = [pt for _, args in rp.value for pt in args]
    body_left = min(x for x, y in pts if y > ky1 + 0.15 * (ky1 - ky0))
    c = body_left - 0.05 * (ky1 - ky0)            # trim the tail just short of the body
    body = op(heh, rect(c, hy0 - 50, hx1 + 50, hy1 + 50), pathops.PathOp.INTERSECTION)
    # rounded foot: the kashida's own left cap, placed at the cut
    cap = op(path_of(gs, 'uni0640', dx=c), rect(c - cap_w - 1, ky0 - 1, c + 2, ky1 + 1), pathops.PathOp.INTERSECTION)
    foot = op(body, cap, pathops.PathOp.UNION)
    R = hx1 + rsb                                   # right edge = new advance; joining stroke ends flat there
    # the joining stroke starts right of the lower counter so it never fills an eye
    contours, cur = [], []
    for o, args in rp.value:
        cur += list(args)
        if o in ('closePath', 'endPath'): contours.append(cur); cur = []
    eye_right = max(x for cnt in contours[1:] for x, y in cnt if y < ky1 + 0.6 * (ky1 - ky0)) if len(contours) > 1 else hx1 - 0.35 * (hx1 - hx0)
    join = rect(eye_right + 0.18 * (ky1 - ky0), ky0, R, ky1)
    forms = {
        'uni06BE.init': (heh, adv_init, 0),
        'uni06BE.medi': (op(heh, join, pathops.PathOp.UNION), R, 0),
        'uni06BE.fina': (op(foot, join, pathops.PathOp.UNION), None, None),
        'uni06BE':      (foot, None, None),
    }
    lsb_iso = hm['uni0647'][1] if hm['uni0647'][1] > 0 else 30
    glyf = f['glyf']; order = f.getGlyphOrder()[:]
    for name, (p, adv, dx) in forms.items():
        x0 = bounds(p)[0]
        if dx is None:                               # no left join: shift so the foot sits at a normal side bearing
            dx = lsb_iso - x0
            right = bounds(p)[2] + dx
            if name == 'uni06BE.fina':
                adv = R + dx
            else:
                adv = round(right + rsb)
        g = to_glyph(p, dx)
        glyf[name] = g
        g.recalcBounds(glyf)
        hm[name] = (round(adv), g.xMin if g.numberOfContours else 0)
        if name not in order: order.append(name)
    f.setGlyphOrder(order)
    f['maxp'].numGlyphs = len(order)
    for t in f['cmap'].tables:
        if t.isUnicode():
            t.cmap[0x06BE] = 'uni06BE'
    gsub = f['GSUB'].table
    for feat, suffix in (('init', '.init'), ('medi', '.medi'), ('fina', '.fina')):
        for fr in gsub.FeatureList.FeatureRecord:
            if fr.FeatureTag != feat: continue
            for li in fr.Feature.LookupListIndex:
                lk = gsub.LookupList.Lookup[li]
                for st in lk.SubTable:
                    if lk.LookupType == 7: st = st.ExtSubTable
                    m = getattr(st, 'mapping', None)
                    if m is not None and 'uni0647' in m:
                        m['uni06BE'] = 'uni06BE' + suffix
    gdef = f['GDEF'].table
    if gdef.GlyphClassDef:
        for n in forms: gdef.GlyphClassDef.classDefs[n] = 1
    f.save(fn)
    print(fn, 'added', list(forms), 'kashida', (kx0, ky0, kx1, ky1), 'cut at', round(c), 'adv', {n: hm[n][0] for n in forms})

for fn in sys.argv[1:]:
    patch(fn)
