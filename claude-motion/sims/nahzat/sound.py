#!/usr/bin/env python3
"""Score + sound effects for the Nahzat episode, driven by the same timeline.json as the picture.

Music: a dark D-minor bed (detuned pad, low pulse in the tense chapters), chords change per scene.
Effects: one generator per cue kind in timeline.json (jet, impact, collapse, crowd, gavel, bomb,
boom, riser, hit, tick, stamp, pen, ping, count, swarm, horn, sea, trucks, stack, whoosh, logo, rise).
Transitions pan right→left with the on-screen wipe (RTL).

    python3 sims/nahzat/sound.py [-o out/sims/nahzat/sound.wav]
"""
import argparse, json, os, wave
import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
SR = 48000
N = int((TL['duration'] + 0.5) * SR)
rng = np.random.default_rng(7)
SC = {s['name']: s for s in TL['scenes']}

def tt(n): return np.arange(n) / SR
def noise(n): return rng.standard_normal(n).astype(np.float32)
def flt(x, kind, f, order=2):
    nyq = SR / 2
    if kind == 'bp':
        sos = butter(order, [max(20, f[0]) / nyq, min(f[1], nyq * 0.95) / nyq], 'band', output='sos')
    else:
        sos = butter(order, min(f, nyq * 0.95) / nyq, kind, output='sos')
    return sosfilt(sos, x).astype(np.float32)
def edecay(n, tau): return np.exp(-tt(n) / tau).astype(np.float32)
def fade(x, a=0.005, r=0.05):
    n = len(x); ai, ri = max(1, int(a * SR)), max(1, int(r * SR))
    x = x.copy(); x[:ai] *= np.linspace(0, 1, ai); x[-ri:] *= np.linspace(1, 0, ri); return x
def norm(x, db):
    p = np.sqrt(np.mean(x ** 2)) + 1e-9
    return (x / p * 10 ** (db / 20)).astype(np.float32)
def sweep(f0, f1, n, curve=1.0):
    k = np.linspace(0, 1, n) ** curve
    f = f0 * (f1 / f0) ** k
    return np.sin(2 * np.pi * np.cumsum(f) / SR).astype(np.float32)

L = np.zeros(N, np.float32); R = np.zeros(N, np.float32)
FX_L = np.zeros(N, np.float32); FX_R = np.zeros(N, np.float32)  # effects bus (gets reverb)
def put(x, at, pan=0.0, bus='fx', pan_to=None):
    s = int(at * SR)
    if s < 0: x = x[-s:]; s = 0
    e = min(N, s + len(x))
    if e <= s: return
    x = x[:e - s]
    p = np.full(len(x), pan, np.float32) if pan_to is None else np.linspace(pan, pan_to, len(x)).astype(np.float32)
    gl, gr = np.cos((p + 1) * np.pi / 4), np.sin((p + 1) * np.pi / 4)
    if bus == 'fx': FX_L[s:e] += x * gl; FX_R[s:e] += x * gr
    else: L[s:e] += x * gl; R[s:e] += x * gr

# ---------------------------------------------------------------- generators
def g_whoosh(d=1.1):
    n = int(d * SR); k = np.linspace(0, 1, n)
    e = np.sin(np.pi * k) ** 2.5
    x = flt(noise(n), 'bp', (250, 1400)) * (1 - k) + flt(noise(n), 'bp', (1200, 6000)) * k * 0.8
    return norm(x * e, -16)
def g_jet(d):
    n = int(d * SR); k = np.linspace(0, 1, n)
    env = np.clip(k * 1.4, 0, 1) ** 2 * np.clip((1 - k) * 6, 0, 1)
    roar = flt(np.cumsum(noise(n)) * 0.02, 'lp', 900) + flt(noise(n), 'bp', (300, 2500)) * 0.4
    whine = sweep(2400, 1500, n, 2.0) * 0.08
    return norm(fade((roar + whine) * env), -15)
def g_impact():
    n = int(4.0 * SR)
    sub = sweep(70, 32, n, 0.4) * edecay(n, 0.9)
    body = flt(noise(n), 'lp', 500) * edecay(n, 0.35)
    tail = flt(noise(n), 'lp', 180) * edecay(n, 1.6) * 0.6
    return norm(fade(sub * 1.2 + body + tail, 0.002, 0.4), -9)
