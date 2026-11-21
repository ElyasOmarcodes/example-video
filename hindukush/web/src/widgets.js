// Scene-specific infographic widgets: people grid, radar sweep, call card + waveform, video frame,
// network strings, recap rows. All pure functions of t.
import {E, clamp, prog, lerp, h, css, spring, noise, cue} from './util.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const personPath = 'M0 -46 a17 17 0 1 1 0.01 0 Z M-26 34 v-26 a26 26 0 0 1 52 0 v26 a8 8 0 0 1 -8 8 h-36 a8 8 0 0 1 -8 -8 Z';

// a grid of person glyphs; `pick` people turn orange at t1 and get drawn toward (tx, ty)
export function people(o) {
  cue('people', o.t0); cue('pull', o.t1);
  return people_(o);
}
function people_({x = 540, y = 1560, cols = 9, rows = 2, gap = 92, t0, t1, pick = [2, 5, 7, 11, 15], tx = 540, ty = 760, color = 'var(--acc)'}) {
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 1080 1920');
  css(svg, {position: 'absolute', inset: '0', width: '1080px', height: '1920px', overflow: 'visible'});
  const ps = [];
  const w = (cols - 1) * gap;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const g = document.createElementNS(SVGNS, 'path');
    g.setAttribute('d', personPath);
    svg.appendChild(g);
    ps.push({g, x: x - w / 2 + c * gap + (r % 2 ? gap / 2 : 0), y: y + r * 108, i: ps.length});
  }
  return {
    el: svg,
    render(t) {
      for (const p of ps) {
        const k = spring(prog(t, t0 + p.i * 0.035, t0 + p.i * 0.035 + 0.8) * 1.6);
        const sel = pick.includes(p.i);
        const pull = sel ? E.io(prog(t, t1 + 0.3 + pick.indexOf(p.i) * 0.12, t1 + 1.9 + pick.indexOf(p.i) * 0.12)) : 0;
        const hot = sel && t > t1 + pick.indexOf(p.i) * 0.12;
        const px = lerp(p.x, tx + (p.x - 540) * 0.12, pull), py = lerp(p.y, ty + 180, pull);
        p.g.setAttribute('transform', `translate(${px} ${py}) scale(${(0.4 + 0.6 * k) * (1 - 0.55 * pull)})`);
        p.g.setAttribute('fill', hot ? color : '#c5cad9');
        p.g.style.opacity = String(clamp(k * 3) * (1 - E.in(prog(pull, 0.75, 1))));
      }
    },
  };
}

// radar: rings + rotating sweep + blips behind the hero
export function radar({x = 540, y = 700, r = 470, t0, blips = []}) {
  cue('radar', t0); blips.forEach((b) => cue('blip', b[2]));
  const el = h('div');
  css(el, {position: 'absolute', left: x - r + 'px', top: y - r + 'px', width: 2 * r + 'px', height: 2 * r + 'px', borderRadius: '50%', overflow: 'hidden'});
  const rings = h('div');
  css(rings, {position: 'absolute', inset: '0', borderRadius: '50%',
    background: `repeating-radial-gradient(circle, transparent 0 ${r / 4 - 2}px, color-mix(in srgb,var(--sec) 22%,transparent) ${r / 4 - 2}px ${r / 4}px)`});
  const sweep = h('div');
  css(sweep, {position: 'absolute', inset: '0', borderRadius: '50%', background: 'conic-gradient(from 0deg, color-mix(in srgb,var(--sec) 32%,transparent), transparent 70deg, transparent 360deg)'});
  el.append(rings, sweep);
  const bl = blips.map(([a, d, tb]) => {
    const b = h('div');
    css(b, {position: 'absolute', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--acc)', boxShadow: '0 0 0 8px rgba(245,160,0,.25)',
      left: r + Math.cos(a) * d * r - 11 + 'px', top: r + Math.sin(a) * d * r - 11 + 'px'});
    el.appendChild(b);
    return {b, tb};
  });
  return {
    el,
    render(t) {
      const k = E.out(prog(t, t0, t0 + 1.2));
      el.style.opacity = String(k);
      el.style.transform = `scale(${0.7 + 0.3 * k})`;
      sweep.style.transform = `rotate(${(t - t0) * 140}deg)`;
      for (const {b, tb} of bl) {
        const kb = spring(prog(t, tb, tb + 0.8) * 1.6);
        const pulse = 0.75 + 0.25 * Math.sin((t - tb) * 6);
        b.style.transform = `scale(${kb * pulse})`;
        b.style.opacity = t > tb ? '1' : '0';
      }
    },
  };
}

// strings from a hub to labelled nodes (marionette network)
export function network({hub = [540, 560], nodes, t0}) {
  const el = h('div', 'layer');
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 1080 1920');
  css(svg, {position: 'absolute', inset: '0', width: '1080px', height: '1920px', overflow: 'visible'});
  el.appendChild(svg);
  const ns = nodes.map(([label, x, y, tn, cls]) => {
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'var(--sec)'); p.setAttribute('stroke-width', '3'); p.setAttribute('stroke-dasharray', '10 10');
    svg.appendChild(p);
    const c = h('div', `chip ${cls || ''}`, `<i></i><span>${label}</span>`);
    css(c, {position: 'absolute', left: x + 'px', top: y + 'px'});
    el.appendChild(c);
    return {p, c, x, y, tn};
  });
  return {
    el,
    render(t) {
      for (const n of ns) {
        const k = E.io(prog(t, n.tn, n.tn + 0.8));
        const sway = Math.sin(t * 1.3 + n.x) * 10;
        const ex = n.x + sway, ey = n.y - 10;
        const x0 = hub[0], y0 = hub[1];
        const cx = (x0 + ex) / 2, cy = Math.max(y0, ey) + 90;
        const L = 900;
        n.p.setAttribute('d', `M${x0} ${y0} Q${cx} ${cy} ${ex} ${ey}`);
        n.p.style.strokeDashoffset = String(-t * 40);
        n.p.style.opacity = String(k);
        n.p.style.clipPath = `inset(0 0 ${(1 - k) * 100}% 0)`;
        const kc = spring(prog(t, n.tn + 0.4, n.tn + 1.3) * 1.6);
        n.c.style.opacity = String(clamp(kc * 3));
        n.c.style.transform = `translate(-50%, -50%) translate(${sway}px, 0) scale(${0.6 + 0.4 * kc})`;
      }
    },
  };
}

