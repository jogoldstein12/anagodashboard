"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { Signal, Calendar, TrendingUp, TrendingDown } from "lucide-react";

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

interface UniStatus {
  status: string;
  ticker?: string;
  releaseDate?: string;
  tradeDirection?: string;
  entryPrice?: number;
  betSize?: number;
  regime?: string;
  signalSummary?: string;
}

interface SignalCardProps {
  status: UniStatus | null | undefined;
  trades: UniTrade[] | null | undefined;
}

export function SignalCard({ status, trades }: SignalCardProps) {
  const openPositions = (trades ?? []).filter((t) => t.outcome === "pending");
  const hasActive = openPositions.length > 0;

  return (
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

            return (
              <div key={pos._id} className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.06]">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-center">
                  {/* Ticker */}
                  <div className="md:col-span-2">
                    <p className="text-white/40 text-xs mb-0.5">Ticker</p>
                    <p className="text-white font-mono text-sm font-medium">{pos.ticker}</p>
                  </div>

                  {/* Direction */}
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">Direction</p>
                    <p className={`font-semibold text-sm ${pos.entryType === "yes" || pos.entryType === "YES" ? "text-green-400" : "text-red-400"}`}>
                      {(pos.entryType || "YES").toUpperCase()}
                    </p>
                  </div>

                  {/* Entry Price */}
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">Entry</p>
                    <p className="text-white text-sm">¢{pos.entryPrice.toFixed(1)}</p>
                  </div>

                  {/* Live Mid */}
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">Current Mid</p>
                    {mid !== null ? (
                      <p className={`text-sm font-medium ${mid > pos.entryPrice ? "text-green-400" : mid < pos.entryPrice ? "text-red-400" : "text-white"}`}>
                        ¢{mid.toFixed(1)}
                      </p>
                    ) : (
                      <p className="text-white/30 text-sm">—</p>
                    )}
                  </div>

                  {/* Unrealized P&L */}
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
                      <p className="text-white/30 text-sm">—</p>
                    )}
                  </div>
                </div>

                {/* Secondary row */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
                  <span className="text-white/40 text-xs">{pos.contracts} contracts</span>
                  <span className="text-white/40 text-xs">Cost: ${pos.betSize.toFixed(2)}</span>
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
  );
}
