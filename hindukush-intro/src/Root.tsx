import { Composition } from "remotion";
import "@fontsource-variable/inter";
import { HindukushIntro } from "./HindukushIntro";
import tl from "../timeline.json";

export const Root: React.FC = () => (
  <Composition id="HindukushIntro" component={HindukushIntro} durationInFrames={Math.round(tl.duration * tl.fps)} fps={tl.fps} width={1080} height={1920} />
);