def g_collapse(d):
    n = int(d * SR); k = np.linspace(0, 1, n)
    rum = flt(np.cumsum(noise(n)) * 0.01, 'lp', 160) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * tt(n)))
    deb = flt(noise(n) * (rng.random(n) > 0.997), 'bp', (800, 4000)) * 4
    env = np.clip(k * 3, 0, 1) * np.clip((1 - k) * 2.5, 0, 1)
    return norm(fade((rum + deb * 0.3) * env, 0.3, 0.8), -11)
def g_crowd(d):
    n = int(d * SR); x = np.zeros(n, np.float32)
    for _ in range(int(d * 120)):
        s = int(rng.random() * (n - 2000)); cl = flt(noise(1200), 'bp', (900, 5000)) * edecay(1200, 0.006)
        x[s:s + 1200] += cl * (0.5 + rng.random())
    k = np.linspace(0, 1, n)
    return norm(x * np.clip(k * 4, 0, 1) * np.clip((1 - k) * 2, 0, 1), -20)
def g_knock():
    n = int(0.25 * SR)
    return norm(fade(flt(noise(n), 'bp', (500, 2600)) * edecay(n, 0.018) + np.sin(2 * np.pi * 260 * tt(n)) * edecay(n, 0.05) * 0.6), -12)
def g_bomb():
    whistle = sweep(1500, 450, int(0.55 * SR), 1.3) * np.linspace(0.05, 0.35, int(0.55 * SR)) * 0.6
    return norm(whistle, -22), g_boom(-12)
def g_boom(db=-10):
    n = int(3.0 * SR)
    x = sweep(60, 28, n, 0.3) * edecay(n, 0.7) + flt(noise(n), 'lp', 700) * edecay(n, 0.25) + flt(noise(n), 'lp', 150) * edecay(n, 1.2) * 0.5
    return norm(fade(x, 0.002, 0.5), db)
def g_riser(d):
    n = int(d * SR); k = np.linspace(0, 1, n)
    x = flt(noise(n), 'bp', (400, 6000)) * k ** 2 * 0.6 + sweep(180, 900, n, 1.5) * k ** 2 * 0.15
    return norm(fade(x, 0.05, 0.01), -16)
def g_hit():
    n = int(3.5 * SR)
    x = sweep(55, 38, n, 0.5) * edecay(n, 1.0) * 1.3 + flt(noise(n), 'lp', 1500) * edecay(n, 0.12) + flt(noise(n), 'bp', (200, 900)) * edecay(n, 0.9) * 0.3
    return norm(fade(x, 0.001, 0.6), -9)
def g_tick():
    n = int(0.12 * SR)
    return norm(fade(np.sin(2 * np.pi * 1760 * tt(n)) * edecay(n, 0.02) + np.sin(2 * np.pi * 880 * tt(n)) * edecay(n, 0.05) * 0.5), -20)
def g_stamp():
    n = int(0.6 * SR)
    return norm(fade(sweep(140, 60, n, 0.3) * edecay(n, 0.09) + flt(noise(n), 'bp', (300, 3000)) * edecay(n, 0.03)), -11)
def g_pen(d):
    n = int(d * SR)
    am = (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt(n))) * (0.6 + 0.4 * np.sin(2 * np.pi * 2.3 * tt(n)))
    return norm(fade(flt(noise(n), 'bp', (2500, 7000)) * am, 0.05, 0.2), -26)
def g_ping():
    n = int(1.4 * SR)
    x = sum(np.sin(2 * np.pi * f * tt(n)) * edecay(n, tau) * a for f, tau, a in [(1174.66, 0.5, 1), (1760, 0.3, 0.5), (2349.3, 0.18, 0.3)])
    return norm(fade(x, 0.002, 0.3), -21)
def g_count(d):
    n = int(d * SR); x = np.zeros(n, np.float32)
    t = 0.0; i = 0
    while t < d - 0.03:
        k = t / d; m = int(0.03 * SR)
        f = 1400 + 900 * k
        c = np.sin(2 * np.pi * f * tt(m)) * edecay(m, 0.008)
        s = int(t * SR); x[s:s + m] += c[: len(x[s:s + m])]
        t += 0.09 - 0.06 * k; i += 1
    return norm(x, -24)
