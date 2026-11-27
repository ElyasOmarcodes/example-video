// Background, headlines, kicker, brand mark, intro sting and end card. render(t) is pure.
import {E, clamp, prog, lerp, h, css, spring, noise, cue, PS_DIGITS} from './util.js';
import {justify, measure} from './kashida.js';

const FIT_W = 940;
let mctx = null;
const textW = (s, px) => {
  if (!mctx) mctx = document.createElement('canvas').getContext('2d');
  mctx.font = `900 ${px}px Quds`;
  mctx.direction = 'rtl';
  return mctx.measureText(s).width;
};

export function background(root) {
  const bg = h('div', 'bg');
  const g1 = h('div', 'glow'), g2 = h('div', 'glow'), g3 = h('div', 'glow');
  css(g1, {width: '1100px', height: '1100px', background: '#fffaf4', opacity: '.9'});
  css(g2, {width: '900px', height: '900px', background: '#f7a65e', opacity: '.12'});
  css(g3, {width: '1000px', height: '1000px', background: '#f3c9a0', opacity: '.14'});
  // static film grain so the soft gradients never band after compression
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d'), d = x.createImageData(256, 256);
  let s = 12345;
  for (let i = 0; i < d.data.length; i += 4) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const v = 128 + ((s >> 8) % 90) - 45;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  const gr = h('div', 'grain');
  gr.style.backgroundImage = `url(${c.toDataURL()})`;
  const vig = h('div', 'vig');
  bg.append(g1, g2, g3, vig);
  // a soft primary-colour grid with invisible edges (masked), slowly gliding; two drifting light sweeps
  const grid = h('div', 'grid');
  const grid2 = h('div', 'grid g2');
  const sweep = h('div', 'sweep');
  bg.append(grid, grid2, sweep);
  bg.appendChild(gr);
  root.appendChild(bg);
  return {
    render(t, focus = 1) {
      grid.style.backgroundPosition = `${(t * 6) % 96}px ${(t * 9) % 96}px`;
      grid2.style.backgroundPosition = `${(-t * 4) % 288}px ${(t * 5) % 288}px`;
      grid.style.opacity = (0.75 + 0.25 * Math.sin(t * 0.3)).toFixed(3);
      sweep.style.transform = `translate(${(-700 + ((t * 40) % 2600)).toFixed(1)}px, 0) rotate(18deg)`;
      g1.style.transform = `translate(${-300 + 90 * Math.sin(t * 0.05)}px, ${-420 + 60 * Math.cos(t * 0.04)}px)`;
      g2.style.transform = `translate(${160 + 160 * Math.sin(t * 0.07 + 1)}px, ${700 + 140 * Math.cos(t * 0.055)}px) scale(${0.9 + 0.12 * Math.sin(t * 0.09)})`;
      g3.style.transform = `translate(${-200 + 120 * Math.cos(t * 0.045)}px, ${1300 + 90 * Math.sin(t * 0.06)}px)`;
      g2.style.opacity = (0.10 + 0.03 * focus).toFixed(3);
    },
  };
}

