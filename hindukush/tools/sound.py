"""Soundtrack → audio/mix.wav (48 kHz stereo, −14 LUFS).
Narration (studio master) starts at LEAD; the ElevenLabs score is looped from its own body with
equal-power seams and its real ending lands on the end card, ducked under speech; effects follow
data/cues.json, which the page itself dumps (tools/cues.mjs), so every pop sits on its frame."""
import json, os, subprocess
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SR = 48000
C = json.load(open(f'{ROOT}/data/cues.json'))
LEAD, DUR = C['lead'], C['duration']
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

# ------------------------------------------------------------------ score: looped body + real ending
sc = load(f'{ROOT}/audio/score.mp3')
XF = int(3.0 * SR)
END = sc[int(128 * SR):]                      # last ~22 s incl. the natural fade
need = N - len(END) + XF
out = sc[: int(128 * SR)].copy()
starts = [22, 36, 14, 48, 28, 8]
i = 0
while len(out) < need:
    seg = sc[int(starts[i % len(starts)] * SR): int(128 * SR)].copy()
    i += 1
    r = np.linspace(0, 1, XF)[:, None]
    out[-XF:] = out[-XF:] * np.cos(r * np.pi / 2) + seg[:XF] * np.sin(r * np.pi / 2)
    out = np.concatenate([out, seg[XF:]])
out = out[:need]
r = np.linspace(0, 1, XF)[:, None]
out[-XF:] = out[-XF:] * np.cos(r * np.pi / 2) + END[:XF] * np.sin(r * np.pi / 2)
score = np.concatenate([out, END[XF:]])[:N]
mus = np.zeros((N, 2), np.float32)
place(mus, score, 0.0)
env = movavg(np.abs(voice[:, 0]), int(0.25 * SR))
speech = movavg(np.clip(env / 0.02, 0, 1), int(0.7 * SR))
duck = db(-8) * speech + (1 - speech)
lift = np.ones(N)
lift[T < LEAD] = db(3)
lift[T > DUR - 5.0] = db(3)
fade_in = np.clip(T / 0.6, 0, 1)
mus *= (duck * lift * fade_in)[:, None]
mus *= db(-24 - rms_db(mus[int(20 * SR):int(200 * SR)]))

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

# transitions
WH = {'slide': [('whoosh_fast', -0.35, -21)], 'rise': [('whoosh_fast2', -0.3, -21)], 'iris': [('swoosh_myst', -0.6, -22), ('pop', 0.05, -26)],
      'zoom': [('whoosh_tunnel', -0.5, -21)], 'stack': [('swoosh_slow', -0.75, -22), ('paper_slide', 0.15, -26)], 'flip': [('whoosh_fast2', -0.25, -21), ('paper_slide', -0.05, -25)],
      'stripes': [('whoosh_wind', -0.55, -20), ('impact_deep', 0.0, -22)], 'wipe': [('whoosh_wind', -0.5, -21)], 'fade': [('swoosh_slow', -0.8, -27)]}
for x in C['tr']:
    m = (x['a'] + x['b']) / 2
    for name, off, g in WH[x['type']]:
        cue(name, m + off, g, fade_out=0.15)
# per-element cues (de-duplicated so stacked events do not pile up)
last = {}
def ok(kind, t, gap):
    if t - last.get(kind, -9) < gap:
        return False
    last[kind] = t
    return True
for c in sorted(C['cues'], key=lambda c: c['t']):
    k, t = c['kind'], c['t']
    if t < 0.05:
        continue
    if k == 'hero' and ok(k, t, 0.6):
        cue('pop', t + 0.18, -27)
    elif k == 'head' and ok(k, t, 0.5):
        cue('swish', t, -31)
    elif k == 'chip' and ok(k, t, 0.12):
        cue('pop_hi', t + 0.05, -29)
    elif k == 'tick':
        cue('tick', t, -30)
    elif k == 'line' and ok(k, t, 0.4):
        cue('swish', t, -34)
    elif k == 'stamp':
        cue('thud', t - 0.02, -17); cue('sign_paper', t - 0.12, -27)
    elif k == 'bubble':
        cue('pop', t + 0.1, -25)
    elif k == 'strike':
        cue('paper_slide', t, -27)
    elif k == 'strike_hit' and ok(k, t, 0.35):
        cue('expl_afar' if int(t * 10) % 2 else 'expl_afar2', t, -24, pan=0.2)
    elif k == 'arc' and ok(k, t, 2.0):
        cue('jet_flyby', t - 0.2, -27, fade_in=0.3, fade_out=1.0, pan=-0.2)
    elif k == 'pin' and ok(k, t, 0.3):
        cue('blip', t, -28) if not c.get('big') else (cue('thud', t, -22), cue('ping', t, -27))
    elif k == 'ripple':
        cue('bass_rumble', t, -21, fade_out=1.5)
    elif k == 'radar':
        for j in range(4):
            cue('ping', t + 0.4 + j * 2.6, -29)
    elif k == 'blip':
        cue('blip', t, -27)
    elif k == 'play':
        cue('click_ui', t, -24)
    elif k == 'row':
        cue('select_ui', t + 0.05, -26)
    elif k == 'pull':
        cue('swoosh_myst', t, -25)
    elif k == 'echo':
        for j in range(3):
            cue('pop', t + j * 0.73, -31 - j * 2)
# title / sections / end
cue('bass_rumble', 0.0, -19, fade_in=0.4, fade_out=1.5)
cue('impact_big', 0.12, -17)
cue('riser_short', LEAD - 1.0, -26)
for x in C['tr']:
    if x['type'] in ('zoom',):            # section opener → first point
        pass
cue('impact_big', DUR - 4.0, -18)
cue('ping', DUR - 3.3, -26)

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
