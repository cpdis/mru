import { Composition } from "remotion";
import { Reel } from "./Reel";
import { DURATION, FPS } from "./tokens";

export const Root = () => {
  return (
    <>
      <Composition
        id="mru-reel"
        component={Reel}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="mru-reel-wide"
        component={Reel}
        durationInFrames={DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
