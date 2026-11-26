"""beats.txt + words.json → data/timeline.json. Each beat starts at the first word of its anchor, matched in
order through the script (normalised as in align.py). Headline text must be words from the script."""
import json, re, sys
sys.path.insert(0, 'tools')
from align_norm import norm
W = json.load(open('data/words.json'))
words = W['words']; nw = [norm(w[0]) for w in words]
beats, pos = [], 0
for l in open('data/beats.txt', encoding='utf-8'):
    l = l.strip()
    if not l or l.startswith('#'): continue
    bid, anchor, head = [x.strip() for x in l.split('|')]
    an = [norm(x) for x in anchor.split() if norm(x)]
    hit = None
    for i in range(pos, len(words)):
        if nw[i:i + len(an)] == an:
            hit = i; break
    if hit is None: raise SystemExit(f'anchor not found after word {pos}: {bid} {anchor}')
    # a section number ('۱.') normalises to nothing: start the beat on it when it precedes the anchor
    if re.match(r'^[۰-۹0-9]+\.', anchor) and hit > 0 and re.match(r'^[۰-۹0-9]+\.$', words[hit - 1][0]):
        hit -= 1
    pos = hit + 1
    beats.append({'id': bid, 'w': hit, 't': words[hit][1], 'head': None if head == '-' else head})
# every beat lasts until the next one
for a, b in zip(beats, beats[1:]): a['t1'] = b['t']
beats[-1]['t1'] = W['duration']
json.dump({'duration': W['duration'], 'beats': beats, 'words': words, 'paras': W['paras']}, open('data/timeline.json', 'w'), ensure_ascii=False)
for b in beats:
    print(f"{b['id']:9} {b['t']:7.2f} {b['t1']-b['t']:5.1f}s  {b['head'] or ''}")
