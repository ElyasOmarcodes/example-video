import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, TL, clamp01, lerp, prog, rnd, soft} from '../lib';

/** Which section (0-4) owns time t, as a float that eases across boundaries (for light/colour moves). */
export const sectionMix = (t: number) => {
  const s = TL.sections;
  let v = 0;
  for (let i = 1; i < s.length; i++) v += prog(t, s[i].t0 - 0.5, s[i].t0 + 0.7, soft);
  return v;
};

/** Slow handheld drift plus a small push at every section change. Degrees / px. */
export const camera = (t: number) => {
  const beat = TL.sections.reduce((acc, s) => acc + Math.exp(-Math.pow((t - s.t0 - 0.3) / 0.9, 2)), 0);
  return {
    ry: Math.sin(t * 0.31) * 3.8 + Math.sin(t * 0.13 + 1) * 1.6,
    rx: Math.sin(t * 0.23 + 0.7) * 2.4 - 1,
    z: Math.sin(t * 0.17) * 40 - beat * 120,
    x: Math.sin(t * 0.21 + 2) * 14,
    y: Math.cos(t * 0.19) * 10,
  };
};

/** Far layers: deep gradient, moving key lights, a perspective floor that scrolls towards the lens. */
export const Backdrop: React.FC<{t: number; dark?: number}> = ({t, dark = 0}) => {
  const m = sectionMix(t);
  const cam = camera(t);
  // key light positions per section (x%, y%), blended
  const KEY: [number, number][] = [[78, 22], [20, 30], [70, 62], [26, 20], [60, 28]];
  const i0 = Math.floor(Math.min(m, 3.999)), f = m - i0;
  const kx = lerp(KEY[i0][0], KEY[i0 + 1][0], f) + Math.sin(t * 0.4) * 4;
  const ky = lerp(KEY[i0][1], KEY[i0 + 1][1], f) + Math.cos(t * 0.33) * 3;
  return (
    <AbsoluteFill style={{background: C.bg0, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(120% 75% at 50% 30%, ${C.bg2} 0%, ${C.bg1} 45%, ${C.bg0} 100%)`}} />
      {/* warm key + cool fill, parallaxed against the camera */}
      <div style={{position: 'absolute', left: `${kx}%`, top: `${ky}%`, width: 1500, height: 1500, margin: -750, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,160,0,0.34), rgba(245,160,0,0.10) 38%, rgba(245,160,0,0) 66%)', transform: `translate(${-cam.ry * 9}px, ${cam.rx * 9}px)`, opacity: 1 - dark * 0.55}} />
      <div style={{position: 'absolute', left: `${100 - kx}%`, top: `${70 - ky * 0.4}%`, width: 1700, height: 1700, margin: -850, borderRadius: '50%', background: 'radial-gradient(circle, rgba(70,110,255,0.42), rgba(70,110,255,0.12) 40%, rgba(70,110,255,0) 68%)', transform: `translate(${-cam.ry * 14}px, ${cam.rx * 14}px)`}} />
      {/* floor */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 900, perspective: 900, perspectiveOrigin: `${50 + cam.ry * 1.6}% 0%`, WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 4%, #000 55%)', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 4%, #000 55%)', opacity: 0.55}}>
        <div
          style={{
            position: 'absolute',
            left: -1400,
            right: -1400,
            top: 0,
            height: 2600,
            transformOrigin: '50% 0%',
            transform: 'rotateX(78deg)',
            backgroundImage: `linear-gradient(${C.line} 2px, transparent 2px), linear-gradient(90deg, ${C.line} 2px, transparent 2px)`,
            backgroundSize: '160px 160px',
            backgroundPosition: `0 ${(t * 46) % 160}px`,
          }}
        />
      </div>
      <AbsoluteFill style={{background: '#01030F', opacity: dark * 0.72}} />
    </AbsoluteFill>
  );
};

/** Dust motes at several depths; nearer ones are larger, softer and move more with the camera. */
export const Dust: React.FC<{t: number; n?: number}> = ({t, n = 46}) => {
  const cam = camera(t);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: n}).map((_, i) => {
        const depth = rnd(i, 1); // 0 far .. 1 near
        const x = rnd(i, 2) * 1180 - 50 - cam.ry * (6 + depth * 30);
        const speed = 8 + depth * 26;
        const y = ((rnd(i, 3) * 2100 - t * speed) % 2100 + 2100) % 2100 - 90 + cam.rx * (6 + depth * 30);
        const r = 2 + depth * depth * 16;
        const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + rnd(i, 4)) + i);
        const warm = rnd(i, 5) > 0.7;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              background: warm ? 'rgba(255,196,96,1)' : 'rgba(170,195,255,1)',
              opacity: (0.1 + (1 - depth) * 0.3) * (0.4 + 0.6 * tw),
              filter: `blur(${depth * depth * 7}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Foreground finish: lens vignette, soft top/bottom falloff, fine grain. */
export const Finish: React.FC<{frame: number}> = ({frame}) => {
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 52%, rgba(1,3,15,0.62) 100%)'}} />
      <AbsoluteFill style={{backgroundImage: noise, backgroundSize: '240px', backgroundPosition: `${(frame * 37) % 240}px ${(frame * 53) % 240}px`, opacity: 0.06, mixBlendMode: 'overlay'}} />
    </AbsoluteFill>
  );
};

/** 3D world: children can sit at any translateZ and will parallax as the camera drifts. */
export const World: React.FC<{t: number; children: React.ReactNode; amount?: number}> = ({t, children, amount = 1}) => {
  const c = camera(t);
  return (
    <AbsoluteFill style={{perspective: 2000, perspectiveOrigin: '50% 42%'}}>
      <AbsoluteFill style={{transformStyle: 'preserve-3d', transform: `translate3d(${c.x * amount}px, ${c.y * amount}px, ${c.z * amount}px) rotateX(${c.rx * amount}deg) rotateY(${c.ry * amount}deg)`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** One pass of light across a rounded surface. k: 0→1. Sweeps right→left (the reading direction). */
export const Shimmer: React.FC<{k: number; radius?: number; strength?: number; width?: number}> = ({k, radius = 0, strength = 0.5, width = 0.34}) => {
  if (k <= 0 || k >= 1) return null;
  return (
    <div style={{position: 'absolute', inset: 0, borderRadius: radius, overflow: 'hidden', pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          bottom: '-20%',
          width: `${width * 100}%`,
          left: `${lerp(115, -45, k)}%`,
          transform: 'skewX(-20deg)',
          background: `linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,${strength}) 50%, rgba(255,255,255,0))`,
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
};

export const glass = (radius = 56, tint = 0.5): React.CSSProperties => ({
  borderRadius: radius,
  background: `linear-gradient(150deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 38%, rgba(90,125,255,0.10) 100%), rgba(7,16,58,${tint})`,
  border: '1.5px solid rgba(255,255,255,0.22)',
  boxShadow: '0 50px 110px rgba(0,0,0,0.5), inset 0 1.5px 0 rgba(255,255,255,0.42), inset 0 -30px 60px rgba(60,100,255,0.10)',
});

export const fadeEdge = (t: number, t0: number, t1: number, d = 0.4) => clamp01((t - t0) / d) * clamp01((t1 - t) / d);
