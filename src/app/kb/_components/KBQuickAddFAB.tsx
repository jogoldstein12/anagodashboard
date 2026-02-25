"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KBQuickAddFABProps {
  onClick: () => void;
}

export function KBQuickAddFAB({ onClick }: KBQuickAddFABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-40",
        "w-14 h-14 rounded-full",
        "bg-emerald-400/90 hover:bg-emerald-400",
        "text-black font-semibold",
        "shadow-lg shadow-emerald-400/20",
        "flex items-center justify-center",
        "transition-all duration-200 hover:scale-110",
        "backdrop-blur-xl"
      )}
      aria-label="Quick Add"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
