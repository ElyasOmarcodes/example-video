import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, F, FPS, TL, partLabel, clamp01, easeIn, easeInOut, easeOut, fa, lerp, prog, soft, spT} from './lib';
import {useFonts} from './text/fonts';
import {Type} from './text/Type';
import {Backdrop, Dust, Finish, Shimmer, World, glass} from './stage/stage';
import {DimCtx, IH, IW, L, Person, Tag} from './illus/kit';
import {Megaphone, Org, Phone, Shield, Tapes, Deny, Tug} from './illus/a';
import {Burden, Chain, Claims, Hourglass, MapAfg, Ship, Slogan, TwoLives} from './illus/b';
import afg from './data/afg.json';

type Sec = (typeof TL.sections)[number];
type Bul = Sec['bullets'][number] & {hl?: string[]};

const ILLUS: Record<string, React.FC<{t: number; d: number}>> = {
  '1.0': Phone, '1.1': Megaphone, '1.2': Tapes,
  '3.0': Org, '3.1': Shield, '3.2': Deny, '3.3': Tug,
  '4.0': TwoLives, '4.1': Burden, '4.2': Hourglass, '4.3': MapAfg,
  '5.0': Slogan, '5.1': Claims, '5.2': Chain, '5.3': Ship,
};

const CARD_Y = 322; // top of the card row
const STEP = 44; // carousel angle between cards
const RADIUS = 1150;

// ─── chrome: logo only (no wordmark text), quiet label, rounded progress ─────────────
const Chrome: React.FC<{t: number}> = ({t}) => {
  const on = prog(t, 0.2, 1.0) * (1 - prog(t, TL.outro.t0 - 0.2, TL.outro.t0 + 0.15));
  if (on <= 0) return null;
  const total = TL.end.t1;
  return (
    <AbsoluteFill style={{opacity: on}}>
      <Img src={staticFile('img/logo-color.png')} style={{position: 'absolute', top: 58, right: 58, height: 74}} />
      <div style={{position: 'absolute', top: 70, left: 58, padding: '8px 26px 10px', borderRadius: 30, border: '1.5px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.06)', fontFamily: F.light, fontSize: 28, color: C.dim, direction: 'rtl'}}>تحلیلي ګرافیک</div>
      <div style={{position: 'absolute', bottom: 62, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12, direction: 'rtl'}}>
        {TL.sections.map((s, i) => {
          const act = spT(t, s.t0, {damping: 24, stiffness: 110}) * (1 - spT(t, s.t1, {damping: 24, stiffness: 110}));
          const fill = clamp01((t - s.t0) / (s.t1 - s.t0));
          const done = t >= s.t1;
          return (
            <div key={i} style={{position: 'relative', width: lerp(22, 150, act), height: 22, borderRadius: 11, background: done ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.14)', overflow: 'hidden', boxShadow: act > 0.5 ? '0 0 22px rgba(245,160,0,0.45)' : undefined}}>
              {!done && <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: `${fill * 100}%`, borderRadius: 11, background: `linear-gradient(270deg, ${C.acc2}, ${C.acc})`}} />}
            </div>
          );
        })}
        <div style={{width: 22, height: 22, borderRadius: 11, background: t >= TL.q.t0 ? C.acc : 'rgba(255,255,255,0.14)', opacity: t >= total ? 0.75 : 1}} />
      </div>
    </AbsoluteFill>
  );
};

