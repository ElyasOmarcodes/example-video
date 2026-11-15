import React from 'react';
import {Composition, Still} from 'remotion';
import {Main} from './Main';
import {Thumb} from './Thumb';
import tl from '../timeline.json';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.ceil(tl.total * 30)} fps={30} width={1080} height={1920} />
    <Still id="Thumb" component={Thumb} width={1080} height={1920} />
  </>
);
