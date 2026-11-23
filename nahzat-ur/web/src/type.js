// Editorial title cards over the canvas (Al-Quds font, all four weights): kicker, hero word with
// glow and a marker sweep, thin second line, name plate, quotes. Only the key phrases from
// callouts.js are written; everything is a pure function of t.
import {E, clamp, prog} from './util.js';
import {CALLOUTS} from './callouts.js';

// Al-Quds now carries ھ (do-chashmi he) in all four weights (tools/font_dochashmi.py), so the text is drawn as written
export const ur = (s) => s;

const QUOTE = {L06: {who: 'امریکی مطالبہ', color: '#7fb2ff'}, L08: {who: 'طالبان کا جواب', color: '#f5a623'}};

export function createType(root, TL) {
  const LN = Object.fromEntries(TL.lines.map((l) => [l.id, l]));
  const wt = (id, needle) => {
    const w = LN[id].words.find((x) => x[0].includes(needle));
    if (!w) throw new Error(`callout word ${needle} not in ${id}`);
    return w[1];
  };
  const layer = document.createElement('div');
  layer.className = 'type-layer';
  root.appendChild(layer);
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  layer.appendChild(scrim);
  const quote = document.createElement('div');
  quote.className = 'quote-chip';
  layer.appendChild(quote);
  const mark = document.createElement('div');
  mark.className = 'watermark';
  mark.innerHTML = '<img src="assets/img/logo-nahzat.png" alt=""><span>NAHZAT</span>';
  layer.appendChild(mark);

  const cards = CALLOUTS.map((c) => {
    const el = document.createElement('div');
    el.className = 'co';
    const parts = c.lines.map(([kind, text, tone]) => {
      const d = document.createElement('div');
      d.className = `co-${kind} ${tone || ''}`;
      if (kind === 'h' || kind === 'q' || kind === 'x') {
        d.innerHTML = `<span class="mk"></span><span class="tx">${ur(text)}</span>`;
        if (kind === 'q') d.insertAdjacentHTML('afterbegin', '<span class="qm">“</span>');
      } else if (kind === 'n') {
        d.innerHTML = `<span class="tx">${ur(text)}</span><span class="ul"></span>`;
      } else if (kind === 'k') {
        d.innerHTML = `<span class="bar"></span><span class="tx">${ur(text)}</span>`;
      } else d.innerHTML = `<span class="tx">${ur(text)}</span>`;
      el.appendChild(d);
      return {d, kind};
    });
    layer.appendChild(el);
    return {el, parts, t0: wt(...c.at) - 0.12};
  });
  // a card leaves before the next one, after at most 5 s, and never rides into the next chapter's scene
  const chapEnd = Object.fromEntries(TL.lines.map((l) => [l.id, TL.chapters.find((c) => c.name === l.chapter).b]));
  cards.forEach((c, i) => {
    const n = cards[i + 1];
    c.t1 = n ? Math.min(n.t0 - 0.02, c.t0 + 5.0) : c.t0 + 4.0;
    c.t1 = Math.max(Math.min(c.t1, chapEnd[CALLOUTS[i].at[0]] + 0.45), c.t0 + 1.6);
  });

  const labels = [];
  function label(html, cls, a, b, style = {}) {
    const el = document.createElement('div');
    el.className = 'label ' + cls;
    el.innerHTML = ur(html);
    Object.assign(el.style, style);
    layer.appendChild(el);
    labels.push({el, a, b});
    return el;
  }

  function render(t, opts = {}) {
    layer.style.opacity = opts.typeOpacity ?? 1;
    scrim.style.opacity = String(opts.scrim ?? 0);
    for (const c of cards) {
      const on = t >= c.t0 - 0.02 && t < c.t1;
      c.el.style.display = on ? '' : 'none';
      if (!on) continue;
      const out = E.in(prog(t, c.t1 - 0.28, c.t1));
      c.el.style.opacity = String(1 - out);
      c.el.style.transform = `translateY(${-out * 30}px)`;
      c.el.style.filter = out > 0.01 ? `blur(${out * 12}px)` : 'none';
      let delay = 0;
      for (const {d, kind} of c.parts) {
        const a = c.t0 + delay;
        const k = E.out(prog(t, a, a + (kind === 'x' ? 0.5 : 0.6)));
        if (kind === 'k') {
          d.style.opacity = String(k);
          d.style.transform = `translateY(${(1 - k) * 18}px)`;
          d.querySelector('.bar').style.transform = `scaleX(${E.io(prog(t, a, a + 0.5))})`;
          delay += 0.12;
        } else if (kind === 'h' || kind === 'q' || kind === 'x') {
          // mask wipe from the right (reading direction), settle from a slight overscale, glow pulse on landing
          const w = E.io(prog(t, a, a + 0.55));
          const tx = d.querySelector('.tx');
          tx.style.clipPath = `inset(-45% -12% -45% ${(1 - w) * 112 - 12}%)`;
          tx.style.transform = `scale(${1.12 - 0.12 * k})`;
          tx.style.letterSpacing = kind === 'x' ? `${(1 - k) * 18}px` : '0px';
          const pulse = Math.sin(Math.PI * prog(t, a + 0.35, a + 1.4));
          d.style.setProperty('--glow', String(0.45 + 0.55 * pulse));
          const mk = d.querySelector('.mk');
          mk.style.transform = `scaleX(${E.io(prog(t, a + 0.25, a + 0.85))})`;
          d.style.opacity = String(clamp(k * 3));
          const qm = d.querySelector('.qm');
          if (qm) qm.style.opacity = String(k);
          delay += 0.22;
        } else if (kind === 'n') {
          const w = E.io(prog(t, a, a + 0.6));
          const tx = d.querySelector('.tx');
          tx.style.clipPath = `inset(-45% -12% -45% ${(1 - w) * 112 - 12}%)`;
          tx.style.letterSpacing = `${(1 - k) * 10}px`;
          d.querySelector('.ul').style.transform = `scaleX(${E.io(prog(t, a + 0.3, a + 1.0))})`;
          d.style.opacity = String(clamp(k * 3));
          delay += 0.22;
        } else {
          d.style.opacity = String(k);
          d.style.transform = `translateY(${(1 - k) * 20}px)`;
          d.style.filter = k < 0.99 ? `blur(${(1 - k) * 8}px)` : 'none';
          delay += 0.16;
        }
      }
    }
    let q = null;
    for (const l of TL.lines) if (QUOTE[l.id] && t >= l.a - 0.35 && t < l.b + 0.5) q = l;
    if (q) {
      const k = Math.min(E.out(prog(t, q.a - 0.35, q.a + 0.1)), 1 - E.in(prog(t, q.b + 0.2, q.b + 0.5)));
      quote.style.display = 'flex';
      quote.innerHTML = ur(`<i style="background:${QUOTE[q.id].color}"></i>${QUOTE[q.id].who}`);
      quote.style.opacity = String(k);
      quote.style.transform = `translateY(${(1 - k) * 14}px)`;
    } else quote.style.display = 'none';
    for (const L of labels) {
      const k = Math.min(E.out(prog(t, L.a, L.a + 0.45)), 1 - E.in(prog(t, L.b - 0.3, L.b)));
      L.el.style.display = k > 0.001 ? '' : 'none';
      L.el.style.opacity = String(k);
    }
    mark.style.opacity = String(opts.markOpacity ?? 0.55);
  }
  return {render, label};
}
