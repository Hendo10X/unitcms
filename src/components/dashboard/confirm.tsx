"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Options = {
  title: string
  description?: string
  confirmLabel?: string
  /** Styles the confirm button as a destructive action. */
  destructive?: boolean
}

type Confirm = (options: Options) => Promise<boolean>

const ConfirmCtx = createContext<Confirm | null>(null)

/** `const confirm = useConfirm()` then `if (await confirm({ title: "Delete…" })) …` */
export function useConfirm() {
  const c = useContext(ConfirmCtx)
  if (!c) throw new Error("useConfirm must be used inside ConfirmProvider")
  return c
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<Options | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<Confirm>(
    (o) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve
        setOptions(o)
      }),
    [],
  )

  const close = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Dialog open={!!options} onOpenChange={(open) => !open && close(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[24px] tracking-[-0.04em]">{options?.title}</DialogTitle>
            {options?.description && <DialogDescription className="text-[14px] leading-relaxed">{options.description}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="bg-secondary" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button
              variant={options?.destructive ? "destructive" : "default"}
              className={options?.destructive ? "bg-destructive text-white hover:bg-destructive/90" : ""}
              onClick={() => close(true)}
              autoFocus
            >
              {options?.confirmLabel ?? "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmCtx.Provider>
  )
}
