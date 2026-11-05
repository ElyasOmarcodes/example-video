/* Hand-coded line-art icon library (viewBox 0 0 400 400).
   Classes: k = ink stroke, a = accent stroke, m = muted stroke, cr = conflict stroke,
            fa = soft accent fill, fk = soft ink fill, fs = solid accent fill, fc = solid conflict fill.
   Animation hooks are data attributes read by the engine in index.html:
     data-a="pop|float|spin|move|crack|tilt|blink|pulse|march|rain|fade|grow"
     data-t = fraction of the spoken span when the event fires, data-x/y/r/s/o = params. */
(function () {
  const f = (n) => Math.round(n * 10) / 10;
  const P = (d, c = "k", ex = "") => `<path class="${c}" d="${d}" ${ex}/>`;
  const C = (x, y, r, c = "k", ex = "") => `<circle class="${c}" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" ${ex}/>`;
  const E = (x, y, rx, ry, c = "k", ex = "") => `<ellipse class="${c}" cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" ${ex}/>`;
  const R = (x, y, w, h, rr, c = "k", ex = "") => `<rect class="${c}" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(rr)}" ${ex}/>`;
  const L = (x1, y1, x2, y2, c = "k", ex = "") => `<line class="${c}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${ex}/>`;
  const G = (inner, a, ex = "") => `<g${a ? ` data-a="${a}"` : ""} ${ex}>${inner}</g>`;

  // ---------- primitives ----------
  function person(x, y, s, c = "k", fill = "fk") {
    const body = `M${f(x - 40 * s)} ${f(y + 56 * s)} L${f(x - 40 * s)} ${f(y + 30 * s)} Q${f(x - 40 * s)} ${f(y - 8 * s)} ${f(x)} ${f(y - 8 * s)} Q${f(x + 40 * s)} ${f(y - 8 * s)} ${f(x + 40 * s)} ${f(y + 30 * s)} L${f(x + 40 * s)} ${f(y + 56 * s)}`;
    return (fill ? P(body + " Z", fill, "data-nodraw") + C(x, y - 40 * s, 22 * s, fill, "data-nodraw") : "") + P(body, c) + C(x, y - 40 * s, 22 * s, c);
  }
  function crown(x, y, w, c = "a", fill = "fa") {
    const h = w * 0.62, l = x - w / 2, r = x + w / 2, b = y + h / 2, t = y - h / 2;
    const d = `M${f(l)} ${f(b)} L${f(l - w * 0.04)} ${f(t + h * 0.18)} L${f(x - w * 0.24)} ${f(y + h * 0.02)} L${f(x)} ${f(t)} L${f(x + w * 0.24)} ${f(y + h * 0.02)} L${f(r + w * 0.04)} ${f(t + h * 0.18)} L${f(r)} ${f(b)} Z`;
    return P(d, fill, "data-nodraw") + P(d, c) + L(l + 6, b - h * 0.16, r - 6, b - h * 0.16, c) + C(x, t - 4, w * 0.05, c) + C(l - w * 0.04, t + h * 0.12, w * 0.04, c) + C(r + w * 0.04, t + h * 0.12, w * 0.04, c) + C(x, y + h * 0.18, w * 0.06, "fs", "data-nodraw");
  }
  function coin(x, y, r, c = "a") {
    return C(x, y, r, "fa", "data-nodraw") + C(x, y, r, c) + C(x, y, r * 0.7, c) + P(`M${f(x)} ${f(y - r * 0.38)} L${f(x + r * 0.3)} ${f(y)} L${f(x)} ${f(y + r * 0.38)} L${f(x - r * 0.3)} ${f(y)} Z`, c);
  }
  function coinStack(x, y, r, n, c = "a") {
    let o = "";
    for (let i = 0; i < n; i++) {
      const yy = y - i * r * 0.32;
      o += P(`M${f(x - r)} ${f(yy)} L${f(x - r)} ${f(yy + r * 0.22)} A${f(r)} ${f(r * 0.34)} 0 0 0 ${f(x + r)} ${f(yy + r * 0.22)} L${f(x + r)} ${f(yy)}`, c) ;
    }
    const top = y - (n - 1) * r * 0.32;
    return E(x, top, r, r * 0.34, "fa", "data-nodraw") + o + E(x, top, r, r * 0.34, c);
  }
  function gear(x, y, r, n, c = "k", fill = "fk") {
    const pts = [];
    for (let i = 0; i < n * 4; i++) {
      const ang = (i / (n * 4)) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 4 === 0 || i % 4 === 1 ? r : r * 0.8;
      pts.push(`${f(x + Math.cos(ang) * rr)} ${f(y + Math.sin(ang) * rr)}`);
    }
    const d = "M" + pts.join(" L") + " Z";
    return (fill ? P(d, fill, "data-nodraw") : "") + P(d, c) + C(x, y, r * 0.34, c) + C(x, y, r * 0.1, "fs", "data-nodraw");
  }
  function globe(x, y, r, c = "k") {
    return C(x, y, r, "fa", "data-nodraw") + C(x, y, r, c) + E(x, y, r * 0.42, r, c, 'data-a="meridian"') + L(x, y - r, x, y + r, c) + P(`M${f(x - r * 0.93)} ${f(y - r * 0.38)} Q${f(x)} ${f(y - r * 0.5)} ${f(x + r * 0.93)} ${f(y - r * 0.38)}`, c) + P(`M${f(x - r * 0.93)} ${f(y + r * 0.38)} Q${f(x)} ${f(y + r * 0.26)} ${f(x + r * 0.93)} ${f(y + r * 0.38)}`, c) + L(x - r, y, x + r, y, c);
  }
  function bubble(x, y, w, h, tail, c = "k", fill = "fk") {
    const l = x - w / 2, t = y - h / 2, r = 26;
    const tx = tail > 0 ? x + w * 0.22 : x - w * 0.22;
    const d = `M${f(l + r)} ${f(t)} H${f(l + w - r)} Q${f(l + w)} ${f(t)} ${f(l + w)} ${f(t + r)} V${f(t + h - r)} Q${f(l + w)} ${f(t + h)} ${f(l + w - r)} ${f(t + h)} H${f(tx + 14)} L${f(tx + tail * 30)} ${f(t + h + 34)} L${f(tx - 14)} ${f(t + h)} H${f(l + r)} Q${f(l)} ${f(t + h)} ${f(l)} ${f(t + h - r)} V${f(t + r)} Q${f(l)} ${f(t)} ${f(l + r)} ${f(t)} Z`;
    return (fill ? P(d, fill, "data-nodraw") : "") + P(d, c);
  }
  function arrow(x1, y1, x2, y2, c = "a", hs = 22) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h1 = `${f(x2 - Math.cos(a - 0.5) * hs)} ${f(y2 - Math.sin(a - 0.5) * hs)}`;
    const h2 = `${f(x2 - Math.cos(a + 0.5) * hs)} ${f(y2 - Math.sin(a + 0.5) * hs)}`;
    return L(x1, y1, x2, y2, c) + P(`M${h1} L${f(x2)} ${f(y2)} L${h2}`, c);
  }
  function crackLine(pts, c = "cr") {
    return P("M" + pts.map((p) => `${p[0]} ${p[1]}`).join(" L"), c);
  }
  function doc(x, y, w, h, rows, c = "k") {
    const l = x - w / 2, t = y - h / 2;
    let o = R(l, t, w, h, 16, "fk", "data-nodraw") + P(`M${f(l + 16)} ${f(t)} H${f(l + w - 34)} L${f(l + w)} ${f(t + 34)} V${f(t + h - 16)} Q${f(l + w)} ${f(t + h)} ${f(l + w - 16)} ${f(t + h)} H${f(l + 16)} Q${f(l)} ${f(t + h)} ${f(l)} ${f(t + h - 16)} V${f(t + 16)} Q${f(l)} ${f(t)} ${f(l + 16)} ${f(t)} Z`, c) + P(`M${f(l + w - 34)} ${f(t)} V${f(t + 34)} H${f(l + w)}`, c);
    for (let i = 0; i < rows; i++) {
      const yy = t + 56 + i * ((h - 80) / Math.max(1, rows - 1 || 1));
      o += L(l + 24, yy, l + w - 28 - (i % 2) * w * 0.22, yy, i === 0 ? "a" : "m");
    }
    return o;
  }
  function star(x, y, r, c = "a", fill = "fa") {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
      pts.push(`${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`);
    }
    const d = "M" + pts.join(" L") + " Z";
    return (fill ? P(d, fill, "data-nodraw") : "") + P(d, c);
  }
  function bolt(x, y, s, c = "cr") {
    const d = `M${f(x + 8 * s)} ${f(y - 40 * s)} L${f(x - 16 * s)} ${f(y + 4 * s)} L${f(x + 4 * s)} ${f(y + 4 * s)} L${f(x - 8 * s)} ${f(y + 40 * s)} L${f(x + 18 * s)} ${f(y - 8 * s)} L${f(x - 2 * s)} ${f(y - 8 * s)} Z`;
    return P(d, "fc", "data-nodraw") + P(d, c);
  }
  function qmark(x, y, s, c = "a") {
    return P(`M${f(x - 18 * s)} ${f(y - 22 * s)} Q${f(x - 18 * s)} ${f(y - 46 * s)} ${f(x)} ${f(y - 46 * s)} Q${f(x + 20 * s)} ${f(y - 46 * s)} ${f(x + 20 * s)} ${f(y - 26 * s)} Q${f(x + 20 * s)} ${f(y - 12 * s)} ${f(x)} ${f(y - 2 * s)} L${f(x)} ${f(y + 12 * s)}`, c) + C(x, y + 32 * s, 4 * s, "fs", "data-nodraw");
  }
  function lock(x, y, s, c = "a") {
    return R(x - 34 * s, y - 6 * s, 68 * s, 56 * s, 10 * s, "fa", "data-nodraw") + R(x - 34 * s, y - 6 * s, 68 * s, 56 * s, 10 * s, c) + P(`M${f(x - 20 * s)} ${f(y - 6 * s)} V${f(y - 26 * s)} A${f(20 * s)} ${f(20 * s)} 0 0 1 ${f(x + 20 * s)} ${f(y - 26 * s)} V${f(y - 6 * s)}`, c) + C(x, y + 18 * s, 6 * s, c) + L(x, y + 24 * s, x, y + 34 * s, c);
  }
  function magnifier(x, y, r, c = "k") {
    return C(x, y, r, "fk", "data-nodraw") + C(x, y, r, c) + P(`M${f(x - r * 0.5)} ${f(y - r * 0.2)} Q${f(x - r * 0.45)} ${f(y - r * 0.5)} ${f(x - r * 0.15)} ${f(y - r * 0.55)}`, "m") + L(x + r * 0.72, y + r * 0.72, x + r * 1.5, y + r * 1.5, c, 'style="stroke-width:16px"');
  }
  function pillarHall(x, y, w, h, c = "k") {
    const l = x - w / 2, t = y - h / 2, b = y + h / 2;
    let o = P(`M${f(l - 10)} ${f(t + h * 0.22)} L${f(x)} ${f(t)} L${f(l + w + 10)} ${f(t + h * 0.22)} Z`, "fa", "data-nodraw") + P(`M${f(l - 10)} ${f(t + h * 0.22)} L${f(x)} ${f(t)} L${f(l + w + 10)} ${f(t + h * 0.22)} Z`, "a");
    o += L(l, t + h * 0.3, l + w, t + h * 0.3, c);
    o += R(l - 16, b - 18, w + 32, 18, 6, "fk", "data-nodraw") + R(l - 16, b - 18, w + 32, 18, 6, c);
    return o;
  }
  function column(x, top, bot, w, c = "k") {
    return R(x - w / 2, top, w, bot - top, 6, "fk", "data-nodraw") + R(x - w / 2, top, w, bot - top, 6, c) + L(x - w * 0.15, top + 14, x - w * 0.15, bot - 14, "m") + L(x + w * 0.15, top + 14, x + w * 0.15, bot - 14, "m");
  }
  function flagPole(x, y, h, c = "k") {
    return L(x, y, x, y - h, c) + C(x, y - h - 8, 8, c);
  }
  function megaphone(x, y, s, c = "a") {
    const d = `M${f(x - 50 * s)} ${f(y - 18 * s)} L${f(x + 30 * s)} ${f(y - 52 * s)} L${f(x + 30 * s)} ${f(y + 52 * s)} L${f(x - 50 * s)} ${f(y + 18 * s)} Z`;
    return P(d, "fa", "data-nodraw") + P(d, c) + R(x - 74 * s, y - 20 * s, 24 * s, 40 * s, 6 * s, c) + P(`M${f(x - 56 * s)} ${f(y + 20 * s)} L${f(x - 44 * s)} ${f(y + 60 * s)} L${f(x - 26 * s)} ${f(y + 60 * s)} L${f(x - 34 * s)} ${f(y + 26 * s)}`, c);
  }
  function waves(x, y, s, c = "a", n = 3) {
    let o = "";
    for (let i = 0; i < n; i++) o += P(`M${f(x + (i * 24) * s)} ${f(y - (24 + i * 16) * s)} Q${f(x + (22 + i * 30) * s)} ${f(y)} ${f(x + (i * 24) * s)} ${f(y + (24 + i * 16) * s)}`, c);
    return o;
  }
  function hand(x, y, dir, s, c = "k") {
    // simple forearm + mitten, dir 1 = pointing right, -1 = pointing left
    const d = `M${f(x - dir * 120 * s)} ${f(y - 24 * s)} L${f(x - dir * 20 * s)} ${f(y - 24 * s)} Q${f(x + dir * 24 * s)} ${f(y - 30 * s)} ${f(x + dir * 30 * s)} ${f(y)} Q${f(x + dir * 24 * s)} ${f(y + 30 * s)} ${f(x - dir * 20 * s)} ${f(y + 24 * s)} L${f(x - dir * 120 * s)} ${f(y + 24 * s)}`;
    return P(d + " Z", "fk", "data-nodraw") + P(d, c) + L(x - dir * 14 * s, y - 8 * s, x + dir * 14 * s, y - 8 * s, "m") + L(x - dir * 14 * s, y + 8 * s, x + dir * 14 * s, y + 8 * s, "m");
  }
  function cloud(x, y, s, c = "k") {
    const d = `M${f(x - 80 * s)} ${f(y + 30 * s)} Q${f(x - 110 * s)} ${f(y + 30 * s)} ${f(x - 108 * s)} ${f(y)} Q${f(x - 104 * s)} ${f(y - 30 * s)} ${f(x - 70 * s)} ${f(y - 26 * s)} Q${f(x - 60 * s)} ${f(y - 70 * s)} ${f(x - 10 * s)} ${f(y - 64 * s)} Q${f(x + 30 * s)} ${f(y - 80 * s)} ${f(x + 54 * s)} ${f(y - 40 * s)} Q${f(x + 104 * s)} ${f(y - 44 * s)} ${f(x + 106 * s)} ${f(y)} Q${f(x + 108 * s)} ${f(y + 30 * s)} ${f(x + 76 * s)} ${f(y + 30 * s)} Z`;
    return P(d, "fk", "data-nodraw") + P(d, c);
  }
  function node(x, y, r, c = "a") { return C(x, y, r, "fa", "data-nodraw") + C(x, y, r, c); }
  function domino(x, y, w, h, c = "k") {
    return R(x - w / 2, y - h, w, h, 10, "fk", "data-nodraw") + R(x - w / 2, y - h, w, h, 10, c) + L(x - w / 2 + 8, y - h / 2, x + w / 2 - 8, y - h / 2, "m") + C(x, y - h * 0.75, 5, "fs", "data-nodraw") + C(x, y - h * 0.25, 5, "fs", "data-nodraw");
  }
  function chainLink(x, y, rot, c = "k") {
    return `<g transform="rotate(${rot} ${x} ${y})">` + R(x - 38, y - 18, 76, 36, 18, c) + `</g>`;
  }
  function chart(x, y, w, h, vals, c = "a") {
    let o = L(x - w / 2, y + h / 2, x + w / 2, y + h / 2, "k") + L(x - w / 2, y - h / 2, x - w / 2, y + h / 2, "k");
    const bw = w / (vals.length * 1.6);
    vals.forEach((v, i) => {
      const bx = x - w / 2 + 24 + i * bw * 1.6, bh = h * v;
      o += G(R(bx, y + h / 2 - bh, bw, bh, 6, "fa", "data-nodraw") + R(bx, y + h / 2 - bh, bw, bh, 6, c), "grow", `data-t="${(0.05 + i * 0.12).toFixed(2)}"`);
    });
    return o;
  }

  // ---------- icons ----------
  const I = {};
  // ===== Part 1: causes =====
  I.p1_1 = () =>
    G(crown(200, 92, 130), "pop float", 'data-t="0.02" data-y="6"') +
    G(person(200, 222, 1.25, "a", "fa"), "") +
    P("M70 316 Q200 250 330 316", "cr", 'data-a="crack" data-t="0.45"') +
    G(person(78, 330, 0.62, "m", "") + person(150, 350, 0.62, "m", "") + person(250, 350, 0.62, "m", "") + person(322, 330, 0.62, "m", ""), "fade", 'data-t="0.5" data-o="0.35"') +
    G(lock(200, 330, 0.62), "pop", 'data-t="0.55"');
  I.p1_2 = () =>
    G(
      P("M150 150 Q200 132 250 150 L282 290 Q200 330 118 290 Z", "fa", "data-nodraw") + P("M150 150 Q200 132 250 150 L282 290 Q200 330 118 290 Z", "a") + P("M160 150 L140 110 Q200 92 260 110 L240 150", "a") + L(150, 152, 250, 152, "k") + C(200, 228, 34, "k") + P("M200 206 V250 M188 216 Q200 208 212 216 M188 240 Q200 248 212 240", "k"),
      "tilt", 'data-r="6" data-o="200 300"'
    ) +
    G(arrow(110, 230, 26, 230, "cr"), "pop", 'data-t="0.15"') +
    G(arrow(290, 230, 374, 230, "cr"), "pop", 'data-t="0.15"') +
    G(coinStack(64, 340, 40, 3), "pop", 'data-t="0.35"') +
    G(coinStack(336, 340, 40, 4), "pop", 'data-t="0.45"') +
    G(coin(84, 120, 26), "pop float", 'data-t="0.6"') +
    G(coin(318, 104, 22), "pop float", 'data-t="0.7"');
  I.p1_3 = () =>
    G(person(150, 250, 1.2, "k", "fk"), "") +
    G(P("M262 110 L322 110 L346 140 L292 210 L238 140 Z", "fa", "data-nodraw") + P("M262 110 L322 110 L346 140 L292 210 L238 140 Z", "a") + P("M238 140 H346 M262 110 L280 140 L292 210 L304 140 L322 110", "a"), "pop pulse", 'data-t="0.05" data-s="1.08"') +
    G(L(292, 80, 292, 60, "a") + L(354, 104, 370, 92, "a") + L(230, 104, 214, 92, "a"), "blink", 'data-t="0.2"') +
    G(arrow(232, 196, 196, 214, "a", 16), "pop", 'data-t="0.3"') +
    G(person(300, 320, 0.5, "m", "") + person(352, 320, 0.5, "m", "") + person(248, 320, 0.5, "m", ""), "fade", 'data-t="0.55" data-o="0.3"') +
    G(L(232, 300, 372, 360, "cr") + L(372, 300, 232, 360, "cr"), "pop", 'data-t="0.6"');
  I.p1_4 = () =>
    G(globe(200, 205, 100), "") +
    G(L(200, 205, 66, 76, "a", 'data-nodraw') + L(200, 205, 340, 84, "a", "data-nodraw") + L(200, 205, 336, 336, "a", "data-nodraw") + L(200, 205, 56, 330, "a", "data-nodraw"), "march") +
    G(node(66, 76, 26) + person(66, 82, 0.34, "k", ""), "pop", 'data-t="0.05"') +
    G(node(340, 84, 26) + person(340, 90, 0.34, "k", ""), "pop", 'data-t="0.15"') +
    G(node(336, 336, 26) + person(336, 342, 0.34, "k", ""), "pop", 'data-t="0.25"') +
    G(node(56, 330, 26) + person(56, 336, 0.34, "k", ""), "pop", 'data-t="0.35"') +
    G(bolt(270, 270, 0.7), "pop", 'data-t="0.6"') +
    G(bolt(126, 128, 0.6), "pop", 'data-t="0.7"');
  I.p1_5 = () =>
    G(node(200, 340, 22, "k"), "") +
    G(P("M200 318 C200 250 120 230 84 150", "k") + P("M64 168 L84 150 L96 176", "k"), "", "") +
    G(P("M200 318 L200 140", "a") + P("M184 162 L200 140 L216 162", "a"), "") +
    G(P("M200 318 C200 250 280 230 316 150", "k") + P("M304 176 L316 150 L336 168", "k"), "") +
    G(C(200, 80, 44, "m") + C(200, 80, 26, "m") + C(200, 80, 8, "fs", "data-nodraw"), "fade", 'data-t="0.4" data-o="0.35"') +
    G(L(160, 40, 240, 120, "cr") + L(240, 40, 160, 120, "cr"), "pop", 'data-t="0.5"') +
    G(qmark(70, 100, 0.7) + qmark(330, 100, 0.7), "pop float", 'data-t="0.7"');
  I.p1_6 = () =>
    G(person(200, 92, 0.6, "a", "fa") + crown(200, 26, 44), "pop", 'data-t="0"') +
    P("M200 130 V154 M110 154 H290 M110 154 V176 M200 154 V176 M290 154 V176", "k") +
    G(person(110, 210, 0.46, "k", "fk"), "pop", 'data-t="0.1"') +
    G(person(200, 210, 0.46, "k", "fk"), "pop", 'data-t="0.15"') +
    G(person(290, 210, 0.46, "k", "fk"), "pop", 'data-t="0.2"') +
    P("M110 240 L170 300 M200 240 L200 290 M290 240 L230 300", "a") +
    G(gear(200, 330, 58, 9, "a", "fa"), "spin", 'data-r="180"') +
    G(gear(92, 340, 30, 7, "m", ""), "spin", 'data-r="-260"') +
    G(gear(308, 340, 30, 7, "m", ""), "spin", 'data-r="-260"');
  I.p1_7 = () =>
    G(person(96, 250, 1.0, "k", "fk"), "move", 'data-t="0.4" data-x="-14"') +
    G(person(304, 250, 1.0, "k", "fk"), "move", 'data-t="0.4" data-x="14"') +
    G(bubble(110, 104, 110, 90, 1, "a", "fa") + qmark(110, 112, 0.7), "pop", 'data-t="0.05"') +
    G(bubble(290, 104, 110, 90, -1, "a", "fa") + qmark(290, 112, 0.7), "pop", 'data-t="0.15"') +
    G(E(200, 200, 44, 24, "k") + C(200, 200, 12, "fs", "data-nodraw") + P("M150 200 Q200 150 250 200 Q200 250 150 200", "k"), "blink", 'data-t="0.3"') +
    crackLine([[200, 250], [186, 280], [212, 300], [192, 330], [206, 360]]).replace("<path", '<path data-a="crack" data-t="0.55"');
  I.p1_8 = () =>
    G(P("M150 120 H250 V250 H150 Z", "fa", "data-nodraw") + P("M150 250 V110 Q150 92 168 92 H232 Q250 92 250 110 V250", "a") + R(132, 190, 136, 40, 10, "a") + L(150, 230, 150, 300, "a") + L(250, 230, 250, 300, "a"), "") +
    G(star(200, 50, 28), "pop pulse", 'data-t="0.05" data-s="1.15"') +
    G(person(64, 300, 0.7, "k", "fk") + arrow(96, 250, 134, 214, "cr", 16), "move", 'data-t="0.3" data-x="14" data-y="-6"') +
    G(person(336, 300, 0.7, "k", "fk") + arrow(304, 250, 266, 214, "cr", 16), "move", 'data-t="0.3" data-x="-14" data-y="-6"') +
    G(bolt(200, 330, 0.8), "pop", 'data-t="0.55"');
  I.p1_9 = () =>
    G(bubble(120, 140, 170, 120, 1, "k", "fk") + L(80, 126, 160, 126, "m") + L(80, 152, 140, 152, "m") + P("M86 100 L98 112 L120 90", "a"), "move", 'data-t="0.2" data-x="18"') +
    G(bubble(280, 140, 170, 120, -1, "k", "fk") + L(240, 126, 320, 126, "m") + L(260, 152, 320, 152, "m") + L(296, 92, 316, 112, "cr") + L(316, 92, 296, 112, "cr"), "move", 'data-t="0.2" data-x="-18"') +
    G(bolt(200, 150, 0.9), "pop", 'data-t="0.45"') +
    G(doc(200, 300, 150, 140, 3), "") +
    G(R(150, 320, 40, 30, 6, "fs", "data-nodraw"), "pop", 'data-t="0.65"') +
    G(R(210, 320, 40, 30, 6, "fc", "data-nodraw"), "pop", 'data-t="0.75"');
  I.p1_10 = () =>
    G(doc(170, 210, 210, 260, 6), "") +
    G(R(90, 270, 150, 44, 10, "fk", "data-nodraw"), "blink", 'data-t="0.3"') +
    G(coinStack(328, 330, 34, 3), "pop", 'data-t="0.1"') +
    G(magnifier(250, 170, 56), "move", 'data-t="0.25" data-x="-90" data-y="80" data-d="1.6"') +
    G(qmark(330, 120, 0.9), "pop float", 'data-t="0.5"') +
    G(qmark(60, 90, 0.6), "pop float", 'data-t="0.65"');
  I.p1_11 = () =>
    P("M200 80 V330 M140 340 H260", "k") + C(200, 70, 12, "a") +
    G(L(70, 120, 330, 120, "k", 'style="stroke-width:10px"') + P("M70 120 L38 210 M70 120 L102 210 M38 210 Q70 240 102 210 Z", "a") + P("M330 120 L298 210 M330 120 L362 210 M298 210 Q330 240 362 210 Z", "a") + R(46, 168, 48, 36, 6, "fs", "data-nodraw") + R(54, 140, 32, 28, 6, "fs", "data-nodraw") + star(330, 198, 14), "tilt1", 'data-r="-14" data-o="200 120" data-t="0.2"') +
    G(person(110, 330, 0.5, "m", "") + person(290, 330, 0.5, "m", ""), "") +
    G(P("M150 380 L250 380", "cr") + P("M180 370 L220 390 M220 370 L180 390", "cr"), "pop", 'data-t="0.6"');
  I.p1_12 = () =>
    G(R(110, 210, 180, 30, 8, "fk", "data-nodraw") + R(110, 210, 180, 30, 8, "k") + R(80, 240, 240, 26, 8, "k"), "") +
    G(R(176, 60, 120, 60, 12, "fa", "data-nodraw") + R(176, 60, 120, 60, 12, "a") + L(236, 120, 236, 200, "a", 'style="stroke-width:14px"'), "strike", 'data-o="236 200" data-r="-24"') +
    G(person(60, 330, 0.55, "m", "") + person(130, 350, 0.55, "m", "") + person(270, 350, 0.55, "m", "") + person(340, 330, 0.55, "m", ""), "fade", 'data-t="0.4" data-o="0.35"') +
    G(L(30, 296, 370, 296, "cr", 'style="stroke-dasharray:18 14"'), "pop", 'data-t="0.45"') +
    G(lock(200, 330, 0.7), "pop", 'data-t="0.55"');
  I.p1_13 = () =>
    G(P("M160 40 H240 V80 Q240 126 200 130 Q160 126 160 80 Z", "fa", "data-nodraw") + P("M160 40 H240 V80 Q240 126 200 130 Q160 126 160 80 Z M160 56 H136 Q134 96 168 100 M240 56 H264 Q266 96 232 100 M200 130 V154 M172 160 H228", "a") + star(200, 76, 16, "k", ""), "pop float", 'data-t="0"') +
    G(L(20, 250, 380, 250, "k", 'style="stroke-width:9px"') + C(200, 250, 10, "fc", "data-nodraw") + person(60, 270, 0.6, "k", "fk") + person(120, 280, 0.6, "k", "fk") + person(280, 280, 0.6, "k", "fk") + person(340, 270, 0.6, "k", "fk"), "tug", 'data-x="18"') +
    L(200, 200, 200, 300, "m", 'style="stroke-dasharray:10 12"') +
    G(globe(64, 120, 34) , "pop", 'data-t="0.3"') + G(globe(336, 120, 34), "pop", 'data-t="0.4"');
  I.p1_14 = () =>
    G(gear(150, 180, 92, 10), "spinstop", 'data-r="60" data-t="0.4"') +
    G(gear(272, 278, 66, 8, "a", "fa"), "spinstop", 'data-r="-84" data-t="0.4"') +
    crackLine([[110, 120], [140, 160], [124, 186], [160, 226]]).replace("<path", '<path data-a="crack" data-t="0.45"') +
    G(P("M300 60 Q330 60 336 90 L300 126 L274 100 L310 64 Q300 60 300 60 Z", "k") + L(287, 113, 212, 188, "k", 'style="stroke-width:16px"'), "pop", 'data-t="0.6"') +
    G(L(48, 340, 120, 340, "cr") + L(84, 304, 84, 376, "cr"), "");

  // ===== Part 2: consequences =====
  I.p2_1 = () =>
    G(P("M200 70 A130 130 0 0 0 200 330 L188 280 L212 230 L186 180 L210 120 Z", "fa", "data-nodraw") + P("M200 70 A130 130 0 0 0 200 330", "k") + P("M200 70 L210 120 L186 180 L212 230 L188 280 L200 330", "cr"), "move", 'data-t="0.15" data-x="-42" data-r="-8"') +
    G(P("M200 70 A130 130 0 0 1 200 330 L188 280 L212 230 L186 180 L210 120 Z", "fa", "data-nodraw") + P("M200 70 A130 130 0 0 1 200 330", "k") + P("M200 70 L210 120 L186 180 L212 230 L188 280 L200 330", "cr"), "move", 'data-t="0.15" data-x="42" data-r="8"') +
    G(node(40, 80, 22) + node(70, 50, 12), "pop", 'data-t="0.45"') +
    G(node(360, 320, 22) + node(330, 352, 12), "pop", 'data-t="0.55"') +
    G(node(360, 70, 16), "pop", 'data-t="0.65"');
  I.p2_2 = () =>
    G(crown(200, 120, 170) + crackLine([[200, 70], [190, 100], [208, 122], [196, 156]]), "droop", 'data-t="0.3" data-r="-10" data-y="16"') +
    G(R(120, 250, 160, 84, 14, "k") + R(280, 274, 16, 36, 4, "k") + R(132, 262, 34, 60, 6, "fc", "data-nodraw"), "") +
    G(R(132, 262, 34, 60, 6, "fc", "data-nodraw"), "blink", 'data-t="0.2"') +
    G(arrow(330, 160, 330, 260, "cr"), "pop", 'data-t="0.5"');
  I.p2_3 = () =>
    G(R(266, 90, 100, 230, 10, "fk", "data-nodraw") + P("M266 320 V100 Q266 90 276 90 H356 Q366 90 366 100 V320", "k") + L(240, 320, 390, 320, "k"), "") +
    G(C(110, 220, 96, "m", 'style="stroke-dasharray:14 12"') + person(90, 230, 0.6, "k", "fk") + person(140, 226, 0.6, "k", "fk"), "") +
    G(person(176, 236, 0.62, "a", "fa"), "move", 'data-t="0.1" data-x="140" data-d="2"') +
    G(person(150, 180, 0.62, "a", "fa"), "move", 'data-t="0.35" data-x="160" data-y="50" data-d="2"') +
    G(arrow(230, 360, 330, 360, "cr"), "pop", 'data-t="0.3"');
  I.p2_4 = () =>
    G(hand(170, 200, 1, 1.2), "move", 'data-t="0.35" data-x="-40" data-r="-6"') +
    G(hand(230, 200, -1, 1.2, "a"), "move", 'data-t="0.35" data-x="40" data-r="6"') +
    G(bolt(200, 200, 1.0), "pop", 'data-t="0.42"') +
    G(person(70, 320, 0.6, "k", "fk"), "") + G(person(330, 320, 0.6, "k", "fk"), "") +
    G(bubble(200, 86, 90, 66, 1, "cr", "") + L(186, 72, 214, 100, "cr") + L(214, 72, 186, 100, "cr"), "pop", 'data-t="0.6"');
  I.p2_5 = () =>
    G(coinStack(200, 300, 52, 5), "") +
    G(coin(160, 150, 30), "pop float", 'data-t="0.05"') + G(coin(240, 120, 26), "pop float", 'data-t="0.15"') + G(coin(200, 70, 22), "pop float", 'data-t="0.25"') +
    G(hand(70, 260, 1, 0.8), "move", 'data-t="0.3" data-x="30"') +
    G(hand(330, 260, -1, 0.8, "a"), "move", 'data-t="0.3" data-x="-30"') +
    G(arrow(60, 170, 120, 200, "cr", 16) + arrow(340, 170, 280, 200, "cr", 16), "pop", 'data-t="0.5"');
  I.p2_6 = () =>
    chart(220, 240, 260, 200, [0.95, 0.8, 0.62, 0.42, 0.24], "a") +
    G(P("M110 150 L170 180 L230 220 L290 270 L340 300", "cr") + P("M316 300 L340 300 L336 276", "cr"), "") +
    G(megaphone(80, 80, 0.7, "k"), "") +
    G(waves(110, 80, 0.7, "m", 3), "blink", 'data-t="0.1"');
  I.p2_7 = () =>
    flagPole(80, 360, 300) +
    G(P("M80 70 Q130 52 180 74 L180 150 Q130 130 80 150 Z", "fa", "data-nodraw") + P("M80 70 Q130 52 180 74 L180 150 Q130 130 80 150", "a"), "") +
    G(P("M180 74 Q230 92 280 74 L280 150 Q230 170 180 150 Z", "fa", "data-nodraw") + P("M180 74 Q230 92 280 74 L280 150 Q230 170 180 150", "a"), "move", 'data-t="0.3" data-x="30" data-y="-30" data-r="12"') +
    G(arrow(200, 330, 120, 230, "k") , "pop", 'data-t="0.4"') + G(arrow(200, 330, 210, 210, "k"), "pop", 'data-t="0.5"') + G(arrow(200, 330, 330, 240, "k"), "pop", 'data-t="0.6"') +
    G(node(200, 340, 16, "k"), "");
  I.p2_8 = () =>
    G(person(90, 260, 1.0, "k", "fk") + arrow(140, 240, 190, 220, "cr", 16), "") +
    G(person(310, 260, 1.0, "a", "fa") + arrow(260, 240, 210, 220, "cr", 16), "") +
    G(bubble(110, 100, 120, 90, 1, "cr", "") + L(110, 76, 110, 108, "cr") + C(110, 124, 4, "fc", "data-nodraw"), "pop", 'data-t="0.1"') +
    G(bubble(290, 100, 120, 90, -1, "cr", "") + L(276, 86, 304, 114, "cr") + L(304, 86, 276, 114, "cr"), "pop", 'data-t="0.3"') +
    G(bubble(200, 340, 100, 60, 1, "m", "") + L(170, 340, 230, 340, "m"), "pop", 'data-t="0.55"');
  I.p2_9 = () =>
    G(P("M140 60 H260 M140 340 H260 M152 60 Q152 160 200 200 Q248 160 248 60 M152 340 Q152 240 200 200 Q248 240 248 340", "k") + P("M170 100 H230 Q226 150 200 176 Q174 150 170 100 Z", "fa", "data-nodraw") + P("M164 330 Q200 270 236 330 Z", "fs", "data-nodraw"), "tilt", 'data-r="4" data-o="200 200"') +
    G(L(200, 200, 200, 300, "a", 'style="stroke-dasharray:6 10"'), "march") +
    G(person(70, 120, 0.5, "k", "fk"), "fall", 'data-t="0.3" data-y="190"') +
    G(coin(330, 110, 26), "fall", 'data-t="0.45" data-y="210"') +
    G(gear(66, 300, 30, 7, "m", ""), "spin", 'data-r="-120"') +
    G(gear(334, 300, 30, 7, "m", ""), "fall", 'data-t="0.6" data-y="60"');
  I.p2_10 = () =>
    G(globe(110, 110, 70), "") +
    G(person(300, 300, 0.9, "k", "fk"), "") +
    chainLink(165, 165, 45, "k") +
    G(chainLink(200, 200, -45, "cr"), "fall", 'data-t="0.4" data-y="140"') +
    chainLink(240, 240, 45, "k") +
    G(L(176, 216, 160, 240, "cr") + L(220, 176, 244, 160, "cr"), "pop", 'data-t="0.45"');
  I.p2_11 = () =>
    G(cloud(200, 90, 1.0), "float", 'data-y="5"') +
    G(L(150, 150, 140, 176, "a") + L(200, 156, 190, 182, "a") + L(250, 150, 240, 176, "a"), "rain") +
    G(P("M150 380 L150 320 Q150 270 200 270 Q250 270 250 320 L250 380", "k") + C(200, 234, 30, "k") + P("M186 248 Q200 238 214 248", "k") + C(188, 228, 3, "fs", "data-nodraw") + C(212, 228, 3, "fs", "data-nodraw"), "droop", 'data-t="0.3" data-y="8" data-r="0"') +
    G(qmark(320, 280, 0.8), "pop float", 'data-t="0.6"') +
    G(qmark(80, 290, 0.6), "pop float", 'data-t="0.7"');
  I.p2_12 = () =>
    G(gear(140, 150, 70, 9), "spinstop", 'data-r="40" data-t="0.3"') +
    G(gear(250, 150, 50, 7, "a", "fa"), "spinstop", 'data-r="-56" data-t="0.3"') +
    G(R(186, 92, 22, 116, 6, "fc", "data-nodraw") + R(186, 92, 22, 116, 6, "cr"), "pop", 'data-t="0.3"') +
    G(R(60, 280, 280, 40, 20, "k") + R(66, 286, 90, 28, 14, "fs", "data-nodraw"), "") +
    G(R(150, 340, 16, 40, 4, "fs", "data-nodraw") + R(176, 340, 16, 40, 4, "fs", "data-nodraw"), "blink", 'data-t="0.45"');
  I.p2_13 = () =>
    G(node(200, 350, 20, "k"), "") +
    G(P("M200 330 L120 250 M200 330 L280 250", "k") + node(120, 250, 16) + node(280, 250, 16), "", "") +
    G(P("M120 234 L80 170 M120 234 L150 170 M280 234 L250 170 M280 234 L320 170", "a") + node(80, 170, 12) + node(150, 170, 12) + node(250, 170, 12) + node(320, 170, 12), "pop", 'data-t="0.25"') +
    G(P("M80 158 L60 100 M80 158 L96 100 M150 158 L140 100 M150 158 L170 100 M250 158 L232 100 M250 158 L262 100 M320 158 L304 100 M320 158 L340 100", "cr") + node(60, 96, 8) + node(96, 96, 8) + node(140, 96, 8) + node(170, 96, 8) + node(232, 96, 8) + node(262, 96, 8) + node(304, 96, 8) + node(340, 96, 8), "pop", 'data-t="0.55"');
  I.p2_14 = () =>
    G(P("M200 50 L310 90 V190 Q310 290 200 340 Q90 290 90 190 V90 Z", "fa", "data-nodraw") + P("M200 50 L310 90 V190 Q310 290 200 340 Q90 290 90 190 V90 Z", "k") + star(200, 180, 50, "a", "fs"), "") +
    crackLine([[200, 50], [216, 110], [186, 170], [222, 230], [196, 340]]).replace("<path", '<path data-a="crack" data-t="0.3"') +
    G(star(80, 372, 18, "a", "fs"), "") + G(star(140, 372, 18, "a", "fs"), "") + G(star(200, 372, 18, "a", "fs"), "fade", 'data-t="0.5" data-o="0.2"') + G(star(260, 372, 18, "a", "fs"), "fade", 'data-t="0.6" data-o="0.2"') + G(star(320, 372, 18, "a", "fs"), "fade", 'data-t="0.7" data-o="0.2"');

  // ===== Part 3: events =====
  I.p3_1 = () =>
    G(node(150, 220, 70, "k") + node(120, 200, 14) + node(170, 250, 14) + node(160, 180, 10), "") +
    G(node(290, 190, 44, "a") + node(290, 190, 12), "move", 'data-t="0.2" data-x="30" data-y="-20"') +
    crackLine([[220, 150], [232, 190], [214, 220], [236, 260]]).replace("<path", '<path data-a="crack" data-t="0.2"') +
    G(megaphone(290, 330, 0.62, "a") + waves(320, 330, 0.6, "a", 2), "pop", 'data-t="0.6"') +
    G(flagPole(320, 150, 110) + P("M320 44 L376 60 L320 76 Z", "fs", "data-nodraw"), "pop", 'data-t="0.75"');
  I.p3_2 = () =>
    G(C(200, 220, 90, "fa", "data-nodraw") + C(200, 220, 90, "k") + node(180, 200, 16, "k") + node(226, 236, 16, "k") + node(200, 256, 10, "k"), "") +
    G(L(120, 160, 70, 100, "m") + node(60, 90, 34) + node(60, 90, 10), "pop", 'data-t="0.1"') +
    G(L(284, 170, 330, 110, "m") + node(340, 96, 30) + node(340, 96, 9), "pop", 'data-t="0.3"') +
    G(L(140, 290, 90, 340, "m") + node(80, 350, 28) + node(80, 350, 8), "pop", 'data-t="0.5"') +
    G(L(270, 290, 320, 340, "m") + node(330, 350, 26) + node(330, 350, 8), "pop", 'data-t="0.7"');
  I.p3_3 = () =>
    G(P("M30 380 L50 240 H150 L170 380", "k") + R(40, 220, 120, 24, 6, "fk", "data-nodraw") + person(100, 170, 0.66, "k", "fk") + L(150, 210, 172, 160, "a") + C(176, 152, 9, "fs", "data-nodraw"), "") +
    G(P("M230 380 L250 240 H350 L370 380", "a") + R(240, 220, 120, 24, 6, "fa", "data-nodraw") + person(300, 170, 0.66, "a", "fa") + L(250, 210, 228, 160, "a") + C(224, 152, 9, "fs", "data-nodraw"), "") +
    G(bolt(200, 120, 0.9), "pop pulse", 'data-t="0.3" data-s="1.15"') +
    G(waves(184, 160, 0.5, "cr", 2), "blink", 'data-t="0.1"') +
    G(bubble(200, 300, 100, 60, 1, "m", "") + L(176, 300, 224, 300, "m"), "pop", 'data-t="0.55"');
  I.p3_4 = () =>
    G(person(200, 90, 0.55, "k", "fk") + person(80, 220, 0.55, "k", "fk") + person(320, 220, 0.55, "k", "fk") + person(200, 340, 0.55, "k", "fk"), "") +
    G(arrow(190, 130, 104, 196, "cr", 16), "pop", 'data-t="0.05"') +
    G(arrow(116, 230, 284, 230, "cr", 16), "pop", 'data-t="0.18"') +
    G(arrow(300, 250, 220, 314, "cr", 16), "pop", 'data-t="0.3"') +
    G(arrow(196, 300, 196, 140, "cr", 16), "pop", 'data-t="0.42"') +
    G(arrow(290, 192, 220, 126, "cr", 16), "pop", 'data-t="0.54"') +
    G(arrow(110, 254, 180, 316, "cr", 16), "pop", 'data-t="0.66"') +
    G(bubble(320, 100, 70, 50, -1, "a", "") , "pop", 'data-t="0.4"') + G(bubble(80, 100, 70, 50, 1, "a", ""), "pop", 'data-t="0.6"');
  I.p3_5 = () =>
    G(pillarHall(120, 220, 170, 220) + column(70, 160, 312, 30) + column(120, 160, 312, 30) + column(170, 160, 312, 30), "") +
    G(person(250, 260, 0.62, "a", "fa") + star(250, 280, 10, "k", "fs"), "move", 'data-t="0.1" data-x="110" data-d="2"') +
    G(person(220, 330, 0.62, "a", "fa") + star(220, 350, 10, "k", "fs"), "move", 'data-t="0.35" data-x="150" data-d="2"') +
    G(arrow(250, 140, 360, 140, "cr"), "pop", 'data-t="0.3"');
  I.p3_6 = () =>
    L(200, 380, 200, 60, "k", 'style="stroke-width:10px"') +
    G(P("M200 80 H330 L356 104 L330 128 H200 Z", "fa", "data-nodraw") + P("M200 80 H330 L356 104 L330 128 H200 Z", "a"), "pop", 'data-t="0.05"') +
    G(P("M200 150 H70 L44 174 L70 198 H200 Z", "fk", "data-nodraw") + P("M200 150 H70 L44 174 L70 198 H200 Z", "k"), "pop", 'data-t="0.2"') +
    G(P("M200 220 H310 L336 244 L310 268 H200 Z", "fa", "data-nodraw") + P("M200 220 H310 L336 244 L310 268 H200 Z", "cr"), "pop", 'data-t="0.35"') +
    G(P("M200 290 H96 L70 314 L96 338 H200 Z", "fk", "data-nodraw") + P("M200 290 H96 L70 314 L96 338 H200 Z", "m"), "pop", 'data-t="0.5"') +
    G(person(290, 350, 0.42, "k", "") + person(110, 380, 0.42, "k", ""), "pop", 'data-t="0.65"');
  I.p3_7 = () =>
    pillarHall(200, 220, 280, 300) +
    column(100, 170, 352, 34) + column(160, 170, 352, 34) + column(240, 170, 352, 34) +
    G(column(300, 170, 352, 34), "droop", 'data-t="0.45" data-r="10" data-y="6" data-o="300 352"') +
    crackLine([[160, 180], [150, 230], [170, 270], [156, 320]]).replace("<path", '<path data-a="crack" data-t="0.25"') +
    crackLine([[120, 90], [150, 110], [140, 130]]).replace("<path", '<path data-a="crack" data-t="0.4"');
  I.p3_8 = () =>
    G(person(150, 220, 1.0, "k", "fk"), "move", 'data-t="0.2" data-x="-70" data-d="1.6"') +
    G(person(250, 220, 1.0, "a", "fa"), "move", 'data-t="0.2" data-x="70" data-d="1.6"') +
    G(arrow(200, 330, 100, 330, "cr", 18) + arrow(200, 330, 300, 330, "cr", 18), "pop", 'data-t="0.4"') +
    G(L(200, 120, 200, 300, "m", 'style="stroke-dasharray:12 12"'), "pop", 'data-t="0.35"') +
    G(P("M150 90 Q200 60 250 90", "m") , "fade", 'data-t="0.3" data-o="0"');
  I.p3_9 = () =>
    G(P("M90 230 H310 V350 H90 Z", "fk", "data-nodraw") + P("M90 230 H310 V350 H90 Z", "k") + P("M90 230 L60 190 H170 L200 230", "k") + P("M310 230 L340 190 H230 L200 230", "k"), "") +
    G(doc(150, 150, 90, 110, 3), "move", 'data-t="0.15" data-y="-40" data-r="-10"') +
    G(doc(250, 150, 90, 110, 3), "move", 'data-t="0.3" data-y="-50" data-r="10"') +
    G(magnifier(290, 290, 36, "a"), "pop", 'data-t="0.5"') +
    G(L(60, 60, 60, 110, "cr") + C(60, 130, 5, "fc", "data-nodraw") + L(340, 50, 340, 100, "cr") + C(340, 120, 5, "fc", "data-nodraw"), "pop blink", 'data-t="0.6"');
  I.p3_10 = () =>
    G(domino(70, 330, 44, 120), "domino", 'data-t="0.1" data-o="92 330"') +
    G(domino(140, 330, 44, 120), "domino", 'data-t="0.2" data-o="162 330"') +
    G(domino(210, 330, 44, 120, "a"), "domino", 'data-t="0.3" data-o="232 330"') +
    G(domino(280, 330, 44, 120), "domino", 'data-t="0.4" data-o="302 330"') +
    G(domino(350, 330, 44, 120, "a"), "domino", 'data-t="0.5" data-o="372 330"') +
    L(20, 334, 390, 334, "k") +
    G(C(200, 110, 30, "a"), "ripple", 'data-t="0.2"') + G(C(200, 110, 30, "a"), "ripple", 'data-t="0.4"') + G(C(200, 110, 30, "a"), "ripple", 'data-t="0.6"') + node(200, 110, 14);

  // ===== intro: network that fractures =====
  I.intro = () => {
    const N = [[200, 60], [90, 120], [310, 120], [60, 230], [200, 200], [340, 230], [120, 330], [280, 330]];
    const E2 = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [4, 7], [5, 7], [0, 4], [6, 7]];
    let o = "";
    E2.forEach(([a, b], i) => {
      const brk = i % 3 === 1;
      o += L(N[a][0], N[a][1], N[b][0], N[b][1], brk ? "cr" : "m", brk ? `data-a="snap" data-t="${(0.35 + (i % 4) * 0.08).toFixed(2)}"` : "");
    });
    N.forEach((p, i) => (o += G(node(p[0], p[1], i === 4 ? 30 : 20, i % 2 ? "a" : "k") + node(p[0], p[1], 6, "k"), "pop", `data-t="${(i * 0.04).toFixed(2)}"`)));
    return o;
  };
  // ===== section divider art =====
  I.div2 = () =>
    G(P("M200 60 A140 140 0 0 0 200 340", "k") + P("M200 60 A140 140 0 0 0 200 340 Z", "fa", "data-nodraw"), "move", 'data-t="0.3" data-x="-36" data-r="-10"') +
    G(P("M200 60 A140 140 0 0 1 200 340", "a") + P("M200 60 A140 140 0 0 1 200 340 Z", "fa", "data-nodraw"), "move", 'data-t="0.3" data-x="36" data-r="10"') +
    crackLine([[200, 60], [214, 130], [188, 200], [212, 270], [200, 340]]).replace("<path", '<path data-a="crack" data-t="0.1"');
  I.div3 = () => {
    let o = L(30, 200, 370, 200, "k");
    for (let i = 0; i < 10; i++) {
      const x = 40 + i * 35.5, up = i % 2 === 0;
      o += G(L(x, 200, x, up ? 140 : 260, "m") + node(x, up ? 130 : 270, 12, i % 3 === 0 ? "cr" : "a"), "pop", `data-t="${(0.05 + i * 0.08).toFixed(2)}"`);
    }
    return o;
  };
  // ===== conclusion pieces =====
  I.hall = () => pillarHall(200, 230, 260, 280) + column(110, 180, 352, 32) + column(170, 180, 352, 32) + column(230, 180, 352, 32) + column(290, 180, 352, 32);
  I.mini = {
    crown: () => crown(200, 200, 220),
    coins: () => coinStack(200, 260, 90, 4),
    diamond: () => P("M150 110 L250 110 L300 160 L200 300 L100 160 Z", "fa", "data-nodraw") + P("M150 110 L250 110 L300 160 L200 300 L100 160 Z M100 160 H300 M150 110 L180 160 L200 300 L220 160 L250 110", "a"),
    globe: () => globe(200, 200, 130),
    split: () => P("M190 70 A130 130 0 0 0 190 330", "a") + P("M210 70 A130 130 0 0 1 210 330", "k") + crackLine([[200, 60], [214, 130], [188, 200], [212, 270], [200, 340]]),
    weakcrown: () => crown(200, 210, 220) + crackLine([[200, 140], [184, 190], [210, 220], [196, 270]]),
    down: () => P("M60 100 L150 170 L230 220 L330 320", "cr") + P("M290 320 L330 320 L330 280", "cr") + L(50, 350, 350, 350, "k"),
    ruin: () => P("M60 340 H340", "k") + R(80, 200, 40, 140, 6, "k") + R(160, 250, 40, 90, 6, "k") + `<g transform="rotate(30 260 340)">` + R(240, 200, 40, 140, 6, "a") + `</g>` + P("M70 190 L150 150 L240 170", "m"),
  };
  I.prim = { pillarHall, column, crackLine };
  window.ICONS = I;
})();
