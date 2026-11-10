# Face relief assets: crop head (incl. hat and beard), cut out with rembg, depth with Depth-Anything-V2.
import sys, json, numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session
D = "/tmp/claude-0/ah/faces/"; OUT = sys.argv[1]
jobs = {"sultan": ("sultan_src.jpg", (0.28, 0.02, 0.71, 0.54)), "herzl": ("herzl.jpg", (0.33, 0.20, 0.68, 0.55)), "karasu": ("karasu.jpg", (0.335, 0.075, 0.655, 0.59)), "shevket": ("shevket.jpg", (0.34, 0.035, 0.72, 0.41))}
for k in ["deputy_3", "deputy_8", "esad_8", "hodja_3", "hodja_8", "officer2_8", "officer_3", "official_8", "soldier2_8", "soldier_3", "soldier_8", "soldier2_3"]:
    jobs[k] = ("f_" + k + ".png", (0.2, 0.0, 0.8, 0.72 if k.startswith("hodja") or k.startswith("deputy") else 0.64))
seg = new_session("u2net_human_seg")
for name, (f, (x0, y0, x1, y1)) in jobs.items():
    im = Image.open(D + f).convert("RGB"); W, H = im.size
    mask = remove(im, session=seg, only_mask=True, post_process_mask=True)
    box = (int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H))
    c, m = im.crop(box).resize((256, 320), Image.LANCZOS), mask.crop(box).resize((256, 320), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
    a = np.asarray(m).astype(np.float32) / 255 * np.clip((320 - np.arange(320)) / 40.0, 0, 1)[:, None]
    Image.fromarray(np.dstack([np.asarray(c), (a * 255).astype(np.uint8)]), "RGBA").save(f"{OUT}/{name}.png"); print("cut", name, flush=True)