// ─── title: a marionette rig above the question the film asks ────────────────────────
export const Title: React.FC<{t: number}> = ({t}) => {
  const T = TL.title;
  const k = spT(t, -0.9, {damping: 24, stiffness: 70});
  const out = prog(t, T.t1 - 0.5, T.t1, easeIn);
  const sway = Math.sin(t * 1.1) * 14;
  const figs = [-190, 0, 190];
  const barY = 150, figY = 560;
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `scale(${1 + out * 0.28})`, filter: out > 0.01 ? `blur(${out * 14}px)` : undefined}}>
      <World t={t}>
        {/* far: halo + orbit */}
        <svg width={1080} height={900} style={{position: 'absolute', left: 0, top: 250, overflow: 'visible', transform: 'translateZ(-260px)'}}>
          <defs>
            <radialGradient id="tHalo"><stop offset="0" stopColor="rgba(255,196,96,0.55)" /><stop offset="1" stopColor="rgba(245,160,0,0)" /></radialGradient>
          </defs>
          <circle cx={540} cy={360} r={520} fill="url(#tHalo)" opacity={k} />
          <g transform={`translate(540 380) rotate(${t * 8})`} opacity={0.5 * k}>
            <circle r={430} fill="none" stroke={C.blue} strokeWidth={3} strokeDasharray="4 26" strokeLinecap="round" />
            <circle r={330} fill="none" stroke={C.acc} strokeWidth={2} strokeDasharray="120 60" />
          </g>
        </svg>
        {/* strings */}
        <svg width={1080} height={900} style={{position: 'absolute', left: 0, top: 250, overflow: 'visible', transform: 'translateZ(-60px)'}}>
          {figs.map((fx, i) => {
            const bx = 540 + fx * 0.72 + sway * 0.6, by = barY + Math.sin(t * 1.1 + i) * 4;
            const px = 540 + fx + sway * (0.5 + i * 0.2), py = figY - 150 + Math.sin(t * 1.6 + i * 1.3) * 10;
            return <path key={i} d={`M${bx} ${by} Q${(bx + px) / 2 + sway} ${(by + py) / 2} ${px} ${py}`} fill="none" stroke="rgba(255,226,166,0.85)" strokeWidth={3} strokeDasharray={600} strokeDashoffset={600 * (1 - prog(t, -0.6 + i * 0.12, 0.5 + i * 0.12, easeOut))} />;
          })}
        </svg>
        {/* the hand and the control bar */}
        <svg width={1080} height={900} style={{position: 'absolute', left: 0, top: 250, overflow: 'visible', transform: 'translateZ(40px)', filter: 'drop-shadow(0 30px 30px rgba(1,4,24,0.5))'}}>
          <defs>
            <linearGradient id="tW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#B9C8FF" /></linearGradient>
            <linearGradient id="tD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#22379C" /><stop offset="1" stopColor="#0A1445" /></linearGradient>
          </defs>
          <g transform={`translate(${540 + sway * 0.6} ${barY + (1 - k) * -260}) rotate(${sway * 0.25})`}>
            <rect x={-60} y={-330} width={120} height={270} rx={30} fill="url(#tD)" stroke="rgba(255,255,255,0.4)" strokeWidth={2.5} />
            <rect x={-70} y={-90} width={140} height={34} rx={17} fill="#F3F6FF" />
            <rect x={-54} y={-62} width={108} height={74} rx={34} fill="url(#tW)" />
            <rect x={-190} y={-12} width={380} height={26} rx={13} fill="url(#tW)" />
          </g>
        </svg>
        {/* the puppets on a glass plinth */}
        <svg width={1080} height={900} style={{position: 'absolute', left: 0, top: 250, overflow: 'visible', transform: 'translateZ(120px)', filter: 'drop-shadow(0 26px 26px rgba(1,4,24,0.55))'}}>
          <defs>
            <linearGradient id="tO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD071" /><stop offset="1" stopColor="#D98200" /></linearGradient>
          </defs>
          <ellipse cx={540} cy={figY + 16} rx={360} ry={46} fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
          {figs.map((fx, i) => {
            const a = spT(t, -0.7 + i * 0.14, {damping: 22, stiffness: 90});
            return (
              <g key={i} transform={`translate(${540 + fx + sway * (0.5 + i * 0.2)} ${figY + Math.sin(t * 1.6 + i * 1.3) * 10 + (1 - a) * 80}) rotate(${Math.sin(t * 1.1 + i) * 5}) scale(${i === 1 ? 2.9 : 2.4})`} opacity={a}>
                <circle cx={0} cy={-62} r={17} fill={i === 1 ? 'url(#tO)' : 'url(#tW)'} />
                <path d="M-27 -4 C-27 -30 -17 -40 0 -40 C17 -40 27 -30 27 -4 C27 0 24 0 20 0 L-20 0 C-24 0 -27 0 -27 -4 Z" fill={i === 1 ? 'url(#tO)' : 'url(#tW)'} />
              </g>
            );
          })}
        </svg>
        {/* the title */}
        <div style={{position: 'absolute', left: 90, right: 90, top: 1010, transform: 'translateZ(30px)'}}>
          <Type text={T.text} a={T.a - 0.25} b={T.b - 0.2} t={t} size={96} maxW={880} fit={1.2} family={F.title} align="center" lh={1.48} hl={['شر', 'فساد', 'اجیر', 'مشران']} maxKashidaEm={0.62} />
        </div>
      </World>
    </AbsoluteFill>
  );
};

