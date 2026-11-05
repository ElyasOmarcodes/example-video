# Builds assets/audio/sfx.m4a (cue list exported from the composition + scene extras) and
# assets/audio/music.m4a (Mixkit "Echoes", arranged to the film length, kept low under the voice).
# Usage: python3 -I tools/sfx_mix.py <mixkit_sfx_dir> <music_mp3> <out_dir>
import subprocess, numpy as np, wave, sys, os, json, re
SR = 48000
D, MUSIC, OUTD = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(HERE, "..", "index.html"), encoding="utf-8").read()
SC = json.loads(re.search(r"const D = (\[.*?\]);\n", html, re.S).group(1))
END = SC[-1]["t1"]; N = int(SR * END)
CUES = json.load(open(os.path.join(HERE, "cues.json")))

def load(path):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(r, dtype=np.float32).reshape(-1, 2).astype(np.float64)
cache = {}
def clip(name):
    if name not in cache:
        x = load(os.path.join(D, name + ".mp3"))
        nz = np.where(np.abs(x).max(1) > 0.003)[0]
        if len(nz): x = x[nz[0]:]
        cache[name] = x / (np.abs(x).max() + 1e-9)
    return cache[name]
mix = np.zeros((N, 2))
def put(t, name, db, maxlen=1.2, fade=0.2):
    x = clip(name).copy()
    if maxlen: x = x[: int(maxlen * SR)]
    nf = min(len(x), int(fade * SR))
    if nf > 0: x[-nf:] *= np.linspace(1, 0, nf)[:, None]
    a = int(t * SR); b = min(N, a + len(x))
    if a < N: mix[a:b] += x[: b - a] * 10 ** ((db - 14) / 20)

POPS = ["dry_pop", "msg_pop2", "ui_option", "bubble_alert"]
LONG = {"cine_whoosh": 1.4, "deep_impact": 2.4, "logo_impact": 2.5, "glass_break": 1.6, "crumple_quick": 1.0, "air_zoom": 1.0}
k = 0
for t, name, db in CUES:
    if name == "dry_pop": name = POPS[k % 4]; k += 1; db -= 3
    put(t, name, db, LONG.get(name, 1.0))

# scene-specific extras (icon, fraction of the spoken line, clip, dB, max length)
EXTRA = [("p1_1", 0.62, "key_lock", -6, 1.0), ("p1_2", 0.15, "coins_clink", -8, 1.4), ("p1_2", 0.6, "coins_handle", -10, 1.2),
         ("p1_10", 0.5, "coins_clink", -9, 1.2), ("p1_12", 0.35, "key_lock", -6, 1.0), ("p2_3", 0.05, "footsteps", -12, 3.0),
         ("p2_4", 0.32, "sparks", -12, 0.8), ("p2_5", 0.3, "coins_handle", -9, 1.4), ("p2_10", 0.32, "sparks", -10, 1.0),
         ("p2_11", 0.0, "rain_light", -16, 4.0), ("p2_14", 0.3, "glass_break", -14, 1.2), ("p3_4", 0.05, "typing", -14, 3.0),
         ("p3_9", 0.25, "press_flashes", -14, 2.4), ("p3_7", 0.5, "crumple_quick", -10, 1.0), ("p1_7", 0.55, "glass_break", -16, 1.0),
         ("p2_1", 0.18, "glass_break", -13, 1.2), ("p3_1", 0.16, "paper_quick", -8, 0.8), ("p1_5", 0.35, "crumple_quick", -10, 0.8)]
for sc in SC:
    for icon, f, name, db, ml in EXTRA:
        if sc.get("icon") == icon:
            put(sc["s"] + f * (sc["e"] - sc["s"]), name, db, ml, 0.4)

pk = np.abs(mix).max()
if pk > 0.9: mix *= 0.9 / pk
def write(path, x):
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
write("/tmp/claude-0/hk/sfx.wav", mix)
print("sfx peak", round(20 * np.log10(np.abs(mix).max() + 1e-9), 1), "dBFS, cues", len(CUES))

# ---- music bed ----
m = load(MUSIC)
A_START, A_END, B_START, XF = 12.0, 92.0, 50.0, 3.0
a = m[int(A_START * SR): int(A_END * SR)].copy(); b = m[int(B_START * SR):].copy()
x0 = len(a) - int(XF * SR)
fade = np.linspace(0, 1, int(XF * SR))[:, None]
out = np.concatenate([a[:x0], a[x0:] * (1 - fade) + b[: len(fade)] * fade, b[len(fade):]])
if len(out) < N: out = np.concatenate([out, np.zeros((N - len(out), 2))])
out = out[:N]
t = np.arange(N) / SR
g = np.full(N, 10 ** (-12 / 20))                       # bed under the voice
ramp = (t > 232.0) & (t < 233.5); g[ramp] = 10 ** ((-12 + (t[ramp] - 232.0) / 1.5 * 6) / 20)
g[t >= 233.5] = 10 ** (-6 / 20)
g *= np.clip((END - t) / 3.0, 0, 1)                    # fade out over the last 3 s
g *= np.clip(t / 0.6, 0, 1)
out *= g[:, None]
write("/tmp/claude-0/hk/music.wav", out)
print("music peak", round(20 * np.log10(np.abs(out).max() + 1e-9), 1))
