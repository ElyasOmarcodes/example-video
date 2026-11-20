"""Word timings for every narration line: whisper (large-v3-turbo) word stamps on the
TTS clip, then the script's own words are mapped onto them by character alignment.
Writes data/words.json  {id: {dur, asr, sim, words:[[word, t0, t1], ...]}}"""
import json, subprocess, sys, difflib, re, numpy as np
from faster_whisper import WhisperModel
ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
lines = json.load(open(f'{ROOT}/data/lines.json'))
m = WhisperModel('large-v3-turbo', device='cpu', compute_type='int8', download_root='/home/user/.cache/fw')
def load(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
NORM = str.maketrans({'ي': 'ی', 'ك': 'ک', 'ة': 'ہ', 'ۃ': 'ہ', 'ھ': 'ھ', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا'})
def norm(s):
    s = re.sub(r'[ً-ٰٟ]', '', s.translate(NORM))
    return re.sub(r'[^\w]', '', s)
out = {}
for l in lines:
    a = load(f'{ROOT}/voice/raw/{l["id"]}.mp3')
    segs, _ = m.transcribe(a, language='ur', beam_size=5, word_timestamps=True)
    aw = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
    # char-level time track of the ASR string
    achars, atimes = [], []
    for w, t0, t1 in aw:
        n = norm(w)
        for k, ch in enumerate(n):
            achars.append(ch); atimes.append(t0 + (t1 - t0) * (k + 0.5) / max(1, len(n)))
    sw = l['text'].split()
    schars, owner = [], []
    for i, w in enumerate(sw):
        for ch in norm(w):
            schars.append(ch); owner.append(i)
    sm = difflib.SequenceMatcher(None, ''.join(schars), ''.join(achars), autojunk=False)
    st = [None] * len(schars)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            st[blk.a + k] = atimes[blk.b + k]
    # interpolate unmatched chars
    known = [i for i, t in enumerate(st) if t is not None]
    dur = len(a) / 16000
    if not known:
        st = list(np.linspace(0.1, dur - 0.1, len(schars)))
    else:
        st = list(np.interp(range(len(schars)), known, [st[i] for i in known]))
    words = []
    for i, w in enumerate(sw):
        ts = [st[k] for k in range(len(schars)) if owner[k] == i]
        if not ts:
            ts = [words[-1][2] if words else 0.0]
        words.append([w, round(min(ts) - 0.06, 3), round(max(ts) + 0.06, 3)])
    sim = sm.ratio()
    out[l['id']] = dict(dur=round(dur, 3), asr=' '.join(w for w, _, _ in aw), sim=round(sim, 3), words=words)
    print(l['id'], f'{sim:.2f}', out[l['id']]['asr'], flush=True)
json.dump(out, open(f'{ROOT}/data/words.json', 'w'), ensure_ascii=False, indent=0)
print('DONE')
