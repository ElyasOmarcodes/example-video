"""Cuts the Higgsfield clay icons out of their light-grey studio backdrop.
Object matte = rembg isnet, hardened; backdrop = quadratic colour field fitted to the border strip; the soft contact shadow is kept as a translucent navy shadow.
hf/raw/*.png → web/assets/img/<name>.png (RGBA, 1024 px)"""
import glob, os, sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
from rembg import remove, new_session
SESSION = new_session('isnet-general-use')
OUT = 'web/assets/img'; os.makedirs(OUT, exist_ok=True)
def run(f):
    im = Image.open(f).convert('RGB').resize((1024, 1024), Image.LANCZOS)
    p = np.asarray(im, np.float32); H, W, _ = p.shape
    yy, xx = np.mgrid[0:H, 0:W] / np.array([H, W])[:, None, None]
    b = int(0.05 * W)
    m = np.zeros((H, W), bool); m[:b] = m[-b:] = True; m[:, :b] = m[:, -b:] = True
    A = np.stack([np.ones(m.sum()), xx[m], yy[m], xx[m] ** 2, yy[m] ** 2, xx[m] * yy[m]], 1)
    Af = np.stack([np.ones(H * W), xx.ravel(), yy.ravel(), xx.ravel() ** 2, yy.ravel() ** 2, (xx * yy).ravel()], 1)
    bg = np.zeros_like(p)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, p[..., c][m], rcond=None)
        bg[..., c] = (Af @ coef).reshape(H, W)
    d = np.abs(p - bg).max(-1)
    lum, blum = p.mean(-1), bg.mean(-1)
    dark = np.clip(blum - lum, 0, None)
    # chroma difference ignores pure shading (shadows are darker but same hue)
    chroma = np.abs((p - lum[..., None]) - (bg - blum[..., None])).max(-1)
    low = (d < 12) | ((chroma < 7) & (dark > 3) & (dark < 70) & (lum > 95))
    # object mask: rembg (isnet) matte, hardened so pale clay parts stay opaque, holes filled
    ra = np.asarray(remove(im, session=SESSION, only_mask=True), np.float32) / 255
    fg = ndi.binary_fill_holes(ra > 0.22)
    fg = ndi.binary_opening(fg, iterations=1)
    # soft edge: distance-based feather of 1.5 px
    dist_in = ndi.distance_transform_edt(fg)
    dist_out = ndi.distance_transform_edt(~fg)
    a_obj = np.clip(0.5 + (dist_in - dist_out) / 2.0, 0, 1)
    # shadow from luminance drop in the background region
    a_sh = np.clip(dark / 55.0, 0, 1) ** 1.2 * 0.55
    a_sh = ndi.gaussian_filter(a_sh, 2) * (1 - a_obj)
    alpha = a_obj + a_sh
    shadow_col = np.array([18, 26, 60], np.float32)
    rgb = np.where(a_obj[..., None] > 0.5, p, shadow_col)
    out = np.dstack([rgb, np.clip(alpha, 0, 1) * 255]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(os.path.join(OUT, os.path.basename(f)), optimize=True)
fs = sys.argv[1:] or sorted(glob.glob('hf/raw/*.png'))
for f in fs:
    run(f); print(os.path.basename(f), flush=True)
