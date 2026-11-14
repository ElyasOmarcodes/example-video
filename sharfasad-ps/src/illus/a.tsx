import React from 'react';
import {C, F, clamp01, easeIn, easeOut, lerp, prog, soft} from '../lib';
import {Draw, L, P, Person, Tag, Txt, arrive, burst} from './kit';

// §1.1 — a phone "films" a few muzzle flashes; the clip is tagged fake
export const Phone: React.FC<P> = ({t, d}) => {
  const k = arrive(t, -0.5);
  const flashes = [0.7, 1.3, 1.65, 2.5];
  const rec = Math.floor(t * 2) % 2 === 0;
  const tagAt = Math.min(3.3, d * 0.5);
  return (
    <>
      <L z={20} shadow={0}>
        {[0, 1, 2].map((i) => {
          const ph = (t * 0.28 + i / 3) % 1;
          return <circle key={i} cx={430} cy={380} r={170 + ph * 260} fill="none" stroke={C.blue} strokeWidth={3} opacity={(1 - ph) * 0.35} />;
        })}
        <circle cx={430} cy={380} r={330} fill="url(#gCool)" opacity={0.5} />
      </L>
      <L z={90}>
        <g transform={`translate(430 380) rotate(${lerp(-10, -5, k)}) scale(${lerp(0.86, 1, k)}) translate(-430 -380)`} opacity={clamp01(k * 2)}>
          <rect x={282} y={62} width={296} height={636} rx={54} fill="url(#gD)" stroke="rgba(255,255,255,0.55)" strokeWidth={3} />
          <clipPath id="ph-scr">
            <rect x={300} y={104} width={260} height={552} rx={26} />
          </clipPath>
          <g clipPath="url(#ph-scr)">
            <rect x={300} y={104} width={260} height={552} fill="#16256F" />
            <rect x={300} y={104} width={260} height={552} fill="url(#gCool)" opacity={0.6} />
            <path d="M300 520 L352 468 L408 500 L468 440 L520 486 L560 460 L560 656 L300 656Z" fill="#0C1856" />
            <path d="M300 580 L380 552 L460 584 L560 548 L560 656 L300 656Z" fill="#081040" />
            {flashes.map((ft, i) => {
              const f = t >= ft ? clamp01(1 - (t - ft) / 0.36) : 0;
              const x = [370, 500, 430, 396][i], y = [486, 470, 512, 474][i];
              return f > 0 ? (
                <g key={i} opacity={f}>
                  <circle cx={x} cy={y} r={120 * f} fill="url(#gHalo)" />
                  <path d={burst(x, y, 34 + 16 * f)} fill={C.acc2} />
                  <circle cx={x} cy={y} r={10} fill="#FFF7E0" />
                </g>
              ) : null;
            })}
            <rect x={300} y={612} width={260} height={44} fill="rgba(3,8,32,0.6)" />
            <rect x={318} y={630} width={224} height={7} rx={3.5} fill="rgba(255,255,255,0.25)" />
            <rect x={318} y={630} width={224 * clamp01(t / Math.max(1, d))} height={7} rx={3.5} fill={C.acc} />
          </g>
          <circle cx={330} cy={136} r={9} fill={rec ? '#FF6A4A' : 'rgba(255,106,74,0.25)'} />
          <text x={348} y={145} fontFamily={F.mono} fontSize={24} fill={C.white}>REC</text>
          <rect x={392} y={76} width={76} height={12} rx={6} fill="rgba(255,255,255,0.22)" />
        </g>
      </L>
      <L z={150}>
        <Tag id="ph1" t={t} at={0.4} text="لنډه ویډیو" x={170} y={600} size={32} kind="glass" />
        <Tag id="ph2" t={t} at={1.0} text="څو ډزې" x={690} y={190} size={32} kind="glass" />
      </L>
      <L z={200} glow>
        <Tag id="ph3" t={t} at={tagAt} text="جعلي انځور" x={430} y={400} size={62} kind="acc" rot={-7} />
      </L>
    </>
  );
};

