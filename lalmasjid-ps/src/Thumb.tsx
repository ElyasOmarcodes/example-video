import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {useFonts} from './fonts';

export const Thumb: React.FC = () => {
  const ready = useFonts();
  if (!ready) return null;
  return (
    <AbsoluteFill style={{background: '#02040C'}}>
      <Img src={staticFile('img/s10.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.08)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(3,7,24,0.9) 0%, rgba(3,7,24,0.2) 34%, rgba(3,7,24,0) 55%, rgba(3,7,24,0.9) 100%)'}} />
      <Img src={staticFile('img/logo-nahzat.png')} style={{position: 'absolute', top: 56, right: 56, height: 118}} />
      <div style={{position: 'absolute', top: 250, left: 0, right: 0, textAlign: 'center', direction: 'rtl'}}>
        <div style={{fontFamily: 'QudsB', fontSize: 46, color: '#F2B544'}}>۱۰ جولای ۲۰۰۷ · اسلام‌اباد</div>
        <div style={{fontFamily: 'QudsXK', fontSize: 230, lineHeight: 1.3, color: '#fff', textShadow: '0 12px 50px rgba(0,0,0,0.85)'}}>لعل مسجد</div>
        <div style={{fontFamily: 'QudsXB', fontSize: 64, color: '#fff', textShadow: '0 6px 24px rgba(0,0,0,0.9)'}}>هغه شپه چې تاریخ یې <span style={{color: '#FF5A4A'}}>نه هېروي</span></div>
      </div>
    </AbsoluteFill>
  );
};
