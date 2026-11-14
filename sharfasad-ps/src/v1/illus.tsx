import React from 'react';
import {C, F, clamp01, lerp, prog, spT, easeOut, easeIn, easeInOut, fa} from './lib';
import {Stamp, Person, Label, Draw, pop} from './kit';
import afg from '../data/afg.json';

// Every illustration draws into a 900×820 box. `t` = seconds since its bullet starts being
// spoken (the card lands at t≈-0.45), `d` = how long that bullet is spoken.
type P = {t: number; d: number};

const burst = (cx: number, cy: number, r: number, n = 9) => {
  let s = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.42 : r;
    s += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }
  return s + 'Z';
};

// §1.1 a phone "recording" a few muzzle flashes, then stamped fake
const Phone: React.FC<P> = ({t, d}) => {
  const k = pop(t, -0.3);
  const flashes = [0.6, 1.2, 1.55, 2.4];
  const rec = Math.floor(t * 2) % 2 === 0;
  return (
    <g>
      <g transform={`translate(450 420) rotate(${lerp(-8, -4, k)}) scale(${lerp(0.7, 1, k)}) translate(-450 -420)`}>
        <rect x={270} y={70} width={360} height={700} rx={52} fill={C.ink} />
        <rect x={290} y={130} width={320} height={580} rx={18} fill="#1E2A57" />
        <clipPath id="scr">
          <rect x={290} y={130} width={320} height={580} rx={18} />
        </clipPath>
        <g clipPath="url(#scr)">
          <rect x={290} y={130} width={320} height={580} fill="#24315F" />
          <path d="M290 560 L360 500 L420 535 L490 470 L560 520 L610 490 L610 710 L290 710Z" fill="#141F45" />
          <path d="M290 610 L380 585 L470 615 L610 580 L610 710 L290 710Z" fill="#0E1736" />
          {flashes.map((ft, i) => {
            const f = clamp01(1 - (t - ft) / 0.32) * (t >= ft ? 1 : 0);
            const x = [380, 520, 450, 410][i], y = [520, 500, 545, 505][i];
            return f > 0 ? (
              <g key={i} opacity={f}>
                <circle cx={x} cy={y} r={70 * f} fill={C.acc} opacity={0.25} />
                <path d={burst(x, y, 40 + 18 * f)} fill={C.acc} />
                <circle cx={x} cy={y} r={12} fill="#FFF3D6" />
              </g>
            ) : null;
          })}
        </g>
        <circle cx={330} cy={170} r={11} fill={rec ? '#FF5A3C' : 'rgba(255,90,60,0.25)'} />
        <text x={352} y={180} fontFamily={F.mono} fontSize={28} fill="#F7F2E7">REC</text>
        <text x={590} y={180} textAnchor="end" fontFamily={F.mono} fontSize={26} fill="rgba(247,242,231,0.7)">
          00:{String(Math.min(15, Math.max(0, Math.floor(t * 2)))).padStart(2, '0')}
        </text>
        <rect x={405} y={92} width={90} height={14} rx={7} fill="#24315F" />
        <circle cx={450} cy={740} r={0} />
      </g>
      <Stamp id="p1" t={t} at={Math.min(3.3, d * 0.5)} text="جعلي" x={470} y={430} rot={-14} size={110} />
    </g>
  );
};

