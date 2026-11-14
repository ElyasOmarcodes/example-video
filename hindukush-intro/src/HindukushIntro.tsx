import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";
import tl from "../timeline.json";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const LOGO_W = 900; // logo is 1525x464; the mark starts at x=1192
const LOGO_H = (LOGO_W * 464) / 1525;
const MARK_X = (LOGO_W * 1192) / 1525;

const BgMesh: React.FC = () => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 55) * 50, d2 = Math.cos(frame / 70) * 40;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 45%, ${theme.colors.bgAlt} 0%, ${theme.colors.bg} 70%)` }}>
      <div style={{ position: "absolute", width: 1300, height: 1300, borderRadius: "50%", top: 120, left: -420 + d1, filter: "blur(60px)", background: `radial-gradient(circle, ${theme.colors.accent}33, transparent 62%)` }} />
      <div style={{ position: "absolute", width: 1000, height: 1000, borderRadius: "50%", bottom: 80, right: -380 - d2, filter: "blur(70px)", background: `radial-gradient(circle, ${theme.colors.primary}1f, transparent 65%)` }} />
      <AbsoluteFill style={{ opacity: 0.05, backgroundImage: `linear-gradient(${theme.colors.text} 1px, transparent 1px), linear-gradient(90deg, ${theme.colors.text} 1px, transparent 1px)`, backgroundSize: "120px 120px", transform: `translateY(${-frame * 0.4}px)` }} />
    </AbsoluteFill>
  );
};
const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: theme.colors.accent, mixBlendMode: "soft-light", opacity: 0.18 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25), transparent 30%, transparent 70%, rgba(0,0,0,0.3))" }} />
  </AbsoluteFill>
);
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: noise, backgroundSize: "220px", backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`, opacity: 0.07, mixBlendMode: "overlay" }} />;
};
const Vignette: React.FC = () => <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)" }} />;

// staggered rays that burst from where the mark will land, then retract
const Rays: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = tl.rays * fps, n = 14;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const p = spring({ frame: frame - start - i * 1.2, fps, config: theme.spring.snappy });
        const out = interpolate(frame, [start + 16 + i, start + 30 + i], [1, 0], { ...clamp, easing: theme.ease.in });
        return <div key={i} style={{ position: "absolute", left: cx, top: cy, width: 10, height: 330 * p, opacity: out, borderRadius: 10, transformOrigin: "50% 0%", background: i % 2 ? theme.colors.text : theme.colors.primary, transform: `translateX(-50%) rotate(${(360 / n) * i}deg) translateY(${120 + 140 * (1 - out)}px)` }} />;
      })}
    </>
  );
};

export const HindukushIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const at = (s: number) => s * fps;

  // mark: bouncy pop + rotation from -120deg
  const mp = spring({ frame: frame - at(tl.mark), fps, config: theme.spring.bouncy });
  const mr = spring({ frame: frame - at(tl.mark), fps, config: theme.spring.smooth });
  // wordmark: RTL mask wipe + slide + de-blur (3 properties together)
  const wp = spring({ frame: frame - at(tl.word), fps, config: theme.spring.smooth });
  const wipe = interpolate(wp, [0, 1], [100, 0], clamp);
  const wx = interpolate(wp, [0, 1], [60, 0], clamp);
  const blur = interpolate(wp, [0, 1], [14, 0], clamp);
  // logo group: slides left a touch as the wordmark arrives, then breathes
  const shift0 = 540 - ((1080 - LOGO_W) / 2 + MARK_X + (LOGO_W - MARK_X) / 2);
  const shift = interpolate(frame, [at(tl.word), at(tl.word) + 24], [shift0, 0], { ...clamp, easing: theme.ease.inOut });
  const breathe = 1 + Math.sin((frame - at(tl.bar)) / 22) * 0.012 * (frame > at(tl.bar) ? 1 : 0);
  // light sweep across the wordmark
  const sweep = interpolate(frame, [at(tl.sweep), at(tl.sweep) + 22], [-40, 140], { ...clamp, easing: theme.ease.inOut });
  // underline + handle
  const bar = spring({ frame: frame - at(tl.bar), fps, config: theme.spring.snappy });
  const hp = spring({ frame: frame - at(tl.handle), fps, config: theme.spring.snappy });
  // exit: faster than entrances
  const ex = interpolate(frame, [at(tl.exit), at(tl.exit) + 12], [0, 1], { ...clamp, easing: theme.ease.in });
  const fadeAll = interpolate(frame, [durationInFrames - 8, durationInFrames - 1], [1, 0], clamp);

  const top = 960 - LOGO_H / 2 - 60;
  const left = (1080 - LOGO_W) / 2;
  const markW = LOGO_W - MARK_X;
  return (
    <AbsoluteFill style={{ opacity: fadeAll }}>
      <BgMesh />
      <AbsoluteFill style={{ transform: `scale(${(1 - ex * 0.12) * breathe})`, opacity: 1 - ex, filter: `blur(${ex * 10}px)` }}>
        <Rays cx={left + MARK_X + markW / 2 + shift} cy={top + LOGO_H / 2} />
        <div style={{ position: "absolute", left: left + shift, top, width: LOGO_W, height: LOGO_H }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: MARK_X, height: LOGO_H, clipPath: `inset(0 0 0 ${wipe}%)`, transform: `translateX(${wx}px)`, filter: `blur(${blur}px)` }}>
            <Img src={staticFile("wordmark.png")} style={{ width: MARK_X, height: LOGO_H }} />
            <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("wordmark.png")})`, WebkitMaskSize: "100% 100%", background: `linear-gradient(100deg, transparent ${sweep - 18}%, rgba(255,255,255,0.9) ${sweep}%, transparent ${sweep + 18}%)`, mixBlendMode: "overlay" }} />
          </div>
          <Img src={staticFile("mark.png")} style={{ position: "absolute", left: MARK_X, top: 0, width: markW, height: LOGO_H, transform: `scale(${mp}) rotate(${(1 - mr) * -120}deg)`, transformOrigin: "50% 62%", filter: `drop-shadow(0 0 ${40 * mp}px ${theme.colors.glow})` }} />
        </div>
        <div style={{ position: "absolute", left: 540 - 160, top: top + LOGO_H + 50, width: 320, height: 8, borderRadius: 4, background: theme.colors.text, opacity: 0.85, transform: `scaleX(${bar})`, transformOrigin: "100% 50%" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: top + LOGO_H + 92, textAlign: "center", fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 52, letterSpacing: "0.02em", color: theme.colors.textDim, opacity: hp, transform: `translateY(${(1 - hp) * 30}px) scale(${0.94 + hp * 0.06})` }}>@hindukush</div>
      </AbsoluteFill>
      <Grade />
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};
