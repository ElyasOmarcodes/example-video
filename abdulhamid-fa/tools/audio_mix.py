# Builds assets/audio/music.m4a and sfx.m4a. Cues come from the composition (tools/cues.json),
# plus train sounds placed on the railway shots. Usage: python3 -I tools/audio_mix.py <sfx_dir> <music.mp3>
import subprocess, numpy as np, wave, sys, os, json, re
SR = 48000; D, MUSIC = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
R = json.loads(re.search(r"const D = (\[.*?\]);\n", html, re.S).group(1))
END = float(re.search(r"const END = ([0-9.]+);", html).group(1)); N = int(SR * END)
def load(p):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(r, dtype=np.float32).reshape(-1, 2).astype(np.float64)
cache = {}
def clip(n):
    if n not in cache:
        p = os.path.join(D, n + (".m4a" if n == "map_draw" else ".mp3"))
        x = load(p); nz = np.where(np.abs(x).max(1) > 0.003)[0]
        if len(nz): x = x[nz[0]:]
        cache[n] = x / (np.abs(x).max() + 1e-9)
    return cache[n]
mix = np.zeros((N, 2))
def put(t, n, db, ml=1.5, fade=0.3):
    x = clip(n)[: int(ml * SR)].copy(); nf = min(len(x), int(fade * SR))
    if nf: x[-nf:] *= np.linspace(1, 0, nf)[:, None]
    a = int(t * SR); b = min(N, a + len(x))
    if a < N: mix[a:b] += x[: b - a] * 10 ** ((db - 12) / 20)
for t, n, db in json.load(open(os.path.join(HERE, "cues.json"))): put(t, n, db, 2.0 if n in ("deep_impact", "map_draw") else 1.2)
byid = {r["id"]: r for r in R}
put(byid["s02"]["t0"], "steam_pass", -8, 5.5, 1.5)
put(byid["s10"]["t0"], "departure", -8, 4.8, 1.2)
put(byid["s15"]["t0"] + 0.4, "station_wait", -12, 6, 1.5)
put(byid["s15"]["vs"] + byid["s15"]["vd"] - 0.6, "door_close", -6, 2)
put(byid["s16"]["t0"] + 0.3, "horn", -10, 4, 1)
put(byid["s16"]["t0"] + 1.0, "departure", -10, 9, 2.5)
pk = np.abs(mix).max()
if pk > 0.9: mix *= 0.9 / pk
def write(p, x):
    with wave.open(p, "wb") as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
write("/tmp/claude-0/ah/sfx.wav", mix)
m = load(MUSIC)[: N]
if len(m) < N: m = np.concatenate([m, np.zeros((N - len(m), 2))])
t = np.arange(N) / SR
g = np.full(N, 10 ** (-17 / 20))
last = byid["s17"]["t0"]; g[t > last] = 10 ** (-10 / 20)
g *= np.clip((END - t) / 2.5, 0, 1) * np.clip(t / 1.0, 0, 1)
write("/tmp/claude-0/ah/music.wav", m * g[:, None])
print("ok", END)
