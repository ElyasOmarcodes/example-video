import React from 'react';
import {Composition, Still} from 'remotion';
import {Main} from './Main';
import {Thumb, ThumbWide} from './Thumb';
import {FPS, TL, W, H} from './lib';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.round(TL.duration * FPS)} fps={FPS} width={W} height={H} />
    <Still id="Thumb" component={Thumb} width={1080} height={1920} />
    <Still id="ThumbWide" component={ThumbWide} width={1280} height={720} />
  </>
);