// headline per beat: words rise in from a blur, the block leaves upward as the next one comes
export function headlines(root, beats, Y = 400, END = 1e9) {
  const list = [];
  const withHead = beats.filter((b) => b.head);
  withHead.forEach((b, i) => {
    const lines = b.head.split('/').map((s) => s.trim());
    const plain = lines.map((l) => l.replace(/[{}]/g, ''));
    let px = lines.length > 1 ? 86 : 96;
    while (Math.max(...plain.map((l) => textW(l, px))) > FIT_W && px > 50) px -= 2;
    const el = h('div', 'hl');
    css(el, {fontSize: px + 'px'});
    const words = [];
    // tokens per line with their accent flag
    const toks = lines.map((l) => {
      const out = [];
      for (const p of l.split(/(\{[^}]+\})/).filter(Boolean)) {
        const acc = p.startsWith('{');
        for (const w of p.replace(/[{}]/g, '').split(' ').filter(Boolean)) out.push([w, acc]);
      }
      return out;
    });
    // calligraphic justification: a two-line headline is stretched to one width with kashida (never with
    // wide gaps) when its lines are close enough in length for the stretch to look natural
    if (lines.length > 1) {
      const ws = plain.map((l) => measure(l, px, 900));
      const ratio = Math.min(...ws) / Math.max(...ws);
      if (ratio >= 0.7 && ratio < 0.97) {
        const J = justify(plain, px, 900);
        J.forEach((jl, li) => {
          const jw = jl.split(' ');
          if (jw.length === toks[li].length) toks[li].forEach((tk, k) => { tk[0] = jw[k]; });
        });
      }
    }
    for (const lt of toks) {
      const ln = h('span', 'ln');
      lt.forEach(([w, acc], k) => {
        const sp = h('span', 'w' + (acc ? ' a' : ''), w + (k < lt.length - 1 ? ' ' : ''));
        ln.appendChild(sp); words.push(sp);
      });
      el.appendChild(ln);
    }
    root.appendChild(el);
    const next = withHead[i + 1];
    const t1 = next ? next.t : END;
    list.push({b, el, words, t0: b.t, t1, n: lines.length, px});
    cue('head', b.t);
  });
  return {
    render(t) {
      for (const x of list) {
        const on = t >= x.t0 - 0.3 && t < x.t1 + 0.5;
        x.el.style.display = on ? '' : 'none';
        if (!on) continue;
        const hgt = x.n * x.px * 1.32;
        const ko = E.in(prog(t, x.t1 - 0.2, x.t1 + 0.2));
        x.el.style.transform = `translateY(${(Y - hgt / 2 - ko * 50).toFixed(1)}px)`;
        x.el.style.opacity = (1 - ko).toFixed(3);
        x.el.style.filter = ko > 0.01 ? `blur(${(ko * 10).toFixed(1)}px)` : 'none';
        x.words.forEach((w, k) => {
          const a = E.out(prog(t, x.t0 + 0.02 + k * 0.055, x.t0 + 0.52 + k * 0.055));
          w.style.opacity = a.toFixed(3);
          w.style.transform = `translateY(${((1 - a) * 34).toFixed(1)}px)`;
          w.style.filter = a < 0.99 ? `blur(${((1 - a) * 10).toFixed(1)}px)` : 'none';
        });
      }
    },
  };
}

// kicker: small "section number — section name" label above the headline
export function kicker(root, spans, Y = 232) {
  const els = spans.map((s) => {
    const e = h('div', 'kick', `<span class="n">${PS_DIGITS(s.n, 1)}</span><b></b>${s.name}`);
    e.style.top = Y + 'px';
    root.appendChild(e);
    return {s, e};
  });
  return {
    render(t) {
      for (const {s, e} of els) {
        const k = E.out(prog(t, s.t0, s.t0 + 0.6)) * (1 - E.in(prog(t, s.t1 - 0.3, s.t1 + 0.1)));
        e.style.display = k > 0.001 ? '' : 'none';
        e.style.opacity = k.toFixed(3);
        e.style.transform = `translateY(${((1 - k) * 14).toFixed(1)}px)`;
      }
    },
  };
}

