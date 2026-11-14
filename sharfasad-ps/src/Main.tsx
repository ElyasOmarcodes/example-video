import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {C, F, FPS, TL, clamp01, easeIn, easeOut, fa, lerp, prog, spT, useT} from './lib';
import {Grain, Label, Paper, Stamp, Words, pop, useFonts} from './components/kit';
import {ILLUS} from './components/illus';

type Sec = (typeof TL.sections)[number];
type Bul = Sec['bullets'][number];

const SIM_T0 = TL.sections[1].t0; // the recruit sim was captured with its t=0 here

// ─── persistent chrome ──────────────────────────────────────────────────────────────
const Chrome: React.FC = () => {
  const t = useT();
  const on = prog(t, TL.title.t1 - 0.4, TL.title.t1 + 0.3) * (1 - prog(t, TL.outro.t0 - 0.3, TL.outro.t0 + 0.2));
  const active = TL.sections.findIndex((s) => t >= s.t0 && t < s.t1);
  const dark = prog(t, TL.q.t0, TL.q.t0 + 0.5) * (1 - prog(t, TL.q.t1 - 0.2, TL.q.t1 + 0.3));
  const ink = dark > 0.5 ? C.card : C.ink;
  return (
    <AbsoluteFill style={{opacity: on}}>
      <div style={{position: 'absolute', top: 64, right: 64, display: 'flex', alignItems: 'center', gap: 18, direction: 'rtl'}}>
        <Img src={staticFile('img/mark.png')} style={{height: 64}} />
        <div style={{fontFamily: F.black, fontSize: 34, color: ink}}>هندوکش‌غږ</div>
      </div>
      <div style={{position: 'absolute', top: 76, left: 64, fontFamily: F.bold, fontSize: 30, color: ink, opacity: 0.6, direction: 'rtl'}}>تحلیلي ګرافیک</div>
      <div style={{position: 'absolute', bottom: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14, direction: 'rtl'}}>
        {TL.sections.map((s, i) => {
          const k = spT(t, s.t0, {damping: 18, stiffness: 160});
          const done = t >= s.t1;
          const w = lerp(22, 92, i === active ? k : 0);
          return (
            <div key={i} style={{width: w, height: 22, borderRadius: 11, background: i === active ? C.acc : done ? ink : 'transparent', border: `3px solid ${i === active ? C.acc : ink}`, opacity: i === active || done ? 1 : 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center'}} />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── title ──────────────────────────────────────────────────────────────────────────
const Title: React.FC = () => {
  const t = useT();
  const T = TL.title;
  const k = spT(t, -0.35, {damping: 16, stiffness: 120});
  const out = prog(t, T.t1 - 0.45, T.t1, easeIn);
  const bars = [0.82, 0.6, 0.72, 0.4];
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `translateY(${-out * 160}px) scale(${1 - out * 0.06})`}}>
      <div style={{position: 'absolute', left: 70, right: 70, top: 380, height: 1180, transform: `translateY(${(1 - k) * 260}px) rotate(${lerp(-4, -1.2, k)}deg)`}}>
        <div style={{position: 'absolute', right: 40, top: -78, width: 300, height: 100, background: C.paper2, borderRadius: '24px 24px 0 0', boxShadow: '0 -2px 0 rgba(0,0,0,0.04)'}}>
          <div style={{fontFamily: F.black, fontSize: 40, color: C.ink2, textAlign: 'center', marginTop: 20, direction: 'rtl'}}>دوسیه</div>
        </div>
        <div style={{position: 'absolute', inset: 0, background: C.paper2, borderRadius: 30, boxShadow: '0 30px 80px rgba(60,40,10,0.18)'}} />
        <div style={{position: 'absolute', inset: 30, background: C.card, borderRadius: 18}} />
        <div style={{position: 'absolute', left: 90, right: 90, top: 150}}>
          <Words text={T.text} a={-0.35} b={T.b - 0.5} t={t} size={106} font={F.title} align="center" lh={1.42} hl={['شر', 'فساد', 'اجیر', 'مشران']} />
        </div>
        <div style={{position: 'absolute', left: 120, right: 120, top: 900}}>
          {bars.map((w, i) => (
            <div key={i} style={{height: 34, marginBottom: 26, marginLeft: 'auto', width: `${w * 100 * prog(t, 2.6 + i * 0.25, 3.2 + i * 0.25, easeOut)}%`, background: C.ink, borderRadius: 4, opacity: 0.85}} />
          ))}
        </div>
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Stamp id="tt" t={t} at={-0.5} text="تحلیلي ګرافیک" x={300} y={340} rot={-8} size={58} />
        <Stamp id="tt2" t={t} at={4.3} text="محرم" x={770} y={1470} rot={9} size={72} color={C.ink} />
      </svg>
    </AbsoluteFill>
  );
};

// ─── a numbered section ─────────────────────────────────────────────────────────────
const Hero: React.FC<{s: Sec}> = ({s}) => {
  const t = useT();
  const k = spT(t, s.t0 + 0.05, {damping: 11, stiffness: 170, mass: 0.8});
  const out = prog(t, s.hb + 0.1, s.hb + 0.55, easeIn);
  if (out >= 1) return null;
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `translateY(${-out * 420}px) scale(${1 - out * 0.35})`}}>
      <div style={{position: 'absolute', top: 360, left: 0, right: 0, textAlign: 'center', fontFamily: F.black, fontSize: 46, color: C.ink2, direction: 'rtl', opacity: prog(t, s.t0, s.t0 + 0.4)}}>
        برخه {fa(s.n)} له {fa(5)}
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(540 700) rotate(${t * 12})`} opacity={prog(t, s.t0 + 0.15, s.t0 + 0.6)}>
          <circle r={255} fill="none" stroke={C.ink} strokeWidth={5} strokeDasharray="6 22" strokeLinecap="round" />
        </g>
        <g transform={`translate(540 700) scale(${k})`}>
          <circle r={200} fill={C.acc} />
          <text y={95} textAnchor="middle" fontFamily={F.title} fontSize={290} fill={C.ink}>
            {fa(s.n)}
          </text>
        </g>
      </svg>
      <div style={{position: 'absolute', left: 80, right: 80, top: 1040}}>
        <Words text={s.head} a={s.ha} b={s.hb - 0.3} t={t} size={100} font={F.title} align="center" lh={1.45} />
      </div>
    </AbsoluteFill>
  );
};

const Tab: React.FC<{s: Sec}> = ({s}) => {
  const t = useT();
  const k = spT(t, s.hb + 0.3, {damping: 15, stiffness: 150});
  const out = prog(t, s.t1 - 0.35, s.t1, easeIn);
  return (
    <div style={{position: 'absolute', top: 170, right: 60, left: 60, display: 'flex', justifyContent: 'flex-start', direction: 'rtl', opacity: clamp01(k * 2) * (1 - out), transform: `translateY(${(1 - k) * -120 - out * 40}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, background: C.ink, borderRadius: 26, padding: '14px 18px 14px 34px', maxWidth: 960, boxShadow: '0 14px 30px rgba(16,27,63,0.18)'}}>
        <div style={{width: 74, height: 74, borderRadius: 37, background: C.acc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.title, fontSize: 52, color: C.ink, flexShrink: 0, paddingTop: 6}}>
          {fa(s.n)}
        </div>
        <div style={{fontFamily: F.black, fontSize: 42, color: C.card, lineHeight: 1.35}}>{s.head}</div>
      </div>
    </div>
  );
};

const cardWindow = (s: Sec, i: number) => {
  const b = s.bullets[i];
  const enter = Math.max(b.a - 0.45, s.hb + 0.4);
  const next = s.bullets[i + 1];
  const exit = next ? next.a - 0.45 : s.t1 - 0.4;
  return {enter, exit};
};

const Card: React.FC<{s: Sec; i: number; children: React.ReactNode; tag?: string}> = ({s, i, children}) => {
  const t = useT();
  const {enter, exit} = cardWindow(s, i);
  const k = spT(t, enter, {damping: 14, stiffness: 130, mass: 0.9});
  const out = prog(t, exit, exit + 0.42, easeIn);
  const rot = [-1.6, 1.2, -0.8, 1.6][i % 4];
  return (
    <div style={{position: 'absolute', left: 90, top: 340, width: 900, height: 860, transform: `translate(${-out * 1150}px, ${(1 - k) * -1300}px) rotate(${rot + (1 - k) * -10 - out * 14}deg)`, opacity: out >= 1 ? 0 : 1}}>
      <div style={{position: 'absolute', inset: 0, background: C.card, borderRadius: 26, boxShadow: '0 30px 60px rgba(70,50,20,0.20), 0 3px 0 rgba(0,0,0,0.05)'}} />
      <div style={{position: 'absolute', top: -22, left: 360, width: 180, height: 50, background: 'rgba(242,154,0,0.55)', transform: 'rotate(-3deg)', borderRadius: 4}} />
      <div style={{position: 'absolute', top: 26, left: 30, fontFamily: F.black, fontSize: 30, color: C.ink3, direction: 'rtl'}}>
        {fa(i + 1)} / {fa(s.bullets.length)}
      </div>
      <div style={{position: 'absolute', left: 0, top: 30, width: 900, height: 820}}>{children}</div>
    </div>
  );
};

const BulletText: React.FC<{s: Sec; i: number}> = ({s, i}) => {
  const t = useT();
  const b = s.bullets[i];
  const {enter, exit} = cardWindow(s, i);
  if (t < enter || t > exit + 0.5) return null;
  const out = prog(t, exit, exit + 0.35, easeIn);
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 1270, direction: 'rtl', display: 'flex', gap: 26, alignItems: 'flex-start'}}>
      <div style={{width: 26, height: 26, borderRadius: 7, background: C.acc, marginTop: 40, flexShrink: 0, transform: `scale(${spT(t, enter + 0.2, {damping: 10, stiffness: 220})}) rotate(45deg)`, opacity: 1 - out}} />
      <div style={{flex: 1}}>
        <Words text={b.text} a={b.a} b={b.b - 0.35} t={t} size={70} hl={(b as Bul & {hl?: string[]}).hl} out={out} />
      </div>
    </div>
  );
};

