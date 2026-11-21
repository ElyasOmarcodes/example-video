"""Script → timeline. Parses data/script.txt into title / sections / points, then maps every script
word onto the whisper (large-v3-turbo) word stamps by character alignment of the whole text.
Writes data/timeline.json  {fps, duration, items:[{id, kind, sec, head, body, a, b, hw:[[w,t0,t1]], bw:[...]}]}"""
import json, re, difflib, numpy as np
src = [l.strip() for l in open('data/script.txt', encoding='utf-8') if l.strip()]
items = [{'id': 'T', 'kind': 'title', 'sec': 0, 'head': src[0], 'body': ''}]
sec, i, k = 0, 1, 0
while i < len(src):
    l = src[i]
    if re.match(r'^(لومړۍ|دویمه|درېیمه|څلورمه) برخه', l):
        sec += 1
        title = re.sub(r'^[٠-٩۰-۹0-9]+\.\s*', '', src[i + 1])
        items.append({'id': f'S{sec}', 'kind': 'section', 'sec': sec, 'head': l.rstrip(':'), 'body': title})
        i += 2; continue
    if l.startswith('-'):
        h = l[1:].strip().rstrip(':')
        k += 1
        items.append({'id': f'P{k:02d}', 'kind': 'concl' if h == 'پایله' else 'point', 'sec': sec, 'head': h, 'body': src[i + 1]})
        i += 2; continue
    raise SystemExit('unparsed: ' + l)
asr = json.load(open('data/whisper_large-v3-turbo.json'))
aw = [(w[0].strip(), w[1], w[2]) for s in asr for w in s['words'] if w[0].strip()]
NORM = str.maketrans({'ي': 'ی', 'ې': 'ی', 'ۍ': 'ی', 'ئ': 'ی', 'ى': 'ی', 'ك': 'ک', 'ګ': 'گ', 'ړ': 'ر', 'ڑ': 'ر', 'ډ': 'د', 'ڈ': 'د',
                      'ټ': 'ت', 'ٹ': 'ت', 'ښ': 'ش', 'ږ': 'ژ', 'ځ': 'ز', 'څ': 'س', 'ڼ': 'ن', 'ة': 'ه', 'ۀ': 'ه', 'ہ': 'ه', 'ھ': 'ه', 'ه': 'ه',
                      'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ؤ': 'و', 'ص': 'س', 'ث': 'س', 'ض': 'ز', 'ظ': 'ز', 'ذ': 'ز', 'ط': 'ت', 'ح': 'ه', 'ع': 'ا', 'ق': 'ک'})
def norm(s):
    s = re.sub(r'[ً-ٰٟ‌‍]', '', s).translate(NORM)
    return re.sub(r'[^\w]', '', re.sub(r'[0-9٠-٩۰-۹]', '', s))
achars, atimes = [], []
for w, t0, t1 in aw:
    n = norm(w)
    for j, ch in enumerate(n):
        achars.append(ch); atimes.append(t0 + (t1 - t0) * (j + 0.5) / max(1, len(n)))
schars, owner, words = [], [], []
for it in items:
    for part in ('head', 'body'):
        for w in it[part].split():
            wi = len(words); words.append((it['id'], part, w))
            for ch in norm(w):
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
for it in items:
    it['hw'], it['bw'] = [], []
for wi, (iid, part, w) in enumerate(words):
    ts = wt.get(wi) or [wt[wi - 1][-1]]
    it = next(x for x in items if x['id'] == iid)
    it['hw' if part == 'head' else 'bw'].append([w, round(min(ts) - 0.05, 3), round(max(ts) + 0.08, 3)])
for it in items:
    ws = it['hw'] + it['bw']
    it['a'], it['b'] = ws[0][1], ws[-1][2]
dur = 408.764
json.dump({'fps': 60, 'duration': dur, 'items': items}, open('data/timeline.json', 'w'), ensure_ascii=False, indent=1)
for it in items:
    print(f"{it['id']:4} {it['a']:7.2f} {it['b']:7.2f}  {it['head'][:40]}")
