import { cn } from "@/lib/utils"

/** Kept as a simple wrapper. Sections have no entrance animation. */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string; delay?: number; y?: number }) {
  return <div className={cn(className)}>{children}</div>
}
