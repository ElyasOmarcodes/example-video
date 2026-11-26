"""Script → word timings. Every word of data/script.txt is mapped onto the whisper (large-v3-turbo) word
stamps by character alignment of the whole text. Writes data/words.json:
{duration, words:[[w, t0, t1, para, sent]], paras:[{id, text, a, b}], sents:[{text, a, b, para}]}"""
import json, re, difflib, subprocess, numpy as np
src = [l.strip() for l in open('data/script.txt', encoding='utf-8') if l.strip()]
asr = json.load(open('data/whisper_large-v3-turbo.json'))
aw = [(w[0].strip(), w[1], w[2]) for s in asr for w in s['words'] if w[0].strip()]
NORM = str.maketrans({'ي': 'ی', 'ې': 'ی', 'ۍ': 'ی', 'ئ': 'ی', 'ى': 'ی', 'ك': 'ک', 'ګ': 'گ', 'ړ': 'ر', 'ڑ': 'ر', 'ډ': 'د', 'ڈ': 'د',
                      'ټ': 'ت', 'ٹ': 'ت', 'ښ': 'ش', 'ږ': 'ژ', 'ځ': 'ز', 'څ': 'س', 'ڼ': 'ن', 'ة': 'ه', 'ۀ': 'ه', 'ہ': 'ه', 'ھ': 'ه',
                      'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ؤ': 'و', 'ص': 'س', 'ث': 'س', 'ض': 'ز', 'ظ': 'ز', 'ذ': 'ز', 'ط': 'ت', 'ح': 'ه', 'ع': 'ا', 'ق': 'ک'})
def norm(s):
    s = re.sub(r'[ً-ٰٟ‌‍]', '', s).translate(NORM)
    return re.sub(r'[^\w]', '', re.sub(r'[0-9٠-٩۰-۹]', '', s))
achars, atimes = [], []
for w, t0, t1 in aw:
    n = norm(w)
    for j, ch in enumerate(n):
        achars.append(ch); atimes.append(t0 + (t1 - t0) * (j + 0.5) / max(1, len(n)))
words, paras, sents = [], [], []
for pi, l in enumerate(src):
    paras.append({'id': pi, 'text': l})
    for si, s in enumerate(re.split(r'(?<=[.؟!؛])\s+', l)):
        sents.append({'text': s, 'para': pi})
        for w in s.split():
            words.append([w, None, None, pi, len(sents) - 1])
schars, owner = [], []
for wi, w in enumerate(words):
    for ch in norm(w[0]):
        schars.append(ch); owner.append(wi)
sm = difflib.SequenceMatcher(None, ''.join(schars), ''.join(achars), autojunk=False)
st = [None] * len(schars)
for blk in sm.get_matching_blocks():
    for j in range(blk.size):
        st[blk.a + j] = atimes[blk.b + j]
known = [j for j, t in enumerate(st) if t is not None]
print('matched chars', len(known), '/', len(schars), 'ratio', round(sm.ratio(), 3))
st = np.interp(range(len(schars)), known, [st[j] for j in known])
wt = {}
for j, wi in enumerate(owner):
    wt.setdefault(wi, []).append(st[j])
for wi, w in enumerate(words):
    ts = wt.get(wi) or [words[wi - 1][2]]
    w[1], w[2] = round(min(ts) - 0.05, 3), round(max(ts) + 0.08, 3)
for coll, key in ((paras, 3), (sents, 4)):
    for i, x in enumerate(coll):
        ws = [w for w in words if w[key] == i]
        x['a'], x['b'] = ws[0][1], ws[-1][2]
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'audio/voice.mp3']))
json.dump({'duration': dur, 'words': words, 'paras': paras, 'sents': sents}, open('data/words.json', 'w'), ensure_ascii=False)
for p in paras:
    print(f"{p['id']:3} {p['a']:7.2f} {p['b']:7.2f}  {p['text'][:50]}")