// call card: two people with a live waveform between them
export function callCard({y = 900, names, t0, tw}) {
  cue('chip', t0); cue('chip', t0 + 0.25); cue('call', tw);
  const el = h('div', 'call');
  el.style.top = y + 'px';
  el.innerHTML = names.map((n) => `<div class="who"><div class="av"><svg viewBox="-60 -60 120 120"><path d="${personPath}" fill="#c5cad9" transform="translate(0 8) scale(1.05)"/></svg></div><div class="nm">${n}</div></div>`).join('<div class="wave"></div>');
  const wave = el.querySelector('.wave');
  const bars = [];
  for (let i = 0; i < 26; i++) { const b = h('i'); wave.appendChild(b); bars.push(b); }
  const whos = [...el.querySelectorAll('.who')];
  return {
    el,
    render(t) {
      whos.forEach((w, i) => {
        const k = spring(prog(t, t0 + i * 0.25, t0 + i * 0.25 + 1) * 1.6);
        w.style.opacity = String(clamp(k * 3));
        w.style.transform = `translateY(${(1 - k) * 50}px)`;
      });
      const kw = E.out(prog(t, tw, tw + 0.6));
      bars.forEach((b, i) => {
        const env = Math.sin((i / 25) * Math.PI);
        const v = 0.15 + 0.85 * Math.abs(noise(t * 7 + i * 0.7, i)) * env;
        b.style.transform = `scaleY(${0.08 + v * kw})`;
        b.style.background = Math.sin(t * 2 + i * 0.35) > 0.3 ? 'var(--acc)' : 'var(--sec)';
      });
    },
  };
}

// video frame with REC dot, play glyph, scrubbing progress bar
export function videoFrame({y = 470, img, label, t0, tplay}) {
  cue('hero', t0); cue('play', tplay);
  const el = h('div', 'vframe');
  el.style.top = y + 'px';
  el.innerHTML = `<div class="scr"><img src="assets/img/${img}.png"><div class="rec"><b></b>REC</div><div class="lab">${label}</div><div class="play"></div></div><div class="bar"><b></b></div>`;
  const scr = el.querySelector('.scr'), bar = el.querySelector('.bar b'), play = el.querySelector('.play'), rec = el.querySelector('.rec b'), im = el.querySelector('img');
  return {
    el,
    render(t) {
      const k = E.out(prog(t, t0, t0 + 1.0));
      el.style.opacity = String(k);
      el.style.transform = `translateX(-50%) translateY(${(1 - k) * 80}px) perspective(1400px) rotateX(${(1 - k) * 18}deg)`;
      const pk = E.io(prog(t, tplay, tplay + 0.5));
      play.style.transform = `translate(-50%,-50%) scale(${1 - pk * 0.6})`;
      play.style.opacity = String(1 - pk);
      bar.style.transform = `scaleX(${clamp((t - tplay) / 14)})`;
      rec.style.opacity = Math.floor(t * 1.6) % 2 ? '0.25' : '1';
      im.style.transform = `scale(${1.02 + 0.04 * Math.sin(t * 0.4)}) translateY(${Math.sin(t * 1.4) * 8}px)`;
    },
  };
}

// echo rings of a repeated word spreading from a point
export function echo(word, {x, y, t0, n = 5, period = 2.2, max = 2.6, color = 'var(--hot)'}) {
  cue('echo', t0);
  const el = h('div', 'layer');
  const ws = [];
  for (let i = 0; i < n; i++) {
    const w = h('div', 'echo', word);
    css(w, {left: x + 'px', top: y + 'px', color});
    el.appendChild(w); ws.push(w);
  }
  return {
    el,
    render(t) {
      ws.forEach((w, i) => {
        const ph = (t - t0) / period - i / n;
        const f = ph - Math.floor(ph);
        const on = t > t0 + (i / n) * period;
        w.style.opacity = on ? String((1 - f) * 0.9) : '0';
        const ang = (i * 137) % 360 * Math.PI / 180;
        w.style.transform = `translate(-50%,-50%) translate(${Math.cos(ang) * f * 380}px, ${Math.sin(ang) * f * 300}px) scale(${0.5 + f * max})`;
      });
    },
  };
}

// recap row: small icon + text, slides in from the right
export function recapRow(img, text, t0, y, cls = '') {
  cue(cls === 'hot' ? 'stamp' : 'row', t0);
  const el = h('div', 'rrow ' + cls, `<img src="assets/img/${img}.png"><span>${text}</span>`);
  el.style.top = y + 'px';
  return {
    el,
    render(t) {
      const k = E.out(prog(t, t0, t0 + 0.8));
      el.style.opacity = String(k);
      el.style.transform = `translateX(${(1 - k) * 120}px)`;
    },
  };
}