const SIM_TAGS = ['دروغجنې ژمنې', 'بهرنۍ استخباراتي کړۍ', 'غړي قرباني کېږي'];

const SimCard: React.FC<{s: Sec}> = ({s}) => {
  const t = useT();
  const enter = s.hb + 0.4;
  const k = spT(t, enter, {damping: 14, stiffness: 130, mass: 0.9});
  const out = prog(t, s.t1 - 0.4, s.t1, easeIn);
  const cur = s.bullets.reduce((acc, b, i) => (t >= b.a - 0.3 ? i : acc), 0);
  return (
    <div style={{position: 'absolute', left: 90, top: 340, width: 900, height: 860, transform: `translate(${-out * 1150}px, ${(1 - k) * -1300}px) rotate(${-1 + (1 - k) * -10 - out * 14}deg)`}}>
      <div style={{position: 'absolute', inset: 0, background: C.card, borderRadius: 26, boxShadow: '0 30px 60px rgba(70,50,20,0.20)'}} />
      <div style={{position: 'absolute', left: 20, top: 20, width: 860, height: 820, borderRadius: 16, overflow: 'hidden'}}>
        <Sequence from={Math.round(SIM_T0 * FPS)} layout="none">
          <OffthreadVideo src={staticFile('recruit.mp4')} muted style={{width: 860, height: 860, marginTop: -20}} />
        </Sequence>
      </div>
      <div style={{position: 'absolute', top: -22, left: 360, width: 180, height: 50, background: 'rgba(242,154,0,0.55)', transform: 'rotate(-3deg)', borderRadius: 4}} />
      <svg width={900} height={860} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {s.bullets.map((b, i) => (
          <g key={i} opacity={i === cur ? 1 : 0}>
            <Stamp id={'sim' + i} t={t} at={b.a + 0.4} text={SIM_TAGS[i]} x={450} y={790} rot={-3} size={50} color={i === 2 ? C.accDeep : C.ink} />
          </g>
        ))}
      </svg>
    </div>
  );
};

