"""The user's narration (voice/user/narration.mp3) becomes the voice track, with the two quoted
lines (L06 the US demand, L08 the Taliban answer) replaced by the earlier quote voices
(voice/raw/L06.mp3 Sterling, voice/raw/L08.mp3 Marcus).

Cuts land only where the narrator is silent or ~35 dB down:
  in : the short dip after the narrator's «کہ» that introduces the quote
  out: the silence before the narrator's next line («تاہم», «مگر»)
The narrator's own quote reading is dropped between those two points.  A new pause of
the old version's length separates «کہ» from the quote; the silence after the quote keeps
the narrator's own length.  Every line/word time is re-expressed in film time.
Writes data/voice_plan.json (pieces for tools/sound.py) and data/timeline.json."""
import json, subprocess, numpy as np
SR = 48000
INTRO, OUTRO = 6.4, 9.0
lines = json.load(open('data/lines.json'))
U = json.load(open('data/user_words.json'))          # narrator file times
OLD = json.load(open('data/words.json'))             # old clip-relative word times

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)
def envelope(x, ms=10):
    hop = SR * ms // 1000
    e = np.sqrt(np.convolve(x ** 2, np.ones(hop * 2) / (hop * 2), 'same'))[::hop]
    return e, hop / SR
nar = load('voice/user/narration.mp3'); env, dt = envelope(nar)
THR = 10 ** (-50 / 20)

def dip(a, b):
    """quietest 10 ms point between a and b (file seconds)"""
    i0, i1 = int(a / dt), int(b / dt)
    i = i0 + int(np.argmin(env[i0:i1])); return i * dt, 20 * np.log10(env[i] + 1e-9)
def silence_before(t, look=0.8):
    """the silent run that ends where speech starts at/just after t: returns (run start, speech onset)"""
    i = int(t / dt)
    while i < len(env) - 1 and env[i] < THR: i += 1           # forward to the onset
    while i > 0 and env[i - 1] >= THR: i -= 1                  # back to the start of this speech run
    j = i
    while j > 0 and env[j - 1] < THR and (i - j) * dt < look: j -= 1
    return j * dt, i * dt
def speech_bounds(x):
    e, d = envelope(x); idx = np.where(e > THR)[0]
    return idx[0] * d, (idx[-1] + 1) * d

pieces, mapping = [], []      # mapping: (file a, file b, track t) for narrator spans
track = 0.0
def add_nar(a, b, fade_in=0.0, fade_out=0.0):
    global track
    pieces.append(dict(src='voice/user/narration.mp3', a=round(a, 4), b=round(b, 4), t=round(track, 4), fade_in=fade_in, fade_out=fade_out, gain_db=0.0, room=False))
    mapping.append((a, b, track)); track += b - a
quote_at = {}
def add_quote(lid, pause_before):
    global track
    track += pause_before
    x = load(f'voice/raw/{lid}.mp3'); s0, s1 = speech_bounds(x)
    s0 = max(0, s0 - 0.03); s1 = min(len(x) / SR, s1 + 0.06)
    pieces.append(dict(src=f'voice/raw/{lid}.mp3', a=round(s0, 4), b=round(s1, 4), t=round(track, 4), fade_in=0.01, fade_out=0.04, gain_db=None, room=True))
    quote_at[lid] = (track - s0, track, track + (s1 - s0))     # (clip zero, speech start, speech end) in track time
    track += s1 - s0

