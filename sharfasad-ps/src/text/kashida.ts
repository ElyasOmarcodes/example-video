// Kashida justification for Arabic-script (Pashto) text.
//
// Lines are balanced first (so no line is much shorter than the others), then every line is
// brought to the same width by inserting tatweel (ـ) at calligraphically valid joins instead
// of opening the word gaps. Only the sub-tatweel remainder goes into the spaces.

const RIGHT_ONLY = new Set([...'اآأإٱدذډڈڊڍڎڏڐرزړږژڑڒڔڕڗڙوؤۄۅۆۇۈۉۊۋۏةۀۃۍےۓۂ']);
const ALEFS = 'اآأإٱ';
const SEEN = 'سشصضښ';

const isLetter = (ch: string) => {
  const c = ch.charCodeAt(0);
  return (c >= 0x622 && c <= 0x64a && c !== 0x640) || (c >= 0x66e && c <= 0x6d3) || c === 0x6d5 || (c >= 0x6fa && c <= 0x6ff);
};

type Cand = {pos: number; pri: number};

/** Best place for a kashida inside a word, or null (short words and unjoined words get none). */
export const kashidaSpot = (word: string): Cand | null => {
  const ch = [...word];
  const letters = ch.filter(isLetter).length;
  if (letters < 3) return null;
  let last = ch.length - 1;
  while (last > 0 && !isLetter(ch[last])) last--;
  let best: Cand | null = null;
  for (let i = 0; i < last; i++) {
    const c = ch[i], n = ch[i + 1];
    if (!isLetter(c) || !isLetter(n) || RIGHT_ONLY.has(c)) continue;
    if (c === 'ل' && ALEFS.includes(n)) continue;
    let pri: number;
    if (SEEN.includes(c)) pri = 5;
    else if (i + 1 === last && 'هہةدذډ'.includes(n)) pri = 4;
    else if (i + 1 === last && 'اآلكکګگطظ'.includes(n)) pri = 3;
    else if (i + 1 === last) pri = 2;
    else pri = i === 0 ? 0.6 : 1 + (i / ch.length) * 0.5;
    if (!best || pri > best.pri) best = {pos: i + 1, pri};
  }
  return best;
};

const stretch = (word: string, pos: number, n: number) => {
  const ch = [...word];
  return ch.slice(0, pos).join('') + 'ـ'.repeat(n) + ch.slice(pos).join('');
};

let ctx: CanvasRenderingContext2D | null = null;
const measure = (s: string, font: string) => {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d')!;
  ctx.font = font;
  (ctx as unknown as {direction: string}).direction = 'rtl';
  return ctx.measureText(s).width;
};

export type LWord = {text: string; raw: string; idx: number; x: number; w: number; hl: boolean};
export type LLine = {words: LWord[]; width: number};
export type Layout = {lines: LLine[]; width: number; ragged: number};

export type LayoutOpts = {
  size: number;
  family: string;
  hlFamily?: string;
  maxW: number;
  space?: number; // word gap in em
  hl?: (w: string) => boolean;
  maxKashidaEm?: number; // longest single elongation
  justify?: boolean;
  lines?: number; // force this many lines (maxW is then ignored; the caller scales the type to fit)
  center?: boolean; // where a line that cannot be fully justified sits
};

const cache = new Map<string, Layout>();