const Section: React.FC<{s: Sec}> = ({s}) => {
  const t = useT();
  const sim = s.n === 2;
  return (
    <AbsoluteFill>
      <Hero s={s} />
      {t > s.hb && <Tab s={s} />}
      {sim && t > s.hb && <SimCard s={s} />}
      {!sim &&
        s.bullets.map((b, i) => {
          const {enter, exit} = cardWindow(s, i);
          if (t < enter - 0.05 || t > exit + 0.5) return null;
          const Ill = ILLUS[`${s.n}.${i}`];
          return (
            <Card key={i} s={s} i={i}>
              <svg viewBox="0 0 900 820" width={900} height={820} style={{overflow: 'visible'}}>
                <Ill t={t - b.a} d={b.b - b.a} />
              </svg>
            </Card>
          );
        })}
      {s.bullets.map((_, i) => (
        <BulletText key={i} s={s} i={i} />
      ))}
    </AbsoluteFill>
  );
};

// ─── final question, closing line, outro ────────────────────────────────────────────
const Question: React.FC = () => {
  const t = useT();
  const Q = TL.q;
  const out = prog(t, Q.t1 - 0.3, Q.t1 + 0.1, easeIn);
  const k = spT(t, Q.t0 + 0.2, {damping: 12, stiffness: 120});
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <text x={540} y={1060} textAnchor="middle" fontFamily={F.title} fontSize={1000} fill={C.acc} opacity={0.13 * k} transform={`rotate(${-6 + Math.sin(t * 0.5) * 2} 540 700) scale(1)`}>
          ؟
        </text>
      </svg>
      <div style={{position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{background: C.acc, borderRadius: 40, padding: '10px 44px 16px', fontFamily: F.title, fontSize: 54, color: C.ink, transform: `scale(${pop(t, Q.t0 + 0.1)})`, direction: 'rtl'}}>{Q.label}</div>
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 700}}>
        <Words text={Q.text} a={Q.a} b={Q.b - 0.4} t={t} size={86} font={F.title} color={C.card} align="center" lh={1.55} hl={Q.hl} marker="rgba(242,154,0,0.55)" />
      </div>
    </AbsoluteFill>
  );
};

