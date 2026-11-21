// Light relief map of the region with a moving camera. The relief image and country outlines live
// in map space; markers, arcs and labels are drawn in screen space every frame so they stay crisp.
import {E, clamp, prog, lerp, h, css, cue} from './util.js';

let M = null;
export async function loadMap() {
  M = await (await fetch('assets/map/map.json')).json();
  return M;
}
export const LL = {
  kabul: [69.17, 34.53], islamabad: [73.05, 33.69], rawalpindi: [73.06, 33.6], peshawar: [71.57, 34.01], quetta: [67.0, 30.18],
  khost: [69.92, 33.34], paktika: [68.8, 32.4], kunar: [71.1, 34.9], nangarhar: [70.4, 34.3], kandahar: [65.7, 31.6], herat: [62.2, 34.35],
  mazar: [67.1, 36.7], karachi: [67.0, 24.86], lahore: [74.35, 31.55], afg: [66.0, 33.9], pak: [70.0, 29.5], hindukush: [70.3, 35.6],
};
const K = Math.cos((31 * Math.PI) / 180);
export const mpx = (lon, lat) => [((lon - M.X0) / (M.X1 - M.X0)) * M.W, ((M.Y1 - lat) / (M.Y1 - M.Y0)) * M.H];
const path = (rings) => rings.map((r) => 'M' + r.map((p) => p[0] + ' ' + p[1]).join('L') + 'Z').join('');

export function mapView(o = {}) {
  const el = h('div', 'mapv');
  css(el, {position: 'absolute', inset: '0', overflow: 'hidden'});
  const world = h('div');
  css(world, {position: 'absolute', left: '0', top: '0', width: M.W + 'px', height: M.H + 'px', transformOrigin: '0 0'});
  const img = h('img');
  img.src = 'assets/map/relief.jpg';
  css(img, {position: 'absolute', inset: '0', width: '100%', height: '100%',
    maskImage: 'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), linear-gradient(to bottom, transparent, #000 7%, #000 93%, transparent)',
    maskComposite: 'intersect', webkitMaskComposite: 'source-in'});
  img.style.webkitMaskImage = img.style.maskImage;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${M.W} ${M.H}`);
  css(svg, {position: 'absolute', inset: '0', width: '100%', height: '100%', overflow: 'visible'});
  const C = M.countries;
  svg.innerHTML = `
    <path d="${path(C.Pakistan)}" fill="rgba(14,27,61,.035)" stroke="#9aa3ba" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
    ${['Iran', 'Tajikistan', 'Uzbekistan', 'Turkmenistan', 'India', "People's Republic of China"].map((n) => `<path d="${path(C[n])}" fill="none" stroke="#b9bfd0" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`).join('')}
    <path class="afg-glow" d="${path(C.Afghanistan)}" fill="none" stroke="var(--acc)" stroke-opacity=".25" stroke-width="16" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
    <path class="afg" d="${path(C.Afghanistan)}" fill="rgba(255,255,255,.35)" stroke="var(--ink)" stroke-width="4" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
  world.append(img, svg);
  const over = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  over.setAttribute('viewBox', '0 0 1080 1920');
  css(over, {position: 'absolute', inset: '0', width: '1080px', height: '1920px', overflow: 'visible'});
  const labels = h('div');
  css(labels, {position: 'absolute', inset: '0'});
  el.append(world, over, labels);
  const afg = svg.querySelector('.afg'), glow = svg.querySelector('.afg-glow');
  let perim = 0;
  const cam = {cx: 0, cy: 0, z: 0.5, oy: 800};
  const items = [];
  const api = {
    el, cam, over, labels,
    project(lon, lat) {
      const [x, y] = mpx(lon, lat);
      return [540 + (x - cam.cx) * cam.z, cam.oy + (y - cam.cy) * cam.z];
    },
    // camera keys: [[t, lon, lat, zoom], ...] eased between
    camera: o.camera || [[0, 66, 32, 0.45]],
    add(it) { items.push(it); return it; },
    render(t) {
      const ks = api.camera;
      let a = ks[0], b = ks[ks.length - 1], k = 0;
      for (let i = 0; i < ks.length - 1; i++) if (t >= ks[i][0] && t <= ks[i + 1][0]) { a = ks[i]; b = ks[i + 1]; k = E.io(prog(t, a[0], b[0])); }
      if (t > ks[ks.length - 1][0]) { a = b; k = 0; }
      const [x0, y0] = mpx(a[1], a[2]), [x1, y1] = mpx(b[1], b[2]);
      cam.cx = lerp(x0, x1, k); cam.cy = lerp(y0, y1, k);
      cam.z = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), k));
      cam.oy = o.oy ?? 800;
      // slow drift so the map never sits dead still
      cam.cx += Math.sin(t * 0.21) * 6 / cam.z; cam.cy += Math.cos(t * 0.17) * 5 / cam.z;
      world.style.transform = `translate(${540 - cam.cx * cam.z}px, ${cam.oy - cam.cy * cam.z}px) scale(${cam.z})`;
      if (o.drawAfg != null) {
        if (!perim) perim = afg.getTotalLength();
        const d = E.io(prog(t, o.drawAfg, o.drawAfg + 2.2));
        afg.style.strokeDasharray = `${perim}`; afg.style.strokeDashoffset = `${perim * (1 - d)}`;
        glow.style.opacity = String(d);
      }
      for (const it of items) it.render(t, api);
    },
  };
  return api;
}