def g_swarm(d):
    n = int(d * SR); k = np.linspace(0, 1, n)
    bed = flt(np.cumsum(noise(n)) * 0.01, 'lp', 700) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.2 * tt(n)))
    return norm(fade(bed * np.clip(k * 3, 0, 1) * np.clip((1 - k) * 3, 0, 1), 0.5, 1.0), -21)
def g_horn():
    n = int(2.4 * SR); k = np.linspace(0, 1, n)
    x = sum(np.sign(np.sin(2 * np.pi * f * tt(n))) * a for f, a in [(92.5, 1), (138.6, 0.6)])
    env = np.clip(k * 8, 0, 1) * np.clip((1 - k) * 3, 0, 1)
    return norm(fade(flt(x.astype(np.float32), 'lp', 700) * env, 0.1, 0.3), -14)
def g_sea(d):
    n = int(d * SR)
    lfo = 0.55 + 0.45 * np.sin(2 * np.pi * 0.13 * tt(n)) ** 2
    return norm(fade(flt(noise(n), 'lp', 900) * lfo, 1.0, 1.5), -27)
def g_trucks(d):
    n = int(d * SR)
    eng = flt(np.sign(np.sin(2 * np.pi * 31 * tt(n))).astype(np.float32), 'lp', 220) * (0.7 + 0.3 * np.sin(2 * np.pi * 3.1 * tt(n)))
    road = flt(noise(n), 'lp', 400) * 0.5
    return norm(fade(eng + road, 0.8, 1.2), -24)
def g_stack(d, count=26):
    n = int((d + 0.6) * SR); x = np.zeros(n, np.float32)
    for i in range(count):
        at = (i / count) ** 0.8 * d; m = int(0.35 * SR)
        c = (sum(np.sin(2 * np.pi * f * tt(m)) * a for f, a in [(180, 1), (297, 0.6), (523, 0.4)]) * edecay(m, 0.08)
             + flt(noise(m), 'bp', (300, 1800)) * edecay(m, 0.02))
        s = int(at * SR); x[s:s + m] += c[: len(x[s:s + m])] * (0.6 + 0.4 * rng.random())
    return norm(x, -15)
def g_logo():
    n = int(3.2 * SR); k = np.linspace(0, 1, n)
    chord = sum(np.sin(2 * np.pi * f * tt(n)) for f in (293.66, 440, 587.33, 880)) * np.clip(k * 2, 0, 1) * np.clip((1 - k) * 2, 0, 1) * 0.3
    spark = flt(noise(n) * (rng.random(n) > 0.995), 'hp', 5000) * 2 * np.clip(1 - k, 0, 1)
    return norm(fade(chord + spark, 0.4, 0.8), -18)

# ---------------------------------------------------------------- music bed
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)
CH = {'Dm': [38, 45, 50, 53, 57], 'Bb': [34, 46, 50, 53, 58], 'Gm': [31, 43, 50, 55, 58], 'F': [41, 48, 53, 57, 60],
      'C': [36, 43, 48, 52, 55], 'A': [33, 45, 49, 52, 57], 'Am': [33, 45, 48, 52, 57]}
PROG = {'intro': ['Dm'], 'nyc': ['Dm', 'Bb'], 'congress': ['Gm', 'Dm'], 'strike': ['Dm'], 'question': ['A'], 'musharraf': ['Bb', 'F'],
        'bases': ['Dm', 'Bb', 'Gm', 'A'], 'sorties': ['Dm', 'Bb'], 'globe': ['F', 'C'], 'routes': ['Dm', 'Bb'], 'containers': ['Gm', 'A'],
        'final': ['Dm', 'A'], 'outro': ['Dm']}
TENSE = {'strike', 'bases', 'sorties', 'routes', 'containers', 'final'}
music = np.zeros(N, np.float32)
for s in TL['scenes']:
    a, b = s['a'], s['b'] + 0.6
    chords = PROG[s['name']]; seg = (b - a) / len(chords)
    for ci, ch in enumerate(chords):
        n = int((seg + 1.2) * SR); t = tt(n)
        x = np.zeros(n, np.float32)
        for m in CH[ch]:
            f = NOTE(m)
            for det in (-0.13, 0.11):
                ph = rng.random() * 6.28
                for h, amp in ((1, 1), (2, 0.35), (3, 0.18)):
                    x += np.sin(2 * np.pi * f * h * (1 + det / 100) * t + ph * h) * amp * (0.6 if m > 50 else 1.0)
        env = np.clip(t / 1.0, 0, 1) * np.clip((n / SR - t) / 1.2, 0, 1)
        x = flt(x * env, 'lp', 1100)
        st = int((a + ci * seg) * SR); e = min(N, st + n)
        music[st:e] += x[: e - st]
