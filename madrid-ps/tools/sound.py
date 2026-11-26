"""Soundtrack → audio/mix.wav (48 kHz stereo, −14 LUFS).
Narration (news_studio_strong) starts after the logo sting (LEAD). The calm ElevenLabs score (Higgsfield)
is looped from its own body with equal-power seams, levelled so it never creeps up, ducked under speech
and faded out on the end card. Soft, dignified effects follow data/cues.json, which the page dumps
(tools/cues.mjs), so every sound sits on its frame."""
import json, os, subprocess
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SR = 48000
C = json.load(open(f'{ROOT}/data/cues.json'))
LEAD, DUR, VE = C['lead'], C['duration'], C['ve']
N = int(DUR * SR) + SR
T = np.arange(N) / SR


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


db = lambda x: 10 ** (x / 20)
rms_db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


def place(bus, clip, t, gain_db=0.0, fade_in=0.0, fade_out=0.0, pan=0.0, length=None):
    s = int(round(t * SR))
    c = (clip if length is None else clip[: int(length * SR)]).copy()
    if fade_in > 0:
        n = min(len(c), int(fade_in * SR)); c[:n] *= np.linspace(0, 1, n)[:, None]
    if fade_out > 0:
        n = min(len(c), int(fade_out * SR)); c[-n:] *= np.linspace(1, 0, n)[:, None]
    c *= db(gain_db)
    if pan:
        c[:, 0] *= np.sqrt(1 - pan); c[:, 1] *= np.sqrt(1 + pan)
    if s < 0:
        c = c[-s:]; s = 0
    e = min(len(bus), s + len(c))
    if e > s:
        bus[s:e] += c[: e - s]


