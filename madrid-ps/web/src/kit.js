// Building blocks. Every block is {el, render(t)} and render(t) is a pure function of t.
// Items are centre-anchored in the 1080×1920 frame; they enter softly (blur + scale/rise + fade),
// can glide between keyed positions (path) and leave softly. Shapes morph their geometry over time.
import {E, clamp, prog, lerp, h, css, spring, noise, cue} from './util.js';

export const W = 1080, H = 1920;
const ICON = {
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="#ef7d22" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="#ef7d22" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  q: '<svg viewBox="0 0 24 24" fill="none" stroke="#ef7d22" stroke-width="2.6" stroke-linecap="round"><path d="M9 9a3 3 0 1 1 4.2 2.75c-.75.35-1.2 1-1.2 1.8V14"/><circle cx="12" cy="18" r=".6" fill="#ef7d22"/></svg>',
  dot: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#ef7d22"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="#ef7d22" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>',
  empty: '<svg viewBox="0 0 24 24" fill="none" stroke="#d2c3b2" stroke-width="2.4"><rect x="4" y="4" width="16" height="16" rx="4"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="#ef7d22" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
};
export {ICON};

// keyed values: [[t, v], ...] → value at time t, each change easing over `d` seconds from its key time
export function keyed(keys, t, d = 0.8, ease = E.io) {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [tk, vk] = keys[i];
    if (t < tk) break;
    const k = ease(prog(t, tk, tk + (keys[i][2] ?? d)));
    v = typeof v === 'number' ? lerp(v, vk, k) : mix(v, vk, k);
  }
  return v;
}
const mix = (a, b, k) => {
  const o = {};
  for (const key in b) o[key] = typeof b[key] === 'number' && typeof a[key] === 'number' ? lerp(a[key], b[key], k) : k < 0.5 ? a[key] ?? b[key] : b[key];
  for (const key in a) if (!(key in o)) o[key] = a[key];
  return o;
};

// ---------- the generic item ----------
// o: {x, y, t0, t1, in: 'pop'|'up'|'fade'|'zoom'|'down'|'side', out: 'fade'|'up'|'down'|'shrink',
//     din, dout, path: [[t,{x,y,s,o}], ...], float, rot, z, snd}
let SEQ = 0;
export function item(el, o) {
  const root = h('div', 'abs');
  root.appendChild(el);
  el.style.position = 'relative';
  const id = SEQ++;
  const din = o.din ?? 0.6, dout = o.dout ?? 0.45;
  const t0 = o.t0, t1 = o.t1 ?? 1e9;
  if (o.z != null) root.style.zIndex = String(o.z);
  if (o.snd !== false) cue(o.snd || (o.in === 'pop' || o.in === 'zoom' ? 'pop' : 'soft'), t0, {id});
  const ph = (id * 1.37) % 6.28;
  const self = {
    el, root, o,
    render(t) {
      if (t < t0 - 0.02 || t > t1 + dout + 0.02) { root.style.display = 'none'; return false; }
      root.style.display = '';
      const p = o.path ? keyed([[0, {x: o.x, y: o.y, s: o.s ?? 1, o: 1}], ...o.path], t, o.pd ?? 0.9) : {x: o.x, y: o.y, s: o.s ?? 1, o: 1};
      const ki = prog(t, t0, t0 + din), ko = prog(t, t1, t1 + dout);
      const a = E.out(ki), b = E.in(ko);
      let x = p.x, y = p.y, s = p.s, r = 0;
      const mode = o.in || 'up';
      if (mode === 'pop') s *= 0.35 + 0.65 * spring(ki * 1.5, 8, 0.55);
      else if (mode === 'zoom') s *= 1.25 - 0.25 * a;
      else if (mode === 'up') y += (1 - a) * 70;
      else if (mode === 'down') y -= (1 - a) * 70;
      else if (mode === 'side') x += (1 - a) * (o.from ?? -120);
      const om = o.out || 'fade';
      if (om === 'up') y -= b * 60;
      else if (om === 'down') y += b * 60;
      else if (om === 'shrink') s *= 1 - 0.4 * b;
      if (o.float) { y += Math.sin(t * 1.25 + ph) * o.float; r += Math.sin(t * 0.8 + ph) * (o.rock ?? 0); }
      if (o.grow) s *= 1 + o.grow * (1 - Math.exp(-Math.max(0, t - t0) / 5)); // slow push-in while on screen
      const op = (mode === 'pop' ? clamp(ki * 3) : a) * (1 - b) * (p.o ?? 1);
      const blur = (1 - a) * (o.blurIn ?? 14) + b * 12 + (p.blur || 0);
      root.style.opacity = op.toFixed(3);
      root.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      root.style.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : 'none';
      if (o.tick) o.tick(t, el, {a, b, ki, ko});
      return true;
    },
  };
  return self;
}