// §1.2 propaganda bar towers over capability bar; megaphone shouting from the top
const Megaphone: React.FC<P> = ({t}) => {
  const g1 = prog(t, 0.2, 2.2, easeOut);
  const g2 = prog(t, 2.6, 3.6, easeOut);
  const top = 700 - 470 * g1;
  const waves = [0, 1, 2];
  return (
    <g>
      <line x1={110} x2={790} y1={700} y2={700} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      <rect x={180} y={top} width={220} height={700 - top} rx={18} fill={C.acc} />
      <rect x={520} y={700 - 46 * g2} width={220} height={46 * g2} rx={12} fill={C.ink} />
      <rect x={520} y={230} width={220} height={470} rx={18} fill="none" stroke={C.ink3} strokeWidth={4} strokeDasharray="14 14" opacity={g2} />
      <Label x={290} y={765} text="تبلیغات" size={44} />
      <Label x={630} y={765} text="واقعي وړتیا" size={44} />
      <text x={630} y={470} textAnchor="middle" fontFamily={F.black} fontSize={120} fill={C.ink3} opacity={prog(t, 3.4, 4)}>؟</text>
      <g transform={`translate(290 ${top - 70}) scale(${pop(t, 1.2)})`}>
        <path d="M-60 -24 L30 -64 L30 64 L-60 24 Z" fill={C.ink} />
        <rect x={-92} y={-28} width={38} height={56} rx={8} fill={C.ink} />
        {waves.map((i) => {
          const ph = (t * 1.6 + i / 3) % 1;
          return <path key={i} d={`M${60 + ph * 70} ${-50 - ph * 30} Q${100 + ph * 90} 0 ${60 + ph * 70} ${50 + ph * 30}`} fill="none" stroke={C.accDeep} strokeWidth={9} strokeLinecap="round" opacity={(1 - ph) * prog(t, 1.4, 1.8)} />;
        })}
      </g>
    </g>
  );
};

// §1.3 old clips re-posted on a loop
const Tapes: React.FC<P> = ({t, d}) => {
  const years = ['۱۳۹۷', '۱۳۹۹', '۱۴۰۰'];
  const loop = prog(t, 1.6, 2.6, easeOut);
  return (
    <g>
      <g transform={`translate(450 420) rotate(${t * 30})`} opacity={loop}>
        <circle r={330} fill="none" stroke={C.acc} strokeWidth={10} strokeDasharray="1500 600" strokeDashoffset={2100 * (1 - loop)} strokeLinecap="round" />
        <path d="M296 -150 L340 -95 L270 -88 Z" fill={C.acc} transform="rotate(14)" />
      </g>
      {years.map((y, i) => {
        const k = spT(t, 0.1 + i * 0.4, {damping: 13, stiffness: 150});
        const x = 450 + (i - 1) * 40, yy = 250 + i * 175;
        const r = [-7, 4, -3][i];
        return (
          <g key={i} transform={`translate(${x + (1 - k) * 600} ${yy}) rotate(${r})`} opacity={clamp01(k * 2)}>
            <rect x={-230} y={-80} width={460} height={160} rx={16} fill={C.card} stroke={C.ink} strokeWidth={5} />
            <rect x={-205} y={-58} width={200} height={116} rx={8} fill="#2A3563" />
            <path d="M-125 -24 L-75 0 L-125 24 Z" fill={C.card} />
            <rect x={20} y={-46} width={180} height={18} rx={9} fill={C.ink3} />
            <rect x={20} y={-12} width={130} height={18} rx={9} fill={C.ink3} />
            <rect x={20} y={26} width={110} height={36} rx={18} fill={C.paper2} />
            <text x={75} y={53} textAnchor="middle" fontFamily={F.black} fontSize={28} fill={C.ink}>{y}</text>
          </g>
        );
      })}
      <Stamp id="p3" t={t} at={Math.min(3.6, d * 0.55)} text="زوړ او جعلي" x={450} y={430} rot={-9} size={78} />
    </g>
  );
};

