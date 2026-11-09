# Turns the people in each generated frame into matte white clay (reference look):
# human segmentation (rembg u2net_human_seg) -> luminance-shaded warm-white material, soft edge blend.
import sys, numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session
src, dst = sys.argv[1], sys.argv[2]
sess = new_session(sys.argv[3] if len(sys.argv) > 3 else "u2net_human_seg")
im = Image.open(src).convert("RGB")
m = remove(im, session=sess, only_mask=True, post_process_mask=True).filter(ImageFilter.GaussianBlur(1.5))
a = np.asarray(im).astype(np.float32) / 255.0
mask = np.asarray(m).astype(np.float32)[..., None] / 255.0
L = (0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2])[..., None]
lo, hi = np.percentile(L[mask[..., 0] > 0.5], [3, 97]) if (mask > 0.5).any() else (0.0, 1.0)
s = np.clip((L - lo) / max(1e-3, hi - lo), 0, 1)
s = 0.38 + 0.62 * (s ** 0.8)                          # keep form shading, lift into plaster range
clay = s * np.array([0.95, 0.93, 0.89])                # warm white plaster
out = a * (1 - mask) + clay * mask
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(dst, quality=93)
print("clay", dst, round(float(mask.mean()), 3))
