# Runs OpenMontage's local_diffusion tool (SDXL-Turbo, bf16 on CPU) for each shot prompt.
import sys, json, os, time
OM = "/tmp/claude-0/ah/om/OpenMontage"
sys.path.insert(0, OM)
import torch
import tools.graphics.local_diffusion as ld
from diffusers import AutoPipelineForText2Image
ld.select_device = lambda torch: ("cpu", torch.bfloat16)          # AMX bf16 CPU
_orig = AutoPipelineForText2Image.from_pretrained
def _fp(*a, **k):
    k.setdefault("variant", "fp16"); return _orig(*a, **k)
AutoPipelineForText2Image.from_pretrained = _fp
torch.set_num_threads(4)
P = json.load(open(sys.argv[1])); outdir = sys.argv[2]; keys = sys.argv[3].split(",") if len(sys.argv) > 3 else list(P["shots"])
seeds = [int(s) for s in (sys.argv[4].split(",") if len(sys.argv) > 4 else ["7"])]
tool = ld.LocalDiffusion() if hasattr(ld, "LocalDiffusion") else [v for v in vars(ld).values() if isinstance(v, type) and hasattr(v, "execute") and v.__module__ == ld.__name__][0]()
for k in keys:
    for sd in seeds:
        t = time.time()
        r = tool.execute({"prompt": P.get("prefix", "") + P["shots"][k] + ", " + P["style"], "negative_prompt": P["negative"], "width": 576, "height": 1024,
                          "model": "/tmp/claude-0/ah/sdxlt", "num_inference_steps": int(os.environ.get("STEPS", "4")), "guidance_scale": float(os.environ.get("CFG", "0")), "seed": sd,
                          "output_path": os.path.join(outdir, f"{k}_{sd}.png")})
        print(k, sd, r.success, r.error, round(time.time() - t, 1), flush=True)