export const layoutText = (text: string, o: LayoutOpts): Layout => {
  const key = JSON.stringify([text, o.size, o.family, o.hlFamily, o.maxW, o.space, o.maxKashidaEm, o.justify, o.lines, o.center]) + (o.hl ? text.split(' ').map((w) => +o.hl!(w)).join('') : '');
  const hit = cache.get(key);
  if (hit) return hit;

  const words = text.split(' ').filter(Boolean);
  const isHl = words.map((w) => (o.hl ? o.hl(w) : false));
  const fontOf = (i: number) => `${o.size}px ${isHl[i] && o.hlFamily ? o.hlFamily : o.family}`;
  const ww = words.map((w, i) => measure(w, fontOf(i)));
  const gap = (o.space ?? 0.24) * o.size;
  const n = words.length;

  // natural width of words i..j
  const span = (i: number, j: number) => {
    let s = 0;
    for (let k = i; k <= j; k++) s += ww[k];
    return s + gap * (j - i);
  };

  // balanced breaking: fewest lines that fit, then minimise the squared deviation between lines
  const total = span(0, n - 1);
  const maxW = o.lines ? Infinity : o.maxW;
  let L = o.lines ? Math.min(o.lines, n) : Math.max(1, Math.ceil(total / o.maxW));
  let breaks: number[] | null = null;
  for (; L <= n && !breaks; L++) {
    const target = total / L;
    const best: {cost: number; prev: number}[][] = Array.from({length: n + 1}, () => Array.from({length: L + 1}, () => ({cost: Infinity, prev: -1})));
    best[0][0].cost = 0;
    for (let l = 1; l <= L; l++)
      for (let j = 1; j <= n; j++)
        for (let i = l - 1; i < j; i++) {
          const w = span(i, j - 1);
          if (w > maxW && j - i > 1) continue;
          const c = best[i][l - 1].cost + (w - target) ** 2 * (j - i === 1 && n > 2 ? 3 : 1);
          if (c < best[j][l].cost) best[j][l] = {cost: c, prev: i};
        }
    if (best[n][L].cost < Infinity) {
      breaks = [];
      let j = n;
      for (let l = L; l >= 1; l--) {
        breaks.unshift(j);
        j = best[j][l].prev;
      }
    }
  }
  if (!breaks) breaks = [n];

  const ranges: [number, number][] = [];
  let s = 0;
  for (const e of breaks) {
    ranges.push([s, e - 1]);
    s = e;
  }
  const block = Math.min(maxW, Math.max(...ranges.map(([i, j]) => span(i, j))));
  const ragged = Math.max(...ranges.map(([i, j]) => (block - span(i, j)) / block));
  const tw = (f: string) => measure('بـب', f) - measure('بب', f);
  const maxK = o.maxKashidaEm ?? 0.5;

  const lines: LLine[] = ranges.map(([i, j]) => {
    const idxs = Array.from({length: j - i + 1}, (_, k) => i + k);
    const out = idxs.map((k) => words[k]);
    if (o.justify !== false) {
      let extra = block - span(i, j);
      const cands = idxs
        .map((k, q) => ({q, k, c: kashidaSpot(words[k]), tw: tw(fontOf(k))}))
        .filter((x) => x.c)
        .sort((a, b) => b.c!.pri - a.c!.pri || words[b.k].length - words[a.k].length);
      if (cands.length && extra > 0) {
        const unit = cands[0].tw;
        const cap = Math.max(1, Math.round((maxK * o.size) / unit));
        let need = Math.floor(extra / unit);
        const use = Math.min(cands.length, Math.max(1, Math.ceil(need / cap)));
        need = Math.min(need, use * cap);
        for (let u = 0; u < use && need > 0; u++) {
          const give = Math.min(cap, Math.ceil(need / (use - u)));
          const {q, c} = cands[u];
          out[q] = stretch(out[q], c!.pos, give);
          need -= give;
        }
      }
    }
    const w2 = out.map((w, q) => measure(w, fontOf(idxs[q])));
    const nat = w2.reduce((a, b) => a + b, 0) + gap * (out.length - 1);
    const rest = block - nat;
    // the remainder (less than one tatweel when justified) is shared by the gaps; a lone word is centred
    const g = out.length > 1 ? gap + Math.min(rest / (out.length - 1), o.justify === false ? 0 : gap * 0.45) : gap;
    const used = w2.reduce((a, b) => a + b, 0) + g * (out.length - 1);
    let x = o.center ? (block - used) / 2 : 0; // distance from the right edge
    const lw: LWord[] = out.map((text, q) => {
      const r = {text, raw: words[idxs[q]], idx: idxs[q], x, w: w2[q], hl: isHl[idxs[q]]};
      x += w2[q] + g;
      return r;
    });
    return {words: lw, width: used};
  });

  const res = {lines, width: block, ragged};
  cache.set(key, res);
  return res;
};
