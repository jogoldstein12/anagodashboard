"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <>
      {/* Mobile hamburger - rendered at top level, outside all containers */}
      {!sidebarOpen && (
        <button
          onClick={openSidebar}
          className="md:hidden fixed top-4 left-4 z-[100] p-2.5 rounded-xl bg-slate-800/90 backdrop-blur-md border border-white/20 text-white hover:bg-slate-700/90 active:bg-slate-600/90 transition-all shadow-lg"
          aria-label="Open menu"
          type="button"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <div className="relative z-10 flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-16 md:pt-6 w-full">
          {children}
        </main>
      </div>
    </>
  );
}
