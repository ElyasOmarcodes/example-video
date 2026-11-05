# Generates index.html from data.py + the voiceover segment timing.
# Run: python3 -I tools/build.py   (from the project folder)
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from data import TITLE, P1, P2, P3, DIV2, DIV3, CONCL_A, CONCL_B, SLOGAN  # noqa: E402

# speech segments measured with silencedetect (-35 dB, 0.35 s) on the voiceover
SEGS = [(0, 4.15), (4.76, 8.56), (9.18, 12.97), (13.59, 17.25), (17.94, 22.34), (23.04, 26.6), (27.05, 31.76), (32.35, 35.93), (36.69, 40.05), (40.68, 44.99), (45.71, 49.64), (50.35, 55.23), (56.01, 60.1), (61.0, 65.52), (66.39, 71.31), (72.34, 75.4), (76.04, 79.38), (79.96, 83.04), (83.54, 87.08), (87.63, 92.27), (92.88, 97.9), (98.56, 102.99), (103.53, 107.75), (108.37, 113.81), (114.41, 117.53), (118.28, 123.1), (123.67, 128.9), (129.5, 134.42), (135.0, 139.94), (140.44, 146.94), (147.49, 150.79), (151.46, 157.23), (158.01, 162.89), (163.6, 169.53), (170.25, 177.46), (178.17, 182.31), (182.97, 188.69), (189.27, 195.29), (196.01, 200.5), (201.36, 207.84), (208.49, 214.35)]
CON_T0, OUT_T0, END = 214.42, 232.85, 238.0
bounds = [0] + [round((SEGS[i][1] + SEGS[i + 1][0]) / 2, 2) for i in range(len(SEGS) - 1)] + [CON_T0]

scenes = []
order = [("intro", None)] + [("item", (1, i)) for i in range(14)] + [("div", 2)] + [("item", (2, i)) for i in range(14)] + [("div", 3)] + [("item", (3, i)) for i in range(10)]
for k, (kind, ref) in enumerate(order):
    s, e = SEGS[k]
    sc = dict(kind=kind, t0=bounds[k], t1=bounds[k + 1], s=s, e=e)
    if kind == "intro":
        sc.update(text=TITLE, icon="intro")
    elif kind == "div":
        h, t = DIV2 if ref == 2 else DIV3
        sc.update(sec=ref, head=h, text=t, icon="div%d" % ref)
    else:
        sec, i = ref
        lst = {1: P1, 2: P2, 3: P3}[sec]
        sc.update(sec=sec, n=i + 1, N=len(lst), head=lst[i][0], text=lst[i][1], icon="p%d_%d" % (sec, i + 1))
    scenes.append(sc)
scenes.append(dict(kind="concl", t0=CON_T0, t1=OUT_T0, head="پایله", textA=CONCL_A, spanA=[[214.5, 215.95], [216.26, 223.3]], rows=CONCL_B))
scenes.append(dict(kind="outro", t0=OUT_T0, t1=END, text=SLOGAN))

sections = []
for k, sc in enumerate(scenes):
    sections.append('      <section id="s%d" class="clip scene" data-start="%.2f" data-duration="%.2f" data-track-index="%d"><div class="cam" id="c%d"></div></section>' % (k, sc["t0"], round(sc["t1"] - sc["t0"], 2), 1 + k % 2, k))

tpl = open(os.path.join(HERE, "template.html"), encoding="utf-8").read()
html = tpl.replace("%%SECTIONS%%", "\n".join(sections)).replace("%%DATA%%", json.dumps(scenes, ensure_ascii=False)).replace("%%END%%", "%g" % END).replace("%%OUT%%", "%g" % OUT_T0)
open(os.path.join(HERE, "..", "index.html"), "w", encoding="utf-8").write(html)
print("scenes", len(scenes), "end", END)