// §1.2 — the propaganda column towers over the capability column
export const Megaphone: React.FC<P> = ({t}) => {
  const g1 = prog(t, 0.1, 2.3, easeOut);
  const g2 = prog(t, 2.5, 3.6, easeOut);
  const top = 610 - 370 * g1;
  return (
    <>
      <L z={20} shadow={0}>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={90} x2={770} y1={610 - i * 130} y2={610 - i * 130} stroke={C.line} strokeWidth={2} strokeDasharray="4 14" />
        ))}
        <circle cx={260} cy={top + 40} r={260} fill="url(#gHalo)" opacity={0.35 * g1} />
      </L>
      <L z={80}>
        <rect x={150} y={top} width={220} height={610 - top} rx={30} fill="url(#gO)" />
        <rect x={150} y={top} width={70} height={610 - top} rx={30} fill="rgba(255,255,255,0.22)" />
        <rect x={490} y={170} width={220} height={440} rx={30} fill="rgba(255,255,255,0.04)" stroke={C.faint} strokeWidth={3} strokeDasharray="12 14" opacity={g2} />
        <rect x={490} y={610 - 54 * g2} width={220} height={54 * g2} rx={22} fill="url(#gB)" />
        <rect x={80} y={610} width={700} height={8} rx={4} fill="rgba(255,255,255,0.7)" />
        <Txt x={260} y={684} text="تبلیغات" size={40} />
        <Txt x={600} y={684} text="واقعي وړتیا" size={40} />
        <Txt x={600} y={420} text="؟" size={130} fill={C.faint} font={F.title} o={prog(t, 3.4, 4.1)} />
      </L>
      <L z={170}>
        <g transform={`translate(262 ${top - 64}) scale(${arrive(t, 1.1)})`}>
          <path d="M-58 -22 Q-58 -26 -52 -28 L30 -62 Q40 -66 40 -54 L40 54 Q40 66 30 62 L-52 28 Q-58 26 -58 22 Z" fill="url(#gW)" />
          <rect x={-92} y={-26} width={40} height={52} rx={14} fill="url(#gW)" />
          <rect x={-40} y={22} width={22} height={50} rx={10} fill="url(#gW)" />
          {[0, 1, 2].map((i) => {
            const ph = (t * 1.1 + i / 3) % 1;
            return <path key={i} d={`M${64 + ph * 70} ${-44 - ph * 34} Q${104 + ph * 90} 0 ${64 + ph * 70} ${44 + ph * 34}`} fill="none" stroke={C.acc2} strokeWidth={8} strokeLinecap="round" opacity={(1 - ph) * prog(t, 1.4, 1.9)} />;
          })}
        </g>
      </L>
    </>
  );
};

// §1.3 — old clips, re-posted on a loop
export const Tapes: React.FC<P> = ({t, d}) => {
  const years = ['۱۳۹۷', '۱۳۹۹', '۱۴۰۰'];
  const loop = prog(t, 1.5, 2.7, easeOut);
  return (
    <>
      <L z={20} shadow={0}>
        <g transform={`translate(430 380) rotate(${t * 24})`} opacity={loop}>
          <circle r={310} fill="none" stroke="url(#gO)" strokeWidth={12} strokeDasharray="1400 560" strokeDashoffset={1960 * (1 - loop)} strokeLinecap="round" />
          <path d="M282 -138 L330 -84 L258 -74 Z" fill={C.acc} transform="rotate(12)" />
        </g>
      </L>
      {years.map((y, i) => {
        const k = arrive(t, -0.3 + i * 0.35);
        const x = 430 + (i - 1) * 46, yy = 210 + i * 170;
        const r = [-6, 3, -3][i];
        return (
          <L key={i} z={50 + i * 55}>
            <g transform={`translate(${x + (1 - k) * 420} ${yy}) rotate(${r + (1 - k) * 10})`} opacity={clamp01(k * 2.2)}>
              <rect x={-240} y={-78} width={480} height={156} rx={30} fill="url(#gD)" stroke="rgba(255,255,255,0.4)" strokeWidth={2.5} />
              <rect x={-216} y={-56} width={196} height={112} rx={18} fill="url(#gB)" />
              <path d="M-134 -24 Q-138 -30 -130 -27 L-88 -4 Q-82 0 -88 4 L-130 27 Q-138 30 -134 24 Z" fill={C.white} />
              <rect x={6} y={-46} width={196} height={18} rx={9} fill="rgba(255,255,255,0.4)" />
              <rect x={6} y={-12} width={140} height={18} rx={9} fill="rgba(255,255,255,0.22)" />
              <rect x={6} y={24} width={120} height={40} rx={20} fill="rgba(245,160,0,0.22)" stroke={C.acc} strokeWidth={2} />
              <text x={66} y={54} textAnchor="middle" fontFamily={F.semi} fontSize={28} fill={C.acc2}>{y}</text>
            </g>
          </L>
        );
      })}
      <L z={215} glow>
        <Tag id="tp" t={t} at={Math.min(3.6, d * 0.55)} text="زوړ او جعلي" x={430} y={388} size={58} kind="acc" rot={-6} />
      </L>
    </>
  );
};

