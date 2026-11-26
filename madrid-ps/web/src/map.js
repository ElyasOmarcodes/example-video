// Dot-matrix map card (Europe → South Asia) with city pins, drawn routes and outward flows.
import {E, clamp, prog, lerp, h, css, cue} from './util.js';
import {item} from './kit.js';

let MAP = null;
export async function loadMap() { MAP = await (await fetch('assets/map.json')).json(); }
export const mapData = () => MAP;
const NAMES = {islamabad: 'اسلام آباد', london: 'لندن', madrid: 'مادرید', kabul: 'کابل'};

// o: {x, y, t0, t1, s, pins:[{id,t}], routes:[{a,b,t,d}], cycle:{t0,t1,per}, flow:{t, from, n}, afg:t (tint Afghanistan)}
export function dotMap(o) {
  const M = MAP, pad = 26;
  const e = h('div', 'card mapc');
  css(e, {width: M.w + pad * 2 + 'px', height: M.h + pad * 2 + 'px'});
  const cv = document.createElement('canvas');
  cv.width = M.w; cv.height = M.h;
  css(cv, {position: 'absolute', left: pad + 'px', top: pad + 'px'});
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${M.w} ${M.h}`);
  css(svg, {position: 'absolute', left: pad + 'px', top: pad + 'px', width: M.w + 'px', height: M.h + 'px', overflow: 'visible'});
  e.append(cv, svg);
  const ctx = cv.getContext('2d');
  const C = M.cities;
  // routes: quadratic arcs drawn on the canvas, dotted, with a travelling navy dot
  const R = (o.routes || []).map((r) => {
    const [x1, y1] = C[r.a], [x2, y2] = C[r.b];
    const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.22 - 40;
    cue('route', r.t);
    return {r, x1, y1, x2, y2, mx, my};
  });
  // pins (HTML, so the Pashto names render with the text font)
  const P = (o.pins || []).map((pn) => {
    const el = h('div', 'pin', `<div class="p"></div><div class="n">${pn.label || NAMES[pn.id]}</div>`);
    css(el, {position: 'absolute', left: '0', top: '0'});
    e.appendChild(el);
    cue('pin', pn.t);
    return {pn, el, dotEl: el.querySelector('.p')};
  });
  // flows: dots leaving `from` towards land dots far away
  const F = [];
  if (o.flow) {
    const [fx, fy] = C[o.flow.from];
    const land = M.dots.filter((d) => d[2] === 1 && Math.hypot(d[0] - fx, d[1] - fy) > 260);
    for (let i = 0; i < (o.flow.n || 10); i++) {
      const d = land[Math.floor(((Math.sin(i * 91.7) + 1) / 2) * land.length) % land.length];
      F.push({x: d[0], y: d[1], t: o.flow.t + i * 0.22});
    }
    cue('flow', o.flow.t);
  }
  const qb = (r, u) => [(1 - u) * (1 - u) * r.x1 + 2 * (1 - u) * u * r.mx + u * u * r.x2, (1 - u) * (1 - u) * r.y1 + 2 * (1 - u) * u * r.my + u * u * r.y2];
  const draw = (t) => {
    ctx.clearRect(0, 0, M.w, M.h);
    const ak = o.afg != null ? E.io(prog(t, o.afg, o.afg + 0.8)) : 0;
    for (const [x, y, k] of M.dots) {
      if (k === 2 && ak > 0) { ctx.fillStyle = `rgba(239,125,34,${0.35 + 0.6 * ak})`; }
      else ctx.fillStyle = k === 1 ? '#ddd1c4' : '#d3c5b6';
      ctx.beginPath(); ctx.arc(x, y, k === 2 && ak > 0 ? 3.6 + ak : 3.6, 0, 6.283); ctx.fill();
    }
    for (const r of R) {
      const k = E.io(prog(t, r.r.t, r.r.t + (r.r.d || 1.3)));
      if (k <= 0) continue;
      ctx.strokeStyle = '#ef7d22'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.setLineDash([2, 13]);
      ctx.beginPath();
      const n = 60;
      for (let i = 0; i <= n * k; i++) { const [x, y] = qb(r, i / n); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
      if (k < 1) {
        const [x, y] = qb(r, k);
        ctx.fillStyle = '#13213f'; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.283); ctx.fill();
      } else {
        // after it is drawn, a small traveller keeps running along the route
        for (let j = 0; j < 2; j++) {
          const u = ((t - r.r.t - (r.r.d || 1.3) + j * 1.4) / 2.8) % 1;
          if (u < 0) continue;
          const [x, y] = qb(r, u);
          ctx.globalAlpha = Math.sin(u * Math.PI);
          ctx.fillStyle = '#13213f'; ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.283); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }
    for (const f of F) {
      const k = E.io(prog(t, f.t, f.t + 1.6));
      if (k <= 0) continue;
      const [fx, fy] = C[o.flow.from];
      const mx = (fx + f.x) / 2, my = Math.min(fy, f.y) - 90;
      const u = k, x = (1 - u) * (1 - u) * fx + 2 * (1 - u) * u * mx + u * u * f.x, y = (1 - u) * (1 - u) * fy + 2 * (1 - u) * u * my + u * u * f.y;
      ctx.strokeStyle = 'rgba(239,125,34,.35)'; ctx.lineWidth = 2; ctx.setLineDash([2, 8]);
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(mx, my, f.x, f.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ef7d22';
      ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.283); ctx.fill();
    }
  };
  return item(e, {in: 'up', ...o, tick: (t) => {
    draw(t);
    for (const x of P) {
      const [cx, cy] = C[x.pn.id];
      const k = prog(t, x.pn.t, x.pn.t + 0.6);
      let hl = 0;
      if (o.cycle && t >= o.cycle.t0 && t < o.cycle.t1) {
        const per = o.cycle.per || 1.2, idx = P.indexOf(x);
        const ph = ((t - o.cycle.t0) / per) % P.length;
        hl = Math.max(0, 1 - Math.abs(ph - idx - 0.5) * 2);
      }
      const s = (0.4 + 0.6 * E.out(k)) * (1 + 0.18 * hl);
      x.el.style.opacity = clamp(k * 2).toFixed(2);
      const up = x.pn.below ? 0 : 1;
      x.el.style.transform = `translate(${(cx + pad).toFixed(1)}px,${(cy + pad).toFixed(1)}px) translate(-50%, ${up ? '-100%' : '-15px'}) translate(0, ${up ? 15 : 0}px) scale(${s.toFixed(3)})`;
      x.el.style.flexDirection = up ? 'column-reverse' : 'column';
      x.dotEl.style.boxShadow = `0 0 0 ${(8 + 14 * hl + 6 * Math.max(0, Math.sin((t - x.pn.t) * 3))).toFixed(1)}px rgba(239,125,34,${(0.22 - 0.1 * hl).toFixed(2)}), 0 6px 14px rgba(150,70,10,.35)`;
    }
  }});
}

// Afghanistan outline (SVG), drawn in then filled softly
export function afgShape(o) {
  const M = MAP;
  const [bw, bh] = M.afgBox;
  const e = h('div', '');
  css(e, {width: bw + 'px', height: bh + 'px'});
  e.innerHTML = `<svg viewBox="-10 -10 ${bw + 20} ${bh + 20}" width="${bw}" height="${bh}" style="overflow:visible">
    <path d="${M.afg}" fill="#fde6d2" stroke="#ef7d22" stroke-width="5" stroke-linejoin="round"/></svg>`;
  const p = e.querySelector('path');
  let len = 0;
  return item(e, {in: 'fade', din: 0.3, ...o, tick: (t) => {
    if (!len) len = p.getTotalLength();
    const k = E.io(prog(t, o.t0, o.t0 + 1.6));
    p.setAttribute('stroke-dasharray', `${(len * k).toFixed(1)} ${len}`);
    p.style.fillOpacity = E.out(prog(t, o.t0 + 1.0, o.t0 + 2.0)).toFixed(3);
    if (o.pulse) p.style.strokeWidth = (5 + 2 * Math.max(0, Math.sin(t * 3))).toFixed(2);
  }});
}
