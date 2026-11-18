"""Decodes world-atlas topojson (passed as args) into small JSON polygon files for the sim."""
import json, sys
def decode(src, obj, keep=None):
    w = json.load(open(src))
    sx, sy = w['transform']['scale']; tx, ty = w['transform']['translate']
    arcs = []
    for a in w['arcs']:
        x = y = 0; pts = []
        for dx, dy in a:
            x += dx; y += dy; pts.append((round(x * sx + tx, 3), round(y * sy + ty, 3)))
        arcs.append(pts)
    def ring(ix):
        out = []
        for i in ix:
            p = arcs[i] if i >= 0 else arcs[~i][::-1]
            out.extend(p if not out else p[1:])
        return out
    res = {}
    for g in w['objects'][obj]['geometries']:
        n = g.get('properties', {}).get('name', obj)
        if keep and n not in keep: continue
        polys = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']] if g['type'] == 'Polygon' else []
        res.setdefault(n, []).extend([[ring(r) for r in p] for p in polys])
    return res
c50, land110, out = sys.argv[1], sys.argv[2], sys.argv[3]
keep = {'Pakistan', 'Afghanistan', 'India', 'China', 'Iran', 'Tajikistan', 'Uzbekistan', 'Turkmenistan', 'Oman'}
json.dump(decode(c50, 'countries', keep), open(out + '/region.json', 'w'), separators=(',', ':'))
land = decode(land110, 'land')
json.dump([p[0] for v in land.values() for p in v], open(out + '/land.json', 'w'), separators=(',', ':'))
print('ok')