// §3.1 — the chain of command comes apart
export const Org: React.FC<P> = ({t, d}) => {
  const br = prog(t, 2.0, 3.8, soft);
  const nodes: [number, number][] = [[430, 120], [210, 350], [430, 350], [650, 350], [130, 590], [290, 590], [430, 590], [570, 590], [730, 590]];
  const edges: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 6], [3, 7], [3, 8]];
  const drift = (i: number) => {
    const a = i * 2.39;
    return [Math.cos(a) * 46 * br, Math.sin(a) * 30 * br + 22 * br * (i ? 1 : 0), Math.sin(a * 3) * 16 * br];
  };
  return (
    <>
      <L z={30} shadow={0}>
        <circle cx={430} cy={120} r={210} fill="url(#gHalo)" opacity={0.5} />
        {edges.map(([a, b], i) => {
          const k = prog(t, -0.1 + i * 0.08, 0.5 + i * 0.08, easeOut);
          const [ax, ay] = nodes[a], [bx, by] = nodes[b];
          const [dax, day] = drift(a), [dbx, dby] = drift(b);
          const mx = (ax + bx) / 2, my = (ay + by) / 2;
          const gap = br * 0.55;
          return (
            <g key={i} stroke={C.blue} strokeWidth={5} strokeLinecap="round" opacity={0.9 - br * 0.35}>
              <line x1={ax + dax} y1={ay + day} x2={lerp(ax + dax, mx, k * (1 - gap))} y2={lerp(ay + day, my, k * (1 - gap))} />
              <line x1={bx + dbx} y1={by + dby} x2={lerp(bx + dbx, mx, k * (1 - gap))} y2={lerp(by + dby, my, k * (1 - gap))} />
            </g>
          );
        })}
      </L>
      <L z={90}>
        {nodes.slice(1).map(([x, y], j) => {
          const i = j + 1;
          const [dx, dy, r] = drift(i);
          const k = arrive(t, -0.4 + i * 0.06);
          const big = i < 4 ? 58 : 44;
          return (
            <g key={i} transform={`translate(${x + dx} ${y + dy}) rotate(${r}) scale(${k})`}>
              <circle r={big} fill="url(#gD)" stroke="rgba(255,255,255,0.5)" strokeWidth={2.5} />
              <Person x={0} y={big * 0.64} s={big / 72} />
            </g>
          );
        })}
      </L>
      <L z={150} glow>
        <g transform={`translate(${430 + drift(0)[0]} ${120 + drift(0)[1]}) scale(${arrive(t, -0.5)})`}>
          <circle r={76} fill="url(#gO)" />
          <circle r={76} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={3} />
          <text y={34} textAnchor="middle" fontFamily={F.title} fontSize={96} fill={C.deep}>؟</text>
        </g>
      </L>
      <L z={205}>
        <Tag id="og" t={t} at={Math.min(3.9, d * 0.6)} text="رهبري نشته" x={430} y={470} size={54} kind="acc" rot={-5} />
      </L>
    </>
  );
};

