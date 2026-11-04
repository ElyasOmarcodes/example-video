/* Hand-coded, detailed SVG artwork for the focus-habits film.
   Every builder returns an SVG string; ids are prefixed so several copies can coexist. */
(function () {
  const CY = "#36e3ff", AM = "#EAA500";
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // white sticker outline for any group (dilated alpha, flooded white) + inner soft shade
  function stickerDefs(id, r) {
    return `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r || 10}" result="d"/><feFlood flood-color="#ffffff"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  }

  /* ---------- 1. side-view hologram brain (lobes, sulci, gyri, cerebellum, stem, neural net) ---------- */
  function brainSide(id, seed) {
    const R = rng(seed || 7);
    const outline = "M108 252 C 88 170, 150 88, 252 68 C 332 38, 432 48, 492 98 C 544 140, 562 202, 542 252 C 532 292, 502 302, 472 302 C 456 332, 420 346, 380 336 C 350 362, 300 366, 270 346 C 230 362, 180 352, 160 322 C 120 316, 98 292, 108 252 Z";
    // procedural gyri: meandering strokes clipped to the cerebrum
    let gyri = "";
    for (let i = 0; i < 46; i++) {
      let x = 120 + R() * 420, y = 80 + R() * 250, d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
      let a = R() * Math.PI * 2;
      for (let k = 0; k < 5; k++) { a += (R() - 0.5) * 2.4; const nx = x + Math.cos(a) * (18 + R() * 16), ny = y + Math.sin(a) * (14 + R() * 12); d += ` Q ${(x + Math.cos(a + 1.2) * 14).toFixed(1)} ${(y + Math.sin(a + 1.2) * 14).toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`; x = nx; y = ny; }
      gyri += `<path d="${d}" stroke-width="${(1.4 + R() * 1.2).toFixed(2)}" opacity="${(0.45 + R() * 0.45).toFixed(2)}"/>`;
    }
    // cerebellum striations
    let cb = "";
    for (let i = 0; i < 7; i++) cb += `<path d="M${408 + i * 2} ${340 + i * 8} C ${450} ${332 + i * 9}, ${495} ${338 + i * 8}, ${512 - i * 3} ${352 + i * 7}" stroke-width="1.6" opacity="0.8"/>`;
    // neural network nodes + links
    const nodes = []; for (let i = 0; i < 16; i++) nodes.push([150 + R() * 360, 100 + R() * 200]);
    let links = "";
    nodes.forEach((n, i) => { const near = nodes.map((m, j) => [Math.hypot(m[0] - n[0], m[1] - n[1]), j]).sort((a, b) => a[0] - b[0]).slice(1, 3); near.forEach(([dd, j]) => { if (j > i) links += `<line class="nl" x1="${n[0].toFixed(1)}" y1="${n[1].toFixed(1)}" x2="${nodes[j][0].toFixed(1)}" y2="${nodes[j][1].toFixed(1)}" stroke-width="1.3" opacity="0.7"/>`; }); });
    const dots = nodes.map((n, i) => `<circle class="nd" data-nodraw cx="${n[0].toFixed(1)}" cy="${n[1].toFixed(1)}" r="${i % 4 ? 4.5 : 7}" fill="#bff6ff" stroke="none"/>`).join("");
    return `<svg width="100%" height="100%" viewBox="0 0 650 470"><defs>
      <clipPath id="${id}c"><path d="${outline}"/></clipPath>
      <radialGradient id="${id}g" cx="0.45" cy="0.45" r="0.6"><stop offset="0" stop-color="${CY}" stop-opacity="0.22"/><stop offset="1" stop-color="${CY}" stop-opacity="0.02"/></radialGradient></defs>
      <g class="holo"><path data-nodraw d="${outline}" fill="url(#${id}g)" stroke="none"/>
      <path class="o" d="${outline}" stroke-width="3.6"/>
      <g clip-path="url(#${id}c)">${gyri}</g>
      <path d="M330 70 C 312 118, 336 168, 308 232 C 300 252, 304 270, 296 290" stroke-width="3"/>
      <path d="M176 292 C 236 272, 300 258, 384 252 C 410 250, 440 258, 462 268" stroke-width="3"/>
      <path d="M418 330 C 470 328, 522 338, 518 370 C 512 402, 452 408, 410 388 C 388 374, 394 342, 418 330 Z" stroke-width="3"/>${cb}
      <path d="M372 352 C 378 392, 374 424, 366 458 M402 356 C 400 396, 396 426, 394 458" stroke-width="3"/>
      ${links}</g>${dots}</svg>`;
  }

  /* ---------- 2. detailed neon line icons ---------- */
  function iconLaptop() {
    let keys = ""; for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) keys += `<rect x="${44 + c * 14}" y="${126 + r * 9}" width="10" height="5" rx="1.5" stroke-width="1.4"/>`;
    return `<svg width="100%" height="100%" viewBox="0 0 220 180"><g class="neon" stroke-width="5"><rect x="38" y="20" width="144" height="92" rx="9"/><path d="M14 118 H206 L190 158 H30 Z"/></g>
      <g class="neon" stroke-width="2.2"><path d="M52 34 h40 M52 48 h70 M52 62 h56 M52 76 h80 M52 90 h44"/><circle cx="160" cy="36" r="5"/>${keys}<rect x="92" y="146" width="36" height="8" rx="3"/></g></svg>`;
  }
  function iconPhone() {
    let apps = ""; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) apps += `<rect x="${48 + c * 30}" y="${46 + r * 30}" width="20" height="20" rx="6" stroke-width="2"/>`;
    return `<svg width="100%" height="100%" viewBox="0 0 180 220"><g class="neon" stroke-width="5"><rect x="34" y="10" width="112" height="198" rx="20"/></g>
      <g class="neon" stroke-width="2.2"><path d="M72 22 h36"/><circle cx="118" cy="22" r="3"/>${apps}<path d="M70 192 h40"/></g>
      <circle data-nodraw cx="138" cy="20" r="13" fill="${AM}" style="filter:drop-shadow(0 0 8px rgba(255,80,40,0.9))"/></svg>`;
  }
  function iconMail() {
    return `<svg width="100%" height="100%" viewBox="0 0 220 170"><g class="neon" stroke-width="5"><rect x="20" y="30" width="170" height="118" rx="12"/><path d="M24 36 L105 98 L186 36"/></g>
      <g class="neon" stroke-width="2.2"><path d="M24 142 L84 86 M186 142 L126 86"/></g>
      <circle data-nodraw cx="186" cy="34" r="22" fill="${AM}" style="filter:drop-shadow(0 0 10px rgba(255,80,40,0.9))"/><text x="186" y="43" text-anchor="middle" font-family="Modam" font-weight="900" font-size="26" fill="#050260">۳</text></svg>`;
  }
  function iconChat() {
    return `<svg width="100%" height="100%" viewBox="0 0 220 180"><g class="neon" stroke-width="5"><path d="M20 22 H150 Q166 22 166 38 V96 Q166 112 150 112 H76 L44 140 V112 H36 Q20 112 20 96 V38 Q20 22 36 22 Z"/><path d="M178 64 H190 Q204 64 204 78 V128 Q204 142 190 142 H182 V164 L158 142 H116 Q102 142 102 128 V124"/></g>
      <g class="neon" stroke-width="3"><circle cx="62" cy="67" r="7"/><circle cx="93" cy="67" r="7"/><circle cx="124" cy="67" r="7"/></g></svg>`;
  }

  /* ---------- 3. hand holding a smartphone — grayscale sticker with white outline ---------- */
  function handPhone(id) {
    const card = (y, w1, w2) => `<g transform="translate(0,${y})"><rect x="0" y="0" width="226" height="64" rx="14" fill="#f4f4f6"/><rect x="12" y="12" width="40" height="40" rx="10" fill="#9a9aa4"/><rect x="62" y="16" width="${w1}" height="10" rx="5" fill="#55555f"/><rect x="62" y="34" width="${w2}" height="8" rx="4" fill="#a8a8b2"/><circle cx="208" cy="20" r="5" fill="#77777f"/></g>`;
    return `<svg width="100%" height="100%" viewBox="0 0 460 640"><defs>${stickerDefs(id + "s", 11)}
      <linearGradient id="${id}sk" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#d6d6da"/><stop offset="0.55" stop-color="#b3b3ba"/><stop offset="1" stop-color="#84848d"/></linearGradient>
      <linearGradient id="${id}sk2" x1="0" x2="1"><stop offset="0" stop-color="#c9c9ce"/><stop offset="1" stop-color="#9c9ca4"/></linearGradient>
      <linearGradient id="${id}bd" x1="0" x2="1"><stop offset="0" stop-color="#2a2a30"/><stop offset="0.5" stop-color="#4a4a52"/><stop offset="1" stop-color="#1c1c22"/></linearGradient>
      <linearGradient id="${id}sc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3b3b44"/><stop offset="1" stop-color="#16161b"/></linearGradient>
      <linearGradient id="${id}gl" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <g filter="url(#${id}s)">
        <!-- sleeve + wrist -->
        <path d="M60 640 L84 520 Q120 500 176 512 L188 640 Z" fill="#6b6b74"/><path d="M84 520 Q120 500 176 512 L178 532 Q124 520 88 540 Z" fill="#8a8a93"/>
        <!-- palm behind phone -->
        <path d="M92 528 C 70 440, 92 360, 140 330 L 300 300 L 330 470 C 300 520, 230 546, 176 544 Z" fill="url(#${id}sk)"/>
        <!-- phone body -->
        <rect x="108" y="40" width="262" height="500" rx="38" fill="url(#${id}bd)"/>
        <rect x="372" y="150" width="6" height="58" rx="3" fill="#2a2a30"/><rect x="104" y="140" width="6" height="40" rx="3" fill="#2a2a30"/><rect x="104" y="196" width="6" height="40" rx="3" fill="#2a2a30"/>
        <rect x="120" y="52" width="238" height="476" rx="30" fill="url(#${id}sc)"/>
        <rect x="204" y="62" width="70" height="20" rx="10" fill="#0b0b0e"/><circle cx="262" cy="72" r="4" fill="#3a3a44"/>
        <!-- status bar -->
        <text x="140" y="80" font-family="InterX, sans-serif" font-size="15" font-weight="700" fill="#e9e9ee">9:41</text>
        <g fill="#e9e9ee"><rect x="300" y="70" width="3" height="8"/><rect x="305" y="67" width="3" height="11"/><rect x="310" y="64" width="3" height="14"/><rect x="320" y="66" width="22" height="11" rx="3" fill="none" stroke="#e9e9ee" stroke-width="1.6"/><rect x="322" y="68" width="10" height="7" rx="1.5"/></g>
        <!-- notification cards -->
        <g transform="translate(126,104)">${card(0, 120, 150)}${card(76, 96, 140)}${card(152, 130, 110)}${card(228, 84, 150)}</g>
        <rect x="200" y="508" width="78" height="5" rx="2.5" fill="#cfcfd6"/>
        <path d="M120 52 H358 V300 L120 520 Z" fill="url(#${id}gl)"/>
        <!-- thumb over the left edge -->
        <path d="M96 470 C 86 420, 104 380, 140 366 C 168 356, 192 368, 196 392 C 200 416, 176 430, 160 446 C 146 462, 128 486, 112 492 Z" fill="url(#${id}sk2)"/>
        <path d="M150 372 C 168 366, 186 374, 188 392 C 178 384, 164 380, 150 382 Z" fill="#e2e2e6"/>
        <path d="M120 470 C 136 452, 150 440, 166 430" fill="none" stroke="#86868f" stroke-width="2.4" stroke-linecap="round"/>
        <!-- fingers wrapping the right edge -->
        <g fill="url(#${id}sk)">${[0, 1, 2, 3].map((i) => `<path d="M352 ${250 + i * 62} C 384 ${242 + i * 62}, 404 ${252 + i * 62}, 402 ${276 + i * 62} C 400 ${298 + i * 62}, 380 ${304 + i * 62}, 356 ${300 + i * 62} Z"/>`).join("")}</g>
        <g fill="#e6e6ea">${[0, 1, 2, 3].map((i) => `<path d="M380 ${256 + i * 62} C 392 ${256 + i * 62}, 398 ${264 + i * 62}, 396 ${274 + i * 62} C 388 ${270 + i * 62}, 382 ${266 + i * 62}, 376 ${266 + i * 62} Z"/>`).join("")}</g>
        <g stroke="#7a7a83" stroke-width="2" fill="none" stroke-linecap="round">${[0, 1, 2, 3].map((i) => `<path d="M362 ${284 + i * 62} q 8 -6 14 0"/>`).join("")}</g>
      </g></svg>`;
  }

  /* ---------- 4. sleep: moon with craters, stars, Zzz; vertical battery with segments ---------- */
  function moon() {
    return `<svg width="100%" height="100%" viewBox="0 0 300 300"><defs><mask id="mmk"><rect width="300" height="300" fill="#fff"/><circle cx="196" cy="118" r="98" fill="#000"/></mask></defs>
      <g class="neon" stroke-width="5"><path d="M150 40 A 110 110 0 1 0 262 170 A 98 98 0 0 1 150 40 Z"/></g>
      <g class="neon" stroke-width="2.2" mask="url(#mmk)"><circle cx="96" cy="150" r="16"/><circle cx="128" cy="206" r="10"/><circle cx="82" cy="200" r="7"/><circle cx="150" cy="238" r="6"/><path d="M60 120 A 92 92 0 0 0 110 238" stroke-dasharray="6 9"/></g>
      <g class="neon zz" stroke-width="4"><path d="M196 28 h28 l-28 30 h28"/><path d="M238 70 h20 l-20 22 h20"/><path d="M262 18 h14 l-14 15 h14"/></g>
      ${[[40, 40, 9], [250, 240, 7], [30, 250, 6], [270, 120, 5]].map(([x, y, r]) => `<path class="star" data-nodraw d="M${x} ${y - r * 2} Q ${x} ${y}, ${x + r * 2} ${y} Q ${x} ${y}, ${x} ${y + r * 2} Q ${x} ${y}, ${x - r * 2} ${y} Q ${x} ${y}, ${x} ${y - r * 2} Z" fill="#cfefff" stroke="none" style="filter:drop-shadow(0 0 6px #9fd8ff)"/>`).join("")}</svg>`;
  }
  function batteryV() {
    return `<svg width="100%" height="100%" viewBox="0 0 240 420"><g class="neon" stroke-width="6"><rect x="30" y="50" width="180" height="350" rx="30"/><rect x="88" y="16" width="64" height="34" rx="9"/></g>
      <g class="neon" stroke-width="2"><rect x="44" y="64" width="152" height="322" rx="20" opacity="0.5"/></g>
      ${[0, 1, 2, 3, 4].map((i) => `<rect class="seg" data-nodraw x="56" y="${318 - i * 62}" width="128" height="50" rx="10" fill="${CY}" style="filter:drop-shadow(0 0 10px ${CY})"/>`).join("")}
      <path class="bolt" data-nodraw d="M128 140 L96 220 H124 L108 290 L150 200 H122 Z" fill="none" stroke="#e9f9ff" stroke-width="4" stroke-linejoin="round" opacity="0"/></svg>`;
  }

  /* ---------- 5. clutter: detailed grayscale stickers ---------- */
  function docSheet(id) {
    return `<svg width="100%" height="100%" viewBox="0 0 260 320"><defs>${stickerDefs(id, 9)}</defs><g filter="url(#${id})">
      <rect x="20" y="20" width="220" height="280" rx="6" fill="#ececf0"/><rect x="20" y="20" width="220" height="40" rx="6" fill="#8d8d97"/><rect x="36" y="34" width="90" height="12" rx="6" fill="#e9e9ee"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="36" y="${76 + i * 18}" width="${180 - i * 22}" height="8" rx="4" fill="#9d9da7"/>`).join("")}
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="${48 + i * 34}" y="${248 - [40, 70, 52, 90, 64][i]}" width="22" height="${[40, 70, 52, 90, 64][i]}" rx="3" fill="${i === 3 ? "#55555f" : "#b4b4bd"}"/>`).join("")}
      <path d="M40 250 H226" stroke="#6f6f78" stroke-width="2"/><path d="M150 278 c 10 -14 20 8 30 -6 s 18 8 28 -4" stroke="#55555f" stroke-width="2.5" fill="none" stroke-linecap="round"/></g></svg>`;
  }
  function sticky(id) {
    return `<svg width="100%" height="100%" viewBox="0 0 220 220"><defs>${stickerDefs(id, 9)}</defs><g filter="url(#${id})">
      <path d="M20 20 H200 V160 L160 200 H20 Z" fill="#d9d9dd"/><path d="M200 160 L160 200 V172 Q160 160 172 160 Z" fill="#a9a9b1"/>
      <path d="M40 60 c 20 -12 40 10 60 -2 s 40 8 70 -6" stroke="#4f4f58" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M40 96 c 24 8 50 -10 80 2" stroke="#4f4f58" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M40 130 h60" stroke="#4f4f58" stroke-width="5" stroke-linecap="round"/><circle cx="150" cy="128" r="14" fill="none" stroke="#4f4f58" stroke-width="4"/></g></svg>`;
  }
  function mug(id) {
    return `<svg width="100%" height="100%" viewBox="0 0 240 260"><defs>${stickerDefs(id, 9)}<linearGradient id="${id}m" x1="0" x2="1"><stop offset="0" stop-color="#c9c9cf"/><stop offset="0.5" stop-color="#f0f0f3"/><stop offset="1" stop-color="#9d9da6"/></linearGradient></defs>
      <g class="steam" fill="none" stroke="#e6f3ff" stroke-width="5" stroke-linecap="round" opacity="0.85"><path d="M86 70 c -14 -16 14 -26 0 -46"/><path d="M116 66 c -14 -16 14 -26 0 -46"/><path d="M146 70 c -14 -16 14 -26 0 -46"/></g>
      <g filter="url(#${id})"><path d="M50 92 H182 L170 222 Q168 236 152 236 H80 Q64 236 62 222 Z" fill="url(#${id}m)"/><path d="M180 112 Q222 112 216 152 Q210 190 172 190" fill="none" stroke="#a6a6ae" stroke-width="16"/>
      <ellipse cx="116" cy="92" rx="66" ry="14" fill="#5a5a63"/><ellipse cx="116" cy="94" rx="56" ry="9" fill="#2f2f36"/><path d="M76 140 h80" stroke="#8a8a93" stroke-width="3"/></g></svg>`;
  }
  function pencil(id) {
    return `<svg width="100%" height="100%" viewBox="0 0 320 90"><defs>${stickerDefs(id, 8)}</defs><g filter="url(#${id})">
      <rect x="40" y="26" width="200" height="38" fill="#bdbdc4"/><rect x="40" y="26" width="200" height="12" fill="#d7d7dc"/><rect x="40" y="52" width="200" height="12" fill="#9b9ba3"/>
      <path d="M240 26 L292 45 L240 64 Z" fill="#e3d9c8"/><path d="M276 39 L292 45 L276 51 Z" fill="#3a3a40"/><rect x="18" y="24" width="26" height="42" fill="#8e8e96"/><rect x="6" y="26" width="16" height="38" rx="6" fill="#c9c9cf"/>
      ${[24, 30, 36].map((x) => `<rect x="${x}" y="24" width="2" height="42" fill="#6a6a72"/>`).join("")}</g></svg>`;
  }
  function paperBall(id) {
    return `<svg width="100%" height="100%" viewBox="0 0 200 200"><defs>${stickerDefs(id, 9)}</defs><g filter="url(#${id})">
      <path d="M40 90 L70 40 L130 32 L170 70 L166 130 L124 168 L64 160 L32 126 Z" fill="#d8d8dd"/>
      <path d="M70 40 L96 92 L130 32 M96 92 L170 70 M96 92 L124 168 M96 92 L32 126 M96 92 L40 90" stroke="#8d8d96" stroke-width="2.5" fill="none"/>
      <path d="M96 92 L170 70 L166 130 Z" fill="#b3b3bb"/><path d="M96 92 L64 160 L32 126 Z" fill="#bcbcc3"/><path d="M96 92 L130 32 L70 40 Z" fill="#ececf0"/></g></svg>`;
  }
  function clip(id) {
    return `<svg width="100%" height="100%" viewBox="0 0 120 200"><defs>${stickerDefs(id, 7)}</defs><g filter="url(#${id})"><path d="M78 40 V150 Q78 180 54 180 Q30 180 30 150 V30 Q30 12 48 12 Q66 12 66 30 V140 Q66 154 54 154 Q42 154 42 140 V48" fill="none" stroke="#9a9aa3" stroke-width="9" stroke-linecap="round"/></g></svg>`;
  }

  /* ---------- 6. dashboard: grid, area fill, line, likes phone ---------- */
  function dashGrid() {
    let g = ""; for (let i = 0; i < 6; i++) g += `<path d="M60 ${60 + i * 88} H830" stroke-dasharray="4 10" stroke-width="1.6" opacity="0.5"/>`;
    let ticks = ""; for (let i = 0; i < 9; i++) ticks += `<path d="M${100 + i * 90} 500 v10" stroke-width="2"/>`;
    return `<svg width="100%" height="100%" viewBox="0 0 860 560"><g class="neon" stroke-width="2">${g}${ticks}</g><g class="neon" stroke-width="4"><path d="M60 500 H840 M60 500 V30"/></g></svg>`;
  }
  function dashArea(id) {
    return `<svg width="100%" height="100%" viewBox="0 0 860 560"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${CY}" stop-opacity="0.38"/><stop offset="1" stop-color="${CY}" stop-opacity="0"/></linearGradient></defs>
      <path d="M60 460 L180 410 L280 430 L390 310 L490 330 L600 170 L680 100 L680 500 L60 500 Z" fill="url(#${id})"/></svg>`;
  }
  function likeBubble(kind) {
    const icon = kind === "heart" ? `<path d="M46 62 C 20 44, 22 22, 38 20 C 46 19, 50 26, 52 30 C 54 26, 58 19, 66 20 C 82 22, 84 44, 58 62 L 52 66 Z" fill="${AM}"/>` : `<path d="M30 64 V40 H40 L54 18 Q60 14 62 22 L58 36 H76 Q84 38 82 46 L76 62 Q74 66 68 66 H40 V64 Z" fill="${AM}"/>`;
    return `<svg width="100%" height="100%" viewBox="0 0 170 90"><rect x="4" y="4" width="162" height="82" rx="41" fill="rgba(255,255,255,0.95)"/>${icon}<text x="124" y="58" text-anchor="middle" font-family="InterX, sans-serif" font-weight="800" font-size="28" fill="#050260">+${kind === "heart" ? "99" : "47"}</text></svg>`;
  }

  /* ---------- 7. alarm clock with 60 ticks, numerals, bells; horizontal battery ---------- */
  function clockFace() {
    let t = ""; for (let i = 0; i < 60; i++) { const big = i % 5 === 0; t += `<path d="M200 ${big ? 66 : 70} V${big ? 90 : 80}" stroke-width="${big ? 5 : 2}" transform="rotate(${i * 6} 200 214)"/>`; }
    const nums = [["۱۲", 200, 116], ["۳", 300, 226], ["۶", 200, 334], ["۹", 100, 226]].map(([n, x, y]) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Modam" font-weight="900" font-size="34" fill="#9fd8ff" style="filter:drop-shadow(0 0 6px rgba(120,200,255,0.9))">${n}</text>`).join("");
    return `<svg width="100%" height="100%" viewBox="0 0 400 440"><g class="neon" stroke-width="6"><circle cx="200" cy="214" r="160"/><path d="M84 92 A 56 56 0 0 1 150 44"/><path d="M316 92 A 56 56 0 0 0 250 44"/><path d="M110 360 L80 410 M290 360 L320 410"/><path d="M186 40 h28 M200 40 v14"/></g>
      <g class="neon" stroke-width="2.4"><circle cx="200" cy="214" r="146" opacity="0.6"/>${t}</g>${nums}</svg>`;
  }
  function batteryH() {
    return `<svg width="100%" height="100%" viewBox="0 0 320 170"><g class="neon" stroke-width="6"><rect x="16" y="20" width="250" height="130" rx="24"/><rect x="266" y="60" width="30" height="50" rx="8"/></g>
      ${[0, 1, 2, 3].map((i) => `<rect class="seg" data-nodraw x="${34 + i * 56}" y="38" width="46" height="94" rx="9" fill="${CY}" style="filter:drop-shadow(0 0 10px ${CY})"/>`).join("")}</svg>`;
  }

  window.ART = { brainSide, iconLaptop, iconPhone, iconMail, iconChat, handPhone, moon, batteryV, docSheet, sticky, mug, pencil, paperBall, clip, dashGrid, dashArea, likeBubble, clockFace, batteryH };
})();
