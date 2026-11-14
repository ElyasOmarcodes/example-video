"""Sound for the sharfasad explainer: recorded effects + a very quiet news bed under the voice.

    python3 -I sfx/build.py <sfx_dir> <ticking.mp3> <riser.mp3> <news_bed.mp3>

Every time comes from timeline.json (the same file the picture reads). Design rules:
  * the voice-over is already mastered (-14 LUFS, -1.5 dBFS): it passes through untouched,
    no re-normalising, no compression, no saturation;
  * effects are real recordings (Mixkit), high-passed so nothing rumbles or breaks up on a
    phone speaker, and sit 20-30 dB under the voice;
  * few, weighty sounds: a deep hit per chapter, air for moves, a gavel-like knock for verdicts.
Writes public/final.wav (voice + effects + bed) and public/stems/{sfx,music}.wav.
"""
import json, os, subprocess, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX, TICK, RISER, MUSIC = sys.argv[1:5]
TL = json.load(open(os.path.join(ROOT, "timeline.json"), encoding="utf-8"))
END = TL["duration"]; N = int(SR * END)


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def filt(x, lo=None, hi=None):
    if lo: x = sosfilt(butter(2, lo, "highpass", fs=SR, output="sos"), x, axis=0)
    if hi: x = sosfilt(butter(2, hi, "lowpass", fs=SR, output="sos"), x, axis=0)
    return x


_cache = {}
def clip(name, path=None):
    if name not in _cache:
        x = load(path or os.path.join(SFX, name + ".mp3"))
        nz = np.where(np.abs(x).max(1) > 0.004)[0]
        if len(nz): x = x[nz[0]:]
        _cache[name] = x / (np.abs(x).max() + 1e-9)
    return _cache[name]


sfx = np.zeros((N, 2))
count = 0
TRIM = 3.0  # one fader for all effects, dB
def put(t, name, db, maxlen=1.2, fade=0.25, lo=130, hi=9500, pan=0.0, fin=0.004, path=None):
    """Place a recording at t seconds, `db` dBFS peak, trimmed/faded, band-limited, panned."""
    global count
    x = clip(name, path)[: int(maxlen * SR)].copy()
    x = filt(x, lo, hi)
    nf = min(len(x), int(fade * SR)); ni = min(len(x), int(fin * SR))
    if nf: x[-nf:] *= np.linspace(1, 0, nf)[:, None] ** 2
    if ni: x[:ni] *= np.linspace(0, 1, ni)[:, None]
    g = 10 ** ((db + TRIM) / 20)
    x[:, 0] *= g * min(1, 1 - pan); x[:, 1] *= g * min(1, 1 + pan)
    a = int(max(0, t) * SR); b = min(N, a + len(x))
    if a < N: sfx[a:b] += x[: b - a]
    count += 1


def knock(t, db=-23, pan=0.0):  # verdict tag lands: dry wooden knock, gavel-like
    put(t, "wood_hit", db, 0.5, 0.2, lo=110, hi=7000, pan=pan)


secs, Q, E, O = TL["sections"], TL["q"], TL["end"], TL["outro"]

# title: the rig lowers in; one soft pass of air on the way out
put(0.0, "cine_whoosh", -24, 1.4, 0.5)
put(TL["title"]["t1"] - 0.5, "air_woosh", -25, 1.3, 0.5)

for si, s in enumerate(secs):
    # chapter: air in, one deep hit as the numeral turns to face the lens
    put(s["t0"] - 0.3, "cine_whoosh", -25, 1.3, 0.5)
    put(s["t0"] + 0.12, "deep_impact", -19, 2.6, 1.2, lo=100, hi=6000)
    put(s["hb"] + 0.08, "air_zoom", -28, 0.9, 0.35)          # numeral docks into the tab
    put(s["t1"] - 0.5, "air_woosh", -26, 1.2, 0.5)           # chapter leaves
    bs = s["bullets"]
    for bi, b in enumerate(bs):
        a, d = b["a"], b["b"] - b["a"]
        if bi and s["n"] != 2:                                  # carousel turns to the next card
            put(a - 0.95, ["wind_swoosh", "fly_swoosh"][bi % 2], -27, 1.1, 0.45, pan=0.25)
        key = (s["n"], bi)
        if key == (1, 0):
            for ft in (0.7, 1.3, 1.65, 2.5): put(a + ft, "shutter", -27, 0.35, 0.1, pan=-0.15)
            knock(a + min(3.3, d * 0.5))
        elif key == (1, 1):
            put(a + 0.1, "sweep_small", -30, 0.8, 0.3)
        elif key == (1, 2):
            for i in range(3): put(a - 0.3 + i * 0.35, "paper_quick", -29, 0.6, 0.25, pan=0.2)
            knock(a + min(3.6, d * 0.55))
        elif s["n"] == 2:
            put(a + 0.3, "tw_soft", -24, 0.25, 0.08)
            if bi == 1: put(a - 0.1, "sweep_small", -29, 0.8, 0.3)
            if bi == 2: put(a + 0.2, "air_woosh", -29, 2.0, 0.9)
        elif key == (3, 0):
            put(a + 2.0, "papers_wind", -31, 1.6, 0.7)
            knock(a + min(3.9, d * 0.6))
        elif key == (3, 1):
            put(a + 1.4, "glass_break", -24, 1.3, 0.6, hi=8000)
            put(a + 2.7, "air_woosh", -29, 1.6, 0.7)
        elif key == (3, 2):
            knock(a + 1.7)
            fl = max(3.4, d * 0.62)
            put(a + fl, "fast_whoosh", -27, 1.0, 0.4)
        elif key == (3, 3):
            put(a + 1.1, "coins_clink", -29, 1.0, 0.4, pan=0.2)
            put(a + 3.6, "tw_hit", -27, 0.6, 0.25)
        elif key == (4, 0):
            put(a - 0.4, "wind_swoosh", -29, 1.2, 0.5, pan=-0.3)
        elif key == (4, 1):
            put(a + 1.75, "bag_drop", -21, 1.1, 0.5, lo=90, hi=6000)
        elif key == (4, 2):
            put(a + 0.3, "ticking", -30, min(d - 0.4, 9.5), 1.0, lo=300, hi=8000, path=TICK)
        elif key == (4, 3):
            for i in range(2): put(a + 1.6 + i * 0.7, "fly_swoosh", -29, 1.0, 0.4, pan=[0.5, -0.5][i])
            put(a + 3.2, "glass_break", -27, 1.1, 0.5, hi=7000)
        elif key == (5, 0):
            put(a + max(3, d * 0.6), "air_woosh", -29, 1.6, 0.7)
        elif key == (5, 1):
            for i in range(4): put(a + 1.3 + i * 0.55, "tw_soft", -23, 0.25, 0.08, pan=0.2)
            knock(a + 4.0)
        elif key == (5, 2):
            put(a + 2.0, "metal_woosh", -28, 0.5, 0.2)
            knock(a + 2.6)
        elif key == (5, 3):
            put(a + 1.2, "windy_swoosh", -32, 3.0, 1.4, lo=200, hi=5000)

