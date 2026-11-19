"""Turns the raw Higgsfield images into usable maps:
 - tileables: seamless colour (half-offset blend) + normal map from high-passed luminance
 - decals: background removed by flood fill → RGBA
 - irises: cropped square, kept as-is (white sclera outside)
Run: python3 -I characters/build/prep_textures.py <raw_dir> <out_dir>"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
TILE = ['suit_wool', 'shirt_cotton', 'tie_silk', 'khaki_twill', 'leather_black', 'leather_brown', 'skin_pores']
DECAL = {'rank_board': 34, 'collar_tab': 34, 'ribbons': 40, 'cap_badge': 60}


def seamless(a, feather=0.2):
    h, w = a.shape[:2]
    b = np.roll(a, (h // 2, w // 2), (0, 1))
    y = np.minimum(np.arange(h), h - 1 - np.arange(h)) / (h * feather)
    x = np.minimum(np.arange(w), w - 1 - np.arange(w)) / (w * feather)
    m = np.clip(np.minimum(y[:, None], x[None, :]), 0, 1)
    m = m * m * (3 - 2 * m)
    return a * m[..., None] + b * (1 - m[..., None])


def normal_from(a, strength=3.0, radius=18):
    lum = (a[..., 0] * 0.3 + a[..., 1] * 0.59 + a[..., 2] * 0.11) / 255.0
    low = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius)), dtype=np.float64) / 255
    hgt = lum - low
    dx = (np.roll(hgt, -1, 1) - np.roll(hgt, 1, 1)) * 0.5 * strength
    dy = (np.roll(hgt, -1, 0) - np.roll(hgt, 1, 0)) * 0.5 * strength
    n = np.dstack([-dx, dy, np.ones_like(dx)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return ((n * 0.5 + 0.5) * 255).astype(np.uint8)


for name in TILE:
    a = np.asarray(Image.open(os.path.join(RAW, name + '.png')).convert('RGB'), dtype=np.float64)
    t = seamless(a)
    Image.fromarray(t.clip(0, 255).astype(np.uint8)).save(os.path.join(OUT, name + '.jpg'), quality=93)
    Image.fromarray(normal_from(t, 6.0 if 'leather' in name or name == 'skin_pores' else 3.0)).save(os.path.join(OUT, name + '_n.png'))
    print('tile', name)

for name, tol in DECAL.items():
    im = Image.open(os.path.join(RAW, name + '.png')).convert('RGB')
    w, h = im.size
    mark = im.copy()
    for c in [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]:
        ImageDraw.floodfill(mark, c, (255, 0, 255), thresh=tol)
    m = np.asarray(mark, dtype=np.int32)
    bg = (m[..., 0] == 255) & (m[..., 1] == 0) & (m[..., 2] == 255)
    alpha = Image.fromarray(((~bg) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
    rgba = im.copy()
    rgba.putalpha(alpha)
    bbox = alpha.point(lambda v: 255 if v > 20 else 0).getbbox()
    rgba = rgba.crop(bbox)
    rgba.save(os.path.join(OUT, name + '.png'))
    print('decal', name, rgba.size)

for name in ['iris_blue', 'iris_brown']:
    Image.open(os.path.join(RAW, name + '.png')).convert('RGB').save(os.path.join(OUT, name + '.jpg'), quality=95)
im = Image.open(os.path.join(RAW, 'cap_badge.png')).convert('RGB')
im.save(os.path.join(OUT, 'cap_badge.jpg'), quality=93)
# plain red band wool from the badge's corners (no embroidery), made seamless
a = np.asarray(im, dtype=np.float64)[:160, :160]
band = seamless(np.asarray(Image.fromarray(a.astype(np.uint8)).resize((512, 512), Image.LANCZOS), dtype=np.float64))
Image.fromarray(band.clip(0, 255).astype(np.uint8)).save(os.path.join(OUT, 'red_wool.jpg'), quality=92)
print('done')