// ─── extruded 3D glyph (stacked faces along Z) ───────────────────────────────────────
export const Glyph3D: React.FC<{ch: string; size: number; depth?: number; yaw: number; pitch?: number; shimmer?: number}> = ({ch, size, depth = 16, yaw, pitch = -6, shimmer = 0}) => (
  <div style={{position: 'absolute', left: -size, top: -size * 0.75, width: size * 2, height: size * 1.5, perspective: 1800}}>
  <div style={{position: 'absolute', left: size, top: size * 0.75, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `rotateX(${pitch}deg) rotateY(${yaw}deg)`}}>
    {Array.from({length: depth}).map((_, j) => {
      const i = depth - 1 - j; // paint back to front
      const shade = i / depth;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: -size,
            top: -size * 0.75,
            width: size * 2,
            height: size * 1.5,
            lineHeight: `${size * 1.5}px`,
            textAlign: 'center',
            fontFamily: F.title,
            fontSize: size,
            transform: `translateZ(${-i * 7}px)`,
            color: i === 0 ? 'transparent' : `rgb(${lerp(190, 96, shade)},${lerp(112, 52, shade)},${lerp(0, 6, shade)})`,
            backgroundImage: i === 0 ? `linear-gradient(${115 + shimmer * 40}deg, #FFE3A3 0%, ${C.acc2} ${20 + shimmer * 30}%, #FFF4D6 ${34 + shimmer * 40}%, ${C.acc} ${52 + shimmer * 30}%, #E08A00 100%)` : undefined,
            WebkitBackgroundClip: i === 0 ? 'text' : undefined,
            backgroundClip: i === 0 ? 'text' : undefined,
          }}
        >
          {ch}
        </div>
      );
    })}
  </div>
  </div>
);

