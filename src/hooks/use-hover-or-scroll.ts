"use client"

import { useRef, useState } from "react"
import { useInView } from "motion/react"
import { useIsMobile } from "./use-mobile"

/**
 * Drives an "active" state for the wireframe animations.
 * Desktop: active while the pointer is over the element (click toggles it).
 * Phones, which have no hover: active while the element is scrolled into view.
 */
export function useHoverOrScroll<T extends HTMLElement = HTMLDivElement>(amount = 0.55) {
  const ref = useRef<T>(null)
  const mobile = useIsMobile()
  const inView = useInView(ref, { amount })
  const [hover, setHover] = useState(false)

  return {
    ref,
    mobile,
    active: mobile ? inView : hover,
    bind: mobile
      ? {}
      : {
          onMouseEnter: () => setHover(true),
          onMouseLeave: () => setHover(false),
        },
    toggle: () => !mobile && setHover((h) => !h),
  }
}
