"""Times the 33 script lines (and every word) inside the user's narration file.
whisper word stamps -> character alignment of the whole script -> word times, then each
line's start/end is snapped to the real speech edges found in the waveform envelope.
Writes data/user_words.json {id: {a, b, words: [[word, t0, t1], ...]}} in FILE time."""
import json, re, difflib, wave, numpy as np
lines = json.load(open('data/lines.json'))
asr = json.load(open('data/user_asr.json'))
NORM = str.maketrans({'ي': 'ی', 'ك': 'ک', 'ة': 'ہ', 'ۃ': 'ہ', 'ه': 'ہ', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ئ': 'ی', 'ۓ': 'ے', 'ط': 'ت', 'ث': 'س', 'ص': 'س', 'ذ': 'ز', 'ض': 'ز', 'ظ': 'ز', 'ح': 'ہ', 'ع': 'ا', 'ؤ': 'و'})
def norm(s):
    s = re.sub(r'[ً-ٰٕٔ]', '', s.translate(NORM))
    return re.sub(r'[^\w]', '', s)
achars, atimes = [], []
for seg in asr:
    for w, t0, t1, p in seg['words']:
        n = norm(w)
        for k, ch in enumerate(n):
            achars.append(ch); atimes.append(t0 + (t1 - t0) * (k + 0.5) / max(1, len(n)))
schars, owner = [], []   # owner = (line index, word index)
for li, l in enumerate(lines):
    for wi, w in enumerate(l['text'].split()):
        for ch in norm(w):
            schars.append(ch); owner.append((li, wi))
sm = difflib.SequenceMatcher(None, ''.join(schars), ''.join(achars), autojunk=False)
st = [None] * len(schars)
for blk in sm.get_matching_blocks():
    for k in range(blk.size): st[blk.a + k] = atimes[blk.b + k]
known = [i for i, t in enumerate(st) if t is not None]
print('char match', round(sm.ratio(), 3), 'matched', len(known), '/', len(schars))
st = list(np.interp(range(len(schars)), known, [st[i] for i in known]))
# speech envelope (10 ms) for snapping line edges
w = wave.open('voice/user/n16.wav'); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
hop = 160; env = np.sqrt(np.convolve(x ** 2, np.ones(hop * 2) / (hop * 2), "same"))[::hop]
floor = np.percentile(env, 8); thr = max(floor * 4, 0.006)
thr = 10 ** (-50 / 20)
quiet = env < thr
def boundary(t_end, t_start):
    """between one line's last word and the next line's first: the longest quiet run, else the quietest frame"""
    lo, hi = int((min(t_end, t_start) - 0.25) * 100), int((max(t_end, t_start) + 0.25) * 100)
    best, run0, bestlen = None, None, 0
    for i in range(lo, hi + 1):
        if quiet[i] and run0 is None: run0 = i
        if (not quiet[i] or i == hi) and run0 is not None:
            if i - run0 > bestlen: best, bestlen = (run0, i), i - run0
            run0 = None
    if best and bestlen >= 3: return best[0] / 100, best[1] / 100
    i = lo + int(np.argmin(env[lo:hi + 1])); return i / 100, i / 100
out = {}
for li, l in enumerate(lines):
    ws = l['text'].split(); words = []
    for wi, wd in enumerate(ws):
        ts = [st[k] for k in range(len(schars)) if owner[k] == (li, wi)]
        if not ts: ts = [words[-1][2]] if words else [0.0]
        words.append([wd, round(min(ts) - 0.06, 3), round(max(ts) + 0.06, 3)])
    out[l['id']] = dict(a=words[0][1] + 0.06, b=words[-1][2] - 0.06, words=words)
ids = list(out)
for i in range(len(ids) - 1):
    e, s_ = boundary(out[ids[i]]['b'], out[ids[i + 1]]['a'])
    out[ids[i]]['b'], out[ids[i + 1]]['a'] = round(e, 3), round(s_, 3)
first = np.where(~quiet)[0]; out[ids[0]]['a'] = round(first[0] / 100, 3); out[ids[-1]]['b'] = round((first[-1] + 1) / 100, 3)
ids = list(out)
for i, k in enumerate(ids):
    gap = out[k]['a'] - out[ids[i - 1]]['b'] if i else out[k]['a']
    print(f"{k} {out[k]['a']:7.2f} {out[k]['b']:7.2f}  gap before {gap:5.2f}  {lines[i]['text'][:50]}")
json.dump(out, open('data/user_words.json', 'w'), ensure_ascii=False, indent=0)
