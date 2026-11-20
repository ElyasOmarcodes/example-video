"""Lays the 33 narration lines on the timeline and writes data/timeline.json.
Every visual beat in the page is anchored to a line or to a word inside it."""
import json, os, subprocess, numpy as np
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
lines = json.load(open(f'{ROOT}/data/lines.json'))
words = json.load(open(f'{ROOT}/data/words.json'))
SR = 48000

def speech_bounds(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    x = np.abs(np.frombuffer(raw, np.float32))
    env = np.convolve(x, np.ones(480) / 480, mode='same')
    idx = np.where(env > 0.004)[0]
    return (idx[0] / SR, idx[-1] / SR) if len(idx) else (0, len(x) / SR)

CHAPTERS = [  # name, first line, last line
    ('n911', 1, 4), ('congress', 5, 8), ('strike', 9, 10), ('lekin', 11, 12), ('mush', 13, 14),
    ('bases', 15, 18), ('flights', 19, 20), ('nato', 21, 24), ('routes', 25, 27), ('boxes', 28, 31), ('question', 32, 33)]
chap_of = {}
for name, a, b in CHAPTERS:
    for i in range(a, b + 1):
        chap_of[f'L{i:02d}'] = name
# pause BEFORE a line (seconds of silence between speech)
GAP = {'L01': 0.0, 'L02': 0.75, 'L03': 0.7, 'L05': 1.25, 'L06': 0.35, 'L07': 0.45, 'L08': 0.3, 'L09': 1.3,
       'L11': 1.1, 'L12': 0.85, 'L13': 1.3, 'L15': 1.2, 'L19': 1.2, 'L21': 1.3, 'L25': 1.2, 'L26': 0.5, 'L27': 0.45,
       'L28': 1.2, 'L32': 1.4, 'L33': 0.3}
INTRO = 6.4
t = INTRO
out = []
for i, l in enumerate(lines):
    s0, s1 = speech_bounds(f'{ROOT}/voice/raw/{l["id"]}.mp3')
    gap = GAP.get(l['id'], 0.42 if i else 0)
    t += gap
    a = t - s0                      # clip start so that speech starts at t
    w = words[l['id']]
    out.append(dict(id=l['id'], voice=l['voice'], text=l['text'], chapter=chap_of[l['id']],
                    clip=round(a, 3), a=round(t, 3), b=round(a + s1, 3),
                    words=[[x, round(a + t0, 3), round(a + t1, 3)] for x, t0, t1 in w['words']]))
    t = a + s1
OUTRO = 9.0
dur = round(t + 1.2 + OUTRO, 3)
chapters = []
for name, a, b in CHAPTERS:
    la, lb = out[a - 1], out[b - 1]
    chapters.append(dict(name=name, a=la['a'], b=lb['b']))
tl = dict(duration=dur, fps=30, intro=[0, INTRO], outro=[round(t + 1.2, 3), dur], lines=out, chapters=chapters)
json.dump(tl, open(f'{ROOT}/data/timeline.json', 'w'), ensure_ascii=False, indent=1)
for c in chapters:
    print(f"{c['name']:9s} {c['a']:7.2f} → {c['b']:7.2f}  ({c['b'] - c['a']:.1f}s)")
print('duration', dur, f'({int(dur // 60)}:{dur % 60:04.1f})')
