import React from "react"
import { AbsoluteFill, Sequence } from "remotion"
import { Wipe } from "./ui"
import { Scene1 } from "./scenes/Scene1"
import { Scene2 } from "./scenes/Scene2"
import { Scene3 } from "./scenes/Scene3"
import { Scene4 } from "./scenes/Scene4"
import { Scene5 } from "./scenes/Scene5"
import { Scene6 } from "./scenes/Scene6"
import { Scene7 } from "./scenes/Scene7"
import { Scene8 } from "./scenes/Scene8"
import { Scene9 } from "./scenes/Scene9"

/** Scene lengths in frames at 30fps. They add up to 1650 frames, which is 55 seconds. */
const scenes = [
  { C: Scene1, len: 135 },
  { C: Scene2, len: 165 },
  { C: Scene3, len: 240 },
  { C: Scene4, len: 225 },
  { C: Scene5, len: 225 },
  { C: Scene6, len: 195 },
  { C: Scene7, len: 195 },
  { C: Scene8, len: 150 },
  { C: Scene9, len: 120 },
]

export const TOTAL_FRAMES = scenes.reduce((n, s) => n + s.len, 0)

export const Promo: React.FC = () => {
  let at = 0
  const cuts: number[] = []
  return (
    <AbsoluteFill>
      {scenes.map(({ C: Scene, len }, i) => {
        const from = at
        at += len
        if (i > 0) cuts.push(from)
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            <Scene />
          </Sequence>
        )
      })}
      {cuts.map((c) => (
        <Wipe key={c} at={c} />
      ))}
    </AbsoluteFill>
  )
}
