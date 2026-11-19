"""Writes HTML character sheets (Pashto labels, Quds font) into characters/out/sheets/ ; screenshot with sheets.cjs"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from specs import CHARACTERS
OUT = os.path.join(HERE, '..', 'out', 'sheets')
FA = '۰۱۲۳۴۵۶۷۸۹'
fa = lambda s: ''.join(FA[int(c)] if c.isdigit() else c for c in str(s))
CSS = """
@font-face{font-family:QB;src:url(../../fonts/quds_bold.ttf)} @font-face{font-family:QXB;src:url(../../fonts/quds_extrabold.ttf)}
@font-face{font-family:QK;src:url(../../fonts/quds_extrablack.ttf)}
*{box-sizing:border-box;margin:0;padding:0} body{background:#0f131b;color:#fff;font-family:QB;direction:rtl;padding:48px 56px}
h1{font-family:QK;font-size:76px;color:#fff;line-height:1.3} h1 span{color:#f2c46a}
.sub{font-size:30px;color:#c9cfdb;margin:6px 0 30px} .grid{display:grid;gap:18px;direction:ltr;align-items:end} .grid img{width:100%;height:auto}
figure{display:flex;flex-direction:column;align-items:center;gap:10px;min-width:0} figure img{display:block;border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,.45)}
figcaption{font-family:QXB;font-size:28px;color:#f2c46a;direction:rtl} .stats{direction:rtl;display:flex;flex-wrap:wrap;gap:14px;margin-top:34px}
.chip{background:#1b2231;border:1px solid #2e3a52;border-radius:40px;padding:10px 26px;font-size:26px;color:#e8ecf4} .chip b{color:#f2c46a;font-family:QXB}
.panel{direction:rtl;background:#151b26;border:1px solid #273249;border-radius:18px;padding:30px 36px;align-self:center;font-size:27px;line-height:1.8;color:#d8deea}
.panel h3{font-family:QXB;color:#f2c46a;font-size:32px;margin-bottom:8px}
"""
def page(title, body):
    return f'<!doctype html><html lang="ps"><head><meta charset="utf-8"><title>{title}</title><style>{CSS}</style></head><body>{body}</body></html>'

info = json.load(open(os.path.join(OUT, 'info.json'))) if os.path.exists(os.path.join(OUT, 'info.json')) else {}
ANG = [(0, 'مخامخ'), (45, '۴۵ درجې'), (90, 'اړخ'), (135, '۱۳۵ درجې'), (180, 'شا'), (225, '۲۲۵ درجې'), (270, 'بل اړخ'), (315, '۳۱۵ درجې')]
for cid, sp in CHARACTERS.items():
    i = info.get(cid, {})
    name = {'president': 'ولسمشر', 'general': 'جنرال'}[cid]
    desc = {'president': 'د ۲۰۰۱ کال ولسمشر · سور نکټایي، شین دریشي', 'general': 'د ۲۰۰۱ کال جنرال · خاکي پوځي دریشي، سور ټوپۍ‌بند'}[cid]
    chips = ''.join(f'<div class="chip">{k}: <b>{v}</b></div>' for k, v in [
        ('قد', fa(i.get('height', '')) + ' متره'), ('هډوکي', fa(163)), ('د مخ حالتونه', fa(10)),
        ('وېښتان', fa(i.get('hair', '')) + ' تاره'), ('د جامو ټوټې', fa(i.get('garments', ''))), ('ټکسچر', 'هیګزفیلډ + MakeHuman CC0')])
    figs = ''.join(f'<figure><img src="{cid}/turn_{a:03d}.png"><figcaption>{l}</figcaption></figure>' for a, l in ANG)
    html = page(name, f'<h1>{name} <span>· درې‌بعدي کرکټر</span></h1><div class="sub">{desc} — له هرې خوا</div><div class="grid" style="grid-template-columns:repeat(8,1fr)">{figs}</div><div class="stats">{chips}</div>')
    open(os.path.join(OUT, f'{cid}_turnaround.html'), 'w').write(html)
    f1 = ''.join(f'<figure><img src="{cid}/{n}.png"><figcaption>{l}</figcaption></figure>' for n, l in [
        ('face_front', 'مخ — مخامخ'), ('face_34', 'مخ — درې‌پرڅلور'), ('face_profile', 'مخ — اړخ'), ('detail_chest', 'سینه او جزئیات'), ('detail_hand', 'لاس او ګوتې')])
    f2 = ''.join(f'<figure><img src="{cid}/{n}.png"><figcaption>{l}</figcaption></figure>' for n, l in [
        ('pose_gesture', 'حرکت: لاس پورته، موسکا'), ('skeleton_front', 'اسکلیټ — مخامخ'), ('skeleton_side', 'اسکلیټ — اړخ')])
    panel = f'''<div class="panel"><h3>د بدن ځانګړنې</h3>
    · بشپړ انساني بدن (MakeHuman، CC0) له ریښتینو تناسباتو سره<br>
    · {fa(163)} هډوکي: ملا، غاړه، اوږې، څنګلې، مړوندونه، ټولې ګوتې، زنګونونه، پښې، ژامه<br>
    · د پوستکي وزنونه: پوستکی او جامې له هډوکو سره سم کږېږي<br>
    · {fa(10)} د مخ حالتونه: سترګې پټول، خوله خلاصول، موسکا، وروځې<br>
    · پوستکی: SSS، مسامات (هیګزفیلډ)، د ږیرې سیوری<br>
    · سترګې: هیګزفیلډ ایرس + لمده قرنیه؛ اصلي وېښتان، وروځې، باڼه<br>
    · GLB د three.js لپاره: {fa(i.get('glb_mb',''))} MB</div>'''
    html2 = page(name + ' details', f'<h1>{name} <span>· جزئیات</span></h1><div class="sub">مخ، لاسونه، اسکلیټ او حرکت</div><div class="grid" style="grid-template-columns:repeat(5,1fr)">{f1}</div><div class="grid" style="grid-template-columns:1fr 1fr 1fr 1.6fr;margin-top:30px">{f2}{panel}</div>')
    open(os.path.join(OUT, f'{cid}_details.html'), 'w').write(html2)
print('ok')