report = []
kah_end = {}
cur = 0.0
for qid, nxt, gap_before in (('L06', 'L07', 0.35), ('L08', 'L09', 0.30)):
    kah = U[f'L{int(qid[1:]) - 1:02d}']['words'][-1]          # the narrator's «کہ»
    first = U[qid]['words'][0]
    # the narrator pauses before «کہ»: find that pause, «کہ» starts at its end
    i0, i1 = int((kah[1] - 0.25) / dt), int((first[1] + 0.25) / dt)
    q = env[i0:i1] < THR; best = (0, 0); r0 = None
    for k in range(len(q) + 1):
        if k < len(q) and q[k]:
            r0 = k if r0 is None else r0
        elif r0 is not None:
            best = max(best, (k - r0, k)); r0 = None
    kah_on = (i0 + best[1]) * dt
    cut_in, cut_db = dip(kah_on + 0.10, kah_on + 0.50)
    assert cut_db < -38, (qid, cut_in, cut_db)
    kah_end[qid] = cut_in
    sil_a, on = silence_before(U[nxt]['a'] + 0.02)
    # the narrator's own quote ends where that silence starts
    add_nar(cur, cut_in, fade_out=0.02)
    add_quote(qid, gap_before)
    track += on - sil_a                                        # keep the narrator's own pause after the quote
    cur = on - 0.012
    track -= 0.012
    report.append(f'{qid}: in at {cut_in:.3f}s ({cut_db:.0f} dBFS dip after «کہ»), out at {on:.3f}s (silence {on - sil_a:.2f}s, below -50 dBFS)')
add_nar(cur, len(nar) / SR, fade_in=0.012)
for r in report: print(r)

def to_track(t):
    for a, b, t0 in mapping:
        if a - 1e-6 <= t <= b + 1e-6: return t0 + (t - a)
    # in the dropped silence just before a kept span: snap to that span's start
    nxt = [m for m in mapping if m[0] > t]
    return nxt[0][2]
nar_first = U['L01']['a']
OFF = INTRO - to_track(nar_first)        # film time = track time + OFF
out = []
chap_of = {}
CHAPTERS = [('n911', 1, 4), ('congress', 5, 8), ('strike', 9, 10), ('lekin', 11, 12), ('mush', 13, 14),
            ('bases', 15, 18), ('flights', 19, 20), ('nato', 21, 24), ('routes', 25, 27), ('boxes', 28, 31), ('question', 32, 33)]
for name, a, b in CHAPTERS:
    for i in range(a, b + 1): chap_of[f'L{i:02d}'] = name
for l in lines:
    lid = l['id']
    if lid in quote_at:
        z, s0, s1 = quote_at[lid]
        a, b = s0 + OFF, s1 + OFF
        words = [[w, round(z + OFF + t0, 3), round(z + OFF + t1, 3)] for w, t0, t1 in OLD[lid]['words']]
        clip = z + OFF
    else:
        u = dict(U[lid])
        prev_q = {'L05': 'L06', 'L07': 'L08'}.get(lid)
        if prev_q: u['b'] = kah_end[prev_q]
        a, b = to_track(u['a']) + OFF, to_track(u['b']) + OFF
        words = [[w, round(to_track(min(max(t0, u['a']), u['b'])) + OFF, 3), round(to_track(min(max(t1, u['a']), u['b'])) + OFF, 3)] for w, t0, t1 in u['words']]
        clip = a
    out.append(dict(id=lid, voice=l['voice'], text=l['text'], chapter=chap_of[lid], clip=round(clip, 3), a=round(a, 3), b=round(b, 3), words=words))
end = out[-1]['b']
dur = round(end + 1.2 + OUTRO, 3)
chapters = [dict(name=n, a=out[a - 1]['a'], b=out[b - 1]['b']) for n, a, b in CHAPTERS]
tl = dict(duration=dur, fps=30, intro=[0, INTRO], outro=[round(end + 1.2, 3), dur], lines=out, chapters=chapters, voice_offset=round(OFF, 4))
json.dump(tl, open('data/timeline.json', 'w'), ensure_ascii=False, indent=1)
json.dump(dict(offset=round(OFF, 4), pieces=pieces), open('data/voice_plan.json', 'w'), ensure_ascii=False, indent=1)
for i, l in enumerate(out):
    g = l['a'] - out[i - 1]['b'] if i else l['a']
    print(f"{l['id']} {l['a']:7.2f} {l['b']:7.2f}  gap {g:5.2f}  {l['voice']:8s} {l['words'][0][0]} {l['words'][0][1]:.2f} … {l['words'][-1][0]} {l['words'][-1][2]:.2f}")
for c in chapters: print(f"{c['name']:9s} {c['a']:7.2f} → {c['b']:7.2f}")
print('duration', dur, f'({int(dur // 60)}:{dur % 60:04.1f})', 'voice offset', round(OFF, 3))
