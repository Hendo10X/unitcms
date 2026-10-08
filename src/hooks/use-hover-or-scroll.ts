"use client"

import { useRef, useState } from "react"
import { useInView } from "motion/react"
import { useIsMobile } from "./use-mobile"

/**
 * Drives an "active" state for the wireframe animations.
 * Desktop: active while the pointer is over the element (click toggles it).
 * Phones, which have no hover: active while the element is scrolled into view.
 * `scrollOnly` uses the scroll trigger on every device (used by the hero phone).
 */
export function useHoverOrScroll<T extends HTMLElement = HTMLDivElement>(amount = 0.55, scrollOnly = false) {
  const ref = useRef<T>(null)
  const mobile = useIsMobile()
  const inView = useInView(ref, { amount })
  const [hover, setHover] = useState(false)
  const byScroll = mobile || scrollOnly

  return {
    ref,
    mobile,
    active: byScroll ? inView : hover,
    bind: byScroll
      ? {}
      : {
          onMouseEnter: () => setHover(true),
          onMouseLeave: () => setHover(false),
        },
    toggle: () => !byScroll && setHover((h) => !h),
  }
}