// ---------- concrete blocks ----------
// clay icon with its own ambient life: a breathing glow behind it, small satellites orbiting it and,
// now and then, a soft ring rippling out from its base
export const img = (name, size, o = {}) => {
  const e = h('div', 'cc');
  css(e, {width: size + 'px', height: size + 'px'});
  const amb = h('div', 'amb');
  const gl = h('div', 'gl');
  amb.appendChild(gl);
  const sats = [];
  const rgs = [];
  if (o.amb !== false) {
    for (let k = 0; k < 3; k++) {
      const d = h('i');
      const sz = [14, 10, 18][k];
      css(d, {width: sz + 'px', height: sz + 'px', margin: `${-sz / 2}px 0 0 ${-sz / 2}px`, background: k === 1 ? '#13213f' : '#ef7d22', opacity: k === 1 ? '.55' : '.8'});
      amb.appendChild(d);
      sats.push({d, r: size * [0.52, 0.6, 0.47][k], sp: [0.55, -0.4, 0.33][k], ph: k * 2.1, tilt: [0.34, 0.3, 0.42][k]});
    }
    for (let k = 0; k < 2; k++) { const r = h('div', 'rg'); amb.appendChild(r); rgs.push(r); }
  }
  e.appendChild(amb);
  const im = h('img', 'img');
  im.src = `assets/img/${name}.png`;
  css(im, {position: 'relative'});
  e.appendChild(im);
  const t0 = o.t0;
  const user = o.tick;
  return item(e, {in: 'pop', float: 10, rock: 1.2, grow: 0.07, ...o, tick: (t, el, k) => {
    const life = t - t0;
    gl.style.transform = `translate(-50%,-50%) scale(${(0.92 + 0.08 * Math.sin(life * 1.6)).toFixed(3)})`;
    gl.style.opacity = (0.75 + 0.25 * Math.sin(life * 1.1)).toFixed(3);
    for (const st of sats) {
      const a = st.ph + life * st.sp * 2;
      const x = Math.cos(a) * st.r, y = Math.sin(a) * st.r * st.tilt + size * 0.06;
      st.d.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(0.8 + 0.2 * Math.sin(a)).toFixed(3)})`;
      st.d.style.zIndex = Math.sin(a) > 0 ? '2' : '0';
    }
    rgs.forEach((r, j) => {
      const u = ((life + j * 1.6) % 3.2) / 3.2;
      const w = size * (0.35 + 0.75 * u);
      css(r, {width: w + 'px', height: w * 0.32 + 'px', marginLeft: -w / 2 + 'px', marginTop: -w * 0.16 + 'px', opacity: (0.7 * (1 - u) * clamp(life / 0.8)).toFixed(3)});
    });
    if (user) user(t, el, k);
  }});
};
export const card = (w, hh, html, o) => {
  const e = h('div', 'card', html || '');
  css(e, {width: w + 'px', height: hh + 'px'});
  return item(e, {in: 'up', float: 4, ...o});
};
export const chip = (text, o = {}) => {
  const e = h('div', 'chip ' + (o.cls || ''), `<span class="d"></span><span>${text}</span>`);
  const d = e.querySelector('.d');
  return item(e, {in: 'up', float: 4, ...o, tick: (t) => { d.style.transform = `scale(${(1 + 0.3 * Math.max(0, Math.sin((t - o.t0) * 3.4))).toFixed(3)})`; }});
};
export const tag = (text, o = {}) => item(h('div', 'tag ' + (o.cls || ''), text), {in: 'pop', float: 5, ...o});
export const label = (text, o = {}) => item(h('div', 'lbl ' + (o.cls || ''), text), {in: 'up', snd: false, ...o});
export const mark = (kind, o = {}) => item(h('div', 'x', ICON[kind]), {in: 'pop', snd: kind === 'x' ? 'nope' : 'pop', ...o});

// a list card whose rows arrive one by one at their own times; a row can later change state (dot → x / ok / q)
// rows: [{text, t, icon:'dot'|'x'|..., th:'imgname', state:[[t,'x']], dim:t}]
export const listH = (n, rh = 92) => 28 + n * rh + (n - 1) * 2;
export function list(w, rows, o) {
  const e = h('div', 'card');
  const rh = o.rh || 92;
  css(e, {width: w + 'px', height: listH(rows.length, rh) + 'px', padding: '14px 0'});
  const R = rows.map((r) => {
    const el = h('div', 'row', `${r.th ? `<div class="th"><img src="assets/img/${r.th}.png"></div>` : `<div class="ic">${ICON[r.icon || 'dot']}</div>`}<span>${r.text}</span>`);
    if (o.rh) { el.style.height = rh + 'px'; if (o.fs) el.style.fontSize = o.fs + 'px'; }
    if (o.th) { const th = el.querySelector('.th'); if (th) css(th, {width: o.th + 'px', height: o.th + 'px'}); }
    e.appendChild(el);
    if (r.t > o.t0 + 0.05) cue('tick', r.t);
    for (const [ts] of r.state || []) cue('mark', ts);
    return {r, el, ic: el.querySelector('.ic'), cur: r.icon || 'dot'};
  });
  // the newest row carries a soft highlight and an orange bar that glide down as rows arrive
  const hl = h('div', 'rowhl'), bar = h('div', 'ind');
  css(e, {position: 'relative'});
  e.prepend(hl); e.appendChild(bar);
  const it = item(e, {in: 'up', float: 4, ...o});
  const base = it.render;
  it.render = (t) => {
    if (!base(t)) return false;
    let yk = 0, on = 0;
    R.forEach((x, i) => {
      const k = E.io(prog(t, x.r.t, x.r.t + 0.45));
      if (k > 0) { yk = lerp(yk, i, i === 0 ? 1 : k); on = Math.max(on, k); }
    });
    const y = 14 + yk * (rh + 2);
    css(hl, {top: (y + 6).toFixed(1) + 'px', height: (rh - 12) + 'px', opacity: (on * (0.75 + 0.25 * Math.sin(t * 2.2))).toFixed(3)});
    css(bar, {top: (y + rh * 0.22).toFixed(1) + 'px', height: (rh * 0.56).toFixed(1) + 'px', opacity: on.toFixed(3)});
    for (const x of R) {
      const k = E.out(prog(t, x.r.t, x.r.t + 0.5));
      x.el.style.opacity = (k * (x.r.dim != null ? 1 - 0.6 * E.io(prog(t, x.r.dim, x.r.dim + 0.6)) : 1)).toFixed(3);
      x.el.style.transform = `translateX(${((1 - k) * -40).toFixed(1)}px)`;
      if (x.ic) {
        let st = x.r.icon || 'dot';
        for (const [ts, s] of x.r.state || []) if (t >= ts) st = s;
        if (st !== x.cur) { x.ic.innerHTML = ICON[st]; x.cur = st; }
        const last = (x.r.state || []).filter(([ts]) => t >= ts).pop();
        const pk = last ? spring(prog(t, last[0], last[0] + 0.6) * 1.5, 9, 0.5) : 1;
        x.ic.style.transform = `scale(${(0.6 + 0.4 * pk).toFixed(3)})`;
        x.ic.style.background = st === 'x' ? '#fff1e6' : st === 'empty' ? 'transparent' : '';
      }
    }
    return true;
  };
  return it;
}

// morphing shape: geometry keyed over time {x,y,w,h,r,o,c} — the soft white form that becomes circle, card, pill…
export function shape(keys, o = {}) {
  const e = h('div', 'abs shape');
  if (o.z != null) e.style.zIndex = String(o.z);
  const d = o.d ?? 0.9;
  return {
    el: e, root: e,
    render(t) {
      if (t < keys[0][0] - 0.01 || (o.t1 != null && t > o.t1)) { e.style.display = 'none'; return false; }
      const g = keyed(keys.map(([kt, v, kd]) => [kt, v, kd]), t, d, E.io);
      if (g.o <= 0.001) { e.style.display = 'none'; return false; }
      e.style.display = '';
      const s = g.s ?? 1;
      e.style.width = g.w.toFixed(1) + 'px';
      e.style.height = g.h.toFixed(1) + 'px';
      e.style.borderRadius = Math.min(g.r, g.w / 2, g.h / 2).toFixed(1) + 'px';
      e.style.transform = `translate(${(g.x - g.w / 2).toFixed(1)}px,${(g.y - g.h / 2).toFixed(1)}px) scale(${s})`;
      e.style.opacity = (g.o ?? 1).toFixed(3);
      e.style.background = g.c || '';
      return true;
    },
  };
}

// a typing-dots bubble (like a reply being written)
export function typing(o) {
  const e = h('div', 'bubble', '<div class="dots3"><i></i><i></i><i></i></div>');
  const it = item(e, {in: 'pop', ...o});
  const base = it.render;
  const dots = [...e.querySelectorAll('i')];
  it.render = (t) => {
    if (!base(t)) return false;
    dots.forEach((d, i) => {
      const k = Math.max(0, Math.sin((t * 5.2 - i * 0.7)));
      d.style.transform = `translateY(${(-k * 8).toFixed(1)}px)`;
      d.style.opacity = (0.45 + 0.55 * k).toFixed(2);
    });
    return true;
  };
  return it;
}

// strike line across an element-sized box: grows from right to left at t
export function strike(w, o) {
  const e = h('div', 'strike');
  css(e, {width: w + 'px'});
  cue('strike', o.t0);
  return item(e, {in: 'fade', din: 0.01, ...o, snd: false, tick: (t, el) => { el.style.transform = `scaleX(${E.io(prog(t, o.t0, o.t0 + 0.45)).toFixed(3)})`; }});
}

// a meter: label + bar whose fill wobbles low (qualitative, no numbers)
export function meter(text, fill, o) {
  const e = h('div', '', `<div class="lbl" style="text-align:right;margin-bottom:16px">${text}</div><div class="bar"><i></i></div>`);
  css(e, {width: (o.w || 620) + 'px'});
  const bar = e.querySelector('i');
  return item(e, {in: 'up', ...o, tick: (t) => {
    const k = E.out(prog(t, o.t0 + 0.2, o.t0 + 1.4));
    const f = fill + (o.wob ? noise(t * 1.4, o.x) * o.wob : 0);
    bar.style.transform = `scaleX(${(k * f).toFixed(3)})`;
  }});
}

// group: renders children; used to hold a scene's items
export function group(items) {
  return {items, render(t) { for (const it of items) it.render(t); }};
}