// §3.1 the org chart comes apart
const Org: React.FC<P> = ({t, d}) => {
  const br = prog(t, 2.0, 3.6, easeIn);
  const nodes: [number, number][] = [[450, 130], [220, 380], [450, 380], [680, 380], [140, 640], [300, 640], [450, 640], [600, 640], [760, 640]];
  const edges: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 6], [3, 7], [3, 8]];
  const drift = (i: number) => {
    const a = i * 2.39;
    return [Math.cos(a) * 60 * br, Math.sin(a) * 40 * br + 30 * br * (i ? 1 : 0), Math.sin(a * 3) * 22 * br];
  };
  return (
    <g>
      {edges.map(([a, b], i) => {
        const k = prog(t, 0.1 + i * 0.08, 0.6 + i * 0.08, easeOut);
        const [ax, ay] = nodes[a], [bx, by] = nodes[b];
        const [dax, day] = drift(a), [dbx, dby] = drift(b);
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        const gap = br * 0.5;
        return (
          <g key={i} stroke={C.ink} strokeWidth={6} strokeLinecap="round" opacity={1 - br * 0.35}>
            <line x1={ax + dax} y1={ay + day} x2={lerp(ax + dax, mx, k * (1 - gap))} y2={lerp(ay + day, my, k * (1 - gap))} />
            <line x1={bx + dbx} y1={by + dby} x2={lerp(bx + dbx, mx, k * (1 - gap))} y2={lerp(by + dby, my, k * (1 - gap))} />
          </g>
        );
      })}
      {nodes.map(([x, y], i) => {
        const [dx, dy, r] = drift(i);
        const k = pop(t, -0.2 + i * 0.07);
        const big = i === 0 ? 74 : i < 4 ? 56 : 42;
        return (
          <g key={i} transform={`translate(${x + dx} ${y + dy}) rotate(${r}) scale(${k})`}>
            <circle r={big} fill={i === 0 ? C.acc : C.card} stroke={C.ink} strokeWidth={6} />
            {i === 0 ? (
              <text y={30} textAnchor="middle" fontFamily={F.black} fontSize={92} fill={C.ink}>؟</text>
            ) : (
              <Person x={0} y={big * 0.62} s={big / 70} />
            )}
          </g>
        );
      })}
      <Stamp id="o1" t={t} at={Math.min(3.8, d * 0.6)} text="بې‌کفایتي" x={450} y={505} rot={-8} size={84} />
    </g>
  );
};

// §3.2 the shield cracks and falls away from the people it should cover
const Shield: React.FC<P> = ({t}) => {
  const crack = prog(t, 1.4, 2.2, easeOut);
  const fall = prog(t, 2.6, 4.2, easeIn);
  const sh = 'M450 120 L700 200 C700 420 640 560 450 680 C260 560 200 420 200 200 Z';
  const exposed = prog(t, 2.8, 3.6);
  return (
    <g>
      {[300, 400, 500, 600].map((x, i) => (
        <Person key={i} x={x} y={760} s={1.5} fill={exposed > 0 ? `rgb(${lerp(16, 154, exposed)},${lerp(27, 146, exposed)},${lerp(63, 130, exposed)})` : C.ink} o={pop(t, -0.2 + i * 0.08)} />
      ))}
      <clipPath id="shL"><rect x={0} y={0} width={452} height={820} /></clipPath>
      <clipPath id="shR"><rect x={448} y={0} width={452} height={820} /></clipPath>
      {[0, 1].map((side) => {
        const dir = side ? 1 : -1;
        return (
          <g key={side} clipPath={`url(#${side ? 'shR' : 'shL'})`}>
            <g transform={`translate(${dir * 170 * fall} ${520 * fall * fall}) rotate(${dir * 28 * fall} 450 400)`} opacity={1 - fall * 0.6}>
              <path d={sh} fill={C.ink} transform={`translate(450 400) scale(${pop(t, -0.3)}) translate(-450 -400)`} />
              <path d="M450 220 L560 255 C560 390 520 470 450 540 C380 470 340 390 340 255 Z" fill="none" stroke={C.acc} strokeWidth={10} />
            </g>
          </g>
        );
      })}
      <Draw d="M450 120 L430 230 L475 320 L425 420 L470 520 L450 680" k={crack * (1 - fall)} stroke={C.paper} w={10} len={700} />
      <Draw d="M432 230 L330 260 M475 320 L600 300 M425 420 L300 450" k={crack * (1 - fall)} stroke={C.paper} w={6} len={500} />
    </g>
  );
};

