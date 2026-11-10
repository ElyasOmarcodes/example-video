import sys, numpy as np, torch
from PIL import Image
from transformers import pipeline
torch.set_num_threads(4)
p = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="cpu")
im = Image.open(sys.argv[1]).convert("RGB")
d = np.asarray(p(im)["predicted_depth"].squeeze().float().numpy())
d = (d - d.min()) / (d.max() - d.min() + 1e-6)
Image.fromarray((d * 255).astype(np.uint8)).resize(im.size, Image.BICUBIC).save(sys.argv[2])
print("depth ok", d.shape)
