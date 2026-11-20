// DOM typography over the canvas: the kinetic headline that follows the narration word by word
// (short chunks, one accent word, blur-in like the reference), quote attribution chips, and
// small timed labels. Every style is computed from t on each frame.
import {E, clamp, prog} from './util.js';

const HOT = ['ہلاک', 'بمباری', 'جارحیت', 'بغاوت', 'چھاؤنی؟', 'چھاؤنی', 'تباہ', 'حملے', 'حملوں', 'زمیں', 'بوس', 'الزام', 'خفیہ', 'ڈرون'];
const ACTORS = ['القاعدہ', 'طالبان', 'بش', 'مشرف', 'امریکی', 'امریکہ', 'امریکیوں', 'نیٹو', 'مغربی'];
const PLACES = ['نیویارک', 'ورلڈ', 'ٹریڈ', 'سینٹر', 'کابل،', 'کابل', 'قندھار', 'جلال', 'آباد', 'پاکستان', 'پاکستانی', 'افغانستان', 'کراچی', 'کوئٹہ،', 'کوئٹہ', 'چمن۔', 'پشاور،', 'خیبر،', 'طورخم۔', 'جیکب', 'پسنی', 'دالبندین', 'شمسی', 'بگرام'];
const NUMS = ['گیارہ', 'تین', 'ہزار', 'بیس', 'سات', 'ستاون', 'ایک', 'لاکھ', 'چھیاسٹھ', 'نو', 'سو', 'انچاس،', 'باون', 'انتیس', 'چار', 'دو'];
// per line: which words carry the accent (exact tokens as written in lines.json)
const ACCENT = {
  L01: ['ستمبر۔۔۔'], L02: ['ورلڈ', 'ٹریڈ', 'سینٹر'], L03: ['تین', 'ہزار', 'زمیں', 'بوس'], L04: ['القاعدہ'],
  L05: ['بش', 'کانگریس'], L06: ['حوالے', 'بند'], L07: ['طالبان'], L08: ['ٹھوس', 'شواہد', 'مذاکرات'],
  L09: ['کابل،', 'قندھار', 'جلال', 'آباد', 'بمباری'], L10: ['جارحیت'], L11: ['لیکن۔۔۔!'], L12: ['کہاں', 'سے'],
  L13: ['پرویز', 'مشرف،', 'بغاوت'], L14: ['زمین،', 'فضائی', 'حدود،', 'ہوائی', 'اڈے،', 'سمندری', 'راستے', 'نیٹو', 'سپلائی'],
  L15: ['جیکب', 'آباد'], L16: ['پسنی'], L17: ['دالبندین'], L18: ['شمسی', 'ڈرون', 'خفیہ'],
  L19: ['ستاون', 'ہزار'], L20: ['بمباری'], L21: ['نیٹو', 'سپلائی', 'لائن'], L22: ['پاکستان', 'سرزمین'],
  L23: ['کراچی'], L24: ['آئل', 'ٹینکرز', 'افغانستان'], L25: ['دو', 'بڑی', 'شاخوں'], L26: ['جنوبی', 'روٹ:'], L27: ['شمالی', 'روٹ،'],
  L28: ['وفاقی', 'ٹیکس', 'محتسب'], L29: ['ایک', 'لاکھ', 'چھیاسٹھ', 'ہزار'], L30: ['باون', 'ہزار'], L31: ['چار', 'لاکھ'],
  L32: ['خود', 'مختار'], L33: ['فوجی', 'چھاؤنی؟'],
};
const HOT_LINES = {L03: 1, L09: 1, L10: 1, L20: 1, L33: 1, L11: 1};
const QUOTE = {L06: {who: 'امریکی مطالبہ', color: '#7fb2ff'}, L08: {who: 'طالبان کا مؤقف', color: '#f5a623'}};

// split a line's words into short chunks (≤4 words, ≤26 letters), breaking after punctuation
function chunk(words) {
  const out = [];
  let cur = [];
  const len = (c) => c.reduce((s, w) => s + w[0].length, 0);
  for (const w of words) {
    cur.push(w);
    const brk = /[،۔:؟!,]$/.test(w[0]) || /۔۔۔/.test(w[0]);
    if (cur.length >= 4 || len(cur) >= 22 || (brk && cur.length >= 2) || (brk && /۔|؟|!/.test(w[0]))) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) {
    if (cur.length === 1 && out.length && out[out.length - 1].length < 4) out[out.length - 1].push(cur[0]);
    else out.push(cur);
  }
  return out;
}