# final question: a held breath, then the heaviest hit of the film
put(Q["t0"] - 1.6, "riser", -29, 1.7, 0.2, lo=200, hi=9000, fin=0.6, path=RISER)
put(Q["t0"] + 0.12, "deep_impact", -17, 3.2, 1.6, lo=100, hi=6000)
# closing statement
put(E["t0"] + 0.05, "cine_whoosh", -25, 1.3, 0.5)
knock(E["b"] - 0.55, -22)
# outro: the same cues as the earlier Hindukush infographic's end card
t0 = O["t0"]; T = t0 + 1.65
put(t0 + 0.05, "cine_whoosh", -19, 1.4, 0.5)
put(t0 + 0.5, "air_woosh", -23, 1.2, 0.5)
put(t0 + 0.95, "fast_whoosh", -21, 1.1, 0.4)
put(T, "logo_impact", -17, 2.6, 1.6, lo=95, hi=9000)
put(T + 0.05, "glitch_buzz", -26, 0.9, 0.3)

# ---- bed: the outlet's news track, looped with crossfades, far under the voice ----
m = load(MUSIC)
seg = m[int(2.0 * SR): int(59.0 * SR)]
XF = int(1.5 * SR); xf = np.linspace(0, 1, XF)[:, None]
bed = m[: int(59.0 * SR)].copy()
while len(bed) < N + SR:
    bed = np.concatenate([bed[:-XF], bed[-XF:] * (1 - xf) + seg[:XF] * xf, seg[XF:]])
bed = filt(bed[:N], 110, None)
t = np.arange(N) / SR
db = np.full(N, -29.0)
db = np.where(t < TL["title"]["t1"], -26.0 + (t / TL["title"]["t1"]) * -3.0, db)       # a little more presence under the title
r = (t > O["t0"] - 0.6) & (t < O["t0"] + 0.9); db[r] = -29 + (t[r] - (O["t0"] - 0.6)) / 1.5 * 10
db[t >= O["t0"] + 0.9] = -19.0
g = 10 ** (db / 20) * np.clip(t / 0.8, 0, 1) * np.clip((END - t) / 2.5, 0, 1)
bed *= g[:, None]

vo = load(os.path.join(ROOT, "public", "vo.mp3"))
voice = np.zeros((N, 2)); voice[: min(N, len(vo))] = vo[:N]
mix = voice + sfx + bed


def write(path, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR)
        i = np.ascontiguousarray(np.round(np.clip(x, -1, 1) * 8388607).astype("<i4"))
        w.writeframes(i.view(np.uint8).reshape(-1, 4)[:, :3].tobytes())


dbfs = lambda x: round(20 * np.log10(np.abs(x).max() + 1e-12), 1)
print(f"{count} effects | peaks: voice {dbfs(voice)}  sfx {dbfs(sfx)}  bed {dbfs(bed)}  sum {dbfs(mix)} dBFS")
over = np.abs(mix).max()
if over > 0.84:  # keep the voice's own headroom; scale the whole mix, never clip or limit
    mix *= 0.84 / over
    print("scaled by", round(20 * np.log10(0.84 / over), 2), "dB to keep -1.5 dBFS")
write(os.path.join(ROOT, "public", "stems", "sfx.wav"), sfx)
write(os.path.join(ROOT, "public", "stems", "music.wav"), bed)
write(os.path.join(ROOT, "public", "final.wav"), mix)
