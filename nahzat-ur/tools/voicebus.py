"""Builds the voice bus from data/voice_plan.json: the user's narration pieces plus the two
earlier quote voices, loudness-matched (speech RMS), the quotes one dB back with the same
short room tail as before.  build(N, SR) -> float32 (N, 2) in film time."""
import json, os, subprocess, numpy as np
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

def _load(path, sr):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(sr), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()

def _speech_rms(x):
    m = x.mean(1); hop = 480
    fr = m[: len(m) // hop * hop].reshape(-1, hop)
    r = np.sqrt((fr ** 2).mean(1)); r = r[r > 10 ** (-40 / 20)]
    return 20 * np.log10(np.sqrt((r ** 2).mean()) + 1e-12)

def build(N, sr):
    plan = json.load(open(f'{ROOT}/data/voice_plan.json'))
    off = plan['offset']
    cache = {}
    nar = _load(f'{ROOT}/voice/user/narration.mp3', sr); cache['voice/user/narration.mp3'] = nar
    ref = _speech_rms(nar)
    bus = np.zeros((N, 2), np.float32)
    for p in plan['pieces']:
        src = cache.get(p['src'])
        if src is None: src = cache[p['src']] = _load(f'{ROOT}/{p["src"]}', sr)
        c = src[int(round(p['a'] * sr)): int(round(p['b'] * sr))].copy()
        g = p['gain_db'] if p['gain_db'] is not None else ref - _speech_rms(src) - 1.0
        c *= 10 ** (g / 20)
        if p['room']:
            d = int(0.045 * sr); tail = np.zeros_like(c); tail[d:] = c[:-d] * 0.18
            c = c * 0.95 + tail
        for k, side in ((p['fade_in'], 'in'), (p['fade_out'], 'out')):
            n = min(len(c), int(k * sr))
            if n > 1:
                r = np.sin(np.linspace(0, np.pi / 2, n)) ** 2
                if side == 'in': c[:n] *= r[:, None]
                else: c[-n:] *= r[::-1, None]
        s = int(round((p['t'] + off) * sr))
        e = min(N, s + len(c)); bus[s:e] += c[: e - s]
    return bus

if __name__ == '__main__':
    import sys, wave
    sr = 48000; tl = json.load(open(f'{ROOT}/data/timeline.json'))
    b = build(int(tl['duration'] * sr) + sr, sr)
    a, z = (float(sys.argv[1]), float(sys.argv[2])) if len(sys.argv) > 2 else (0, tl['duration'])
    seg = np.clip(b[int(a * sr): int(z * sr)] * 0.9, -1, 1)
    out = sys.argv[3] if len(sys.argv) > 3 else '/dev/stdout'
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((seg * 32767).astype(np.int16).tobytes())
