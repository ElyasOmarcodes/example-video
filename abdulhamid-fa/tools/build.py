# Builds index.html (HyperFrames) from the OpenMontage artifacts:
#   openmontage/artifacts/script.json   — shots, narration, overlays
#   openmontage/artifacts/timeline.json — narration start/duration per shot (Piper TTS)
#   tools/map.json                      — Natural Earth map paths
# Run: python3 -I tools/build.py
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
S = json.load(open(os.path.join(ROOT, "openmontage/artifacts/script.json"), encoding="utf-8"))
TL = {t["id"]: t for t in json.load(open(os.path.join(ROOT, "openmontage/artifacts/timeline.json")))}
MAP = json.load(open(os.path.join(HERE, "map.json"), encoding="utf-8"))
shots = S["shots"]
rows = []
for i, s in enumerate(shots):
    t = TL[s["id"]]
    start = 0.0 if i == 0 else round(t["start"] - 0.18, 3)
    rows.append(dict(s, vs=t["start"], vd=t["dur"], t0=start))
END = round(rows[-1]["vs"] + rows[-1]["vd"] + 2.6, 2)
for i, r in enumerate(rows):
    r["t1"] = rows[i + 1]["t0"] if i + 1 < len(rows) else END
# merge the two map shots into one continuous scene element (keeps the map camera move unbroken)
sections = []
for i, r in enumerate(rows):
    sections.append(f'      <section id="s{i}" class="clip scene" data-start="{r["t0"]}" data-duration="{round(r["t1"] - r["t0"], 3)}" data-track-index="{1 + i % 2}"><div class="cam" id="c{i}"></div></section>')
tpl = open(os.path.join(HERE, "template.html"), encoding="utf-8").read()
html = (tpl.replace("%%SECTIONS%%", "\n".join(sections)).replace("%%DATA%%", json.dumps(rows, ensure_ascii=False))
        .replace("%%MAP%%", json.dumps(MAP, ensure_ascii=False)).replace("%%END%%", str(END)).replace("%%CHIP%%", S["series_chip"]))
open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(html)
print("shots", len(rows), "end", END)
