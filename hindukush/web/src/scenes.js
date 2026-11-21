// The film, scene by scene. Times come from the aligned narration (word stamps); every key phrase
// lands on the word the narrator says.
import {E, clamp, prog, lerp, h, css, spring, PS_DIGITS, cue} from './util.js';
import {backdrop, hero, headline, kicker, line, chips, stamp, bubble, strike, at} from './kit.js';
import {mapView, marker, arc, ripple, place, LL} from './map.js';
import {people, radar, network, callCard, videoFrame, echo, recapRow} from './widgets.js';

export const SEC = {
  1: {color: '#0e1b3d', short: 'د پاکستان پوځي رژیم سیاست'},
  2: {color: '#3b5bdb', short: 'د نیابتي ډلو د ملاتړ شواهد'},
  3: {color: '#e5484d', short: 'د نیابتي سیاست پایلې'},
  4: {color: '#12a37f', short: 'د افغانستان دریځ او حل'},
};

// the Hindukush logo as one unit: wordmark (left) + mark (right) at their true proportions
function brandLogo(s, tMark, tWord, {w = 800, rays = false, sweep = null} = {}) {
  const H = (w * 559) / 1699, WW = (w * 1338) / 1699, MW = w - WW;
  const wrap = h('div', 'blogo');
  css(wrap, {width: w + 'px', height: H + 'px'});
  wrap.innerHTML = `<div class="bw" style="width:${WW}px;height:${H}px"><img src="assets/brand/logo_word.png"><div class="sw"></div></div>
    <img class="bm" src="assets/brand/logo_mark.png" style="left:${WW}px;width:${MW}px;height:${H}px">`;
  const bw = wrap.querySelector('.bw'), bm = wrap.querySelector('.bm'), sw = wrap.querySelector('.sw');
  const rs = [];
  if (rays) for (let i = 0; i < 14; i++) {
    const r = h('div', 'ray');
    css(r, {left: WW + MW / 2 + 'px', top: H * 0.56 + 'px', background: i % 2 ? 'var(--ink)' : 'var(--acc)'});
    wrap.insertBefore(r, wrap.firstChild); rs.push(r);
  }
  s.content.appendChild(wrap);
  cue('stamp', tMark + 0.1);
  s.parts.push({render(t) {
    const mp = spring(prog(t, tMark, tMark + 1.1) * 1.6, 9, 0.5), mr = E.out(prog(t, tMark, tMark + 1.0));
    bm.style.transform = `scale(${mp}) rotate(${(1 - mr) * -120}deg)`;
    bm.style.filter = `drop-shadow(0 0 ${30 * clamp(mp)}px rgba(245,160,0,.45))`;
    const wp = E.out(prog(t, tWord, tWord + 1.0));
    bw.style.clipPath = `inset(-5% 0 -5% ${(1 - wp) * 100}%)`;
    bw.style.transform = `translateX(${(1 - wp) * 60}px)`;
    bw.style.filter = wp < 0.99 ? `blur(${(1 - wp) * 14}px)` : 'none';
    if (sweep != null) {
      const sp = lerp(-40, 140, E.io(prog(t, sweep, sweep + 0.75)));
      sw.style.background = `linear-gradient(100deg, transparent ${sp - 18}%, rgba(255,255,255,.95) ${sp}%, transparent ${sp + 18}%)`;
    }
    rs.forEach((r, i) => {
      const p = spring(prog(t, tMark - 0.25 + i * 0.04, tMark + 0.75 + i * 0.04) * 1.6, 9, 0.6);
      const out = 1 - E.in(prog(t, tMark + 0.3 + i * 0.033, tMark + 0.8 + i * 0.033));
      r.style.height = `${330 * clamp(p, 0, 1.2)}px`;
      r.style.opacity = String(t > tMark - 0.25 ? out : 0);
      r.style.transform = `translateX(-50%) rotate(${(360 / 14) * i}deg) translateY(${120 + 140 * (1 - out)}px)`;
    });
  }});
  return {wrap};
}

