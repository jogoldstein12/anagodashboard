"use client";

import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/GlassPanel";
import { Tab } from "@/lib/types";

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <GlassPanel className={cn("p-1", className)}>
      <div className="flex space-x-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              activeTab === tab.value
                ? "bg-white/[0.12] text-white"
                : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </GlassPanel>
  );
}