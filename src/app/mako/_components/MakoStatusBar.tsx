"use client";

import { GlassPanel } from "@/components/GlassPanel";

interface MakoStatusBarProps {
  status: {
    status: string;
    polyBalance: number;
    kalshiBalance: number;
    drawdownPct: number;
    lastSyncAt: number;
  } | null | undefined;
}

export function MakoStatusBar({ status }: MakoStatusBarProps) {
  const s = status;

  const statusConfig = {
    live: { emoji: "\u{1F7E2}", label: "LIVE", color: "text-green-400" },
    dry_run: { emoji: "\u{1F7E1}", label: "DRY-RUN", color: "text-amber-400" },
    stopped: { emoji: "\u{1F534}", label: "STOPPED", color: "text-red-400" },
  } as const;

  const cfg = statusConfig[(s?.status as keyof typeof statusConfig)] ?? statusConfig.stopped;

  const drawdownColor =
    (s?.drawdownPct ?? 0) > 5
      ? "text-red-400"
      : (s?.drawdownPct ?? 0) > 2
        ? "text-amber-400"
        : "text-green-400";

  const syncAgo = s?.lastSyncAt
    ? formatRelative(s.lastSyncAt)
    : "never";

  return (
    <GlassPanel className="px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-lg">{cfg.emoji}</span>
        <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
        <span className="text-xs text-white/30">synced {syncAgo}</span>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-white/40">Poly</span>
          <span className="text-white font-medium">${(s?.polyBalance ?? 0).toFixed(2)}</span>
        </div>
        <span className="text-white/20">|</span>
        <div className="flex items-center gap-2">
          <span className="text-white/40">Kalshi</span>
          <span className="text-white font-medium">${(s?.kalshiBalance ?? 0).toFixed(2)}</span>
        </div>
        <span className="text-white/20">|</span>
        <div className="flex items-center gap-2">
          <span className="text-white/40">Combined</span>
          <span className="text-white font-medium">
            ${((s?.polyBalance ?? 0) + (s?.kalshiBalance ?? 0)).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-white/40 text-sm">Drawdown</span>
        <span className={`font-semibold text-sm ${drawdownColor}`}>
          {(s?.drawdownPct ?? 0).toFixed(1)}%
        </span>
      </div>
    </GlassPanel>
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