export function createType(root, TL) {
  const layer = document.createElement('div');
  layer.className = 'type-layer';
  root.appendChild(layer);
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  layer.appendChild(scrim);
  const head = document.createElement('div');
  head.className = 'headline';
  layer.appendChild(head);
  const quote = document.createElement('div');
  quote.className = 'quote-chip';
  layer.appendChild(quote);
  const mark = document.createElement('div');
  mark.className = 'watermark';
  mark.innerHTML = '<img src="assets/img/logo-nahzat.png" alt=""><span>NAHZAT</span>';
  layer.appendChild(mark);

  // build every chunk once (DOM nodes reused per frame)
  const chunks = [];
  TL.lines.forEach((l, li) => {
    const acc = new Set(ACCENT[l.id] || []);
    const groups = chunk(l.words);
    groups.forEach((g, gi) => {
      const el = document.createElement('div');
      el.className = 'chunk' + (HOT_LINES[l.id] ? ' hot' : '') + (QUOTE[l.id] ? ' quote' : '');
      const spans = g.map(([w, t0]) => {
        const s = document.createElement('span');
        s.className = 'w' + (acc.has(w) ? ' acc' : '');
        s.textContent = w.replace(/۔۔۔/, '');
        el.appendChild(s);
        el.appendChild(document.createTextNode(' '));
        return {s, t0};
      });
      if (QUOTE[l.id]) {
        el.insertAdjacentHTML('afterbegin', gi === 0 ? '<span class="qm">“</span>' : '');
        if (gi === groups.length - 1) el.insertAdjacentHTML('beforeend', '<span class="qm">”</span>');
      }
      head.appendChild(el);
      const t0 = g[0][1] - 0.1;
      chunks.push({el, spans, t0, line: l, li, last: gi === groups.length - 1, end: g[g.length - 1][2]});
    });
  });
  // each chunk shows until the next one starts; across a long pause it clears
  chunks.forEach((c, i) => {
    const n = chunks[i + 1];
    const hold = c.last ? 0.55 : 0.25;
    c.t1 = n ? Math.min(n.t0, c.end + (n.li !== c.li && n.t0 - c.end > 1.0 ? hold : 99)) : c.end + 0.8;
  });

  const labels = [];
  function label(html, cls, a, b, style = {}) {
    const el = document.createElement('div');
    el.className = 'label ' + cls;
    el.innerHTML = html;
    Object.assign(el.style, style);
    layer.appendChild(el);
    labels.push({el, a, b});
    return el;
  }

  let hidden = [];
  function render(t, opts = {}) {
    layer.style.opacity = opts.typeOpacity ?? 1;
    scrim.style.opacity = String(opts.scrim ?? 0);
    for (const c of chunks) {
      const on = t >= c.t0 - 0.05 && t < c.t1;
      c.el.style.display = on ? 'block' : 'none';
      if (!on) continue;
      const out = E.in(prog(t, c.t1 - 0.2, c.t1));
      c.el.style.opacity = String(1 - out);
      c.el.style.transform = `translateY(${-out * 26}px)`;
      c.el.style.filter = out > 0.01 ? `blur(${out * 10}px)` : 'none';
      for (const {s, t0} of c.spans) {
        const k = E.out(prog(t, t0 - 0.04, t0 + 0.3));
        s.style.opacity = String(clamp(k * 1.15));
        s.style.transform = `translateY(${(1 - k) * 22}px) scale(${0.94 + 0.06 * k})`;
        s.style.filter = k < 0.99 ? `blur(${(1 - k) * 9}px)` : 'none';
        if (s.classList.contains('acc')) s.style.setProperty('--u', String(E.io(prog(t, t0 + 0.05, t0 + 0.5))));
      }
    }
    // quote attribution chip
    let q = null;
    for (const l of TL.lines) if (QUOTE[l.id] && t >= l.a - 0.35 && t < l.b + 0.5) q = l;
    if (q) {
      const k = Math.min(E.out(prog(t, q.a - 0.35, q.a + 0.1)), 1 - E.in(prog(t, q.b + 0.2, q.b + 0.5)));
      quote.style.display = 'flex';
      quote.innerHTML = `<i style="background:${QUOTE[q.id].color}"></i>${QUOTE[q.id].who}`;
      quote.style.opacity = String(k);
      quote.style.transform = `translateY(${(1 - k) * 14}px)`;
    } else quote.style.display = 'none';
    for (const L of labels) {
      const k = Math.min(E.out(prog(t, L.a, L.a + 0.45)), 1 - E.in(prog(t, L.b - 0.3, L.b)));
      L.el.style.display = k > 0.001 ? '' : 'none';
      L.el.style.opacity = String(k);
      L.el.style.setProperty('--k', String(k));
    }
    mark.style.opacity = String(opts.markOpacity ?? 0.55);
  }
  return {render, label, chunks};
}
