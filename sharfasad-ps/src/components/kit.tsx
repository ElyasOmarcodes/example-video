import React, {useEffect, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {C, F, clamp01, prog, spT, POP, strip, wordTimes, easeOut, lerp} from '../lib';

const FACES: [string, string][] = [
  ['QudsB', 'quds_bold.ttf'],
  ['QudsXB', 'quds_extrabold.ttf'],
  ['QudsK', 'quds_black.ttf'],
  ['QudsXK', 'quds_extrablack.ttf'],
];

export const useFonts = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(
      FACES.map(([name, file]) => {
        const f = new FontFace(name, `url(${staticFile('fonts/' + file)})`);
        return f.load().then((l) => (document.fonts as unknown as {add: (f: FontFace) => void}).add(l));
      }),
    )
      .then(() => continueRender(h))
      .catch((e) => cancelRender(e));
  }, [h]);
};

/** Paper: warm base, fibre noise, faint ruled grid, soft vignette. */
export const Paper: React.FC<{dark?: number}> = ({dark = 0}) => {
  const frame = useCurrentFrame();
  const fibre = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012 0.06' numOctaves='3' seed='4'/%3E%3CfeColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.28 0 0 0 0 0.18 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='600' height='600' filter='url(%23n)'/%3E%3C/svg%3E")`;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <AbsoluteFill style={{backgroundImage: fibre, backgroundSize: '600px', opacity: 0.22}} />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.faint} 1.5px, transparent 1.5px), linear-gradient(90deg, ${C.faint} 1.5px, transparent 1.5px)`,
          backgroundSize: '90px 90px',
          backgroundPosition: `0 ${-frame * 0.25}px`,
          opacity: 0.42,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(80,60,30,0.22) 100%)'}} />
      <AbsoluteFill style={{background: '#0A1230', opacity: dark}} />
    </AbsoluteFill>
  );
};

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")`;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        backgroundImage: noise,
        backgroundSize: '240px',
        backgroundPosition: `${(frame * 37) % 240}px ${(frame * 53) % 240}px`,
        opacity: 0.09,
        mixBlendMode: 'multiply',
      }}
    />
  );
};

/**
 * RTL word-by-word reveal timed to speech. Each word rises and un-blurs; keywords get a
 * brand-orange marker that wipes in from the right once the word lands.
 */
export const Words: React.FC<{
  text: string;
  a: number;
  b: number;
  t: number;
  hl?: string[];
  size: number;
  font?: string;
  color?: string;
  out?: number;
  align?: 'center' | 'right';
  lh?: number;
  marker?: string;
}> = ({text, a, b, t, hl = [], size, font = F.body, color = C.ink, out = 0, align = 'right', lh = 1.62, marker = C.accSoft}) => {
  const ws = wordTimes(text, a, b);
  return (
    <div
      style={{
        direction: 'rtl',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        columnGap: size * 0.3,
        fontFamily: font,
        fontSize: size,
        lineHeight: lh,
        color,
      }}
    >
      {ws.map(({w, t: wt}, i) => {
        const k = spT(t, wt - 0.12, {damping: 16, stiffness: 170, mass: 0.7});
        const isHl = hl.includes(strip(w));
        const m = isHl ? prog(t, wt + 0.15, wt + 0.55, easeOut) : 0;
        const o = clamp01(k * 1.4) * (1 - out);
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', opacity: o, transform: `translateY(${(1 - k) * size * 0.32 - out * size * 0.4}px)`, filter: `blur(${(1 - clamp01(k)) * 5}px)`}}>
            {isHl && (
              <span
                style={{
                  position: 'absolute',
                  right: -size * 0.1,
                  left: -size * 0.1,
                  top: '30%',
                  bottom: '14%',
                  background: marker,
                  borderRadius: size * 0.14,
                  transform: `scaleX(${m})`,
                  transformOrigin: '100% 50%',
                }}
              />
            )}
            <span style={{position: 'relative'}}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

/** Rubber stamp: slams in from 1.7× with a little shake, rough-edged ink. */
export const Stamp: React.FC<{
  t: number;
  at: number;
  text: string;
  x: number;
  y: number;
  rot?: number;
  size?: number;
  color?: string;
  id: string;
}> = ({t, at, text, x, y, rot = -10, size = 64, color = C.accDeep, id}) => {
  if (t < at) return null;
  const k = spT(t, at, {damping: 13, stiffness: 320, mass: 0.6});
  const s = lerp(1.8, 1, k);
  const o = clamp01((t - at) / 0.06);
  const w = text.length * size * 0.58 + size * 1.1;
  const h = size * 1.7;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
      <defs>
        <filter id={`rough-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
      </defs>
      <rect x={-w / 2 - 6} y={-h / 2 - 6} width={w + 12} height={h + 12} rx={size * 0.26} fill="rgba(247,242,231,0.9)" />
      <g filter={`url(#rough-${id})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={size * 0.22} fill="none" stroke={color} strokeWidth={size * 0.11} />
        <rect x={-w / 2 + size * 0.17} y={-h / 2 + size * 0.17} width={w - size * 0.34} height={h - size * 0.34} rx={size * 0.12} fill="none" stroke={color} strokeWidth={size * 0.04} />
        <text x={0} y={size * 0.12} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={F.title} fontSize={size} fill={color}>
          {text}
        </text>
      </g>
    </g>
  );
};

/** Simple person glyph standing on (x, y). */
export const Person: React.FC<{x: number; y: number; s?: number; fill?: string; o?: number; rot?: number}> = ({x, y, s = 1, fill = C.ink, o = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <circle cx={0} cy={-58} r={15} fill={fill} />
    <path d="M-24 0 C-24 -26 -16 -38 0 -38 C16 -38 24 -26 24 0 Z" fill={fill} />
  </g>
);

export const Label: React.FC<{x: number; y: number; text: string; size?: number; fill?: string; o?: number; font?: string}> = ({x, y, text, size = 34, fill = C.ink, o = 1, font = F.black}) => (
  <text x={x} y={y} textAnchor="middle" direction="rtl" fontFamily={font} fontSize={size} fill={fill} opacity={o}>
    {text}
  </text>
);

/** Path that draws itself as k goes 0→1. */
export const Draw: React.FC<{d: string; k: number; stroke?: string; w?: number; len?: number; dash?: string; cap?: 'round' | 'butt'}> = ({d, k, stroke = C.ink, w = 6, len = 2000, cap = 'round'}) => (
  <path d={d} fill="none" stroke={stroke} strokeWidth={w} strokeLinecap={cap} strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - k)} />
);

export const pop = (t: number, at: number) => spT(t, at, POP);