// §3.2 — the shield splits; the people behind it are left exposed
export const Shield: React.FC<P> = ({t}) => {
  const crack = prog(t, 1.4, 2.3, easeOut);
  const fall = prog(t, 2.7, 4.6, easeIn);
  const k = arrive(t, -0.5);
  const sh = 'M430 90 Q560 150 680 160 Q690 410 620 520 Q550 620 430 680 Q310 620 240 520 Q170 410 180 160 Q300 150 430 90 Z';
  const exposed = prog(t, 3.0, 4.2);
  return (
    <>
      <L z={30}>
        {[280, 380, 480, 580].map((x, i) => (
          <Person key={i} x={x} y={700} s={1.5} fill={exposed > 0.5 ? C.blue2 : 'url(#gW)'} o={arrive(t, -0.4 + i * 0.07) * (1 - exposed * 0.35)} />
        ))}
        <circle cx={430} cy={640} r={260} fill="url(#gHalo)" opacity={0.5 * exposed} />
      </L>
      <L z={120}>
        <clipPath id="shL"><rect x={-200} y={-200} width={632} height={1200} /></clipPath>
        <clipPath id="shR"><rect x={428} y={-200} width={700} height={1200} /></clipPath>
        {[0, 1].map((side) => {
          const dir = side ? 1 : -1;
          return (
            <g key={side} transform={`translate(${dir * 150 * fall} ${440 * fall * fall}) rotate(${dir * 24 * fall} 430 400)`} opacity={(1 - fall * 0.75) * clamp01(k * 2)}>
              <g clipPath={`url(#${side ? 'shR' : 'shL'})`}>
                <g transform={`translate(430 390) scale(${lerp(0.85, 1, k)}) translate(-430 -390)`}>
                  <path d={sh} fill="url(#gB)" stroke="rgba(255,255,255,0.6)" strokeWidth={4} />
                  <path d="M430 170 Q520 208 606 216 Q612 400 566 478 Q520 548 430 596 Q340 548 294 478 Q248 400 254 216 Q340 208 430 170 Z" fill="rgba(255,255,255,0.12)" stroke={C.acc2} strokeWidth={6} />
                  <path d="M430 90 Q300 150 180 160 Q176 280 196 380 L430 300 Z" fill="rgba(255,255,255,0.14)" />
                </g>
              </g>
            </g>
          );
        })}
      </L>
      <L z={135} glow>
        <Draw d="M430 90 L412 200 L452 300 L410 400 L450 510 L430 680" k={crack * (1 - fall)} stroke="#FFE2A6" w={8} len={700} />
        <Draw d="M414 200 L320 232 M452 300 L570 280 M410 400 L296 432" k={crack * (1 - fall)} stroke="#FFE2A6" w={5} len={500} />
      </L>
      <L z={190}>
        <Tag id="sd" t={t} at={3.4} text="ساتنه ونه شوه" x={430} y={330} size={46} kind="dark" />
      </L>
    </>
  );
};

// §3.3 — disown the comrade when he is exposed, then turn again
export const Deny: React.FC<P> = ({t, d}) => {
  const flipAt = Math.max(3.4, d * 0.62);
  const flip = prog(t, flipAt, flipAt + 0.9);
  const sx = Math.cos(flip * Math.PI);
  const k = arrive(t, -0.5);
  const b1 = arrive(t, 0.5) * (1 - prog(t, flipAt - 0.25, flipAt + 0.1));
  const b2 = arrive(t, flipAt + 0.7);
  return (
    <>
      <L z={20} shadow={0}>
        <circle cx={310} cy={400} r={300} fill="url(#gCool)" opacity={0.6} />
      </L>
      <L z={80}>
        <g transform={`translate(310 400) scale(${sx * lerp(0.86, 1, k)} ${lerp(0.86, 1, k)}) rotate(-4)`} opacity={clamp01(k * 2)}>
          <rect x={-180} y={-250} width={360} height={500} rx={40} fill="url(#gD)" stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
          <rect x={-134} y={-204} width={268} height={236} rx={28} fill={sx > 0 ? 'url(#gB)' : 'rgba(245,160,0,0.3)'} />
          <Person x={0} y={24} s={2.6} />
          <rect x={-134} y={70} width={268} height={22} rx={11} fill="rgba(255,255,255,0.38)" />
          <rect x={-134} y={114} width={186} height={22} rx={11} fill="rgba(255,255,255,0.22)" />
          <rect x={-134} y={158} width={226} height={22} rx={11} fill="rgba(255,255,255,0.22)" />
        </g>
      </L>
      <L z={130}>
        <g opacity={prog(t, flipAt, flipAt + 0.4)}>
          <Draw d="M520 600 C740 600 740 440 620 440" k={prog(t, flipAt, flipAt + 0.9, easeOut)} stroke={C.acc2} w={12} len={520} />
          <path d="M624 408 L572 440 L624 472Z" fill={C.acc2} opacity={prog(t, flipAt + 0.7, flipAt + 0.9)} />
        </g>
      </L>
      <L z={170}>
        {b1 > 0.01 && (
          <g transform={`translate(640 200) scale(${lerp(0.8, 1, b1)})`} opacity={clamp01(b1 * 2)}>
            <rect x={-176} y={-70} width={352} height={130} rx={65} fill="rgba(6,14,52,0.9)" stroke="rgba(255,255,255,0.4)" strokeWidth={2.5} />
            <path d="M-70 54 Q-96 96 -120 110 Q-70 100 -20 58Z" fill="rgba(6,14,52,0.9)" />
            <Txt x={0} y={10} text="نه یې پېژنو!" size={42} />
          </g>
        )}
        {b2 > 0.01 && (
          <g transform={`translate(640 200) scale(${lerp(0.8, 1, b2)})`} opacity={clamp01(b2 * 2)}>
            <rect x={-176} y={-70} width={352} height={130} rx={65} fill="url(#gO)" />
            <path d="M-70 54 Q-96 96 -120 110 Q-70 100 -20 58Z" fill={C.acc} />
            <Txt x={0} y={10} text="زموږ ملګری دی" size={40} fill={C.deep} />
          </g>
        )}
      </L>
      <L z={205} glow>
        {t < flipAt && <Tag id="dn" t={t} at={1.7} text="انکار" x={310} y={420} size={66} kind="acc" rot={-8} />}
        {t >= flipAt && <Tag id="dn2" t={t} at={flipAt + 1.1} text="دریځ بدل شو" x={310} y={640} size={42} kind="dark" />}
      </L>
    </>
  );
};

