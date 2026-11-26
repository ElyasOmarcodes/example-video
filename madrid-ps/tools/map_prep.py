"""Dot-matrix map (Europe → South Asia) from Natural Earth 10 m countries, plus the Afghanistan outline.
Writes web/assets/map.json {w, h, step, dots:[[x,y,k]], cities:{id:[x,y]}, afg:'svg path', afgBox}"""
import json, math, shapefile
from PIL import Image, ImageDraw
SHP = '../nahzat-ur/geo/dl/ne10/ne_10m_admin_0_countries.shp'
L0, L1, B0, B1 = -12.0, 80.0, 22.0, 60.0
W = 960; K = W / ((L1 - L0) * math.cos(math.radians(40)))
H = int((B1 - B0) * K)
def P(lon, lat): return ((lon - L0) * math.cos(math.radians(40)) * K, (B1 - lat) * K)
S = 4
im = Image.new('L', (W * S, H * S), 0); dr = ImageDraw.Draw(im)
sf = shapefile.Reader(SHP)
f = [x[0] for x in sf.fields[1:]]
iso = f.index('ADM0_A3')
code = {'AFG': 2, 'PAK': 3, 'GBR': 4, 'ESP': 5}
afg = []
for sr in sf.iterShapeRecords():
    c = code.get(sr.record[iso], 1)
    pts = sr.shape.points; parts = list(sr.shape.parts) + [len(pts)]
    for a, b in zip(parts, parts[1:]):
        ring = [P(*p) for p in pts[a:b]]
        if c == 2: afg.append(ring)
        dr.polygon([(x * S, y * S) for x, y in ring], fill=c * 40)
step = 13
dots = []
for y in range(step // 2, H, step):
    for x in range(step // 2, W, step):
        v = im.getpixel((x * S, y * S))
        if v: dots.append([x, y, v // 40])
cities = {k: [round(v, 1) for v in P(*ll)] for k, ll in
          {'madrid': (-3.70, 40.42), 'london': (-0.13, 51.51), 'islamabad': (73.05, 33.69), 'kabul': (69.17, 34.53)}.items()}
# Afghanistan outline on its own frame (largest ring, simplified)
ring = max(afg, key=len)
xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
sc = 600 / max(x1 - x0, y1 - y0)
sim = ring[::max(1, len(ring) // 400)]
path = 'M' + 'L'.join(f'{(x - x0) * sc:.1f},{(y - y0) * sc:.1f}' for x, y in sim) + 'Z'
json.dump({'w': W, 'h': H, 'step': step, 'dots': dots, 'cities': cities, 'afg': path,
           'afgBox': [round((x1 - x0) * sc, 1), round((y1 - y0) * sc, 1)]}, open('web/assets/map.json', 'w'))
print(W, H, len(dots), cities)
