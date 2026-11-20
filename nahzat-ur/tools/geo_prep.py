"""Builds the map data for the region (lon 56–80, lat 21–39):
  geo/height.png   16-bit heightmap on the same lon/lat grid as the Blue Marble image (2048×1536)
  geo/color.jpg    graded Blue Marble colour (4096×3072) with hillshade baked in
  geo/borders.json country outlines (Natural Earth 10 m) as lon/lat rings
  geo/world.jpg    graded world imagery for the globe
Sources: AWS terrain tiles (terrarium, z7), NASA GIBS Blue Marble, Natural Earth — all public domain / open."""
import io, json, math, os, subprocess, urllib.request
import numpy as np
from PIL import Image, ImageFilter
import shapefile
G = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'geo')
DL = os.path.join(G, 'dl')
LON0, LON1, LAT0, LAT1 = 56.0, 80.0, 21.0, 39.0
Z = 7
def tile_x(lon): return (lon + 180) / 360 * 2 ** Z
def tile_y(lat): return (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * 2 ** Z
x0, x1 = int(tile_x(LON0)), int(tile_x(LON1))
y0, y1 = int(tile_y(LAT1)), int(tile_y(LAT0))
mos = np.zeros(((y1 - y0 + 1) * 256, (x1 - x0 + 1) * 256), np.float32)
os.makedirs(os.path.join(DL, 'dem'), exist_ok=True)
for ty in range(y0, y1 + 1):
    for tx in range(x0, x1 + 1):
        p = os.path.join(DL, 'dem', f'{Z}_{tx}_{ty}.png')
        if not os.path.exists(p):
            urllib.request.urlretrieve(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{tx}/{ty}.png', p)
        a = np.asarray(Image.open(p).convert('RGB'), np.float32)
        h = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
        mos[(ty - y0) * 256:(ty - y0 + 1) * 256, (tx - x0) * 256:(tx - x0 + 1) * 256] = h
# resample the mercator mosaic onto the lon/lat grid
W, H = 2048, 1536
lons = LON0 + (np.arange(W) + 0.5) / W * (LON1 - LON0)
lats = LAT1 - (np.arange(H) + 0.5) / H * (LAT1 - LAT0)
px = (np.array([tile_x(l) for l in lons]) - x0) * 256
py = (np.array([tile_y(l) for l in lats]) - y0) * 256
X, Y = np.meshgrid(px, py)
xi, yi = np.clip(X.astype(int), 0, mos.shape[1] - 2), np.clip(Y.astype(int), 0, mos.shape[0] - 2)
fx, fy = X - xi, Y - yi
hgt = (mos[yi, xi] * (1 - fx) * (1 - fy) + mos[yi, xi + 1] * fx * (1 - fy) + mos[yi + 1, xi] * (1 - fx) * fy + mos[yi + 1, xi + 1] * fx * fy)
sea = hgt <= 0
hgt = np.clip(hgt, 0, 8800)
Image.fromarray((hgt / 8800 * 65535).astype(np.uint16)).save(os.path.join(G, 'height.png'))
print('height', hgt.max(), sea.mean())
# hillshade at colour resolution
bm = Image.open(os.path.join(DL, 'bm_region.jpg')).convert('RGB')
CW, CH = bm.size
hh = np.asarray(Image.fromarray(hgt).resize((CW, CH), Image.BICUBIC), np.float32)
cell = (LON1 - LON0) / CW * 111000 * math.cos(math.radians(30))
gy, gx = np.gradient(hh, cell)
az, alt = math.radians(315), math.radians(38)
nx, ny, nz = -gx * 1.6, gy * 1.6, np.ones_like(gx)
nl = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
shade = (nx * math.cos(alt) * math.sin(az) + ny * math.cos(alt) * math.cos(az) + nz * math.sin(alt)) / nl
shade = np.clip(shade, 0, 1)
c = np.asarray(bm, np.float32) / 255
# cinematic grade: lift contrast, cool the shadows, warm the deserts, darken the sea
lum = c @ np.array([0.3, 0.59, 0.11], np.float32)
c = np.clip(lum[..., None] + (c - lum[..., None]) * 1.15, 0, 1)
seaC = np.asarray(Image.fromarray(sea.astype(np.uint8) * 255).resize((CW, CH), Image.BILINEAR), np.float32)[..., None] / 255
land = c ** 1.12 * (0.55 + 0.75 * shade[..., None])
water = np.array([0.035, 0.07, 0.12]) + c * 0.25
out = land * (1 - seaC) + water * seaC
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(os.path.join(G, 'color.jpg'), quality=92)
# borders
sf = shapefile.Reader(os.path.join(DL, 'ne10', 'ne_10m_admin_0_countries.shp'))
names = {"People's Republic of China", 'Pakistan', 'Afghanistan', 'Iran', 'India', 'Turkmenistan', 'Uzbekistan', 'Tajikistan', 'China', 'Oman'}
fi = [f[0] for f in sf.fields[1:]].index('NAME_EN') if 'NAME_EN' in [f[0] for f in sf.fields[1:]] else [f[0] for f in sf.fields[1:]].index('NAME')
borders = {}
for sr in sf.shapeRecords():
    n = sr.record[fi]
    if n not in names: continue
    pts = sr.shape.points; parts = list(sr.shape.parts) + [len(pts)]
    rings = []
    for a, b in zip(parts[:-1], parts[1:]):
        r = pts[a:b]
        if len(r) < 8: continue
        xs = [p[0] for p in r]; ys = [p[1] for p in r]
        if max(xs) < LON0 - 6 or min(xs) > LON1 + 6 or max(ys) < LAT0 - 6 or min(ys) > LAT1 + 6: continue
        step = 2 if len(r) > 400 else 1
        rings.append([[round(x, 3), round(y, 3)] for x, y in r[::step]])
    borders[n] = rings
json.dump(borders, open(os.path.join(G, 'borders.json'), 'w'), separators=(',', ':'))
print({k: sum(len(r) for r in v) for k, v in borders.items()})
# world imagery for the globe (darker, contrasty)
w = np.asarray(Image.open(os.path.join(DL, 'bm_world.jpg')).convert('RGB'), np.float32) / 255
w = w ** 1.15 * 0.95
Image.fromarray((np.clip(w, 0, 1) * 255).astype(np.uint8)).save(os.path.join(G, 'world.jpg'), quality=90)
print('done')
