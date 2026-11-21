// Scene-to-scene transitions. p runs 0→1 across the transition window; A leaves, B arrives.
// Each sets inline styles on the two scenes (reset every frame by film.js) and may use the overlay.
import {E, clamp, prog, lerp, h, css} from './util.js';

const W = 1080, H = 1920;
export function makeOverlay(root) {
  const ov = h('div');
  css(ov, {position: 'absolute', inset: '0', zIndex: '40', pointerEvents: 'none', overflow: 'hidden'});
  const bars = [];
  for (let i = 0; i < 6; i++) {
    const b = h('div');
    css(b, {position: 'absolute', top: '-10%', height: '120%', width: `${W / 6 + 2}px`, left: `${(i * W) / 6}px`, transformOrigin: 'right center', display: 'none'});
    ov.appendChild(b); bars.push(b);
  }
  const ring = h('div');
  css(ring, {position: 'absolute', borderRadius: '50%', border: '10px solid var(--acc)', display: 'none', boxShadow: '0 0 0 18px rgba(245,160,0,.18)'});
  ov.appendChild(ring);
  const edge = h('div');
  css(edge, {position: 'absolute', left: '-50%', width: '200%', height: '26px', background: 'var(--acc)', display: 'none', boxShadow: '0 0 40px rgba(245,160,0,.5)'});
  ov.appendChild(edge);
  root.appendChild(ov);
  return {ov, bars, ring, edge, hide() { bars.forEach((b) => (b.style.display = 'none')); ring.style.display = 'none'; edge.style.display = 'none'; }};
}
const card = (s, r) => ({borderRadius: `${r}px`, boxShadow: s ? `0 60px 120px rgba(14,27,61,${0.25 * s}), 0 10px 30px rgba(14,27,61,${0.12 * s})` : 'none'});

