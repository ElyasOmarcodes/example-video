# depth for each cut face (run in the diffusers/transformers venv)
import sys, glob, os, numpy as np, torch
from PIL import Image, ImageFilter
from transformers import pipeline
torch.set_num_threads(4)
dep = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="cpu")
for f in sorted(glob.glob(sys.argv[1] + "/*.png")):
    if f.endswith("_d.png"): continue
    rgba = np.asarray(Image.open(f)); a = rgba[..., 3].astype(np.float32) / 255
    c = Image.fromarray(rgba[..., :3])
    d = dep(c)["predicted_depth"].squeeze().float().numpy()
    d = np.asarray(Image.fromarray(d).resize((256, 320), Image.BICUBIC))
    sel = a > 0.5
    lo, hi = (np.percentile(d[sel], 2), np.percentile(d[sel], 99.5)) if sel.any() else (d.min(), d.max())
    dn = np.clip((d - lo) / (hi - lo + 1e-6), 0, 1) * (a > 0.05)
    Image.fromarray((dn * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0)).save(f[:-4] + "_d.png"); print("depth", os.path.basename(f), flush=True)