// §3.3 deny a comrade when exposed, then flip back
const Deny: React.FC<P> = ({t, d}) => {
  const flipAt = Math.max(3.4, d * 0.62);
  const flip = prog(t, flipAt, flipAt + 0.7);
  const sx = Math.cos(flip * Math.PI);
  const k = pop(t, -0.3);
  const b1 = pop(t, 0.6) * (1 - prog(t, flipAt - 0.2, flipAt + 0.1));
  const b2 = pop(t, flipAt + 0.6);
  return (
    <g>
      <g transform={`translate(330 450) scale(${sx * k} ${k}) rotate(-4)`}>
        <rect x={-180} y={-240} width={360} height={480} rx={22} fill={C.card} stroke={C.ink} strokeWidth={6} />
        <rect x={-130} y={-190} width={260} height={230} rx={12} fill={sx > 0 ? C.paper2 : '#D9CDB4'} />
        <Person x={0} y={40} s={2.6} fill={C.ink} />
        <rect x={-130} y={80} width={260} height={22} rx={11} fill={C.ink3} />
        <rect x={-130} y={124} width={180} height={22} rx={11} fill={C.ink3} />
        <rect x={-130} y={168} width={220} height={22} rx={11} fill={C.ink3} />
      </g>
      {b1 > 0.01 && (
        <g transform={`translate(660 220) scale(${b1})`}>
          <rect x={-170} y={-80} width={340} height={140} rx={60} fill={C.ink} />
          <path d="M-60 50 L-110 120 L0 56Z" fill={C.ink} />
          <Label x={0} y={8} text="نه یې پېژنو!" size={46} fill={C.card} font={F.black} />
        </g>
      )}
      {b2 > 0.01 && (
        <g transform={`translate(660 220) scale(${b2})`}>
          <rect x={-170} y={-80} width={340} height={140} rx={60} fill={C.acc} />
          <path d="M-60 50 L-110 120 L0 56Z" fill={C.acc} />
          <Label x={0} y={8} text="زموږ ملګری دی" size={42} fill={C.ink} font={F.black} />
        </g>
      )}
      <g opacity={prog(t, flipAt, flipAt + 0.4)}>
        <Draw d="M560 620 C760 620 760 470 640 470" k={prog(t, flipAt, flipAt + 0.8, easeOut)} stroke={C.accDeep} w={12} len={500} />
        <path d="M640 440 L590 470 L640 500Z" fill={C.accDeep} opacity={prog(t, flipAt + 0.6, flipAt + 0.8)} />
      </g>
      {t < flipAt + 0.05 && <Stamp id="dn" t={t} at={1.7} text="انکار" x={330} y={470} rot={-16} size={96} />}
    </g>
  );
};

// §3.4 tug of war over the money and the crown
const Tug: React.FC<P> = ({t}) => {
  const sway = Math.sin(t * 2.4) * 26 * prog(t, 0.6, 1.4);
  const fray = prog(t, 3.6, 4.6);
  const rope = (x0: number, x1: number) => `M${x0} 520 Q${(x0 + x1) / 2} ${540 + Math.sin(t * 5) * 8} ${x1} 520`;
  return (
    <g>
      <path d={rope(60, 430 + sway)} stroke="#8C6A3D" strokeWidth={14} fill="none" strokeLinecap="round" />
      <path d={rope(470 + sway, 840)} stroke="#8C6A3D" strokeWidth={14} fill="none" strokeLinecap="round" />
      <g transform={`translate(${450 + sway} 520)`}>
        <path d={burst(0, 0, 42 + fray * 30, 7)} fill={C.acc} opacity={0.4 + fray * 0.6} />
        <rect x={-26} y={-12} width={52} height={24} rx={6} fill="#8C6A3D" />
      </g>
      {[0, 1, 2].map((i) => (
        <Person key={'l' + i} x={110 + i * 85 + sway} y={640} s={1.45} rot={-14} o={pop(t, -0.2 + i * 0.06)} />
      ))}
      {[0, 1, 2].map((i) => (
        <Person key={'r' + i} x={790 - i * 85 + sway} y={640} s={1.45} rot={14} o={pop(t, -0.2 + i * 0.06)} />
      ))}
      <g transform={`translate(450 260) scale(${pop(t, 0.5)})`}>
        <path d="M-90 40 L-110 -60 L-50 -10 L0 -80 L50 -10 L110 -60 L90 40 Z" fill={C.acc} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <rect x={-92} y={44} width={184} height={26} rx={6} fill={C.ink} />
        <Label x={0} y={-108} text="واک" size={44} font={F.black} />
      </g>
      {[0, 1, 2, 3].map((i) => {
        const k = pop(t, 1.2 + i * 0.12);
        return (
          <g key={i} transform={`translate(${[300, 610, 250, 650][i]} ${[360, 360, 280, 280][i]}) scale(${k})`}>
            <ellipse rx={44} ry={44} fill={C.acc} stroke={C.ink} strokeWidth={5} />
            <text y={16} textAnchor="middle" fontFamily={F.black} fontSize={46} fill={C.ink}>$</text>
          </g>
        );
      })}
      <Label x={450} y={780} text="سیالي او شخړې" size={46} font={F.black} o={prog(t, 2, 2.6)} />
    </g>
  );
};

