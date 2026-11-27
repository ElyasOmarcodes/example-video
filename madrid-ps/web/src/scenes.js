// Every scene of the film, timed to the narration beats (data/beats.txt). Only words and facts from the
// script appear on screen. Each section opens with the white form morphing from the last card into a
// round badge (section number + clay icon) and then into the section's first card.
import {E, prog, h, css, spring, cue, PS_DIGITS, clamp, lerp} from './util.js';
import {item, img, card, chip, tag, label, mark, list, listH, shape, typing, strike, meter, ICON} from './kit.js';
import {dotMap, afgShape, mapData} from './map.js';
import {justify, measure} from './kashida.js';

export function buildScenes(stage, beats, LEAD, VE) {
  const BT = Object.fromEntries(beats.map((b) => [b.id, b]));
  const B = (id, d = 0) => {
    if (!BT[id]) throw new Error('no beat ' + id);
    return BT[id].t + d;
  };
  const items = [];
  const add = (...its) => {
    for (const it of its) {
      it.root.style.zIndex = it.isShape ? '1' : String(2 + (it.o?.z || 0));
      stage.appendChild(it.root);
      items.push(it);
    }
    return its[0];
  };
  const CY = 1080;
  const CIRCLE = {x: 540, y: CY, w: 540, h: 540, r: 270};
  const DOT = (x, y) => ({x, y, w: 40, h: 40, r: 20});

  // ---------- section opener: card → circle badge → next card ----------
  function opener(n, name, t0, t1, from, to) {
    const sh = shape([[t0, {...from, o: 1}], [t0 + 0.02, {...CIRCLE, o: 1}, 0.85], [t1 - 0.2, {...to, o: 1}, 0.75], [t1 + 0.5, {...to, o: 0}, 0.35]]);
    sh.isShape = true;
    add(sh);
    cue('open', t0);
    const ring = h('div', '');
    css(ring, {width: '660px', height: '660px'});
    ring.innerHTML = `<svg viewBox="-260 -260 520 520" width="660" height="660"><circle r="250" fill="none" stroke="#ef7d22" stroke-opacity=".55" stroke-width="3" stroke-dasharray="2 16" stroke-linecap="round"/>
      <circle r="250" fill="none" stroke="#ef7d22" stroke-width="6" stroke-linecap="round" stroke-dasharray="120 1451"/></svg>`;
    const svg = ring.querySelector('svg');
    add(item(ring, {x: 540, y: CY, t0: t0 + 0.35, t1: t1 - 0.3, in: 'zoom', snd: false, tick: (t) => { svg.style.transform = `rotate(${(t * 24).toFixed(2)}deg)`; }}));
    add(img(name, 380, {x: 540, y: CY - 6, t0: t0 + 0.4, t1: t1 - 0.3, float: 7, rock: 1.5, snd: false}));
    const badge = h('div', 'badge', PS_DIGITS(n, 1));
    add(item(badge, {x: 540 + 200, y: CY - 200, t0: t0 + 0.65, t1: t1 - 0.3, in: 'pop'}));
  }

  // ---------- small builders ----------
  const tile = (name, text, sub, o) => {
    const e = h('div', 'card tile', `<img src="assets/img/${name}.png"><div class="t">${text}</div>${sub ? `<div class="lbl sm">${sub}</div>` : ''}`);
    css(e, {width: (o.w || 280) + 'px', height: (o.h || 340) + 'px'});
    if (o.imgSize) e.querySelector('img').style.cssText = `width:${o.imgSize}px;height:${o.imgSize}px`;
    return item(e, {in: 'up', ...o});
  };
  // question/statement bubble whose words appear one by one
  // question/statement bubble: lines broken to the box and kashida-justified (last line ragged), words appear one by one
  const bubble = (text, o) => {
    const e = h('div', 'bubble' + (o.me ? ' me' : ''));
    const W = Math.max(o.w || 860, 960), FS = 41, inner = W - 68;
    css(e, {width: W + 'px', textAlign: 'right'});
    const lines = [];
    let cur = [];
    for (const w of text.split(' ')) {
      const tryL = [...cur, w].join(' ');
      if (cur.length && measure(tryL, FS, 700) > inner) { lines.push(cur.join(' ')); cur = [w]; } else cur.push(w);
    }
    if (cur.length) lines.push(cur.join(' '));
    const J = lines.length > 1 ? [...justify(lines.slice(0, -1), FS, 700, inner - 4), lines[lines.length - 1]] : lines;
    const ws = [];
    J.forEach((l) => {
      const ln = h('div', '');
      css(ln, {whiteSpace: 'nowrap'});
      l.split(' ').forEach((w, k, a) => { const s_ = h('span', '', w + (k < a.length - 1 ? ' ' : '')); ln.appendChild(s_); ws.push(s_); });
      e.appendChild(ln);
    });
    const dur = o.dur || ws.length * 0.16;
    ws.forEach((_, i) => cue('key', o.t0 + 0.15 + (i / ws.length) * dur));
    return item(e, {in: 'up', float: 4, ...o, tick: (t) => {
      ws.forEach((s_, i) => { s_.style.opacity = E.out(prog(t, o.t0 + 0.15 + (i / ws.length) * dur, o.t0 + 0.45 + (i / ws.length) * dur)).toFixed(3); });
    }});
  };
  const swap = (seq, x, y, size) => seq.forEach(([name, t0, t1]) => add(img(name, size, {x, y, t0, t1, out: 'shrink'})));
  // dashed frame that tightens around a group
  const frame = (keys, o) => {
    const e = h('div', '');
    css(e, {border: '4px dashed rgba(239,125,34,.55)', borderRadius: '48px'});
    return item(e, {in: 'fade', snd: false, ...o, tick: (t) => {
      const k = E.io(prog(t, o.k0, o.k0 + 1.2));
      css(e, {width: lerp(keys[0][0], keys[1][0], k) + 'px', height: lerp(keys[0][1], keys[1][1], k) + 'px'});
    }});
  };
  // a slowly turning image (loop arrows)
  const spinner = (name, size, o) => {
    const it = img(name, size, {float: 0, ...o});
    const im = it.el.querySelector('img');
    const tk = it.o.tick;
    it.o.tick = (t, el, k) => { im.style.transform = `rotate(${(-(t - o.t0) * (o.speed || 40)).toFixed(2)}deg)`; if (tk) tk(t, el, k); };
    return it;
  };
  // connector arrow between tiles (RTL: points left)
  const arrow = (o) => {
    const e = h('div', '', `<svg width="70" height="30" viewBox="0 0 70 30"><path d="M66 15H8M20 4L6 15l14 11" fill="none" stroke="#ef7d22" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${o.dash ? '2 9' : 'none'}"/></svg>`);
    return item(e, {in: 'side', from: 30, snd: false, ...o});
  };

  const kick = [];
  const K = (n, name, t0, t1) => kick.push({n, name, t0, t1});

  // =====================================================================
  // TITLE — from Islamabad to Madrid
  // =====================================================================
  const T0 = LEAD, S1 = B('S1');
  const MAPG = {x: 540, y: 1010, w: 1012, h: 569, r: 40};
  add(dotMap({x: MAPG.x, y: MAPG.y, t0: T0 + 0.1, t1: S1 - 0.05, in: 'up', dout: 0.4,
    pins: [{id: 'islamabad', t: B('T.a', 0.45)}, {id: 'london', t: B('T.a', 1.05)}, {id: 'madrid', t: B('T.a', 1.55)}],
    routes: [{a: 'islamabad', b: 'london', t: B('T.a', 0.55), d: 0.9}, {a: 'london', b: 'madrid', t: B('T.a', 1.2), d: 0.5}]}));
  add(img('room', 360, {x: 540, y: 1470, t0: B('T.b', 0.1), t1: S1 - 0.05, float: 8}));

  // =====================================================================
  // 1 — the repeated series of meetings
  // =====================================================================
  const S2 = B('S2');
  const TILE = {w: 300, h: 390};
  opener(1, 'loop', S1, B('S1.isb'), MAPG, {x: 870, y: 920, w: TILE.w, h: TILE.h, r: 40});
  K(1, 'د غونډو تکراري لړۍ', B('S1.isb'), S2);
  const tri = {isb: [830, 850], lon: [250, 850], mad: [540, 1420]};
  const cityTile = (name, label_, sub, x, t0, key) => add(tile(name, label_, sub, {x, y: 920, t0, t1: B('S1.p1', -0.1), in: key === 'isb' ? 'fade' : 'up', din: key === 'isb' ? 0.35 : 0.6, w: TILE.w, h: TILE.h,
    path: [[B('S1.again'), {x: tri[key][0], y: tri[key][1], s: 0.82}]], pd: 1.1, imgSize: 240}));
  cityTile('isb', 'اسلام آباد', 'لومړی پړاو', 870, B('S1.isb', 0.25), 'isb');
  add(arrow({x: 705, y: 920, t0: B('S1.lon', 0.1), t1: B('S1.again')}));
  cityTile('lon', 'لندن', 'دویم پړاو', 540, B('S1.lon'), 'lon');
  add(arrow({x: 375, y: 920, t0: B('S1.mad', 0.1), t1: B('S1.again'), dash: true}));
  add(img('figs', 400, {x: 540, y: 1300, t0: B('S1.who', 0.1), t1: B('S1.again', -0.1), out: 'shrink'}));
  add(label('مخالفې څېرې', {x: 540, y: 1555, t0: B('S1.who', 0.4), t1: B('S1.again', -0.1), cls: 'md'}));
  cityTile('mad', 'مادرید', 'دا ځل', 210, B('S1.mad'), 'mad');
  add(spinner('loop', 330, {x: 540, y: 1110, t0: B('S1.again', 0.4), t1: B('S1.p1', -0.1), speed: 30}));
  // the three problems: a big swapping icon + a list that grows
  swap([['turned', B('S1.p1'), B('S1.p2')], ['handsplit', B('S1.p2'), B('S1.p3')], ['agenda', B('S1.p3'), S2 - 0.05]], 540, 840, 400);
  const L1 = {x: 540, y: 1370, w: 820, h: listH(3)};
  add(list(L1.w, [
    {text: 'خپلمنځي اختلافات', t: B('S1.p1', 0.2)},
    {text: 'سیاسي بې‌باوري', t: B('S1.p2', 0.1)},
    {text: 'د ګډې اجنډا نشتون', t: B('S1.p3', 0.1)},
  ], {x: L1.x, y: L1.y, t0: B('S1.p1'), t1: S2 - 0.05}));

  // =====================================================================
  // 2 — limited participants, repeated faces
  // =====================================================================
  const S3 = B('S3');
  const L2 = {x: 540, y: 1100, w: 960, h: listH(4, 128)};
  opener(2, 'copies', S2, B('S2.p1'), {...L1, r: 40}, {...L2, r: 40});
  K(2, 'محدود ګډونوال، تکراري څېرې', B('S2.p1'), S3);
  add(list(L2.w, [
    {text: 'د پخوانیو سیاسي څېرو خپلوان', th: 'portrait', t: B('S2.p1', 1.2)},
    {text: 'پخواني پارلماني استازي', th: 'parliament', t: B('S2.p2')},
    {text: 'د رسنیو او مدني فعالیتونو مخکیني غړي', th: 'media', t: B('S2.p3')},
    {text: 'د بېلابېلو مخالفو ډلو استازي', th: 'banner', t: B('S2.p4')},
  ], {x: L2.x, y: L2.y, t0: B('S2.p1', 0.3), t1: B('S2.chal', -0.1), in: 'fade', din: 0.4, rh: 128, th: 104, fs: 36}));
  add(img('pedestal', 440, {x: 540, y: 880, t0: B('S2.chal'), t1: B('S2.rep', -0.1), rock: 3}));
  add(meter('سیاسي نفوذ', 0.34, {x: 540, y: 1300, w: 700, t0: B('S2.chal', 0.5), t1: B('S2.rep', -0.1), wob: 0.12}));
  add(meter('ولسي ملاتړ', 0.26, {x: 540, y: 1450, w: 700, t0: B('S2.chal', 1.1), t1: B('S2.rep', -0.1), wob: 0.1}));
  add(tag('جدي ننګونې', {x: 540, y: 1560, t0: B('S2.chal2', 0.2), t1: B('S2.rep', -0.1), cls: 'ink'}));
  add(img('copies', 640, {x: 540, y: 1020, t0: B('S2.rep'), t1: B('S2.nat', -0.1), float: 6}));
  add(spinner('loop', 150, {x: 540, y: 1360, t0: B('S2.rep', 0.4), t1: B('S2.nat', -0.1), speed: 60}));
  // wide national consensus (right) vs limited political circles (left)
  const nat = add(tile('hands', 'پراخه ملي اجماع', '', {x: 800, y: 1080, t0: B('S2.nat'), t1: S3 - 0.05, w: 420, h: 520, imgSize: 330}));
  add(mark('x', {x: 800 + 175, y: 1080 - 225, t0: B('S2.circ', 0.3), t1: S3 - 0.05}));
  const circ = add(tile('circle', 'محدودې سیاسي کړۍ', '', {x: 280, y: 1080, t0: B('S2.circ'), t1: S3 - 0.05, w: 420, h: 520, imgSize: 330}));
  nat.o.tick = (t, el) => { el.style.opacity = (1 - 0.5 * E.io(prog(t, B('S2.circ', 0.2), B('S2.circ', 0.9)))).toFixed(3); };
  circ.o.tick = (t, el) => { el.style.boxShadow = `0 0 0 ${(6 * E.out(prog(t, B('S2.circ', 0.5), B('S2.circ', 1.1)))).toFixed(1)}px #ef7d22, 0 30px 70px rgba(110,72,36,.13)`; };

  // =====================================================================
  // 3 — waiting for foreign support
  // =====================================================================
  const S4 = B('S4');
  opener(3, 'palm', S3, B('S3.rep'), {x: 540, y: 1080, w: 900, h: 520, r: 40}, MAPG);
  K(3, 'د بهرنیو ملاتړونو په تمه', B('S3.rep'), S4);
  add(dotMap({x: MAPG.x, y: MAPG.y, t0: B('S3.rep', 0.25), t1: B('S3.q', -0.1), in: 'fade', din: 0.35,
    pins: [{id: 'islamabad', t: B('S3.rep', 0.4)}, {id: 'london', t: B('S3.rep', 0.6)}, {id: 'madrid', t: B('S3.rep', 0.8)}],
    routes: [{a: 'islamabad', b: 'london', t: B('S3.rep', 0.5), d: 0.8}, {a: 'london', b: 'madrid', t: B('S3.rep', 1.1), d: 0.4}],
    cycle: {t0: B('S3.rep', 1.6), t1: B('S3.q'), per: 0.7}}));
  add(spinner('loop', 200, {x: 540, y: 1440, t0: B('S3.rep', 1.2), t1: B('S3.q', -0.1), speed: 50}));
  add(img('magnifier', 400, {x: 540, y: 860, t0: B('S3.q'), t1: B('S3.pk', -0.1)}));
  add(bubble('دغه جریانونه ولې د خپلو سیاسي هڅو لپاره بهرنیو ناستو او ملاتړونو ته اړتیا لري؟', {x: 540, y: 1300, w: 900, t0: B('S3.why'), t1: B('S3.pk', -0.1), dur: 3.2}));
  add(typing({x: 260, y: 1500, t0: B('S3.why', 3.8), t1: B('S3.pk', -0.1)}));
  add(img('cap', 440, {x: 540, y: 860, t0: B('S3.pk'), t1: B('S3.ind', -0.1)}));
  add(chip('د پاکستان د پوځي رژیم ملاتړ', {x: 540, y: 1250, t0: B('S3.pk', 1.4), t1: B('S3.ind', -0.1), cls: 'on'}));
  add(item(h('div', '', '<div style="width:4px;height:90px;margin:auto;background-image:linear-gradient(#ef7d22 50%,transparent 0);background-size:4px 14px"></div>'), {x: 540, y: 1352, t0: B('S3.pk', 2.4), t1: B('S3.ind', -0.1), in: 'fade', snd: false}));
  add(chip('د دوی اړیکې او راټولېدل', {x: 540, y: 1450, t0: B('S3.pk', 2.6), t1: B('S3.ind', -0.1)}));
  add(img('puppet', 480, {x: 540, y: 900, t0: B('S3.ind'), t1: S4 - 0.05, rock: 2}));
  add(chip('سیاسي خپلواکي', {x: 560, y: 1330, t0: B('S3.ind', 0.6), t1: S4 - 0.05, cls: 'soft'}));
  add(mark('q', {x: 300, y: 1330, t0: B('S3.ind', 1.4), t1: S4 - 0.05}));

  // =====================================================================
  // 4 — the bitter experience of the past rule
  // =====================================================================
  const S5 = B('S5');
  const L4 = {x: 540, y: 1360, w: 820, h: listH(4)};
  opener(4, 'facade', S4, B('S4.big'), {x: 540, y: 1100, w: 600, h: 600, r: 300}, {...L4, r: 40});
  K(4, 'د تېرې واکمنۍ ترخې تجربې', B('S4.big'), S5);
  add(img('folder', 400, {x: 540, y: 830, t0: B('S4.big', 0.2), t1: B('S4.crit', -0.1)}));
  add(list(L4.w, [
    {text: 'پخوانی سیاسي فعالیت', t: B('S4.r1')},
    {text: 'سابقه', t: B('S4.r2')},
    {text: 'کړنې', t: B('S4.r2', 0.7)},
    {text: 'د واکمنۍ پر مهال پرېکړې', t: B('S4.r4')},
  ], {x: L4.x, y: L4.y, t0: B('S4.big', 0.4), t1: B('S4.crit', -0.1), in: 'fade', din: 0.4}));
  add(tag('میراث', {x: 540 + 330, y: L4.y - L4.h / 2 - 10, t0: B('S4.her', 0.4), t1: B('S4.crit', -0.1), cls: 'ink'}));
  // the six criticisms as a grid of tiles (reading right → left, top → bottom)
  const G = [[870, 830], [540, 830], [210, 830], [870, 1230], [540, 1230], [210, 1230]];
  const crit = [['bribe', 'فساد', 'S4.c1'], ['mess', 'اداري بې‌نظمي', 'S4.c2'], ['throne', 'سیاسي انحصار', 'S4.c3'],
    ['stamp', 'خپل‌سرې پرېکړې', 'S4.c4'], ['tug', 'د واک پر سر سیالۍ', 'S4.c5'], ['safe', 'د شخصي ګټو خوندي کول', 'S4.c6']];
  crit.forEach(([n, txt, id], i) => add(tile(n, txt, '', {x: G[i][0], y: G[i][1], t0: B(id), t1: B('S4.alt', -0.1 + i * 0.04), w: 310, h: 380, imgSize: 220, in: 'pop', out: 'shrink'})));
  add(img('blueprint', 460, {x: 540, y: 880, t0: B('S4.alt'), t1: B('S4.ans', -0.1)}));
  add(chip('سیاسي بدیل', {x: 700, y: 1300, t0: B('S4.alt', 1.0), t1: B('S4.ans', -0.1)}));
  add(chip('راتلونکی نظام', {x: 360, y: 1300, t0: B('S4.alt', 1.8), t1: B('S4.ans', -0.1)}));
  add(img('bubble', 300, {x: 540, y: 800, t0: B('S4.ans'), t1: S5 - 0.05}));
  add(bubble('د تېرې دورې د ناکامیو او پوښتنو قانع کوونکی ځواب؟', {x: 560, y: 1180, w: 860, t0: B('S4.ans', 0.6), t1: S5 - 0.05, dur: 2.4}));
  add(typing({x: 260, y: 1380, t0: B('S4.ans', 3.4), t1: S5 - 0.05}));

  // =====================================================================
  // 5 — infighting and the crisis of leadership
  // =====================================================================
  const S6 = B('S6');
  const L5 = {x: 540, y: 1300, w: 960, h: listH(5)};
  opener(5, 'crowns', S5, B('S5.f1'), {x: 540, y: 1180, w: 860, h: 300, r: 40}, {...L5, r: 40});
  K(5, 'خپلمنځي اختلافات او د مشرتابه بحران', B('S5.f1'), S6);
  swap([['tablesplit', B('S5.f1'), B('S5.f2')], ['clash', B('S5.f2'), B('S5.f3')], ['handsplit', B('S5.f3'), B('S5.f4')], ['figs', B('S5.f4'), B('S5.f5')], ['tug', B('S5.f5'), B('S5.each', -0.1)]], 540, 790, 340);
  add(list(L5.w, [
    {text: 'د مشرتابه پر سر سیالۍ', t: B('S5.f1', 0.3)},
    {text: 'د شخصي ګټو ټکر', t: B('S5.f2')},
    {text: 'د متقابل باور نشتون', t: B('S5.f3')},
    {text: 'د ډلو وېش', t: B('S5.f4')},
    {text: 'د نفوذ پر سر شخړې', t: B('S5.f5')},
  ], {x: L5.x, y: L5.y, t0: B('S5.f1', 0.4), t1: B('S5.each', -0.1), in: 'fade', din: 0.4}));
  add(img('crowns', 600, {x: 540, y: 1060, t0: B('S5.each'), t1: B('S5.no', -0.1)}));
  add(img('puzzlebad', 380, {x: 540, y: 850, t0: B('S5.no'), t1: B('S5.loop', -0.1)}));
  add(list(820, [
    {text: 'ګډ سیاسي دریځ', t: B('S5.no', 0.3), state: [[B('S5.no', 2.0), 'x']]},
    {text: 'منل شوې رهبري', t: B('S5.no', 1.0), state: [[B('S5.no', 2.6), 'x']]},
  ], {x: 540, y: 1300, t0: B('S5.no', 0.2), t1: B('S5.loop', -0.1)}));
  add(spinner('loop', 440, {x: 540, y: 960, t0: B('S5.loop'), t1: S6 - 0.05, speed: 26}));
  add(chip('د اختلافاتو حل', {x: 540, y: 1360, t0: B('S5.loop', 2.0), t1: S6 - 0.05, cls: 'ghost'}));
  add(strike(300, {x: 540, y: 1360, t0: B('S5.loop', 4.6), t1: S6 - 0.05}));
  add(chip('د هماغو اختلافاتو تکرار', {x: 540, y: 1500, t0: B('S5.loop', 5.6), t1: S6 - 0.05, cls: 'on'}));

  // =====================================================================
  // 6 — from Afghanistan to foreign doors
  // =====================================================================
  const S7 = B('S7');
  opener(6, 'doors', S6, B('S6.claim'), {x: 540, y: 1430, w: 520, h: 90, r: 45}, DOT(540, 1000));
  K(6, 'له افغانستانه تر بهرنیو دروازو', B('S6.claim'), S7);
  add(img('throne', 480, {x: 540, y: 1000, t0: B('S6.claim', 0.1), t1: B('S6.out', -0.1)}));
  add(dotMap({x: MAPG.x, y: 960, t0: B('S6.out'), t1: B('S6.sup', -0.1), in: 'up', afg: B('S6.out', 0.3),
    pins: [{id: 'kabul', t: B('S6.out', 0.6), label: 'افغانستان'}], flow: {t: B('S6.out', 1.2), from: 'kabul', n: 12}}));
  add(img('suitcase', 280, {x: 540, y: 1450, t0: B('S6.out', 1.0), t1: B('S6.sup', -0.1)}));
  add(img('knock', 520, {x: 540, y: 1010, t0: B('S6.sup'), t1: B('S6.act', -0.1)}));
  add(chip('د بهرنیو لورو ملاتړ', {x: 540, y: 1400, t0: B('S6.sup', 1.0), t1: B('S6.act', -0.1)}));
  const A = [[790, 860, 'room', 'غونډې', 'S6.a1'], [290, 860, 'podium', 'اعلامیې', 'S6.a2'], [790, 1240, 'studio', 'مرکې', 'S6.a3'], [290, 1240, 'phone', 'ټولنیزې رسنۍ', 'S6.a4']];
  A.forEach(([x, y, n, txt, id]) => add(tile(n, txt, '', {x, y, t0: B(id, -0.15), t1: B('S6.alt', -0.1), w: 330, h: 340, imgSize: 240, in: 'pop'})));
  add(frame([[1000, 860], [860, 820]], {x: 540, y: 1050, t0: B('S6.act', 0.2), t1: B('S6.alt', -0.1), k0: B('S6.a4', 0.8)}));
  add(tag('محدود', {x: 540, y: 1050, t0: B('S6.a4', 1.2), t1: B('S6.alt', -0.1), cls: 'ink'}));
  add(img('empty', 460, {x: 540, y: 930, t0: B('S6.alt'), t1: S7 - 0.05}));
  add(chip('د هېواد دننه پراخ ولسي ملاتړ', {x: 540, y: 1300, t0: B('S6.alt', 0.8), t1: S7 - 0.05, cls: 'soft'}));
  add(chip('څرګند عملي بدیل', {x: 560, y: 1440, t0: B('S6.alt', 3.4), t1: S7 - 0.05}));
  add(mark('x', {x: 300, y: 1440, t0: B('S6.alt', 4.6), t1: S7 - 0.05}));

  // =====================================================================
  // 7 — seeking political shelter in Pakistan's lap
  // =====================================================================
  const S8 = B('S8');
  opener(7, 'gloved', S7, B('S7.chg'), {x: 540, y: 1300, w: 860, h: 300, r: 40}, DOT(540, 1020));
  K(7, 'د پاکستان په غېږ کې د سیاسي پناه لټول', B('S7.chg'), S8);
  add(img('gloved', 600, {x: 540, y: 1020, t0: B('S7.chg'), t1: B('S7.pol', -0.1)}));
  add(img('weight', 420, {x: 540, y: 860, t0: B('S7.pol'), t1: B('S7.sens', -0.1)}));
  add(chip('سیاستونه', {x: 720, y: 1270, t0: B('S7.pol', 1.6), t1: B('S7.sens', -0.1)}));
  add(chip('فشارونه', {x: 370, y: 1270, t0: B('S7.pol', 2.4), t1: B('S7.sens', -0.1)}));
  add(afgShape({x: 540, y: 1000, s: 0.95, t0: B('S7.sens'), t1: B('S7.meet', -0.1), pulse: true}));
  add(chip('د افغانانو حساسیت', {x: 540, y: 1420, t0: B('S7.sens', 0.6), t1: B('S7.meet', -0.1), cls: 'on'}));
  add(img('cap', 440, {x: 540, y: 860, t0: B('S7.meet'), t1: B('S7.contra', -0.1)}));
  add(list(820, [
    {text: 'د همدې رژیم سیاسي چاپېریال', t: B('S7.meet', 1.4)},
    {text: 'د همدې رژیم ملاتړ', t: B('S7.meet', 2.4)},
  ], {x: 540, y: 1290, t0: B('S7.meet', 1.2), t1: B('S7.contra', -0.1)}));
  add(label('پورې تړلې ناستې', {x: 540, y: 1460, t0: B('S7.meet', 3.6), t1: B('S7.contra', -0.1), cls: 'md'}));
  add(img('signpost', 440, {x: 540, y: 840, t0: B('S7.contra'), t1: B('S7.ans', -0.1), rock: 2}));
  add(card(380, 160, '<div class="lbl md" style="line-height:160px">دریځ</div>', {x: 760, y: 1290, t0: B('S7.contra', 0.8), t1: B('S7.ans', -0.1), path: [[B('S7.contra', 3.2), {x: 800, y: 1290, s: 1}]]}));
  add(card(380, 160, '<div class="lbl md" style="line-height:160px">عملي سیاسي تګلاره</div>', {x: 320, y: 1290, t0: B('S7.contra', 1.6), t1: B('S7.ans', -0.1), path: [[B('S7.contra', 3.2), {x: 280, y: 1290, s: 1}]]}));
  add(tag('تناقض', {x: 540, y: 1460, t0: B('S7.contra', 3.4), t1: B('S7.ans', -0.1), cls: 'ink'}));
  add(img('megaphone', 440, {x: 540, y: 840, t0: B('S7.ans'), t1: S8 - 0.05}));
  add(list(820, [
    {text: 'بهرنۍ اړیکې', t: B('S7.ans', 5.0), icon: 'q'},
    {text: 'سیاسي خپلواکي', t: B('S7.ans', 5.8), icon: 'q'},
  ], {x: 540, y: 1290, t0: B('S7.ans', 4.8), t1: S8 - 0.05}));
  add(chip('ولس ته روښانه ځواب', {x: 540, y: 1480, t0: B('S7.ans', 8.4), t1: S8 - 0.05, cls: 'on'}));

  // =====================================================================
  // 8 — no popular legitimacy
  // =====================================================================
  const S9 = B('S9');
  const L8 = {x: 540, y: 1140, w: 820, h: listH(2)};
  opener(8, 'scale', S8, B('S8.core'), {x: 540, y: 1480, w: 520, h: 90, r: 45}, {...L8, r: 40});
  K(8, 'د ولسي مشروعیت نشتون', B('S8.core'), S9);
  add(list(L8.w, [
    {text: 'یوازې د غونډو جوړول', t: B('S8.core', 1.6), dim: B('S8.core', 6.0)},
    {text: 'یوازې د ګډونوالو راټولول', t: B('S8.core', 3.2), dim: B('S8.core', 6.0)},
  ], {x: L8.x, y: L8.y, t0: B('S8.core', 0.3), t1: B('S8.m1', -0.1), in: 'fade', din: 0.4}));
  add(label('اساسي ستونزه یوازې دا نه ده', {x: 540, y: 1330, t0: B('S8.core', 6.2), t1: B('S8.m1', -0.1), cls: 'sm'}));
  add(img('puzzle', 380, {x: 540, y: 820, t0: B('S8.m1'), t1: B('S8.rep', -0.1)}));
  add(list(820, [
    {text: 'ولسي ملاتړ', t: B('S8.m1', 0.2), icon: 'empty', state: [[B('S8.m1', 1.0), 'x']]},
    {text: 'ګډه اجنډا', t: B('S8.m2'), icon: 'empty', state: [[B('S8.m2', 0.6), 'x']]},
    {text: 'متقابل باور', t: B('S8.m3'), icon: 'empty', state: [[B('S8.m3', 0.6), 'x']]},
    {text: 'منل شوی سیاسي مشرتابه', t: B('S8.m4'), icon: 'empty', state: [[B('S8.m4', 1.0), 'x']]},
  ], {x: 540, y: 1340, t0: B('S8.m1'), t1: B('S8.rep', -0.1)}));
  add(img('micstand', 540, {x: 540, y: 960, t0: B('S8.rep'), t1: B('S8.leg', -0.1)}));
  add(chip('د څو محدودو سیاسي څېرو راټولېدل', {x: 540, y: 1330, t0: B('S8.rep', 0.6), t1: B('S8.leg', -0.1)}));
  add(chip('د افغانستان د خلکو استازیتوب', {x: 590, y: 1470, t0: B('S8.rep', 2.6), t1: B('S8.leg', -0.1), cls: 'soft'}));
  add(mark('x', {x: 200, y: 1470, t0: B('S8.rep', 3.6), t1: B('S8.leg', -0.1)}));
  add(img('deal', 320, {x: 790, y: 820, t0: B('S8.leg'), t1: S9 - 0.05}));
  add(img('bin', 320, {x: 290, y: 820, t0: B('S8.leg', 0.3), t1: S9 - 0.05}));
  add(list(900, [
    {text: 'د بهرنیو ناچیزه غونډو له لارې', t: B('S8.x1'), state: [[B('S8.x1', 1.0), 'x']]},
    {text: 'د ناچیزه سیاسي معاملاتو له لارې', t: B('S8.x2'), state: [[B('S8.x2', 1.0), 'x']]},
    {text: 'د تکراري ګډو وډو اعلامیو له لارې', t: B('S8.x3'), state: [[B('S8.x3', 1.2), 'x']]},
  ], {x: 540, y: 1260, t0: B('S8.x1', -0.2), t1: S9 - 0.05}));
  add(chip('ولسي مشروعیت نه ترلاسه کېږي', {x: 540, y: 1500, t0: B('S8.x3', 2.6), t1: S9 - 0.05, cls: 'on'}));

  // =====================================================================
  // 9 — many meetings, few results
  // =====================================================================
  const C1 = B('C1');
  const SLOT = {x: 540, y: 960, w: 520, h: 560, r: 44};
  opener(9, 'stack', S9, B('S9.move'), {x: 540, y: 1260, w: 900, h: 290, r: 40}, SLOT);
  K(9, 'غونډې ډېرې، لاسته راوړنې کمې', B('S9.move'), C1);
  // the venue slot: landmarks cycle (Islamabad → London → Madrid → …) while the problems stay put
  {
    const e = h('div', 'card');
    css(e, {width: SLOT.w + 'px', height: SLOT.h + 'px', overflow: 'hidden'});
    const V = [['isb', 'اسلام آباد'], ['lon', 'لندن'], ['mad', 'مادرید']].map(([n, txt]) => {
      const v = h('div', '', `<img src="assets/img/${n}.png" style="width:380px;height:380px;display:block;margin:40px auto 0"><div class="lbl md" style="margin-top:10px">${txt}</div>`);
      css(v, {position: 'absolute', left: '0', top: '0', width: '100%', height: '100%'});
      e.appendChild(v);
      return v;
    });
    const per = 1.7, c0 = B('S9.move', 0.6);
    for (let k = 1; k < 12; k++) cue('swap', c0 + k * per);
    add(item(e, {x: SLOT.x, y: SLOT.y, t0: B('S9.move', 0.3), t1: C1 - 0.05, in: 'fade', din: 0.35, path: [[B('S9.stay'), {x: 300, y: 820, s: 0.62}]], pd: 1.0,
      tick: (t) => {
        const u = Math.max(0, (t - c0) / per);
        const i = Math.floor(u), f = E.io(clamp((u - i - 0.7) / 0.3));
        V.forEach((v, j) => {
          const a = ((i % 3) + 3) % 3, b = (a + 1) % 3;
          const y = j === a ? -f * 100 : j === b ? (1 - f) * 100 : 100;
          v.style.transform = `translateY(${y.toFixed(2)}%)`;
          v.style.opacity = j === a ? (1 - f).toFixed(3) : j === b ? f.toFixed(3) : '0';
        });
      }}));
  }
  add(label('د ناستو ځای', {x: 540, y: 1300, t0: B('S9.move', 0.8), t1: B('S9.stay', -0.1), cls: 'sm'}));
  add(img('anchor', 340, {x: 800, y: 820, t0: B('S9.stay', 0.3), t1: C1 - 0.05}));
  add(list(860, [
    {text: 'خپلمنځي اختلافات', t: B('S9.stay', 0.9), icon: 'pin'},
    {text: 'د ګډې اجنډا نشتون', t: B('S9.s2'), icon: 'pin'},
    {text: 'د تېرې واکمنۍ میراث', t: B('S9.s3'), icon: 'pin'},
    {text: 'د ولسي ملاتړ کمزورتیا', t: B('S9.s4'), icon: 'pin'},
  ], {x: 540, y: 1360, t0: B('S9.stay', 0.7), t1: C1 - 0.05}));

  // =====================================================================
  // CLOSING
  // =====================================================================
  const eq = (name, a, b, y, t0, t1) => {
    const e = h('div', 'card');
    css(e, {width: '960px', height: '230px', display: 'flex', alignItems: 'center', gap: '26px', padding: '0 34px'});
    e.innerHTML = `<img src="assets/img/${name}.png" style="width:180px;height:180px;flex:none">
      <div style="flex:1;display:flex;flex-direction:column;gap:6px"><div class="lbl" style="text-align:right">${a}</div>
      <div style="display:flex;align-items:center;gap:16px"><svg width="44" height="24" viewBox="0 0 44 24"><path d="M40 12H6M16 3L5 12l11 9" fill="none" stroke="#ef7d22" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span class="lbl md">${b}</span></div></div><div class="x">${ICON.x}</div>`;
    const xm = e.querySelector('.x');
    cue('nope', t0 + 1.4);
    return add(item(e, {x: 540, y, t0, t1, in: 'up', tick: (t) => {
      const k = spring(prog(t, t0 + 1.4, t0 + 2.0) * 1.5, 9, 0.5);
      xm.style.transform = `scale(${k.toFixed(3)})`; xm.style.opacity = clamp(k * 2).toFixed(2);
    }}));
  };
  const C4 = B('C4');
  eq('cards', 'پاشلې غونډې', 'سیاسي ځواک', 790, C1, C4 - 0.1);
  eq('bin', 'ګډې وډې اعلامیې', 'ولسي مشروعیت', 1060, B('C2'), C4 - 0.05);
  eq('palm', 'بهرني احتمالي ملاتړونه', 'د افغانانو باور', 1330, B('C3'), C4);
  // the series may go on…
  const M = mapData();
  M.cities.next = [44, 470];
  add(dotMap({x: MAPG.x, y: MAPG.y, t0: C4, t1: B('C6', -0.1), in: 'fade', din: 0.4,
    pins: [{id: 'islamabad', t: C4 + 0.3}, {id: 'london', t: C4 + 1.0}, {id: 'madrid', t: C4 + 1.7}, {id: 'next', t: B('C5', 1.4), label: '؟', below: true}],
    routes: [{a: 'islamabad', b: 'london', t: C4 + 0.4, d: 0.8}, {a: 'london', b: 'madrid', t: C4 + 1.2, d: 0.5}, {a: 'madrid', b: 'next', t: B('C5', 0.3), d: 1.2}]}));
  add(img('fog', 300, {x: 540, y: 1470, t0: B('C5', 0.4), t1: B('C6', -0.1)}));
  add(img('cards', 340, {x: 540, y: 820, t0: B('C6'), t1: B('C7', -0.1), rock: 2}));
  add(list(900, [
    {text: 'د دوی ترمنځ اختلافات', th: 'turned', t: B('C6', 0.4)},
    {text: 'سیاسي بې‌باوري', th: 'handsplit', t: B('C6', 1.6)},
    {text: 'پر بهرنیو ملاتړونو تکیه', th: 'palm', t: B('C6', 2.8)},
  ], {x: 540, y: 1300, t0: B('C6', 0.2), t1: B('C7', -0.1), rh: 116, th: 96}));
  add(img('magnifier', 420, {x: 540, y: 900, t0: B('C7'), t1: B('C8', -0.1)}));
  add(chip('د سیاسي ادعاوو اعتبار', {x: 560, y: 1320, t0: B('C7', 1.2), t1: B('C8', -0.1), cls: 'soft'}));
  add(mark('q', {x: 250, y: 1320, t0: B('C7', 2.2), t1: B('C8', -0.1)}));
  // final: the destiny of Afghanistan
  add(img('mountain', 520, {x: 540, y: 820, t0: B('C8'), t1: VE + 0.2, float: 6}));
  add(list(980, [
    {text: 'د تېرې واکمنۍ د کړنو حساب نه شي ورکولای', t: B('C8.a', 0.2), icon: 'x'},
    {text: 'ګډ سیاسي دریځ نه لري', t: B('C8.b', 0.2), icon: 'x'},
    {text: 'د بهرنیو قدرتونو ملاتړ ته سترګې په لار', t: B('C8.c', 0.2), icon: 'x'},
  ], {x: 540, y: 1330, t0: B('C8.a'), t1: VE + 0.2, fs: 34}));
  add(label('د هغو څېرو له لوري نه ټاکل کېږي چې:', {x: 540, y: 1110, t0: B('C8', 1.6), t1: VE + 0.2}));

  return {
    kick,
    render(t) { for (const it of items) it.render(t); },
  };
}
