import React, {useMemo} from 'react';
import {interpolateColors} from 'remotion';
import {C, F, clamp01, easeOut, lerp, prog, soft, spT, strip, wordTimes} from '../lib';
import {layoutText} from './kashida';


/**
 * Kashida-justified RTL text that writes itself on, right to left, in step with the voice.
 * Each line is unveiled by a soft-edged mask whose edge tracks the word being spoken; a warm
 * light rides that edge. Keywords then take a rounded gold pill with one shimmer pass.
 */
export const Type: React.FC<{
  text: string;
  a: number;
  b: number;
  t: number;
  size: number;
  maxW: number;
  family?: string;
  hlFamily?: string;
  hl?: string[];
  align?: 'center' | 'right';
  color?: string;
  lh?: number;
  out?: number;
  lead?: number;
  maxKashidaEm?: number;
  space?: number;
  fit?: number;
  minScale?: number;
  pill?: [string, string];
  pillGlow?: string;
  hlInk?: string;
  maxLines?: number;
}> = ({text, a, b, t, size: size0, maxW, fit = 1, minScale = 0.8, pill = [C.acc2, C.acc], pillGlow = 'rgba(245,160,0,', hlInk = C.deep, maxLines = 5, family = F.body, hlFamily, hl = [], align = 'right', color = C.white, lh = 1.75, out = 0, lead = 0.14, maxKashidaEm, space}) => {
  // Pick the line count whose lines are most even (least kashida needed), scaling the type between
  // minScale and fit so the justified block fills maxW and no margin is left empty.
  const {lay, size} = useMemo(() => {
    const base = {family, hlFamily, maxW, hl: (w: string) => hl.includes(strip(w)), maxKashidaEm, space, center: align === 'center'};
    const n = text.split(' ').filter(Boolean).length;
    let best: {L: number; s: number; score: number} | null = null;
    for (let L = 1; L <= Math.min(maxLines, n); L++) {
      const l0 = layoutText(text, {...base, size: size0, lines: L});
      const s = Math.min(fit, (maxW / l0.width) * 0.995);
      if (s < minScale) continue;
      const score = l0.ragged * 1.4 + Math.max(0, 1 - s) * 0.6 - Math.min(s, 1.4) * 0.12 + L * 0.015;
      if (!best || score < best.score) best = {L, s, score};
    }
    const pick = best ?? {L: maxLines, s: minScale};
    const size = size0 * pick.s;
    return {lay: layoutText(text, {...base, size, lines: pick.L}), size};
  }, [text, size0, family, hlFamily, maxW, hl.join('|'), maxKashidaEm, space, fit, minScale, maxLines, align]);
  const wt = useMemo(() => wordTimes(text.split(' ').filter(Boolean), a - lead, b - lead), [text, a, b, lead]);
  const lineH = size * lh;
  const pad = size * 0.45;
  const padX = size * 0.4;
  const edgeW = size * 0.9;

  return (
    <div
      style={{
        position: 'relative',
        width: lay.width,
        height: lay.lines.length * lineH,
        marginLeft: 'auto',
        marginRight: align === 'center' ? 'auto' : 0,
        opacity: 1 - out,
        transform: `translateY(${-out * size * 0.35}px)`,
        filter: out > 0.01 ? `blur(${out * 10}px)` : undefined,
      }}
    >
      {lay.lines.map((line, li) => {
        const ws = line.words;
        const first = wt[ws[0].idx].t0;
        const lastW = ws[ws.length - 1];
        const end = wt[lastW.idx].t1;
        if (t < first - 0.2) return null;
        // edge position (px from the right) as a piecewise-linear path through the word starts
        let e: number;
        if (t <= first) e = lerp(-edgeW, ws[0].x, clamp01((t - first + 0.2) / 0.2));
        else if (t >= end) e = lastW.x + lastW.w + ((t - end) / 0.25) * (edgeW + padX);
        else {
          e = lastW.x + lastW.w;
          for (let q = 0; q < ws.length; q++) {
            const t0 = wt[ws[q].idx].t0;
            const t1 = q + 1 < ws.length ? wt[ws[q + 1].idx].t0 : end;
            if (t >= t0 && t < t1) {
              const x1 = q + 1 < ws.length ? ws[q + 1].x : lastW.x + lastW.w;
              e = lerp(ws[q].x, x1, (t - t0) / (t1 - t0));
              break;
            }
          }
        }
        const done = t >= end + 0.3;
        const ePx = e + padX;
        const mask = done ? undefined : `linear-gradient(to left, #000 ${ePx}px, rgba(0,0,0,0) ${ePx + edgeW}px)`;
        const glow = clamp01((t - first + 0.1) / 0.25) * clamp01((end + 0.25 - t) / 0.3);
        return (
          <React.Fragment key={li}>
            <div
              style={{
                position: 'absolute',
                right: -padX,
                top: li * lineH - pad,
                width: lay.width + padX * 2,
                height: lineH + pad * 2,
                WebkitMaskImage: mask,
                maskImage: mask,
              }}
            >
              {ws.map((w, q) => {
                const px = size * 0.1;
                const {t0, t1} = wt[w.idx];
                const k = spT(t, t0 - 0.05, {damping: 20, stiffness: 150, mass: 0.7});
                const p = w.hl ? prog(t, t1 - 0.12, t1 + 0.42, easeOut) : 0;
                return (
                  <React.Fragment key={w.idx}>
                    {w.hl && (q === 0 || !ws[q - 1].hl) && (() => {
                      // one pill for a run of neighbouring keywords; it grows word by word
                      let qq = q;
                      while (qq + 1 < ws.length && ws[qq + 1].hl) qq++;
                      const run = ws.slice(q, qq + 1);
                      let left = 0;
                      let shK = 0;
                      for (const r of run) {
                        const rt = wt[r.idx].t1;
                        const rp = prog(t, rt - 0.12, rt + 0.42, easeOut);
                        if (rp > 0) left = r.x + r.w * rp;
                        shK = prog(t, rt + 0.25, rt + 1.1, soft);
                      }
                      if (left <= 0) return null;
                      const pw = left - w.x + px * 2;
                      return (
                        <div
                          style={{
                            position: 'absolute',
                            right: w.x + padX - px,
                            top: pad + lineH * 0.14,
                            width: pw,
                            height: lineH * 0.74,
                            borderRadius: lineH * 0.12,
                            background: `linear-gradient(100deg, ${pill[0]}, ${pill[1]} 70%)`,
                            boxShadow: `0 0 ${size * 0.6}px ${pillGlow}${(0.22 + 0.35 * Math.sin(Math.PI * clamp01(shK * 1.2))).toFixed(2)}), inset 0 2px 0 rgba(255,255,255,0.4)`,
                            overflow: 'hidden',
                          }}
                        >
                          {shK > 0 && shK < 1 && (
                            <div style={{position: 'absolute', top: -10, bottom: -10, width: Math.min(pw * 0.5, size * 3), left: pw * (1.1 - 1.8 * shK), transform: 'skewX(-22deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.8), rgba(255,255,255,0))'}} />
                          )}
                        </div>
                      );
                    })()}
                    <span
                      style={{
                        position: 'absolute',
                        right: w.x + padX,
                        top: pad,
                        height: lineH,
                        lineHeight: `${lineH}px`,
                        whiteSpace: 'nowrap',
                        direction: 'rtl',
                        fontFamily: w.hl && hlFamily ? hlFamily : family,
                        fontSize: size,
                        color: w.hl ? interpolateColors(p, [0, 1], [color, hlInk]) : color,
                        transform: `translateY(${(1 - k) * size * 0.2}px)`,
                      }}
                    >
                      {w.text}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
            {glow > 0 && (
              <div
                style={{
                  position: 'absolute',
                  right: e - size * 0.9,
                  top: li * lineH - lineH * 0.15,
                  width: size * 1.8,
                  height: lineH * 1.3,
                  background: 'radial-gradient(ellipse at center, rgba(255,205,110,0.5), rgba(245,160,0,0.16) 40%, rgba(245,160,0,0) 68%)',
                  mixBlendMode: 'screen',
                  opacity: glow,
                  pointerEvents: 'none',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
