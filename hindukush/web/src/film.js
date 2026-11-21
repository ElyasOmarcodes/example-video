// Orchestrates scenes, transitions and the persistent chrome. render(t) is pure.
import {E, clamp, prog, h, css, PS_DIGITS} from './util.js';
import {TRANS, makeOverlay} from './trans.js';

export function createFilm(root, scenes, sections) {
  const W = 1080;
  root.style.position = 'relative';
  for (const s of scenes) root.appendChild(s.el);
  const ov = makeOverlay(root);
  // chrome: section chip, progress, brand
  const chrome = h('div', 'chrome');
  const sechip = h('div', 'sechip', '<span class="n"></span><span class="tt"></span>');
  const progEl = h('div', 'prog');
  const brand = h('div', 'brand', '<img src="assets/brand/logo_full.png">');
  chrome.append(sechip, progEl, brand);
  root.appendChild(chrome);
  // windows: transition between scene i and i+1 centred in the narration gap
  const tr = [];
  for (let i = 0; i < scenes.length - 1; i++) {
    const A = scenes[i], B = scenes[i + 1];
    const D = A.td ?? 1.5;
    let m = (A.t1 + B.t0) / 2;
    if (A.tm != null) m = A.tm;
    tr.push({A, B, a: m - D / 2, b: m + D / 2, type: A.trans || 'slide'});
  }
  scenes.forEach((s, i) => {
    s.wa = i ? tr[i - 1].a : -1;
    s.wb = i < tr.length ? tr[i].b : 1e9;
  });
  let curSec = -1, curPts = -1;
  const reset = (s) => {
    for (const k of ['transform', 'clipPath', 'opacity', 'filter', 'zIndex', 'borderRadius', 'boxShadow', 'transformOrigin']) s.el.style[k] = '';
    for (const k of ['transform', 'filter']) s.content.style[k] = '';
  };
  function render(t) {
    root.style.background = '';
    root.style.perspective = '';
    ov.hide();
    for (const s of scenes) {
      const on = t >= s.wa && t < s.wb;
      s.el.style.display = on ? 'block' : 'none';
      if (!on) continue;
      reset(s);
      s.el.style.zIndex = '1';
      s.render(t);
    }
    const T = tr.find((x) => t >= x.a && t < x.b);
    if (T) TRANS[T.type](prog(t, T.a, T.b), T.A, T.B, ov, root);
    // chrome follows the scene that owns the frame (or the incoming one past the midpoint)
    const S = T ? (prog(t, T.a, T.b) < 0.5 ? T.A : T.B) : scenes.find((s) => t >= s.wa && t < s.wb);
    const show = S && S.chrome !== false ? 1 : 0;
    // fade chrome around scenes that hide it
    let k = show;
    if (T && (T.A.chrome === false) !== (T.B.chrome === false)) {
      const p = prog(t, T.a, T.b);
      k = T.A.chrome === false ? E.io(p) : 1 - E.io(p);
    }
    chrome.style.opacity = String(k);
    if (S && S.sec) {
      if (S.sec !== curSec) {
        curSec = S.sec;
        const sc = sections[S.sec];
        sechip.querySelector('.n').textContent = PS_DIGITS(S.sec, 1);
        sechip.querySelector('.tt').textContent = sc.short;
        progEl.innerHTML = sc.points.map(() => '<i><b></b></i>').join('');
        root.style.setProperty('--sec', sc.color);
        chrome.style.setProperty('--sec', sc.color);
      }
      const sc = sections[S.sec];
      const bars = progEl.querySelectorAll('b');
      sc.points.forEach((ps, i) => {
        const f = clamp((t - ps.t0) / (ps.t1 - ps.t0));
        bars[i].style.transform = `scaleX(${f})`;
      });
    }
    brand.style.opacity = S && S.brand === false ? '0' : '0.92';
  }
  const duration = scenes[scenes.length - 1].t1;
  return {render, duration, tr};
}
