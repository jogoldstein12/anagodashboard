"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { Signal, Calendar, TrendingUp, TrendingDown, Zap, BarChart3 } from "lucide-react";

interface UniTrade {
  _id: string;
  tradeId: string;
  releaseDate: string;
  ticker: string;
  entryType: string;
  entryPrice: number;
  betSize: number;
  contracts: number;
  outcome: string;
  pnl?: number;
  currentMid?: number;
  unrealizedPnl?: number;
}

interface MacroSignals {
  wti?: number;
  gasoline?: number;
  breakeven5yr?: number;
  clevelandFedNowcast?: number;
  updatedAt?: number;
}

interface UniStatus {
  status: string;
  ticker?: string;
  releaseDate?: string;
  tradeDirection?: string;
  entryPrice?: number;
  betSize?: number;
  regime?: string;
  signalSummary?: string;
  nowcastCpiMom?: number;
  macroSignals?: MacroSignals;
  shockTriggerStatus?: string;
}

interface SignalCardProps {
  status: UniStatus | null | undefined;
  trades: UniTrade[] | null | undefined;
}

export function SignalCard({ status, trades }: SignalCardProps) {
  const openPositions = (trades ?? []).filter((t) => t.outcome === "pending");
  const hasActive = openPositions.length > 0;
  const macro = status?.macroSignals;

  return (
    <div className="space-y-6">
      {/* Active Positions */}
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Signal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">
              {hasActive ? `Active Positions (${openPositions.length})` : "Next Trade"}
            </h2>
          </div>
          {hasActive && <Badge variant="success" size="sm">Live</Badge>}
        </div>

        {hasActive ? (
          <div className="space-y-3">
            {openPositions.map((pos) => {
              const unrealized = pos.unrealizedPnl ?? null;
              const mid = pos.currentMid ?? null;
              const isUp = unrealized !== null && unrealized >= 0;
              const maxPayout = pos.contracts;

              return (
                <div key={pos._id} className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.06]">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-center">
                    <div className="md:col-span-2">
                      <p className="text-white/40 text-xs mb-0.5">Ticker</p>
                      <p className="text-white font-mono text-sm font-medium">{pos.ticker}</p>
                    </div>

                    <div>
                      <p className="text-white/40 text-xs mb-0.5">Direction</p>
                      <p className={`font-semibold text-sm ${pos.entryType === "yes" || pos.entryType === "YES" ? "text-green-400" : "text-red-400"}`}>
                        {(pos.entryType || "YES").toUpperCase()}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/40 text-xs mb-0.5">Entry</p>
                      <p className="text-white text-sm">{pos.entryPrice.toFixed(1)}{"\u00A2"}</p>
                    </div>

                    <div>
                      <p className="text-white/40 text-xs mb-0.5">Current Mid</p>
                      {mid !== null ? (
                        <p className={`text-sm font-medium ${mid > pos.entryPrice ? "text-green-400" : mid < pos.entryPrice ? "text-red-400" : "text-white"}`}>
                          {mid.toFixed(1)}{"\u00A2"}
                        </p>
                      ) : (
                        <p className="text-white/30 text-sm">{"\u2014"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-white/40 text-xs mb-0.5">Unrealized P&L</p>
                      {unrealized !== null ? (
                        <div className="flex items-center gap-1">
                          {isUp
                            ? <TrendingUp className="w-3 h-3 text-green-400" />
                            : <TrendingDown className="w-3 h-3 text-red-400" />}
                          <p className={`text-sm font-semibold ${isUp ? "text-green-400" : "text-red-400"}`}>
                            {isUp ? "+" : ""}{unrealized.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-white/30 text-sm">{"\u2014"}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
                    <span className="text-white/40 text-xs">{pos.contracts} contracts</span>
                    <span className="text-white/40 text-xs">Cost: ${pos.betSize.toFixed(2)}</span>
                    <span className="text-white/40 text-xs">Max payout: ${maxPayout}</span>
                    {pos.releaseDate && (
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Resolves {pos.releaseDate}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/[0.04] rounded-full mb-4">
              <Calendar className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Active Positions</h3>
            <p className="text-sm text-white/50 max-w-sm mx-auto">
              {status?.releaseDate
                ? `Next review scheduled for ${status.releaseDate}.`
                : "Uni is monitoring market conditions. Next trade opportunity will appear here."}
            </p>
            {status?.regime && (
              <div className="mt-4">
                <Badge variant={status.regime === "HOT" ? "error" : status.regime === "FLAT" ? "warning" : "info"} size="md">
                  Current Regime: {status.regime}
                </Badge>
              </div>
            )}
          </div>
        )}
      </GlassPanel>

      {/* Nowcast vs Thresholds + Shock Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Nowcast vs Thresholds</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
              <span className="text-sm text-white/60">Cleveland Fed CPI MoM</span>
              <span className="text-sm font-semibold text-cyan-400">
                {status?.nowcastCpiMom != null ? `${status.nowcastCpiMom.toFixed(3)}%` : "\u2014"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
              <span className="text-sm text-white/60">T0.9 threshold</span>
              <span className={`text-sm font-semibold ${(status?.nowcastCpiMom ?? 0) > 0.9 ? "text-green-400" : "text-red-400"}`}>
                0.900% {(status?.nowcastCpiMom ?? 0) > 0.9 ? "ABOVE" : "BELOW"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
              <span className="text-sm text-white/60">T1.0 threshold</span>
              <span className={`text-sm font-semibold ${(status?.nowcastCpiMom ?? 0) > 1.0 ? "text-green-400" : "text-red-400"}`}>
                1.000% {(status?.nowcastCpiMom ?? 0) > 1.0 ? "ABOVE" : "BELOW"}
              </span>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Shock Trigger</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
              <span className="text-sm text-white/60">Status</span>
              <span className="text-sm font-semibold text-green-400">
                {status?.shockTriggerStatus || "Daily shock check active"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
              <span className="text-sm text-white/60">Next run</span>
              <span className="text-sm font-medium text-white">10:30 AM ET</span>
            </div>
            {status?.regime && (
              <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                <span className="text-sm text-white/60">Regime</span>
                <Badge variant={status.regime === "HOT" ? "error" : status.regime === "FLAT" ? "warning" : "info"} size="sm">
                  {status.regime}
                </Badge>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Macro Signals */}
      {macro && (
        <GlassPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Macro Signals</h2>
            {macro.updatedAt && (
              <span className="text-xs text-white/30 ml-auto">
                Updated {new Date(macro.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-white/[0.03] rounded-lg">
              <p className="text-xs text-white/40 mb-1">WTI Crude</p>
              <p className="text-lg font-semibold text-white">
                {macro.wti != null ? `$${macro.wti.toFixed(2)}` : "\u2014"}
              </p>
            </div>
            <div className="p-3 bg-white/[0.03] rounded-lg">
              <p className="text-xs text-white/40 mb-1">Gasoline</p>
              <p className="text-lg font-semibold text-white">
                {macro.gasoline != null ? `$${macro.gasoline.toFixed(2)}` : "\u2014"}
              </p>
            </div>
            <div className="p-3 bg-white/[0.03] rounded-lg">
              <p className="text-xs text-white/40 mb-1">Breakeven 5yr</p>
              <p className="text-lg font-semibold text-white">
                {macro.breakeven5yr != null ? `${macro.breakeven5yr.toFixed(2)}%` : "\u2014"}
              </p>
            </div>
            <div className="p-3 bg-white/[0.03] rounded-lg">
              <p className="text-xs text-white/40 mb-1">Cleveland Fed Nowcast</p>
              <p className="text-lg font-semibold text-cyan-400">
                {macro.clevelandFedNowcast != null ? `${macro.clevelandFedNowcast.toFixed(3)}%` : "\u2014"}
              </p>
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
