"use client";

import { useState } from "react";
import { Sidebar, SidebarToggle } from "./Sidebar";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <SidebarToggle onClick={() => setSidebarOpen(true)} />
      <div className="relative z-10 flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-16 md:pt-6 w-full">
          {children}
        </main>
      </div>
    </>
  );
}