const Closing: React.FC = () => {
  const t = useT();
  const E = TL.end;
  const out = prog(t, E.t1 - 0.35, E.t1, easeIn);
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `scale(${1 + out * 0.04})`}}>
      <div style={{position: 'absolute', left: 90, right: 90, top: 560}}>
        <Words text={E.text} a={E.a} b={E.b - 0.6} t={t} size={96} font={F.title} align="center" lh={1.5} hl={E.hl} />
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Stamp id="e1" t={t} at={E.b - 0.2} text="نه مبارزه — نه وطن‌پالنه" x={540} y={1430} rot={-5} size={62} />
      </svg>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const t = useT();
  const O = TL.outro;
  const k = spT(t, O.t0 + 0.1, {damping: 12, stiffness: 140});
  const wipe = prog(t, O.t0 + 0.35, O.t0 + 1.1, easeOut);
  const u = spT(t, O.t0 + 0.9, {damping: 16, stiffness: 150});
  const out = prog(t, O.t1 - 0.5, O.t1, easeIn);
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <div style={{position: 'absolute', top: 760, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'relative', width: 840, height: (840 * 464) / 1525, transform: `scale(${lerp(0.85, 1, k)})`, opacity: clamp01(k * 2)}}>
          <Img src={staticFile('img/logo-navy.png')} style={{width: 840, clipPath: `inset(0 0 0 ${(1 - Math.max(wipe, 0.22)) * 100}%)`}} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 1090, left: 0, right: 0, textAlign: 'center', fontFamily: F.mono, fontWeight: 600, fontSize: 52, color: C.ink2, opacity: u, transform: `translateY(${(1 - u) * 30}px)`}}>
        @hindukush
      </div>
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  useFonts();
  const t = useT();
  const dark = prog(t, TL.q.t0, TL.q.t0 + 0.5) * (1 - prog(t, TL.q.t1 - 0.2, TL.q.t1 + 0.3));
  // absolute-time mounting (no <Sequence>, so every scene reads the same clock)
  const seq = (t0: number, t1: number, el: React.ReactNode, key: string) => (t >= t0 && t < t1 ? <React.Fragment key={key}>{el}</React.Fragment> : null);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Paper dark={dark * 0.93} />
      {seq(0, TL.title.t1, <Title />, 'title')}
      {TL.sections.map((s) => seq(s.t0, s.t1 + 0.5, <Section s={s} />, 's' + s.n))}
      {seq(TL.q.t0, TL.q.t1 + 0.2, <Question />, 'q')}
      {seq(TL.end.t0, TL.end.t1, <Closing />, 'end')}
      {seq(TL.outro.t0, TL.outro.t1, <Outro />, 'outro')}
      <Chrome />
      <Grain />
      <Audio src={staticFile('vo.mp3')} />
    </AbsoluteFill>
  );
};