// §4.1 two lives: comfort abroad vs the front line
const TwoLives: React.FC<P> = ({t}) => {
  const a = prog(t, -0.2, 0.8, easeOut);
  const b = prog(t, 0.6, 1.6, easeOut);
  const smoke = (i: number) => (t * 18 + i * 60) % 180;
  return (
    <g>
      <clipPath id="tlA"><path d="M0 0 H900 V340 L0 440 Z" /></clipPath>
      <clipPath id="tlB"><path d="M0 460 L900 360 V820 H0 Z" /></clipPath>
      <g clipPath="url(#tlA)" transform={`translate(${(1 - a) * 900} 0)`}>
        <rect width={900} height={460} fill="#F3E2BE" />
        <circle cx={760} cy={110} r={56} fill={C.acc} />
        <path d="M120 320 L120 200 L250 120 L380 200 L380 320 Z" fill={C.card} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <rect x={170} y={220} width={60} height={50} fill={C.acc} />
        <rect x={270} y={220} width={60} height={50} fill={C.acc} />
        <g transform={`translate(${560 + ((t * 60) % 200)} 170) rotate(-8)`}>
          <path d="M-70 0 L60 -8 C80 -8 80 8 60 8 L-70 0Z M-10 -4 L-40 -50 L-20 -50 L20 -4Z M-10 4 L-40 50 L-20 50 L20 4Z M-60 -2 L-80 -26 L-68 -26 L-50 -2Z" fill={C.ink} />
        </g>
        <path d="M470 330 h170 v-50 a20 20 0 0 1 20 -20 h0 v70 h20 v-90 h-230 v90z" fill={C.ink} opacity={0.85} />
        <rect x={20} y={20} width={220} height={60} rx={30} fill={C.ink} />
        <Label x={130} y={62} text="مشران: بهر" size={34} fill={C.card} />
      </g>
      <g clipPath="url(#tlB)" transform={`translate(${-(1 - b) * 900} 0)`}>
        <rect y={340} width={900} height={480} fill="#2A3158" />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={180 + i * 180} cy={720 - smoke(i)} r={40 + smoke(i) * 0.4} fill="#4A4F6E" opacity={0.6 * (1 - smoke(i) / 180)} />
        ))}
        <path d="M0 760 L80 700 L140 730 L210 680 L300 720 L380 670 L470 715 L560 660 L650 705 L740 650 L820 700 L900 680 V820 H0Z" fill="#141B3A" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Person key={i} x={200 + i * 120} y={760} s={1.2} fill={C.acc} />
        ))}
        <rect x={640} y={740} width={240} height={60} rx={30} fill={C.acc} />
        <Label x={760} y={782} text="ځوانان: جګړه" size={34} fill={C.ink} />
      </g>
      <path d="M0 450 L900 350" stroke={C.ink} strokeWidth={10} opacity={b} />
    </g>
  );
};

