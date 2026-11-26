// web/src/util.js
var clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
var lerp = (a, b, k) => a + (b - a) * k;
var prog = (t, a, b) => clamp((t - a) / (b - a));
var bez = (p1x, p1y, p2x, p2y) => {
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
var E = {
  out: bez(0.16, 1, 0.3, 1),
  // expo-ish out: entrances
  io: bez(0.83, 0, 0.17, 1),
  // quint in-out: moves
  soft: bez(0.45, 0, 0.2, 1),
  // gentle in-out
  in: bez(0.7, 0, 0.84, 0),
  // exits
  back: (x) => {
    const c1 = 1.5, c3 = c1 + 1;
    return x <= 0 ? 0 : x >= 1 ? 1 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },
  lin: (x) => x
};
var spring = (x, k = 7, z = 0.62) => x <= 0 ? 0 : x >= 1.6 ? 1 : 1 - Math.exp(-z * k * x) * Math.cos(k * Math.sqrt(1 - z * z) * x);
var h = (tag2, cls, html) => {
  const e = document.createElement(tag2);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};
var css = (el, o) => {
  for (const k in o) {
    if (k.startsWith("--")) el.style.setProperty(k, o[k]);
    else el.style[k] = o[k];
  }
};
var noise = (x, s = 0) => {
  const i = Math.floor(x), f = x - i, r = (n) => {
    const v = Math.sin((n + s * 57.1) * 127.1) * 43758.5453;
    return v - Math.floor(v);
  };
  const u = f * f * (3 - 2 * f);
  return lerp(r(i), r(i + 1), u) * 2 - 1;
};
var PS_DIGITS = (n, pad = 2) => String(n).padStart(pad, "0").replace(/\d/g, (d) => "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9"[d]);
var CUES = [];
var cue = (kind, t, o = {}) => {
  CUES.push({ kind, t: Math.round(t * 1e3) / 1e3, ...o });
};

// web/src/kit.js
var ICON = {
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="#ef7d22" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="#ef7d22" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  q: '<svg viewBox="0 0 24 24" fill="none" stroke="#ef7d22" stroke-width="2.6" stroke-linecap="round"><path d="M9 9a3 3 0 1 1 4.2 2.75c-.75.35-1.2 1-1.2 1.8V14"/><circle cx="12" cy="18" r=".6" fill="#ef7d22"/></svg>',
  dot: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#ef7d22"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="#ef7d22" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>',
  empty: '<svg viewBox="0 0 24 24" fill="none" stroke="#d2c3b2" stroke-width="2.4"><rect x="4" y="4" width="16" height="16" rx="4"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="#ef7d22" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
};
function keyed(keys, t, d = 0.8, ease = E.io) {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [tk, vk] = keys[i];
    if (t < tk) break;
    const k = ease(prog(t, tk, tk + (keys[i][2] ?? d)));
    v = typeof v === "number" ? lerp(v, vk, k) : mix(v, vk, k);
  }
  return v;
}
var mix = (a, b, k) => {
  const o = {};
  for (const key in b) o[key] = typeof b[key] === "number" && typeof a[key] === "number" ? lerp(a[key], b[key], k) : k < 0.5 ? a[key] ?? b[key] : b[key];
  for (const key in a) if (!(key in o)) o[key] = a[key];
  return o;
};
var SEQ = 0;
function item(el, o) {
  const root = h("div", "abs");
  root.appendChild(el);
  el.style.position = "relative";
  const id = SEQ++;
  const din = o.din ?? 0.6, dout = o.dout ?? 0.45;
  const t0 = o.t0, t1 = o.t1 ?? 1e9;
  if (o.z != null) root.style.zIndex = String(o.z);
  if (o.snd !== false) cue(o.snd || (o.in === "pop" || o.in === "zoom" ? "pop" : "soft"), t0, { id });
  const ph = id * 1.37 % 6.28;
  const self = {
    el,
    root,
    o,
    render(t) {
      if (t < t0 - 0.02 || t > t1 + dout + 0.02) {
        root.style.display = "none";
        return false;
      }
      root.style.display = "";
      const p = o.path ? keyed([[0, { x: o.x, y: o.y, s: o.s ?? 1, o: 1 }], ...o.path], t, o.pd ?? 0.9) : { x: o.x, y: o.y, s: o.s ?? 1, o: 1 };
      const ki = prog(t, t0, t0 + din), ko = prog(t, t1, t1 + dout);
      const a = E.out(ki), b = E.in(ko);
      let x = p.x, y = p.y, s = p.s, r = 0;
      const mode = o.in || "up";
      if (mode === "pop") s *= 0.35 + 0.65 * spring(ki * 1.5, 8, 0.55);
      else if (mode === "zoom") s *= 1.25 - 0.25 * a;
      else if (mode === "up") y += (1 - a) * 70;
      else if (mode === "down") y -= (1 - a) * 70;
      else if (mode === "side") x += (1 - a) * (o.from ?? -120);
      const om = o.out || "fade";
      if (om === "up") y -= b * 60;
      else if (om === "down") y += b * 60;
      else if (om === "shrink") s *= 1 - 0.4 * b;
      if (o.float) {
        y += Math.sin(t * 1.25 + ph) * o.float;
        r += Math.sin(t * 0.8 + ph) * (o.rock ?? 0);
      }
      if (o.grow) s *= 1 + o.grow * (1 - Math.exp(-Math.max(0, t - t0) / 5));
      const op = (mode === "pop" ? clamp(ki * 3) : a) * (1 - b) * (p.o ?? 1);
      const blur = (1 - a) * (o.blurIn ?? 14) + b * 12 + (p.blur || 0);
      root.style.opacity = op.toFixed(3);
      root.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      root.style.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : "none";
      if (o.tick) o.tick(t, el, { a, b, ki, ko });
      return true;
    }
  };
  return self;
}
var img = (name, size, o = {}) => {
  const e = h("div", "cc");
  css(e, { width: size + "px", height: size + "px" });
  const amb = h("div", "amb");
  const gl = h("div", "gl");
  amb.appendChild(gl);
  const sats = [];
  const rgs = [];
  if (o.amb !== false) {
    for (let k = 0; k < 3; k++) {
      const d = h("i");
      const sz = [14, 10, 18][k];
      css(d, { width: sz + "px", height: sz + "px", margin: `${-sz / 2}px 0 0 ${-sz / 2}px`, background: k === 1 ? "#13213f" : "#ef7d22", opacity: k === 1 ? ".55" : ".8" });
      amb.appendChild(d);
      sats.push({ d, r: size * [0.52, 0.6, 0.47][k], sp: [0.55, -0.4, 0.33][k], ph: k * 2.1, tilt: [0.34, 0.3, 0.42][k] });
    }
    for (let k = 0; k < 2; k++) {
      const r = h("div", "rg");
      amb.appendChild(r);
      rgs.push(r);
    }
  }
  e.appendChild(amb);
  const im = h("img", "img");
  im.src = `assets/img/${name}.png`;
  css(im, { position: "relative" });
  e.appendChild(im);
  const t0 = o.t0;
  const user = o.tick;
  return item(e, { in: "pop", float: 10, rock: 1.2, grow: 0.07, ...o, tick: (t, el, k) => {
    const life = t - t0;
    gl.style.transform = `translate(-50%,-50%) scale(${(0.92 + 0.08 * Math.sin(life * 1.6)).toFixed(3)})`;
    gl.style.opacity = (0.75 + 0.25 * Math.sin(life * 1.1)).toFixed(3);
    for (const st of sats) {
      const a = st.ph + life * st.sp * 2;
      const x = Math.cos(a) * st.r, y = Math.sin(a) * st.r * st.tilt + size * 0.06;
      st.d.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(0.8 + 0.2 * Math.sin(a)).toFixed(3)})`;
      st.d.style.zIndex = Math.sin(a) > 0 ? "2" : "0";
    }
    rgs.forEach((r, j) => {
      const u = (life + j * 1.6) % 3.2 / 3.2;
      const w = size * (0.35 + 0.75 * u);
      css(r, { width: w + "px", height: w * 0.32 + "px", marginLeft: -w / 2 + "px", marginTop: -w * 0.16 + "px", opacity: (0.7 * (1 - u) * clamp(life / 0.8)).toFixed(3) });
    });
    if (user) user(t, el, k);
  } });
};
var card = (w, hh, html, o) => {
  const e = h("div", "card", html || "");
  css(e, { width: w + "px", height: hh + "px" });
  return item(e, { in: "up", float: 4, ...o });
};
var chip = (text, o = {}) => {
  const e = h("div", "chip " + (o.cls || ""), `<span class="d"></span><span>${text}</span>`);
  const d = e.querySelector(".d");
  return item(e, { in: "up", float: 4, ...o, tick: (t) => {
    d.style.transform = `scale(${(1 + 0.3 * Math.max(0, Math.sin((t - o.t0) * 3.4))).toFixed(3)})`;
  } });
};
var tag = (text, o = {}) => item(h("div", "tag " + (o.cls || ""), text), { in: "pop", float: 5, ...o });
var label = (text, o = {}) => item(h("div", "lbl " + (o.cls || ""), text), { in: "up", snd: false, ...o });
var mark = (kind, o = {}) => item(h("div", "x", ICON[kind]), { in: "pop", snd: kind === "x" ? "nope" : "pop", ...o });
var listH = (n, rh = 92) => 28 + n * rh + (n - 1) * 2;
function list(w, rows, o) {
  const e = h("div", "card");
  const rh = o.rh || 92;
  css(e, { width: w + "px", height: listH(rows.length, rh) + "px", padding: "14px 0" });
  const R = rows.map((r) => {
    const el = h("div", "row", `${r.th ? `<div class="th"><img src="assets/img/${r.th}.png"></div>` : `<div class="ic">${ICON[r.icon || "dot"]}</div>`}<span>${r.text}</span>`);
    if (o.rh) {
      el.style.height = rh + "px";
      if (o.fs) el.style.fontSize = o.fs + "px";
    }
    if (o.th) {
      const th = el.querySelector(".th");
      if (th) css(th, { width: o.th + "px", height: o.th + "px" });
    }
    e.appendChild(el);
    if (r.t > o.t0 + 0.05) cue("tick", r.t);
    for (const [ts] of r.state || []) cue("mark", ts);
    return { r, el, ic: el.querySelector(".ic"), cur: r.icon || "dot" };
  });
  const hl = h("div", "rowhl"), bar = h("div", "ind");
  css(e, { position: "relative" });
  e.prepend(hl);
  e.appendChild(bar);
  const it = item(e, { in: "up", float: 4, ...o });
  const base = it.render;
  it.render = (t) => {
    if (!base(t)) return false;
    let yk = 0, on = 0;
    R.forEach((x, i) => {
      const k = E.io(prog(t, x.r.t, x.r.t + 0.45));
      if (k > 0) {
        yk = lerp(yk, i, i === 0 ? 1 : k);
        on = Math.max(on, k);
      }
    });
    const y = 14 + yk * (rh + 2);
    css(hl, { top: (y + 6).toFixed(1) + "px", height: rh - 12 + "px", opacity: (on * (0.75 + 0.25 * Math.sin(t * 2.2))).toFixed(3) });
    css(bar, { top: (y + rh * 0.22).toFixed(1) + "px", height: (rh * 0.56).toFixed(1) + "px", opacity: on.toFixed(3) });
    for (const x of R) {
      const k = E.out(prog(t, x.r.t, x.r.t + 0.5));
      x.el.style.opacity = (k * (x.r.dim != null ? 1 - 0.6 * E.io(prog(t, x.r.dim, x.r.dim + 0.6)) : 1)).toFixed(3);
      x.el.style.transform = `translateX(${((1 - k) * -40).toFixed(1)}px)`;
      if (x.ic) {
        let st = x.r.icon || "dot";
        for (const [ts, s] of x.r.state || []) if (t >= ts) st = s;
        if (st !== x.cur) {
          x.ic.innerHTML = ICON[st];
          x.cur = st;
        }
        const last = (x.r.state || []).filter(([ts]) => t >= ts).pop();
        const pk = last ? spring(prog(t, last[0], last[0] + 0.6) * 1.5, 9, 0.5) : 1;
        x.ic.style.transform = `scale(${(0.6 + 0.4 * pk).toFixed(3)})`;
        x.ic.style.background = st === "x" ? "#fff1e6" : st === "empty" ? "transparent" : "";
      }
    }
    return true;
  };
  return it;
}
function shape(keys, o = {}) {
  const e = h("div", "abs shape");
  if (o.z != null) e.style.zIndex = String(o.z);
  const d = o.d ?? 0.9;
  return {
    el: e,
    root: e,
    render(t) {
      if (t < keys[0][0] - 0.01 || o.t1 != null && t > o.t1) {
        e.style.display = "none";
        return false;
      }
      const g = keyed(keys.map(([kt, v, kd]) => [kt, v, kd]), t, d, E.io);
      if (g.o <= 1e-3) {
        e.style.display = "none";
        return false;
      }
      e.style.display = "";
      const s = g.s ?? 1;
      e.style.width = g.w.toFixed(1) + "px";
      e.style.height = g.h.toFixed(1) + "px";
      e.style.borderRadius = Math.min(g.r, g.w / 2, g.h / 2).toFixed(1) + "px";
      e.style.transform = `translate(${(g.x - g.w / 2).toFixed(1)}px,${(g.y - g.h / 2).toFixed(1)}px) scale(${s})`;
      e.style.opacity = (g.o ?? 1).toFixed(3);
      e.style.background = g.c || "";
      return true;
    }
  };
}
function typing(o) {
  const e = h("div", "bubble", '<div class="dots3"><i></i><i></i><i></i></div>');
  const it = item(e, { in: "pop", ...o });
  const base = it.render;
  const dots = [...e.querySelectorAll("i")];
  it.render = (t) => {
    if (!base(t)) return false;
    dots.forEach((d, i) => {
      const k = Math.max(0, Math.sin(t * 5.2 - i * 0.7));
      d.style.transform = `translateY(${(-k * 8).toFixed(1)}px)`;
      d.style.opacity = (0.45 + 0.55 * k).toFixed(2);
    });
    return true;
  };
  return it;
}
function strike(w, o) {
  const e = h("div", "strike");
  css(e, { width: w + "px" });
  cue("strike", o.t0);
  return item(e, { in: "fade", din: 0.01, ...o, snd: false, tick: (t, el) => {
    el.style.transform = `scaleX(${E.io(prog(t, o.t0, o.t0 + 0.45)).toFixed(3)})`;
  } });
}
function meter(text, fill, o) {
  const e = h("div", "", `<div class="lbl" style="text-align:right;margin-bottom:16px">${text}</div><div class="bar"><i></i></div>`);
  css(e, { width: (o.w || 620) + "px" });
  const bar = e.querySelector("i");
  return item(e, { in: "up", ...o, tick: (t) => {
    const k = E.out(prog(t, o.t0 + 0.2, o.t0 + 1.4));
    const f = fill + (o.wob ? noise(t * 1.4, o.x) * o.wob : 0);
    bar.style.transform = `scaleX(${(k * f).toFixed(3)})`;
  } });
}

// web/src/map.js
var MAP = null;
async function loadMap() {
  MAP = await (await fetch("assets/map.json")).json();
}
var mapData = () => MAP;
var NAMES = { islamabad: "\u0627\u0633\u0644\u0627\u0645 \u0622\u0628\u0627\u062F", london: "\u0644\u0646\u062F\u0646", madrid: "\u0645\u0627\u062F\u0631\u06CC\u062F", kabul: "\u06A9\u0627\u0628\u0644" };
function dotMap(o) {
  const M = MAP, pad = 26;
  const e = h("div", "card mapc");
  css(e, { width: M.w + pad * 2 + "px", height: M.h + pad * 2 + "px" });
  const cv = document.createElement("canvas");
  cv.width = M.w;
  cv.height = M.h;
  css(cv, { position: "absolute", left: pad + "px", top: pad + "px" });
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${M.w} ${M.h}`);
  css(svg, { position: "absolute", left: pad + "px", top: pad + "px", width: M.w + "px", height: M.h + "px", overflow: "visible" });
  e.append(cv, svg);
  const ctx2 = cv.getContext("2d");
  const C = M.cities;
  const R = (o.routes || []).map((r) => {
    const [x1, y1] = C[r.a], [x2, y2] = C[r.b];
    const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.22 - 40;
    cue("route", r.t);
    return { r, x1, y1, x2, y2, mx, my };
  });
  const P = (o.pins || []).map((pn) => {
    const el = h("div", "pin", `<div class="p"></div><div class="n">${pn.label || NAMES[pn.id]}</div>`);
    css(el, { position: "absolute", left: "0", top: "0" });
    e.appendChild(el);
    cue("pin", pn.t);
    return { pn, el, dotEl: el.querySelector(".p") };
  });
  const F = [];
  if (o.flow) {
    const [fx, fy] = C[o.flow.from];
    const land = M.dots.filter((d) => d[2] === 1 && Math.hypot(d[0] - fx, d[1] - fy) > 260);
    for (let i = 0; i < (o.flow.n || 10); i++) {
      const d = land[Math.floor((Math.sin(i * 91.7) + 1) / 2 * land.length) % land.length];
      F.push({ x: d[0], y: d[1], t: o.flow.t + i * 0.22 });
    }
    cue("flow", o.flow.t);
  }
  const qb = (r, u) => [(1 - u) * (1 - u) * r.x1 + 2 * (1 - u) * u * r.mx + u * u * r.x2, (1 - u) * (1 - u) * r.y1 + 2 * (1 - u) * u * r.my + u * u * r.y2];
  const draw = (t) => {
    ctx2.clearRect(0, 0, M.w, M.h);
    const ak = o.afg != null ? E.io(prog(t, o.afg, o.afg + 0.8)) : 0;
    for (const [x, y, k] of M.dots) {
      if (k === 2 && ak > 0) {
        ctx2.fillStyle = `rgba(239,125,34,${0.35 + 0.6 * ak})`;
      } else ctx2.fillStyle = k === 1 ? "#ddd1c4" : "#d3c5b6";
      ctx2.beginPath();
      ctx2.arc(x, y, k === 2 && ak > 0 ? 3.6 + ak : 3.6, 0, 6.283);
      ctx2.fill();
    }
    for (const r of R) {
      const k = E.io(prog(t, r.r.t, r.r.t + (r.r.d || 1.3)));
      if (k <= 0) continue;
      ctx2.strokeStyle = "#ef7d22";
      ctx2.lineWidth = 4;
      ctx2.lineCap = "round";
      ctx2.setLineDash([2, 13]);
      ctx2.beginPath();
      const n = 60;
      for (let i = 0; i <= n * k; i++) {
        const [x, y] = qb(r, i / n);
        i ? ctx2.lineTo(x, y) : ctx2.moveTo(x, y);
      }
      ctx2.stroke();
      ctx2.setLineDash([]);
      if (k < 1) {
        const [x, y] = qb(r, k);
        ctx2.fillStyle = "#13213f";
        ctx2.beginPath();
        ctx2.arc(x, y, 9, 0, 6.283);
        ctx2.fill();
      } else {
        for (let j = 0; j < 2; j++) {
          const u = (t - r.r.t - (r.r.d || 1.3) + j * 1.4) / 2.8 % 1;
          if (u < 0) continue;
          const [x, y] = qb(r, u);
          ctx2.globalAlpha = Math.sin(u * Math.PI);
          ctx2.fillStyle = "#13213f";
          ctx2.beginPath();
          ctx2.arc(x, y, 7, 0, 6.283);
          ctx2.fill();
          ctx2.globalAlpha = 1;
        }
      }
    }
    for (const f of F) {
      const k = E.io(prog(t, f.t, f.t + 1.6));
      if (k <= 0) continue;
      const [fx, fy] = C[o.flow.from];
      const mx = (fx + f.x) / 2, my = Math.min(fy, f.y) - 90;
      const u = k, x = (1 - u) * (1 - u) * fx + 2 * (1 - u) * u * mx + u * u * f.x, y = (1 - u) * (1 - u) * fy + 2 * (1 - u) * u * my + u * u * f.y;
      ctx2.strokeStyle = "rgba(239,125,34,.35)";
      ctx2.lineWidth = 2;
      ctx2.setLineDash([2, 8]);
      ctx2.beginPath();
      ctx2.moveTo(fx, fy);
      ctx2.quadraticCurveTo(mx, my, f.x, f.y);
      ctx2.stroke();
      ctx2.setLineDash([]);
      ctx2.fillStyle = "#ef7d22";
      ctx2.beginPath();
      ctx2.arc(x, y, 7, 0, 6.283);
      ctx2.fill();
    }
  };
  return item(e, { in: "up", ...o, tick: (t) => {
    draw(t);
    for (const x of P) {
      const [cx, cy] = C[x.pn.id];
      const k = prog(t, x.pn.t, x.pn.t + 0.6);
      let hl = 0;
      if (o.cycle && t >= o.cycle.t0 && t < o.cycle.t1) {
        const per = o.cycle.per || 1.2, idx = P.indexOf(x);
        const ph = (t - o.cycle.t0) / per % P.length;
        hl = Math.max(0, 1 - Math.abs(ph - idx - 0.5) * 2);
      }
      const s = (0.4 + 0.6 * E.out(k)) * (1 + 0.18 * hl);
      x.el.style.opacity = clamp(k * 2).toFixed(2);
      const up = x.pn.below ? 0 : 1;
      x.el.style.transform = `translate(${(cx + pad).toFixed(1)}px,${(cy + pad).toFixed(1)}px) translate(-50%, ${up ? "-100%" : "-15px"}) translate(0, ${up ? 15 : 0}px) scale(${s.toFixed(3)})`;
      x.el.style.flexDirection = up ? "column-reverse" : "column";
      x.dotEl.style.boxShadow = `0 0 0 ${(8 + 14 * hl + 6 * Math.max(0, Math.sin((t - x.pn.t) * 3))).toFixed(1)}px rgba(239,125,34,${(0.22 - 0.1 * hl).toFixed(2)}), 0 6px 14px rgba(150,70,10,.35)`;
    }
  } });
}
function afgShape(o) {
  const M = MAP;
  const [bw, bh] = M.afgBox;
  const e = h("div", "");
  css(e, { width: bw + "px", height: bh + "px" });
  e.innerHTML = `<svg viewBox="-10 -10 ${bw + 20} ${bh + 20}" width="${bw}" height="${bh}" style="overflow:visible">
    <path d="${M.afg}" fill="#fde6d2" stroke="#ef7d22" stroke-width="5" stroke-linejoin="round"/></svg>`;
  const p = e.querySelector("path");
  let len = 0;
  return item(e, { in: "fade", din: 0.3, ...o, tick: (t) => {
    if (!len) len = p.getTotalLength();
    const k = E.io(prog(t, o.t0, o.t0 + 1.6));
    p.setAttribute("stroke-dasharray", `${(len * k).toFixed(1)} ${len}`);
    p.style.fillOpacity = E.out(prog(t, o.t0 + 1, o.t0 + 2)).toFixed(3);
    if (o.pulse) p.style.strokeWidth = (5 + 2 * Math.max(0, Math.sin(t * 3))).toFixed(2);
  } });
}

// web/src/kashida.js
var TATWEEL = "\u0640";
var RIGHT_ONLY = /* @__PURE__ */ new Set([..."\u0627\u0622\u0623\u0625\u0671\u062F\u0630\u0631\u0632\u0698\u0648\u0624\u0629\u06C0\u0689\u0693\u0696\u06CD\u06D2\u06D3"]);
var isLetter = (c) => /[ؠ-يٮ-ۓەۺ-ۿ]/.test(c);
var joinsLeft = (c) => isLetter(c) && !RIGHT_ONLY.has(c);
var MARK = /[ً-ٰٟ]/;
var ctx = null;
function measure(text, size, weight = 900) {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  ctx.font = `${weight} ${size}px Quds`;
  ctx.direction = "rtl";
  return ctx.measureText(text).width;
}
function slot(word) {
  const ch = [...word];
  const L = [];
  for (let i = 0; i < ch.length; i++) if (!MARK.test(ch[i])) L.push(i);
  const cand = [];
  for (let k = 0; k < L.length - 1; k++) {
    const a = ch[L[k]], b = ch[L[k + 1]];
    if (!joinsLeft(a) || !isLetter(b)) continue;
    if (a === "\u0644" && "\u0627\u0622\u0623\u0625".includes(b)) continue;
    const at = L[k + 1] - 1;
    const last = k + 1 === L.length - 1;
    let p = 6;
    if ("\u0633\u0634\u0635\u0636".includes(a)) p = 1;
    else if (last && "\u0647\u06C0\u0629".includes(b)) p = 2;
    else if (last && "\u06CC\u064A\u06D0\u0626\u06CD\u0649\u0631\u0648\u0632\u0693".includes(b)) p = 3;
    else if (last && "\u0646\u06BC\u0644\u06A9".includes(b)) p = 4;
    else if (last) p = 5;
    cand.push([at, p, k]);
  }
  if (!cand.length) return null;
  if (L.length <= 2) cand.forEach((c) => c[1] += 4);
  cand.sort((x, y) => x[1] - y[1] || y[2] - x[2]);
  return cand[0];
}
var insert = (word, at, n) => {
  const ch = [...word];
  return ch.slice(0, at + 1).join("") + TATWEEL.repeat(n) + ch.slice(at + 1).join("");
};
function stretch(line, target, size, weight = 900, maxPerWord = 6) {
  const words = line.split(" ");
  const slots = words.map(slot);
  const order = words.map((w, i) => i).filter((i) => slots[i]).sort((a, b) => slots[a][1] - slots[b][1] || [...words[b]].length - [...words[a]].length);
  if (!order.length) return line;
  const n = words.map(() => 0);
  const build = () => words.map((w, i) => n[i] ? insert(w, slots[i][0], n[i]) : w).join(" ");
  let cur = measure(line, size, weight);
  const tw = measure(TATWEEL, size, weight);
  let guard = 0;
  while (target - cur > tw * 0.55 && guard++ < 200) {
    const i = order.slice().sort((a, b) => n[a] + (slots[a][1] > 5 ? 1 : 0) - (n[b] + (slots[b][1] > 5 ? 1 : 0)) || slots[a][1] - slots[b][1])[0];
    if (n[i] >= maxPerWord) break;
    n[i]++;
    cur = measure(build(), size, weight);
  }
  return build();
}
function justify(lines, size, weight = 900, to = null, maxPerWord = 3) {
  if (lines.length < 2 && to == null) return lines;
  const ws = lines.map((l) => measure(l, size, weight));
  const target = to ?? Math.max(...ws);
  return lines.map((l, i) => target - ws[i] > 2 ? stretch(l, target, size, weight, maxPerWord) : l);
}

// web/src/scenes.js
function buildScenes(stage, beats, LEAD2, VE) {
  const BT = Object.fromEntries(beats.map((b) => [b.id, b]));
  const B = (id, d = 0) => {
    if (!BT[id]) throw new Error("no beat " + id);
    return BT[id].t + d;
  };
  const items = [];
  const add = (...its) => {
    for (const it of its) {
      it.root.style.zIndex = it.isShape ? "1" : String(2 + (it.o?.z || 0));
      stage.appendChild(it.root);
      items.push(it);
    }
    return its[0];
  };
  const CY = 1080;
  const CIRCLE = { x: 540, y: CY, w: 420, h: 420, r: 210 };
  const DOT = (x, y) => ({ x, y, w: 40, h: 40, r: 20 });
  function opener(n, name, t0, t1, from, to) {
    const sh = shape([[t0, { ...from, o: 1 }], [t0 + 0.02, { ...CIRCLE, o: 1 }, 0.85], [t1 - 0.2, { ...to, o: 1 }, 0.75], [t1 + 0.5, { ...to, o: 0 }, 0.35]]);
    sh.isShape = true;
    add(sh);
    cue("open", t0);
    const ring = h("div", "");
    css(ring, { width: "520px", height: "520px" });
    ring.innerHTML = `<svg viewBox="-260 -260 520 520" width="520" height="520"><circle r="250" fill="none" stroke="#ef7d22" stroke-opacity=".55" stroke-width="3" stroke-dasharray="2 16" stroke-linecap="round"/>
      <circle r="250" fill="none" stroke="#ef7d22" stroke-width="6" stroke-linecap="round" stroke-dasharray="120 1451"/></svg>`;
    const svg = ring.querySelector("svg");
    add(item(ring, { x: 540, y: CY, t0: t0 + 0.35, t1: t1 - 0.3, in: "zoom", snd: false, tick: (t) => {
      svg.style.transform = `rotate(${(t * 24).toFixed(2)}deg)`;
    } }));
    add(img(name, 360, { x: 540, y: CY - 6, t0: t0 + 0.4, t1: t1 - 0.3, float: 7, rock: 1.5, snd: false }));
    const badge = h("div", "badge", PS_DIGITS(n, 1));
    add(item(badge, { x: 540 + 158, y: CY - 158, t0: t0 + 0.65, t1: t1 - 0.3, in: "pop" }));
  }
  const tile = (name, text, sub, o) => {
    const e = h("div", "card tile", `<img src="assets/img/${name}.png"><div class="t">${text}</div>${sub ? `<div class="lbl sm">${sub}</div>` : ""}`);
    css(e, { width: (o.w || 280) + "px", height: (o.h || 340) + "px" });
    if (o.imgSize) e.querySelector("img").style.cssText = `width:${o.imgSize}px;height:${o.imgSize}px`;
    return item(e, { in: "up", ...o });
  };
  const bubble = (text, o) => {
    const e = h("div", "bubble" + (o.me ? " me" : ""));
    const W = o.w || 860, FS = 37, inner = W - 68;
    css(e, { width: W + "px", textAlign: "right" });
    const lines = [];
    let cur = [];
    for (const w of text.split(" ")) {
      const tryL = [...cur, w].join(" ");
      if (cur.length && measure(tryL, FS, 700) > inner) {
        lines.push(cur.join(" "));
        cur = [w];
      } else cur.push(w);
    }
    if (cur.length) lines.push(cur.join(" "));
    const J = lines.length > 1 ? [...justify(lines.slice(0, -1), FS, 700, inner - 4), lines[lines.length - 1]] : lines;
    const ws = [];
    J.forEach((l) => {
      const ln = h("div", "");
      css(ln, { whiteSpace: "nowrap" });
      l.split(" ").forEach((w, k, a) => {
        const s_ = h("span", "", w + (k < a.length - 1 ? " " : ""));
        ln.appendChild(s_);
        ws.push(s_);
      });
      e.appendChild(ln);
    });
    const dur = o.dur || ws.length * 0.16;
    return item(e, { in: "up", float: 4, ...o, tick: (t) => {
      ws.forEach((s_, i) => {
        s_.style.opacity = E.out(prog(t, o.t0 + 0.15 + i / ws.length * dur, o.t0 + 0.45 + i / ws.length * dur)).toFixed(3);
      });
    } });
  };
  const swap = (seq, x, y, size) => seq.forEach(([name, t0, t1]) => add(img(name, size, { x, y, t0, t1, out: "shrink" })));
  const frame = (keys, o) => {
    const e = h("div", "");
    css(e, { border: "4px dashed rgba(239,125,34,.55)", borderRadius: "48px" });
    return item(e, { in: "fade", snd: false, ...o, tick: (t) => {
      const k = E.io(prog(t, o.k0, o.k0 + 1.2));
      css(e, { width: lerp(keys[0][0], keys[1][0], k) + "px", height: lerp(keys[0][1], keys[1][1], k) + "px" });
    } });
  };
  const spinner = (name, size, o) => {
    const it = img(name, size, { float: 0, ...o });
    const im = it.el.querySelector("img");
    const tk = it.o.tick;
    it.o.tick = (t, el, k) => {
      im.style.transform = `rotate(${(-(t - o.t0) * (o.speed || 40)).toFixed(2)}deg)`;
      if (tk) tk(t, el, k);
    };
    return it;
  };
  const arrow = (o) => {
    const e = h("div", "", `<svg width="70" height="30" viewBox="0 0 70 30"><path d="M66 15H8M20 4L6 15l14 11" fill="none" stroke="#ef7d22" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${o.dash ? "2 9" : "none"}"/></svg>`);
    return item(e, { in: "side", from: 30, snd: false, ...o });
  };
  const kick = [];
  const K = (n, name, t0, t1) => kick.push({ n, name, t0, t1 });
  const T0 = LEAD2, S1 = B("S1");
  const MAPG = { x: 540, y: 1010, w: 1012, h: 569, r: 40 };
  add(dotMap({
    x: MAPG.x,
    y: MAPG.y,
    t0: T0 + 0.1,
    t1: S1 - 0.05,
    in: "up",
    dout: 0.4,
    pins: [{ id: "islamabad", t: B("T.a", 0.45) }, { id: "london", t: B("T.a", 1.05) }, { id: "madrid", t: B("T.a", 1.55) }],
    routes: [{ a: "islamabad", b: "london", t: B("T.a", 0.55), d: 0.9 }, { a: "london", b: "madrid", t: B("T.a", 1.2), d: 0.5 }]
  }));
  add(img("room", 360, { x: 540, y: 1470, t0: B("T.b", 0.1), t1: S1 - 0.05, float: 8 }));
  const S2 = B("S2");
  const TILE = { w: 300, h: 390 };
  opener(1, "loop", S1, B("S1.isb"), MAPG, { x: 870, y: 920, w: TILE.w, h: TILE.h, r: 40 });
  K(1, "\u062F \u063A\u0648\u0646\u0689\u0648 \u062A\u06A9\u0631\u0627\u0631\u064A \u0644\u0693\u06CD", B("S1.isb"), S2);
  const tri = { isb: [830, 850], lon: [250, 850], mad: [540, 1420] };
  const cityTile = (name, label_, sub, x, t0, key) => add(tile(name, label_, sub, {
    x,
    y: 920,
    t0,
    t1: B("S1.p1", -0.1),
    in: key === "isb" ? "fade" : "up",
    din: key === "isb" ? 0.35 : 0.6,
    w: TILE.w,
    h: TILE.h,
    path: [[B("S1.again"), { x: tri[key][0], y: tri[key][1], s: 0.82 }]],
    pd: 1.1,
    imgSize: 240
  }));
  cityTile("isb", "\u0627\u0633\u0644\u0627\u0645 \u0622\u0628\u0627\u062F", "\u0644\u0648\u0645\u0693\u06CC \u067E\u0693\u0627\u0648", 870, B("S1.isb", 0.25), "isb");
  add(arrow({ x: 705, y: 920, t0: B("S1.lon", 0.1), t1: B("S1.again") }));
  cityTile("lon", "\u0644\u0646\u062F\u0646", "\u062F\u0648\u06CC\u0645 \u067E\u0693\u0627\u0648", 540, B("S1.lon"), "lon");
  add(arrow({ x: 375, y: 920, t0: B("S1.mad", 0.1), t1: B("S1.again"), dash: true }));
  add(img("figs", 420, { x: 540, y: 1370, t0: B("S1.who", 0.1), t1: B("S1.again", -0.1), out: "shrink" }));
  add(label("\u0645\u062E\u0627\u0644\u0641\u06D0 \u0685\u06D0\u0631\u06D0", { x: 540, y: 1600, t0: B("S1.who", 0.4), t1: B("S1.again", -0.1), cls: "md" }));
  cityTile("mad", "\u0645\u0627\u062F\u0631\u06CC\u062F", "\u062F\u0627 \u0681\u0644", 210, B("S1.mad"), "mad");
  add(spinner("loop", 330, { x: 540, y: 1110, t0: B("S1.again", 0.4), t1: B("S1.p1", -0.1), speed: 30 }));
  swap([["turned", B("S1.p1"), B("S1.p2")], ["handsplit", B("S1.p2"), B("S1.p3")], ["agenda", B("S1.p3"), S2 - 0.05]], 540, 840, 400);
  const L1 = { x: 540, y: 1370, w: 820, h: listH(3) };
  add(list(L1.w, [
    { text: "\u062E\u067E\u0644\u0645\u0646\u0681\u064A \u0627\u062E\u062A\u0644\u0627\u0641\u0627\u062A", t: B("S1.p1", 0.2) },
    { text: "\u0633\u06CC\u0627\u0633\u064A \u0628\u06D0\u200C\u0628\u0627\u0648\u0631\u064A", t: B("S1.p2", 0.1) },
    { text: "\u062F \u06AB\u0689\u06D0 \u0627\u062C\u0646\u0689\u0627 \u0646\u0634\u062A\u0648\u0646", t: B("S1.p3", 0.1) }
  ], { x: L1.x, y: L1.y, t0: B("S1.p1"), t1: S2 - 0.05 }));
  const S3 = B("S3");
  const L2 = { x: 540, y: 1100, w: 960, h: listH(4, 128) };
  opener(2, "copies", S2, B("S2.p1"), { ...L1, r: 40 }, { ...L2, r: 40 });
  K(2, "\u0645\u062D\u062F\u0648\u062F \u06AB\u0689\u0648\u0646\u0648\u0627\u0644\u060C \u062A\u06A9\u0631\u0627\u0631\u064A \u0685\u06D0\u0631\u06D0", B("S2.p1"), S3);
  add(list(L2.w, [
    { text: "\u062F \u067E\u062E\u0648\u0627\u0646\u06CC\u0648 \u0633\u06CC\u0627\u0633\u064A \u0685\u06D0\u0631\u0648 \u062E\u067E\u0644\u0648\u0627\u0646", th: "portrait", t: B("S2.p1", 1.2) },
    { text: "\u067E\u062E\u0648\u0627\u0646\u064A \u067E\u0627\u0631\u0644\u0645\u0627\u0646\u064A \u0627\u0633\u062A\u0627\u0632\u064A", th: "parliament", t: B("S2.p2") },
    { text: "\u062F \u0631\u0633\u0646\u06CC\u0648 \u0627\u0648 \u0645\u062F\u0646\u064A \u0641\u0639\u0627\u0644\u06CC\u062A\u0648\u0646\u0648 \u0645\u062E\u06A9\u06CC\u0646\u064A \u063A\u0693\u064A", th: "media", t: B("S2.p3") },
    { text: "\u062F \u0628\u06D0\u0644\u0627\u0628\u06D0\u0644\u0648 \u0645\u062E\u0627\u0644\u0641\u0648 \u0689\u0644\u0648 \u0627\u0633\u062A\u0627\u0632\u064A", th: "banner", t: B("S2.p4") }
  ], { x: L2.x, y: L2.y, t0: B("S2.p1", 0.3), t1: B("S2.chal", -0.1), in: "fade", din: 0.4, rh: 128, th: 104, fs: 36 }));
  add(img("pedestal", 440, { x: 540, y: 880, t0: B("S2.chal"), t1: B("S2.rep", -0.1), rock: 3 }));
  add(meter("\u0633\u06CC\u0627\u0633\u064A \u0646\u0641\u0648\u0630", 0.34, { x: 540, y: 1300, w: 700, t0: B("S2.chal", 0.5), t1: B("S2.rep", -0.1), wob: 0.12 }));
  add(meter("\u0648\u0644\u0633\u064A \u0645\u0644\u0627\u062A\u0693", 0.26, { x: 540, y: 1450, w: 700, t0: B("S2.chal", 1.1), t1: B("S2.rep", -0.1), wob: 0.1 }));
  add(tag("\u062C\u062F\u064A \u0646\u0646\u06AB\u0648\u0646\u06D0", { x: 540, y: 1590, t0: B("S2.chal2", 0.2), t1: B("S2.rep", -0.1), cls: "ink" }));
  add(img("copies", 640, { x: 540, y: 1020, t0: B("S2.rep"), t1: B("S2.nat", -0.1), float: 6 }));
  add(spinner("loop", 150, { x: 540, y: 1360, t0: B("S2.rep", 0.4), t1: B("S2.nat", -0.1), speed: 60 }));
  const nat = add(tile("hands", "\u067E\u0631\u0627\u062E\u0647 \u0645\u0644\u064A \u0627\u062C\u0645\u0627\u0639", "", { x: 800, y: 1080, t0: B("S2.nat"), t1: S3 - 0.05, w: 420, h: 520, imgSize: 330 }));
  add(mark("x", { x: 800 + 175, y: 1080 - 225, t0: B("S2.circ", 0.3), t1: S3 - 0.05 }));
  const circ = add(tile("circle", "\u0645\u062D\u062F\u0648\u062F\u06D0 \u0633\u06CC\u0627\u0633\u064A \u06A9\u0693\u06CD", "", { x: 280, y: 1080, t0: B("S2.circ"), t1: S3 - 0.05, w: 420, h: 520, imgSize: 330 }));
  nat.o.tick = (t, el) => {
    el.style.opacity = (1 - 0.5 * E.io(prog(t, B("S2.circ", 0.2), B("S2.circ", 0.9)))).toFixed(3);
  };
  circ.o.tick = (t, el) => {
    el.style.boxShadow = `0 0 0 ${(6 * E.out(prog(t, B("S2.circ", 0.5), B("S2.circ", 1.1)))).toFixed(1)}px #ef7d22, 0 30px 70px rgba(110,72,36,.13)`;
  };
  const S4 = B("S4");
  opener(3, "palm", S3, B("S3.rep"), { x: 540, y: 1080, w: 900, h: 520, r: 40 }, MAPG);
  K(3, "\u062F \u0628\u0647\u0631\u0646\u06CC\u0648 \u0645\u0644\u0627\u062A\u0693\u0648\u0646\u0648 \u067E\u0647 \u062A\u0645\u0647", B("S3.rep"), S4);
  add(dotMap({
    x: MAPG.x,
    y: MAPG.y,
    t0: B("S3.rep", 0.25),
    t1: B("S3.q", -0.1),
    in: "fade",
    din: 0.35,
    pins: [{ id: "islamabad", t: B("S3.rep", 0.4) }, { id: "london", t: B("S3.rep", 0.6) }, { id: "madrid", t: B("S3.rep", 0.8) }],
    routes: [{ a: "islamabad", b: "london", t: B("S3.rep", 0.5), d: 0.8 }, { a: "london", b: "madrid", t: B("S3.rep", 1.1), d: 0.4 }],
    cycle: { t0: B("S3.rep", 1.6), t1: B("S3.q"), per: 0.7 }
  }));
  add(spinner("loop", 200, { x: 540, y: 1440, t0: B("S3.rep", 1.2), t1: B("S3.q", -0.1), speed: 50 }));
  add(img("magnifier", 400, { x: 540, y: 860, t0: B("S3.q"), t1: B("S3.pk", -0.1) }));
  add(bubble("\u062F\u063A\u0647 \u062C\u0631\u06CC\u0627\u0646\u0648\u0646\u0647 \u0648\u0644\u06D0 \u062F \u062E\u067E\u0644\u0648 \u0633\u06CC\u0627\u0633\u064A \u0647\u0685\u0648 \u0644\u067E\u0627\u0631\u0647 \u0628\u0647\u0631\u0646\u06CC\u0648 \u0646\u0627\u0633\u062A\u0648 \u0627\u0648 \u0645\u0644\u0627\u062A\u0693\u0648\u0646\u0648 \u062A\u0647 \u0627\u0693\u062A\u06CC\u0627 \u0644\u0631\u064A\u061F", { x: 540, y: 1300, w: 900, t0: B("S3.why"), t1: B("S3.pk", -0.1), dur: 3.2 }));
  add(typing({ x: 260, y: 1500, t0: B("S3.why", 3.8), t1: B("S3.pk", -0.1) }));
  add(img("cap", 440, { x: 540, y: 860, t0: B("S3.pk"), t1: B("S3.ind", -0.1) }));
  add(chip("\u062F \u067E\u0627\u06A9\u0633\u062A\u0627\u0646 \u062F \u067E\u0648\u0681\u064A \u0631\u0698\u06CC\u0645 \u0645\u0644\u0627\u062A\u0693", { x: 540, y: 1250, t0: B("S3.pk", 1.4), t1: B("S3.ind", -0.1), cls: "on" }));
  add(item(h("div", "", '<div style="width:4px;height:90px;margin:auto;background-image:linear-gradient(#ef7d22 50%,transparent 0);background-size:4px 14px"></div>'), { x: 540, y: 1352, t0: B("S3.pk", 2.4), t1: B("S3.ind", -0.1), in: "fade", snd: false }));
  add(chip("\u062F \u062F\u0648\u06CC \u0627\u0693\u06CC\u06A9\u06D0 \u0627\u0648 \u0631\u0627\u067C\u0648\u0644\u06D0\u062F\u0644", { x: 540, y: 1450, t0: B("S3.pk", 2.6), t1: B("S3.ind", -0.1) }));
  add(img("puppet", 480, { x: 540, y: 900, t0: B("S3.ind"), t1: S4 - 0.05, rock: 2 }));
  add(chip("\u0633\u06CC\u0627\u0633\u064A \u062E\u067E\u0644\u0648\u0627\u06A9\u064A", { x: 560, y: 1330, t0: B("S3.ind", 0.6), t1: S4 - 0.05, cls: "soft" }));
  add(mark("q", { x: 300, y: 1330, t0: B("S3.ind", 1.4), t1: S4 - 0.05 }));
  const S5 = B("S5");
  const L4 = { x: 540, y: 1360, w: 820, h: listH(4) };
  opener(4, "facade", S4, B("S4.big"), { x: 540, y: 1100, w: 600, h: 600, r: 300 }, { ...L4, r: 40 });
  K(4, "\u062F \u062A\u06D0\u0631\u06D0 \u0648\u0627\u06A9\u0645\u0646\u06CD \u062A\u0631\u062E\u06D0 \u062A\u062C\u0631\u0628\u06D0", B("S4.big"), S5);
  add(img("folder", 400, { x: 540, y: 830, t0: B("S4.big", 0.2), t1: B("S4.crit", -0.1) }));
  add(list(L4.w, [
    { text: "\u067E\u062E\u0648\u0627\u0646\u06CC \u0633\u06CC\u0627\u0633\u064A \u0641\u0639\u0627\u0644\u06CC\u062A", t: B("S4.r1") },
    { text: "\u0633\u0627\u0628\u0642\u0647", t: B("S4.r2") },
    { text: "\u06A9\u0693\u0646\u06D0", t: B("S4.r2", 0.7) },
    { text: "\u062F \u0648\u0627\u06A9\u0645\u0646\u06CD \u067E\u0631 \u0645\u0647\u0627\u0644 \u067E\u0631\u06D0\u06A9\u0693\u06D0", t: B("S4.r4") }
  ], { x: L4.x, y: L4.y, t0: B("S4.big", 0.4), t1: B("S4.crit", -0.1), in: "fade", din: 0.4 }));
  add(tag("\u0645\u06CC\u0631\u0627\u062B", { x: 540 + 330, y: L4.y - L4.h / 2 - 10, t0: B("S4.her", 0.4), t1: B("S4.crit", -0.1), cls: "ink" }));
  const G = [[870, 830], [540, 830], [210, 830], [870, 1230], [540, 1230], [210, 1230]];
  const crit = [
    ["bribe", "\u0641\u0633\u0627\u062F", "S4.c1"],
    ["mess", "\u0627\u062F\u0627\u0631\u064A \u0628\u06D0\u200C\u0646\u0638\u0645\u064A", "S4.c2"],
    ["throne", "\u0633\u06CC\u0627\u0633\u064A \u0627\u0646\u062D\u0635\u0627\u0631", "S4.c3"],
    ["stamp", "\u062E\u067E\u0644\u200C\u0633\u0631\u06D0 \u067E\u0631\u06D0\u06A9\u0693\u06D0", "S4.c4"],
    ["tug", "\u062F \u0648\u0627\u06A9 \u067E\u0631 \u0633\u0631 \u0633\u06CC\u0627\u0644\u06CD", "S4.c5"],
    ["safe", "\u062F \u0634\u062E\u0635\u064A \u06AB\u067C\u0648 \u062E\u0648\u0646\u062F\u064A \u06A9\u0648\u0644", "S4.c6"]
  ];
  crit.forEach(([n, txt, id], i) => add(tile(n, txt, "", { x: G[i][0], y: G[i][1], t0: B(id), t1: B("S4.alt", -0.1 + i * 0.04), w: 310, h: 380, imgSize: 220, in: "pop", out: "shrink" })));
  add(img("blueprint", 460, { x: 540, y: 880, t0: B("S4.alt"), t1: B("S4.ans", -0.1) }));
  add(chip("\u0633\u06CC\u0627\u0633\u064A \u0628\u062F\u06CC\u0644", { x: 700, y: 1300, t0: B("S4.alt", 1), t1: B("S4.ans", -0.1) }));
  add(chip("\u0631\u0627\u062A\u0644\u0648\u0646\u06A9\u06CC \u0646\u0638\u0627\u0645", { x: 360, y: 1300, t0: B("S4.alt", 1.8), t1: B("S4.ans", -0.1) }));
  add(img("bubble", 300, { x: 540, y: 800, t0: B("S4.ans"), t1: S5 - 0.05 }));
  add(bubble("\u062F \u062A\u06D0\u0631\u06D0 \u062F\u0648\u0631\u06D0 \u062F \u0646\u0627\u06A9\u0627\u0645\u06CC\u0648 \u0627\u0648 \u067E\u0648\u069A\u062A\u0646\u0648 \u0642\u0627\u0646\u0639 \u06A9\u0648\u0648\u0646\u06A9\u06CC \u0681\u0648\u0627\u0628\u061F", { x: 560, y: 1180, w: 860, t0: B("S4.ans", 0.6), t1: S5 - 0.05, dur: 2.4 }));
  add(typing({ x: 260, y: 1380, t0: B("S4.ans", 3.4), t1: S5 - 0.05 }));
  const S6 = B("S6");
  const L5 = { x: 540, y: 1350, w: 820, h: listH(5) };
  opener(5, "crowns", S5, B("S5.f1"), { x: 540, y: 1180, w: 860, h: 300, r: 40 }, { ...L5, r: 40 });
  K(5, "\u062E\u067E\u0644\u0645\u0646\u0681\u064A \u0627\u062E\u062A\u0644\u0627\u0641\u0627\u062A \u0627\u0648 \u062F \u0645\u0634\u0631\u062A\u0627\u0628\u0647 \u0628\u062D\u0631\u0627\u0646", B("S5.f1"), S6);
  swap([["tablesplit", B("S5.f1"), B("S5.f2")], ["clash", B("S5.f2"), B("S5.f3")], ["handsplit", B("S5.f3"), B("S5.f4")], ["figs", B("S5.f4"), B("S5.f5")], ["tug", B("S5.f5"), B("S5.each", -0.1)]], 540, 800, 380);
  add(list(L5.w, [
    { text: "\u062F \u0645\u0634\u0631\u062A\u0627\u0628\u0647 \u067E\u0631 \u0633\u0631 \u0633\u06CC\u0627\u0644\u06CD", t: B("S5.f1", 0.3) },
    { text: "\u062F \u0634\u062E\u0635\u064A \u06AB\u067C\u0648 \u067C\u06A9\u0631", t: B("S5.f2") },
    { text: "\u062F \u0645\u062A\u0642\u0627\u0628\u0644 \u0628\u0627\u0648\u0631 \u0646\u0634\u062A\u0648\u0646", t: B("S5.f3") },
    { text: "\u062F \u0689\u0644\u0648 \u0648\u06D0\u0634", t: B("S5.f4") },
    { text: "\u062F \u0646\u0641\u0648\u0630 \u067E\u0631 \u0633\u0631 \u0634\u062E\u0693\u06D0", t: B("S5.f5") }
  ], { x: L5.x, y: L5.y, t0: B("S5.f1", 0.4), t1: B("S5.each", -0.1), in: "fade", din: 0.4 }));
  add(img("crowns", 600, { x: 540, y: 1060, t0: B("S5.each"), t1: B("S5.no", -0.1) }));
  add(img("puzzlebad", 380, { x: 540, y: 850, t0: B("S5.no"), t1: B("S5.loop", -0.1) }));
  add(list(820, [
    { text: "\u06AB\u0689 \u0633\u06CC\u0627\u0633\u064A \u062F\u0631\u06CC\u0681", t: B("S5.no", 0.3), state: [[B("S5.no", 2), "x"]] },
    { text: "\u0645\u0646\u0644 \u0634\u0648\u06D0 \u0631\u0647\u0628\u0631\u064A", t: B("S5.no", 1), state: [[B("S5.no", 2.6), "x"]] }
  ], { x: 540, y: 1300, t0: B("S5.no", 0.2), t1: B("S5.loop", -0.1) }));
  add(spinner("loop", 440, { x: 540, y: 960, t0: B("S5.loop"), t1: S6 - 0.05, speed: 26 }));
  add(chip("\u062F \u0627\u062E\u062A\u0644\u0627\u0641\u0627\u062A\u0648 \u062D\u0644", { x: 540, y: 1360, t0: B("S5.loop", 2), t1: S6 - 0.05, cls: "ghost" }));
  add(strike(300, { x: 540, y: 1360, t0: B("S5.loop", 4.6), t1: S6 - 0.05 }));
  add(chip("\u062F \u0647\u0645\u0627\u063A\u0648 \u0627\u062E\u062A\u0644\u0627\u0641\u0627\u062A\u0648 \u062A\u06A9\u0631\u0627\u0631", { x: 540, y: 1500, t0: B("S5.loop", 5.6), t1: S6 - 0.05, cls: "on" }));
  const S7 = B("S7");
  opener(6, "doors", S6, B("S6.claim"), { x: 540, y: 1430, w: 520, h: 90, r: 45 }, DOT(540, 1e3));
  K(6, "\u0644\u0647 \u0627\u0641\u063A\u0627\u0646\u0633\u062A\u0627\u0646\u0647 \u062A\u0631 \u0628\u0647\u0631\u0646\u06CC\u0648 \u062F\u0631\u0648\u0627\u0632\u0648", B("S6.claim"), S7);
  add(img("throne", 480, { x: 540, y: 1e3, t0: B("S6.claim", 0.1), t1: B("S6.out", -0.1) }));
  add(dotMap({
    x: MAPG.x,
    y: 960,
    t0: B("S6.out"),
    t1: B("S6.sup", -0.1),
    in: "up",
    afg: B("S6.out", 0.3),
    pins: [{ id: "kabul", t: B("S6.out", 0.6), label: "\u0627\u0641\u063A\u0627\u0646\u0633\u062A\u0627\u0646" }],
    flow: { t: B("S6.out", 1.2), from: "kabul", n: 12 }
  }));
  add(img("suitcase", 280, { x: 540, y: 1450, t0: B("S6.out", 1), t1: B("S6.sup", -0.1) }));
  add(img("knock", 520, { x: 540, y: 1010, t0: B("S6.sup"), t1: B("S6.act", -0.1) }));
  add(chip("\u062F \u0628\u0647\u0631\u0646\u06CC\u0648 \u0644\u0648\u0631\u0648 \u0645\u0644\u0627\u062A\u0693", { x: 540, y: 1400, t0: B("S6.sup", 1), t1: B("S6.act", -0.1) }));
  const A = [[790, 860, "room", "\u063A\u0648\u0646\u0689\u06D0", "S6.a1"], [290, 860, "podium", "\u0627\u0639\u0644\u0627\u0645\u06CC\u06D0", "S6.a2"], [790, 1240, "studio", "\u0645\u0631\u06A9\u06D0", "S6.a3"], [290, 1240, "phone", "\u067C\u0648\u0644\u0646\u06CC\u0632\u06D0 \u0631\u0633\u0646\u06CD", "S6.a4"]];
  A.forEach(([x, y, n, txt, id]) => add(tile(n, txt, "", { x, y, t0: B(id, -0.15), t1: B("S6.alt", -0.1), w: 330, h: 340, imgSize: 240, in: "pop" })));
  add(frame([[1e3, 860], [860, 820]], { x: 540, y: 1050, t0: B("S6.act", 0.2), t1: B("S6.alt", -0.1), k0: B("S6.a4", 0.8) }));
  add(tag("\u0645\u062D\u062F\u0648\u062F", { x: 540, y: 1050, t0: B("S6.a4", 1.2), t1: B("S6.alt", -0.1), cls: "ink" }));
  add(img("empty", 460, { x: 540, y: 930, t0: B("S6.alt"), t1: S7 - 0.05 }));
  add(chip("\u062F \u0647\u06D0\u0648\u0627\u062F \u062F\u0646\u0646\u0647 \u067E\u0631\u0627\u062E \u0648\u0644\u0633\u064A \u0645\u0644\u0627\u062A\u0693", { x: 540, y: 1300, t0: B("S6.alt", 0.8), t1: S7 - 0.05, cls: "soft" }));
  add(chip("\u0685\u0631\u06AB\u0646\u062F \u0639\u0645\u0644\u064A \u0628\u062F\u06CC\u0644", { x: 560, y: 1440, t0: B("S6.alt", 3.4), t1: S7 - 0.05 }));
  add(mark("x", { x: 300, y: 1440, t0: B("S6.alt", 4.6), t1: S7 - 0.05 }));
  const S8 = B("S8");
  opener(7, "gloved", S7, B("S7.chg"), { x: 540, y: 1300, w: 860, h: 300, r: 40 }, DOT(540, 1020));
  K(7, "\u062F \u067E\u0627\u06A9\u0633\u062A\u0627\u0646 \u067E\u0647 \u063A\u06D0\u0696 \u06A9\u06D0 \u062F \u0633\u06CC\u0627\u0633\u064A \u067E\u0646\u0627\u0647 \u0644\u067C\u0648\u0644", B("S7.chg"), S8);
  add(img("gloved", 600, { x: 540, y: 1020, t0: B("S7.chg"), t1: B("S7.pol", -0.1) }));
  add(img("weight", 420, { x: 540, y: 860, t0: B("S7.pol"), t1: B("S7.sens", -0.1) }));
  add(chip("\u0633\u06CC\u0627\u0633\u062A\u0648\u0646\u0647", { x: 720, y: 1270, t0: B("S7.pol", 1.6), t1: B("S7.sens", -0.1) }));
  add(chip("\u0641\u0634\u0627\u0631\u0648\u0646\u0647", { x: 370, y: 1270, t0: B("S7.pol", 2.4), t1: B("S7.sens", -0.1) }));
  add(afgShape({ x: 540, y: 1e3, s: 0.95, t0: B("S7.sens"), t1: B("S7.meet", -0.1), pulse: true }));
  add(chip("\u062F \u0627\u0641\u063A\u0627\u0646\u0627\u0646\u0648 \u062D\u0633\u0627\u0633\u06CC\u062A", { x: 540, y: 1420, t0: B("S7.sens", 0.6), t1: B("S7.meet", -0.1), cls: "on" }));
  add(img("cap", 440, { x: 540, y: 860, t0: B("S7.meet"), t1: B("S7.contra", -0.1) }));
  add(list(820, [
    { text: "\u062F \u0647\u0645\u062F\u06D0 \u0631\u0698\u06CC\u0645 \u0633\u06CC\u0627\u0633\u064A \u0686\u0627\u067E\u06D0\u0631\u06CC\u0627\u0644", t: B("S7.meet", 1.4) },
    { text: "\u062F \u0647\u0645\u062F\u06D0 \u0631\u0698\u06CC\u0645 \u0645\u0644\u0627\u062A\u0693", t: B("S7.meet", 2.4) }
  ], { x: 540, y: 1290, t0: B("S7.meet", 1.2), t1: B("S7.contra", -0.1) }));
  add(label("\u067E\u0648\u0631\u06D0 \u062A\u0693\u0644\u06D0 \u0646\u0627\u0633\u062A\u06D0", { x: 540, y: 1460, t0: B("S7.meet", 3.6), t1: B("S7.contra", -0.1), cls: "md" }));
  add(img("signpost", 440, { x: 540, y: 840, t0: B("S7.contra"), t1: B("S7.ans", -0.1), rock: 2 }));
  add(card(380, 160, '<div class="lbl md" style="line-height:160px">\u062F\u0631\u06CC\u0681</div>', { x: 760, y: 1290, t0: B("S7.contra", 0.8), t1: B("S7.ans", -0.1), path: [[B("S7.contra", 3.2), { x: 800, y: 1290, s: 1 }]] }));
  add(card(380, 160, '<div class="lbl md" style="line-height:160px">\u0639\u0645\u0644\u064A \u0633\u06CC\u0627\u0633\u064A \u062A\u06AB\u0644\u0627\u0631\u0647</div>', { x: 320, y: 1290, t0: B("S7.contra", 1.6), t1: B("S7.ans", -0.1), path: [[B("S7.contra", 3.2), { x: 280, y: 1290, s: 1 }]] }));
  add(tag("\u062A\u0646\u0627\u0642\u0636", { x: 540, y: 1460, t0: B("S7.contra", 3.4), t1: B("S7.ans", -0.1), cls: "ink" }));
  add(img("megaphone", 440, { x: 540, y: 840, t0: B("S7.ans"), t1: S8 - 0.05 }));
  add(list(820, [
    { text: "\u0628\u0647\u0631\u0646\u06CD \u0627\u0693\u06CC\u06A9\u06D0", t: B("S7.ans", 5), icon: "q" },
    { text: "\u0633\u06CC\u0627\u0633\u064A \u062E\u067E\u0644\u0648\u0627\u06A9\u064A", t: B("S7.ans", 5.8), icon: "q" }
  ], { x: 540, y: 1290, t0: B("S7.ans", 4.8), t1: S8 - 0.05 }));
  add(chip("\u0648\u0644\u0633 \u062A\u0647 \u0631\u0648\u069A\u0627\u0646\u0647 \u0681\u0648\u0627\u0628", { x: 540, y: 1480, t0: B("S7.ans", 8.4), t1: S8 - 0.05, cls: "on" }));
  const S9 = B("S9");
  const L8 = { x: 540, y: 1140, w: 820, h: listH(2) };
  opener(8, "scale", S8, B("S8.core"), { x: 540, y: 1480, w: 520, h: 90, r: 45 }, { ...L8, r: 40 });
  K(8, "\u062F \u0648\u0644\u0633\u064A \u0645\u0634\u0631\u0648\u0639\u06CC\u062A \u0646\u0634\u062A\u0648\u0646", B("S8.core"), S9);
  add(list(L8.w, [
    { text: "\u06CC\u0648\u0627\u0632\u06D0 \u062F \u063A\u0648\u0646\u0689\u0648 \u062C\u0648\u0693\u0648\u0644", t: B("S8.core", 1.6), dim: B("S8.core", 6) },
    { text: "\u06CC\u0648\u0627\u0632\u06D0 \u062F \u06AB\u0689\u0648\u0646\u0648\u0627\u0644\u0648 \u0631\u0627\u067C\u0648\u0644\u0648\u0644", t: B("S8.core", 3.2), dim: B("S8.core", 6) }
  ], { x: L8.x, y: L8.y, t0: B("S8.core", 0.3), t1: B("S8.m1", -0.1), in: "fade", din: 0.4 }));
  add(label("\u0627\u0633\u0627\u0633\u064A \u0633\u062A\u0648\u0646\u0632\u0647 \u06CC\u0648\u0627\u0632\u06D0 \u062F\u0627 \u0646\u0647 \u062F\u0647", { x: 540, y: 1330, t0: B("S8.core", 6.2), t1: B("S8.m1", -0.1), cls: "sm" }));
  add(img("puzzle", 380, { x: 540, y: 820, t0: B("S8.m1"), t1: B("S8.rep", -0.1) }));
  add(list(820, [
    { text: "\u0648\u0644\u0633\u064A \u0645\u0644\u0627\u062A\u0693", t: B("S8.m1", 0.2), icon: "empty", state: [[B("S8.m1", 1), "x"]] },
    { text: "\u06AB\u0689\u0647 \u0627\u062C\u0646\u0689\u0627", t: B("S8.m2"), icon: "empty", state: [[B("S8.m2", 0.6), "x"]] },
    { text: "\u0645\u062A\u0642\u0627\u0628\u0644 \u0628\u0627\u0648\u0631", t: B("S8.m3"), icon: "empty", state: [[B("S8.m3", 0.6), "x"]] },
    { text: "\u0645\u0646\u0644 \u0634\u0648\u06CC \u0633\u06CC\u0627\u0633\u064A \u0645\u0634\u0631\u062A\u0627\u0628\u0647", t: B("S8.m4"), icon: "empty", state: [[B("S8.m4", 1), "x"]] }
  ], { x: 540, y: 1340, t0: B("S8.m1"), t1: B("S8.rep", -0.1) }));
  add(img("micstand", 540, { x: 540, y: 960, t0: B("S8.rep"), t1: B("S8.leg", -0.1) }));
  add(chip("\u062F \u0685\u0648 \u0645\u062D\u062F\u0648\u062F\u0648 \u0633\u06CC\u0627\u0633\u064A \u0685\u06D0\u0631\u0648 \u0631\u0627\u067C\u0648\u0644\u06D0\u062F\u0644", { x: 540, y: 1330, t0: B("S8.rep", 0.6), t1: B("S8.leg", -0.1) }));
  add(chip("\u062F \u0627\u0641\u063A\u0627\u0646\u0633\u062A\u0627\u0646 \u062F \u062E\u0644\u06A9\u0648 \u0627\u0633\u062A\u0627\u0632\u06CC\u062A\u0648\u0628", { x: 590, y: 1470, t0: B("S8.rep", 2.6), t1: B("S8.leg", -0.1), cls: "soft" }));
  add(mark("x", { x: 200, y: 1470, t0: B("S8.rep", 3.6), t1: B("S8.leg", -0.1) }));
  add(img("deal", 320, { x: 790, y: 820, t0: B("S8.leg"), t1: S9 - 0.05 }));
  add(img("bin", 320, { x: 290, y: 820, t0: B("S8.leg", 0.3), t1: S9 - 0.05 }));
  add(list(900, [
    { text: "\u062F \u0628\u0647\u0631\u0646\u06CC\u0648 \u0646\u0627\u0686\u06CC\u0632\u0647 \u063A\u0648\u0646\u0689\u0648 \u0644\u0647 \u0644\u0627\u0631\u06D0", t: B("S8.x1"), state: [[B("S8.x1", 1), "x"]] },
    { text: "\u062F \u0646\u0627\u0686\u06CC\u0632\u0647 \u0633\u06CC\u0627\u0633\u064A \u0645\u0639\u0627\u0645\u0644\u0627\u062A\u0648 \u0644\u0647 \u0644\u0627\u0631\u06D0", t: B("S8.x2"), state: [[B("S8.x2", 1), "x"]] },
    { text: "\u062F \u062A\u06A9\u0631\u0627\u0631\u064A \u06AB\u0689\u0648 \u0648\u0689\u0648 \u0627\u0639\u0644\u0627\u0645\u06CC\u0648 \u0644\u0647 \u0644\u0627\u0631\u06D0", t: B("S8.x3"), state: [[B("S8.x3", 1.2), "x"]] }
  ], { x: 540, y: 1260, t0: B("S8.x1", -0.2), t1: S9 - 0.05 }));
  add(chip("\u0648\u0644\u0633\u064A \u0645\u0634\u0631\u0648\u0639\u06CC\u062A \u0646\u0647 \u062A\u0631\u0644\u0627\u0633\u0647 \u06A9\u06D0\u0696\u064A", { x: 540, y: 1500, t0: B("S8.x3", 2.6), t1: S9 - 0.05, cls: "on" }));
  const C1 = B("C1");
  const SLOT = { x: 540, y: 960, w: 520, h: 560, r: 44 };
  opener(9, "stack", S9, B("S9.move"), { x: 540, y: 1260, w: 900, h: 290, r: 40 }, SLOT);
  K(9, "\u063A\u0648\u0646\u0689\u06D0 \u0689\u06D0\u0631\u06D0\u060C \u0644\u0627\u0633\u062A\u0647 \u0631\u0627\u0648\u0693\u0646\u06D0 \u06A9\u0645\u06D0", B("S9.move"), C1);
  {
    const e = h("div", "card");
    css(e, { width: SLOT.w + "px", height: SLOT.h + "px", overflow: "hidden" });
    const V = [["isb", "\u0627\u0633\u0644\u0627\u0645 \u0622\u0628\u0627\u062F"], ["lon", "\u0644\u0646\u062F\u0646"], ["mad", "\u0645\u0627\u062F\u0631\u06CC\u062F"]].map(([n, txt]) => {
      const v = h("div", "", `<img src="assets/img/${n}.png" style="width:380px;height:380px;display:block;margin:40px auto 0"><div class="lbl md" style="margin-top:10px">${txt}</div>`);
      css(v, { position: "absolute", left: "0", top: "0", width: "100%", height: "100%" });
      e.appendChild(v);
      return v;
    });
    const per = 1.7, c0 = B("S9.move", 0.6);
    for (let k = 1; k < 12; k++) cue("swap", c0 + k * per);
    add(item(e, {
      x: SLOT.x,
      y: SLOT.y,
      t0: B("S9.move", 0.3),
      t1: C1 - 0.05,
      in: "fade",
      din: 0.35,
      path: [[B("S9.stay"), { x: 300, y: 820, s: 0.62 }]],
      pd: 1,
      tick: (t) => {
        const u = Math.max(0, (t - c0) / per);
        const i = Math.floor(u), f = E.io(clamp((u - i - 0.7) / 0.3));
        V.forEach((v, j) => {
          const a = (i % 3 + 3) % 3, b = (a + 1) % 3;
          const y = j === a ? -f * 100 : j === b ? (1 - f) * 100 : 100;
          v.style.transform = `translateY(${y.toFixed(2)}%)`;
          v.style.opacity = j === a ? (1 - f).toFixed(3) : j === b ? f.toFixed(3) : "0";
        });
      }
    }));
  }
  add(label("\u062F \u0646\u0627\u0633\u062A\u0648 \u0681\u0627\u06CC", { x: 540, y: 1300, t0: B("S9.move", 0.8), t1: B("S9.stay", -0.1), cls: "sm" }));
  add(img("anchor", 340, { x: 800, y: 820, t0: B("S9.stay", 0.3), t1: C1 - 0.05 }));
  add(list(860, [
    { text: "\u062E\u067E\u0644\u0645\u0646\u0681\u064A \u0627\u062E\u062A\u0644\u0627\u0641\u0627\u062A", t: B("S9.stay", 0.9), icon: "pin" },
    { text: "\u062F \u06AB\u0689\u06D0 \u0627\u062C\u0646\u0689\u0627 \u0646\u0634\u062A\u0648\u0646", t: B("S9.s2"), icon: "pin" },
    { text: "\u062F \u062A\u06D0\u0631\u06D0 \u0648\u0627\u06A9\u0645\u0646\u06CD \u0645\u06CC\u0631\u0627\u062B", t: B("S9.s3"), icon: "pin" },
    { text: "\u062F \u0648\u0644\u0633\u064A \u0645\u0644\u0627\u062A\u0693 \u06A9\u0645\u0632\u0648\u0631\u062A\u06CC\u0627", t: B("S9.s4"), icon: "pin" }
  ], { x: 540, y: 1360, t0: B("S9.stay", 0.7), t1: C1 - 0.05 }));
  const eq = (name, a, b, y, t0, t1) => {
    const e = h("div", "card");
    css(e, { width: "960px", height: "230px", display: "flex", alignItems: "center", gap: "26px", padding: "0 34px" });
    e.innerHTML = `<img src="assets/img/${name}.png" style="width:180px;height:180px;flex:none">
      <div style="flex:1;display:flex;flex-direction:column;gap:6px"><div class="lbl" style="text-align:right">${a}</div>
      <div style="display:flex;align-items:center;gap:16px"><svg width="44" height="24" viewBox="0 0 44 24"><path d="M40 12H6M16 3L5 12l11 9" fill="none" stroke="#ef7d22" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span class="lbl md">${b}</span></div></div><div class="x">${ICON.x}</div>`;
    const xm = e.querySelector(".x");
    cue("nope", t0 + 1.4);
    return add(item(e, { x: 540, y, t0, t1, in: "up", tick: (t) => {
      const k = spring(prog(t, t0 + 1.4, t0 + 2) * 1.5, 9, 0.5);
      xm.style.transform = `scale(${k.toFixed(3)})`;
      xm.style.opacity = clamp(k * 2).toFixed(2);
    } }));
  };
  const C4 = B("C4");
  eq("cards", "\u067E\u0627\u0634\u0644\u06D0 \u063A\u0648\u0646\u0689\u06D0", "\u0633\u06CC\u0627\u0633\u064A \u0681\u0648\u0627\u06A9", 790, C1, C4 - 0.1);
  eq("bin", "\u06AB\u0689\u06D0 \u0648\u0689\u06D0 \u0627\u0639\u0644\u0627\u0645\u06CC\u06D0", "\u0648\u0644\u0633\u064A \u0645\u0634\u0631\u0648\u0639\u06CC\u062A", 1060, B("C2"), C4 - 0.05);
  eq("palm", "\u0628\u0647\u0631\u0646\u064A \u0627\u062D\u062A\u0645\u0627\u0644\u064A \u0645\u0644\u0627\u062A\u0693\u0648\u0646\u0647", "\u062F \u0627\u0641\u063A\u0627\u0646\u0627\u0646\u0648 \u0628\u0627\u0648\u0631", 1330, B("C3"), C4);
  const M = mapData();
  M.cities.next = [44, 470];
  add(dotMap({
    x: MAPG.x,
    y: MAPG.y,
    t0: C4,
    t1: B("C6", -0.1),
    in: "fade",
    din: 0.4,
    pins: [{ id: "islamabad", t: C4 + 0.3 }, { id: "london", t: C4 + 1 }, { id: "madrid", t: C4 + 1.7 }, { id: "next", t: B("C5", 1.4), label: "\u061F", below: true }],
    routes: [{ a: "islamabad", b: "london", t: C4 + 0.4, d: 0.8 }, { a: "london", b: "madrid", t: C4 + 1.2, d: 0.5 }, { a: "madrid", b: "next", t: B("C5", 0.3), d: 1.2 }]
  }));
  add(img("fog", 300, { x: 540, y: 1470, t0: B("C5", 0.4), t1: B("C6", -0.1) }));
  add(img("cards", 340, { x: 540, y: 820, t0: B("C6"), t1: B("C7", -0.1), rock: 2 }));
  add(list(900, [
    { text: "\u062F \u062F\u0648\u06CC \u062A\u0631\u0645\u0646\u0681 \u0627\u062E\u062A\u0644\u0627\u0641\u0627\u062A", th: "turned", t: B("C6", 0.4) },
    { text: "\u0633\u06CC\u0627\u0633\u064A \u0628\u06D0\u200C\u0628\u0627\u0648\u0631\u064A", th: "handsplit", t: B("C6", 1.6) },
    { text: "\u067E\u0631 \u0628\u0647\u0631\u0646\u06CC\u0648 \u0645\u0644\u0627\u062A\u0693\u0648\u0646\u0648 \u062A\u06A9\u06CC\u0647", th: "palm", t: B("C6", 2.8) }
  ], { x: 540, y: 1300, t0: B("C6", 0.2), t1: B("C7", -0.1), rh: 116, th: 96 }));
  add(img("magnifier", 420, { x: 540, y: 900, t0: B("C7"), t1: B("C8", -0.1) }));
  add(chip("\u062F \u0633\u06CC\u0627\u0633\u064A \u0627\u062F\u0639\u0627\u0648\u0648 \u0627\u0639\u062A\u0628\u0627\u0631", { x: 560, y: 1320, t0: B("C7", 1.2), t1: B("C8", -0.1), cls: "soft" }));
  add(mark("q", { x: 250, y: 1320, t0: B("C7", 2.2), t1: B("C8", -0.1) }));
  add(img("mountain", 520, { x: 540, y: 820, t0: B("C8"), t1: VE + 0.2, float: 6 }));
  add(list(980, [
    { text: "\u062F \u062A\u06D0\u0631\u06D0 \u0648\u0627\u06A9\u0645\u0646\u06CD \u062F \u06A9\u0693\u0646\u0648 \u062D\u0633\u0627\u0628 \u0646\u0647 \u0634\u064A \u0648\u0631\u06A9\u0648\u0644\u0627\u06CC", t: B("C8.a", 0.2), icon: "x" },
    { text: "\u06AB\u0689 \u0633\u06CC\u0627\u0633\u064A \u062F\u0631\u06CC\u0681 \u0646\u0647 \u0644\u0631\u064A", t: B("C8.b", 0.2), icon: "x" },
    { text: "\u062F \u0628\u0647\u0631\u0646\u06CC\u0648 \u0642\u062F\u0631\u062A\u0648\u0646\u0648 \u0645\u0644\u0627\u062A\u0693 \u062A\u0647 \u0633\u062A\u0631\u06AB\u06D0 \u067E\u0647 \u0644\u0627\u0631", t: B("C8.c", 0.2), icon: "x" }
  ], { x: 540, y: 1330, t0: B("C8.a"), t1: VE + 0.2, fs: 34 }));
  add(label("\u062F \u0647\u063A\u0648 \u0685\u06D0\u0631\u0648 \u0644\u0647 \u0644\u0648\u0631\u064A \u0646\u0647 \u067C\u0627\u06A9\u0644 \u06A9\u06D0\u0696\u064A \u0686\u06D0:", { x: 540, y: 1110, t0: B("C8", 1.6), t1: VE + 0.2 }));
  return {
    kick,
    render(t) {
      for (const it of items) it.render(t);
    }
  };
}

// web/src/film.js
var FIT_W = 940;
var mctx = null;
var textW = (s, px) => {
  if (!mctx) mctx = document.createElement("canvas").getContext("2d");
  mctx.font = `900 ${px}px Quds`;
  mctx.direction = "rtl";
  return mctx.measureText(s).width;
};
function background(root) {
  const bg = h("div", "bg");
  const g1 = h("div", "glow"), g2 = h("div", "glow"), g3 = h("div", "glow");
  css(g1, { width: "1100px", height: "1100px", background: "#fffaf4", opacity: ".9" });
  css(g2, { width: "900px", height: "900px", background: "#f7a65e", opacity: ".12" });
  css(g3, { width: "1000px", height: "1000px", background: "#f3c9a0", opacity: ".14" });
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d"), d = x.createImageData(256, 256);
  let s = 12345;
  for (let i = 0; i < d.data.length; i += 4) {
    s = s * 1103515245 + 12345 & 2147483647;
    const v = 128 + (s >> 8) % 90 - 45;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  const gr = h("div", "grain");
  gr.style.backgroundImage = `url(${c.toDataURL()})`;
  const vig = h("div", "vig");
  bg.append(g1, g2, g3, vig);
  const motes = [];
  for (let k = 0; k < 26; k++) {
    const r = (n) => {
      const v = Math.sin((k * 7.13 + n) * 91.3) * 43758.5453;
      return v - Math.floor(v);
    };
    const m = h("div", "mote");
    const z = 0.35 + r(1) * 0.9, sz = 6 + z * 16;
    css(m, {
      width: sz + "px",
      height: sz + "px",
      background: r(2) > 0.55 ? "#ef7d22" : "#ffffff",
      opacity: String(r(2) > 0.55 ? 0.1 + 0.14 * z : 0.5 + 0.3 * z),
      filter: z < 0.7 ? "blur(2px)" : "none",
      boxShadow: r(2) > 0.55 ? "none" : "0 2px 6px rgba(150,100,50,.12)"
    });
    bg.appendChild(m);
    motes.push({ m, x: r(3) * 1080, y: r(4) * 1960, z, ph: r(5) * 6.28 });
  }
  bg.appendChild(gr);
  root.appendChild(bg);
  return {
    render(t, focus = 1) {
      for (const o of motes) {
        const y = ((o.y - t * 26 * o.z) % 2e3 + 2e3) % 2e3 - 40;
        o.m.style.transform = `translate(${(o.x + Math.sin(t * 0.45 + o.ph) * 36 * o.z).toFixed(1)}px, ${y.toFixed(1)}px)`;
      }
      g1.style.transform = `translate(${-300 + 90 * Math.sin(t * 0.05)}px, ${-420 + 60 * Math.cos(t * 0.04)}px)`;
      g2.style.transform = `translate(${160 + 160 * Math.sin(t * 0.07 + 1)}px, ${700 + 140 * Math.cos(t * 0.055)}px) scale(${0.9 + 0.12 * Math.sin(t * 0.09)})`;
      g3.style.transform = `translate(${-200 + 120 * Math.cos(t * 0.045)}px, ${1300 + 90 * Math.sin(t * 0.06)}px)`;
      g2.style.opacity = (0.1 + 0.03 * focus).toFixed(3);
    }
  };
}
function headlines(root, beats, Y = 400, END = 1e9) {
  const list2 = [];
  const withHead = beats.filter((b) => b.head);
  withHead.forEach((b, i) => {
    const lines = b.head.split("/").map((s) => s.trim());
    const plain = lines.map((l) => l.replace(/[{}]/g, ""));
    let px = lines.length > 1 ? 86 : 96;
    while (Math.max(...plain.map((l) => textW(l, px))) > FIT_W && px > 50) px -= 2;
    const el = h("div", "hl");
    css(el, { fontSize: px + "px" });
    const words = [];
    const toks = lines.map((l) => {
      const out = [];
      for (const p of l.split(/(\{[^}]+\})/).filter(Boolean)) {
        const acc = p.startsWith("{");
        for (const w of p.replace(/[{}]/g, "").split(" ").filter(Boolean)) out.push([w, acc]);
      }
      return out;
    });
    if (lines.length > 1) {
      const ws = plain.map((l) => measure(l, px, 900));
      const ratio = Math.min(...ws) / Math.max(...ws);
      if (ratio >= 0.7 && ratio < 0.97) {
        const J = justify(plain, px, 900);
        J.forEach((jl, li) => {
          const jw = jl.split(" ");
          if (jw.length === toks[li].length) toks[li].forEach((tk, k) => {
            tk[0] = jw[k];
          });
        });
      }
    }
    for (const lt of toks) {
      const ln = h("span", "ln");
      lt.forEach(([w, acc], k) => {
        const sp = h("span", "w" + (acc ? " a" : ""), w + (k < lt.length - 1 ? " " : ""));
        ln.appendChild(sp);
        words.push(sp);
      });
      el.appendChild(ln);
    }
    root.appendChild(el);
    const next = withHead[i + 1];
    const t1 = next ? next.t : END;
    list2.push({ b, el, words, t0: b.t, t1, n: lines.length, px });
    cue("head", b.t);
  });
  return {
    render(t) {
      for (const x of list2) {
        const on = t >= x.t0 - 0.3 && t < x.t1 + 0.5;
        x.el.style.display = on ? "" : "none";
        if (!on) continue;
        const hgt = x.n * x.px * 1.32;
        const ko = E.in(prog(t, x.t1 - 0.2, x.t1 + 0.2));
        x.el.style.transform = `translateY(${(Y - hgt / 2 - ko * 50).toFixed(1)}px)`;
        x.el.style.opacity = (1 - ko).toFixed(3);
        x.el.style.filter = ko > 0.01 ? `blur(${(ko * 10).toFixed(1)}px)` : "none";
        x.words.forEach((w, k) => {
          const a = E.out(prog(t, x.t0 + 0.02 + k * 0.055, x.t0 + 0.52 + k * 0.055));
          w.style.opacity = a.toFixed(3);
          w.style.transform = `translateY(${((1 - a) * 34).toFixed(1)}px)`;
          w.style.filter = a < 0.99 ? `blur(${((1 - a) * 10).toFixed(1)}px)` : "none";
        });
      }
    }
  };
}
function kicker(root, spans, Y = 232) {
  const els = spans.map((s) => {
    const e = h("div", "kick", `<span class="n">${PS_DIGITS(s.n, 1)}</span><b></b>${s.name}`);
    e.style.top = Y + "px";
    root.appendChild(e);
    return { s, e };
  });
  return {
    render(t) {
      for (const { s, e } of els) {
        const k = E.out(prog(t, s.t0, s.t0 + 0.6)) * (1 - E.in(prog(t, s.t1 - 0.3, s.t1 + 0.1)));
        e.style.display = k > 1e-3 ? "" : "none";
        e.style.opacity = k.toFixed(3);
        e.style.transform = `translateY(${((1 - k) * 14).toFixed(1)}px)`;
      }
    }
  };
}
function brand(root, LEAD2, VE, END) {
  const wrap = h("div", "mark");
  const dot = h("div", "mark");
  css(dot, { width: "120px", height: "120px", borderRadius: "50%", background: "linear-gradient(135deg,#ffb21a,#ff8a00)", boxShadow: "0 20px 40px rgba(240,120,0,.35)" });
  const full = h("div", "mark");
  const LW = 760, LH = LW * 559 / 1699;
  css(full, { width: LW + "px", height: LH + "px" });
  const word = h("img", "mark");
  word.src = "assets/brand/logo_word.png";
  const markI = h("img", "mark");
  markI.src = "assets/brand/logo_mark.png";
  const MW = LH * 361 / 559, WW = LH * 1338 / 559;
  css(word, { height: LH + "px", width: WW + "px", left: "0px" });
  css(markI, { height: LH + "px", width: MW + "px", left: LW - MW + "px" });
  full.append(word, markI);
  const line = h("div", "mark");
  css(line, { height: "6px", borderRadius: "3px", background: "var(--acc)", width: "220px" });
  wrap.append(full, line, dot);
  root.appendChild(wrap);
  cue("intro", 0);
  cue("outro", VE + 0.3);
  const WM = { y: 1812, h: 58 };
  return {
    render(t) {
      const kIn = E.io(prog(t, LEAD2 - 1, LEAD2 - 0.15));
      const kOut = E.io(prog(t, VE + 0.35, VE + 1.4));
      const big = 1 - kIn + kOut;
      const sBig = 1, sSmall = WM.h / LH;
      const s = lerp(sSmall, sBig, big);
      const cy = lerp(WM.y, 900, big);
      css(full, { transform: `translate(${(540 - LW / 2).toFixed(1)}px, ${(cy - LH / 2).toFixed(1)}px) scale(${s.toFixed(4)})`, transformOrigin: "50% 50%" });
      const dropK = prog(t, 0.1, 0.75);
      const dy = t < 0.75 ? lerp(-160, 900, E.in(dropK)) : 900 - 60 * Math.abs(Math.sin((t - 0.75) * 6)) * Math.exp(-(t - 0.75) * 7);
      const swell = E.io(prog(t, 0.95, 1.4));
      const dotOn = t < 1.45;
      const mx = 540 - LW / 2 + (LW - MW / 2), my = 900 + LH * 0.22;
      const dx = lerp(540, mx, swell), dyy = lerp(dy, my, swell);
      const ds = lerp(1, 1.5, swell);
      css(dot, {
        display: dotOn ? "" : "none",
        transform: `translate(${(dx - 60).toFixed(1)}px, ${(dyy - 60).toFixed(1)}px) scale(${ds.toFixed(3)})`,
        opacity: (1 - E.io(prog(t, 1.2, 1.45))).toFixed(3)
      });
      const markK = E.out(prog(t, 1.15, 1.6));
      markI.style.opacity = (t < LEAD2 ? markK : 1).toFixed(3);
      markI.style.transform = `scale(${(t < LEAD2 ? 0.7 + 0.3 * spring(prog(t, 1.15, 1.9) * 1.5, 8, 0.6) : 1).toFixed(3)})`;
      markI.style.transformOrigin = "50% 70%";
      const wk = E.io(prog(t, 1.45, 2.25));
      word.style.clipPath = t < LEAD2 ? `inset(0 0 0 ${((1 - wk) * 100).toFixed(1)}%)` : "none";
      word.style.opacity = t < LEAD2 ? clamp(wk * 3).toFixed(3) : "1";
      const lk = E.out(prog(t, 1.9, 2.5)) * (1 - kIn) + E.out(prog(t, VE + 1.2, VE + 1.9)) * kOut;
      css(line, { transform: `translate(${(540 - 110).toFixed(1)}px, ${(900 + LH / 2 + 46).toFixed(1)}px) scaleX(${lk.toFixed(3)})`, opacity: lk.toFixed(3) });
      const fin = 1 - E.io(prog(t, END - 0.5, END));
      full.style.opacity = (t < LEAD2 ? 1 : lerp(0.92, 1, big) * fin).toFixed(3);
      wrap.style.opacity = "1";
    }
  };
}

// web/src/main.js
var LEAD = 3.4;
var OUTRO = 5.2;
var SIM = window.SIM = { ready: false, error: null };
(async () => {
  try {
    const TL = await (await fetch("assets/timeline.json")).json();
    for (const b of TL.beats) {
      b.t += LEAD;
      b.t1 += LEAD;
    }
    const VE = TL.duration + LEAD, END = VE + OUTRO;
    await loadMap();
    await Promise.all(["900 80px Quds", "800 40px Quds", "700 40px Quds"].map((f) => document.fonts.load(f)));
    const root = document.getElementById("app");
    const bg = background(root);
    const stage = document.createElement("div");
    stage.className = "abs";
    root.appendChild(stage);
    const beats = TL.beats;
    beats[beats.length - 1].end = VE + 0.2;
    const S = buildScenes(stage, beats, LEAD, VE);
    const hl = headlines(root, beats, 400, VE + 0.2);
    const kk = kicker(root, S.kick);
    const br = brand(root, LEAD, VE, END);
    for (const im of document.images) {
      im.decoding = "sync";
      im.loading = "eager";
    }
    await Promise.all([...document.images].map((im) => im.complete ? im.decode().catch(() => {
    }) : new Promise((r) => {
      im.onload = im.onerror = r;
    })));
    stage.style.transformOrigin = "540px 1080px";
    const render = (t) => {
      bg.render(t);
      const cs = 1 + 0.014 * Math.sin(t * 0.21) + 8e-3 * Math.sin(t * 0.137 + 1.3);
      stage.style.transform = `translate(${(9 * Math.sin(t * 0.17)).toFixed(2)}px, ${(11 * Math.sin(t * 0.113 + 2)).toFixed(2)}px) scale(${cs.toFixed(4)}) rotate(${(0.25 * Math.sin(t * 0.09)).toFixed(3)}deg)`;
      S.render(t);
      hl.render(t);
      kk.render(t);
      br.render(t);
    };
    SIM.duration = END;
    SIM.render = render;
    SIM.cues = () => ({ cues: CUES, lead: LEAD, ve: VE, duration: END, sections: S.kick.map((k) => k.t0) });
    const q = new URLSearchParams(location.search);
    render(Number(q.get("t") || 0));
    SIM.ready = true;
    if (!q.has("capture") && q.has("play")) {
      const t0 = performance.now() / 1e3 - Number(q.get("t") || 0);
      const loop = () => {
        render(performance.now() / 1e3 - t0);
        requestAnimationFrame(loop);
      };
      loop();
    }
  } catch (e) {
    SIM.error = String(e && e.stack || e);
    console.error(e);
    SIM.ready = true;
  }
})();
export {
  LEAD,
  OUTRO
};
