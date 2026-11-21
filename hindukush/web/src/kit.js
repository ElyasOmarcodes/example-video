// Building blocks for the light explainer: backdrop, hero stage, key-phrase type styles, chips,
// stamps, bubbles. Every block is {el, render(t)} and render is a pure function of t.
import {E, clamp, prog, lerp, h, css, spring, noise, cue} from './util.js';
import {balance, justify, measure} from './kashida.js';

export const ps = (s) => s; // Al-Quds covers every Pashto letter; hook kept for glyph fixes

// ---------- backdrop ----------
const POOLS = [['#f5a000', '#3b5bdb'], ['#3b5bdb', '#f5a000'], ['#12a37f', '#f5a000'], ['#e5484d', '#3b5bdb']];
export function backdrop(i, tint) {
  const el = h('div', 'layer');
  const f = h('div', 'bgf');
  const [c1, c2] = tint || POOLS[i % POOLS.length];
  const p1 = h('div', 'pool'), p2 = h('div', 'pool');
  css(p1, {width: '760px', height: '760px', background: c1, opacity: '.16'});
  css(p2, {width: '900px', height: '900px', background: c2, opacity: '.12'});
  const d = h('div', 'dots');
  el.append(f, p1, p2, d);
  // floating motes: a few soft dots drifting upward at different depths
  const motes = [];
  for (let k = 0; k < 14; k++) {
    const r = (n) => { const v = Math.sin((i * 31.7 + k * 7.13 + n) * 91.3) * 43758.5453; return v - Math.floor(v); };
    const m = h('div', 'mote');
    const z = 0.4 + r(1) * 0.9, sz = 6 + z * 12;
    css(m, {width: sz + 'px', height: sz + 'px', background: r(2) > 0.7 ? 'var(--acc)' : 'var(--sec)', opacity: String(0.07 + 0.12 * z), filter: z < 0.7 ? 'blur(1.5px)' : 'none'});
    el.appendChild(m);
    motes.push({m, x: r(3) * 1080, y: r(4) * 1920, z, ph: r(5) * 6.28});
  }
  const s = i * 1.7;
  return {
    el, f,
    render(t) {
      p1.style.transform = `translate(${-180 + 120 * Math.sin(t * 0.11 + s)}px, ${-140 + 90 * Math.cos(t * 0.09 + s)}px)`;
      p2.style.transform = `translate(${420 + 110 * Math.cos(t * 0.08 + s)}px, ${1250 + 120 * Math.sin(t * 0.1 + s)}px)`;
      d.style.transform = `translate(${(t * 6) % 44}px, ${(t * 3) % 44}px)`;
      for (const o of motes) {
        const y = ((o.y - t * 22 * o.z) % 2000 + 2000) % 2000 - 40;
        o.m.style.transform = `translate(${o.x + Math.sin(t * 0.5 + o.ph) * 30 * o.z}px, ${y}px)`;
      }
    },
  };
}

// ---------- hero stage: white disc, orbit rings, floating clay icon ----------
export function hero(src, t0, o = {}) {
  cue('hero', t0);
  const st = h('div', 'stage');
  if (o.y) st.style.top = o.y + 'px';
  if (o.x) st.style.left = o.x + 'px';
  const sc = o.scale ?? 1;
  const disc = h('div', 'disc');
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ring.setAttribute('class', 'ring');
  ring.setAttribute('viewBox', '-380 -380 760 760');
  ring.innerHTML = `<circle r="352" fill="none" stroke="var(--sec)" stroke-opacity=".18" stroke-width="2"/>
    <circle class="dsh" r="372" fill="none" stroke="var(--sec)" stroke-opacity=".55" stroke-width="3" stroke-dasharray="2 22" stroke-linecap="round"/>
    <circle class="arc" r="352" fill="none" stroke="var(--acc)" stroke-width="6" stroke-linecap="round" stroke-dasharray="180 2032" transform="rotate(-90)"/>`;
  const img = h('img', 'hero');
  img.src = `assets/img/${src}.png`;
  st.append(ring, disc, img);
  const dsh = ring.querySelector('.dsh'), arc = ring.querySelector('.arc');
  return {
    el: st, img,
    render(t) {
      const k = spring(prog(t, t0, t0 + 1.3) * 1.6);
      const ki = E.out(prog(t, t0 + 0.1, t0 + 1.0));
      st.style.transform = `scale(${sc})`;
      disc.style.transform = `scale(${0.55 + 0.45 * k})`;
      disc.style.opacity = String(clamp(k * 2));
      ring.style.opacity = String(E.out(prog(t, t0 + 0.3, t0 + 1.2)));
      ring.style.transform = `scale(${0.85 + 0.15 * E.out(prog(t, t0 + 0.3, t0 + 1.4))})`;
      dsh.setAttribute('transform', `rotate(${t * 9})`);
      arc.setAttribute('transform', `rotate(${-90 + t * 40})`);
      const bob = Math.sin((t - t0) * 1.55) * 12, tilt = Math.sin((t - t0) * 0.9) * 7;
      img.style.opacity = String(ki);
      img.style.transform = `translateY(${(1 - ki) * 90 + bob}px) scale(${0.78 + 0.22 * k}) perspective(1200px) rotateY(${tilt}deg) rotateZ(${(1 - ki) * -6}deg)`;
    },
  };
}

