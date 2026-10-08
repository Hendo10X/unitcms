import React from "react"
import { Composition } from "remotion"
import { Promo, TOTAL_FRAMES } from "./Promo"
import { FPS, H, W } from "./theme"

export const Root: React.FC = () => (
  <Composition id="UnitCMSPromo" component={Promo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
)