const Hero: React.FC<{s: Sec; t: number}> = ({s, t}) => {
  const k = spT(t, s.t0 + 0.05, {damping: 20, stiffness: 70, mass: 1});
  const out = prog(t, s.hb + 0.05, s.hb + 0.7, easeInOut);
  if (out >= 1) return null;
  const yaw = lerp(-100, 0, k) + Math.sin((t - s.t0) * 0.9) * 13;
  return (
    <AbsoluteFill style={{transformStyle: 'preserve-3d', transform: `translate3d(${out * 330}px, ${-out * 590}px, ${-out * 300}px) scale(${1 - out * 0.74})`, opacity: 1 - prog(t, s.hb + 0.35, s.hb + 0.7)}}>
      {/* plinth light + orbit rings */}
      <div style={{position: 'absolute', left: 540 - 420, top: 760 - 420, width: 840, height: 840, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,196,96,0.42), rgba(245,160,0,0.10) 45%, rgba(245,160,0,0) 68%)', transform: 'translateZ(-200px)', opacity: k}} />
      <div style={{position: 'absolute', left: 540, top: 760, width: 0, height: 0, transformStyle: 'preserve-3d', transform: 'rotateX(72deg)'}}>
        {[0, 1].map((i) => (
          <div key={i} style={{position: 'absolute', left: -(300 + i * 70), top: -(300 + i * 70), width: 600 + i * 140, height: 600 + i * 140, borderRadius: '50%', border: i ? `3px dashed ${C.blue}` : `5px solid ${C.acc}`, borderLeftColor: i ? undefined : 'transparent', opacity: (i ? 0.5 : 0.9) * k, transform: `rotateZ(${(i ? -1 : 1) * (t - s.t0) * 40}deg)`}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 540, top: 760, transformStyle: 'preserve-3d', transform: `scale(${lerp(0.6, 1, k)})`, opacity: clamp01(k * 3)}}>
        <Glyph3D ch={fa(s.n)} size={470} yaw={yaw} shimmer={prog(t, s.t0 + 0.5, s.t0 + 1.9, soft)} />
      </div>
      <div style={{position: 'absolute', top: 380, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: 'translateZ(40px)', opacity: prog(t, s.t0 + 0.1, s.t0 + 0.6)}}>
        <div style={{padding: '10px 40px 14px', borderRadius: 40, ...glass(40, 0.4), fontFamily: F.medium, fontSize: 38, color: C.white, direction: 'rtl', position: 'relative'}}>
          {partLabel(s.n)}
          <Shimmer k={prog(t, s.t0 + 0.4, s.t0 + 1.3, soft)} radius={40} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 90, right: 90, top: 1170, transform: 'translateZ(40px)'}}>
        <Type text={s.head} a={s.ha} b={s.hb - 0.25} t={t} size={88} maxW={880} fit={1.2} maxLines={3} family={F.title} align="center" lh={1.5} maxKashidaEm={0.62} />
      </div>
    </AbsoluteFill>
  );
};

