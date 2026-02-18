import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { CommandPalette } from "@/components/CommandPalette";
import { LayoutShell } from "@/components/LayoutShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mission Control — Anago",
  description: "Agent dashboard for Anago and sub-agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {/* Background */}
          <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/[0.06] rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/[0.06] rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-3xl animate-pulse [animation-delay:4s]" />
          </div>

          <CommandPalette />

          <LayoutShell>{children}</LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
