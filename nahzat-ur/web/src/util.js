// Small deterministic helpers shared by every module. Everything visible is a pure function of t.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (k) => k * k * (3 - 2 * k);

// cubic-bezier easing (After Effects style curves), solved with Newton steps
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      const d = dx(t);
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return sy(clamp(t));
  };
}
export const E = {
  io: bezier(0.76, 0, 0.24, 1), // strong easy-ease (camera, cards)
  out: bezier(0.16, 1, 0.3, 1), // expo-out (entries)
  in: bezier(0.7, 0, 0.84, 0), // exits
  soft: bezier(0.45, 0, 0.55, 1),
  back: (k) => {
    const c1 = 1.4, c3 = c1 + 1;
    return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
  },
};
// value of an eased ramp between a and b over [t0, t1]
export const ramp = (t, t0, t1, a = 0, b = 1, ease = E.io) => lerp(a, b, ease(prog(t, t0, t1)));
// in-hold-out envelope
export const env = (t, a, b, fin = 0.4, fout = 0.4, ease = E.out) =>
  Math.min(ease(prog(t, a, a + fin)), 1 - E.in(prog(t, b - fout, b)));

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// keyframed path: keys = [[t, value], ...] with per-segment easing, value = number | array
export function track(keys, ease = E.io) {
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, v0] = keys[i], [t1, v1, e] = keys[i + 1];
      if (t <= t1) {
        const k = (e || ease)(prog(t, t0, t1));
        return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], k)) : lerp(v0, v1, k);
      }
    }
    return keys[keys.length - 1][1];
  };
}

export const loadImage = (src) =>
  new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('image ' + src));
    i.src = src;
  });

export const fmtInt = (n) => Math.round(n).toLocaleString('en-US');
