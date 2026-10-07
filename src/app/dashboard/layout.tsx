import type { Metadata } from "next"
import { StoreProvider } from "@/lib/store"
import { DashboardShell } from "@/components/dashboard/shell"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = { title: "Dashboard · UnitCMS", robots: { index: false } }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <DashboardShell>{children}</DashboardShell>
      <Toaster theme="light" position="bottom-right" />
    </StoreProvider>
  )
}