const Tab: React.FC<{s: Sec; t: number}> = ({s, t}) => {
  const k = spT(t, s.hb + 0.45, {damping: 22, stiffness: 110});
  const out = prog(t, s.t1 - 0.45, s.t1 - 0.05, easeIn);
  if (k <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 166, right: 58, left: 58, display: 'flex', direction: 'rtl', opacity: clamp01(k * 2) * (1 - out), transform: `translate3d(${(1 - k) * 60}px, ${-out * 30}px, 30px)`}}>
      <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 20, padding: '12px 14px 12px 34px', maxWidth: 964, ...glass(46, 0.5)}}>
        <div style={{width: 68, height: 68, borderRadius: 34, background: `linear-gradient(160deg, ${C.acc2}, ${C.acc} 60%, #D98200)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.title, fontSize: 46, color: C.deep, flexShrink: 0, paddingTop: 6, boxShadow: '0 0 26px rgba(245,160,0,0.5)'}}>{fa(s.n)}</div>
        <div style={{fontFamily: F.semi, fontSize: 36, color: C.white, lineHeight: 1.5}}>{s.head}</div>
        <Shimmer k={prog(t, s.hb + 0.7, s.hb + 1.7, soft)} radius={46} />
      </div>
    </div>
  );
};

const CardBase: React.FC<{dim: number; shimmer: number; children?: React.ReactNode}> = ({dim, shimmer, children}) => (
  <div style={{position: 'absolute', inset: 0, ...glass(58, 0.62), overflow: 'hidden'}}>
    {children}
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 30%)'}} />
    <Shimmer k={shimmer} radius={58} strength={0.34} />
    <div style={{position: 'absolute', inset: 0, background: '#020617', opacity: dim * 0.62}} />
  </div>
);

/** Where the carousel is: 0 on the first bullet, 1 on the second … eased across each hand-over. */
const carouselPos = (s: Sec, t: number) => s.bullets.slice(1).reduce((acc, b) => acc + prog(t, b.a - 0.95, b.a - 0.1, easeInOut), 0);

const Carousel: React.FC<{s: Sec; t: number}> = ({s, t}) => {
  const enter = spT(t, s.hb + 0.4, {damping: 24, stiffness: 80, mass: 1});
  const out = prog(t, s.t1 - 0.5, s.t1, easeIn);
  if (enter <= 0) return null;
  const sim = s.n === 2;
  const pos = sim ? 0 : carouselPos(s, t);
  const simCur = s.bullets.reduce((acc, b, i) => (t >= b.a - 0.4 ? i : acc), 0);
  const simNudge = sim ? s.bullets.slice(1).reduce((acc, b) => acc + Math.sin(Math.PI * prog(t, b.a - 0.8, b.a + 0.4)) , 0) : 0;
  return (
    <div style={{position: 'absolute', left: 540 - IW / 2, top: CARD_Y, width: IW, height: IH, transformStyle: 'preserve-3d', transform: `translate3d(0, ${(1 - enter) * 420}px, ${(1 - enter) * -700 + out * 520}px) rotateX(${(1 - enter) * 24}deg) scale(1.08)`, opacity: clamp01(enter * 2.4) * (1 - out)}}>
      <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translateZ(${-RADIUS}px) rotateY(${pos * STEP + simNudge * 7}deg)`}}>
        {sim ? (
          <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translateZ(${RADIUS}px)`}}>
            <CardBase dim={0} shimmer={prog(t, s.hb + 0.7, s.hb + 1.8, soft)}>
              <Sequence from={Math.round(s.t0 * FPS)} layout="none">
                <OffthreadVideo src={staticFile('recruit.mp4')} muted style={{position: 'absolute', left: 0, top: -50, width: IW, height: IW}} />
              </Sequence>
            </CardBase>
            <L z={170}>
              {s.bullets.map((b, i) =>
                i === simCur ? <Tag key={i} id={'sim' + i} t={t} at={b.a + 0.3} text={['دروغجنې ژمنې', 'بهرنۍ استخباراتي کړۍ', 'غړي قرباني کېږي'][i]} x={430} y={690} size={40} kind={i === 2 ? 'acc' : 'dark'} /> : null,
              )}
            </L>
          </div>
        ) : (
          s.bullets.map((b, i) => {
            const dist = Math.abs(i - pos);
            if (dist > 1.6) return null;
            const Ill = ILLUS[`${s.n}.${i}`];
            return (
              <div key={i} style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${-i * STEP}deg) translateZ(${RADIUS}px)`}}>
                <DimCtx.Provider value={clamp01(dist)}>
                  <CardBase dim={clamp01(dist)} shimmer={prog(t, b.a - 0.35, b.a + 0.75, soft)} />
                  <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', opacity: dist > 0.98 ? 0.35 : 1}}>
                    <Ill t={t - b.a} d={b.b - b.a} />
                  </div>
                </DimCtx.Provider>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const TextPanel: React.FC<{s: Sec; t: number}> = ({s, t}) => {
  const enter = spT(t, s.hb + 0.55, {damping: 24, stiffness: 90});
  const out = prog(t, s.t1 - 0.5, s.t1 - 0.05, easeIn);
  if (enter <= 0) return null;
  const cur = s.bullets.reduce((acc, b, i) => (t >= b.a - 0.5 ? i : acc), 0);
  return (
    <div style={{position: 'absolute', left: 66, right: 66, top: 1180, height: 530, transform: `translate3d(0, ${(1 - enter) * 160 + out * 80}px, 40px)`, opacity: clamp01(enter * 2) * (1 - out)}}>
      <div style={{position: 'absolute', inset: 0, ...glass(54, 0.46)}} />
      <Shimmer k={prog(t, s.hb + 0.9, s.hb + 2.0, soft)} radius={54} strength={0.22} />
      <div style={{position: 'absolute', top: 30, left: 40, display: 'flex', gap: 10, direction: 'rtl'}}>
        {s.bullets.map((_, i) => (
          <div key={i} style={{width: i === cur ? 46 : 14, height: 14, borderRadius: 7, background: i === cur ? C.acc : i < cur ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.22)'}} />
        ))}
      </div>
      <div style={{position: 'absolute', top: 22, right: 44, fontFamily: F.medium, fontSize: 30, color: C.acc2, direction: 'rtl'}}>
        {fa(cur + 1)} / {fa(s.bullets.length)}
      </div>
      {s.bullets.map((b0, i) => {
        const b = b0 as Bul;
        const start = b.a - 0.4;
        const next = s.bullets[i + 1];
        const end = next ? next.a - 0.85 : s.t1;
        if (t < start || t > end + 0.4) return null;
        const o = prog(t, end, end + 0.35, easeIn);
        return (
          <div key={i} style={{position: 'absolute', left: 46, right: 46, top: 84, bottom: 26, display: 'flex', alignItems: 'center'}}>
            <div style={{width: '100%'}}>
              <Type text={b.text} a={b.a} b={b.b - 0.3} t={t} size={56} maxW={856} fit={1.28} maxLines={3} family={F.body} hlFamily={F.semi} hl={b.hl} out={o} lh={1.86} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Section: React.FC<{s: Sec; t: number}> = ({s, t}) => (
  <World t={t}>
    <Hero s={s} t={t} />
    <Tab s={s} t={t} />
    <Carousel s={s} t={t} />
    <TextPanel s={s} t={t} />
  </World>
);

// ─── the final question ──────────────────────────────────────────────────────────────
const Question: React.FC<{t: number}> = ({t}) => {
  const Q = TL.q;
  const k = spT(t, Q.t0 + 0.15, {damping: 22, stiffness: 60});
  const out = prog(t, Q.t1 - 0.45, Q.t1, easeIn);
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <div style={{position: 'absolute', left: 540 - 700, top: -200, width: 1400, height: 1500, background: 'conic-gradient(from 180deg at 50% 0%, rgba(255,214,140,0) 158deg, rgba(255,214,140,0.20) 174deg, rgba(255,230,180,0.30) 180deg, rgba(255,214,140,0.20) 186deg, rgba(255,214,140,0) 202deg)', opacity: k, filter: 'blur(14px)'}} />
      <World t={t}>
        <div style={{position: 'absolute', left: 540 - 380, top: 620 - 380, width: 760, height: 760, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,196,96,0.38), rgba(245,160,0,0) 66%)', transform: 'translateZ(-220px)', opacity: k}} />
        <div style={{position: 'absolute', left: 540, top: 640, transformStyle: 'preserve-3d', transform: `translateZ(-40px) scale(${lerp(0.55, 1, k)})`, opacity: clamp01(k * 2.5)}}>
          <Glyph3D ch="؟" size={560} depth={18} yaw={lerp(70, 0, k) + Math.sin((t - Q.t0) * 0.6) * 22} shimmer={prog(t, Q.t0 + 0.6, Q.t0 + 2.4, soft)} />
        </div>
        <div style={{position: 'absolute', top: 196, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: 'translateZ(70px)'}}>
          <div style={{position: 'relative', padding: '12px 48px 16px', borderRadius: 44, background: `linear-gradient(160deg, ${C.acc2}, ${C.acc} 60%, #D98200)`, fontFamily: F.semi, fontSize: 44, color: C.deep, direction: 'rtl', transform: `scale(${lerp(0.8, 1, spT(t, Q.t0 + 0.1))})`, opacity: prog(t, Q.t0 + 0.05, Q.t0 + 0.4), boxShadow: '0 0 40px rgba(245,160,0,0.45)'}}>
            {Q.label}
            <Shimmer k={prog(t, Q.t0 + 0.5, Q.t0 + 1.4, soft)} radius={44} strength={0.7} />
          </div>
        </div>
        <div style={{position: 'absolute', left: 66, right: 66, top: 990, height: 640, transform: 'translateZ(110px)'}}>
          <div style={{position: 'absolute', inset: 0, ...glass(54, 0.5), opacity: prog(t, Q.t0 + 0.2, Q.t0 + 0.8)}} />
          <div style={{position: 'absolute', left: 44, right: 44, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
            <div style={{width: '100%'}}>
              <Type text={Q.text} a={Q.a} b={Q.b - 0.3} t={t} size={60} maxW={850} fit={1.25} family={F.medium} hlFamily={F.semi} hl={Q.hl} lh={1.9} align="center" />
            </div>
          </div>
        </div>
      </World>
    </AbsoluteFill>
  );
};

// ─── closing statement over the map ──────────────────────────────────────────────────
const Closing: React.FC<{t: number}> = ({t}) => {
  const E = TL.end;
  const k = spT(t, E.t0 + 0.1, {damping: 24, stiffness: 60});
  const out = prog(t, E.t1 - 0.45, E.t1, easeIn);
  const draw = prog(t, E.t0 + 0.1, E.t0 + 2.6, easeOut);
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `scale(${1 + out * 0.08})`}}>
      <World t={t}>
        <svg width={900} height={760} viewBox="0 0 900 760" style={{position: 'absolute', left: 90, top: 250, overflow: 'visible', transform: `translateZ(-120px) scale(${lerp(0.9, 1.08, k)})`, filter: 'drop-shadow(0 0 30px rgba(245,160,0,0.55))'}}>
          <defs>
            <linearGradient id="cM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="rgba(120,150,255,0.55)" /><stop offset="1" stopColor="rgba(40,70,200,0.25)" /></linearGradient>
          </defs>
          <path d={afg.d} fill="url(#cM)" opacity={prog(t, E.t0 + 1.0, E.t0 + 2.6)} />
          <path d={afg.d} fill="none" stroke={C.acc2} strokeWidth={5} strokeLinejoin="round" strokeDasharray={6000} strokeDashoffset={6000 * (1 - draw)} />
        </svg>
        <svg width={1080} height={400} style={{position: 'absolute', left: 0, top: 640, overflow: 'visible', transform: 'translateZ(60px)', filter: 'drop-shadow(0 20px 22px rgba(1,4,24,0.5))'}}>
          <defs>
            <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#B9C8FF" /></linearGradient>
          </defs>
          {[0, 1, 2, 3, 4].map((i) => (
            <Person key={i} x={300 + i * 120} y={200 + Math.abs(i - 2) * 12} s={1.9 - Math.abs(i - 2) * 0.15} o={spT(t, E.t0 + 0.9 + i * 0.12)} />
          ))}
        </svg>
        <div style={{position: 'absolute', left: 66, right: 66, top: 1010, height: 620, transform: 'translateZ(110px)'}}>
          <div style={{position: 'absolute', inset: 0, ...glass(54, 0.5), opacity: k}} />
          <Shimmer k={prog(t, E.b - 0.2, E.b + 1.0, soft)} radius={54} strength={0.3} />
          <div style={{position: 'absolute', left: 44, right: 44, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
            <div style={{width: '100%'}}>
              <Type text={E.text} a={E.a} b={E.b - 0.5} t={t} size={60} maxW={850} fit={1.25} family={F.semi} hlFamily={F.semi} hl={['مبارزه', 'وطن‌پالنې', 'نښه']} lh={1.9} align="center" />
            </div>
          </div>
        </div>
      </World>
    </AbsoluteFill>
  );
};

// ─── outro: the same end card as the earlier Hindukush infographic ───────────────────
export const Outro: React.FC<{t: number; discs?: [string, string, string]; logo?: string; ghost?: string; user?: string}> = ({t, discs = ['#EAA500', '#ffffff', '#051449'], logo = 'img/logo-color.png', ghost = 'img/logo-white.png', user = '#a7a9c2'}) => {
  const t0 = TL.outro.t0;
  const p3 = Easing3(prog(t, t0 + 0.05, t0 + 0.75, (x) => x));
  const p4 = Easing3(prog(t, t0 + 0.5, t0 + 1.2, (x) => x));
  const p5 = Easing3(prog(t, t0 + 0.95, t0 + 1.7, (x) => x));
  const T = t0 + 1.65;
  const lk = prog(t, T, T + 0.6, easeOut);
  const g = t >= T + 0.05 && t < T + 0.55;
  const step = Math.floor((t - T - 0.05) / 0.1);
  const gx = [0, -14, 9, -6, 12, 0], bx = [0, 12, -10, 7, -12, 0];
  const flick = g && Math.floor((t - T - 0.05) / 0.06) % 2 === 0;
  const clips = ['inset(10% 0% 55% 0%)', 'inset(60% 0% 8% 0%)', 'inset(30% 0% 40% 0%)'];
  const ci = Math.floor((t - T - 0.1) / (0.45 / 4));
  const clip = t >= T + 0.1 && ci >= 0 && ci < 3 ? clips[ci] : 'inset(0% 0% 0% 0%)';
  const sk = prog(t, T + 0.7, T + 1.4, easeOut);
  const disc = (col: string, p: number) => <div style={{position: 'absolute', left: 540 - 1200, top: 960 - 1200, width: 2400, height: 2400, borderRadius: '50%', background: col, transform: `scale(${p})`}} />;
  return (
    <AbsoluteFill>
      {disc(discs[0], p3)}
      {disc(discs[1], p4)}
      {disc(discs[2], p5)}
      <div style={{position: 'absolute', left: 160, top: 800 - prog(t, T + 0.8, TL.outro.t1, easeOut) * 10, width: 760, height: 232, opacity: lk, transform: `scale(${lerp(0.9, 1, lk)})`}}>
        <Img src={staticFile(logo)} style={{position: 'absolute', left: 0, top: 0, width: 760, clipPath: clip}} />
        {g && step >= 0 && step < 6 && (
          <>
            <Img src={staticFile(ghost)} style={{position: 'absolute', left: gx[step], top: 0, width: 760, opacity: flick ? 0.55 : 0, mixBlendMode: 'screen', filter: 'hue-rotate(300deg) saturate(3)'}} />
            <Img src={staticFile(ghost)} style={{position: 'absolute', left: bx[step], top: 0, width: 760, opacity: flick ? 0.55 : 0, mixBlendMode: 'screen', filter: 'hue-rotate(160deg) saturate(3)'}} />
          </>
        )}
      </div>
      <div style={{position: 'absolute', left: 0, top: 1090 + (1 - sk) * 20, width: 1080, textAlign: 'center', fontFamily: 'sans-serif', fontSize: 44, fontWeight: 700, color: user, opacity: sk}}>@hindukush</div>
    </AbsoluteFill>
  );
};
const Easing3 = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2); // power3.inOut

// ─── full-frame light pass on every chapter change ───────────────────────────────────
const Sweep: React.FC<{t: number}> = ({t}) => {
  const marks = [...TL.sections.map((s) => s.t0), TL.q.t0, TL.end.t0];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {marks.map((m, i) => {
        const k = prog(t, m - 0.35, m + 0.75, soft);
        return <Shimmer key={i} k={k} strength={0.2} width={0.5} />;
      })}
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  const ready = useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const dark = prog(t, TL.q.t0 - 0.2, TL.q.t0 + 0.6) * (1 - prog(t, TL.q.t1 - 0.4, TL.q.t1 + 0.4));
  if (!ready) return null;
  const on = (t0: number, t1: number) => t >= t0 && t < t1;
  return (
    <AbsoluteFill style={{background: C.bg0}}>
      <Backdrop t={t} dark={dark} />
      <Dust t={t} />
      {on(0, TL.title.t1) && <Title t={t} />}
      {TL.sections.map((s) => (on(s.t0, s.t1) ? <Section key={s.n} s={s} t={t} /> : null))}
      {on(TL.q.t0, TL.q.t1) && <Question t={t} />}
      {on(TL.end.t0, TL.end.t1) && <Closing t={t} />}
      <Sweep t={t} />
      <Finish frame={frame} />
      <Chrome t={t} />
      {on(TL.outro.t0, TL.outro.t1 + 1) && <Outro t={t} />}
      <Audio src={staticFile('vo.mp3')} />
    </AbsoluteFill>
  );
};