// §3.4 — two sides pulling over power and money
export const Tug: React.FC<P> = ({t}) => {
  const sway = Math.sin(t * 1.9) * 24 * prog(t, 0.6, 1.6);
  const fray = prog(t, 3.6, 4.8);
  const rope = (x0: number, x1: number) => `M${x0} 470 Q${(x0 + x1) / 2} ${488 + Math.sin(t * 4) * 6} ${x1} 470`;
  return (
    <>
      <L z={20} shadow={0}>
        <circle cx={430} cy={230} r={300} fill="url(#gHalo)" opacity={0.55} />
      </L>
      <L z={70}>
        <path d={rope(70, 410 + sway)} stroke="#E8D3A8" strokeWidth={12} fill="none" strokeLinecap="round" />
        <path d={rope(450 + sway, 790)} stroke="#E8D3A8" strokeWidth={12} fill="none" strokeLinecap="round" />
        {[0, 1, 2].map((i) => (
          <Person key={'l' + i} x={110 + i * 84 + sway} y={610} s={1.5} rot={-13} o={arrive(t, -0.4 + i * 0.06)} />
        ))}
        {[0, 1, 2].map((i) => (
          <Person key={'r' + i} x={750 - i * 84 + sway} y={610} s={1.5} rot={13} fill="url(#gB)" o={arrive(t, -0.4 + i * 0.06)} />
        ))}
        <rect x={60} y={612} width={740} height={6} rx={3} fill="rgba(255,255,255,0.3)" />
      </L>
      <L z={110} glow>
        <g transform={`translate(${430 + sway} 470)`}>
          <path d={burst(0, 0, 30 + fray * 34, 8)} fill={C.acc2} opacity={0.35 + fray * 0.65} />
          <rect x={-22} y={-10} width={44} height={20} rx={8} fill="#E8D3A8" />
        </g>
      </L>
      <L z={160} glow>
        <g transform={`translate(430 ${230 + Math.sin(t * 1.3) * 8}) scale(${arrive(t, 0.3)})`}>
          <path d="M-96 44 L-116 -52 Q-118 -62 -108 -54 L-54 -10 L-8 -76 Q0 -86 8 -76 L54 -10 L108 -54 Q118 -62 116 -52 L96 44 Z" fill="url(#gO)" stroke="rgba(255,255,255,0.6)" strokeWidth={3} strokeLinejoin="round" />
          <rect x={-98} y={48} width={196} height={26} rx={13} fill="url(#gO)" />
        </g>
        {[0, 1, 2, 3].map((i) => {
          const k = arrive(t, 1.1 + i * 0.14);
          const bob = Math.sin(t * 1.5 + i) * 7;
          return (
            <g key={i} transform={`translate(${[250, 610, 190, 670][i]} ${[330, 330, 220, 220][i] + bob}) scale(${k})`}>
              <circle r={42} fill="url(#gO)" stroke="rgba(255,255,255,0.6)" strokeWidth={3} />
              <text y={15} textAnchor="middle" fontFamily={F.semi} fontSize={44} fill={C.deep}>$</text>
            </g>
          );
        })}
      </L>
      <L z={200}>
        <Tag id="tg1" t={t} at={0.9} text="واک" x={430} y={110} size={36} kind="glass" />
        <Tag id="tg2" t={t} at={2.2} text="خپلمنځي شخړې" x={430} y={700} size={40} kind="dark" />
      </L>
    </>
  );
};
