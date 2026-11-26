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
  // drifting motes at three depths: the backdrop is never still
  const motes = [];
  for (let k = 0; k < 26; k++) {
    const r = (n) => { const v = Math.sin((k * 7.13 + n) * 91.3) * 43758.5453; return v - Math.floor(v); };
    const m = h('div', 'mote');
    const z = 0.35 + r(1) * 0.9, sz = 6 + z * 16;
    css(m, {width: sz + 'px', height: sz + 'px', background: r(2) > 0.55 ? '#ef7d22' : '#ffffff', opacity: String(r(2) > 0.55 ? 0.10 + 0.14 * z : 0.5 + 0.3 * z),
      filter: z < 0.7 ? 'blur(2px)' : 'none', boxShadow: r(2) > 0.55 ? 'none' : '0 2px 6px rgba(150,100,50,.12)'});
    bg.appendChild(m);
    motes.push({m, x: r(3) * 1080, y: r(4) * 1960, z, ph: r(5) * 6.28});
  }
  bg.appendChild(gr);
  root.appendChild(bg);
  return {
    render(t, focus = 1) {
      for (const o of motes) {
        const y = ((o.y - t * 26 * o.z) % 2000 + 2000) % 2000 - 40;
        o.m.style.transform = `translate(${(o.x + Math.sin(t * 0.45 + o.ph) * 36 * o.z).toFixed(1)}px, ${y.toFixed(1)}px)`;
      }
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
  cue('outro', VE + 0.3);
  const WM = {y: 1812, h: 58};
  return {
    render(t) {
      // logo scale/position: big centre during intro and end card, small watermark otherwise
      const kIn = E.io(prog(t, LEAD - 1.0, LEAD - 0.15)); // shrink to watermark
      const kOut = E.io(prog(t, VE + 0.35, VE + 1.4)); // grow back for the end card
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
      const fin = 1 - E.io(prog(t, END - 0.5, END));
      full.style.opacity = (t < LEAD ? 1 : lerp(0.92, 1, big) * fin).toFixed(3);
      wrap.style.opacity = '1';
    },
  };
}
