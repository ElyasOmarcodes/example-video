import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, F, TL} from './lib';
import {useFonts} from './text/fonts';
import {Type} from './text/Type';
import {Backdrop, Dust, Finish} from './stage/stage';
import {Title} from './Main';

const T = 5.78; // the title scene, fully written

export const Thumb: React.FC = () => {
  const ready = useFonts();
  if (!ready) return null;
  return (
    <AbsoluteFill style={{background: C.bg0}}>
      <Backdrop t={T} />
      <Dust t={T} />
      <Title t={T} />
      <Finish frame={0} />
      <Img src={staticFile('img/logo-white.png')} style={{position: 'absolute', top: 58, right: 58, height: 92}} />
    </AbsoluteFill>
  );
};

export const ThumbWide: React.FC = () => {
  const ready = useFonts();
  if (!ready) return null;
  return (
    <AbsoluteFill style={{background: C.bg0}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1280, height: 1920, transform: 'scale(1)', transformOrigin: '0 0'}}>
        <AbsoluteFill style={{width: 1280, height: 720, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: -260, width: 1280, height: 1920}}>
            <Backdrop t={T} />
          </div>
        </AbsoluteFill>
      </div>
      {/* the marionette rig, cropped from the title scene */}
      <div style={{position: 'absolute', left: -70, top: -40, width: 620, height: 760, overflow: 'hidden', WebkitMaskImage: 'radial-gradient(ellipse 54% 37% at 50% 34%, #000 50%, rgba(0,0,0,0) 100%)', maskImage: 'radial-gradient(ellipse 54% 37% at 50% 34%, #000 50%, rgba(0,0,0,0) 100%)'}}>
        <div style={{position: 'absolute', left: 0, top: -110, width: 1080, height: 1920, transform: 'scale(0.62)', transformOrigin: '0 0'}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}>
            <Title t={2.2} />
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, background: `linear-gradient(to bottom, rgba(3,8,32,0), ${C.bg0})`}} />
      </div>
      <div style={{position: 'absolute', right: 56, top: 190, width: 700}}>
        <Type text={TL.title.text} a={-10} b={-5} t={10} size={78} maxW={700} fit={1.2} family={F.title} align="center" lh={1.5} hl={['شر', 'فساد', 'اجیر', 'مشران']} maxKashidaEm={0.62} />
      </div>
      <Img src={staticFile('img/logo-white.png')} style={{position: 'absolute', top: 44, right: 56, height: 74}} />
      <div style={{position: 'absolute', bottom: 46, right: 56, padding: '8px 30px 12px', borderRadius: 30, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', fontFamily: F.medium, fontSize: 30, color: C.white, direction: 'rtl'}}>تحلیلي ګرافیک</div>
      <Finish frame={0} />
    </AbsoluteFill>
  );
};
