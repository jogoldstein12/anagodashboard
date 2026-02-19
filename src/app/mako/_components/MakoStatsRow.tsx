"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Activity, DollarSign, TrendingUp, Target } from "lucide-react";

interface MakoStatus {
  status: string;
  mode: string;
  bankroll: number;
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  wins: number;
  losses: number;
  walletUsdc: number;
  lastTradeAt: number;
  lastSyncAt: number;
}

interface MakoStatsRowProps {
  status: MakoStatus | null | undefined;
}

export function MakoStatsRow({ status }: MakoStatsRowProps) {
  const s = status;

  const statusColor = s?.status === "active"
    ? "bg-green-500"
    : s?.status === "idle"
      ? "bg-amber-500"
      : "bg-red-500";

  const statusLabel = s?.status === "active"
    ? (s?.mode === "live" ? "Live" : "Dry-Run")
    : s?.status === "idle"
      ? "Idle"
      : "Offline";

  const statusTextColor = s?.status === "active"
    ? "text-green-400"
    : s?.status === "idle"
      ? "text-amber-400"
      : "text-red-400";

  const pnlPositive = (s?.totalPnl ?? 0) >= 0;
  const initialBankroll = 100; // Starting capital
  const totalReturn = initialBankroll > 0 ? ((s?.totalPnl ?? 0) / initialBankroll) * 100 : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Status */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/50">Status</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor} animate-pulse`} />
          <span className={`text-xl font-semibold ${statusTextColor}`}>
            {statusLabel}
          </span>
        </div>
        {s?.lastSyncAt && (
          <p className="text-xs text-white/30 mt-1">
            Synced {new Date(s.lastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </GlassPanel>

      {/* Bankroll */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/50">Bankroll</span>
        </div>
        <p className="text-xl font-semibold text-white">
          ${(s?.bankroll ?? 0).toFixed(2)}
        </p>
        {(s?.walletUsdc ?? 0) > 0 && (
          <p className="text-xs text-white/30 mt-1">
            Wallet: ${s!.walletUsdc.toFixed(2)} USDC
          </p>
        )}
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
          {s?.totalTrades ?? 0} trades · <span className={pnlPositive ? "text-green-400/60" : "text-red-400/60"}>{pnlPositive ? "+" : ""}{totalReturn.toFixed(1)}% return</span>
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
          {s?.wins ?? 0}W / {s?.losses ?? 0}L
        </p>
      </GlassPanel>
    </div>
  );
}
