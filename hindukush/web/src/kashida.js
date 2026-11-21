// Kashida (tatweel ـ) justification after the calligraphic rules: lines of a block are stretched to
// one width by elongating connections inside words, never by widening the gaps between words.
// Positions follow the usual priority — after the teeth of س ش ص ض, before a final ه, before a final
// ی/ې/ي/ر/و/ن, otherwise the last joining connection of the word — and never inside لا.
const TATWEEL = 'ـ';
const RIGHT_ONLY = new Set([...'اآأإٱدذرزژوؤةۀډړږۍےۓ']);
const isLetter = (c) => /[ؠ-يٮ-ۓەۺ-ۿ]/.test(c);
const joinsLeft = (c) => isLetter(c) && !RIGHT_ONLY.has(c);
const MARK = /[ً-ٰٟ]/;

let ctx = null;
export function measure(text, size, weight = 900) {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `${weight} ${size}px Quds`;
  ctx.direction = 'rtl';
  return ctx.measureText(text).width;
}

// best kashida slot of a word: [index after which to insert, priority] or null
function slot(word) {
  const ch = [...word];
  const L = [];
  for (let i = 0; i < ch.length; i++) if (!MARK.test(ch[i])) L.push(i);
  const cand = [];
  for (let k = 0; k < L.length - 1; k++) {
    const a = ch[L[k]], b = ch[L[k + 1]];
    if (!joinsLeft(a) || !isLetter(b)) continue;
    if (a === 'ل' && 'اآأإ'.includes(b)) continue;
    // the slot sits after letter a (and after any marks on it)
    const at = L[k + 1] - 1;
    const last = k + 1 === L.length - 1;
    let p = 6;
    if ('سشصض'.includes(a)) p = 1;
    else if (last && 'هۀة'.includes(b)) p = 2;
    else if (last && 'یيېئۍىروزړ'.includes(b)) p = 3;
    else if (last && 'نڼلک'.includes(b)) p = 4;
    else if (last) p = 5;
    cand.push([at, p, k]);
  }
  if (!cand.length) return null;
  if (L.length <= 2) cand.forEach((c) => (c[1] += 4)); // two-letter words stretch last
  cand.sort((x, y) => x[1] - y[1] || y[2] - x[2]);
  return cand[0];
}
const insert = (word, at, n) => {
  const ch = [...word];
  return ch.slice(0, at + 1).join('') + TATWEEL.repeat(n) + ch.slice(at + 1).join('');
};

// stretch one line to `target` px; returns the new line
export function stretch(line, target, size, weight = 900, maxPerWord = 6) {
  const words = line.split(' ');
  const slots = words.map(slot);
  const order = words.map((w, i) => i).filter((i) => slots[i]).sort((a, b) => slots[a][1] - slots[b][1] || [...words[b]].length - [...words[a]].length);
  if (!order.length) return line;
  const n = words.map(() => 0);
  const build = () => words.map((w, i) => (n[i] ? insert(w, slots[i][0], n[i]) : w)).join(' ');
  let cur = measure(line, size, weight);
  const tw = measure(TATWEEL, size, weight);
  let guard = 0;
  while (target - cur > tw * 0.55 && guard++ < 200) {
    // next word: fewest kashidas so far, then best priority
    const i = order.slice().sort((a, b) => (n[a] + (slots[a][1] > 5 ? 1 : 0)) - (n[b] + (slots[b][1] > 5 ? 1 : 0)) || slots[a][1] - slots[b][1])[0];
    if (n[i] >= maxPerWord) break;
    n[i]++;
    cur = measure(build(), size, weight);
  }
  return build();
}

// break a long single line into balanced lines that fit maxW
export function balance(text, size, weight, maxW) {
  if (text.includes('\n') || measure(text, size, weight) <= maxW) return text.split('\n');
  const w = text.split(' ');
  let best = null;
  for (let k = 1; k < w.length; k++) {
    const a = w.slice(0, k).join(' '), b = w.slice(k).join(' ');
    const m = Math.max(measure(a, size, weight), measure(b, size, weight));
    if (!best || m < best[0]) best = [m, [a, b]];
  }
  return best[1];
}

// justify a block: every line to the widest (or to `to`) with kashida
export function justify(lines, size, weight = 900, to = null) {
  if (lines.length < 2 && to == null) return lines;
  const ws = lines.map((l) => measure(l, size, weight));
  const target = to ?? Math.max(...ws);
  return lines.map((l, i) => (target - ws[i] > 2 ? stretch(l, target, size, weight) : l));
}
