import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans"
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono"

export const sans = loadSans("normal", { weights: ["400", "500", "600"], subsets: ["latin"] }).fontFamily
export const mono = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily

/** The app's plain palette. */
export const C = {
  bg: "#fafafa",
  card: "#ffffff",
  fg: "#101010",
  muted: "#8b8b86",
  blue: "#1a56ff",
  blueSoft: "#eef2ff",
  blueMid: "#9db6ff",
  blueDark: "#0f3fd1",
  dot: "#cfcfca",
  track: "#d6d6d1",
  green: "#0f9d6b",
}

export const W = 1920
export const H = 1080
export const FPS = 30
