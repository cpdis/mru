import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { PAPER, SCENES } from "./tokens";
import { Hook } from "./scenes/Hook";
import { Times } from "./scenes/Times";
import { HeartRate } from "./scenes/HeartRate";
import { Zones } from "./scenes/Zones";
import { Ctl } from "./scenes/Ctl";
import { Headline } from "./scenes/Headline";
import { Cta } from "./scenes/Cta";

// Preload fonts so Remotion blocks the render until they're ready.
// (loadFont() returns a waitUntilDone() promise but Remotion's <Composition>
// auto-handles font loading via the staticFile mechanism if we just call
// these at module scope.)
loadFraunces();
loadGeist();
loadGeistMono();

export const Reel: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {/* Backing track for local preview / non‑Instagram destinations.
       * Scene boundaries are aligned to beats in this file, so the same
       * cuts will line up when "Dover" is added via Instagram's audio
       * picker on a silent upload. */}
      <Audio src={staticFile("01 Dover.m4a")} />

      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.durationInFrames}>
        <Hook />
      </Sequence>
      <Sequence from={SCENES.times.from} durationInFrames={SCENES.times.durationInFrames}>
        <Times />
      </Sequence>
      <Sequence from={SCENES.hr.from} durationInFrames={SCENES.hr.durationInFrames}>
        <HeartRate />
      </Sequence>
      <Sequence from={SCENES.zones.from} durationInFrames={SCENES.zones.durationInFrames}>
        <Zones />
      </Sequence>
      <Sequence from={SCENES.ctl.from} durationInFrames={SCENES.ctl.durationInFrames}>
        <Ctl />
      </Sequence>
      <Sequence from={SCENES.headline.from} durationInFrames={SCENES.headline.durationInFrames}>
        <Headline />
      </Sequence>
      <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.durationInFrames}>
        <Cta />
      </Sequence>
    </AbsoluteFill>
  );
};
