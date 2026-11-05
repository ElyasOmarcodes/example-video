/* One full-frame illustration per item (stage viewBox 0 0 1000 900, ground ≈ y 800).
   Built from lib/kit.js. Timing hooks: in/at (entrance, seconds after scene start), tin (entrance at a fraction of the
   spoken line), act/t (action at a fraction of the spoken line). */
(function () {
  const K = window.KIT, C = K.C;
  const w = (inner, o) => K.W(inner, o);
  const P = K.person, B = K.bust;
  const floor = (y, op) => K.El(500, y || 800, 470, 46, C.n3, `opacity="${op || 0.35}"`) + K.El(500, y || 800, 300, 26, C.n4, 'opacity=".25"');
  const q = (x, y, s, col) => K.T(x, y, s || 1, K.Tx(0, 0, "؟", 110, col || C.am, 900));
  const spark = (x, y, s) => K.T(x, y, s || 1, [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="${Math.cos((a * Math.PI) / 180) * 18}" y1="${Math.sin((a * Math.PI) / 180) * 18}" x2="${Math.cos((a * Math.PI) / 180) * 42}" y2="${Math.sin((a * Math.PI) / 180) * 42}" stroke="${C.am3}" stroke-width="7" stroke-linecap="round"/>`).join(""));
  const crowd = (y, n, s, op, seed) => { let g = ""; for (let i = 0; i < n; i++) g += B({ x: 70 + (i * 860) / (n - 1), y: y + (i % 2) * 14, s: s, suit: [C.n3, C.n4, "#3B4466", C.n5][(i + (seed || 0)) % 4], beard: (i + (seed || 0)) % 3 === 0, cap: (i + (seed || 0)) % 5 === 2, op: op || 1 }); return g; };
  const S = {};

  // ================= PART 1: CAUSES =================
  S.p1_1 = () =>
    w(K.Rc(230, 640, 540, 170, 10, C.n3) + K.Rc(230, 640, 540, 14, 6, C.n4), { in: "grow", at: 0.05 }) +
    w(K.Rc(320, 520, 360, 130, 10, C.n4) + K.Rc(320, 520, 360, 12, 6, C.n5), { in: "grow", at: 0.15 }) +
    w(K.Rc(400, 410, 200, 120, 10, C.n5) + K.Rc(400, 410, 200, 12, 6, C.n6), { in: "grow", at: 0.25 }) +
    w(K.spot(500, 0, 440, 410), { in: "fade", at: 0.5, act: "pulse", s: 1.04 }) +
    w(P({ x: 500, y: 412, s: 0.78, pose: "cross", beard: true, glow: true, suit: C.n2 }), { in: "drop", at: 0.35 }) +
    w(K.crown(500, 54, 0.42), { in: "pop", at: 0.8, act: "float", y: 8 }) +
    w(K.tag(210, 330, "رهبري"), { in: "pop", tin: 0.12 }) +
    w(K.tag(790, 330, "تصمیم نیونه"), { in: "pop", tin: 0.32 }) +
    w(crowd(905, 7, 0.82, 1, 1), { in: "up", at: 0.3, act: "fade", t: 0.55, o: 0.4 }) +
    w(K.Rc(70, 690, 14, 120, 6, C.am2) + K.Rc(916, 690, 14, 120, 6, C.am2) + K.S("M84 708 Q300 760 500 716 Q700 760 916 708", C.am, 10), { in: "draw", tin: 0.5 }) +
    w(K.lock(500, 742, 0.62), { in: "pop", tin: 0.62 });

  S.p1_2 = () =>
    floor(800) +
    w(K.cash(110, 800, 150, 6) + K.coinStack(890, 800, 54, 6), { in: "up", at: 0.2 }) +
    w(P({ x: 215, y: 800, s: 0.86, pose: "pull", suit: C.n4 }) + P({ x: 785, y: 800, s: 0.86, pose: "pull", fl: -1, beard: true, suit: "#3B4466" }) +
      K.S("M330 596 Q400 560 452 520 M548 520 Q600 560 670 596", C.w2, 8) + K.moneyBag(500, 700, 1.15), { in: "fade", at: 0.1, act: "tug", x: 16 }) +
    w(K.note(330, 300, 150, -18), { in: "pop", tin: 0.15, act: "float", y: 14 }) +
    w(K.note(680, 250, 140, 14), { in: "pop", tin: 0.4, act: "float", y: 12 }) +
    w(K.coin(420, 180, 34) + K.coin(600, 410, 26), { in: "pop", tin: 0.6, act: "float", y: 10 }) +
    w(K.tag(500, 110, "بهرنۍ مرستې"), { in: "pop", tin: 0.08 }) +
    w(K.tag(190, 200, "بودیجه"), { in: "pop", tin: 0.38 });

  S.p1_3 = () => {
    const target = K.Ci(0, 0, 110, C.w) + K.Ci(0, 0, 80, C.n4) + K.Ci(0, 0, 50, C.w) + K.Ci(0, 0, 22, C.am) + K.Rc(-6, 110, 12, 160, 6, C.w3);
    const gem = K.P("M-90 -40 L-50 -90 H50 L90 -40 L0 80 Z", C.am) + K.P("M-90 -40 H90 L0 80 Z", C.am2) + K.P("M-50 -90 L-24 -40 L0 80 L24 -40 L50 -90 Z", C.am3, 'opacity=".55"') + K.P("M-30 -78 L-14 -50", "none", 'stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".7"');
    return floor(800) +
      w(K.T(250, 330, 1, target), { in: "zoom", at: 0.2, act: "fade", t: 0.6, o: 0.35 }) +
      w(P({ x: 130, y: 800, s: 0.72, pose: "raise", suit: C.n4 }) + P({ x: 250, y: 800, s: 0.72, suit: C.n3, beard: true }) + P({ x: 370, y: 800, s: 0.72, pose: "point", suit: "#3B4466" }), { in: "left", at: 0.1, act: "fade", t: 0.62, o: 0.45 }) +
      w(K.tag(250, 150, "ګډې موخې", { bg: C.w, keep: 1 }), { in: "pop", tin: 0.05 }) +
      w(K.T(760, 470, 1, gem), { in: "drop", tin: 0.3, act: "pulse", s: 1.07 }) +
      w(spark(760, 340, 0.8), { in: "pop", tin: 0.4, act: "blink", d: 0.4 }) +
      w(P({ x: 760, y: 800, s: 0.86, pose: "hold", fl: -1, suit: C.n2, beard: true, glow: true }), { in: "right", at: 0.25 }) +
      w(K.tag(760, 175, "شخصي ګټې", { keep: 1 }), { in: "pop", tin: 0.38 }) +
      w(K.arrow(420, 470, 620, 470, C.am, 12), { in: "growx", tin: 0.5 });
  };

  S.p1_4 = () =>
    w(K.globe(500, 230, 150), { in: "zoom", at: 0.1 }) +
    w(K.S("M420 350 Q300 450 250 560", C.am, 6, 'stroke-dasharray="14 14"') + K.S("M580 350 Q700 450 750 560", C.am, 6, 'stroke-dasharray="14 14"'), { in: "fade", at: 0.5, act: "march" }) +
    floor(800) +
    w(P({ x: 230, y: 800, s: 0.84, pose: "point", suit: C.n4 }), { in: "left", at: 0.2 }) +
    w(P({ x: 770, y: 800, s: 0.84, pose: "point", fl: -1, beard: true, suit: "#3B4466" }), { in: "right", at: 0.3 }) +
    w(K.bolt(500, 560, 1.3), { in: "pop", tin: 0.55, act: "pulse", s: 1.15 }) +
    w(spark(500, 560, 1.1), { in: "pop", tin: 0.58, act: "blink", d: 0.3 }) +
    w(K.tag(185, 120, "تمویلوونکي"), { in: "pop", tin: 0.15 }) +
    w(K.tag(815, 120, "سیاسي سرچینې"), { in: "pop", tin: 0.35 }) +
    w(K.bubble(250, 360, 120, 80, 1, C.w, K.Tx(250, 380, "!", 54, C.navy, 900)), { in: "pop", tin: 0.7 }) +
    w(K.bubble(750, 360, 120, 80, -1, C.w, K.Tx(750, 380, "!", 54, C.navy, 900)), { in: "pop", tin: 0.78 });

  S.p1_5 = () => {
    const d = K.doc(0, 0, 300, 360, 0, "اجنډا");
    const defs = `<defs><clipPath id="c15l"><path d="M-200 -220 H8 L-12 -100 L14 0 L-10 100 L6 220 H-200 Z"/></clipPath><clipPath id="c15r"><path d="M200 -220 H8 L-12 -100 L14 0 L-10 100 L6 220 H200 Z"/></clipPath></defs>`;
    return defs + K.table(500, 620, 760) +
      w(B({ x: 250, y: 620, s: 0.9, suit: C.n4 }) + B({ x: 410, y: 610, s: 0.9, beard: true, suit: C.n3 }) + B({ x: 590, y: 610, s: 0.9, cap: true, suit: "#3B4466" }) + B({ x: 750, y: 620, s: 0.9, suit: C.n5 }), { in: "up", at: 0.15 }) +
      w(K.T(500, 380, 1, `<g clip-path="url(#c15l)">${d}</g>`), { in: "drop", at: 0.3, act: "move", t: 0.35, x: -150, y: 40, r: -16 }) +
      w(K.T(500, 380, 1, `<g clip-path="url(#c15r)">${d}</g>`), { in: "drop", at: 0.3, act: "move", t: 0.35, x: 150, y: 40, r: 16 }) +
      w(K.arrow(250, 440, 120, 300, C.am, 10), { in: "growx", tin: 0.45 }) + w(K.arrow(410, 430, 360, 250, C.w, 10), { in: "growx", tin: 0.52 }) +
      w(K.arrow(590, 430, 650, 250, C.am, 10), { in: "growx", tin: 0.6 }) + w(K.arrow(750, 440, 880, 300, C.w, 10), { in: "growx", tin: 0.68 }) +
      w(K.Ci(500, 110, 70, C.n3) + K.Ci(500, 110, 56, C.n2) + K.Tx(500, 70, "N", 20, C.w3, 900), { in: "pop", at: 0.2 }) +
      w(K.P("M500 64 L512 110 L500 156 L488 110 Z", C.am), { in: "pop", at: 0.3, act: "spin", r: 900 }) +
      w(K.tag(500, 230, "ګډه ستراتیژي", { bg: C.w }), { in: "pop", tin: 0.55, act: "fade", t: 0.85, o: 0.35 });
  };

  S.p1_6 = () =>
    w(K.S("M500 250 V300 M290 300 H710 M290 300 V330 M500 300 V330 M710 300 V330", C.w3, 6), { in: "draw", at: 0.4 }) +
    w(B({ x: 500, y: 250, s: 1.05, suit: C.n2, beard: true }) + K.crown(500, 64, 0.3), { in: "drop", at: 0.1 }) +
    w(B({ x: 290, y: 470, s: 0.85, suit: C.n4 }), { in: "pop", at: 0.55 }) + w(B({ x: 500, y: 470, s: 0.85, suit: C.n3, beard: true }), { in: "pop", at: 0.65 }) + w(B({ x: 710, y: 470, s: 0.85, suit: C.n4, cap: true }), { in: "pop", at: 0.75 }) +
    w(K.Ci(500, 160, 140, C.am, 'opacity=".08"'), { in: "fade", at: 0.3, act: "pulse", s: 1.1 }) +
    w(K.S("M290 470 L400 690 M500 470 L500 690 M710 470 L600 690", C.am, 4, 'stroke-dasharray="8 10"'), { in: "draw", tin: 0.3, act: "march" }) +
    K.table(500, 700, 620) +
    w(K.doc(430, 650, 140, 110, -8) + K.doc(570, 650, 140, 110, 6), { in: "up", tin: 0.4 }) +
    w(K.tag(500, 590, "تشکیلاتي پرېکړې"), { in: "pop", tin: 0.55 }) +
    w(K.mark(570, 650, 0.6, "v"), { in: "pop", tin: 0.75 }) +
    w(B({ x: 90, y: 905, s: 0.75, suit: "#3B4466", op: 0.6 }) + B({ x: 910, y: 905, s: 0.75, suit: C.n3, op: 0.6 }), { in: "up", at: 0.3 }) +
    w(K.tag(160, 120, "نږدې کړۍ", { bg: C.w, size: 30 }), { in: "pop", tin: 0.2 });

  S.p1_7 = () =>
    floor(800) +
    w(P({ x: 395, y: 800, s: 0.9, pose: "shake", suit: C.n4 }), { in: "left", at: 0.1, act: "move", t: 0.55, x: -30 }) +
    w(P({ x: 605, y: 800, s: 0.9, pose: "shake", fl: -1, beard: true, suit: "#3B4466" }), { in: "right", at: 0.1, act: "move", t: 0.55, x: 30 }) +
    w(K.bubble(300, 210, 130, 110, 1, C.w, K.Tx(300, 250, "؟", 80, C.navy, 900)), { in: "pop", tin: 0.15 }) +
    w(K.bubble(700, 210, 130, 110, -1, C.w, K.Tx(700, 250, "؟", 80, C.navy, 900)), { in: "pop", tin: 0.3 }) +
    w(K.El(500, 110, 70, 38, C.w) + K.Ci(500, 110, 28, C.n4) + K.Ci(500, 110, 13, C.dk) + K.Ci(508, 102, 5, "#fff"), { in: "pop", tin: 0.35, act: "blink", d: 0.6 }) +
    w(K.crack([[500, 800], [480, 830], [516, 856], [490, 890]], C.am, 8), { in: "draw", tin: 0.55 }) +
    w(K.tag(160, 420, "بې‌باوري"), { in: "pop", tin: 0.2 }) +
    w(K.tag(840, 420, "شک"), { in: "pop", tin: 0.45 });

  S.p1_8 = () =>
    w(K.Rc(380, 500, 240, 300, 8, C.n3) + K.Rc(380, 500, 240, 14, 6, C.n4) + K.Rc(360, 790, 280, 20, 6, C.n4), { in: "grow", at: 0.05 }) +
    w(K.chair(500, 500, 0.9, true), { in: "drop", at: 0.25 }) +
    w(K.star(500, 170, 40, C.am3), { in: "pop", at: 0.5, act: "pulse", s: 1.2 }) +
    w(K.tag(500, 70, "مشري"), { in: "pop", tin: 0.05 }) +
    K.ladder(300, 800, 330, 1) + K.ladder(700, 800, 330, 1) +
    w(P({ x: 250, y: 830, s: 0.66, pose: "reach", suit: C.n4 }), { in: "left", at: 0.2, act: "move", t: 0.15, x: 40, y: -90, d: 2.2 }) +
    w(P({ x: 750, y: 830, s: 0.66, pose: "reach", fl: -1, beard: true, suit: "#3B4466" }), { in: "right", at: 0.3, act: "move", t: 0.2, x: -40, y: -90, d: 2.2 }) +
    w(K.bolt(500, 650, 1.0), { in: "pop", tin: 0.62, act: "pulse", s: 1.2 }) +
    w(K.tag(150, 250, "نفوذ", { bg: C.w }), { in: "pop", tin: 0.25 }) +
    w(K.tag(850, 250, "سیاسي موقف", { bg: C.w }), { in: "pop", tin: 0.5 });

  S.p1_9 = () =>
    w(K.globe(860, 110, 64), { in: "zoom", at: 0.1 }) +
    w(K.doc(500, 400, 340, 440, 0, "غوښتنې"), { in: "drop", at: 0.15 }) +
    w(K.mark(410, 470, 1.15, "v"), { in: "slam", tin: 0.34 }) +
    w(K.mark(590, 470, 1.15, "x"), { in: "slam", tin: 0.66 }) +
    floor(830, 0.3) +
    w(P({ x: 120, y: 830, s: 0.78, pose: "point", suit: C.n4 }), { in: "left", at: 0.2 }) +
    w(P({ x: 880, y: 830, s: 0.78, pose: "point", fl: -1, beard: true, suit: "#3B4466" }), { in: "right", at: 0.25 }) +
    w(K.tag(130, 380, "منل"), { in: "pop", tin: 0.32 }) + w(K.tag(870, 380, "ردول", { bg: C.w }), { in: "pop", tin: 0.64 }) +
    w(K.bolt(500, 660, 0.9), { in: "pop", tin: 0.75, act: "pulse", s: 1.2 });

  S.p1_10 = () => {
    const row = (y, label, t) => w(K.Tx(640, y + 30, label, 34, C.navy, 900) + K.Rc(330, y + 6, 200, 34, 8, C.w2), { in: "fade", tin: t - 0.1 }) + w(K.Rc(320, y, 220, 46, 8, C.dk), { in: "growx", tin: t });
    return w(K.Rc(250, 150, 500, 560, 22, C.w) + K.Rc(250, 150, 500, 80, 22, C.am) + K.Rc(250, 210, 500, 20, 0, C.am) + K.Tx(500, 210, "حساب", 46, C.navy, 900) + K.Rc(258, 158, 500, 560, 22, "#000", 'opacity=".2" style="mix-blend-mode:multiply"'), { in: "drop", at: 0.1 }) +
      row(280, "عواید", 0.15) + row(400, "لګښتونه", 0.35) + row(520, "مرستې", 0.55) +
      w(K.magnifier(330, 330, 0.9), { in: "pop", at: 0.5, act: "move", t: 0.2, x: 340, y: 260, d: 2.6 }) +
      w(q(140, 330, 1), { in: "pop", tin: 0.45, act: "float", y: 12 }) + w(q(870, 260, 0.8), { in: "pop", tin: 0.65, act: "float", y: 10 }) +
      w(K.Rc(700, 760, 220, 70, 12, C.n3) + K.Rc(700, 760, 220, 14, 7, C.n5) + K.Rc(770, 790, 80, 12, 6, C.n2) + K.El(810, 762, 90, 12, C.dk), { in: "fade", at: 0.4 }) +
      w(K.coin(760, 640, 30), { in: "pop", at: 0.6, act: "fall", t: 0.5, y: 120 }) + w(K.coin(840, 600, 26), { in: "pop", at: 0.7, act: "fall", t: 0.62, y: 160 });
  };

  S.p1_11 = () => {
    const piv = "500 300";
    const heavy = K.Rc(-340, 92, 120, 46, 8, C.am) + K.Rc(-330, 50, 100, 46, 8, C.am3) + K.star(-280, 30, 26, C.w);
    const light = K.box(280, 140, 0.55);
    return floor(800) + K.balanceBase(500, 800, 1.0).replace("translate(500 800)", "translate(500 800)") +
      w(K.T(500, 300, 1, K.pan(-280, 1, heavy)), { in: "fade", at: 0.3, act: "move", t: 0.25, y: 62, x: 6, d: 1.4 }) +
      w(K.T(500, 300, 1, K.pan(280, 1, light)), { in: "fade", at: 0.3, act: "move", t: 0.25, y: -62, x: -6, d: 1.4 }) +
      w(K.T(500, 300, 1, K.balanceBeam()), { in: "fade", at: 0.25, act: "tilt1", t: 0.25, r: -12, o: piv }) +
      w(K.tag(220, 170, "امتیازات"), { in: "pop", tin: 0.4 }) +
      w(K.tag(780, 120, "مسؤلیتونه", { bg: C.w }), { in: "pop", tin: 0.6 }) +
      w(P({ x: 110, y: 800, s: 0.66, pose: "hips", suit: C.n2, beard: true }), { in: "left", at: 0.3 }) +
      w(P({ x: 890, y: 800, s: 0.66, pose: "carry", fl: -1, suit: "#3B4466" }) + K.box(872, 670, 0.9), { in: "right", at: 0.35 });
  };

  S.p1_12 = () =>
    w(K.Rc(200, 120, 600, 520, 18, C.n6, 'opacity=".14"') + K.Rc(200, 120, 600, 520, 18, "none", `stroke="${C.n6}" stroke-width="6" stroke-opacity=".5"`) + K.S("M260 170 L330 240 M300 170 L420 290", "#fff", 6, 'stroke-opacity=".25"'), { in: "zoom", at: 0.1 }) +
    K.table(500, 480, 380) +
    w(P({ x: 500, y: 480, s: 0.62, pose: "cross", suit: C.n2, beard: true, legs: false, sh: false }), { in: "up", at: 0.25 }) +
    w(K.block(640, 470, 0.4), { in: "fade", at: 0.3 }) +
    w(K.T(0, 0, 1, K.gavel(660, 360, 0.5)), { in: "pop", at: 0.4, act: "strike", o: "660 430", r: -28 }) +
    w(K.lock(780, 640, 0.6), { in: "pop", tin: 0.35 }) +
    w(K.tag(500, 90, "مهمې پرېکړې"), { in: "pop", tin: 0.1 }) +
    w(P({ x: 170, y: 1010, s: 0.72, pose: "raise", suit: C.n4 }) + P({ x: 390, y: 1030, s: 0.72, pose: "raise", suit: "#3B4466", beard: true }) + P({ x: 610, y: 1030, s: 0.72, pose: "both", suit: C.n3 }) + P({ x: 830, y: 1010, s: 0.72, pose: "raise", fl: -1, suit: C.n5 }), { in: "up", at: 0.2, act: "fade", t: 0.6, o: 0.55 }) +
    w(K.Rc(150, 660, 700, 14, 7, C.am), { in: "growx", tin: 0.55 }) +
    w(K.tag(500, 600, "ګډون نشته", { bg: C.w }), { in: "pop", tin: 0.7 });

  S.p1_13 = () =>
    w(K.globe(500, 100, 80), { in: "zoom", at: 0.1 }) +
    w(K.T(0, 0, 1, K.hand(500, 260, 1.2, 1).replace(/translate\(500 260\) scale\(1.2 1.2\)/, "translate(560 250) rotate(90) scale(1.1)")) + K.moneyBag(500, 420, 0.75), { in: "down", at: 0.3, act: "float", y: 10 }) +
    floor(830, 0.3) +
    w(P({ x: 210, y: 830, s: 0.8, pose: "reach", suit: C.n4 }), { in: "left", at: 0.2, act: "tug", x: 10 }) +
    w(P({ x: 500, y: 860, s: 0.8, pose: "both", suit: "#3B4466", beard: true }), { in: "up", at: 0.3, act: "tug", x: 8 }) +
    w(P({ x: 790, y: 830, s: 0.8, pose: "reach", fl: -1, suit: C.n3, cap: true }), { in: "right", at: 0.25, act: "tug", x: 10 }) +
    w(K.tag(200, 250, "سیاسي ملاتړ"), { in: "pop", tin: 0.15 }) + w(K.tag(800, 250, "مالي ملاتړ"), { in: "pop", tin: 0.35 });

  S.p1_14 = () =>
    w(K.cliff(330, 560, 340, -1) + K.cliff(670, 560, 340, 1), { in: "up", at: 0.05 }) +
    w(P({ x: 150, y: 560, s: 0.58, pose: "hips", suit: C.n4 }) + P({ x: 250, y: 560, s: 0.58, suit: "#3B4466", beard: true }), { in: "left", at: 0.2 }) +
    w(P({ x: 850, y: 560, s: 0.58, pose: "hips", fl: -1, suit: C.n3 }) + P({ x: 750, y: 560, s: 0.58, fl: -1, suit: C.n5, cap: true }), { in: "right", at: 0.25 }) +
    w(K.S("M330 560 Q500 600 670 560", C.w3, 5), { in: "draw", at: 0.3 }) +
    [0, 1, 2, 3, 4].map((i) => w(K.Rc(350 + i * 62, 560 + Math.sin((i + 0.5) / 5 * Math.PI) * 30, 50, 22, 4, "#9B6A42"), i % 2 ? { in: "fade", at: 0.35 + i * 0.05, act: "fall", t: 0.25 + i * 0.1, y: 420 } : { in: "fade", at: 0.35 + i * 0.05 })).join("") +
    w(K.gear(500, 260, 92, 10, C.w2), { in: "zoom", at: 0.3, act: "spinstop", t: 0.5, r: 70 }) +
    w(K.crack([[440, 190], [482, 240], [462, 286], [520, 340]], C.am, 9), { in: "draw", tin: 0.52 }) +
    w(K.tag(500, 120, "منظمه تګلاره", { bg: C.w }), { in: "pop", tin: 0.6 }) +
    w(K.S("M380 110 L620 130", C.am, 10), { in: "growx", tin: 0.75 });

  // ================= PART 2: CONSEQUENCES =================
  S.p2_1 = () => {
    const piece = (d, ppl) => K.P(d, C.n4) + K.P(d, "#000", 'opacity=".25" transform="translate(0 22)"') + K.P(d, C.n5, 'opacity=".55" transform="translate(0 -4) scale(1 .98)"') + ppl;
    return w(piece("M500 500 L250 520 Q120 600 210 700 L480 720 L470 640 Z", B({ x: 300, y: 640, s: 0.6, suit: C.n3 }) + B({ x: 390, y: 660, s: 0.6, suit: "#3B4466", beard: true })), { in: "up", at: 0.1, act: "move", t: 0.25, x: -70, y: 30, r: -6 }) +
      w(piece("M500 500 L750 520 Q880 600 790 700 L520 720 L530 640 Z", B({ x: 700, y: 640, s: 0.6, suit: C.n4 }) + B({ x: 610, y: 660, s: 0.6, suit: C.n5 })), { in: "up", at: 0.15, act: "move", t: 0.25, x: 70, y: 30, r: 6 }) +
      w(piece("M500 500 L250 520 Q330 440 500 420 Q670 440 750 520 Z", B({ x: 500, y: 500, s: 0.6, suit: C.n2, cap: true })), { in: "up", at: 0.2, act: "move", t: 0.25, y: -80 }) +
      w(K.flag(470, 470, 0.55, C.am), { in: "pop", at: 0.5, act: "fall", t: 0.3, y: 260 }) +
      w(K.crack([[500, 420], [520, 480], [490, 560], [510, 640], [500, 720]], C.am, 8), { in: "draw", tin: 0.18 }) +
      w(K.flag(170, 610, 0.42, C.w), { in: "pop", tin: 0.6 }) + w(K.flag(830, 610, 0.42, C.am3), { in: "pop", tin: 0.7 }) + w(K.flag(490, 330, 0.42, C.n6), { in: "pop", tin: 0.8 }) +
      w(K.tag(500, 120, "اصلي جبهه"), { in: "pop", tin: 0.05, act: "fade", t: 0.5, o: 0.3 }) +
      w(K.tag(500, 860, "نوې ډلې", { bg: C.w }), { in: "pop", tin: 0.62 });
  };

  S.p2_2 = () =>
    w(crowd(905, 7, 0.75, 1, 2), { in: "up", at: 0.2, act: "fade", t: 0.35, o: 0.35 }) +
    w(P({ x: 470, y: 600, s: 1.0, pose: "raise", suit: C.n2, beard: true, legs: false, sh: false }), { in: "up", at: 0.1 }) +
    w(K.podium(470, 780, 1.1), { in: "up", at: 0.05 }) +
    w(K.crown(470, 150, 0.45), { in: "pop", at: 0.5, act: "fall", t: 0.4, y: 380 }) +
    w(K.Rc(780, 160, 170, 220, 16, C.n2) + K.Tx(865, 205, "نفوذ", 30, C.w, 900), { in: "zoom", at: 0.3 }) +
    [0, 1, 2, 3].map((i) => w(K.Rc(800 + i * 38, 360 - (i + 1) * 34, 26, (i + 1) * 34, 5, i < 1 ? C.am : C.w2), i >= 1 ? { in: "grow", at: 0.4 + i * 0.08, act: "fade", t: 0.3 + (3 - i) * 0.12, o: 0.12 } : { in: "grow", at: 0.4, act: "blink", d: 0.4 })).join("") +
    w(K.arrow(150, 200, 150, 380, C.am, 12), { in: "pop", tin: 0.55 }) +
    w(K.tag(180, 140, "تصمیم نیونه", { bg: C.w, size: 30 }), { in: "pop", tin: 0.45 });

  S.p2_3 = () =>
    floor(800) + w(K.Rc(40, 260, 300, 540, 8, C.n3) + K.Rc(40, 260, 300, 40, 8, C.n4) + K.door(190, 800, 0.95), { in: "left", at: 0.05 }) +
    w(K.Rc(80, 300, 220, 50, 8, C.am) + K.Tx(190, 336, "تشکیلات", 34, C.navy, 900), { in: "pop", at: 0.3 }) +
    w(P({ x: 300, y: 800, s: 0.72, pose: "carry", suit: C.n4 }) + K.box(300, 640, 0.75), { in: "fade", at: 0.3, act: "move", t: 0.05, x: 520, d: 3.2 }) +
    w(P({ x: 190, y: 800, s: 0.72, pose: "carry", suit: "#3B4466", beard: true }) + K.box(190, 640, 0.75), { in: "fade", at: 0.4, act: "move", t: 0.32, x: 480, d: 3 }) +
    w(K.Rc(560, 780, 60, 40, 6, C.w) + K.Rc(570, 790, 22, 18, 3, C.am), { in: "pop", tin: 0.5 }) +
    w(K.arrow(560, 300, 900, 300, C.am, 12), { in: "growx", tin: 0.2 }) +
    w(K.tag(740, 220, "جلا کېدل", { bg: C.w }), { in: "pop", tin: 0.25 }) +
    w(K.tag(740, 420, "مهم غړي"), { in: "pop", tin: 0.1 });

  S.p2_4 = () =>
    w(P({ x: 300, y: 830, s: 0.7, fl: -1, suit: C.n4 }), { in: "fade", at: 0.4, act: "fade", t: 0.6, o: 0.5 }) + w(P({ x: 700, y: 830, s: 0.7, suit: "#3B4466", beard: true }), { in: "fade", at: 0.45, act: "fade", t: 0.6, o: 0.5 }) +
    w(K.hand(440, 420, 1.3, 1, C.n4), { in: "left", at: 0.1, act: "move", t: 0.3, x: -160, r: -8, d: 0.8 }) +
    w(K.hand(560, 420, 1.3, -1, C.n5), { in: "right", at: 0.1, act: "move", t: 0.3, x: 160, r: 8, d: 0.8 }) +
    w(K.bolt(500, 420, 1.6), { in: "pop", tin: 0.32, act: "pulse", s: 1.12 }) + w(spark(500, 420, 1.6), { in: "pop", tin: 0.33, act: "blink", d: 0.25 }) +
    w(K.tag(220, 150, "پخواني متحدین", { bg: C.w }), { in: "pop", tin: 0.05 }) +
    w(K.tag(780, 150, "بې‌باوري"), { in: "pop", tin: 0.5 });

  S.p2_5 = () => {
    const cx = 500, cy = 420, r = 230;
    const sl = [[-1.57, 0.2, C.am, 1], [0.2, 1.7, C.w, 2], [1.7, 3.1, C.n5, 3], [3.1, 4.71, C.am3, 4]];
    return w(K.Ci(cx, cy + 16, r, "#000", 'opacity=".3"'), { in: "fade", at: 0.1 }) +
      sl.map(([a, b, col], i) => { const m = (a + b) / 2; return w(K.pie(cx, cy, r, a, b, col), { in: "zoom", at: 0.15 + i * 0.07, act: "move", t: 0.25 + i * 0.06, x: Math.round(Math.cos(m) * 110), y: Math.round(Math.sin(m) * 110), d: 1 }); }).join("") +
      w(K.Ci(cx, cy, 90, C.navy) + K.Tx(cx, cy + 14, "بودیجه", 40, C.w, 900), { in: "pop", at: 0.4 }) +
      w(K.hand(80, 300, 0.9, 1, C.n4), { in: "left", tin: 0.3 }) + w(K.hand(920, 300, 0.9, -1, C.n3), { in: "right", tin: 0.35 }) +
      w(K.hand(80, 640, 0.9, 1, "#3B4466"), { in: "left", tin: 0.45 }) + w(K.hand(920, 640, 0.9, -1, C.n5), { in: "right", tin: 0.5 }) +
      w(K.tag(500, 800, "بهرنۍ مالي مرستې", { bg: C.w }), { in: "pop", tin: 0.25 }) +
      w(K.tag(500, 80, "سیالۍ زیاتېږي"), { in: "pop", tin: 0.8 });
  };

  S.p2_6 = () => {
    const chart = K.Rc(250, 120, 600, 400, 16, C.n2) + [0, 1, 2, 3].map((i) => K.Rc(280, 170 + i * 90, 540, 2, 1, C.n4)).join("");
    return w(K.screen(550, 320, 600, 400, chart), { in: "zoom", at: 0.1 }) +
      w(K.S("M290 200 L400 230 L500 320 L600 340 L700 430 L800 470", C.am, 12), { in: "draw", tin: 0.15 }) +
      w(K.P("M790 430 L830 476 L776 492 Z", C.am), { in: "pop", tin: 0.55 }) +
      w(K.megaphone(150, 640, 1.0, -1) + K.waves(60, 640, 0.9, 3).replace("translate(60 640) scale(0.9 0.9)", "translate(60 640) scale(-0.9 0.9)"), { in: "left", at: 0.3, act: "fade", t: 0.55, o: 0.3 }) +
      w(K.tag(420, 640, "سیاسي دریځ", { bg: C.w }), { in: "pop", tin: 0.35 }) +
      w(K.tag(720, 720, "اغېزمنتیا"), { in: "pop", tin: 0.55 }) +
      w(K.arrow(880, 580, 880, 800, C.am, 14), { in: "pop", tin: 0.7 });
  };

  S.p2_7 = () =>
    w(K.P("M420 900 L470 520 L530 520 L580 900 Z", C.n3) + K.P("M470 520 L300 200 L350 190 L500 470 Z", C.n3) + K.P("M530 520 L700 200 L650 190 L500 470 Z", C.n3) + K.P("M490 500 L500 170 L512 170 L510 500 Z", C.n3) +
      K.S("M500 880 L500 540", C.am, 6, 'stroke-dasharray="26 22"') + K.S("M480 500 L330 210", C.w, 5, 'stroke-dasharray="20 20"') + K.S("M520 500 L670 210", C.w, 5, 'stroke-dasharray="20 20"'), { in: "up", at: 0.05 }) +
    w(K.signpost(500, 560, 0.5) + K.T(500, 560, 0.5, K.sign(1, -440, "") + K.sign(-1, -350, "")), { in: "pop", at: 0.3 }) +
    w(B({ x: 330, y: 330, s: 0.55, suit: C.n4 }), { in: "fade", tin: 0.3, act: "move", t: 0.35, x: -50, y: -90, d: 2 }) +
    w(B({ x: 670, y: 330, s: 0.55, suit: "#3B4466", beard: true }), { in: "fade", tin: 0.4, act: "move", t: 0.45, x: 50, y: -90, d: 2 }) +
    w(B({ x: 505, y: 330, s: 0.55, suit: C.n5 }), { in: "fade", tin: 0.5, act: "move", t: 0.55, y: -110, d: 2 }) +
    w(K.flag(170, 520, 0.5, C.am), { in: "pop", tin: 0.05, act: "fade", t: 0.3, o: 0.25 }) +
    w(K.tag(220, 620, "واحد دریځ", { bg: C.w }), { in: "pop", tin: 0.1, act: "fade", t: 0.32, o: 0.3 }) +
    w(K.tag(790, 620, "بېلابېلې تګلارې"), { in: "pop", tin: 0.7 });

  S.p2_8 = () => {
    const frame = (x, inner) => K.Rc(x - 200, 140, 400, 360, 16, C.dk) + K.Rc(x - 186, 154, 372, 332, 10, C.n3) + inner + K.Rc(x - 186, 440, 372, 46, 0, C.am, 'opacity=".9"');
    return w(frame(270, B({ x: 270, y: 440, s: 1.3, suit: C.n4 }) + K.Tx(270, 474, "", 26, C.navy, 900)), { in: "left", at: 0.05 }) +
      w(frame(730, B({ x: 730, y: 440, s: 1.3, suit: "#3B4466", beard: true })), { in: "right", at: 0.1 }) +
      w(K.Rc(80, 120, 120, 40, 8, C.am) + K.Tx(140, 150, "ژوندی", 26, C.navy, 900), { in: "pop", at: 0.4, act: "blink", d: 0.6 }) +
      w(K.bubble(330, 640, 260, 100, 1, C.w, K.Tx(330, 656, "تورونه", 40, C.navy, 700)), { in: "pop", tin: 0.25, act: "float", y: 8 }) +
      w(K.bubble(670, 700, 240, 100, -1, C.am, K.Tx(670, 716, "نیوکې", 40, C.navy, 700)), { in: "pop", tin: 0.45, act: "float", y: 8 }) +
      w(K.bubble(500, 820, 300, 90, 1, C.n5, K.Tx(500, 834, "سیاسي تقابل", 36, C.w, 700)), { in: "pop", tin: 0.7 }) +
      w(K.bolt(500, 320, 1.1), { in: "pop", tin: 0.35, act: "pulse", s: 1.15 });
  };

  S.p2_9 = () =>
    w(K.hourglass(500, 430, 1.25), { in: "zoom", at: 0.1, act: "tilt", r: 3, o: "500 430" }) +
    w(K.Ci(160, 220, 86, C.n3) + B({ x: 160, y: 270, s: 0.75, suit: C.n5 }), { in: "pop", tin: 0.05, act: "fall", t: 0.4, y: 120 }) +
    w(K.Ci(840, 220, 86, C.n3) + K.coinStack(840, 260, 40, 4), { in: "pop", tin: 0.22, act: "fall", t: 0.55, y: 120 }) +
    w(K.Ci(160, 600, 86, C.n3) + K.gear(160, 600, 52, 8, C.w2), { in: "pop", tin: 0.38, act: "fall", t: 0.7, y: 120 }) +
    w(K.tag(160, 90, "بشري", { keep: 1 }), { in: "pop", tin: 0.08 }) + w(K.tag(840, 90, "مالي", { keep: 1 }), { in: "pop", tin: 0.25 }) + w(K.tag(160, 470, "مدیریتي", { keep: 1 }), { in: "pop", tin: 0.42 }) +
    w(K.Ci(840, 620, 96, C.n2) + K.P("M760 640 A84 84 0 0 1 920 640", "none", `stroke="${C.w3}" stroke-width="14"`) + K.P("M760 640 A84 84 0 0 1 790 580", "none", `stroke="${C.am}" stroke-width="14"`), { in: "zoom", at: 0.4 }) +
    w(K.Rc(836, 636, 74, 8, 4, C.w), { in: "fade", at: 0.5, act: "needle", t: 0.4, o: "840 640" });

  S.p2_10 = () =>
    w(K.globe(220, 240, 140), { in: "zoom", at: 0.1 }) +
    w(K.socket(330, 440, 0.9), { in: "left", at: 0.2 }) +
    w(K.plug(620, 440, 0.9), { in: "right", at: 0.25, act: "move", t: 0.3, x: 150, y: 20, r: 8, d: 0.6 }) +
    w(spark(430, 440, 1.1), { in: "pop", tin: 0.32, act: "blink", d: 0.25 }) +
    floor(830, 0.3) +
    w(P({ x: 760, y: 830, s: 0.7, pose: "head", suit: C.n4 }) + P({ x: 890, y: 830, s: 0.7, fl: -1, suit: "#3B4466", beard: true }), { in: "right", at: 0.3, act: "fade", t: 0.6, o: 0.55 }) +
    w(K.tag(220, 450, "بهرنۍ اړیکې", { bg: C.w, keep: 1 }), { in: "pop", tin: 0.4 });

  S.p2_11 = () =>
    w(K.cloud(470, 170, 1.5, C.w3), { in: "down", at: 0.1, act: "float", y: 6 }) +
    w([0, 1, 2, 3, 4, 5].map((i) => K.Rc(330 + i * 55, 240, 6, 34, 3, C.n6)).join(""), { in: "fade", at: 0.4, act: "rain" }) +
    floor(800) +
    w(K.Rc(330, 640, 340, 26, 8, "#8A5A35") + K.Rc(350, 666, 20, 130, 6, "#7A4C2B") + K.Rc(630, 666, 20, 130, 6, "#7A4C2B"), { in: "up", at: 0.1 }) +
    w(P({ x: 500, y: 800, s: 0.8, pose: "head", suit: C.n4, beard: true }), { in: "up", at: 0.2, act: "droop", t: 0.3, y: 10, r: 3 }) +
    w(K.battery(820, 520, 0.9, 1), { in: "pop", tin: 0.2 }) +
    w(q(160, 420, 1.1, C.w2) + q(250, 330, 0.7, C.w3), { in: "pop", tin: 0.55, act: "float", y: 12 }) +
    w(K.tag(180, 560, "ناهیلي"), { in: "pop", tin: 0.1 });

  S.p2_12 = () =>
    w(K.Rc(120, 500, 760, 60, 30, C.n3) + [0, 1, 2, 3, 4, 5, 6].map((i) => K.Ci(170 + i * 110, 530, 22, C.n5)).join(""), { in: "growx", at: 0.1 }) +
    w(K.doc(260, 430, 90, 110, -4) + K.doc(470, 430, 90, 110, 3), { in: "fade", at: 0.3, act: "move", t: 0.0, x: 90, d: 1.6 }) +
    w(K.gear(330, 230, 110, 11, C.w2), { in: "zoom", at: 0.15, act: "spinstop", t: 0.35, r: 50 }) +
    w(K.gear(520, 180, 70, 8, C.am), { in: "zoom", at: 0.2, act: "spinstop", t: 0.35, r: -78 }) +
    w(K.Rc(415, 90, 34, 230, 10, C.am3) + K.Rc(415, 90, 34, 230, 10, "none", `stroke="${C.navy}" stroke-width="6"`), { in: "down", tin: 0.35 }) +
    w(K.calendar(780, 230, 1.1), { in: "pop", at: 0.4, act: "shake", t: 0.5 }) +
    w(K.Rc(200, 680, 600, 50, 25, C.n2) + K.Rc(210, 690, 580, 30, 15, C.n3), { in: "fade", at: 0.3 }) +
    w(K.Rc(210, 690, 200, 30, 15, C.am), { in: "growx", at: 0.4, act: "blink", d: 0.5 }) +
    w(K.Tx(500, 790, "", 30, C.w, 900) + K.tag(500, 800, "همغږي نشته", { bg: C.w }), { in: "pop", tin: 0.25 }) +
    w(K.Rc(860, 670, 60, 70, 10, C.w) + K.Rc(872, 682, 12, 46, 4, C.navy) + K.Rc(896, 682, 12, 46, 4, C.navy), { in: "pop", tin: 0.5 });

  S.p2_13 = () => {
    const nd = (x, y, r, col) => K.node(x, y, r, col) + B({ x: x, y: y + r * 0.62, s: r / 110, suit: C.navy });
    return w(K.S("M500 760 L330 580 M500 760 L670 580", C.w3, 6), { in: "draw", tin: 0.08 }) +
      w(nd(500, 760, 70, C.am), { in: "pop", at: 0.15 }) +
      w(nd(330, 580, 56, C.w) + nd(670, 580, 56, C.w), { in: "pop", tin: 0.12 }) +
      w(K.S("M330 580 L230 400 M330 580 L420 400 M670 580 L580 400 M670 580 L770 400", C.w3, 5), { in: "draw", tin: 0.32 }) +
      w(nd(230, 400, 42, C.am3) + nd(420, 400, 42, C.am3) + nd(580, 400, 42, C.am3) + nd(770, 400, 42, C.am3), { in: "pop", tin: 0.38 }) +
      w(K.S("M230 400 L180 240 M230 400 L280 240 M420 400 L380 240 M420 400 L460 240 M580 400 L540 240 M580 400 L620 240 M770 400 L720 240 M770 400 L820 240", C.w3, 4), { in: "draw", tin: 0.58 }) +
      w([180, 280, 380, 460, 540, 620, 720, 820].map((x) => nd(x, 240, 30, C.n5)).join(""), { in: "pop", tin: 0.64 }) +
      w(K.tag(500, 100, "نوې ډلې رامنځته کېږي"), { in: "pop", tin: 0.8 });
  };

  S.p2_14 = () =>
    w(K.shield(500, 330, 1.25), { in: "zoom", at: 0.1, act: "shake", t: 0.3 }) +
    w(K.crack([[500, 120], [530, 220], [480, 320], [528, 420], [494, 540]], C.w, 10), { in: "draw", tin: 0.3 }) +
    w(K.crack([[530, 220], [600, 250]], C.w, 7) + K.crack([[480, 320], [400, 350]], C.w, 7), { in: "draw", tin: 0.4 }) +
    [0, 1, 2, 3, 4].map((i) => w(K.star(320 + i * 90, 640, 34, C.am), i >= 2 ? { in: "pop", at: 0.4 + i * 0.06, act: "fade", t: 0.45 + (i - 2) * 0.12, o: 0.15 } : { in: "pop", at: 0.4 + i * 0.06 })).join("") +
    w(crowd(905, 6, 0.8, 1, 3), { in: "up", at: 0.2 }) +
    w(K.tag(160, 120, "خلک", { bg: C.w }), { in: "pop", tin: 0.6 }) + w(K.tag(840, 120, "سیاسي متحدین", { bg: C.w }), { in: "pop", tin: 0.7 });

  // ================= PART 3: EVENTS =================
  const box2 = (x, y, w2, txt, col) => K.Rc(x - w2 / 2 + 5, y + 7, w2, 76, 14, "#000", 'opacity=".3"') + K.Rc(x - w2 / 2, y, w2, 76, 14, col || C.w) + K.Tx(x, y + 50, txt, 32, col === C.am || !col ? C.navy : C.w, 900);
  S.p3_1 = () =>
    w(box2(380, 90, 300, "مرکزي جوړښت"), { in: "drop", at: 0.1 }) +
    w(K.S("M380 166 V230 M200 230 H560 M200 230 V270 M380 230 V270 M560 230 V270", C.w3, 6), { in: "draw", at: 0.3 }) +
    w(box2(200, 270, 160, "غړي", C.n4) + box2(380, 270, 160, "غړي", C.n4), { in: "pop", at: 0.4 }) +
    w(box2(560, 270, 160, "غړي", C.am) + K.S("M560 346 V400 M480 400 H640 M480 400 V430 M640 400 V430", C.w3, 6) + box2(480, 430, 140, "", C.am) + box2(640, 430, 140, "", C.am), { in: "pop", at: 0.5, act: "move", t: 0.18, x: 230, y: 70, r: 6, d: 1.2 }) +
    w(K.crack([[470, 220], [500, 260], [480, 300], [510, 340]], C.am, 7), { in: "draw", tin: 0.16 }) +
    w(K.podium(820, 880, 0.75), { in: "up", tin: 0.55 }) +
    w(K.tag(820, 620, "نوی تشکیلاتي جوړښت"), { in: "pop", tin: 0.72 }) +
    
    w(K.tag(200, 520, "د آزادۍ جبهه", { bg: C.w }), { in: "pop", tin: 0.05 });

  S.p3_2 = () => {
    const ring = (cx, cy, r, n, s, op) => { let g = K.Ci(cx, cy, r + 40, C.n3, 'opacity=".5"'); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g += B({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.6 + 40 * s, s: s, suit: [C.n4, C.n5, "#3B4466"][i % 3], beard: i % 3 === 1 }); } return g; };
    return w(ring(500, 450, 170, 8, 0.6), { in: "zoom", at: 0.1, act: "fade", t: 0.75, o: 0.55 }) +
      w(ring(170, 220, 70, 3, 0.45) + K.flag(170, 160, 0.3, C.am), { in: "zoom", tin: 0.15, act: "move", t: 0.15, x: -30, y: -20 }) +
      w(ring(830, 230, 70, 3, 0.45) + K.flag(830, 170, 0.3, C.w), { in: "zoom", tin: 0.4 }) +
      w(ring(180, 760, 70, 3, 0.45) + K.flag(180, 700, 0.3, C.am3), { in: "zoom", tin: 0.6 }) +
      w(ring(820, 760, 70, 3, 0.45) + K.flag(820, 700, 0.3, C.n6), { in: "zoom", tin: 0.78 }) +
      w(K.S("M380 360 L250 270 M620 360 L760 280 M380 560 L250 700 M620 560 L760 700", C.am, 6, 'stroke-dasharray="12 12"'), { in: "fade", tin: 0.2, act: "march" }) +
      w(K.tag(500, 460, "پخوانۍ جبهه", { bg: C.w }), { in: "pop", tin: 0.05 });
  };

  S.p3_3 = () =>
    w(K.Rc(80, 90, 840, 300, 20, C.n2) + K.Rc(80, 90, 420, 300, 20, C.n3) + K.Tx(290, 150, "", 30, C.w, 900), { in: "zoom", at: 0.05 }) +
    w(P({ x: 260, y: 690, s: 0.72, pose: "point", suit: C.n4, legs: false, sh: false }) + K.podium(260, 820, 0.78), { in: "left", at: 0.15 }) +
    w(P({ x: 740, y: 690, s: 0.72, pose: "point", fl: -1, suit: "#3B4466", beard: true, legs: false, sh: false }) + K.podium(740, 820, 0.78), { in: "right", at: 0.2 }) +
    w(K.bolt(500, 420, 1.4), { in: "pop", tin: 0.35, act: "pulse", s: 1.15 }) +
    w(K.bubble(300, 210, 280, 110, 1, C.w, K.Tx(300, 228, "رهبري", 44, C.navy, 700)), { in: "pop", tin: 0.55 }) +
    w(K.bubble(700, 210, 280, 110, -1, C.am, K.Tx(700, 228, "سیاسي دریځ", 40, C.navy, 700)), { in: "pop", tin: 0.4 }) +
    w(K.tag(500, 880, "ښکاره اختلاف"), { in: "pop", tin: 0.75 });

  S.p3_4 = () => {
    const feed = [0, 1, 2, 3].map((i) => w(K.post(0, -150 + i * 90, 190, i % 2 === 0, i % 2 ? C.am : C.w2), { in: "down", tin: 0.08 + i * 0.18 })).join("");
    return w(K.phone(500, 430, 1.25, ""), { in: "zoom", at: 0.05 }) + `<g transform="translate(500 430) scale(1.25)">${feed}</g>` +
      [[170, 220, "نیوکې", 0.2], [820, 300, "تورونه", 0.4], [180, 560, "کړنې", 0.55], [820, 640, "تګلارې", 0.7]].map(([x, y, t, f], i) => w(K.bubble(x, y, 230, 90, i % 2 ? -1 : 1, i % 2 ? C.am : C.w, K.Tx(x, y + 14, t, 38, C.navy, 700)), { in: "pop", tin: f, act: "float", y: 8 })).join("");
  };

  S.p3_5 = () =>
    K.table(500, 560, 760) +
    [190, 330, 470, 610, 750].map((x, i) => w(K.chair(x, 560, 0.55), { in: "fade", at: 0.1 })).join("") +
    w(B({ x: 190, y: 560, s: 0.85, suit: C.n4 }) + B({ x: 470, y: 560, s: 0.85, suit: C.n3, beard: true }) + B({ x: 750, y: 560, s: 0.85, suit: C.n5 }), { in: "up", at: 0.2 }) +
    w(B({ x: 330, y: 560, s: 0.85, suit: "#3B4466", beard: true }) + K.star(330, 520, 18, C.am), { in: "up", at: 0.25, act: "move", t: 0.3, x: -360, y: -60, d: 1.8 }) +
    w(B({ x: 610, y: 560, s: 0.85, suit: C.n2, cap: true }) + K.star(610, 520, 18, C.am), { in: "up", at: 0.3, act: "move", t: 0.45, x: 380, y: -60, d: 1.8 }) +
    w(K.Ci(330, 480, 60, "none", `stroke="${C.am}" stroke-width="6" stroke-dasharray="10 10"`) + K.Ci(610, 480, 60, "none", `stroke="${C.am}" stroke-width="6" stroke-dasharray="10 10"`), { in: "fade", tin: 0.55 }) +
    w(K.tag(250, 140, "تجربه‌لرونکي"), { in: "pop", tin: 0.15 }) + w(K.tag(760, 140, "اغېزناک کسان"), { in: "pop", tin: 0.35 });

  S.p3_6 = () =>
    floor(830, 0.3) + w(K.signpost(500, 830, 1), { in: "grow", at: 0.05 }) +
    w(K.T(500, 830, 1, K.sign(1, -460, "")), { in: "growx", tin: 0.1 }) + w(K.T(500, 830, 1, K.sign(-1, -370, "")), { in: "growx", tin: 0.25 }) +
    w(K.T(500, 830, 1, K.sign(1, -280, "", C.am)), { in: "growx", tin: 0.4 }) + w(K.T(500, 830, 1, K.sign(-1, -190, "", C.n6)), { in: "growx", tin: 0.55 }) +
    w(P({ x: 200, y: 830, s: 0.62, pose: "point", fl: -1, suit: C.n4 }), { in: "left", at: 0.2 }) +
    w(P({ x: 800, y: 830, s: 0.62, pose: "point", suit: "#3B4466", beard: true }), { in: "right", at: 0.25 }) +
    w(K.bubble(200, 300, 200, 110, 1, C.w, K.arrow(250, 300, 150, 300, C.navy, 10)), { in: "pop", tin: 0.35 }) +
    w(K.bubble(800, 300, 200, 110, -1, C.am, K.arrow(750, 300, 850, 300, C.navy, 10)), { in: "pop", tin: 0.5 }) +
    w(K.tag(500, 70, "بېلابېل لیدلوري"), { in: "pop", tin: 0.6 });

  S.p3_7 = () => {
    const H = K.columnHall(500, 820, 1.05);
    return w(H.base, { in: "up", at: 0.05 }) + w(H.cols[0], { in: "grow", at: 0.15 }) + w(H.cols[1], { in: "grow", at: 0.2, act: "droop", t: 0.6, r: -6, y: 4, o: "400 800" }) + w(H.cols[2], { in: "grow", at: 0.25 }) +
      w(H.cols[3], { in: "grow", at: 0.3, act: "fall", t: 0.5, y: 120 }) + w(H.cols[4], { in: "grow", at: 0.35 }) +
      w(H.roof, { in: "drop", at: 0.45, act: "droop", t: 0.55, r: 5, y: 26, o: "500 360" }) +
      w(K.crack([[300, 380], [330, 440], [310, 500], [340, 560]], C.am, 8) + K.crack([[640, 360], [610, 420], [650, 470]], C.am, 7), { in: "draw", tin: 0.3 }) +
      w(K.tag(220, 120, "انسجام", { bg: C.w }), { in: "pop", tin: 0.4 }) + w(K.tag(780, 120, "همغږي", { bg: C.w }), { in: "pop", tin: 0.55 });
  };

  S.p3_8 = () =>
    w(K.cliff(500, 560, 420, -1) + P({ x: 300, y: 560, s: 0.62, pose: "hips", suit: C.n4 }), { in: "left", at: 0.05, act: "move", t: 0.2, x: -120, d: 2.2 }) +
    w(K.cliff(500, 560, 420, 1) + P({ x: 700, y: 560, s: 0.62, pose: "hips", fl: -1, suit: "#3B4466", beard: true }), { in: "right", at: 0.05, act: "move", t: 0.2, x: 120, d: 2.2 }) +
    w(K.arrow(500, 700, 330, 700, C.am, 10) + K.arrow(500, 700, 670, 700, C.am, 10), { in: "pop", tin: 0.45 }) +
    w(K.S("M380 560 Q420 640 470 700", C.w3, 6) + K.S("M620 560 Q580 640 530 700", C.w3, 6), { in: "draw", tin: 0.35 }) +
    w(K.tag(500, 160, "ګډې اړیکې", { bg: C.w }), { in: "pop", tin: 0.1, act: "fade", t: 0.5, o: 0.3 }) +
    w(K.tag(500, 800, "محدودې همکارۍ"), { in: "pop", tin: 0.7 });

  S.p3_9 = () =>
    w(K.spot(500, 0, 560, 640), { in: "fade", at: 0.2, act: "pulse", s: 1.04 }) +
    w(K.folder(500, 660, 1.2, "محرم"), { in: "up", at: 0.1 }) +
    w(K.doc(340, 380, 170, 200, -16, "رهبري"), { in: "fade", tin: 0.15, act: "move", t: 0.15, y: -120, x: -60, r: -10, d: 1 }) +
    w(K.doc(500, 360, 170, 200, 2, "مالي"), { in: "fade", tin: 0.35, act: "move", t: 0.35, y: -160, d: 1 }) +
    w(K.doc(660, 380, 170, 200, 14, "جوړښت"), { in: "fade", tin: 0.55, act: "move", t: 0.55, y: -120, x: 60, r: 10, d: 1 }) +
    w(K.Rc(60, 760, 130, 90, 14, C.dk) + K.Ci(125, 805, 30, C.n5) + K.Ci(125, 805, 16, C.dk), { in: "left", at: 0.4 }) +
    w(K.Rc(810, 760, 130, 90, 14, C.dk) + K.Ci(875, 805, 30, C.n5) + K.Ci(875, 805, 16, C.dk), { in: "right", at: 0.45 }) +
    w(K.Ci(125, 790, 70, "#fff", 'opacity=".9"'), { act: "flash", t: 0.3 }) + w(K.Ci(875, 790, 70, "#fff", 'opacity=".9"'), { act: "flash", t: 0.6 }) +
    w(K.tag(500, 900, "افشا کېږي"), { in: "pop", tin: 0.78 });

  S.p3_10 = () =>
    floor(760, 0.3) +
    [0, 1, 2, 3, 4, 5].map((i) => w(K.domino(140 + i * 140, 760, 0.95, i % 2 ? C.am : C.w), { in: "grow", at: 0.05 + i * 0.05, act: "domino", t: 0.12 + i * 0.1, o: `${170 + i * 140} 760` })).join("") +
    w(K.Ci(500, 200, 40, C.am), { in: "pop", at: 0.3 }) +
    [0, 1, 2].map((i) => w(K.Ci(500, 200, 40, "none", `stroke="${C.am}" stroke-width="6"`), { act: "ripple", t: 0.2 + i * 0.22 })).join("") +
    w(K.tag(500, 360, "نور احتمالي انشعابونه"), { in: "pop", tin: 0.7 }) +
    w(K.tag(500, 860, "نه حل کېدل", { bg: C.w }), { in: "pop", tin: 0.25 });

  // ================= intro / dividers =================
  S.intro = () => {
    const banner = K.Rc(140, 130, 720, 230, 18, C.n3) + K.Rc(140, 130, 720, 26, 12, C.n4) + K.Ci(500, 248, 78, C.am) + K.Ci(500, 248, 58, C.n3) + K.star(500, 248, 40, C.am) + K.flag(220, 380, 0.55, C.am) + K.flag(740, 380, 0.55, C.w);
    const L = B({ x: 250, y: 500, s: 1.05, suit: C.n4 }) + B({ x: 400, y: 480, s: 1.05, suit: "#3B4466", beard: true });
    const R = B({ x: 600, y: 480, s: 1.05, suit: C.n3, cap: true }) + B({ x: 750, y: 500, s: 1.05, suit: C.n5, beard: true });
    const tab = K.table(500, 500, 860) + K.doc(380, 486, 120, 60, -4) + K.doc(620, 486, 120, 60, 5);
    return `<defs><clipPath id="cil"><rect x="-200" y="0" width="702" height="900"/></clipPath><clipPath id="cir"><rect x="498" y="0" width="702" height="900"/></clipPath></defs>` +
      K.spot(500, 0, 760, 700) +
      w(`<g clip-path="url(#cil)">${banner + L + tab}</g>`, { act: "move", t: 0.45, x: -70, r: -3, d: 0.9 }) +
      w(`<g clip-path="url(#cir)">${banner + R + tab}</g>`, { act: "move", t: 0.45, x: 70, r: 3, d: 0.9 }) +
      w(K.crack([[500, 120], [522, 230], [486, 330], [516, 430], [492, 540], [506, 660]], C.am, 11), { in: "draw", tin: 0.4 }) +
      w(K.bolt(500, 420, 1.3), { in: "pop", tin: 0.48, act: "pulse", s: 1.15 });
  };
  S.div2 = () =>
    w(K.puzzle(400, 360, 1.3, C.am, -4), { in: "zoom", at: 0.1, act: "move", t: 0.25, x: -90, y: -50, r: -14 }) +
    w(K.puzzle(600, 360, 1.3, C.w, 4), { in: "zoom", at: 0.15, act: "move", t: 0.3, x: 90, y: -50, r: 14 }) +
    w(K.puzzle(400, 560, 1.3, C.n5, 2), { in: "zoom", at: 0.2, act: "move", t: 0.35, x: -90, y: 60, r: 10 }) +
    w(K.puzzle(600, 560, 1.3, C.am3, -2), { in: "zoom", at: 0.25, act: "move", t: 0.4, x: 90, y: 60, r: -12 });
  S.div3 = () =>
    w(K.Rc(180, 200, 640, 520, 14, C.w) + K.Rc(180, 200, 640, 96, 14, C.am) + K.Tx(500, 270, "پېښې", 64, C.navy, 900) + [0, 1, 2, 3, 4, 5].map((i) => K.Rc(220 + (i % 2) * 300, 330 + Math.floor(i / 2) * 120, 260, 90, 8, i === 0 ? C.n4 : C.w2)).join(""), { in: "zoom", at: 0.1, act: "tilt", r: 2, o: "500 460" }) +
    w(K.Rc(140, 760, 720, 10, 5, C.w3) + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => K.Ci(170 + i * 73, 765, 14, i % 3 === 0 ? C.am : C.w)).join(""), { in: "growx", tin: 0.2 });

  window.SCENES = S;
})();
