# Builds assets/audio/sfx.m4a from Mixkit clips (free licence) placed on the scene timing.
import subprocess, numpy as np, wave, sys, os, json, re
SR = 48000; D = sys.argv[1]; out = sys.argv[2]
html = open(os.path.join(os.path.dirname(__file__), "..", "index.html"), encoding="utf-8").read()
SC = json.loads(re.search(r"const D = (\[.*?\]);\n", html, re.S).group(1))
END = SC[-1]["t1"]; N = int(SR * END)
cache = {}
def load(name):
    if name not in cache:
        r = subprocess.run(["ffmpeg", "-v", "error", "-i", D + name + ".mp3", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
        x = np.frombuffer(r, dtype=np.float32).reshape(-1, 2).astype(np.float64)
        nz = np.where(np.abs(x).max(1) > 0.003)[0]
        if len(nz): x = x[nz[0]:]
        cache[name] = x / (np.abs(x).max() + 1e-9)
    return cache[name]
mix = np.zeros((N, 2))
def put(t, name, db, maxlen=None, fade=0.25):
    x = load(name).copy()
    if maxlen: x = x[: int(maxlen * SR)]
    nf = min(len(x), int(fade * SR))
    if nf > 0: x[-nf:] *= np.linspace(1, 0, nf)[:, None]
    a = int(t * SR); b = min(N, a + len(x)); mix[a:b] += x[: b - a] * 10 ** ((db + 4) / 20)

for sc in SC:
    k, t0 = sc["kind"], sc["t0"]
    if k == "intro":
        put(0.0, "electric_whoosh", -20, 1.8, 0.6)
        for i in range(8): put(0.05 + i * 0.16, "pop_light", -27)
        put(1.6, "glitch_buzz", -26, 0.5); put(2.1, "glitch_buzz", -27, 0.4)
    elif k == "item":
        put(t0, "swoosh_fast", -23, 0.7)            # medallion flip
        put(t0 + 0.06, "sci_click", -25, 0.4)        # dial tick
        put(t0 + 0.12, "ui_select", -25, 0.6)        # heading tab
        if sc["icon"] in ("p2_1", "p2_14", "p3_7", "p1_14", "p1_7"):
            put(sc["s"] + 0.3 * (sc["e"] - sc["s"]), "glitch_buzz", -27, 0.4)
    elif k == "div":
        put(t0, "tunnel", -18, 2.6, 0.9)
        put(t0 + 0.1, "sweep", -20, 1.0)
        put(sc["s"] + 0.1 * (sc["e"] - sc["s"]), "glitch_buzz", -24, 0.5)
    elif k == "concl":
        put(t0, "tunnel", -19, 2.4, 0.9); put(t0 + 0.1, "ui_select", -22, 0.6)
        for t in (214.5, 216.26, 217.16, 218.92): put(t, "bubble_pop", -21)
        put(222.5, "crumple", -17, 0.9); put(222.55, "glitch_buzz", -24, 0.4)
        put(223.6, "papers_moved", -22, 1.0)
        for r in sc["rows"]: put(r[1], "pop_light", -21); put(r[1] + 0.05, "swoosh_fast", -26, 0.5)
    elif k == "outro":
        put(t0, "electric_whoosh", -18, 1.6, 0.6)
        put(t0 + 0.5, "sparkle", -20, 2.2, 0.8)
        put(t0 + 1.3, "confirm", -20, 1.6, 0.5)
pk = np.abs(mix).max()
if pk > 0.95: mix *= 0.95 / pk
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
print("peak", round(20 * np.log10(pk + 1e-9), 1), "dBFS")
