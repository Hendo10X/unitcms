import type { Metadata } from "next";
import { Instrument_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SmoothScroll } from "@/components/smooth-scroll";
import { TooltipProvider } from "@/components/ui/tooltip";

const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

const description =
  "Ship app content without shipping an app update. Content, remote config, feature flags and caching in one mobile-first system.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "UnitCMS: the content and configuration backend for mobile apps", template: "%s" },
  description,
  openGraph: { title: "UnitCMS", description, type: "website", siteName: "UnitCMS" },
  twitter: { card: "summary", title: "UnitCMS", description },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("antialiased", instrument.variable, mono.variable)}>
      <body className="min-h-screen">
        <SmoothScroll>
          <TooltipProvider>{children}</TooltipProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