// brand: the Hindukush logo. Intro: an orange dot drops, swells into the mark, the word unrolls,
// then the whole logo glides down to become the small watermark. End card: the reverse.
export function brand(root, LEAD, VE, END) {
  const wrap = h('div', 'mark');
  const dot = h('div', 'mark');
  css(dot, {width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg,#ffb21a,#ff8a00)', boxShadow: '0 20px 40px rgba(240,120,0,.35)'});
  const full = h('div', 'mark');
  // logo_full is 1699×559: word on the left, mark on the right
  const LW = 760, LH = LW * 559 / 1699;
  css(full, {width: LW + 'px', height: LH + 'px'});
  const word = h('img', 'mark'); word.src = 'assets/brand/logo_word.png';
  const markI = h('img', 'mark'); markI.src = 'assets/brand/logo_mark.png';
  const MW = LH * 361 / 559, WW = LH * 1338 / 559;
  css(word, {height: LH + 'px', width: WW + 'px', left: '0px'});
  css(markI, {height: LH + 'px', width: MW + 'px', left: (LW - MW) + 'px'});
  full.append(word, markI);
  const line = h('div', 'mark');
  css(line, {height: '6px', borderRadius: '3px', background: 'var(--acc)', width: '220px'});
  wrap.append(full, line, dot);
  root.appendChild(wrap);
  cue('intro', 0);
  const WM = {y: 1812, h: 58};
  return {
    render(t) {
      // logo scale/position: big centre during intro and end card, small watermark otherwise
      const kIn = E.io(prog(t, LEAD - 1.0, LEAD - 0.15)); // shrink to watermark
      const kOut = 0; // the Hindukush disc end card takes over after the narration
      const big = 1 - kIn + kOut;
      const sBig = 1, sSmall = WM.h / LH;
      const s = lerp(sSmall, sBig, big);
      const cy = lerp(WM.y, 900, big);
      css(full, {transform: `translate(${(540 - LW / 2).toFixed(1)}px, ${(cy - LH / 2).toFixed(1)}px) scale(${s.toFixed(4)})`, transformOrigin: '50% 50%'});
      // intro build
      const dropK = prog(t, 0.1, 0.75);
      const dy = t < 0.75 ? lerp(-160, 900, E.in(dropK)) : 900 - 60 * Math.abs(Math.sin((t - 0.75) * 6)) * Math.exp(-(t - 0.75) * 7);
      const swell = E.io(prog(t, 0.95, 1.4));
      const dotOn = t < 1.45;
      // mark position in frame while big
      const mx = 540 - LW / 2 + (LW - MW / 2), my = 900 + LH * 0.22;
      const dx = lerp(540, mx, swell), dyy = lerp(dy, my, swell);
      const ds = lerp(1, 1.5, swell);
      css(dot, {display: dotOn ? '' : 'none', transform: `translate(${(dx - 60).toFixed(1)}px, ${(dyy - 60).toFixed(1)}px) scale(${ds.toFixed(3)})`,
        opacity: (1 - E.io(prog(t, 1.2, 1.45))).toFixed(3)});
      const markK = E.out(prog(t, 1.15, 1.6));
      markI.style.opacity = (t < LEAD ? markK : 1).toFixed(3);
      markI.style.transform = `scale(${(t < LEAD ? 0.7 + 0.3 * spring(prog(t, 1.15, 1.9) * 1.5, 8, 0.6) : 1).toFixed(3)})`;
      markI.style.transformOrigin = '50% 70%';
      const wk = E.io(prog(t, 1.45, 2.25));
      word.style.clipPath = t < LEAD ? `inset(0 0 0 ${((1 - wk) * 100).toFixed(1)}%)` : 'none';
      word.style.opacity = t < LEAD ? clamp(wk * 3).toFixed(3) : '1';
      // underline: draws under the big logo, gone when small
      const lk = E.out(prog(t, 1.9, 2.5)) * (1 - kIn) + E.out(prog(t, VE + 1.2, VE + 1.9)) * kOut;
      css(line, {transform: `translate(${(540 - 110).toFixed(1)}px, ${(900 + LH / 2 + 46).toFixed(1)}px) scaleX(${lk.toFixed(3)})`, opacity: lk.toFixed(3)});
      // brand fades at the very end
      const fin = 1 - E.io(prog(t, VE + 0.2, VE + 0.7));
      full.style.opacity = (t < LEAD ? 1 : lerp(0.92, 1, big) * fin).toFixed(3);
      wrap.style.opacity = '1';
    },
  };
}

// ---------- the Hindukush end card: three discs cover the frame, the light logo glitches in, the handle ----------
export function endCard(root, t0) {
  const el = h('div', 'abs');
  css(el, {width: '1080px', height: '1920px', overflow: 'hidden', zIndex: '50'});
  const discs = ['#EAA500', '#ffffff', '#051449'].map((c) => { const d = h('div', 'odisc'); d.style.background = c; el.appendChild(d); return d; });
  const LW = 800, LH = (LW * 559) / 1699;
  const box = h('div', 'ologo');
  css(box, {left: 540 - LW / 2 + 'px', top: 900 - LH / 2 + 'px', width: LW + 'px', height: LH + 'px'});
  box.innerHTML = `<img class="lg" src="assets/brand/logo_full_light.png"><img class="gh g1" src="assets/brand/logo_ghost.png"><img class="gh g2" src="assets/brand/logo_ghost.png">`;
  const handle = h('div', 'ohandle', '@hindukush');
  el.append(box, handle);
  root.appendChild(el);
  const lg = box.querySelector('.lg'), g1 = box.querySelector('.g1'), g2 = box.querySelector('.g2');
  const P3 = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const T = t0 + 1.65;
  [0.05, 0.5, 0.95].forEach((d) => cue('disc', t0 + d));
  cue('glitch', T + 0.05);
  const gx = [0, -14, 9, -6, 12, 0], bx = [0, 12, -10, 7, -12, 0];
  const clips = ['inset(10% 0% 55% 0%)', 'inset(60% 0% 8% 0%)', 'inset(30% 0% 40% 0%)'];
  return {
    render(t) {
      if (t < t0) { el.style.display = 'none'; return; }
      el.style.display = '';
      [0.05, 0.5, 0.95].forEach((d, i) => { discs[i].style.transform = `scale(${P3(prog(t, t0 + d, t0 + d + 0.7))})`; });
      const lk = E.out(prog(t, T, T + 0.6));
      box.style.opacity = String(lk);
      box.style.transform = `translateY(${-E.out(prog(t, T + 0.8, t0 + 5.0)) * 10}px) scale(${lerp(0.9, 1, lk)})`;
      const g = t >= T + 0.05 && t < T + 0.55;
      const step = Math.floor((t - T - 0.05) / 0.1);
      const flick = g && Math.floor((t - T - 0.05) / 0.06) % 2 === 0;
      const ci = Math.floor((t - T - 0.1) / (0.45 / 4));
      lg.style.clipPath = t >= T + 0.1 && ci >= 0 && ci < 3 ? clips[ci] : 'none';
      const on = g && step >= 0 && step < 6;
      g1.style.opacity = on && flick ? '0.55' : '0';
      g2.style.opacity = on && flick ? '0.55' : '0';
      g1.style.left = (on ? gx[step] : 0) + 'px'; g2.style.left = (on ? bx[step] : 0) + 'px';
      const sk = E.out(prog(t, T + 0.7, T + 1.4));
      handle.style.opacity = String(sk);
      handle.style.transform = `translateY(${(1 - sk) * 20}px)`;
    },
  };
}

// ---------- narration caption bar: each phrase is written as it is read, with a live voice icon ----------
export function captions(root, words, env, LEAD, t0, t1, Y = 1668) {
  const bar = h('div', 'cap');
  const sh = h('div', 'sh'), ring = h('div', 'ring'), ic = h('div', 'ic');
  const bars = [0, 1, 2, 3, 4].map(() => { const i = h('i'); ic.appendChild(i); return i; });
  const tx = h('div', 'tx');
  bar.append(sh, tx, ring, ic);
  root.appendChild(bar);
  // phrases: sentence pieces that fit one line (break at punctuation first, then by width)
  const FS = 40, MAXW = 790;
  const chunks = [];
  let cur = [];
  const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
  const WEAK = new Set(['د', 'او', 'په', 'له', 'تر', 'چې', 'یې', 'هم', 'کې', 'پر', 'سره', 'ته', 'څخه', 'هغه', 'هغو', 'یو', 'یوه']);
  words.forEach((w, i) => {
    if (/^[۰-۹0-9]+\.$/.test(w[0])) { flush(); return; } // section numbers are not shown; a new section starts a new phrase
    if (cur.length && w[3] !== cur[cur.length - 1][3]) flush(); // never run two paragraphs together
    const tryW = measure([...cur, w].map((x) => x[0]).join(' '), FS, 700);
    if (cur.length && tryW > MAXW) {
      // don't leave a dangling particle at the end of a line: carry it over
      const carry = [];
      while (cur.length > 2 && WEAK.has(cur[cur.length - 1][0])) carry.unshift(cur.pop());
      flush(); cur = carry;
    }
    cur.push(w);
    if (/[.؟!؛:]$/.test(w[0]) || (/،$/.test(w[0]) && cur.length >= 4)) flush();
  });
  flush();
  const C = chunks.map((ws) => {
    const e = h('div', 'ch');
    const sp = ws.map((w, k) => { const s_ = h('span', '', w[0] + (k < ws.length - 1 ? ' ' : '')); e.appendChild(s_); return s_; });
    tx.appendChild(e);
    return {e, sp, ws, a: ws[0][1] + LEAD, b: ws[ws.length - 1][2] + LEAD};
  });
  for (let i = 0; i < C.length; i++) C[i].end = i < C.length - 1 ? Math.max(C[i].b + 0.1, C[i + 1].a - 0.25) : C[i].b + 0.6;
  // phrases follow one another without overlapping: each enters only after the previous has left
  for (let i = 0; i < C.length; i++) C[i].in = i ? Math.max(C[i].a - 0.3, C[i - 1].end + 0.22) : C[i].a - 0.3;
  return {
    render(t) {
      const k = E.out(prog(t, t0, t0 + 0.8)) * (1 - E.in(prog(t, t1 - 0.4, t1)));
      bar.style.display = k > 0.001 ? '' : 'none';
      if (k <= 0.001) return;
      bar.style.opacity = k.toFixed(3);
      bar.style.transform = `translateY(${(Y - 62 + (1 - k) * 60).toFixed(1)}px) scale(${(0.94 + 0.06 * k).toFixed(4)})`;
      sh.style.transform = `translateX(${(-300 + ((t * 120) % 1600)).toFixed(1)}px) skewX(-20deg)`;
      const fi = Math.max(0, Math.min(env.length - 1, Math.round((t - LEAD) * 30)));
      const lv = t >= LEAD ? env[fi] : 0;
      bars.forEach((b, j) => {
        const hgt = 10 + 34 * clamp(lv * (0.6 + 0.4 * Math.abs(Math.sin(t * 9 + j * 1.7))) * [0.6, 0.9, 1, 0.85, 0.55][j] * 1.6);
        b.style.height = hgt.toFixed(1) + 'px';
      });
      const rp = (t * 0.8) % 1;
      ring.style.transform = `scale(${(1 + rp * 0.35 * lv * 2).toFixed(3)})`;
      ring.style.opacity = ((1 - rp) * 0.8 * clamp(lv * 2)).toFixed(3);
      for (const c of C) {
        const on = t >= c.in - 0.02 && t < c.end + 0.25;
        c.e.style.display = on ? '' : 'none';
        if (!on) continue;
        const ki = E.out(prog(t, c.in, c.in + 0.35)), ko = E.in(prog(t, c.end, c.end + 0.22));
        c.e.style.opacity = (ki * (1 - ko)).toFixed(3);
        c.e.style.transform = `translateY(${((1 - ki) * 40 - ko * 40).toFixed(1)}px)`;
        c.e.style.filter = ki < 0.99 || ko > 0.01 ? `blur(${((1 - ki) * 8 + ko * 8).toFixed(1)}px)` : 'none';
        c.sp.forEach((s_, j) => {
          const w = c.ws[j];
          const r = E.out(prog(t, w[1] + LEAD - 0.05, w[1] + LEAD + 0.15));
          s_.style.opacity = (0.42 + 0.58 * r).toFixed(3);
          s_.style.transform = `translateY(${((1 - r) * 4).toFixed(1)}px)`;
        });
      }
    },
  };
}
