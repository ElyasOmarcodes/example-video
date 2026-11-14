// "Recruit": youth lured by false promises, strung to foreign handlers, then dropped.
// Paper-dossier look for the Hindukush "sharfasad" explainer. render(t) is pure: agents
// are simulated once at load (30 Hz) into arrays.
import {runSim} from '../kit/runtime.js';
import {rng, clamp01, smooth, lerp} from '../kit/util.js';

const DEFAULTS = {duration: 25.7, fps: 30, hud: {enabled: false}, director: {enabled: false}, watermark: '',
  beats: null, accent: '#F5A000',
  t: {lure: 4.85, handlers: 11.9, drop: 18.6, end: 25.7}, n: 150, seed: 7};

runSim(DEFAULTS, async ({cfg, canvas}) => {
  const ctx = canvas.getContext('2d');
  let W = 1080, H = 1080, dpr = 1;
  const r = rng(cfg.seed);
  const N = cfg.n, SIM = 30, STEPS = Math.ceil(cfg.duration * SIM) + 1;
  const T = cfg.t;
  // lures (false promises) and handlers (foreign circles) in a 1000x1000 world
  const lures = [[250, 330], [540, 250], [820, 340]];
  const handlers = [[170, 120], [540, 62], [900, 130]];
  const leader = [540, 215];
  const X = new Float32Array(STEPS * N), Y = new Float32Array(STEPS * N), fallT = new Float32Array(N);
  const target = new Int8Array(N), home = [];
  for (let i = 0; i < N; i++) { home.push([80 + r() * 840, 560 + r() * 380]); target[i] = Math.floor(r() * 3); fallT[i] = T.drop + 0.4 + r() * 5.2; }
  let px = home.map((h) => h[0]), py = home.map((h) => h[1]), vx = new Array(N).fill(0), vy = new Array(N).fill(0);
  const wph = home.map(() => r() * 6.28);
  for (let s = 0; s < STEPS; s++) {
    const t = s / SIM;
    for (let i = 0; i < N; i++) {
      let tx, ty, k;
      const lure = clamp01((t - T.lure - (i % 20) * 0.05) / 2.5);
      const line = clamp01((t - T.handlers) / 2.5);
      if (t < T.lure) { tx = home[i][0] + Math.sin(t * 0.7 + wph[i]) * 30; ty = home[i][1] + Math.cos(t * 0.5 + wph[i]) * 18; k = 0.02; }
      else if (t < T.handlers) { const L = lures[target[i]]; const ring = 60 + (i % 7) * 18; const a = wph[i] + t * 0.5; tx = lerp(home[i][0], L[0] + Math.cos(a) * ring, lure); ty = lerp(home[i][1], L[1] + 200 + Math.sin(a) * ring * 0.6, lure); k = 0.03; }
      else { const col = i % 15, row = Math.floor(i / 15); tx = lerp(lures[target[i]][0], 120 + col * 54, line); ty = lerp(lures[target[i]][1] + 200, 430 + row * 46, line); k = 0.05; }
      if (t > fallT[i]) { tx = px[i]; ty = 1100; k = 0.0; vy[i] += 0.9; }
      vx[i] = vx[i] * 0.86 + (tx - px[i]) * k; vy[i] = t > fallT[i] ? vy[i] : vy[i] * 0.86 + (ty - py[i]) * k;
      px[i] += vx[i]; py[i] += vy[i];
      X[s * N + i] = px[i]; Y[s * N + i] = py[i];
    }
  }
  const at = (t) => Math.max(0, Math.min(STEPS - 1, Math.round(t * SIM)));
  const C = {paper: '#0A1547', ink: '#EEF2FF', dim: 'rgba(238,242,255,0.35)', grid: 'rgba(160,185,255,0.07)', acc: cfg.accent};
  const figure = (x, y, s, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - 13 * s, 6 * s, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 8 * s, y + 10 * s); ctx.quadraticCurveTo(x - 8 * s, y - 5 * s, x, y - 5 * s); ctx.quadraticCurveTo(x + 8 * s, y - 5 * s, x + 8 * s, y + 10 * s); ctx.closePath(); ctx.fill(); };
  return {
    resize() { dpr = window.devicePixelRatio || 1; W = window.innerWidth; H = window.innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; },
    render(t) {
      if (canvas.width !== Math.round(window.innerWidth * (window.devicePixelRatio || 1))) this.resize();
      const sc = Math.min(W, H) / 1000;
      ctx.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * (W - 1000 * sc) / 2, dpr * (H - 1000 * sc) / 2);
      ctx.fillStyle = C.paper; ctx.fillRect(-200, -200, 1400, 1400); { const g0 = ctx.createRadialGradient(500, 560, 0, 500, 560, 620); g0.addColorStop(0, 'rgba(70,110,255,0.35)'); g0.addColorStop(1, 'rgba(70,110,255,0)'); ctx.fillStyle = g0; ctx.fillRect(-200, -200, 1400, 1400); }
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let g = 0; g <= 1000; g += 50) { ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, 1000); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(1000, g); ctx.stroke(); }
      const s = at(t);
      // lures: glowing promise bubbles
      const lk = smooth((t - T.lure) / 1.2) * (1 - smooth((t - T.handlers - 1) / 1.5));
      lures.forEach(([x, y], j) => { if (lk <= 0) return; const pulse = 1 + Math.sin(t * 3 + j) * 0.06; const g = ctx.createRadialGradient(x, y, 0, x, y, 120 * pulse); g.addColorStop(0, `rgba(245,160,0,${0.55 * lk})`); g.addColorStop(1, 'rgba(245,160,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 120 * pulse, 0, 7); ctx.fill(); ctx.fillStyle = `rgba(10,21,71,${lk})`; ctx.strokeStyle = `rgba(245,160,0,${lk})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x - 70, y - 34, 140, 68, 34); ctx.fill(); ctx.stroke(); ctx.fillStyle = `rgba(245,160,0,${lk})`; for (let d = 0; d < 3; d++) { ctx.beginPath(); ctx.arc(x - 30 + d * 30, y, 7, 0, 7); ctx.fill(); } });
      // handlers + strings
      const hk = smooth((t - T.handlers) / 1.2);
      if (hk > 0) {
        for (let i = 0; i < N; i++) {
          if (t > fallT[i] + 0.15) continue;
          const h = handlers[i % 3], x = X[s * N + i], y = Y[s * N + i];
          const cut = t > fallT[i] ? 1 - (t - fallT[i]) / 0.15 : 1;
          ctx.strokeStyle = `rgba(255,196,96,${0.4 * hk * cut})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(h[0], h[1] + 30); ctx.quadraticCurveTo((h[0] + x) / 2, (h[1] + y) / 2 - 40, x, y - 20); ctx.stroke();
        }
        handlers.forEach(([x, y]) => { ctx.fillStyle = `rgba(34,55,156,${hk})`; ctx.strokeStyle = `rgba(255,255,255,${0.5 * hk})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x - 62, y - 32, 124, 64, 26); ctx.fill(); ctx.stroke(); ctx.fillStyle = `rgba(245,160,0,${hk})`; ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.fill(); ctx.strokeStyle = `rgba(255,255,255,${hk})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.stroke(); });
      }
      // the leader, raised and safe, appears for the drop
      const dk = smooth((t - T.drop) / 1.0);
      if (dk > 0) { ctx.fillStyle = `rgba(238,242,255,${dk})`; ctx.beginPath(); ctx.roundRect(leader[0] - 90, leader[1] + 80, 180, 14, 7); ctx.fill(); figure(leader[0], leader[1] + 60, 3.2, `rgba(238,242,255,${dk})`); ctx.strokeStyle = `rgba(245,160,0,${dk})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(leader[0], leader[1] + 30, 78, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
      // youth figures
      for (let i = 0; i < N; i++) {
        const x = X[s * N + i], y = Y[s * N + i];
        const gone = t > fallT[i] ? clamp01((t - fallT[i]) / 1.4) : 0;
        if (gone >= 1) continue;
        const col = gone > 0 ? `rgba(110,128,190,${1 - gone})` : (t > T.handlers ? C.ink : `rgba(238,242,255,0.85)`);
        figure(x, y, 1.1, col);
      }
      return {};
    },
  };
});
