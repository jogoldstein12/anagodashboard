"use client";

import { GlassPanel } from "@/components/GlassPanel";

interface HamachiStatusBarProps {
  status: {
    status: string;
    bankroll: number;
    deployed: number;
    dailyLossHalted: boolean;
    lastSyncAt: number;
  } | null | undefined;
}

export function HamachiStatusBar({ status }: HamachiStatusBarProps) {
  const s = status;

  const statusConfig = {
    live: { emoji: "\u{1F7E2}", label: "SCANNING", color: "text-green-400" },
    halted: { emoji: "\u{1F7E1}", label: "HALTED", color: "text-amber-400" },
    stopped: { emoji: "\u{1F534}", label: "STOPPED", color: "text-red-400" },
  } as const;

  const cfg = statusConfig[(s?.status as keyof typeof statusConfig)] ?? statusConfig.stopped;

  const syncAgo = s?.lastSyncAt
    ? formatRelative(s.lastSyncAt)
    : "never";

  const isStale = s?.lastSyncAt
    ? Date.now() - s.lastSyncAt > 30 * 60 * 1000
    : true;

  return (
    <div className="space-y-2">
      {s?.dailyLossHalted && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <span className="text-amber-400 text-sm font-semibold">DAILY LOSS HALT</span>
          <span className="text-amber-400/70 text-xs">
            Trading paused due to daily loss limit
          </span>
        </div>
      )}

      <GlassPanel className="px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-lg">{cfg.emoji}</span>
          <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
          <span className={`text-xs ${isStale ? "text-amber-400/70" : "text-white/30"}`}>
            synced {syncAgo}
            {isStale && " (stale)"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white/40">Bankroll</span>
            <span className={`text-white font-medium ${isStale ? "opacity-50" : ""}`}>
              ${(s?.bankroll ?? 0).toFixed(2)}
            </span>
          </div>
          <span className="text-white/20 hidden md:inline">|</span>
          <div className="flex items-center gap-2">
            <span className="text-white/40">Deployed</span>
            <span className={`text-white font-medium ${isStale ? "opacity-50" : ""}`}>
              ${(s?.deployed ?? 0).toFixed(2)}
            </span>
          </div>
          <span className="text-white/20 hidden md:inline">|</span>
          <div className="flex items-center gap-2">
            <span className="text-white/40">Available</span>
            <span className={`text-white font-medium ${isStale ? "opacity-50" : ""}`}>
              ${((s?.bankroll ?? 0) - (s?.deployed ?? 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
