import React from 'react';
import {C, F, clamp01, easeIn, easeInOut, easeOut, lerp, prog, soft, spT} from '../lib';
import {Draw, IH, IW, L, P, Person, Tag, Txt, arrive, burst} from './kit';
import afg from '../data/afg.json';

// The map path was built for a 900×760 box; shift it into the 860×760 card.
const MAP_T = 'translate(-20 0)';

// §4.1 — two lives: comfort abroad above, the front line below
export const TwoLives: React.FC<P> = ({t}) => {
  const a = prog(t, -0.5, 0.7, easeOut);
  const b = prog(t, 0.3, 1.5, easeOut);
  const smoke = (i: number) => (t * 16 + i * 60) % 180;
  return (
    <>
      <L z={8} shadow={0}>
        <g clipPath="url(#cardClip)">
          <clipPath id="tlA"><path d="M0 0 H860 V330 L0 420 Z" /></clipPath>
          <clipPath id="tlB"><path d="M0 440 L860 350 V760 H0 Z" /></clipPath>
          <g clipPath="url(#tlA)" opacity={a}>
            <rect width={860} height={440} fill="#3550C8" />
            <rect width={860} height={440} fill="url(#gHalo)" opacity={0.9} transform="translate(300 -260) scale(1.4)" />
            <circle cx={700} cy={120} r={62} fill="url(#gO)" />
            <path d="M0 330 Q200 280 430 310 T860 290 V440 H0Z" fill="#2740A8" />
          </g>
          <g clipPath="url(#tlB)" opacity={b}>
            <rect y={340} width={860} height={420} fill="#070E36" />
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={150 + i * 190} cy={690 - smoke(i)} r={44 + smoke(i) * 0.4} fill="#3A4680" opacity={0.55 * (1 - smoke(i) / 180)} />
            ))}
            <path d="M0 710 L80 650 L140 680 L210 630 L300 670 L380 620 L470 665 L560 610 L650 655 L740 600 L820 650 L860 640 V760 H0Z" fill="#030820" />
          </g>
        </g>
      </L>
      <L z={70}>
        <g opacity={a} transform={`translate(${(1 - a) * 80} 0)`}>
          <path d="M120 300 L120 196 Q120 186 128 180 L232 110 Q240 105 248 110 L352 180 Q360 186 360 196 L360 300 Z" fill="url(#gW)" />
          <rect x={164} y={206} width={62} height={52} rx={12} fill={C.acc} />
          <rect x={254} y={206} width={62} height={52} rx={12} fill={C.acc} />
          <path d="M440 304 h178 q14 0 14 -14 v-40 q0 -16 16 -16 v-22 q0 -16 -16 -16 h-206 q-16 0 -16 16 v78 q0 14 14 14z" fill="url(#gD)" stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
        </g>
        {[0, 1, 2, 3, 4].map((i) => (
          <Person key={i} x={170 + i * 120} y={704} s={1.25} fill="url(#gO)" o={b} />
        ))}
      </L>
      <L z={150}>
        <g transform={`translate(${470 + ((t * 44) % 260)} ${120 - ((t * 10) % 60)}) rotate(-10)`} opacity={a}>
          <path d="M-74 0 Q-74 -9 -60 -9 L56 -10 Q84 -8 84 0 Q84 8 56 10 L-60 9 Q-74 9 -74 0Z M-8 -8 L-40 -54 L-18 -54 L24 -8Z M-8 8 L-40 54 L-18 54 L24 8Z M-56 -6 L-78 -30 L-64 -30 L-44 -6Z" fill={C.white} />
        </g>
        <path d="M0 432 L860 342" stroke="rgba(255,255,255,0.85)" strokeWidth={6} strokeLinecap="round" strokeDasharray={900} strokeDashoffset={900 * (1 - b)} />
      </L>
      <L z={200}>
        <Tag id="tl1" t={t} at={0.5} text="مشران: په بهر کې هوسا" x={600} y={84} size={32} kind="dark" />
        <Tag id="tl2" t={t} at={1.4} text="ځوانان: د جګړې ډګر" x={250} y={560} size={32} kind="acc" />
      </L>
    </>
  );
};

