import type { Metadata } from "next"
import { StoreProvider } from "@/lib/store"
import { ConfirmProvider } from "@/components/dashboard/confirm"
import { DashboardShell } from "@/components/dashboard/shell"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = { title: "Dashboard · UnitCMS", robots: { index: false } }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ConfirmProvider>
        <DashboardShell>{children}</DashboardShell>
      </ConfirmProvider>
      <Toaster theme="light" position="bottom-right" />
    </StoreProvider>
  )
}
