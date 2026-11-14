import React from 'react';
import {AbsoluteFill, Still} from 'remotion';
import {C, F, TL} from './lib';
import {useFonts} from './text/fonts';
import {Type} from './text/Type';

const KTest: React.FC = () => {
  const ready = useFonts();
  if (!ready) return null;
  const s3 = TL.sections[2];
  return (
    <AbsoluteFill style={{background: C.bg1, padding: 60, gap: 50, display: 'flex', flexDirection: 'column'}}>
      <Type text={TL.title.text} a={0} b={5} t={99} size={104} maxW={940} family={F.title} align="center" lh={1.45} hl={['شر', 'فساد']} maxKashidaEm={0.7} />
      <Type text={s3.head} a={0} b={5} t={99} size={90} maxW={940} family={F.title} align="center" lh={1.45} />
      <Type text={s3.bullets[3].text} a={0} b={8} t={5} size={56} maxW={900} family={F.body} hlFamily={F.semi} hl={['اختلافات', 'شخړې']} />
      <Type text={TL.sections[0].bullets[0].text} a={0} b={8} t={99} size={56} maxW={900} family={F.body} hlFamily={F.semi} hl={['جعلي', 'انځور']} />
      <Type text={TL.q.text} a={0} b={8} t={99} size={70} maxW={900} family={F.medium} hlFamily={F.semi} hl={TL.q.hl} align="center" />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => <Still id="KTest" component={KTest} width={1080} height={1920} />;
