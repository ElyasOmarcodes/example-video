"""Light relief map of Afghanistan / Pakistan for the explainer.
Sources (public domain): AWS terrain tiles + Natural Earth outlines, prepared earlier in nahzat-ur/geo.
Writes web/assets/map/relief.jpg (soft light hillshade, country tints) and map.json (outlines in image px)."""
import json, numpy as np
from PIL import Image, ImageDraw, ImageFilter
G = '../nahzat-ur/geo'
LON0, LON1, LAT0, LAT1 = 56.0, 80.0, 21.0, 39.0          # grid of height.png
X0, X1, Y0, Y1 = 59.0, 79.0, 22.5, 39.0                  # crop shown in the video
K = np.cos(np.radians(31))
W = 2600; H = int(W * (Y1 - Y0) / ((X1 - X0) * K))
def px(lon, lat): return ((lon - X0) / (X1 - X0) * W, (Y1 - lat) / (Y1 - Y0) * H)
h = np.asarray(Image.open(f'{G}/height.png'), np.float32)
hh, hw = h.shape
c0, c1 = int((X0 - LON0) / (LON1 - LON0) * hw), int((X1 - LON0) / (LON1 - LON0) * hw)
r0, r1 = int((LAT1 - Y1) / (LAT1 - LAT0) * hh), int((LAT1 - Y0) / (LAT1 - LAT0) * hh)
h = np.asarray(Image.fromarray(h[r0:r1, c0:c1]).resize((W, H), Image.BICUBIC), np.float32)
hm = h / 65535 * 8800 if h.max() > 9000 else h
gy, gx = np.gradient(Image.fromarray(hm).filter(ImageFilter.GaussianBlur(1.2)) if False else hm)
sc = 0.012
nx, ny = -gx * sc, -gy * sc
nz = np.ones_like(nx)
n = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
L = np.array([-0.6, -0.7, 0.75]); L /= np.linalg.norm(L)
shade = (nx * L[0] + ny * L[1] + nz * L[2]) / n
shade = np.clip(shade, 0, 1)
flat = (L[2])
rel = shade - flat                                    # <0 shadow side, >0 lit side
B = json.load(open(f'{G}/borders.json'))
def mask(name):
    m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
    for ring in B[name]:
        d.polygon([px(*p) for p in ring], fill=255)
    return np.asarray(m, np.float32) / 255
afg, pak = mask('Afghanistan'), mask('Pakistan')
land = np.zeros((H, W), np.float32)
for nme in B: land = np.maximum(land, mask(nme))
sea = (hm <= 0.5) & (land < 0.5)
base = np.zeros((H, W, 3), np.float32)
base[:] = (236, 238, 243)                               # other land
base = base * (1 - pak[..., None]) + np.array([228, 231, 239]) * pak[..., None]
base = base * (1 - afg[..., None]) + np.array([250, 250, 252]) * afg[..., None]
base[sea] = (222, 230, 241)
# hillshade: shadows toward cool navy, lights toward white; stronger with altitude
alt = np.clip(hm / 4500, 0, 1)[..., None]
r = rel[..., None]
shadow_col = np.array([150, 160, 186], np.float32)
img = np.where(r < 0, base + (shadow_col - base) * np.clip(-r * 2.4, 0, 0.75) * (0.35 + 0.65 * alt), base + (255 - base) * np.clip(r * 2.0, 0, 0.8))
# snow on the high Hindu Kush
snow = np.clip((hm - 4300) / 900, 0, 1)[..., None] * 0.7
img = img * (1 - snow) + 255 * snow
img[sea] = (222, 230, 241)
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save('web/assets/map/relief.jpg', quality=90)
out = {'W': W, 'H': H, 'X0': X0, 'X1': X1, 'Y0': Y0, 'Y1': Y1, 'countries': {}}
for nme in ['Afghanistan', 'Pakistan', 'Iran', 'Tajikistan', 'Uzbekistan', 'Turkmenistan', 'India', "People's Republic of China"]:
    out['countries'][nme] = [[[round(v, 1) for v in px(*p)] for p in ring] for ring in B[nme]]
json.dump(out, open('web/assets/map/map.json', 'w'))
print(W, H)
