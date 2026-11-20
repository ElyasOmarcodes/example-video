"""Mixes the soundtrack → audio/mix.wav (48 kHz stereo, −14 LUFS):
narration (Marcus + the two quoted voices), the ElevenLabs score ducked under speech with a
silence before «لیکن», and a cue sheet of real recorded effects tied to the timeline."""
import json, os, subprocess
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SR = 48000
TL = json.load(open(f'{ROOT}/data/timeline.json'))
LN = {l['id']: l for l in TL['lines']}
DUR = TL['duration']
N = int(DUR * SR) + SR


def load(path, stereo=True):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def db(x):
    return 10 ** (x / 20)


def wt(lid, needle, which=0):
    ws = [w for w in LN[lid]['words'] if needle in w[0]]
    return ws[min(which, len(ws) - 1)][1]


def place(bus, clip, t, gain_db=0.0, fade_in=0.0, fade_out=0.0, pan=0.0, length=None):
    s = int(t * SR)
    c = clip if length is None else clip[: int(length * SR)]
    c = c.copy()
    if fade_in > 0:
        n = min(len(c), int(fade_in * SR))
        c[:n] *= np.linspace(0, 1, n)[:, None]
    if fade_out > 0:
        n = min(len(c), int(fade_out * SR))
        c[-n:] *= np.linspace(1, 0, n)[:, None]
    c *= db(gain_db)
    if pan:
        c[:, 0] *= np.sqrt(0.5 * (1 - pan)) * np.sqrt(2)
        c[:, 1] *= np.sqrt(0.5 * (1 + pan)) * np.sqrt(2)
    if s < 0:
        c = c[-s:]
        s = 0
    e = min(len(bus), s + len(c))
    bus[s:e] += c[: e - s]