// §4.2 the heavy burden lowered onto other people's shoulders
const Burden: React.FC<P> = ({t}) => {
  const drop = spT(t, 0.9, {damping: 9, stiffness: 120, mass: 1.1});
  const y = lerp(-260, 470, drop);
  const squash = 1 - 0.18 * drop;
  return (
    <g>
      <g transform="translate(720 190)" opacity={pop(t, -0.2)}>
        <rect x={-110} y={10} width={220} height={18} rx={9} fill={C.ink} />
        <Person x={0} y={8} s={1.7} />
        <line x1={-20} y1={-70} x2={-120} y2={-20} stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
        <Label x={0} y={80} text="اجیر مشر" size={34} />
      </g>
      <line x1={300} x2={300} y1={0} y2={y - 100} stroke={C.ink} strokeWidth={4} strokeDasharray="10 10" />
      <g transform={`translate(300 ${y})`}>
        <path d="M-210 -100 L210 -100 L240 80 L-240 80 Z" fill={C.ink} />
        <Label x={0} y={10} text="د جګړې بار" size={58} fill={C.card} font={F.black} />
      </g>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${150 + i * 100} 760) scale(1 ${squash})`}>
          <Person x={0} y={0} s={2.1} fill={C.accDeep} o={pop(t, -0.2 + i * 0.07)} />
        </g>
      ))}
      <line x1={60} x2={840} y1={762} y2={762} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

// §4.3 hourglass: the youth's life and future running out
const Hourglass: React.FC<P> = ({t, d}) => {
  const k = prog(t, 0.4, Math.max(2.5, d - 0.3), (x) => x);
  const s = pop(t, -0.3);
  const top = 1 - k;
  return (
    <g transform={`translate(450 420) scale(${s}) rotate(${Math.sin(t * 0.8) * 2}) translate(-450 -420)`}>
      <rect x={240} y={70} width={420} height={36} rx={14} fill={C.ink} />
      <rect x={240} y={734} width={420} height={36} rx={14} fill={C.ink} />
      <path d="M290 106 C290 300 420 360 440 420 C420 480 290 540 290 734 L610 734 C610 540 480 480 460 420 C480 360 610 300 610 106 Z" fill="rgba(247,242,231,0.75)" stroke={C.ink} strokeWidth={8} />
      <clipPath id="hgT"><path d="M290 106 C290 300 420 360 440 420 L460 420 C480 360 610 300 610 106 Z" /></clipPath>
      <clipPath id="hgB"><path d="M440 420 C420 480 290 540 290 734 L610 734 C610 540 480 480 460 420 Z" /></clipPath>
      <rect x={280} y={lerp(140, 420, 1 - top)} width={340} height={300} fill={C.acc} clipPath="url(#hgT)" />
      <path d={`M280 734 L280 ${734 - 250 * k} Q450 ${734 - 330 * k} 620 ${734 - 250 * k} L620 734Z`} fill={C.accDeep} clipPath="url(#hgB)" />
      {top > 0.02 && <line x1={450} x2={450} y1={420} y2={734 - 260 * k} stroke={C.accDeep} strokeWidth={8} strokeDasharray="14 10" strokeDashoffset={-t * 120} />}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const fade = clamp01(top * 6 - i);
        return <Person key={i} x={340 + (i % 3) * 110} y={210 + Math.floor(i / 3) * 80} s={0.85} fill={C.ink} o={fade} />;
      })}
      <Label x={450} y={810} text="ژوند او راتلونکی" size={44} font={F.black} />
    </g>
  );
};

// §4.4 the country shaken from outside
const MapAfg: React.FC<P> = ({t}) => {
  const draw = prog(t, -0.2, 1.6, easeOut);
  const shake = prog(t, 3.2, 3.6) * (1 - prog(t, 5.2, 6));
  const sx = Math.sin(t * 40) * 5 * shake;
  const arrows: [number, number, number, number][] = [[880, 140, 640, 300], [20, 520, 260, 470], [860, 700, 600, 560], [80, 100, 330, 290]];
  return (
    <g>
      <g transform={`translate(${sx} ${Math.cos(t * 37) * 3 * shake})`}>
        <path d={afg.d} fill={C.paper2} opacity={prog(t, 1.0, 1.8)} />
        <Draw d={afg.d} k={draw} stroke={C.ink} w={7} len={6000} />
        <Draw d="M420 240 L460 330 L420 400 L470 480 L440 560" k={prog(t, 3.2, 3.9, easeOut)} stroke={C.accDeep} w={7} len={500} />
        <Draw d="M460 330 L560 360 M420 400 L330 420" k={prog(t, 3.5, 4.2, easeOut)} stroke={C.accDeep} w={5} len={300} />
      </g>
      {arrows.map(([x0, y0, x1, y1], i) => {
        const k = prog(t, 1.6 + i * 0.35, 2.4 + i * 0.35, easeOut);
        const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
        const xe = lerp(x0, x1, k), ye = lerp(y0, y1, k);
        return (
          <g key={i} opacity={k > 0 ? 1 : 0}>
            <line x1={x0} y1={y0} x2={xe} y2={ye} stroke={C.acc} strokeWidth={14} strokeDasharray="26 16" strokeLinecap="round" />
            <path d="M0 -26 L40 0 L0 26 Z" fill={C.acc} transform={`translate(${xe} ${ye}) rotate(${ang})`} />
          </g>
        );
      })}
      <Label x={450} y={790} text="د پردیو ګټې ← بې‌ثباتي" size={44} font={F.black} o={prog(t, 2.6, 3.2)} />
    </g>
  );
};

// §5.1 a slogan balloon over an empty field
const Slogan: React.FC<P> = ({t, d}) => {
  const inf = pop(t, -0.2);
  const def = prog(t, Math.max(3, d * 0.6), Math.max(3, d * 0.6) + 1.2, easeIn);
  const s = inf * (1 - def * 0.72);
  const wob = Math.sin(t * 7) * 3 * def;
  return (
    <g>
      <g transform={`translate(450 300) rotate(${wob}) scale(${s} ${s * (1 - def * 0.25)})`}>
        <path d="M-330 -150 Q0 -230 330 -150 Q390 0 330 130 Q120 180 -40 150 L-120 230 L-110 150 Q-300 140 -340 120 Q-390 0 -330 -150Z" fill={C.ink} />
        <Label x={0} y={-20} text="شعارونه!" size={92} fill={C.card} font={F.black} />
        <Label x={0} y={80} text="!!! ★ !!!" size={50} fill={C.acc} font={F.black} />
      </g>
      <path d="M40 690 Q450 650 860 690" stroke={C.ink} strokeWidth={6} fill="none" />
      <rect x={250} y={600} width={400} height={90} rx={16} fill="none" stroke={C.ink3} strokeWidth={5} strokeDasharray="16 14" opacity={prog(t, 1.4, 2)} />
      <Label x={450} y={660} text="هیڅ" size={52} fill={C.ink3} font={F.black} o={prog(t, 2, 2.6)} />
      <Label x={450} y={770} text="عملي میدان" size={44} font={F.black} o={prog(t, 1.2, 1.8)} />
    </g>
  );
};

// §5.2 a claims list, every line crossed out
const Claims: React.FC<P> = ({t}) => {
  const rows = [0, 1, 2, 3];
  return (
    <g>
      <g transform={`translate(450 430) rotate(-3) scale(${pop(t, -0.3)}) translate(-450 -430)`}>
        <rect x={190} y={90} width={520} height={680} rx={24} fill={C.card} stroke={C.ink} strokeWidth={6} />
        <rect x={360} y={60} width={180} height={70} rx={18} fill={C.ink} />
        <Label x={450} y={210} text="ادعاوې" size={60} font={F.black} />
        {rows.map((i) => {
          const y = 300 + i * 115;
          const x = prog(t, 1.4 + i * 0.55, 1.7 + i * 0.55);
          return (
            <g key={i}>
              <rect x={260} y={y} width={300} height={26} rx={13} fill={C.ink3} opacity={prog(t, 0.1 + i * 0.12, 0.4 + i * 0.12)} />
              <rect x={590} y={y - 24} width={60} height={60} rx={10} fill="none" stroke={C.ink} strokeWidth={5} />
              <g opacity={x > 0 ? 1 : 0} transform={`translate(620 ${y + 6}) scale(${lerp(1.6, 1, x)})`}>
                <path d="M-22 -22 L22 22 M22 -22 L-22 22" stroke={C.accDeep} strokeWidth={11} strokeLinecap="round" />
              </g>
              <Draw d={`M250 ${y + 13} L570 ${y + 13}`} k={x} stroke={C.accDeep} w={7} len={330} />
            </g>
          );
        })}
      </g>
      <Stamp id="cl" t={t} at={4.0} text="واقعیت: صفر" x={470} y={720} rot={-7} size={70} />
    </g>
  );
};

// §5.3 the chain between the leaders snaps
const Chain: React.FC<P> = ({t}) => {
  const br = prog(t, 2.0, 2.8, easeOut);
  const pos: [number, number][] = [[140, 430], [450, 250], [760, 430]];
  const link = (x: number, y: number, r: number, k: number, i: number) => (
    <ellipse key={i} cx={x} cy={y} rx={40} ry={22} transform={`rotate(${r} ${x} ${y})`} fill="none" stroke={C.ink} strokeWidth={10} opacity={k} />
  );
  return (
    <g>
      {[0, 1].map((seg) => {
        const [ax, ay] = pos[seg], [bx, by] = pos[seg + 1];
        const ang = Math.atan2(by - ay, bx - ax) * 180 / Math.PI;
        return Array.from({length: 5}).map((_, j) => {
          const f = (j + 1) / 6;
          const side = j < 2.5 ? -1 : 1;
          const off = br * 22 * side;
          const x = lerp(ax, bx, f) + off * Math.cos((ang * Math.PI) / 180);
          const y = lerp(ay, by, f) + off * Math.sin((ang * Math.PI) / 180) + br * 90 * (0.5 - Math.abs(f - 0.5));
          return link(x, y, ang + (j % 2) * 90 + br * 30 * side, prog(t, 0.3 + j * 0.08, 0.6 + j * 0.08) * (j === 2 ? 1 - br : 1), seg * 10 + j);
        });
      })}
      {[0, 1].map((seg) => {
        const [ax, ay] = pos[seg], [bx, by] = pos[seg + 1];
        const f = br * (1 - prog(t, 3.4, 4.2));
        return f > 0 ? <path key={seg} d={burst((ax + bx) / 2, (ay + by) / 2, 60 * f + 10, 8)} fill={C.acc} /> : null;
      })}
      {pos.map(([x, y], i) => (
        <g key={i} transform={`translate(${x + (i - 1) * 40 * br} ${y}) scale(${pop(t, -0.25 + i * 0.1)}) rotate(${(i - 1) * 10 * br})`}>
          <circle r={88} fill={i === 1 ? C.acc : C.card} stroke={C.ink} strokeWidth={7} />
          <Person x={0} y={60} s={1.8} />
        </g>
      ))}
      <Label x={450} y={680} text="بې‌باوري" size={78} font={F.black} o={prog(t, 2.6, 3.2)} />
      <Label x={450} y={760} text="ژور اختلافات" size={46} fill={C.ink2} o={prog(t, 3, 3.6)} />
    </g>
  );
};

// §5.4 the ship sinks with the members; the leaders row away
const Ship: React.FC<P> = ({t, d}) => {
  const sink = prog(t, 1.2, Math.max(4, d - 0.5), (x) => x);
  const boat = prog(t, 1.8, Math.max(4.5, d), easeInOut);
  const wave = (y: number, ph: number, amp: number) => {
    let s = `M0 ${y}`;
    for (let x = 0; x <= 900; x += 30) s += ` L${x} ${(y + Math.sin(x / 70 + t * 2 + ph) * amp).toFixed(1)}`;
    return s + ' L900 820 L0 820Z';
  };
  return (
    <g>
      <g transform={`translate(290 ${430 + sink * 250}) rotate(${-18 * sink})`}>
        <path d="M-230 0 L230 0 L170 110 L-180 110 Z" fill={C.ink} />
        <rect x={-120} y={-90} width={180} height={90} fill={C.ink} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Person key={i} x={-190 + i * 90} y={0} s={1.15} fill={C.acc} />
        ))}
      </g>
      <path d={wave(560, 0, 14)} fill="#2A3563" opacity={0.92} />
      <g transform={`translate(${lerp(660, 840, boat)} ${552 + Math.sin(t * 2 + 1) * 10}) rotate(${Math.sin(t * 2) * 4})`}>
        <path d="M-110 0 L110 0 L80 50 L-80 50Z" fill={C.card} stroke={C.ink} strokeWidth={5} />
        <Person x={-40} y={2} s={1.05} />
        <Person x={30} y={2} s={1.05} />
        <circle cx={90} cy={-30} r={22} fill="none" stroke={C.acc} strokeWidth={10} />
      </g>
      <path d={wave(600, 2, 10)} fill="#1A2350" />
      <Label x={250} y={760} text="غړي: قرباني" size={42} fill={C.card} font={F.black} o={prog(t, 2, 2.6)} />
      <Label x={660} y={760} text="مشران: ځان ساتنه" size={42} fill={C.acc} font={F.black} o={prog(t, 2.6, 3.2)} />
    </g>
  );
};

export const ILLUS: Record<string, React.FC<P>> = {
  '1.0': Phone, '1.1': Megaphone, '1.2': Tapes,
  '3.0': Org, '3.1': Shield, '3.2': Deny, '3.3': Tug,
  '4.0': TwoLives, '4.1': Burden, '4.2': Hourglass, '4.3': MapAfg,
  '5.0': Slogan, '5.1': Claims, '5.2': Chain, '5.3': Ship,
};

export {fa};
