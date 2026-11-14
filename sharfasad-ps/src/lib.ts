import {Easing, spring, SpringConfig, useCurrentFrame} from 'remotion';
import timeline from '../timeline.json';

export const TL = timeline;
export const FPS = TL.fps;
export const W = 1080;
export const H = 1920;

// Brand navy stage, white/blue glass, one brand-orange accent.
export const C = {
  bg0: '#030820',
  bg1: '#07134A',
  bg2: '#0B1F6E',
  white: '#F3F6FF',
  dim: 'rgba(243,246,255,0.66)',
  faint: 'rgba(243,246,255,0.32)',
  line: 'rgba(160,185,255,0.22)',
  blue: '#9DB4FF',
  blue2: '#5273F0',
  blue3: '#1C318F',
  deep: '#0A1445',
  acc: '#F5A000',
  acc2: '#FFC550',
  accDeep: '#C97A00',
};

// Quds only (the brand face): ExtraBlack for titles, Bold for reading text, ExtraBold for keywords/tags.
export const F = {
  title: 'QudsXK',
  head: 'QudsB',
  light: 'QudsB',
  body: 'QudsB',
  medium: 'QudsB',
  semi: 'QudsXB',
  mono: 'monospace',
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.6, 0, 0.9, 0.35);
export const soft = Easing.bezier(0.4, 0, 0.2, 1);

export const prog = (t: number, t0: number, t1: number, ease: (x: number) => number = easeInOut) =>
  ease(clamp01((t - t0) / (t1 - t0)));

/** Spring on seconds. Default is critically smooth (no bounce) — this piece should feel weighty. */
export const spT = (t: number, start: number, config: Partial<SpringConfig> = {}) => {
  if (t <= start) return 0;
  return spring({frame: (t - start) * FPS, fps: FPS, config: {damping: 22, mass: 0.9, stiffness: 120, ...config}});
};

export const useT = () => useCurrentFrame() / FPS;

const FA = '۰۱۲۳۴۵۶۷۸۹';
export const fa = (n: number | string) => String(n).replace(/[0-9]/g, (d) => FA[+d]);

export const strip = (w: string) => w.replace(/[.,،!؟:؛?ـ]/g, '');

/** Deterministic 0..1 hash. */
export const rnd = (i: number, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Reveal time for each word, spread over [a, b] by character count (speech is ~even per char). */
export const wordTimes = (words: string[], a: number, b: number) => {
  const lens = words.map((w) => strip(w).length + 1.5);
  const tot = lens.reduce((x, y) => x + y, 0);
  let acc = 0;
  return words.map((_, i) => {
    const t0 = a + ((b - a) * acc) / tot;
    acc += lens[i];
    return {t0, t1: a + ((b - a) * acc) / tot};
  });
};

const ORD = ['لومړۍ', 'دوهمه', 'دریمه', 'څلورمه', 'پنځمه'];
/** "له پنځو برخو لومړۍ برخه" */
export const partLabel = (n: number) => `له پنځو برخو ${ORD[n - 1]} برخه`;
