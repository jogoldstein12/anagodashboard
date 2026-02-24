"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Activity, DollarSign, TrendingUp, Target } from "lucide-react";

interface UniStatus {
  status: string;
  ticker?: string;
  releaseDate?: string;
  tradeDirection?: string;
  entryPrice?: number;
  betSize?: number;
  multiplier?: number;
  kalshiBalance: number;
  winRate: number;
  totalTrades: number;
  totalPnl: number;
  regime?: string;
  signalSummary?: string;
  lastUpdated: number;
}

interface UniStatsRowProps {
  status: UniStatus | null | undefined;
}

export function UniStatsRow({ status }: UniStatsRowProps) {
  const s = status;

  const statusColor = s?.status === "active"
    ? "bg-green-500"
    : s?.status === "pending"
      ? "bg-amber-500"
      : "bg-gray-500";

  const statusLabel = s?.status === "active"
    ? "Active"
    : s?.status === "pending"
      ? "Pending"
      : "Idle";

  const statusTextColor = s?.status === "active"
    ? "text-green-400"
    : s?.status === "pending"
      ? "text-amber-400"
      : "text-gray-400";

  const pnlPositive = (s?.totalPnl ?? 0) >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Status */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/50">Status</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor} ${s?.status === "active" ? "animate-pulse" : ""}`} />
          <span className={`text-xl font-semibold ${statusTextColor}`}>
            {statusLabel}
          </span>
        </div>
        {s?.lastUpdated && (
          <p className="text-xs text-white/30 mt-1">
            Synced {new Date(s.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </GlassPanel>

      {/* Kalshi Balance */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/50">Kalshi Balance</span>
        </div>
        <p className="text-xl font-semibold text-white">
          ${(s?.kalshiBalance ?? 0).toFixed(2)}
        </p>
        <p className="text-xs text-white/30 mt-1">
          Trading capital
        </p>
      </GlassPanel>

      {/* Win Rate */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/50">Win Rate</span>
        </div>
        <p className="text-xl font-semibold text-white">
          {(s?.winRate ?? 0).toFixed(1)}%
        </p>
        <p className="text-xs text-white/30 mt-1">
          {s?.totalTrades ?? 0} total trades
        </p>
      </GlassPanel>

      {/* Total PnL */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/50">Total P&L</span>
        </div>
        <p className={`text-xl font-semibold ${pnlPositive ? "text-green-400" : "text-red-400"}`}>
          {pnlPositive ? "+" : ""}${(s?.totalPnl ?? 0).toFixed(2)}
        </p>
        <p className="text-xs text-white/30 mt-1">
          {pnlPositive ? "📈" : "📉"} Lifetime
        </p>
      </GlassPanel>
    </div>
  );
}