// §4.2 — the weight of the war lowered onto other people's shoulders
export const Burden: React.FC<P> = ({t}) => {
  const drop = spT(t, 0.8, {damping: 16, stiffness: 60, mass: 1.4});
  const y = lerp(-240, 392, drop);
  const squash = 1 - 0.16 * clamp01(drop);
  return (
    <>
      <L z={20} shadow={0}>
        <circle cx={300} cy={620} r={300} fill="url(#gCool)" opacity={0.6} />
        <line x1={300} x2={300} y1={30} y2={Math.max(30, y - 100)} stroke={C.faint} strokeWidth={4} strokeDasharray="10 12" />
      </L>
      <L z={50}>
        <g transform="translate(680 180)" opacity={arrive(t, -0.4)}>
          <rect x={-112} y={10} width={224} height={20} rx={10} fill="url(#gW)" />
          <Person x={0} y={10} s={1.75} />
          <line x1={-26} y1={-74} x2={-124} y2={-24} stroke="#DCE5FF" strokeWidth={15} strokeLinecap="round" />
          <Txt x={0} y={86} text="اجیر مشر" size={32} fill={C.dim} font={F.medium} />
        </g>
      </L>
      <L z={80}>
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${150 + i * 100} 690) scale(1 ${squash})`}>
            <Person x={0} y={0} s={2.1} fill="url(#gO)" o={arrive(t, -0.4 + i * 0.07)} />
          </g>
        ))}
        <rect x={60} y={690} width={740} height={6} rx={3} fill="rgba(255,255,255,0.35)" />
      </L>
      <L z={150} shadow={0.6}>
        <g transform={`translate(300 ${y})`}>
          <path d="M-200 -96 Q-208 -100 -196 -100 L196 -100 Q208 -100 210 -88 L236 64 Q238 82 220 82 L-220 82 Q-238 82 -236 64 L-210 -88 Q-208 -100 -196 -100Z" fill="url(#gD)" stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
          <path d="M-196 -100 L196 -100 Q208 -100 210 -88 L214 -62 L-214 -62 L-210 -88 Q-208 -100 -196 -100Z" fill="rgba(255,255,255,0.16)" />
          <Txt x={0} y={22} text="د جګړې بار" size={56} font={F.semi} />
        </g>
      </L>
    </>
  );
};

// §4.3 — a life and a future, running out
export const Hourglass: React.FC<P> = ({t, d}) => {
  const k = prog(t, 0.3, Math.max(2.5, d - 0.2), (x) => x);
  const s = arrive(t, -0.5);
  const top = 1 - k;
  return (
    <>
      <L z={20} shadow={0}>
        <circle cx={430} cy={380} r={330} fill="url(#gHalo)" opacity={0.5} />
      </L>
      <L z={90}>
        <g transform={`translate(430 372) scale(${lerp(0.86, 1, s)}) rotate(${Math.sin(t * 0.7) * 1.6}) translate(-430 -372)`} opacity={clamp01(s * 2)}>
          <rect x={230} y={50} width={400} height={40} rx={20} fill="url(#gW)" />
          <rect x={230} y={654} width={400} height={40} rx={20} fill="url(#gW)" />
          <path d="M282 90 C282 270 404 320 420 372 C404 424 282 474 282 654 L578 654 C578 474 456 424 440 372 C456 320 578 270 578 90 Z" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.7)" strokeWidth={5} />
          <clipPath id="hgT"><path d="M282 90 C282 270 404 320 420 372 L440 372 C456 320 578 270 578 90 Z" /></clipPath>
          <clipPath id="hgB"><path d="M420 372 C404 424 282 474 282 654 L578 654 C578 474 456 424 440 372 Z" /></clipPath>
          <rect x={270} y={lerp(126, 372, 1 - top)} width={320} height={280} fill="url(#gO)" clipPath="url(#hgT)" />
          <path d={`M270 654 L270 ${654 - 230 * k} Q430 ${654 - 310 * k} 590 ${654 - 230 * k} L590 654Z`} fill="url(#gO)" clipPath="url(#hgB)" />
          {top > 0.02 && <line x1={430} x2={430} y1={372} y2={654 - 236 * k} stroke={C.acc2} strokeWidth={7} strokeDasharray="12 10" strokeDashoffset={-t * 110} />}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const fade = clamp01(top * 6.5 - i * 0.95);
            return <Person key={i} x={330 + (i % 3) * 100} y={190 + Math.floor(i / 3) * 78} s={0.8} fill={C.deep} o={fade} />;
          })}
          <path d="M300 110 C302 250 380 300 404 350" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={6} strokeLinecap="round" />
        </g>
      </L>
      <L z={170}>
        <Tag id="hg" t={t} at={0.8} text="ژوند او راتلونکی" x={430} y={724} size={38} kind="dark" />
      </L>
    </>
  );
};

// §4.4 — the country pushed and cracked from outside
export const MapAfg: React.FC<P> = ({t}) => {
  const draw = prog(t, -0.4, 1.5, easeOut);
  const shake = prog(t, 3.2, 3.6) * (1 - prog(t, 5.0, 6.0));
  const sx = Math.sin(t * 36) * 4 * shake;
  const arrows: [number, number, number, number][] = [[820, 110, 610, 270], [30, 500, 250, 450], [800, 680, 580, 540], [70, 80, 310, 270]];
  return (
    <>
      <L z={20} shadow={0}>
        <circle cx={430} cy={380} r={340} fill="url(#gCool)" opacity={0.7} />
      </L>
      <L z={80}>
        <g transform={`${MAP_T} translate(${sx} ${Math.cos(t * 33) * 3 * shake})`}>
          <path d={afg.d} fill="url(#gB)" opacity={prog(t, 0.8, 1.8) * 0.9} />
          <path d={afg.d} fill="url(#gG)" opacity={prog(t, 0.8, 1.8) * 0.5} />
          <Draw d={afg.d} k={draw} stroke={C.white} w={5} len={6000} />
        </g>
      </L>
      <L z={96} glow>
        <g transform={`${MAP_T} translate(${sx} 0)`}>
          <Draw d="M420 240 L460 330 L420 400 L470 480 L440 560" k={prog(t, 3.2, 4.0, easeOut)} stroke="#FFE2A6" w={7} len={500} />
          <Draw d="M460 330 L560 360 M420 400 L330 420" k={prog(t, 3.5, 4.3, easeOut)} stroke="#FFE2A6" w={5} len={300} />
        </g>
      </L>
      <L z={160}>
        {arrows.map(([x0, y0, x1, y1], i) => {
          const k = prog(t, 1.6 + i * 0.35, 2.5 + i * 0.35, easeOut);
          const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
          const xe = lerp(x0, x1, k), ye = lerp(y0, y1, k);
          return k > 0 ? (
            <g key={i}>
              <line x1={x0} y1={y0} x2={xe} y2={ye} stroke="url(#gO)" strokeWidth={15} strokeDasharray="28 16" strokeLinecap="round" />
              <path d="M-4 -28 Q-8 -34 0 -30 L44 -4 Q50 0 44 4 L0 30 Q-8 34 -4 28 Z" fill={C.acc2} transform={`translate(${xe} ${ye}) rotate(${ang})`} />
            </g>
          ) : null;
        })}
      </L>
      <L z={205}>
        <Tag id="mp" t={t} at={2.8} text="د پردیو ګټې ← بې‌ثباتي" x={430} y={712} size={38} kind="acc" />
      </L>
    </>
  );
};

// §5.1 — a big slogan over an empty field
export const Slogan: React.FC<P> = ({t, d}) => {
  const inf = arrive(t, -0.5);
  const at = Math.max(3, d * 0.6);
  const def = prog(t, at, at + 1.4, soft);
  const s = lerp(0.8, 1, inf) * (1 - def * 0.6);
  return (
    <>
      <L z={20} shadow={0}>
        <circle cx={430} cy={280} r={330} fill="url(#gHalo)" opacity={0.5 * (1 - def * 0.7)} />
        <path d="M40 640 Q430 596 820 640" stroke="rgba(255,255,255,0.6)" strokeWidth={5} fill="none" strokeLinecap="round" />
        <rect x={250} y={540} width={360} height={90} rx={30} fill="rgba(255,255,255,0.04)" stroke={C.faint} strokeWidth={4} strokeDasharray="14 14" opacity={prog(t, 1.2, 1.9)} />
        <Txt x={430} y={602} text="هیڅ" size={50} fill={C.faint} o={prog(t, 1.8, 2.5)} />
      </L>
      <L z={90}>
        <Tag id="sl2" t={t} at={1.0} text="عملي میدان" x={430} y={702} size={36} kind="dark" />
      </L>
      <L z={170}>
        <g transform={`translate(430 ${280 + def * 60}) rotate(${Math.sin(t * 5) * 2 * def}) scale(${s} ${s * (1 - def * 0.2)})`} opacity={clamp01(inf * 2)}>
          <path d="M-300 -150 Q-320 -150 -330 -120 Q-360 0 -330 110 Q-320 140 -290 140 L-150 144 L-200 222 Q-204 232 -192 226 L-40 148 L290 140 Q320 140 330 110 Q360 0 330 -120 Q320 -150 290 -150 Z" fill="url(#gO)" stroke="rgba(255,255,255,0.6)" strokeWidth={3} />
          <path d="M-300 -150 L290 -150 Q320 -150 330 -120 Q338 -90 342 -60 L-342 -60 Q-338 -90 -330 -120 Q-320 -150 -300 -150Z" fill="rgba(255,255,255,0.2)" />
          <Txt x={0} y={24} text="خیالي شعارونه!" size={78} fill={C.deep} font={F.title} />
        </g>
      </L>
    </>
  );
};

// §5.2 — a list of claims, every line struck out
export const Claims: React.FC<P> = ({t}) => {
  const k = arrive(t, -0.5);
  return (
    <>
      <L z={20} shadow={0}>
        <circle cx={430} cy={380} r={330} fill="url(#gCool)" opacity={0.6} />
      </L>
      <L z={80}>
        <g transform={`translate(430 380) rotate(-3) scale(${lerp(0.86, 1, k)}) translate(-430 -380)`} opacity={clamp01(k * 2)}>
          <rect x={180} y={70} width={500} height={640} rx={44} fill="url(#gD)" stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
          <rect x={340} y={40} width={180} height={70} rx={30} fill="url(#gW)" />
          <Txt x={430} y={196} text="ادعاوې" size={56} font={F.semi} />
          {[0, 1, 2, 3].map((i) => {
            const y = 276 + i * 106;
            return (
              <g key={i}>
                <rect x={250} y={y} width={290} height={26} rx={13} fill="rgba(255,255,255,0.3)" opacity={prog(t, -0.1 + i * 0.12, 0.3 + i * 0.12)} />
                <rect x={570} y={y - 20} width={64} height={64} rx={18} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
              </g>
            );
          })}
        </g>
      </L>
      <L z={140} glow>
        <g transform="translate(430 380) rotate(-3) translate(-430 -380)">
          {[0, 1, 2, 3].map((i) => {
            const y = 276 + i * 106;
            const x = prog(t, 1.3 + i * 0.55, 1.75 + i * 0.55, easeOut);
            return x > 0 ? (
              <g key={i}>
                <Draw d={`M240 ${y + 13} L556 ${y + 13}`} k={x} stroke={C.acc2} w={7} len={330} />
                <g transform={`translate(602 ${y + 12}) scale(${lerp(1.5, 1, x)})`} opacity={x}>
                  <path d="M-18 -18 L18 18 M18 -18 L-18 18" stroke={C.acc2} strokeWidth={10} strokeLinecap="round" />
                </g>
              </g>
            ) : null;
          })}
        </g>
      </L>
      <L z={205}>
        <Tag id="cl" t={t} at={4.0} text="واقعي فعالیت: صفر" x={430} y={690} size={44} kind="acc" rot={-4} />
      </L>
    </>
  );
};

// §5.3 — the chain between the leaders snaps
export const Chain: React.FC<P> = ({t}) => {
  const br = prog(t, 2.0, 3.0, easeOut);
  const pos: [number, number][] = [[140, 400], [430, 230], [720, 400]];
  return (
    <>
      <L z={20} shadow={0}>
        <circle cx={430} cy={320} r={330} fill="url(#gCool)" opacity={0.6} />
      </L>
      <L z={60}>
        {[0, 1].map((seg) => {
          const [ax, ay] = pos[seg], [bx, by] = pos[seg + 1];
          const ang = Math.atan2(by - ay, bx - ax);
          return Array.from({length: 5}).map((_, j) => {
            const f = (j + 1) / 6;
            const side = j < 2.5 ? -1 : 1;
            const off = br * 20 * side;
            const x = lerp(ax, bx, f) + off * Math.cos(ang);
            const y = lerp(ay, by, f) + off * Math.sin(ang) + br * 90 * (0.5 - Math.abs(f - 0.5));
            const o = prog(t, 0.1 + j * 0.08, 0.5 + j * 0.08) * (j === 2 ? 1 - br : 1);
            return <ellipse key={seg * 10 + j} cx={x} cy={y} rx={38} ry={21} transform={`rotate(${(ang * 180) / Math.PI + (j % 2) * 90 + br * 28 * side} ${x} ${y})`} fill="none" stroke="#DCE5FF" strokeWidth={9} opacity={o} />;
          });
        })}
      </L>
      <L z={110}>
        {pos.map(([x, y], i) => (
          <g key={i} transform={`translate(${x + (i - 1) * 36 * br} ${y}) scale(${arrive(t, -0.45 + i * 0.1)}) rotate(${(i - 1) * 9 * br})`}>
            <circle r={90} fill={i === 1 ? 'url(#gO)' : 'url(#gD)'} stroke="rgba(255,255,255,0.55)" strokeWidth={3} />
            <Person x={0} y={62} s={1.85} fill={i === 1 ? C.deep : 'url(#gW)'} />
          </g>
        ))}
      </L>
      <L z={170} glow>
        {[0, 1].map((seg) => {
          const [ax, ay] = pos[seg], [bx, by] = pos[seg + 1];
          const f = br * (1 - prog(t, 3.2, 4.2));
          return f > 0 ? <path key={seg} d={burst((ax + bx) / 2, (ay + by) / 2, 52 * f + 8, 8)} fill={C.acc2} /> : null;
        })}
      </L>
      <L z={205}>
        <Tag id="ch1" t={t} at={2.6} text="بې‌باوري" x={430} y={590} size={62} kind="acc" />
        <Tag id="ch2" t={t} at={3.3} text="ژور اختلافات" x={430} y={700} size={36} kind="dark" />
      </L>
    </>
  );
};

// §5.4 — the ship goes down with the members; the leaders row away
export const Ship: React.FC<P> = ({t, d}) => {
  const sink = prog(t, 1.2, Math.max(4, d - 0.3), (x) => x);
  const boat = prog(t, 1.6, Math.max(4.5, d), easeInOut);
  const wave = (y: number, ph: number, amp: number) => {
    let s = `M-40 ${y}`;
    for (let x = -40; x <= 900; x += 30) s += ` L${x} ${(y + Math.sin(x / 70 + t * 1.7 + ph) * amp).toFixed(1)}`;
    return s + ' L900 800 L-40 800Z';
  };
  return (
    <>
      <L z={10} shadow={0}>
        <g clipPath="url(#cardClip)">
          <circle cx={640} cy={170} r={300} fill="url(#gHalo)" opacity={0.6} />
          <circle cx={640} cy={170} r={56} fill="url(#gO)" />
          <path d={wave(470, 3, 8)} fill="#1B2F8A" opacity={0.7} />
        </g>
      </L>
      <L z={70}>
        <g clipPath="url(#cardClip)">
          <g transform={`translate(280 ${390 + sink * 250}) rotate(${-17 * sink})`}>
            <path d="M-230 0 L230 0 Q236 0 232 10 L182 104 Q176 114 164 114 L-170 114 Q-182 114 -188 104 L-234 10 Q-238 0 -230 0Z" fill="url(#gW)" />
            <rect x={-120} y={-96} width={184} height={96} rx={18} fill="url(#gW)" />
            <rect x={-94} y={-70} width={44} height={40} rx={10} fill={C.blue3} />
            <rect x={-30} y={-70} width={44} height={40} rx={10} fill={C.blue3} />
            {[0, 1, 2, 3, 4].map((i) => (
              <Person key={i} x={-190 + i * 92} y={0} s={1.15} fill="url(#gO)" />
            ))}
          </g>
          <path d={wave(520, 0, 13)} fill="#2740A8" />
        </g>
      </L>
      <L z={130}>
        <g clipPath="url(#cardClip)">
          <g transform={`translate(${lerp(600, 790, boat)} ${512 + Math.sin(t * 1.8 + 1) * 9}) rotate(${Math.sin(t * 1.8) * 3.5})`}>
            <path d="M-112 0 L112 0 Q118 0 114 8 L88 46 Q84 52 76 52 L-76 52 Q-84 52 -88 46 L-114 8 Q-118 0 -112 0Z" fill="url(#gD)" stroke="rgba(255,255,255,0.6)" strokeWidth={3} />
            <Person x={-40} y={2} s={1.05} />
            <Person x={30} y={2} s={1.05} />
            <circle cx={92} cy={-30} r={22} fill="none" stroke={C.acc} strokeWidth={10} />
          </g>
          <path d={wave(566, 2, 10)} fill="#101E6B" />
        </g>
      </L>
      <L z={200}>
        <Tag id="sp1" t={t} at={2.0} text="غړي: قرباني" x={240} y={680} size={36} kind="acc" />
        <Tag id="sp2" t={t} at={2.7} text="مشران: ځان ساتنه" x={620} y={680} size={36} kind="dark" />
      </L>
    </>
  );
};

export {IW, IH};