music = norm(music, -24)
# low pulse at 80 bpm in tense chapters
pulse = np.zeros(N, np.float32)
beat = 60 / 80
for s in TL['scenes']:
    if s['name'] not in TENSE: continue
    t0 = s['a'] + 0.8
    while t0 < s['b'] - 0.4:
        m = int(0.4 * SR); p = sweep(110, 55, m, 0.3) * edecay(m, 0.12)
        st = int(t0 * SR); pulse[st:st + m] += p[: len(pulse[st:st + m])]
        t0 += beat
pulse = norm(pulse, -27)
# fade the bed under the big hits and to silence at the end
bed = music + pulse
k = tt(N)
bed *= np.clip(k / 1.5, 0, 1) * np.clip((TL['duration'] - k) / 3.0, 0, 1)
for c in TL['cues']:
    if c['kind'] in ('hit', 'impact'):
        d = np.exp(-np.maximum(0, k - c['t']) / 1.5) * (k >= c['t'] - 0.05)
        bed *= 1 - 0.55 * d
put(bed, 0, 0.0, 'dry')

# ---------------------------------------------------------------- effects from the cue sheet
for c in TL['cues']:
    kd, t = c['kind'], c['t']
    if kd == 'whoosh': put(g_whoosh(1.1), t - 0.1, 0.7, pan_to=-0.7)
    elif kd == 'jet': put(g_jet(c['dur']), t, -0.6, pan_to=0.5)
    elif kd == 'impact': put(g_impact(), t, 0.1)
    elif kd == 'collapse': put(g_collapse(c['dur'] + 2), t, 0.0)
    elif kd == 'crowd': put(g_crowd(c['dur']), t, 0.0)
    elif kd == 'gavel':
        put(g_knock(), t, 0.0); put(g_knock(), t + 0.22, 0.0)
    elif kd == 'bomb':
        w, bm = g_bomb(); put(w, t - 0.55, [-0.3, 0.2, 0.5][c.get('city', 0)]); put(bm, t, [-0.3, 0.2, 0.5][c.get('city', 0)])
    elif kd == 'boom': put(g_boom(-11), t, 0.0)
    elif kd == 'riser': put(g_riser(c['dur']), t, 0.0)
    elif kd == 'hit': put(g_hit(), t, 0.0)
    elif kd == 'tick': put(g_tick(), t, 0.2)
    elif kd == 'stamp': put(g_stamp(), t, 0.0)
    elif kd == 'pen': put(g_pen(c['dur']), t, 0.25)
    elif kd == 'ping': put(g_ping(), t, 0.0)
    elif kd == 'count': put(g_count(c['dur']), t, 0.0)
    elif kd == 'swarm': put(g_swarm(c['dur']), t, 0.0)
    elif kd == 'horn': put(g_horn(), t, -0.2)
    elif kd == 'sea': put(g_sea(c['dur']), t, 0.0)
    elif kd == 'trucks': put(g_trucks(c['dur']), t, 0.1)
    elif kd == 'stack': put(g_stack(c['dur']), t, 0.0)
    elif kd in ('logo', 'rise'): put(g_logo() if kd == 'logo' else g_riser(1.4), t, 0.0)

# short room reverb on the effects bus
ir_n = int(1.6 * SR)
ir = (noise(ir_n) * edecay(ir_n, 0.35)).astype(np.float32)
ir = flt(ir, 'lp', 5000); ir /= np.sqrt(np.sum(ir ** 2))
wetL = fftconvolve(FX_L, ir)[:N].astype(np.float32); wetR = fftconvolve(FX_R, ir * np.roll(np.ones(ir_n), 1))[:N].astype(np.float32)
L += FX_L + wetL * 0.18; R += FX_R + wetR * 0.18
mix = np.stack([L, R], 1)
mix *= 10 ** (-1.0 / 20) / np.max(np.abs(mix))

ap = argparse.ArgumentParser(); ap.add_argument('-o', default=os.path.join(HERE, '..', '..', 'out', 'sims', 'nahzat', 'sound.wav'))
out = ap.parse_args().o
os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print('→', os.path.relpath(out), f'{TL["duration"]:.1f} s')