// pulsing strike / pin marker in screen space with an optional label
export function marker(lon, lat, t0, {color = 'var(--hot)', label, side = 'left', big = false} = {}) {
  cue(color.includes('hot') ? 'strike_hit' : 'pin', t0, {big});
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = `<circle class="r1" r="10" fill="none" stroke="${color}" stroke-width="3"/><circle class="r2" r="10" fill="none" stroke="${color}" stroke-width="2"/>
    <circle class="c" r="${big ? 15 : 11}" fill="${color}" stroke="#fff" stroke-width="4"/>`;
  const r1 = g.querySelector('.r1'), r2 = g.querySelector('.r2'), c = g.querySelector('.c');
  let lab = null;
  return {
    render(t, map) {
      if (!g.parentNode) map.over.appendChild(g);
      const [x, y] = map.project(lon, lat);
      const k = E.back(prog(t, t0, t0 + 0.5));
      g.setAttribute('transform', `translate(${x} ${y})`);
      g.style.opacity = t < t0 ? '0' : '1';
      c.setAttribute('transform', `scale(${k})`);
      const ph = (t - t0) % 1.6 / 1.6, ph2 = ((t - t0) + 0.8) % 1.6 / 1.6;
      r1.setAttribute('r', String(10 + 46 * E.out(ph))); r1.style.opacity = String((1 - ph) * (t > t0 ? 1 : 0));
      r2.setAttribute('r', String(10 + 46 * E.out(ph2))); r2.style.opacity = String((1 - ph2) * (t > t0 + 0.8 ? 1 : 0));
      if (label) {
        if (!lab) {
          lab = h('div', 'mlabel', label);
          map.labels.appendChild(lab);
        }
        const kl = E.out(prog(t, t0 + 0.2, t0 + 0.8));
        lab.style.opacity = String(kl);
        lab.style.transform = `translate(${side === 'left' ? `calc(-100% - 30px)` : '30px'}, -55%) translate(${x}px, ${y}px) translateX(${(1 - kl) * (side === 'left' ? 20 : -20)}px)`;
      }
    },
  };
}

// dashed flight arc from a to b drawn over [t0, t1]; a small plane glyph rides the head
export function arc(a, b, t0, t1, {color = 'var(--hot)', lift = 0.28, plane = true} = {}) {
  cue('arc', t0, {t1});
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = `<path class="p" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 14"/>
    <path class="hd" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
    ${plane ? `<g class="pl"><path d="M14 0 L-10 -9 L-5 0 L-10 9 Z" fill="${color}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></g>` : ''}`;
  const p = g.querySelector('.p'), hd = g.querySelector('.hd'), pl = g.querySelector('.pl');
  return {
    render(t, map) {
      if (!g.parentNode) map.over.insertBefore(g, map.over.firstChild);
      const [x0, y0] = map.project(...a), [x1, y1] = map.project(...b);
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, d = Math.hypot(x1 - x0, y1 - y0);
      const nx = -(y1 - y0) / (d || 1), ny = (x1 - x0) / (d || 1);
      const cx = mx + nx * d * lift * (nx < 0 ? 1 : -1) * -1, cy = my - Math.abs(ny * d * lift) - d * lift * 0.4;
      const k = E.io(prog(t, t0, t1));
      const fade = 1 - E.in(prog(t, t1 + 0.6, t1 + 1.4));
      const q = (u) => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1];
      const pts = [];
      for (let i = 0; i <= 40; i++) pts.push(q((i / 40) * k));
      const dd = 'M' + pts.map((v) => v[0].toFixed(1) + ' ' + v[1].toFixed(1)).join('L');
      p.setAttribute('d', dd);
      const tail = pts.slice(Math.max(0, pts.length - 7));
      hd.setAttribute('d', 'M' + tail.map((v) => v[0].toFixed(1) + ' ' + v[1].toFixed(1)).join('L'));
      g.style.opacity = String(t < t0 ? 0 : fade);
      if (pl) {
        const [hx, hy] = q(k), [px2, py2] = q(Math.max(0, k - 0.02));
        pl.setAttribute('transform', `translate(${hx} ${hy}) rotate(${(Math.atan2(hy - py2, hx - px2) * 180) / Math.PI})`);
        pl.style.opacity = k > 0 && k < 1 ? '1' : '0';
      }
    },
  };
}

// expanding concentric rings from a point (threat spreading over the region)
export function ripple(lon, lat, t0, {color = 'var(--hot)', n = 4, max = 620, period = 2.4} = {}) {
  cue('ripple', t0);
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const cs = [];
  for (let i = 0; i < n; i++) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('fill', color); c.setAttribute('fill-opacity', '0.05'); c.setAttribute('stroke', color); c.setAttribute('stroke-width', '3');
    g.appendChild(c); cs.push(c);
  }
  return {
    render(t, map) {
      if (!g.parentNode) map.over.insertBefore(g, map.over.firstChild);
      const [x, y] = map.project(lon, lat);
      cs.forEach((c, i) => {
        const ph = ((t - t0) / period + i / n) % 1;
        const on = t > t0 + (i / n) * period;
        c.setAttribute('cx', x); c.setAttribute('cy', y);
        c.setAttribute('r', String(20 + max * E.out(ph)));
        c.style.opacity = on ? String((1 - ph) * 0.9) : '0';
      });
    },
  };
}

// static place label (no marker)
export function place(text, lon, lat, t0, cls = '') {
  let el = null;
  return {
    render(t, map) {
      if (!el) { el = h('div', 'plabel ' + cls, text); map.labels.appendChild(el); }
      const [x, y] = map.project(lon, lat);
      const k = E.out(prog(t, t0, t0 + 0.7));
      el.style.opacity = String(k);
      el.style.transform = `translate(-50%,-50%) translate(${x}px, ${y + (1 - k) * 16}px)`;
    },
  };
}
