# Second pass: whiten remaining skin/khaki-toned pixels (crowds the person mask misses) into plaster.
import sys, numpy as np
from PIL import Image, ImageFilter
im = Image.open(sys.argv[1]).convert("RGB")
a = np.asarray(im).astype(np.float32) / 255.0
hsv = np.asarray(im.convert("HSV")).astype(np.float32) / 255.0
h, s, v = hsv[..., 0] * 360, hsv[..., 1], hsv[..., 2]
m = ((h > 5) & (h < 48) & (s > 0.18) & (s < 0.62) & (v > 0.28)).astype(np.float32)
m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2))).astype(np.float32)[..., None] / 255.0
m *= float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
L = (0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2])[..., None]
clay = np.clip(0.3 + 0.75 * L, 0, 1) * np.array([0.95, 0.93, 0.89])
out = a * (1 - m) + clay * m
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(sys.argv[2], quality=93)
