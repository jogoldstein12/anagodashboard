"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Activity, DollarSign, TrendingUp, Target, Calendar, BarChart3 } from "lucide-react";

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
  openPositionCount?: number;
  totalDeployed?: number;
  nextResolution?: string;
  nowcastCpiMom?: number;
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
    ? "LIVE"
    : s?.status === "pending"
      ? "Pending"
      : "Idle";

  const statusTextColor = s?.status === "active"
    ? "text-green-400"
    : s?.status === "pending"
      ? "text-amber-400"
      : "text-gray-400";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
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
        <p className="text-xs text-white/30 mt-1">Trading capital</p>
      </GlassPanel>

      {/* Open Positions */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/50">Open Positions</span>
        </div>
        <p className="text-xl font-semibold text-white">
          {s?.openPositionCount ?? 0}
        </p>
        <p className="text-xs text-white/30 mt-1">
          ${(s?.totalDeployed ?? 0).toFixed(2)} deployed
        </p>
      </GlassPanel>

      {/* Next Resolution */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/50">Next Resolution</span>
        </div>
        <p className="text-xl font-semibold text-white">
          {s?.nextResolution ?? "—"}
        </p>
        <p className="text-xs text-white/30 mt-1">CPI release date</p>
      </GlassPanel>

      {/* Nowcast CPI MoM */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/50">Nowcast CPI MoM</span>
        </div>
        <p className="text-xl font-semibold text-cyan-400">
          {s?.nowcastCpiMom != null ? `${s.nowcastCpiMom.toFixed(3)}%` : "—"}
        </p>
        <p className="text-xs text-white/30 mt-1">Cleveland Fed</p>
      </GlassPanel>

      {/* Total PnL */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/50">Total P&L</span>
        </div>
        <p className={`text-xl font-semibold ${(s?.totalPnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
          {(s?.totalPnl ?? 0) >= 0 ? "+" : ""}${(s?.totalPnl ?? 0).toFixed(2)}
        </p>
        <p className="text-xs text-white/30 mt-1">
          {s?.totalTrades ?? 0} trades | {(s?.winRate ?? 0).toFixed(0)}% win rate
        </p>
      </GlassPanel>
    </div>
  );
}
