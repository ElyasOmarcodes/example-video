/* Flat news-illustration kit (hand-coded SVG). Brand palette: navy #051449, amber #EAA500, light #E4E4EA.
   Every function returns an SVG string in absolute stage coordinates (stage viewBox 0 0 1000 860).
   Wrappers carry animation hooks read by the engine in index.html:
     data-in  = up|down|left|right|pop|fade|drop|grow|growx|draw|zoom   data-at = seconds after scene start
     data-act = move|tilt|tilt1|spin|float|pulse|blink|shake|fall|droop|tug|domino|ripple|flutter|rain|swing|count
     data-t   = fraction of the spoken line when the action fires; data-x/y/r/s/d/o = parameters */
(function () {
  const C = {
    bg: "#040C2C", navy: "#051449", n2: "#0B1E5E", n3: "#15307E", n4: "#2346A0", n5: "#4868C2", n6: "#8EA4DE",
    w: "#E4E4EA", w2: "#C3C7D8", w3: "#959CBA", am: "#EAA500", am2: "#C08600", am3: "#F7C85B",
    sk: "#D2A07A", sk2: "#B07D59", hr: "#191A2C", dk: "#020718",
  };
  const r1 = (n) => Math.round(n * 10) / 10;
  const at = (o) => Object.keys(o || {}).map((k) => `data-${k}="${o[k]}"`).join(" ");
  const W = (inner, o) => `<g ${at(o)}>${inner}</g>`; // animated wrapper (no transform attribute!)
  const T = (x, y, s, inner, fl) => `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1((fl || 1) * (s || 1) * 1000) / 1000} ${r1((s || 1) * 1000) / 1000})">${inner}</g>`;
  const P = (d, fill, ex) => `<path d="${d}" fill="${fill}" ${ex || ""}/>`;
  const S = (d, stroke, w, ex) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${ex || ""}/>`;
  const Ci = (x, y, r, fill, ex) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${fill}" ${ex || ""}/>`;
  const El = (x, y, rx, ry, fill, ex) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}" ${ex || ""}/>`;
  const Rc = (x, y, w, h, rx, fill, ex) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(rx)}" fill="${fill}" ${ex || ""}/>`;
  const Tx = (x, y, txt, size, fill, wt, ex) => `<text x="${r1(x)}" y="${r1(y)}" font-family="Quds" font-weight="${wt || 700}" font-size="${size}" fill="${fill}" text-anchor="middle" direction="rtl" ${ex || ""}>${txt}</text>`;
  const shadow = (x, y, rx, op) => El(x, y, rx, rx * 0.16, "#000", `opacity="${op || 0.32}"`);

  // ---------------- people ----------------
  // full figure, origin = feet centre, ~390 units tall at s=1
  function person(o) {
    o = Object.assign({ x: 0, y: 0, s: 1, fl: 1, suit: C.n4, tie: C.am, pose: "down", beard: false, cap: false, glow: false, legs: true, sh: true }, o);
    const suit = o.suit, dark = shade(suit, -0.28);
    let g = "";
    if (o.sh) g += shadow(0, 0, 70, 0.3);
    if (o.glow) g += Ci(0, -200, 190, C.am, 'opacity="0.10"') + Ci(0, -200, 150, C.am, 'opacity="0.10"');
    if (o.legs) {
      g += Rc(-30, -150, 27, 146, 10, "#3A4570") + Rc(3, -150, 27, 146, 10, "#3A4570");
      g += El(-20, -6, 24, 9, "#141A33") + El(20, -6, 24, 9, "#141A33");
      g += P("M3 -150 h27 v20 h-27 z", "#000", 'opacity=".18"');
    }
    // back arm (behind torso)
    const A = arms(o.pose, suit, dark);
    g += A.back;
    // torso
    g += P("M-58 -146 L-63 -252 Q-62 -292 -22 -298 L22 -298 Q62 -292 63 -252 L58 -146 Q0 -138 -58 -146 Z", suit);
    g += P("M10 -298 L22 -298 Q62 -292 63 -252 L58 -146 Q30 -142 10 -142 Z", "#000", 'opacity=".16"');
    g += P("M-20 -298 L0 -236 L20 -298 Z", C.w);
    g += P(`M-6 -290 L6 -290 L9 -238 L0 -224 L-9 -238 Z`, o.tie);
    g += P("M-22 -298 L-2 -232 L-30 -258 L-26 -292 Z", dark) + P("M22 -298 L2 -232 L30 -258 L26 -292 Z", dark);
    g += S("M0 -228 V-150", dark, 3) + Ci(0, -200, 4, dark) + Ci(0, -176, 4, dark);
    g += Rc(-46, -232, 22, 4, 2, dark); // pocket
    // neck + head
    g += Rc(-11, -318, 22, 24, 6, C.sk2);
    g += El(-30, -340, 7, 10, C.sk2) + El(30, -340, 7, 10, C.sk2);
    g += El(0, -344, 30, 35, C.sk);
    g += P("M8 -378 Q30 -370 30 -344 Q30 -318 10 -310 Q24 -330 8 -378 Z", "#000", 'opacity=".12"');
    if (o.cap) g += P("M-33 -350 Q-34 -392 0 -394 Q34 -392 33 -350 Q20 -360 0 -360 Q-20 -360 -33 -350 Z", C.w2) + Rc(-34, -358, 68, 12, 6, C.w3);
    else g += P("M-31 -346 Q-34 -384 0 -384 Q34 -384 31 -346 Q28 -366 4 -368 Q-22 -366 -31 -346 Z", C.hr);
    if (o.beard) g += P("M-29 -344 Q-30 -300 0 -292 Q30 -300 29 -344 Q24 -322 12 -322 Q0 -316 -12 -322 Q-24 -322 -29 -344 Z", C.hr);
    g += A.front;
    return T(o.x, o.y, o.s, g, o.fl);
  }
  function arms(pose, suit, dark) {
    const arm = (d) => S(d, suit, 26) + S(d, "#000", 26, 'opacity=".08"');
    const hand = (x, y) => Ci(x, y, 13, C.sk) + Ci(x + 3, y + 3, 9, C.sk2, 'opacity=".5"');
    const L = { back: "", front: "" };
    switch (pose) {
      case "point": L.front = arm("M-56 -272 Q-70 -214 -64 -162") + hand(-64, -156) + arm("M56 -274 Q104 -262 146 -262") + hand(156, -262) + S("M164 -264 L186 -268", C.sk, 9); break;
      case "raise": L.front = arm("M-56 -272 Q-70 -214 -64 -162") + hand(-64, -156) + arm("M56 -276 Q80 -330 84 -380") + hand(84, -392); break;
      case "both": L.front = arm("M-56 -276 Q-80 -330 -84 -380") + hand(-84, -392) + arm("M56 -276 Q80 -330 84 -380") + hand(84, -392); break;
      case "cross": L.front = arm("M-58 -266 Q-30 -214 40 -222") + hand(44, -222) + arm("M58 -266 Q30 -206 -40 -212") + hand(-44, -212); break;
      case "hold": L.front = arm("M-58 -266 Q-46 -206 -14 -200") + hand(-10, -200) + arm("M58 -266 Q46 -206 14 -200") + hand(10, -200); break;
      case "pull": L.back = arm("M-50 -268 Q10 -246 92 -236") + hand(100, -236); L.front = arm("M54 -270 Q96 -252 124 -238") + hand(132, -238); break;
      case "reach": L.front = arm("M-56 -272 Q-70 -214 -64 -162") + hand(-64, -156) + arm("M56 -276 Q112 -310 140 -350") + hand(146, -358); break;
      case "carry": L.front = arm("M-58 -266 Q-54 -210 -30 -196") + hand(-26, -194) + arm("M58 -266 Q54 -210 30 -196") + hand(26, -194); break;
      case "shake": L.front = arm("M-56 -272 Q-70 -214 -64 -162") + hand(-64, -156) + arm("M56 -272 Q96 -230 132 -228") + hand(140, -228); break;
      case "hips": L.front = arm("M-58 -270 Q-96 -232 -60 -196") + hand(-56, -194) + arm("M58 -270 Q96 -232 60 -196") + hand(56, -194); break;
      case "head": L.front = arm("M-56 -272 Q-70 -214 -64 -162") + hand(-64, -156) + arm("M56 -272 Q74 -330 26 -352") + hand(20, -354); break;
      default: L.front = arm("M-56 -272 Q-70 -214 -64 -162") + hand(-64, -156) + arm("M56 -272 Q70 -214 64 -162") + hand(64, -156);
    }
    return L;
  }
  // head-and-shoulders, origin = bottom centre, ~150 tall at s=1
  function bust(o) {
    o = Object.assign({ x: 0, y: 0, s: 1, fl: 1, suit: C.n3, tie: C.am, beard: false, cap: false, op: 1 }, o);
    const dark = shade(o.suit, -0.28);
    let g = P("M-62 0 Q-64 -58 -22 -66 L22 -66 Q64 -58 62 0 Z", o.suit) + P("M10 -66 L22 -66 Q64 -58 62 0 L10 0 Z", "#000", 'opacity=".16"');
    g += P("M-18 -66 L0 -20 L18 -66 Z", C.w) + P("M-5 -60 L5 -60 L7 -24 L0 -14 L-7 -24 Z", o.tie) + P("M-20 -66 L-2 -18 L-28 -38 Z", dark) + P("M20 -66 L2 -18 L28 -38 Z", dark);
    g += Rc(-10, -84, 20, 22, 6, C.sk2) + El(0, -110, 28, 32, C.sk);
    g += o.cap ? P("M-31 -116 Q-32 -154 0 -156 Q32 -154 31 -116 Q18 -126 0 -126 Q-18 -126 -31 -116 Z", C.w2) : P("M-29 -112 Q-32 -148 0 -148 Q32 -148 29 -112 Q26 -132 4 -134 Q-20 -132 -29 -112 Z", C.hr);
    if (o.beard) g += P("M-27 -110 Q-28 -70 0 -64 Q28 -70 27 -110 Q22 -90 0 -86 Q-22 -90 -27 -110 Z", C.hr);
    return T(o.x, o.y, o.s, `<g opacity="${o.op}">${g}</g>`, o.fl);
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k)));
    return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }

  // ---------------- objects ----------------
  function crown(x, y, s) {
    const g = P("M-80 40 L-92 -36 L-44 4 L0 -60 L44 4 L92 -36 L80 40 Z", C.am) + P("M0 -60 L44 4 L92 -36 L80 40 L0 40 Z", C.am2, 'opacity=".55"') +
      Rc(-84, 30, 168, 26, 8, C.am2) + Rc(-84, 30, 168, 9, 4, C.am3) + Ci(-92, -40, 10, C.am3) + Ci(92, -40, 10, C.am3) + Ci(0, -66, 11, C.am3) +
      El(0, 8, 13, 15, C.w) + El(-46, 18, 9, 10, C.n5) + El(46, 18, 9, 10, C.n5) + P("M-60 -6 L-50 -2 L-56 8 Z", C.am3, 'opacity=".7"');
    return T(x, y, s, g);
  }
  function coin(x, y, r) {
    return Ci(x, y + r * 0.12, r, C.am2) + Ci(x, y, r, C.am) + Ci(x, y, r * 0.74, "none", `stroke="${C.am2}" stroke-width="${r1(r * 0.08)}"`) + star(x, y, r * 0.38, C.am2) + P(`M${r1(x - r * 0.6)} ${r1(y - r * 0.5)} Q${r1(x - r * 0.2)} ${r1(y - r * 0.9)} ${r1(x + r * 0.2)} ${r1(y - r * 0.8)}`, "none", `stroke="${C.am3}" stroke-width="${r1(r * 0.1)}" stroke-linecap="round"`);
  }
  function coinStack(x, y, r, n) {
    let g = shadow(x, y + 6, r * 1.2, 0.3);
    for (let i = 0; i < n; i++) {
      const yy = y - i * r * 0.28;
      g += El(x, yy, r, r * 0.34, C.am2) + Rc(x - r, yy - r * 0.18, r * 2, r * 0.18, 0, C.am2) + El(x, yy - r * 0.18, r, r * 0.34, C.am) + El(x, yy - r * 0.18, r * 0.7, r * 0.22, "none", `stroke="${C.am2}" stroke-width="3"`);
    }
    return g;
  }
  function note(x, y, w, rot) {
    const h = w * 0.48;
    const g = Rc(-w / 2, -h / 2, w, h, 8, "#3E8E6A") + Rc(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 6, "none", 'stroke="#9FD3B5" stroke-width="3"') + Ci(0, 0, h * 0.26, "#9FD3B5") + Ci(0, 0, h * 0.17, "#3E8E6A") + Rc(-w / 2 + 16, -h / 2 + 16, w * 0.16, h * 0.18, 3, "#9FD3B5") + Rc(w / 2 - 16 - w * 0.16, h / 2 - 16 - h * 0.18, w * 0.16, h * 0.18, 3, "#9FD3B5");
    return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot || 0})">${g}</g>`;
  }
  function cash(x, y, w, n) {
    let g = shadow(x, y + 4, w * 0.6, 0.3);
    for (let i = 0; i < n; i++) {
      const yy = y - i * 10;
      g += Rc(x - w / 2, yy - 18, w, 18, 4, i % 2 ? "#357C5C" : "#3E8E6A") + Rc(x - w / 2, yy - 18, w, 4, 2, "#9FD3B5", 'opacity=".5"');
    }
    g += Rc(x - 22, y - n * 10 - 10, 44, n * 10 + 12, 4, C.w, 'opacity=".9"');
    return g;
  }
  function moneyBag(x, y, s, label) {
    const g = shadow(0, 8, 90, 0.35) +
      P("M-46 -150 Q0 -170 46 -150 L28 -118 L-28 -118 Z", C.w2) + P("M-28 -118 L28 -118 Q110 -60 92 -6 Q80 10 0 10 Q-80 10 -92 -6 Q-110 -60 -28 -118 Z", C.w) +
      P("M28 -118 Q110 -60 92 -6 Q80 10 0 10 L10 -40 Q40 -80 28 -118 Z", C.w3, 'opacity=".55"') + Rc(-34, -128, 68, 16, 8, C.am) +
      Ci(0, -52, 34, C.am) + star(0, -52, 20, C.navy) + (label ? "" : "");
    return T(x, y, s, g);
  }
  function globe(x, y, r) {
    const id = "gc" + Math.round(x) + "_" + Math.round(y);
    const land = `M${-0.55 * r} ${-0.45 * r} q${0.2 * r} ${-0.15 * r} ${0.38 * r} ${-0.02 * r} q${0.05 * r} ${0.16 * r} ${-0.1 * r} ${0.26 * r} q${-0.04 * r} ${0.2 * r} ${-0.2 * r} ${0.18 * r} q${-0.2 * r} ${-0.1 * r} ${-0.08 * r} ${-0.42 * r} z M${0.05 * r} ${-0.55 * r} q${0.3 * r} ${-0.05 * r} ${0.5 * r} ${0.15 * r} q${0.05 * r} ${0.22 * r} ${-0.18 * r} ${0.22 * r} q${-0.1 * r} ${0.25 * r} ${-0.24 * r} ${0.12 * r} q${-0.12 * r} ${-0.2 * r} ${-0.08 * r} ${-0.49 * r} z M${-0.3 * r} ${0.15 * r} q${0.16 * r} ${-0.02 * r} ${0.2 * r} ${0.2 * r} q${-0.02 * r} ${0.3 * r} ${-0.16 * r} ${0.3 * r} q${-0.1 * r} ${-0.25 * r} ${-0.04 * r} ${-0.5 * r} z M${0.3 * r} ${0.25 * r} q${0.2 * r} ${0} ${0.25 * r} ${0.12 * r} q${-0.05 * r} ${0.15 * r} ${-0.22 * r} ${0.1 * r} z`;
    const g = `<defs><clipPath id="${id}"><circle cx="0" cy="0" r="${r}"/></clipPath><radialGradient id="${id}g" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${C.n5}"/><stop offset="1" stop-color="${C.n2}"/></radialGradient></defs>` +
      Ci(0, 0, r * 1.06, C.am, 'opacity=".12"') + Ci(0, 0, r, `url(#${id}g)`) +
      `<g clip-path="url(#${id})"><g data-act="globe" data-r="${r}">${P(land, C.n6, 'opacity=".9"')}</g>` +
      El(0, 0, r * 0.45, r, "none", `stroke="${C.w}" stroke-opacity=".25" stroke-width="2"`) + El(0, 0, r * 0.85, r, "none", `stroke="${C.w}" stroke-opacity=".18" stroke-width="2"`) +
      S(`M${-r} 0 H${r}`, C.w, 2, 'stroke-opacity=".25"') + S(`M${-r} ${-r * 0.5} Q0 ${-r * 0.62} ${r} ${-r * 0.5}`, C.w, 2, 'stroke-opacity=".18"') + S(`M${-r} ${r * 0.5} Q0 ${r * 0.38} ${r} ${r * 0.5}`, C.w, 2, 'stroke-opacity=".18"') +
      Ci(r * 0.35, r * 0.25, r * 1.1, "#000", 'opacity=".22"') + `</g>` + Ci(-r * 0.35, -r * 0.4, r * 0.16, C.w, 'opacity=".25"');
    return T(x, y, 1, g);
  }
  function podium(x, y, s, mics) {
    let g = shadow(0, 0, 130, 0.35) + P("M-110 0 L-90 -190 L90 -190 L110 0 Z", C.n3) + P("M10 -190 L90 -190 L110 0 L10 0 Z", "#000", 'opacity=".2"') + Rc(-120, -214, 240, 30, 8, C.n4) + Rc(-120, -214, 240, 8, 4, C.n5) +
      Ci(0, -110, 40, C.am) + Ci(0, -110, 30, C.n3) + P("M0 -132 L8 -114 L-8 -114 Z M0 -88 L8 -106 L-8 -106 Z", C.am);
    if (mics !== false) g += S("M-26 -214 Q-30 -250 -40 -270", C.w3, 5) + El(-42, -278, 9, 14, C.dk) + S("M26 -214 Q30 -250 40 -270", C.w3, 5) + El(42, -278, 9, 14, C.dk) + S("M0 -214 V-276", C.w3, 5) + El(0, -284, 9, 14, C.dk);
    return T(x, y, s, g);
  }
  function table(x, y, w, cloth) {
    return shadow(x, y + 120, w * 0.55, 0.3) + P(`M${x - w / 2} ${y} L${x + w / 2} ${y} L${x + w / 2 - 30} ${y + 40} L${x - w / 2 + 30} ${y + 40} Z`, cloth || C.n4) + Rc(x - w / 2 + 30, y + 40, w - 60, 14, 4, shade(cloth || C.n4, -0.3)) + Rc(x - w / 2 + 50, y + 54, 16, 70, 4, C.n2) + Rc(x + w / 2 - 66, y + 54, 16, 70, 4, C.n2) + Rc(x - w / 2, y - 6, w, 10, 5, shade(cloth || C.n4, 0.25));
  }
  function chair(x, y, s, throne) {
    const back = throne ? C.am : C.n3, seat = throne ? C.am2 : C.n2;
    let g = shadow(0, 0, 80, 0.3) + Rc(-60, -260, 120, 170, throne ? 40 : 18, back) + Rc(-46, -244, 92, 140, throne ? 30 : 12, shade(back, -0.15)) +
      Rc(-74, -104, 148, 30, 10, seat) + Rc(-66, -74, 14, 74, 5, C.n2) + Rc(52, -74, 14, 74, 5, C.n2) + Rc(-82, -150, 18, 60, 8, back) + Rc(64, -150, 18, 60, 8, back);
    if (throne) g += P("M-40 -262 L-30 -296 L-14 -272 L0 -306 L14 -272 L30 -296 L40 -262 Z", C.am3);
    return T(x, y, s, g);
  }
  function doc(x, y, w, h, rot, title, stamp) {
    let g = Rc(-w / 2 + 8, -h / 2 + 10, w, h, 10, "#000", 'opacity=".25"') + P(`M${-w / 2} ${-h / 2 + 10} Q${-w / 2} ${-h / 2} ${-w / 2 + 10} ${-h / 2} H${w / 2 - 34} L${w / 2} ${-h / 2 + 34} V${h / 2 - 10} Q${w / 2} ${h / 2} ${w / 2 - 10} ${h / 2} H${-w / 2 + 10} Q${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 10} Z`, C.w) + P(`M${w / 2 - 34} ${-h / 2} V${-h / 2 + 34} H${w / 2} Z`, C.w3);
    let yy = -h / 2 + 30;
    if (title) { g += Tx(0, yy + 22, title, Math.min(38, w * 0.16), C.navy, 900); yy += 48; }
    while (yy < h / 2 - 22) { const lw = (w - 50) * (0.55 + 0.45 * Math.abs(Math.sin(yy))); g += Rc(w / 2 - 25 - lw, yy, lw, 7, 3.5, C.w3); yy += 22; }
    if (stamp) g += `<g transform="rotate(-14)">${Rc(-w * 0.32, h * 0.08, w * 0.64, 54, 8, "none", `stroke="${C.am}" stroke-width="6"`) + Tx(0, h * 0.08 + 39, stamp, 34, C.am, 900)}</g>`;
    return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot || 0})">${g}</g>`;
  }
  function folder(x, y, s, label, open) {
    let g = shadow(0, 100, 150, 0.3) + P("M-150 -90 L-60 -90 L-40 -110 L150 -110 L150 100 L-150 100 Z", C.am2) + Rc(-150, -86, 300, 186, 10, C.am);
    if (label) g += Rc(-90, -50, 180, 54, 8, C.w) + Tx(0, -12, label, 34, C.navy, 900);
    return T(x, y, s, g);
  }
  function stampTool(x, y, s, mark) {
    const g = Rc(-24, -140, 48, 90, 18, C.n2) + El(0, -140, 34, 16, C.n3) + Rc(-60, -56, 120, 34, 8, C.n4) + Rc(-66, -24, 132, 22, 6, mark === "x" ? C.w3 : C.am);
    return T(x, y, s, g);
  }
  function mark(x, y, s, kind) {
    const g = kind === "x" ? Ci(0, 0, 46, "none", `stroke="${C.n4}" stroke-width="8"`) + S("M-20 -20 L20 20 M20 -20 L-20 20", C.n4, 10) : Ci(0, 0, 46, "none", `stroke="${C.am}" stroke-width="8"`) + S("M-22 2 L-6 18 L24 -16", C.am, 10);
    return T(x, y, s, g);
  }
  function gavel(x, y, s) {
    return T(x, y, s, Rc(-12, -6, 24, 150, 10, "#8A5A35") + Rc(-70, -50, 140, 56, 16, "#9B6A42") + Rc(-70, -50, 22, 56, 8, "#7A4C2B") + Rc(48, -50, 22, 56, 8, "#7A4C2B") + Rc(-70, -50, 140, 12, 6, "#B98A5E"));
  }
  function block(x, y, s) {
    return T(x, y, s, shadow(0, 30, 120, 0.3) + El(0, 18, 110, 22, "#6B4426") + Rc(-110, -10, 220, 28, 0, "#7A4C2B") + El(0, -10, 110, 22, "#9B6A42"));
  }
  function balanceBase(x, y, s) {
    return T(x, y, s, shadow(0, 0, 120, 0.3) + P("M-90 0 Q0 -40 90 0 Z", C.am2) + Rc(-12, -380, 24, 360, 10, C.am) + Ci(0, -392, 22, C.am3) + Ci(0, -392, 10, C.am2));
  }
  function balanceBeam(s) { // around pivot (0,0)
    return Rc(-280, -10, 560, 20, 10, C.am) + Ci(0, 0, 16, C.am3);
  }
  function pan(x, s, load) {
    return S(`M${x} 0 L${x - 70} 150 M${x} 0 L${x + 70} 150`, C.am3, 4) + P(`M${x - 96} 150 Q${x} 220 ${x + 96} 150 Z`, C.am2) + Rc(x - 96, 144, 192, 10, 5, C.am) + (load || "");
  }
  function columnHall(x, y, s, cols) { // returns parts so columns can be animated separately
    const parts = { roof: "", cols: [], base: "" };
    parts.roof = T(x, y, s, P("M-260 -330 L0 -450 L260 -330 Z", C.w) + P("M0 -450 L260 -330 L0 -330 Z", C.w3, 'opacity=".5"') + Ci(0, -372, 22, C.am) + Rc(-250, -330, 500, 30, 4, C.w2) + Rc(-250, -300, 500, 12, 2, C.w3));
    const xs = cols || [-190, -95, 0, 95, 190];
    xs.forEach((cx) => parts.cols.push(T(x, y, s, Rc(cx - 26, -288, 52, 16, 4, C.w2) + Rc(cx - 20, -272, 40, 236, 4, C.w) + Rc(cx - 8, -272, 6, 236, 3, C.w3, 'opacity=".55"') + Rc(cx + 6, -272, 6, 236, 3, C.w3, 'opacity=".55"') + Rc(cx - 26, -38, 52, 14, 4, C.w2))));
    parts.base = T(x, y, s, shadow(0, 30, 300, 0.35) + Rc(-280, -24, 560, 24, 4, C.w2) + Rc(-300, 0, 600, 26, 4, C.w3));
    return parts;
  }
  function flag(x, y, s, col, id) {
    const g = Rc(-6, -320, 12, 320, 6, C.w3) + Ci(0, -326, 12, C.am) + `<g data-act="flutter">${P("M6 -310 Q60 -330 110 -310 Q160 -290 210 -310 L210 -190 Q160 -170 110 -190 Q60 -210 6 -190 Z", col || C.am)}${P("M6 -310 Q60 -330 110 -310 L110 -190 Q60 -210 6 -190 Z", "#fff", 'opacity=".12"')}${Ci(108, -250, 22, C.navy, 'opacity=".5"')}</g>`;
    return T(x, y, s, g);
  }
  function megaphone(x, y, s, fl) {
    const g = P("M-60 -30 L40 -80 L40 80 L-60 30 Z", C.w) + P("M-60 0 L40 0 L40 80 L-60 30 Z", C.w3, 'opacity=".5"') + Rc(40, -88, 16, 176, 8, C.w2) + Rc(-92, -32, 34, 64, 8, C.am) + P("M-70 30 L-56 84 L-36 84 L-44 30 Z", C.n4);
    return T(x, y, s, g, fl);
  }
  function waves(x, y, s, n) {
    let g = "";
    for (let i = 0; i < (n || 3); i++) g += `<g data-act="blink" data-d="${0.5 + i * 0.12}">${S(`M${i * 34} ${-40 - i * 26} Q${36 + i * 46} 0 ${i * 34} ${40 + i * 26}`, C.am, 9)}</g>`;
    return T(x, y, s, g);
  }
  function screen(x, y, w, h, inner) {
    return shadow(x, y + h / 2 + 40, w * 0.4, 0.3) + Rc(x - w / 2 - 14, y - h / 2 - 14, w + 28, h + 28, 18, C.dk) + Rc(x - w / 2, y - h / 2, w, h, 8, C.n2) + (inner || "") + Rc(x - 10, y + h / 2 + 14, 20, 30, 4, C.dk) + Rc(x - 80, y + h / 2 + 40, 160, 12, 6, C.dk);
  }
  function phone(x, y, s, inner) {
    return T(x, y, s, shadow(0, 230, 110, 0.3) + Rc(-120, -220, 240, 440, 34, C.dk) + Rc(-106, -200, 212, 400, 22, C.n2) + Rc(-30, -212, 60, 8, 4, C.n3) + (inner || ""));
  }
  function post(x, y, w, hl, avatar) {
    return Rc(x - w / 2, y, w, 74, 12, hl ? C.n4 : C.n3) + Ci(x + w / 2 - 30, y + 37, 18, avatar || C.w2) + Rc(x - w / 2 + 16, y + 20, w - 84, 9, 4.5, C.w2) + Rc(x - w / 2 + 50, y + 42, w - 118, 8, 4, C.w3);
  }
  function chainLink(x, y, rot, col) {
    return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot})">${Rc(-46, -22, 92, 44, 22, "none", `stroke="${col || C.w2}" stroke-width="14"`)}${Rc(-46, -22, 92, 44, 22, "none", `stroke="#fff" stroke-opacity=".25" stroke-width="4" transform="translate(-2 -3)"`)}</g>`;
  }
  function magnifier(x, y, s) {
    return T(x, y, s, Rc(46, 46, 30, 120, 14, C.n2, 'transform="rotate(-45 61 106)"') + Ci(0, 0, 80, C.n6, 'opacity=".22"') + Ci(0, 0, 80, "none", `stroke="${C.w}" stroke-width="16"`) + P("M-46 -24 Q-36 -52 -8 -58", "none", `stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".6"`));
  }
  function gear(x, y, r, n, col) {
    const pts = [];
    for (let i = 0; i < n * 4; i++) {
      const a = (i / (n * 4)) * Math.PI * 2;
      const rr = i % 4 < 2 ? r : r * 0.82;
      pts.push(`${r1(Math.cos(a) * rr)} ${r1(Math.sin(a) * rr)}`);
    }
    return T(x, y, 1, P("M" + pts.join(" L") + "Z", col || C.w2) + Ci(0, 0, r * 0.62, shade(col || C.w2, -0.18)) + Ci(0, 0, r * 0.3, C.n2) + Ci(0, 0, r * 0.62, "none", `stroke="#fff" stroke-opacity=".15" stroke-width="4"`));
  }
  function cloud(x, y, s, col) {
    return T(x, y, s, P("M-120 40 Q-160 40 -156 0 Q-150 -40 -104 -36 Q-90 -100 -20 -92 Q30 -120 70 -64 Q130 -70 136 -14 Q150 40 100 40 Z", col || C.w3) + P("M-120 40 Q-160 40 -156 0 L136 -14 Q150 40 100 40 Z", "#000", 'opacity=".15"'));
  }
  function bolt(x, y, s, col) {
    return T(x, y, s, P("M12 -60 L-24 6 L4 6 L-12 60 L28 -12 L0 -12 Z", col || C.am) + P("M12 -60 L-24 6 L-8 6 Z", "#fff", 'opacity=".35"'));
  }
  function bubble(x, y, w, h, tail, col, inner) {
    const l = x - w / 2, t = y - h / 2, r = 22, tx = x + tail * w * 0.22;
    const d = `M${l + r} ${t} H${l + w - r} Q${l + w} ${t} ${l + w} ${t + r} V${t + h - r} Q${l + w} ${t + h} ${l + w - r} ${t + h} H${tx + 16} L${tx + tail * 34} ${t + h + 36} L${tx - 16} ${t + h} H${l + r} Q${l} ${t + h} ${l} ${t + h - r} V${t + r} Q${l} ${t} ${l + r} ${t} Z`;
    return P(d, "#000", 'opacity=".25" transform="translate(6 8)"') + P(d, col || C.w) + (inner || "");
  }
  function tag(x, y, text, o) {
    o = Object.assign({ bg: C.am, fg: C.navy, size: 34, pad: 28 }, o);
    if (!o.keep) x = 500 + (x - 500) * 0.72; // keep free-floating side chips close to the centre
    const w = text.length * o.size * 0.5 + o.pad * 2, h = o.size * 2.05;
    return Rc(x - w / 2 + 4, y - h / 2 + 6, w, h, h / 2, "#000", 'opacity=".22"') + Rc(x - w / 2, y - h / 2, w, h, h / 2, o.bg) + Tx(x, y + o.size * 0.22, text, o.size, o.fg, 600);
  }
  function arrow(x1, y1, x2, y2, col, w) {
    const a = Math.atan2(y2 - y1, x2 - x1), hs = (w || 10) * 2.6;
    return S(`M${r1(x1)} ${r1(y1)} L${r1(x2 - Math.cos(a) * hs * 0.6)} ${r1(y2 - Math.sin(a) * hs * 0.6)}`, col || C.am, w || 10) + P(`M${r1(x2)} ${r1(y2)} L${r1(x2 - Math.cos(a - 0.45) * hs)} ${r1(y2 - Math.sin(a - 0.45) * hs)} L${r1(x2 - Math.cos(a + 0.45) * hs)} ${r1(y2 - Math.sin(a + 0.45) * hs)} Z`, col || C.am);
  }
  function crack(pts, col, w) {
    return S("M" + pts.map((p) => p.join(" ")).join(" L"), col || C.am, w || 7);
  }
  function lock(x, y, s) {
    return T(x, y, s, S("M-34 -40 V-74 A34 34 0 0 1 34 -74 V-40", C.w2, 16) + Rc(-56, -46, 112, 96, 18, C.am) + Rc(-56, -46, 112, 18, 9, C.am3, 'opacity=".6"') + Ci(0, 0, 13, C.navy) + Rc(-5, 4, 10, 24, 4, C.navy));
  }
  function key(x, y, s) {
    return T(x, y, s, Ci(-60, 0, 36, "none", `stroke="${C.am}" stroke-width="18"`) + Rc(-26, -9, 140, 18, 9, C.am) + Rc(80, 0, 14, 34, 4, C.am) + Rc(104, 0, 14, 26, 4, C.am));
  }
  function shield(x, y, s) {
    return T(x, y, s, P("M0 -170 L140 -120 V-10 Q140 110 0 180 Q-140 110 -140 -10 V-120 Z", C.n4) + P("M0 -170 L140 -120 V-10 Q140 110 0 180 Z", "#000", 'opacity=".18"') + P("M0 -136 L112 -96 V-10 Q112 86 0 144 Q-112 86 -112 -10 V-96 Z", "none", `stroke="${C.am}" stroke-width="8"`) + star(0, -6, 64, C.am));
  }
  function star(x, y, r, col) {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; p.push(`${r1(x + Math.cos(a) * rr)} ${r1(y + Math.sin(a) * rr)}`); }
    return P("M" + p.join(" L") + "Z", col || C.am);
  }
  function hourglass(x, y, s) {
    return T(x, y, s, Rc(-110, -200, 220, 24, 8, "#8A5A35") + Rc(-110, 176, 220, 24, 8, "#8A5A35") + Rc(-96, -176, 12, 352, 6, "#7A4C2B") + Rc(84, -176, 12, 352, 6, "#7A4C2B") +
      P("M-72 -176 H72 Q72 -60 8 -6 L8 6 Q72 60 72 176 H-72 Q-72 60 -8 6 L-8 -6 Q-72 -60 -72 -176 Z", C.n6, 'opacity=".28"') + P("M-50 -110 H50 Q40 -50 4 -14 H-4 Q-40 -50 -50 -110 Z", C.am) + P("M-62 176 Q0 90 62 176 Z", C.am) + Rc(-2, -10, 4, 150, 2, C.am, 'data-act="blink" data-d="0.3"'));
  }
  function signpost(x, y, s) {
    return T(x, y, s, shadow(0, 0, 80, 0.3) + Rc(-12, -470, 24, 470, 8, "#8A5A35"));
  }
  function sign(dir, y, text, col) {
    const w = 270, d = dir > 0 ? `M0 ${y} H${w} L${w + 40} ${y + 36} L${w} ${y + 72} H0 Z` : `M0 ${y} H${-w} L${-w - 40} ${y + 36} L${-w} ${y + 72} H0 Z`;
    return P(d, col || C.w) + P(d, "#000", 'opacity=".12" transform="translate(0 6)"') + Tx(dir * (w / 2 + 10), y + 48, text, 34, C.navy, 900);
  }
  function domino(x, y, s, col) {
    return T(x, y, s, Rc(-38, -170, 76, 170, 12, col || C.w) + Rc(-38, -170, 76, 170, 12, "none", `stroke="${C.dk}" stroke-opacity=".25" stroke-width="4"`) + Rc(-28, -88, 56, 6, 3, C.n3) + Ci(0, -130, 9, C.n3) + Ci(-14, -46, 8, C.n3) + Ci(14, -30, 8, C.n3));
  }
  function door(x, y, s) {
    return T(x, y, s, Rc(-110, -380, 220, 380, 6, C.dk) + Rc(-96, -366, 192, 366, 4, C.am, 'opacity=".9"') + P("M-96 -366 H96 L60 0 H-96 Z", C.am3, 'opacity=".35"'));
  }
  function box(x, y, s) {
    return T(x, y, s, Rc(-60, -60, 120, 80, 6, "#B98A5E") + Rc(-60, -60, 120, 16, 4, "#9B6A42") + Rc(-14, -60, 28, 50, 3, "#D9B48A") + Rc(-24, -36, 48, 10, 3, C.w, 'opacity=".7"'));
  }
  function cliff(x, y, w, side) {
    const d = side < 0 ? `M${x - w} ${y} H${x} L${x - 30} ${y + 300} H${x - w} Z` : `M${x + w} ${y} H${x} L${x + 30} ${y + 300} H${x + w} Z`;
    return P(d, C.n3) + Rc(side < 0 ? x - w : x, y - 10, w, 20, 8, C.n5);
  }
  function node(x, y, r, col) { return Ci(x, y, r + 8, col || C.am, 'opacity=".18"') + Ci(x, y, r, col || C.am) + Ci(x - r * 0.3, y - r * 0.3, r * 0.3, "#fff", 'opacity=".35"'); }
  function spot(x, y, w, h) { return P(`M${x - 30} ${y} L${x + 30} ${y} L${x + w / 2} ${y + h} L${x - w / 2} ${y + h} Z`, C.am3, 'opacity=".12"') + El(x, y + h, w / 2, w * 0.08, C.am3, 'opacity=".18"'); }
  function puzzle(x, y, s, col, rot) {
    const d = "M-80 -80 H-20 Q-24 -110 0 -110 Q24 -110 20 -80 H80 V-20 Q110 -24 110 0 Q110 24 80 20 V80 H20 Q24 50 0 50 Q-24 50 -20 80 H-80 Z";
    return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot || 0}) scale(${s})">${P(d, "#000", 'opacity=".25" transform="translate(6 8)"')}${P(d, col || C.am)}${P(d, "#fff", 'opacity=".1" transform="translate(-4 -4) scale(.96)"')}</g>`;
  }
  function pie(x, y, r, a0, a1, col, dx, dy) {
    const p = (a) => `${r1(x + Math.cos(a) * r)} ${r1(y + Math.sin(a) * r)}`;
    return P(`M${x} ${y} L${p(a0)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)} Z`, col);
  }
  function plug(x, y, s) {
    return T(x, y, s, Rc(-70, -50, 120, 100, 20, C.w2) + Rc(50, -34, 40, 14, 4, C.am) + Rc(50, 20, 40, 14, 4, C.am) + S("M-70 0 Q-160 0 -200 60", C.w3, 18));
  }
  function socket(x, y, s) {
    return T(x, y, s, Rc(-20, -80, 120, 160, 24, C.n4) + Rc(-8, -36, 22, 16, 4, C.dk) + Rc(-8, 20, 22, 16, 4, C.dk) + S("M100 0 Q180 0 220 -60", C.w3, 18));
  }
  function bars(x, y, w, h, vals, col) {
    let g = Rc(x - w / 2, y, w, 6, 3, C.w3);
    const bw = w / (vals.length * 1.5);
    vals.forEach((v, i) => { const bx = x - w / 2 + bw * 0.3 + i * bw * 1.5; g += `<g data-in="grow" data-at="${(0.3 + i * 0.1).toFixed(2)}">${Rc(bx, y - h * v, bw, h * v, 6, i === vals.length - 1 ? C.am : col || C.n5)}</g>`; });
    return g;
  }
  function calendar(x, y, s) {
    return T(x, y, s, Rc(-90, -80, 180, 170, 14, C.w) + Rc(-90, -80, 180, 44, 14, C.am) + Rc(-60, -96, 14, 34, 7, C.n3) + Rc(46, -96, 14, 34, 7, C.n3) + [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => Rc(-70 + c * 38, -24 + r * 26, 24, 16, 4, (r * 4 + c) % 5 === 0 ? C.am : C.w2)).join("")).join(""));
  }
  function clock(x, y, r) {
    return Ci(x, y, r + 10, C.n3) + Ci(x, y, r, C.w) + S(`M${x} ${y} L${x} ${y - r * 0.6}`, C.navy, 8) + `<g data-act="spin" data-r="720">${S(`M${x} ${y} L${x + r * 0.75} ${y}`, C.am, 6)}</g>` + Ci(x, y, 8, C.navy);
  }
  function battery(x, y, s, lvl) {
    let g = Rc(-90, -44, 170, 88, 14, "none", `stroke="${C.w}" stroke-width="10"`) + Rc(84, -18, 14, 36, 5, C.w);
    for (let i = 0; i < 4; i++) g += `<g ${i >= lvl ? 'data-act="fade" data-t="' + (0.2 + (3 - i) * 0.15) + '" data-o="0.08"' : i === 0 ? 'data-act="blink" data-d="0.35"' : ""}>${Rc(-76 + i * 40, -30, 32, 60, 5, i === 0 ? C.am : C.w2)}</g>`;
    return T(x, y, s, g);
  }
  function ladder(x, y, h, s) {
    let g = Rc(-50, -h, 14, h, 6, "#8A5A35") + Rc(36, -h, 14, h, 6, "#8A5A35");
    for (let yy = -40; yy > -h; yy -= 52) g += Rc(-40, yy, 80, 10, 5, "#B98A5E");
    return T(x, y, s, g);
  }
  function hand(x, y, s, fl, sleeve) { // open hand pointing right, wrist at origin
    return T(x, y, s, Rc(-220, -36, 200, 72, 20, sleeve || C.n3) + Rc(-36, -40, 26, 80, 10, C.w) + P("M-14 -34 Q40 -46 74 -30 Q88 -22 76 -12 L36 -10 Q60 -4 60 8 Q60 20 40 20 Q52 30 40 40 Q24 48 -14 36 Z", C.sk) + S("M36 -10 Q16 -6 6 -2", C.sk2, 4), fl);
  }
  window.KIT = { C, W, T, P, S, Ci, El, Rc, Tx, shadow, shade, person, bust, crown, coin, coinStack, note, cash, moneyBag, globe, podium, table, chair, doc, folder, stampTool, mark, gavel, block, balanceBase, balanceBeam, pan, columnHall, flag, megaphone, waves, screen, phone, post, chainLink, magnifier, gear, cloud, bolt, bubble, tag, arrow, crack, lock, key, shield, star, hourglass, signpost, sign, domino, door, box, cliff, node, spot, puzzle, pie, plug, socket, bars, calendar, clock, battery, ladder, hand };
})();
