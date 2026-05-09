import { Composition } from "remotion";
import { Reel } from "./Reel";
import { DURATION, FPS, H, W } from "./tokens";

export const Root = () => {
  return (
    <Composition
      id="mru-reel"
      component={Reel}
      durationInFrames={DURATION}
      fps={FPS}
      width={W}
      height={H}
    />
  );
};