def movavg(x, k):
    c = np.cumsum(np.concatenate([[0.0], x.astype(np.float64)]))
    y = (c[k:] - c[:-k]) / k
    pad = len(x) - len(y)
    return np.concatenate([np.full(pad // 2, y[0]), y, np.full(pad - pad // 2, y[-1])]).astype(np.float32)


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


# ------------------------------------------------------------------ narration
voice = np.zeros((N, 2), np.float32)
for l in TL['lines']:
    c = load(f'{ROOT}/voice/raw/{l["id"]}.mp3')
    # quoted voices sit a touch further back with a short room tail
    if l['voice'] != 'arthur':
        tail = np.zeros_like(c)
        d = int(0.045 * SR)
        tail[d:] = c[:-d] * 0.18
        c = c * 0.95 + tail
    place(voice, c, l['clip'])
sp = voice[np.abs(voice[:, 0]) > 0.01]
voice *= db(-17 - rms_db(sp))

# ------------------------------------------------------------------ score, ducked under speech
score = load(f'{ROOT}/audio/score.mp3')
need = N - len(score)
if need > 0:
    # splice: play to 150 s, jump back by `need` and continue, 3 s equal-power crossfade at the seam
    cut, xf = int(150 * SR), int(3 * SR)
    back = cut - need
    a_, b_ = score[:cut + xf].copy(), score[back:].copy()
    ramp_ = np.linspace(0, 1, xf)[:, None]
    a_[cut:] *= np.cos(ramp_ * np.pi / 2)
    b_[:xf] *= np.sin(ramp_ * np.pi / 2)
    score = np.concatenate([a_[:cut], a_[cut:] + b_[:xf], b_[xf:]])
mus = np.zeros((N, 2), np.float32)
place(mus, score, 0.0)
env = np.abs(voice[:, 0])
k = int(0.25 * SR)
env = movavg(env, k)
speech = np.clip(env / 0.02, 0, 1)
# smooth the duck so the bed breathes rather than pumps
k2 = int(0.6 * SR)
speech = movavg(speech, k2)
duck = db(-9) * speech + 1.0 * (1 - speech)
t = np.arange(N) / SR
lekin = LN['L11']['a']
dip = np.ones(N)
dip *= np.clip(np.abs(t - (lekin + 0.35)) / 0.9, 0.06, 1.0) ** 1.5  # near-silence around «لیکن»
lift = np.ones(N)
lift[t < TL['intro'][1]] = db(3)
lift[t > TL['outro'][0]] = db(3)
fade = np.clip((DUR - t) / 2.5, 0, 1)
mus *= (duck * dip * lift * fade)[:, None]
mus *= db(-23 - rms_db(mus[int(10 * SR):int(200 * SR)]))

# ------------------------------------------------------------------ effects cue sheet
S = {f[:-4]: load(f'{ROOT}/audio/sfx/{f}') for f in os.listdir(f'{ROOT}/audio/sfx') if f.endswith('.mp3')}
for k_, v in S.items():  # normalise every effect to the same peak so the gains below mean something
    S[k_] = v / (np.max(np.abs(v)) + 1e-9) * 0.9
fx = np.zeros((N, 2), np.float32)
cue = lambda name, at, g, **kw: place(fx, S[name], at, g, **kw)

# transitions (match engine.js addTransition calls)
A_ = lambda i: LN[i]['a']
O0 = TL['outro'][0]
SH = {'intro': (0, A_('L01') + 0.55), 'date': (A_('L01') - 0.5, A_('L02') + 0.35), 'nyc': (A_('L02') - 0.35, A_('L03') + 0.35), 'toll': (A_('L03') - 0.3, A_('L04') + 0.3),
      'blame': (A_('L04') - 0.25, A_('L05') + 0.3), 'congress': (A_('L05') - 0.3, A_('L07') + 0.7), 'reply': (A_('L07') + 0.2, A_('L09') - 0.3), 'war': (A_('L09') - 0.8, A_('L13') + 0.3),
      'mush': (A_('L13') - 0.3, A_('L15') + 0.2), 'pak': (A_('L15') - 0.4, A_('L21') - 0.25), 'nato': (A_('L21') - 0.75, A_('L23') + 0.4), 'globe': (A_('L23') - 0.3, A_('L24') + 0.3),
      'supply': (A_('L24') - 0.1, A_('L28') - 0.1), 'boxes': (A_('L28') - 0.6, A_('L32') - 0.2), 'question': (A_('L32') - 0.8, O0 + 0.55), 'outro': (O0 + 0.05, DUR)}
ORDER = [('intro', 'date', 'zoom'), ('date', 'nyc', 'flip'), ('nyc', 'toll', 'stack'), ('toll', 'blame', 'flip'), ('blame', 'congress', 'push'), ('congress', 'reply', 'swipe'),
         ('reply', 'war', 'zoom'), ('war', 'mush', 'flip'), ('mush', 'pak', 'zoom'), ('pak', 'nato', 'stack'), ('nato', 'globe', 'zoom'), ('globe', 'supply', 'zoom'),
         ('supply', 'boxes', 'push'), ('boxes', 'question', 'zoom'), ('question', 'outro', 'flip')]
TR = [((SH[f][1] + SH[n][0]) / 2, k) for f, n, k in ORDER]
WH = {'zoom': ('whoosh_tunnel', -0.45, -21), 'flip': ('whoosh_fast', -0.3, -19), 'stack': ('swoosh_slow', -0.8, -22), 'push': ('whoosh_fast2', -0.3, -19), 'swipe': ('whoosh_wind', -0.5, -20)}
for at, kind in TR:
    if kind in WH:
        name, off, g = WH[kind]
        cue(name, at + off, g, fade_out=0.2)
# intro
cue('bass_rumble', 0.0, -18, fade_in=1.0, fade_out=1.5)
cue('impact_big', 0.95, -15)
cue('riser_short', 4.3, -24)
# 9/11
cue('drum_subtle', 6.55, -18)
cue('jet_flyby', 9.0, -26, fade_in=0.4, fade_out=1.0, pan=-0.3)
cue('drum_deep', wt('L03', 'تین') - 0.1, -17)
cue('expl_distant', wt('L03', 'زمیں') - 0.15, -20)
cue('bass_rumble', wt('L03', 'زمیں') - 0.1, -20, fade_out=1.5)
cue('impact_deep', wt('L04', 'القاعدہ') - 0.25, -16)
# Congress, quotes
cue('click_ui', LN['L06']['a'] - 0.2, -26)
for w in ('رہنماؤں', 'مراکز'):
    cue('select_ui', wt('L06', w) - 0.05, -28)
cue('click_ui', LN['L07']['a'] + 0.5, -26)
for w in ('ٹھوس', 'مذاکرات'):
    cue('select_ui', wt('L08', w) - 0.05, -28)
# 7 October strikes
for i, w in enumerate(('کابل', 'قندھار', 'جلال')):
    t0 = wt('L09', w)
    cue('missile', t0 + 0.6 - 2.3, -22, pan=(-0.4, 0.2, 0.5)[i])
    cue('expl_afar' if i % 2 == 0 else 'expl_afar2', t0 + 0.6, -15, pan=(-0.2, 0.1, 0.3)[i])
    cue('war_distant', t0 + 1.0, -21)
cue('war_far', LN['L10']['a'], -22, fade_out=1.0)
cue('heart_impact', lekin - 0.05, -13)
cue('swoosh_myst', LN['L12']['a'] + 0.3, -21)
# Musharraf, agreement
cue('drum_subtle', wt('L13', 'بغاوت') - 0.1, -19)
cue('sign_paper', wt('L14', 'معاہدے', 0) - 0.4, -18)
for w in ('زمین', 'فضائی', 'ہوائی', 'سمندری', 'نیٹو'):
    cue('select_ui', wt('L14', w) - 0.05, -28)
# airbases
cue('cargo_plane', LN['L15']['a'] + 1.0, -21, fade_in=0.5, fade_out=1.5)
cue('cargo_plane', LN['L16']['a'] + 1.0, -23, fade_in=0.5, fade_out=1.5)
cue('jet_flyby', LN['L17']['a'] + 1.2, -20)
cue('heli_far', LN['L18']['a'] + 0.5, -27, fade_in=1.0, fade_out=2.0, length=9)
cue('bass_rumble', wt('L18', 'ڈرون') - 0.3, -24)
for lid in ('L15', 'L16', 'L17', 'L18'):
    cue('drum_subtle', LN[lid]['a'] - 0.1, -22)
# 57,000 flights + strikes
cue('riser_long', wt('L19', 'ستاون') - 7.0, -24, fade_in=2.0, length=7.6, fade_out=0.3)
cue('impact_trailer', wt('L19', 'ستاون') + 0.55, -17)
cue('jet_flyby', LN['L19']['a'] + 2.0, -24, pan=0.4)
cue('jet_flyby', LN['L20']['a'] + 0.4, -23, pan=-0.4)
for i, w in enumerate(('صوبوں', 'مراکز', 'سرکاری', 'عوامی')):
    cue('war_far' if i % 2 else 'war_distant', wt('L20', w) + 0.2, -24)
# NATO supply
cue('impact_deep', LN['L21']['a'] - 0.1, -19)
for w in ('خوراک', 'ایندھن', 'اسلحے', 'گولہ', 'گاڑیوں', 'سازوسامان'):
    cue('select_ui', wt('L22', w) - 0.05, -27)
cue('drum_deep', wt('L22', 'ترسیل') + 0.4, -20)
cue('ship_engine', LN['L23']['a'] + 0.5, -26, fade_in=1.0, fade_out=1.0)
cue('ship_engine', LN['L23']['a'] + 4.5, -27, fade_out=1.0)
cue('truck_pass', LN['L24']['a'] + 0.3, -24, fade_in=1.5, fade_out=3.0, length=12)
cue('truck_steady', LN['L26']['a'], -28, fade_in=1.0, fade_out=2.0)
for lid, ws in (('L26', ('کراچی', 'کوئٹہ', 'چمن')), ('L27', ('کراچی', 'پشاور', 'درہ', 'طورخم'))):
    for w in ws:
        cue('click_ui', wt(lid, w) - 0.05, -27)
# containers
cue('paper_slide', LN['L28']['a'] + 0.3, -22)
cue('drum_subtle', wt('L29', 'ایک') - 0.2, -18)
cue('drum_subtle', wt('L30', 'باون') - 0.2, -19)
cue('riser_long', wt('L31', 'چار') - 6.0, -25, fade_in=2.0, length=6.4, fade_out=0.3)
cue('impact_big', wt('L31', 'چار') + 0.3, -16)
# the question
cue('swoosh_myst', LN['L32']['a'] + 0.9, -22)
cue('bass_rumble', wt('L33', 'فوجی') - 0.3, -16, fade_out=1.2)
cue('impact_trailer', wt('L33', 'چھاؤنی') + 0.1, -14)
# outro
cue('brass_hum', O0 + 0.2, -22, fade_in=1.0, fade_out=2.0, length=8)
cue('impact_big', O0 + 5.55, -15)
for i in range(3):
    cue('select_ui', O0 + 5.2 + 1.3 + i * 0.16, -24)
cue('click_ui', O0 + 5.2 + 3.3, -18)

# ------------------------------------------------------------------ master
mix = voice + mus + fx
peak = np.max(np.abs(mix))
if peak > 0.98:
    mix *= 0.98 / peak
os.makedirs(f'{ROOT}/audio', exist_ok=True)
tmp = f'{ROOT}/audio/mix_raw.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_f32le', tmp], input=mix.astype(np.float32).tobytes(), check=True)
# two-pass loudnorm to −14 LUFS, −1.5 dBTP
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', af, '-ar', str(SR), '-c:a', 'pcm_s24le', f'{ROOT}/audio/mix.wav'], check=True)
os.remove(tmp)
print('mix ok', DUR, 'measured', j['input_i'])