// ---------- headline styles ----------
// kinds: up (masked rise per word), mark (marker sweep), out (outline → fill RTL), box (navy plate), tone (pop + coloured tail)
export function headline(text, kind, t0, o = {}) {
  cue('head', t0, {style: kind});
  const el = h('div', `hd ${kind}`);
  if (o.size) el.style.fontSize = o.size + 'px';
  const size = o.size || 96;
  // calligraphic layout: balanced lines, kashida-justified to one width (no wide word gaps)
  const maxW = (o.maxW || 940) - (kind === 'box' ? size * 0.9 : 0);
  let lines = balance(text, size, 900, maxW);
  lines = justify(lines, size, 900, o.justifyTo ?? null);
  const words = [];
  let body = '';
  if (kind === 'out') {
    el.innerHTML = lines.map((l) => `<span class="rel"><span class="tx">${l}</span><span class="tx fill" aria-hidden="true">${l}</span></span>`).join('<br>');
  } else if (kind === 'box') {
    el.innerHTML = lines.map((l) => `<span class="bx">${l}</span>`).join('<br>');
  } else if (kind === 'mark') {
    el.innerHTML = lines.map((l) => `<span class="rel"><span class="mk"></span>${l.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ')}</span>`).join('<br>');
  } else {
    el.innerHTML = lines.map((l, li) => {
      const ws = l.split(' ');
      return ws.map((w, wi) => {
        const tone = kind === 'tone' && li === lines.length - 1 && wi >= ws.length - (o.toneN ?? 1) ? ' hl' : '';
        return kind === 'up' ? `<span class="wm"><span class="w${tone}">${w}</span></span>` : `<span class="w${tone}">${w}</span>`;
      }).join(' ');
    }).join('<br>');
  }
  el.querySelectorAll('.w').forEach((w) => words.push(w));
  const fills = [...el.querySelectorAll('.fill')], outs = [...el.querySelectorAll('.tx:not(.fill)')];
  const boxes = [...el.querySelectorAll('.bx')], marks = [...el.querySelectorAll('.mk')];
  return {
    el,
    render(t) {
      if (kind === 'up') {
        words.forEach((w, i) => {
          const k = E.out(prog(t, t0 + i * 0.075, t0 + i * 0.075 + 0.75));
          w.style.transform = `translateY(${(1 - k) * 115}%) rotate(${(1 - k) * 4}deg)`;
        });
      } else if (kind === 'tone') {
        words.forEach((w, i) => {
          const x = prog(t, t0 + i * 0.09, t0 + i * 0.09 + 1.0);
          const k = spring(x * 1.6);
          w.style.opacity = String(clamp(x * 4));
          w.style.transform = `scale(${0.55 + 0.45 * k}) translateY(${(1 - k) * 30}px)`;
        });
      } else if (kind === 'mark') {
        words.forEach((w, i) => {
          const k = E.out(prog(t, t0 + i * 0.06, t0 + i * 0.06 + 0.6));
          w.style.opacity = String(k);
          w.style.transform = `translateY(${(1 - k) * 26}px)`;
          w.style.filter = k < 0.98 ? `blur(${(1 - k) * 8}px)` : 'none';
        });
        marks.forEach((m, i) => (m.style.transform = `scaleX(${E.io(prog(t, t0 + 0.45 + i * 0.2, t0 + 1.15 + i * 0.2))})`));
      } else if (kind === 'out') {
        outs.forEach((o2, i) => {
          const k = E.out(prog(t, t0 + i * 0.12, t0 + 0.6 + i * 0.12));
          o2.style.opacity = String(k);
          o2.parentElement.style.transform = `translateY(${(1 - k) * 24}px)`;
          o2.style.filter = k < 0.98 ? `blur(${(1 - k) * 6}px)` : 'none';
        });
        fills.forEach((f, i) => {
          const w = E.io(prog(t, t0 + 0.55 + i * 0.15, t0 + 1.55 + i * 0.15));
          f.style.clipPath = `inset(-20% 0 -20% ${(1 - w) * 100}%)`;
        });
      } else if (kind === 'box') {
        boxes.forEach((b, i) => {
          const k = E.io(prog(t, t0 + i * 0.12, t0 + 0.7 + i * 0.12));
          const kt = E.out(prog(t, t0 + 0.35 + i * 0.12, t0 + 1.0 + i * 0.12));
          b.style.clipPath = `inset(-10% 0 -10% ${(1 - k) * 100}%  round 26px)`;
          b.style.color = `rgba(255,255,255,${kt})`;
          b.style.transform = `translateX(${(1 - k) * -40}px)`;
        });
      }
    },
  };
}