export const TRANS = {
  // horizontal push with parallax (RTL: the next page enters from the left)
  slide(p, A, B) {
    const e = E.io(p), v = Math.sin(Math.PI * p);
    css(A.el, {transform: `translateX(${e * W}px)`});
    css(A.content, {transform: `translateX(${e * W * 0.35}px) rotate(${e * 2}deg)`, filter: `blur(${v * 5}px)`});
    css(B.el, {transform: `translateX(${(e - 1) * W}px)`});
    css(B.content, {transform: `translateX(${(e - 1) * W * 0.35}px) rotate(${(e - 1) * 2}deg)`, filter: `blur(${v * 5}px)`});
  },
  // vertical push, next page rises from below
  rise(p, A, B) {
    const e = E.io(p), v = Math.sin(Math.PI * p);
    css(A.el, {transform: `translateY(${-e * H * 0.6}px) scale(${1 - 0.08 * e})`, opacity: String(1 - E.in(prog(p, 0.3, 0.9)))});
    css(A.content, {filter: `blur(${v * 6}px)`});
    css(B.el, {transform: `translateY(${(1 - e) * H}px)`, ...card(v, 70 * v)});
    css(B.content, {transform: `translateY(${(1 - e) * 260}px)`});
  },
  // circular reveal from the focus point, with an orange ring riding the edge
  iris(p, A, B, o) {
    const e = E.io(p);
    const [fx, fy] = B.focus || [540, 760];
    const R = Math.hypot(Math.max(fx, W - fx), Math.max(fy, H - fy)) * 1.05 * e;
    B.el.style.zIndex = '3';
    css(B.el, {clipPath: `circle(${R}px at ${fx}px ${fy}px)`});
    css(B.content, {transform: `scale(${1.12 - 0.12 * e})`});
    css(A.content, {transform: `scale(${1 + 0.1 * e})`, filter: `blur(${e * 4}px)`});
    css(o.ring, {display: 'block', left: `${fx - R - 10}px`, top: `${fy - R - 10}px`, width: `${2 * R + 20}px`, height: `${2 * R + 20}px`, opacity: String(Math.sin(Math.PI * p))});
  },
  // dive into the hero, next scene resolves out of depth
  zoom(p, A, B) {
    const [fx, fy] = A.focus || [540, 760];
    const a = E.in(prog(p, 0, 0.62)), b = E.out(prog(p, 0.38, 1));
    css(A.el, {transformOrigin: `${fx}px ${fy}px`, transform: `scale(${1 + 2.2 * a})`, opacity: String(1 - prog(p, 0.35, 0.62)), filter: `blur(${a * 14}px)`});
    B.el.style.zIndex = '3';
    css(B.el, {transform: `scale(${0.72 + 0.28 * b})`, opacity: String(prog(p, 0.38, 0.62)), filter: `blur(${(1 - b) * 12}px)`});
  },
  // page lifts into a card and slides away; the next card comes up and opens out
  stack(p, A, B, o, root) {
    root.style.background = '#e2e5ee';
    const s1 = E.io(prog(p, 0, 0.32)), up = E.in(prog(p, 0.22, 0.62));
    const inn = E.out(prog(p, 0.35, 0.78)), s2 = E.io(prog(p, 0.7, 1));
    const sa = 1 - 0.16 * s1, sb = 0.84 + 0.16 * s2;
    css(A.el, {transform: `translateY(${-up * H * 1.02}px) scale(${sa}) rotate(${-up * 4}deg)`, ...card(s1, 64 * s1)});
    B.el.style.zIndex = '3';
    css(B.el, {transform: `translateY(${(1 - inn) * H * 1.02}px) scale(${sb}) rotate(${(1 - inn) * 5}deg)`, ...card(1 - s2, 64 * (1 - s2))});
  },
  // 3D card flip around the vertical axis
  flip(p, A, B, o, root) {
    root.style.background = '#e2e5ee';
    root.style.perspective = '2400px';
    const a = E.in(prog(p, 0, 0.5)), b = E.out(prog(p, 0.5, 1));
    const sc = 1 - 0.12 * Math.sin(Math.PI * p);
    css(A.el, {transform: `scale(${sc}) rotateY(${a * -90}deg)`, opacity: p < 0.5 ? '1' : '0', ...card(Math.sin(Math.PI * p), 48)});
    css(B.el, {transform: `scale(${sc}) rotateY(${(1 - b) * 90}deg)`, opacity: p >= 0.5 ? '1' : '0', ...card(Math.sin(Math.PI * p), 48)});
  },
  // stripes sweep across (RTL), the page changes underneath
  stripes(p, A, B, o) {
    const cols = ['var(--ink)', 'var(--sec2,var(--blue))', 'var(--acc)', 'var(--ink)', 'var(--sec2,var(--blue))', 'var(--acc)'];
    o.bars.forEach((b, i) => {
      const j = 5 - i;
      const kin = E.io(prog(p, j * 0.05, 0.5 + j * 0.03 - 0.12));
      const kout = E.io(prog(p, 0.5 + j * 0.04 - 0.06, 0.86 + j * 0.025));
      css(b, {display: 'block', background: cols[i], transformOrigin: kout > 0 ? 'left center' : 'right center', transform: `scaleX(${kout > 0 ? 1 - kout : kin})`});
    });
    const sw = p >= 0.5;
    A.el.style.opacity = sw ? '0' : '1';
    B.el.style.opacity = sw ? '1' : '0';
    css(sw ? B.content : A.content, {transform: `translateX(${sw ? (1 - E.out(prog(p, 0.5, 1))) * -160 : E.in(prog(p, 0, 0.5)) * 160}px)`});
  },
  // diagonal wipe with a glowing orange edge
  wipe(p, A, B, o) {
    const e = E.io(p);
    const y = lerp(H + 700, -700, e);
    B.el.style.zIndex = '3';
    css(B.el, {clipPath: `polygon(0 ${y + 300}px, ${W}px ${y - 300}px, ${W}px ${H + 900}px, 0 ${H + 900}px)`});
    css(B.content, {transform: `translateY(${(1 - e) * 220}px)`});
    css(A.content, {transform: `translateY(${-e * 160}px)`});
    css(o.edge, {display: 'block', top: `${y - 13}px`, transform: `rotate(${(-Math.atan2(600, W) * 180) / Math.PI}deg)`, opacity: String(Math.sin(Math.PI * p))});
  },
  // soft cross-dissolve with drift (used where the voice runs straight on)
  fade(p, A, B) {
    const e = E.soft(p);
    css(A.el, {opacity: String(1 - e), filter: `blur(${e * 10}px)`, transform: `scale(${1 + 0.04 * e})`});
    B.el.style.zIndex = '3';
    css(B.el, {opacity: String(e), transform: `scale(${1.04 - 0.04 * e})`});
  },
};
