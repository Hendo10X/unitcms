"use client"

import { useEffect, useState } from "react"
import { timeAgo } from "@/lib/types"

/** "42m ago". Filled in after load, because it depends on the current time. */
export function Ago({ iso }: { iso: string }) {
  const [text, setText] = useState("")
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(timeAgo(iso))
  }, [iso])
  return <>{text}</>
}