def movavg(x, k):
    c = np.cumsum(np.concatenate([[0.0], x.astype(np.float64)]))
    y = (c[k:] - c[:-k]) / k
    pad = len(x) - len(y)
    return np.concatenate([np.full(pad // 2, y[0]), y, np.full(pad - pad // 2, y[-1])]).astype(np.float32)


# ------------------------------------------------------------------ narration
voice = np.zeros((N, 2), np.float32)
v = load(f'{ROOT}/audio/voice.mp3')
place(voice, v, LEAD)
sp = voice[np.abs(voice[:, 0]) > 0.01]
voice *= db(-16.5 - rms_db(sp))

# ------------------------------------------------------------------ score: looped body, equal-power seams
sc = load(f'{ROOT}/audio/score.mp3')
BODY = int(146 * SR)
XF = int(3.0 * SR)
out = sc[:BODY].copy()
starts = [24, 46, 12, 60, 34, 8]
i = 0
while len(out) < N + SR:
    seg = sc[int(starts[i % len(starts)] * SR):BODY].copy()
    i += 1
    r = np.linspace(0, 1, XF)[:, None]
    out[-XF:] = out[-XF:] * np.cos(r * np.pi / 2) + seg[:XF] * np.sin(r * np.pi / 2)
    out = np.concatenate([out, seg[XF:]])
mus = out[:N].copy()
# slow leveller: the bed keeps one level from start to end
_m = mus.mean(1) ** 2; _w = int(3 * SR)
_r = np.sqrt(np.convolve(_m, np.ones(_w) / _w, 'same')) + 1e-6
_ref = np.median(_r[int(10 * SR):int(120 * SR)])
_g = movavg(np.minimum(1.0, _ref / _r), int(1.5 * SR))
mus *= _g[:, None]
env = movavg(np.abs(voice[:, 0]), int(0.25 * SR))
speech = movavg(np.clip(env / 0.02, 0, 1), int(0.7 * SR))
duck = db(-8) * speech + (1 - speech)
lift = np.ones(N)
lift[T < LEAD] = db(2)
lift[T > VE + 0.2] = db(2)
lift = movavg(lift, int(0.8 * SR))
fade = np.clip(T / 1.2, 0, 1) * np.clip((DUR - T) / 3.0, 0, 1)
mus *= (duck * lift * fade)[:, None]
mus *= db(-26 - rms_db(mus[int(10 * SR):int(200 * SR)]))

# ------------------------------------------------------------------ synthesized UI sounds (clean, soft)
def tone(f0, f1, dur, decay, noise=0.0, seed=0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t * decay)
    if noise:
        rng = np.random.default_rng(seed)
        y += rng.standard_normal(n) * noise * np.exp(-t * decay * 2.5)
    a = int(0.003 * SR); y[:a] *= np.linspace(0, 1, a)
    y /= np.max(np.abs(y)) + 1e-9
    return np.stack([y, y], 1).astype(np.float32) * 0.9


def swish(dur=0.35, seed=1):
    n = int(dur * SR); rng = np.random.default_rng(seed)
    x = rng.standard_normal(n)
    x = movavg(x, 9) - movavg(x, 60)            # crude band-pass
    env = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    y = x * env; y /= np.max(np.abs(y)) + 1e-9
    return np.stack([y, y], 1).astype(np.float32) * 0.8


SY = {'pop': tone(720, 360, 0.12, 38), 'pop_hi': tone(1100, 650, 0.09, 45), 'ping': tone(1320, 1300, 0.9, 6), 'blip': tone(1760, 1740, 0.25, 18),
      'thud': tone(140, 55, 0.35, 12, noise=0.25), 'swish': swish(), 'tick': tone(2400, 2200, 0.03, 120, noise=0.3)}
S = {f[:-4]: load(f'{ROOT}/audio/sfx/{f}') for f in os.listdir(f'{ROOT}/audio/sfx') if f.endswith('.mp3')}
for k, x in S.items():
    S[k] = x / (np.max(np.abs(x)) + 1e-9) * 0.9
S.update(SY)
fx = np.zeros((N, 2), np.float32)
cue = lambda name, at, g, **kw: place(fx, S[name], at, g, **kw)
last = {}
def ok(kind, t, gap):
    if t - last.get(kind, -9) < gap:
        return False
    last[kind] = t
    return True
for c in sorted(C['cues'], key=lambda c: c['t']):
    k, t = c['kind'], c['t']
    if k == 'open':
        cue('swoosh_myst', t - 0.25, -25, fade_out=0.3)
        cue('drum_subtle', t + 0.45, -26)
    elif k == 'head' and t > LEAD - 0.2 and ok(k, t, 0.6):
        cue('swish', t - 0.05, -33)
    elif k == 'pop' and ok(k, t, 0.14):
        cue('pop', t + 0.06, -29)
    elif k == 'soft' and ok(k, t, 0.3):
        cue('swish', t, -35)
    elif k == 'tick' and ok(k, t, 0.1):
        cue('tick', t, -31)
    elif k == 'mark':
        cue('select_ui', t, -28)
    elif k == 'nope':
        cue('click_ui', t, -25); cue('thud', t, -31)
    elif k == 'strike':
        cue('paper_slide', t, -27)
    elif k == 'route' and ok(k, t, 0.4):
        cue('whoosh_fast', t, -31, fade_out=0.2)
    elif k == 'pin' and ok(k, t, 0.25):
        cue('blip', t, -30)
    elif k == 'flow':
        cue('swoosh_myst', t, -27, fade_out=0.4)
    elif k == 'swap' and ok(k, t, 0.5):
        cue('whoosh_fast2', t - 0.1, -33)
# logo sting before the narration, and the end card
cue('swoosh_slow', 0.0, -24, fade_out=0.3)
cue('drum_subtle', 0.72, -20); cue('pop', 0.75, -25)
cue('impact_deep', 1.12, -25); cue('ping', 1.15, -25)
cue('whoosh_fast2', 1.42, -28)
cue('swoosh_slow', LEAD - 1.05, -29, fade_out=0.3)
cue('swoosh_slow', VE + 0.25, -25, fade_out=0.3)
cue('impact_deep', VE + 1.15, -25); cue('ping', VE + 1.2, -25)

# ------------------------------------------------------------------ master
mix = voice + mus + fx
peak = np.max(np.abs(mix))
if peak > 0.98:
    mix *= 0.98 / peak
os.makedirs(f'{ROOT}/audio', exist_ok=True)
tmp = f'{ROOT}/audio/mix_raw.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_f32le', tmp], input=mix.astype(np.float32).tobytes(), check=True)
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', af, '-ar', str(SR), '-c:a', 'pcm_s24le', f'{ROOT}/audio/mix.wav'], check=True)
os.remove(tmp)
print('mix ok', round(DUR, 2), 'measured', j['input_i'])
