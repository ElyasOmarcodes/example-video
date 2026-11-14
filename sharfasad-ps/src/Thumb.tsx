import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, F} from './lib';
import {Grain, Paper, Stamp, Words, useFonts} from './components/kit';
import {ILLUS} from './components/illus';

const Ill = ILLUS['4.1'];
const TEXT = 'د شر او فساد ډلې؛ بې‌کفایته جبهې او اجیر مشران یې څه کوي!؟';
const HL = ['شر', 'فساد', 'اجیر', 'مشران'];

const CardIll: React.FC<{w: number; rot: number}> = ({w, rot}) => (
  <div style={{width: w, height: (w * 820) / 900, transform: `rotate(${rot}deg)`, position: 'relative'}}>
    <div style={{position: 'absolute', inset: -18, background: C.card, borderRadius: 24, boxShadow: '0 30px 60px rgba(70,50,20,0.25)'}} />
    <div style={{position: 'absolute', top: -38, left: w / 2 - 90, width: 180, height: 46, background: 'rgba(242,154,0,0.6)', transform: 'rotate(-3deg)'}} />
    <svg viewBox="0 0 900 820" width={w} height={(w * 820) / 900} style={{position: 'relative'}}>
      <Ill t={4} d={6} />
    </svg>
  </div>
);

export const Thumb: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <Paper />
      <div style={{position: 'absolute', top: 70, right: 70}}>
        <Img src={staticFile('img/logo-navy.png')} style={{height: 110}} />
      </div>
      <div style={{position: 'absolute', left: 60, right: 60, top: 260}}>
        <Words text={TEXT} a={-10} b={-5} t={10} size={126} font={F.title} align="center" lh={1.38} hl={HL} marker="rgba(242,154,0,0.75)" />
      </div>
      <div style={{position: 'absolute', left: 120, top: 1050}}>
        <CardIll w={840} rot={-2} />
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Stamp id="th" t={9} at={0} text="تحلیلي ګرافیک" x={790} y={1000} rot={6} size={56} />
      </svg>
      <Grain />
    </AbsoluteFill>
  );
};

export const ThumbWide: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <Paper />
      <div style={{position: 'absolute', top: 40, right: 50}}>
        <Img src={staticFile('img/logo-navy.png')} style={{height: 64}} />
      </div>
      <div style={{position: 'absolute', right: 40, width: 720, top: 130}}>
        <Words text={TEXT} a={-10} b={-5} t={10} size={84} font={F.title} align="center" lh={1.36} hl={HL} marker="rgba(242,154,0,0.75)" />
      </div>
      <div style={{position: 'absolute', left: 50, top: 150}}>
        <CardIll w={440} rot={-2.5} />
      </div>
      <svg width={1280} height={720} style={{position: 'absolute', inset: 0}}>
        <Stamp id="tw" t={9} at={0} text="تحلیلي ګرافیک" x={930} y={630} rot={-5} size={44} />
      </svg>
      <Grain />
    </AbsoluteFill>
  );
};
