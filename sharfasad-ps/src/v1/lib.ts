import {Easing, spring, SpringConfig, useCurrentFrame} from 'remotion';
import timeline from '../../timeline.json';

export const TL = timeline;
export const FPS = TL.fps;
export const W = 1080;
export const H = 1920;

// Investigative-dossier palette: paper + brand navy ink + one brand-orange accent.
export const C = {
  paper: '#ECE5D6',
  paper2: '#E2D8C3',
  card: '#F7F2E7',
  ink: '#101B3F',
  ink2: 'rgba(16,27,63,0.66)',
  ink3: 'rgba(16,27,63,0.38)',
  faint: 'rgba(16,27,63,0.10)',
  acc: '#F29A00',
  accDeep: '#D97A00',
  accSoft: 'rgba(242,154,0,0.42)',
  grey: '#9A9282',
};

export const F = {
  body: 'QudsB, sans-serif',
  bold: 'QudsXB, sans-serif',
  black: 'QudsXB, sans-serif',
  title: 'QudsXK, sans-serif',
  mono: '"JetBrains Mono", monospace',
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.6, 0, 0.9, 0.35);

export const prog = (t: number, t0: number, t1: number, ease: (x: number) => number = easeInOut) =>
  ease(clamp01((t - t0) / (t1 - t0)));

/** Spring on seconds: 0 before `start`, settles to 1. */
export const spT = (t: number, start: number, config: Partial<SpringConfig> = {}) => {
  if (t <= start) return 0;
  return spring({frame: (t - start) * FPS, fps: FPS, config: {damping: 14, mass: 0.8, stiffness: 140, ...config}});
};
export const POP: Partial<SpringConfig> = {damping: 10, stiffness: 220, mass: 0.7};

export const useT = () => useCurrentFrame() / FPS;

const FA = '۰۱۲۳۴۵۶۷۸۹';
export const fa = (n: number | string) => String(n).replace(/[0-9]/g, (d) => FA[+d]);

export const strip = (w: string) => w.replace(/[.,،!؟:؛?]/g, '');

/** Reveal time for each word, spread over [a, b] by character count (speech is ~even per char). */
export const wordTimes = (text: string, a: number, b: number) => {
  const words = text.split(' ').filter(Boolean);
  const lens = words.map((w) => strip(w).length + 1.5);
  const tot = lens.reduce((x, y) => x + y, 0);
  let acc = 0;
  return words.map((w, i) => {
    const t = a + ((b - a) * acc) / tot;
    acc += lens[i];
    return {w, t};
  });
};

export {partLabel} from '../lib';
