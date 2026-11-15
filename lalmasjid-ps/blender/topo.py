import json, sys
src, dst = sys.argv[1], sys.argv[2]
w = json.load(open(src))
sx, sy = w['transform']['scale']; tx, ty = w['transform']['translate']
arcs = []
for a in w['arcs']:
    x = y = 0; pts = []
    for dx, dy in a:
        x += dx; y += dy; pts.append((x*sx+tx, y*sy+ty))
    arcs.append(pts)
def ring(ix):
    out = []
    for i in ix:
        p = arcs[i] if i >= 0 else arcs[~i][::-1]
        out.extend(p if not out else p[1:])
    return out
out = {}
for g in w['objects']['countries']['geometries']:
    n = g.get('properties', {}).get('name')
    if n not in ('Pakistan','Afghanistan','India','China','Iran'): continue
    polys = g['arcs'] if g['type']=='MultiPolygon' else [g['arcs']]
    out[n] = [[ring(r) for r in p] for p in polys]
json.dump(out, open(dst,'w'))
print({k: sum(len(p[0]) for p in v) for k,v in out.items()})
