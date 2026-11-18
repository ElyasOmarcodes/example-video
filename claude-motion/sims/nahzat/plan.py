"""Builds timeline.json: scenes, on-screen phrases (read pace), and sound cues, all in absolute seconds.
main.js and sound.py both read it. Run: python3 sims/nahzat/plan.py"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
WPS = 2.55        # reading pace, words per second
GAP = 0.35        # pause between phrases
TRANS = 1.0       # transition overlap at a scene change

# (scene, kicker, [phrases]); a phrase is text or (text, extra-seconds)
STORY = [
    ('intro', '', [('نهضت', 1.0), ('په رسنیز ډګر کې د نوښت او ابتکار نوی غږ', 0.6),
                   ('پاکستان: خپلواک هېواد، که د لویدیځوالو پوځي چهاوڼۍ؟', 1.2)]),
    ('nyc', '۱۱ سپتمبر ۲۰۰۱ · نیویارک', ['د سپتمبر یوولسمه: دوه نامعلومې الوتکې',
                                       'د نیویارک په نړیوال سوداګریز مرکز کې ولګېدې',
                                       ('شاوخوا درې زره انسانان مړه شول؛ برجونه ړنګ شول', 1.2),
                                       'د دې کار پړه په القاعده واچول شوه']),
    ('congress', '۲۰ اکتوبر · د امریکا کانګرس', ['ولسمشر جورج ډبلیو بش له طالبانو وغوښتل',
                                               'چې د القاعدې مشران امریکا ته وسپاري',
                                               'او ټول ټریننګ سنټرونه وتړي',
                                               'طالبانو وویل: امریکا دې شواهد وړاندې کړي',
                                               'او د خبرو اترو له لارې مخته ولاړ شي']),
    ('strike', '۷ اکتوبر · د شپې ۷ بجې', [('د کابل، کندهار او جلال‌آباد پوځي مرکزونه بمبار شول', 1.0),
                                         ('او له دې سره د امریکا رسمي اشغال پیل شو', 0.6)]),
    ('question', '', [('خو پوښتنه داده:', 0.3), ('دا الوتنې له کوم ځایه کېدلې؟', 1.6)]),
    ('musharraf', 'جنرال پرویز مشرف', ['چې د پوځي کودتا له لارې ځان د پاکستان ولسمشر ټاکلی و',
                                      'د یوه ستراتیژیک نظامي تړون له مخې یې ورکړل:',
                                      ('ځمکه، فضا، هوايي ډګرونه، سمندري لارې', 1.4),
                                      ('او د ناټو د سپلای قراردادونه یې لاسلیک کړل', 0.8)]),
    ('bases', 'په پاکستان کې امریکايي هوايي ډګرونه', [('جیکب‌آباد: د اکمالاتو، الوتکو او ژغورنې عملیاتو مرکز', 1.0),
                                                     ('پسني: لوژستیکي ملاتړ او بیړني عملیات', 1.0),
                                                     ('دالبندین: د افغانستان پولې ته نږدې، د بریدونو لپاره', 1.0),
                                                     ('شمسي: ځانګړي عملیات، ډرون بریدونه او استخبارات', 1.0),
                                                     'هلته لوړپوړي امریکايي چارواکي مېشت وو']),
    ('sorties', 'د امریکا کانګرس · څېړنیز خدمت', [('له پاکستاني خاورې افغانستان ته', 0.3),
                                                 ('له ۵۷ زرو زیاتې پوځي الوتنې', 1.6),
                                                 'ولایتونه، پوځي مرکزونه او دولتي بنسټونه',
                                                 ('او عام‌المنفعه تاسیسات بمبار او ویجاړ شول', 0.6)]),
    ('globe', 'NATO Supply Line', ['د ناټو اکمالاتي لړۍ: د شل کلنې جګړې مهمه موضوع',
                                   'خوراک، تېل، وسلې، مهمات او موټر',
                                   ('له امریکا او اروپا، د کارګو بېړیو په وسیله کراچۍ ته', 1.0)]),
    ('routes', 'د پاکستان له لارې د ناټو اکمالات', ['بیا د خصوصي شرکتونو او ټانکرونو په مرسته افغانستان ته',
                                                   ('جنوبي مسیر: کراچۍ، کوټه، چمن', 1.6),
                                                   ('شمالي مسیر: کراچۍ، پېښور، خیبر، تورخم', 1.6)]),
    ('containers', '۲۰۰۵ – جون ۲۰۱۰ · د مالیې فدرالي محتسب', [('د امریکا پوځي کانټینرونه', 0.4),
                                                            ('۱۶۶٬۹۴۹', 1.4),
                                                            ('د ناټو کانټینرونه', 0.2),
                                                            ('۵۲٬۹۲۹', 1.4),
                                                            ('په شل کلنه جګړه کې: شاوخوا ۴ لکه کانټینرونه', 2.2)]),
    ('final', '', [('اوس پوښتنه داده!', 0.6), ('پاکستان په سیمه کې یو خپلواک هېواد دی', 0.6),
                   ('که د لویدیځوالو پوځي چهاوڼۍ؟', 2.4)]),
    ('outro', '', [('نهضت', 0.4), ('په رسنیز ډګر کې د نوښت او ابتکار نوی غږ', 1.8)]),
]

t = 0.6
scenes, phrases = [], []
for si, (name, kicker, items) in enumerate(STORY):
    s0 = t if si == 0 else t - TRANS / 2
    ph = []
    for it in items:
        text, extra = (it, 0.0) if isinstance(it, str) else it
        n = len(text.split())
        d = 1.0 + n / WPS + extra
        ph.append({'scene': name, 'text': text, 'a': round(t, 3), 'b': round(t + d, 3)})
        t += d + GAP
    t += 0.9  # breath before the next scene
    scenes.append({'name': name, 'kicker': kicker, 'a': round(s0, 3), 'b': round(t + TRANS / 2, 3), 'phrases': ph})
    phrases += ph
for i in range(len(scenes) - 1):
    scenes[i]['b'] = scenes[i + 1]['a'] + TRANS
total = round(t + 0.8, 2)
scenes[-1]['b'] = total
S = {s['name']: s for s in scenes}

def P(scene, i):
    return S[scene]['phrases'][i]

# Sound and animation cues (absolute seconds). Kinds are read by sound.py.
cues = []
def cue(kind, at, **kw):
    cues.append({'kind': kind, 't': round(at, 3), **kw})
for s in scenes[1:]:
    cue('whoosh', s['a'] + TRANS / 2 - 0.35)
cue('logo', 0.9)
cue('rise', S['intro']['phrases'][2]['a'] - 0.2)
# nyc: two planes, impacts, collapse
nyc = S['nyc']
imp1 = P('nyc', 1)['a'] + 0.6
imp2 = imp1 + 2.2
cue('jet', imp1 - 2.6, dur=2.6); cue('impact', imp1)
cue('jet', imp2 - 2.4, dur=2.4); cue('impact', imp2)
collapse = P('nyc', 2)['a'] + 1.0
cue('collapse', collapse, dur=4.0)
cue('count', P('nyc', 2)['a'], dur=1.6)
# congress
cue('crowd', P('congress', 0)['a'] + 0.2, dur=2.5)
cue('gavel', P('congress', 3)['a'])
# strike
st = P('strike', 0)['a']
for k, d in enumerate([0.4, 1.3, 2.1]):
    cue('bomb', st + d, city=k)
cue('jet', st - 1.2, dur=2.4)
cue('boom', P('strike', 1)['a'] + 0.1)
# question
cue('riser', P('question', 1)['a'] - 1.0, dur=1.2)
cue('hit', P('question', 1)['a'] + 0.2)
# musharraf
cue('stamp', P('musharraf', 3)['b'] - 0.6)
for k in range(5):
    cue('tick', P('musharraf', 2)['a'] + 0.25 + k * 0.55)
cue('pen', P('musharraf', 3)['a'], dur=2.0)
# bases
for k in range(4):
    cue('ping', P('bases', k)['a'] + 0.2, base=k)
    cue('jet', P('bases', k)['a'] + 1.6, dur=3.0)
# sorties
cue('count', P('sorties', 1)['a'], dur=2.4)
cue('swarm', P('sorties', 0)['a'], dur=P('sorties', 3)['b'] - P('sorties', 0)['a'])
cue('boom', P('sorties', 3)['a'] + 0.4)
# globe / routes
cue('horn', P('globe', 2)['a'] + 0.6)
cue('sea', S['globe']['a'] + 1.0, dur=S['globe']['b'] - S['globe']['a'] - 1.0)
cue('trucks', P('routes', 0)['a'], dur=S['routes']['b'] - P('routes', 0)['a'] - 0.5)
for k, c in enumerate(['karachi', 'quetta', 'chaman']):
    cue('ping', P('routes', 1)['a'] + 0.3 + k * 0.7, base=k)
for k, c in enumerate(['karachi', 'peshawar', 'khyber', 'torkham']):
    cue('ping', P('routes', 2)['a'] + 0.3 + k * 0.6, base=k)
# containers
cue('stack', P('containers', 1)['a'] - 0.3, dur=2.0)
cue('count', P('containers', 1)['a'], dur=1.4)
cue('stack', P('containers', 3)['a'] - 0.3, dur=1.6)
cue('count', P('containers', 3)['a'], dur=1.4)
cue('riser', P('containers', 4)['a'] - 0.8, dur=1.0)
cue('hit', P('containers', 4)['a'] + 0.2)
# final
cue('riser', P('final', 2)['a'] - 1.2, dur=1.4)
cue('hit', P('final', 2)['a'] + 0.15)
cue('logo', S['outro']['a'] + 0.6)

tl = {'duration': total, 'fps': 30, 'scenes': scenes, 'phrases': phrases, 'cues': cues}
json.dump(tl, open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
print('duration', total, 's;', len(phrases), 'phrases;', len(cues), 'cues')
for s in scenes:
    print(f"  {s['name']:<11} {s['a']:7.2f} – {s['b']:7.2f}")
