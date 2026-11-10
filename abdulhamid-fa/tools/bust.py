# Sultan close-up from his real 1907 likeness: SDXL-Turbo img2img (structure kept) -> white plaster bust.
import torch, sys
from PIL import Image
from diffusers import AutoPipelineForImage2Image
torch.set_num_threads(4)
src = Image.open(sys.argv[1]).convert("RGB")
W, H = src.size
crop = src.crop((int(W * 0.26), 0, int(W * 0.88), int(H * 0.98))).resize((640, 1008), Image.LANCZOS)
crop.save(sys.argv[2] + "_src.png")
pipe = AutoPipelineForImage2Image.from_pretrained("/tmp/claude-0/ah/sdxlt", torch_dtype=torch.bfloat16, variant="fp16")
prompt = "white marble bust sculpture of an elderly ottoman sultan with a tall fez and a full thick beard, large hooked nose, heavy eyebrows, military coat with epaulettes, matte white plaster statue, museum lighting, dark background, photorealistic 3d render"
for st, sd in [(0.5, 3), (0.6, 5), (0.7, 9)]:
    g = torch.Generator("cpu").manual_seed(sd)
    im = pipe(prompt, image=crop, strength=st, num_inference_steps=int(round(2 / st)) + 2, guidance_scale=0.0, generator=g).images[0]
    im.save(f"{sys.argv[2]}_{int(st*100)}.png"); print("done", st, flush=True)
