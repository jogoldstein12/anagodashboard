"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { GlassPanel } from "@/components/GlassPanel";
import { KBSearchTab } from "./KBSearchTab";
import { KBGapsTab } from "./KBGapsTab";
import { KBWatchlistTab } from "./KBWatchlistTab";
import { KBStatsTab } from "./KBStatsTab";
import { KBCompIntelTab } from "./KBCompIntelTab";
import { KBEconTab } from "./KBEconTab";
import { KBQuickAddTab } from "./KBQuickAddTab";
import { KBQuickAddFAB } from "./KBQuickAddFAB";
import { cn } from "@/lib/utils";

type TabId = "search" | "gaps" | "watchlists" | "stats" | "compintel" | "economic" | "quickadd";

const TABS: { id: TabId; label: string }[] = [
  { id: "search", label: "Search" },
  { id: "gaps", label: "Gaps" },
  { id: "watchlists", label: "Watchlists" },
  { id: "stats", label: "Stats" },
  { id: "compintel", label: "Competitive Intel" },
  { id: "economic", label: "Economic" },
  { id: "quickadd", label: "Quick Add" },
];

export function KBDashboardClient() {
  const [activeTab, setActiveTab] = useState<TabId>("search");
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const snapshot = useQuery(api.kb.getLatestSnapshot);

  const renderTabContent = () => {
    switch (activeTab) {
      case "search":
        return <KBSearchTab snapshot={snapshot} />;
      case "gaps":
        return <KBGapsTab snapshot={snapshot} />;
      case "watchlists":
        return <KBWatchlistTab snapshot={snapshot} />;
      case "stats":
        return <KBStatsTab snapshot={snapshot} />;
      case "compintel":
        return <KBCompIntelTab snapshot={snapshot} onSelectCompetitor={(name) => {
          setActiveTab("search");
        }} />;
      case "economic":
        return <KBEconTab snapshot={snapshot} onSelectIndicator={(indicator, date) => {
          setActiveTab("search");
        }} />;
      case "quickadd":
        return <KBQuickAddTab />;
      default:
        return null;
    }
  };

  if (snapshot === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span>📚</span> Knowledge Base
          </h1>
          <p className="text-white/50 mt-1">Research intelligence and knowledge management</p>
        </div>
        {/* Tab bar skeleton */}
        <div className="flex gap-1 border-b border-white/[0.12] pb-1">
          {TABS.map((_, i) => (
            <div key={i} className="px-4 py-2">
              <div className="h-4 bg-white/10 rounded w-16 animate-pulse" />
            </div>
          ))}
        </div>
        <GlassPanel className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white/10 rounded" />
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span>📚</span> Knowledge Base
        </h1>
        <p className="text-white/50 mt-1">Research intelligence and knowledge management</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-white/[0.12] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-[1px]",
              activeTab === tab.id
                ? "text-white border-emerald-400"
                : "text-white/50 border-transparent hover:text-white/80 hover:border-white/20"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Quick Add FAB */}
      <KBQuickAddFAB onClick={() => setShowQuickAddModal(true)} />

      {/* Quick Add Modal */}
      {showQuickAddModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowQuickAddModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl">
            <KBQuickAddTab 
              isModal 
              onClose={() => setShowQuickAddModal(false)} 
              onSuccess={() => setShowQuickAddModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
