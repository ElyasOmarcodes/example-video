// Pure helpers: everything in the film is a function of t.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
const bez = (p1x, p1y, p2x, p2y) => {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u, sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(u) - x, d = dx(u);
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    return sy(clamp(u));
  };
};
export const E = {
  out: bez(0.16, 1, 0.3, 1), // expo-ish out: entrances
  io: bez(0.83, 0, 0.17, 1), // quint in-out: moves
  soft: bez(0.45, 0, 0.2, 1), // gentle in-out
  in: bez(0.7, 0, 0.84, 0), // exits
  back: (x) => {
    const c1 = 1.5, c3 = c1 + 1;
    return x <= 0 ? 0 : x >= 1 ? 1 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },
  lin: (x) => x,
};
// critically damped settle 0→1 with a little overshoot, duration-normalised
export const spring = (x, k = 7, z = 0.62) => (x <= 0 ? 0 : x >= 1.6 ? 1 : 1 - Math.exp(-z * k * x) * Math.cos(k * Math.sqrt(1 - z * z) * x));
export const h = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};
export const css = (el, o) => {
  for (const k in o) {
    if (k.startsWith('--')) el.style.setProperty(k, o[k]);
    else el.style[k] = o[k];
  }
};
// tiny hash noise for deterministic wobble
export const noise = (x, s = 0) => {
  const i = Math.floor(x), f = x - i, r = (n) => {
    const v = Math.sin((n + s * 57.1) * 127.1) * 43758.5453;
    return v - Math.floor(v);
  };
  const u = f * f * (3 - 2 * f);
  return lerp(r(i), r(i + 1), u) * 2 - 1;
};
export const PS_DIGITS = (n, pad = 2) => String(n).padStart(pad, '0').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
// sound cue registry: blocks register what they do and when; tools/cues.mjs dumps it for the mix
export const CUES = [];
export const cue = (kind, t, o = {}) => { CUES.push({kind, t: Math.round(t * 1000) / 1000, ...o}); };