export function buildScenes(TL, LEAD) {
  const IT = Object.fromEntries(TL.items.map((x) => [x.id, x]));
  // word time: first word in the item (head then body) containing needle, optionally after time `after`
  const W = (id, needle, after = -1) => {
    const it = IT[id];
    const w = [...it.hw, ...it.bw].find((x) => x[0].includes(needle) && x[1] > after);
    if (!w) throw new Error(`word ${needle} not in ${id}`);
    return w[1];
  };
  const B0 = (id) => IT[id].bw[0][1]; // body start
  let idx = 0;
  function base(sec, o = {}) {
    const el = h('div', 'scene');
    if (sec) el.style.setProperty('--sec', SEC[sec].color);
    const bg = backdrop(idx++, o.tint);
    el.appendChild(bg.el);
    const content = h('div', 'layer');
    el.appendChild(content);
    const parts = [bg];
    const s = {
      el, content, bg, sec, parts,
      add(b, parent = content) { parent.appendChild(b.el); parts.push(b); return b; },
      render(t) { for (const p of parts) p.render(t); },
    };
    return s;
  }
  const scenes = [];
  const sections = {1: {...SEC[1], points: []}, 2: {...SEC[2], points: []}, 3: {...SEC[3], points: []}, 4: {...SEC[4], points: []}};

  // ---------------- title ----------------
  {
    const it = IT.T;
    const s = base(0);
    const map = mapView({camera: [[0, 70.3, 35.2, 0.95], [5, 68.4, 33.2, 0.62], [it.b + 2, 67.8, 32.4, 0.52]], drawAfg: LEAD - 0.1, oy: 760});
    map.add(arc(LL.rawalpindi, LL.kabul, LEAD + 3.4, LEAD + 5.0, {lift: 0.35}));
    map.add(marker(...LL.rawalpindi, LEAD + 3.2, {color: 'var(--hot)'}));
    map.add(marker(...LL.kabul, LEAD + 4.8, {color: 'var(--ink)'}));
    map.add(place('افغانستان', 65.6, 33.6, LEAD + 1.4, 'big'));
    s.add(map);
    const fade = h('div', 'mapfade');
    s.content.appendChild(fade);
    // logo sting
    const logo = brandLogo(s, 0.05, 0.4, {w: 760});
    s.parts.push({render(t) {
      const mv = E.io(prog(t, LEAD - 0.3, LEAD + 0.9));
      logo.wrap.style.transform = `translate(-50%, -50%) translateY(${lerp(0, -650, mv)}px) scale(${lerp(1, 0.5, mv)})`;
    }});
    const t1 = W('T', 'تبلیغاتو'), t2 = W('T', 'نیابتي'), t3 = W('T', 'افغانستان');
    s.add(at(headline('له تبلیغاتو', 'up', t1 - 0.25, {size: 120}), 1180));
    s.add(at(headline('تر نیابتي جګړې', 'tone', t2 - 0.2, {size: 132, toneN: 2}), 1330));
    const sub = h('div', 'tsub', 'د افغانستان پر ضد د پاکستان پوځي رژیم سیاست');
    const subw = at({el: sub, render(t) {
      const k = E.io(prog(t, t3 - 0.1, t3 + 0.8));
      sub.style.clipPath = `inset(-20% 0 -20% ${(1 - k) * 100}% round 40px)`;
    }}, 1560);
    s.add(subw);
    s.t0 = 0; s.t1 = it.b; s.chrome = false; s.brand = false; s.trans = 'wipe'; s.td = 1.4;
    s.focus = [540, 760];
    scenes.push(s);
  }

  // ---------------- section opener ----------------
  const SECT = {S1: 'د پاکستان پوځي رژیم\nسیاست', S2: 'د نیابتي ډلو د ملاتړ\nد افشا کېدو مهم شواهد', S3: 'د پاکستان پوځي رژیم\nد نیابتي سیاست پایلې', S4: 'د افغانستان دریځ\nاو د ستونزو حل'};
  function section(id, n, img, trans) {
    const it = IT[id];
    const s = base(n, {tint: ['#ffffff', '#ffffff']});
    s.bg.f.style.background = 'var(--sec)';
    s.el.classList.add('secscene');
    const num = h('div', 'secnum', PS_DIGITS(n, 1));
    s.content.appendChild(num);
    const tin = (scenes[scenes.length - 1].t1 + it.a) / 2 - 0.25;
    const hr = s.add(hero(img, tin - 0.2, {y: 700, scale: 0.92}));
    const kk = h('div', 'seckick', `<span class="bar"></span><span>${it.head}</span><span class="bar"></span>`);
    s.add(at({el: kk, render(t) {
      const k = E.out(prog(t, it.a - 0.2, it.a + 0.6));
      kk.style.opacity = String(k);
      kk.style.letterSpacing = `${(1 - k) * 14}px`;
    }}, 1130));
    s.add(at(headline(SECT[id], 'up', B0(id) - 0.15, {size: 88}), 1230));
    s.parts.push({render(t) {
      const k = E.out(prog(t, tin - 0.5, tin + 1.4));
      num.style.opacity = String(k);
      num.style.transform = `translate(-50%, -50%) scale(${1.25 - 0.25 * k}) translateY(${Math.sin(t * 0.5) * 10}px)`;
    }});
    s.t0 = it.a; s.t1 = it.b; s.chrome = false; s.brand = false; s.trans = trans; s.focus = [540, 700];
    scenes.push(s);
  }

  // ---------------- point scene ----------------
  function point(id, n, total, cfg) {
    const it = IT[id];
    const sec = it.sec;
    const s = base(sec);
    const t0 = it.a;
    const prev = scenes[scenes.length - 1];
    const tin = Math.min(t0 - 0.3, (prev.t1 + t0) / 2 - 0.25); // middle of the incoming transition
    s.tin = tin;
    if (!cfg.noIdx) {
      const idxEl = h('div', 'idx', PS_DIGITS(n));
      s.content.appendChild(idxEl);
      s.parts.push({render(t) {
        const k = E.out(prog(t, tin - 0.4, tin + 1.2));
        idxEl.style.opacity = String(k);
        idxEl.style.transform = `translateX(${(1 - k) * -80 + Math.sin(t * 0.3) * 8}px)`;
      }});
    }
    if (cfg.img) s.hero = s.add(hero(cfg.img, tin - 0.2, cfg.heroOpts || {}));
    if (cfg.before) cfg.before(s, it);
    const hy = cfg.hy ?? 1140;
    s.add(at(kicker(`${PS_DIGITS(n)} / ${PS_DIGITS(total)}`, cfg.kick || SEC[sec].short, Math.min(t0 - 0.35, tin + 0.4)), hy - 74));
    const hd = s.add(at(headline(cfg.head || it.head, cfg.style || 'up', t0 - 0.1, {size: cfg.size, toneN: cfg.toneN}), hy));
    if (cfg.hl) hd.el.style.setProperty('--hl', cfg.hl);
    if (cfg.extra) cfg.extra(s, it);
    s.t0 = it.a; s.t1 = it.b; s.trans = cfg.trans || 'slide'; s.td = cfg.td;
    s.focus = cfg.focus || [540, cfg.heroOpts?.y ?? 700];
    sections[sec].points.push({t0: it.a, t1: it.b});
    scenes.push(s);
    return s;
  }
  const Y1 = 1450, Y2 = 1590; // body rows

  // ---------------- part 1 ----------------
  section('S1', 1, 'cap', 'zoom');
  point('P01', 1, 8, {img: 'magnifier', style: 'up', trans: 'iris',
    extra(s) {
      const tb = W('P01', 'ادعاوې', B0('P01')), te = W('P01', 'شواهد');
      s.add(bubble('ګواښ!', tb, {x: 225, y: 470, rot: -6, t1: te}));
      s.add(bubble('ګواښ!', tb + 0.35, {x: 860, y: 610, rot: 5, t1: te}));
      s.add(bubble('ګواښ!', tb + 0.7, {x: 300, y: 930, rot: 3, t1: te}));
      s.add(at(strike('قانع کوونکي شواهد', W('P01', 'قانع') - 0.1, W('P01', 'وړاندې')), Y1 + 10));
      s.add(stamp('بې‌ثبوته', W('P01', 'وړاندې') + 0.3, {x: 560, y: 880, rot: -7}));
    }});
  point('P02', 2, 8, {style: 'tone', hl: 'var(--hot)', noIdx: true, hy: 1260, trans: 'slide', focus: [540, 640],
    before(s) {
      const a = IT.P02.a;
      const map = mapView({camera: [[a - 1, 67.2, 33.2, 0.62], [a + 4, 69.6, 33.7, 0.95], [IT.P02.b + 2, 69.9, 33.9, 1.05]], oy: 640});
      const tw = W('P02', 'ملکي', B0('P02')), th = W('P02', 'هوايي');
      const tg = [[LL.khost, 0], [LL.paktika, 0.5], [LL.kunar, 1.0], [LL.nangarhar, 1.4]];
      for (const [ll, d] of tg) {
        map.add(arc(LL.rawalpindi, ll, th - 1.2 + d, th + 0.2 + d, {lift: 0.3}));
        map.add(marker(...ll, th + 0.2 + d));
      }
      map.add(marker(...LL.rawalpindi, a + 0.4, {color: 'var(--ink)'}));
      map.add(place('افغانستان', 67.3, 34.2, a + 0.2));
      map.add(place('پاکستان', 72.2, 31.4, a + 0.5));
      s.add(map);
      s.content.appendChild(h('div', 'mapfade'));
      const lbl = h('div', 'chip hot', '<i></i><span>ملکي اهداف</span>');
      css(lbl, {position: 'absolute', left: '540px', top: '1080px'});
      s.add({el: lbl, render(t) { const k = spring(prog(t, tw, tw + 0.9) * 1.6); lbl.style.opacity = String(clamp(k * 3)); lbl.style.transform = `translate(-50%,0) scale(${0.6 + 0.4 * k})`; }});
    },
    extra(s) {
      s.add(at(line('د <b>نامسؤله وسلوالو</b> د شتون په پلمه', W('P02', 'نامسؤله') - 0.2), Y1 + 50));
      s.add(at(chips([['هوايي بریدونه', W('P02', 'هوايي'), 'dark']]), Y2 + 60));
    }});
  point('P03', 3, 8, {img: 'megaphone', style: 'out', trans: 'stack',
    extra(s) {
      s.add(echo('ګواښ', {x: 380, y: 660, t0: W('P03', 'ګواښونو') - 0.3, n: 6}));
      s.add(at(chips([['نړیوالې غونډې', W('P03', 'نړیوالو')], ['سیمه‌ییزې غونډې', W('P03', 'سیمه‌ییزو')]]), Y1 - 20));
      s.add(at(headline('بې ځایه ادعاوې تکراروي', 'mark', W('P03', 'ځایه') - 0.25, {size: 62}), Y2 + 20));
    }});
  point('P04', 4, 8, {img: 'puppet', style: 'mark', trans: 'iris', heroOpts: {y: 640, scale: 0.86},
    extra(s) {
      s.add(network({hub: [540, 440], t0: 0, nodes: [['داعش', 205, 900, W('P04', 'داعش') - 0.3, 'hot'], ['نیابتي ډلې', 870, 900, W('P04', 'نیابتي', B0('P04')) - 0.3, 'hot']]}));
      s.add(at(line('د <b>بې‌ثباتۍ</b> لپاره', W('P04', 'بې‌ثباتۍ') - 0.2), Y1 - 10));
      s.add(at(chips([['د فعالیت زمینه', W('P04', 'زمینه') - 0.3, 'dark']]), Y2 + 10));
    }});
  point('P05', 5, 8, {style: 'box', noIdx: true, hy: 1260, trans: 'flip', focus: [540, 640],
    before(s) {
      const a = IT.P05.a, ti = W('P05', 'اسلام‌اباد');
      const map = mapView({camera: [[a - 1, 68.5, 33.0, 0.6], [W('P05', 'سیمو') - 0.5, 71.0, 32.6, 0.78], [ti + 0.2, 73.05, 33.69, 2.4], [IT.P05.b + 2, 73.05, 33.69, 2.6]], oy: 640});
      map.add(marker(...LL.peshawar, W('P05', 'ولکې'), {color: 'var(--ink)'}));
      map.add(marker(...LL.quetta, W('P05', 'ولکې') + 0.4, {color: 'var(--ink)'}));
      map.add(marker(...LL.islamabad, ti, {big: true, label: 'اسلام‌اباد', side: 'left'}));
      map.add(place('پاکستان', 70.4, 29.6, a + 0.4));
      s.add(map);
      s.content.appendChild(h('div', 'mapfade'));
      s.add(hero('hideout', W('P05', 'پټنځایونه', B0('P05')) - 0.4, {x: 840, y: 330, scale: 0.42}));
    },
    extra(s) {
      s.add(at(line('د پاکستان <b>تر ولکې لاندې</b> سیمې', W('P05', 'ولکې') - 0.3), Y1 + 40));
      s.add(at(chips([['پټنځایونه', W('P05', 'پټنځایونه', B0('P05')), 'dark'], ['د اوسېدو ځایونه', W('P05', 'اوسېدو')]]), Y2 + 60));
    }});
  point('P06', 6, 8, {img: 'money', style: 'up', trans: 'slide',
    extra(s) {
      s.add(at(chips([['تمویل', W('P06', 'تمویل')], ['تجهیز', W('P06', 'تجهیز')], ['امکانات', W('P06', 'امکانات')]]), Y1 - 20));
      s.add(at(chips([['↓', W('P06', 'امکانات') + 0.3, 'arrow']]), Y1 + 90));
      s.add(at(chips([['نیابتي ډلې', W('P06', 'برابروي') - 0.4, 'dark']]), Y2 + 60));
    }});
  point('P07', 7, 8, {img: 'radar', style: 'tone', hl: '#e08a00', toneN: 1, trans: 'rise',
    before(s) {
      const t = IT.P07.a;
      const r = s.add(radar({t0: s.tin, blips: [[-2.4, 0.78, t + 1.6], [-0.6, 0.66, t + 2.4], [0.9, 0.82, t + 3.1], [2.6, 0.7, t + 3.9]]}));
      s.content.insertBefore(r.el, s.hero.el);
    },
    extra(s) {
      s.add(at(line('د افغانستان د <b>امنیت د ګواښلو</b> لپاره', W('P07', 'امنیت') - 0.2), Y1));
      s.add(at(chips([['استخباراتي فعالیتونه', W('P07', 'استخباراتي', B0('P07')) - 0.2, 'dark']]), Y2 + 20));
    }});
  point('P08', 8, 8, {img: 'magnet', style: 'out', trans: 'stripes', heroOpts: {y: 650, scale: 0.9},
    extra(s) {
      s.add(at(chips([['احساساتي', W('P08', 'احساساتي')], ['بېکاره', W('P08', 'بېکاره')]]), 1290));
      s.add(people({y: 1500, t0: W('P08', 'ځوانان', B0('P08')) - 0.4, t1: W('P08', 'هڅوي') + 0.2, ty: 640}));
    }});

  // ---------------- part 2 ----------------
  section('S2', 2, 'folder', 'zoom');
  point('P09', 1, 4, {img: 'phone', style: 'up', size: 76, head: 'د سمیع سادات او\nالله داد فدايي مکالمې', hy: 1150, trans: 'stack', heroOpts: {y: 520, scale: 0.66},
    extra(s) {
      s.add(callCard({y: 760, names: ['سمیع سادات', 'الله داد فدايي'], t0: IT.P09.a + 0.2, tw: W('P09', 'غږیزې') - 0.3}));
      s.add(at(chips([['«متحدې جبهې»', W('P09', 'متحدې')], ['غږیزې مکالمې', W('P09', 'غږیزې'), 'dark']]), 1480));
      s.add(at(line('د مخالفینو د اړیکو په اړه <b>مهم بحثونه</b>', W('P09', 'مهم') - 0.4), 1620));
    }});
  point('P10', 2, 4, {style: 'mark', size: 80, head: 'د الله داد فدايي\nویډیويي اعتراف', trans: 'slide', focus: [540, 720],
    before(s) {
      s.add(videoFrame({y: 330, img: 'camera', label: 'اعتراف', t0: s.tin - 0.2, tplay: W('P10', 'اعتراف', B0('P10'))}));
    },
    extra(s) {
      s.add(at(line('د استدلال <b>یوه مهمه برخه</b>', W('P10', 'استدلال') - 0.3), Y1 + 20));
    }});
  point('P11', 3, 4, {img: 'stamp', style: 'box', trans: 'fade', td: 1.0,
    extra(s) {
      s.add(at(chips([['مکالمې', W('P11', 'مکالمو')], ['اعترافونه', W('P11', 'اعترافونو')]]), Y1 - 20));
      s.add(at(chips([['اهمیت یې زیات کړی', W('P11', 'اهمیت') - 0.2, 'dark']]), Y2 + 30));
    }});
  point('P12', 4, 4, {img: 'evidence', style: 'up', size: 86, head: 'د مخالفو ډلو\nد ملاتړ شواهد', trans: 'stripes', heroOpts: {y: 640, scale: 0.9},
    extra(s) {
      const tg = W('P12', 'هندوکش');
      const card = h('div', 'hkcard', '<span>له</span><img src="assets/brand/logo_full.png"><span>سره شته</span>');
      s.add(at({el: card, render(t) { const k = spring(prog(t, tg - 0.3, tg + 0.7) * 1.6); card.style.opacity = String(clamp(k * 3)); card.style.transform = `scale(${0.6 + 0.4 * k})`; }}, 1440));
      s.add(at(chips([['ښکاره بېلګه', W('P12', 'ښکاره') - 0.2, 'dark']]), Y2 + 70));
    }});

  // ---------------- part 3 ----------------
  section('S3', 3, 'domino', 'zoom');
  point('P13', 1, 6, {style: 'tone', toneN: 1, hl: 'var(--hot)', noIdx: true, hy: 1260, trans: 'flip', focus: [540, 640],
    before(s) {
      const a = IT.P13.a;
      const map = mapView({camera: [[a - 1, 70.5, 33.0, 0.9], [IT.P13.b + 2, 68.5, 31.5, 0.46]], oy: 640});
      map.add(ripple(...LL.rawalpindi, a + 0.4, {max: 700}));
      map.add(marker(...LL.rawalpindi, a + 0.2, {big: true}));
      map.add(place('افغانستان', 65.6, 33.6, a + 1.0));
      map.add(place('سیمه', 72.0, 28.6, a + 2.0));
      s.add(map);
      s.content.appendChild(h('div', 'mapfade'));
      s.add(hero('shield_crack', W('P13', 'جدي') - 0.6, {x: 850, y: 330, scale: 0.42}));
    },
    extra(s) {
      s.add(at(line('د افغانستان او سیمې امنیت', W('P13', 'افغانستان', B0('P13')) - 0.3), Y1 + 40));
      s.add(at(chips([['جدي ګواښونه', W('P13', 'جدي') - 0.2, 'hot']]), Y2 + 60));
    }});
  point('P14', 2, 6, {img: 'jenga', style: 'out', size: 84, head: 'د افغانستان\nد بې‌ثباتۍ هڅې', trans: 'rise', hy: 1150,
    extra(s) {
      const hi = s.hero.img, tn = W('P14', 'ناامني');
      s.parts.push({render(t) { const w = clamp((t - tn) / 3) * 6 + 1.5; hi.style.rotate = `${Math.sin(t * 3.1) * w}deg`; hi.style.transformOrigin = '50% 90%'; }});
      s.add(at(chips([['ناامني', tn - 0.2, 'hot'], ['امنیتي وضعیت ګډوډوي', W('P14', 'ګډوډوي') - 0.3]]), Y2 - 20));
    }});
  point('P15', 3, 6, {img: 'storm', style: 'mark', trans: 'slide',
    extra(s) {
      const hi = s.hero.img, a = IT.P15.a, b = IT.P15.b;
      s.parts.push({render(t) { hi.style.scale = String(0.85 + 0.3 * E.soft(prog(t, a, b))); }});
      s.add(at(chips([['فعالیت', W('P15', 'فعالیت')], ['پراختیا', W('P15', 'پراختیا')], ['ځایونه', W('P15', 'ځایونه')]]), Y1 - 20));
      s.add(at(line('د <b>سیمې امنیت</b> پرې ګواښي', W('P15', 'سیمي') - 0.3), Y2 + 20));
    }});
  point('P16', 4, 6, {img: 'pawn_push', style: 'box', trans: 'iris',
    extra(s) {
      s.add(at(line('د <b>بې‌کاره او احساساتي</b> ځوانانو استخدام', W('P16', 'بې‌کاره') - 0.3), Y1 - 10));
      s.add(at(chips([['د نیابتي جګړې پراخول', W('P16', 'پراخولو') - 0.5, 'dark']]), Y2 + 30));
    }});
  point('P17', 5, 6, {img: 'columns', style: 'up', size: 86, head: 'د نړیوالې ټولنې\nبې‌تفاوتي', trans: 'stack',
    extra(s) {
      s.add(at(chips([['سوله', W('P17', 'سولې')], ['امنیت', W('P17', 'امنیت')], ['عدالت', W('P17', 'عدالت')]]), Y1 - 20));
      s.add(stamp('چوپتیا', W('P17', 'چوپتیا') - 0.1, {x: 540, y: 990, rot: 6}));
      s.add(at(line('د افغانانو <b>نیوکې او اعتراضونه</b>', W('P17', 'نیوکې') - 0.3), Y2 + 30));
    }});
  point('P18', 6, 6, {img: 'bridge', style: 'out', size: 80, head: 'د پاکستان د ګاونډیتوب\nاصولو ته زیان', trans: 'wipe',
    extra(s) {
      s.add(at(line('د دواړو هېوادونو د <b>ښو اړیکو</b> مخه نیسي', W('P18', 'اړیکو') - 0.5), Y2 - 10));
      const tx = W('P18', 'دسیسې') - 0.2, xb = h('div', 'xbadge', '✕');
      css(xb, {left: '480px', top: '560px'});
      cue('stamp', tx + 0.1);
      s.add({el: xb, render(t) { const k = spring(prog(t, tx, tx + 0.9) * 1.6); xb.style.opacity = String(clamp(k * 4)); xb.style.transform = `scale(${0.3 + 0.7 * k}) rotate(${(1 - k) * -90}deg)`; }});
    }});

  // ---------------- part 4 ----------------
  section('S4', 4, 'compass', 'zoom');
  point('P19', 1, 4, {img: 'handshake', style: 'tone', trans: 'slide',
    extra(s) {
      s.add(at(chips([['ژمن', W('P19', 'ژمن') - 0.2, 'dark'], ['د ښو اړیکو پراختیا', W('P19', 'پراختیا') - 0.3]]), Y1));
    }});
  point('P20', 2, 4, {img: 'shield_ok', style: 'mark', trans: 'flip',
    extra(s) {
      s.add(at(chips([['امنیتي ځواکونه', W('P20', 'ځواکونه') - 0.3]]), Y1 - 20));
      s.add(at(line('د دسیسو د <b>مخنیوي وړتیا</b>', W('P20', 'مخنیوي') - 0.4), Y2 + 20));
    }});
  point('P21', 3, 4, {img: 'fire_out', style: 'box', trans: 'rise',
    extra(s) {
      s.add(at(strike('د جګړې اور بلول', W('P21', 'اور') - 0.3, W('P21', 'نه', W('P21', 'لاره'))), Y1 - 10));
      s.add(at(chips([['د حل لاره نه ده', W('P21', 'لاره') - 0.2, 'dark']]), Y2 + 30));
    }});
  point('P22', 4, 4, {img: 'scale', style: 'up', trans: 'iris',
    extra(s) {
      s.add(at(chips([['تعامل', W('P22', 'تعامل', B0('P22'))], ['متقابل درناوی', W('P22', 'متقابل')], ['مشروع ګټې', W('P22', 'مشروع')]]), Y1));
      s.add(at(line('د ستونزو د حل <b>یوازینۍ معقوله لار</b>', W('P22', 'یوازینۍ') - 0.3), Y2 + 40));
    }});

  // ---------------- conclusion ----------------
  {
    const it = IT.P23;
    const s = base(4);
    s.el.style.setProperty('--sec', SEC[4].color);
    const tA = W('P23', 'افغانستان', W('P23', 'ثبات'));
    const ph = (t) => E.io(prog(t, tA - 0.9, tA + 0.1));
    const g1 = h('div', 'layer'), g2 = h('div', 'layer');
    s.content.append(g1, g2);
    const tin = (scenes[scenes.length - 1].t1 + it.a) / 2 - 0.3;
    s.add(at(headline('پایله', 'tone', tin + 0.3, {size: 120}), 170), g1);
    const rows = [['cap', 'دښمنانه سیاست', W('P23', 'دښمنانه')], ['megaphone', 'تبلیغاتي کمپاینونه', W('P23', 'تبلیغاتي')], ['jet', 'پر ملکي اهدافو بمبارۍ', W('P23', 'بمبارۍ') - 0.6], ['puppet', 'د نیابتي ډلو ملاتړ', W('P23', 'ملاتړ') - 0.7]];
    rows.forEach(([img, tx, tt], i) => s.add(recapRow(img, tx, tt - 0.3, 400 + i * 180), g1));
    s.add(recapRow('shield_crack', 'د سیمې امنیت او ثبات ګواښي', W('P23', 'امنیت') - 0.4, 1150, 'hot'), g1);
    s.add(hero('mountain', tA - 0.2, {y: 640, scale: 0.95}), g2);
    s.add(at(headline('افغانستان د ښه ګاونډیتوب\nپلوی دی', 'tone', tA, {size: 84, toneN: 2}), 1150), g2);
    s.add(at(headline('د هر ډول شومو هڅو مخه نیسي', 'box', W('P23', 'شومو') - 0.6, {size: 62}), 1510), g2);
    s.parts.push({render(t) {
      const k = ph(t);
      g1.style.transform = `translateY(${-k * 260}px) scale(${1 - 0.1 * k})`;
      g1.style.opacity = String(1 - k);
      g1.style.filter = k > 0.01 ? `blur(${k * 12}px)` : 'none';
      g1.style.display = k >= 1 ? 'none' : '';
      g2.style.display = k <= 0 ? 'none' : '';
      g2.style.opacity = String(k);
    }});
    s.t0 = it.a; s.t1 = it.b; s.trans = 'fade'; s.td = 1.6; s.chrome = false; s.focus = [540, 640];
    scenes.push(s);
  }

  // ---------------- end card ----------------
  {
    const s = base(0, {tint: ['#f5a000', '#3b5bdb']});
    const grid = h('div', 'endgrid');
    s.content.appendChild(grid);
    const t0 = IT.P23.b + 0.5;
    const lg = brandLogo(s, t0 + 0.25, t0 + 0.8, {w: 900, rays: true, sweep: t0 + 1.8});
    const bar = h('div', 'endline'), handle = h('div', 'endhandle', '@hindukush');
    s.content.append(bar, handle);
    s.parts.push({render(t) {
      grid.style.transform = `translateY(${-(t - t0) * 24}px)`;
      const kb = spring(prog(t, t0 + 1.95, t0 + 2.9) * 1.6), kh = spring(prog(t, t0 + 2.25, t0 + 3.2) * 1.6);
      bar.style.transform = `translateX(-50%) scaleX(${kb})`;
      handle.style.opacity = String(clamp(kh * 2));
      handle.style.transform = `translateX(-50%) translateY(${(1 - kh) * 30}px) scale(${0.94 + 0.06 * kh})`;
      const br = 1 + Math.sin((t - t0) * 1.4) * 0.012 * (t > t0 + 2 ? 1 : 0);
      lg.wrap.style.transform = `translate(-50%, -50%) scale(${br})`;
    }});
    s.t0 = IT.P23.b + 0.3; s.t1 = IT.P23.b + 4.8; s.chrome = false; s.brand = false;
    scenes.push(s);
  }
  return {scenes, sections};
}
