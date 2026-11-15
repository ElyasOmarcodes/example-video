"""Builds timeline.json + public/final.wav: narration lines, procedural drone bed, whoosh + low hit at scene cuts."""
import json, subprocess, numpy as np, os
SR = 48000
lines = json.load(open('data/lines.json'))
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
clips = [load(f'voice/{l["id"]}.mp3') for l in lines]
# trim leading/trailing silence
def trim(x, th=0.008):
    idx = np.where(np.abs(x) > th)[0]
    return x[max(0, idx[0] - 600): idx[-1] + 2400] if len(idx) else x
clips = [trim(c) for c in clips]
t = 2.2; tl = []
for i, (l, c) in enumerate(zip(lines, clips)):
    new_scene = i == 0 or l['scene'] != lines[i - 1]['scene']
    if i > 0: t += 1.1 if new_scene else 0.45
    if l['id'] in ('L14', 'L23', 'L28'): t += 0.6  # dramatic beats
    tl.append({**l, 'a': round(t, 3), 'b': round(t + len(c) / SR, 3), 'cut': new_scene})
    t += len(c) / SR
total = t + 5.5
N = int(total * SR)
vo = np.zeros(N, np.float32)
for e, c in zip(tl, clips):
    s = int(e['a'] * SR); vo[s:s + len(c)] += c
# loudness-ish normalise voice to about -16 dBFS RMS on speech
rms = np.sqrt(np.mean(vo[np.abs(vo) > 0.01] ** 2)); vo *= 10 ** (-16 / 20) / rms
rng = np.random.default_rng(7)
tt = np.arange(N) / SR
def lp(x, a):  # one-pole lowpass
    y = np.empty_like(x); acc = 0.0
    from itertools import accumulate
    # vectorised via scipy-free IIR using cumulative trick is messy; use FFT filter instead
    return x
def fft_band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x)).astype(np.float32)
# drone: D minor-ish low pad with slow beating + filtered noise air
drone = (np.sin(2 * np.pi * 36.7 * tt) * 0.5 + np.sin(2 * np.pi * 55.0 * tt + 0.3) * 0.35 + np.sin(2 * np.pi * 73.4 * tt * (1 + 0.0008 * np.sin(tt * 0.2))) * 0.25 + np.sin(2 * np.pi * 87.3 * tt) * 0.12)
drone *= 0.6 + 0.4 * np.sin(2 * np.pi * tt / 23.0) ** 2
air = fft_band(rng.standard_normal(N).astype(np.float32), 180, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 17.0) ** 2)
bed = drone.astype(np.float32) * 0.6 + air * 0.25
bed *= np.clip(tt / 4, 0, 1) * np.clip((total - tt) / 5, 0, 1)
# duck under voice
env = np.convolve(np.abs(vo), np.ones(4800) / 4800, mode='same'); duck = 1 - 0.45 * np.clip(env / (env.max() * 0.25), 0, 1)
bed *= duck
bed *= 10 ** (-27 / 20) / np.sqrt(np.mean(bed ** 2))
sfx = np.zeros(N, np.float32)
def whoosh(at, dur=1.4, gain=-24):
    n = int(dur * SR); s = int((at - dur * 0.7) * SR)
    if s < 0: return
    x = rng.standard_normal(n).astype(np.float32)
    k = np.linspace(0, 1, n); e = np.sin(np.pi * k) ** 3
    # sweep: blend low band to high band
    lo = fft_band(x, 200, 1200); hi = fft_band(x, 1200, 5000)
    y = (lo * (1 - k) + hi * k * 0.6) * e
    y *= 10 ** (gain / 20) / (np.sqrt(np.mean(y ** 2)) + 1e-9)
    sfx[s:s + n] += y[:max(0, min(n, N - s))]
def hit(at, gain=-20):
    n = int(2.5 * SR); s = int(at * SR); k = np.arange(n) / SR
    f = 55 * np.exp(-k * 1.5) + 38
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 2.2)
    y += fft_band(rng.standard_normal(n).astype(np.float32), 60, 400) * np.exp(-k * 9) * 0.5
    y *= 10 ** (gain / 20) / np.sqrt(np.mean(y[:SR // 2] ** 2))
    sfx[s:s + n] += y[:max(0, min(n, N - s))].astype(np.float32)
cuts = [e['a'] - 0.6 for e in tl if e['cut']]
for c in cuts: whoosh(c)
for e in tl:
    if e['id'] in ('L01', 'L14', 'L15', 'L28'): hit(e['a'] - 0.15, -18)
mix = vo + bed + sfx
mix *= 10 ** (-1.5 / 20) / np.max(np.abs(mix))
os.makedirs('public', exist_ok=True)
pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2')
import wave
with wave.open('public/final.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
json.dump({'fps': 30, 'total': round(total, 2), 'lines': tl}, open('timeline.json', 'w'), ensure_ascii=False, indent=1)
print('total', round(total, 1), 'cuts', len(cuts))