// ---------- kicker: "۰۱ / ۰۸ ━ label" ----------
export function kicker(num, label, t0) {
  const el = h('div', 'kick', `<span class="num">${num}</span><span class="bar"></span><span>${label}</span>`);
  const bar = el.querySelector('.bar');
  return {
    el,
    render(t) {
      const k = E.out(prog(t, t0, t0 + 0.6));
      el.style.opacity = String(k);
      el.style.transform = `translateY(${(1 - k) * 20}px)`;
      bar.style.transform = `scaleX(${E.io(prog(t, t0 + 0.1, t0 + 0.7))})`;
    },
  };
}

// ---------- a line of body text (fade-rise with blur) ----------
export function line(html, t0, o = {}) {
  cue('line', t0);
  const el = h('div', 'line', html);
  if (o.size) el.style.fontSize = o.size + 'px';
  return {
    el,
    render(t) {
      const k = E.out(prog(t, t0, t0 + 0.7));
      el.style.opacity = String(k);
      el.style.transform = `translateY(${(1 - k) * 28}px)`;
      el.style.filter = k < 0.98 ? `blur(${(1 - k) * 10}px)` : 'none';
    },
  };
}

// ---------- chips, each with its own time ----------
export function chips(list) {
  const el = h('div', 'chips');
  const items = list.map(([text, t0, cls]) => {
    cue(cls === 'arrow' ? 'tick' : 'chip', t0);
    const c = h('div', `chip ${cls || ''}`, `<i></i><span>${text}</span>`);
    el.appendChild(c);
    return {c, t0};
  });
  return {
    el,
    render(t) {
      for (const {c, t0} of items) {
        const x = prog(t, t0, t0 + 0.9);
        const k = spring(x * 1.6);
        c.style.opacity = String(clamp(x * 5));
        c.style.transform = `translateY(${(1 - k) * 40}px) scale(${0.7 + 0.3 * k})`;
      }
    },
  };
}

// ---------- stamp: slams down with a small shake ----------
export function stamp(text, t0, {x = 540, y = 900, rot = -8, size} = {}) {
  cue('stamp', t0 + 0.28);
  const el = h('div', 'stamp', text);
  if (size) el.style.fontSize = size + 'px';
  css(el, {left: x + 'px', top: y + 'px'});
  return {
    el,
    render(t) {
      const x1 = prog(t, t0, t0 + 0.28);
      const k = E.in(x1);
      const sh = t > t0 + 0.28 ? Math.exp(-(t - t0 - 0.28) * 14) * Math.sin((t - t0) * 70) * 6 : 0;
      el.style.opacity = String(clamp(x1 * 3));
      el.style.transform = `translate(-50%,-50%) rotate(${rot + sh * 0.3}deg) scale(${lerp(2.4, 1, k)}) translate(${sh}px,0)`;
    },
  };
}

// ---------- speech bubble that pops ----------
export function bubble(text, t0, {x, y, rot = 0, t1 = 1e9} = {}) {
  cue('bubble', t0);
  const el = h('div', 'bubble', text);
  css(el, {left: x + 'px', top: y + 'px'});
  return {
    el,
    render(t) {
      const x1 = prog(t, t0, t0 + 0.8), k = spring(x1 * 1.6);
      const out = E.in(prog(t, t1, t1 + 0.4));
      el.style.opacity = String(clamp(x1 * 5) * (1 - out));
      el.style.transform = `translate(-50%,-50%) rotate(${rot}deg) scale(${(0.3 + 0.7 * k) * (1 - 0.3 * out)}) translateY(${Math.sin((t - t0) * 2.2 + x) * 6}px)`;
    },
  };
}

// ---------- strike-through a phrase ----------
export function strike(html, t0, t1) {
  cue('strike', t1);
  const el = h('div', 'line');
  el.innerHTML = `<span class="strike">${html}<span class="s"></span></span>`;
  const s = el.querySelector('.s');
  return {
    el,
    render(t) {
      const k = E.out(prog(t, t0, t0 + 0.7));
      el.style.opacity = String(k);
      el.style.transform = `translateY(${(1 - k) * 24}px)`;
      s.style.transform = `scaleX(${E.io(prog(t, t1, t1 + 0.5))})`;
      el.style.color = t > t1 + 0.2 ? 'var(--mute)' : '';
    },
  };
}

// place a block in a text container at y
export function at(block, y, o = {}) {
  const wrap = h('div', 'tb');
  wrap.style.top = y + 'px';
  if (o.left != null) wrap.style.left = o.left + 'px';
  if (o.right != null) wrap.style.right = o.right + 'px';
  if (o.align) wrap.style.textAlign = o.align;
  wrap.appendChild(block.el);
  return {el: wrap, render: (t) => block.render(t)};
}
