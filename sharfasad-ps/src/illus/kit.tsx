import React from 'react';
import {C, F, clamp01, easeOut, lerp, prog, soft, spT} from '../lib';

export const IW = 860;
export const IH = 760;
export type P = {t: number; d: number};

/** 0 for the card in front, →1 for cards waiting at the sides of the carousel. */
export const DimCtx = React.createContext(0);

/**
 * One depth layer of an illustration. Layers are flat SVGs stacked along Z inside the card, so
 * the camera drift and the carousel turn make them slide against each other.
 */
export const L: React.FC<{z: number; children: React.ReactNode; shadow?: number; glow?: boolean}> = ({z, children, shadow = 0.4, glow}) => {
  const dim = React.useContext(DimCtx);
  return (
  <svg
    viewBox={`0 0 ${IW} ${IH}`}
    width={IW}
    height={IH}
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      overflow: 'visible',
      transform: `translateZ(${z}px)`,
      opacity: 1 - dim * 0.72,
      filter: glow ? 'drop-shadow(0 0 26px rgba(245,160,0,0.55))' : shadow ? `drop-shadow(0 ${10 + z * 0.16}px ${12 + z * 0.14}px rgba(1,4,24,${shadow}))` : undefined,
    }}
  >
    <defs>
      <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFD071" />
        <stop offset="0.55" stopColor={C.acc} />
        <stop offset="1" stopColor="#D98200" />
      </linearGradient>
      <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#B9C8FF" />
      </linearGradient>
      <linearGradient id="gB" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6F8DFF" />
        <stop offset="1" stopColor="#2A44B8" />
      </linearGradient>
      <linearGradient id="gD" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#22379C" />
        <stop offset="1" stopColor="#0A1445" />
      </linearGradient>
      <linearGradient id="gG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,0.30)" />
        <stop offset="1" stopColor="rgba(255,255,255,0.06)" />
      </linearGradient>
      <radialGradient id="gHalo">
        <stop offset="0" stopColor="rgba(255,196,96,0.75)" />
        <stop offset="1" stopColor="rgba(245,160,0,0)" />
      </radialGradient>
      <radialGradient id="gCool">
        <stop offset="0" stopColor="rgba(110,150,255,0.6)" />
        <stop offset="1" stopColor="rgba(110,150,255,0)" />
      </radialGradient>
      <clipPath id="cardClip">
        <rect x={14} y={14} width={IW - 28} height={IH - 28} rx={44} />
      </clipPath>
    </defs>
    {children}
  </svg>
  );
};

/** Rounded person: head + soft shoulders, standing on (x, y). */
export const Person: React.FC<{x: number; y: number; s?: number; fill?: string; o?: number; rot?: number}> = ({x, y, s = 1, fill = 'url(#gW)', o = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <circle cx={0} cy={-62} r={17} fill={fill} />
    <path d="M-27 -4 C-27 -30 -17 -40 0 -40 C17 -40 27 -30 27 -4 C27 0 24 0 20 0 L-20 0 C-24 0 -27 0 -27 -4 Z" fill={fill} />
  </g>
);

export const Txt: React.FC<{x: number; y: number; text: string; size?: number; fill?: string; o?: number; font?: string; anchor?: 'middle' | 'start' | 'end'}> = ({x, y, text, size = 34, fill = C.white, o = 1, font = F.semi, anchor = 'middle'}) => (
  <text x={x} y={y} textAnchor={anchor} direction="rtl" fontFamily={font} fontSize={size} fill={fill} opacity={o}>
    {text}
  </text>
);

/**
 * Rounded label that lands softly (no bounce), then takes one shimmer pass.
 * kind 'acc' = gold verdict tag, 'glass' = quiet caption chip.
 */
export const Tag: React.FC<{t: number; at: number; text: string; x: number; y: number; size?: number; kind?: 'acc' | 'glass' | 'dark'; rot?: number; id: string; w?: number}> = ({t, at, text, x, y, size = 40, kind = 'glass', rot = 0, id, w}) => {
  if (t < at) return null;
  const k = spT(t, at, {damping: 20, stiffness: 150, mass: 0.8});
  const sh = prog(t, at + 0.25, at + 1.05, soft);
  const ww = w ?? text.length * size * 0.56 + size * 1.5;
  const h = size * 1.9;
  const fill = kind === 'acc' ? 'url(#gO)' : kind === 'dark' ? 'rgba(6,14,52,0.86)' : 'rgba(255,255,255,0.14)';
  return (
    <g transform={`translate(${x} ${y + (1 - k) * 26}) rotate(${rot}) scale(${lerp(0.82, 1, k)})`} opacity={clamp01(k * 2.2)}>
      <clipPath id={`tg-${id}`}>
        <rect x={-ww / 2} y={-h / 2} width={ww} height={h} rx={h / 2} />
      </clipPath>
      <rect x={-ww / 2} y={-h / 2} width={ww} height={h} rx={h / 2} fill={fill} stroke={kind === 'acc' ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.32)'} strokeWidth={2} />
      <g clipPath={`url(#tg-${id})`}>
        {sh > 0 && sh < 1 && <rect x={lerp(ww / 2 + 30, -ww / 2 - ww * 0.4, sh)} y={-h} width={ww * 0.36} height={h * 2} fill="rgba(255,255,255,0.7)" transform="skewX(-20)" />}
      </g>
      <text x={0} y={size * 0.34} textAnchor="middle" direction="rtl" fontFamily={F.semi} fontSize={size} fill={kind === 'acc' ? C.deep : C.white}>
        {text}
      </text>
    </g>
  );
};

/** Path that draws itself as k goes 0→1. */
export const Draw: React.FC<{d: string; k: number; stroke?: string; w?: number; len?: number; cap?: 'round' | 'butt'; o?: number}> = ({d, k, stroke = C.white, w = 6, len = 2000, cap = 'round', o = 1}) =>
  k <= 0 ? null : <path d={d} fill="none" stroke={stroke} strokeWidth={w} strokeLinecap={cap} strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - k)} opacity={o} />;

export const burst = (cx: number, cy: number, r: number, n = 9, inner = 0.42) => {
  let s = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * inner : r;
    s += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }
  return s + 'Z';
};

/** Smooth, bounce-free arrival. */
export const arrive = (t: number, at: number) => spT(t, at, {damping: 22, stiffness: 130, mass: 0.9});
export const out = easeOut;
