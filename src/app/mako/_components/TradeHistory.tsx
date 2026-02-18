"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { ArrowUp, ArrowDown, CheckCircle, XCircle, Clock, FileText } from "lucide-react";

interface MakoTrade {
  _id: string;
  tradeId: string;
  timestamp: number;
  windowStart: number;
  slug: string;
  direction: string;
  confidence: number;
  score: number;
  windowDelta: number;
  tokenPrice: number;
  outcome: string;
  pnl: number;
  bankrollAfter: number;
  dryRun: boolean;
}

interface TradeHistoryProps {
  trades: MakoTrade[] | null | undefined;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  const days = Math.floor(diff / 86400000);

  if (days === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  if (!trades || trades.length === 0) {
    return (
      <GlassPanel className="p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Trade History</h2>
        <p className="text-sm text-white/50 mb-6">Recent scalp trades</p>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/[0.04] rounded-full mb-4">
            <FileText className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No trades yet</h3>
          <p className="text-sm text-white/50 max-w-sm mx-auto">
            Trades will appear here once the Mako scalper starts executing.
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Trade History</h2>
          <p className="text-sm text-white/50 mt-1">Last {trades.length} scalp trades</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Time</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Slug</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Direction</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Confidence</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Delta</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Price</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Outcome</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">P&L</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Bankroll</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const isUp = trade.direction === "up";
              const isWin = trade.outcome === "win";
              const isPending = trade.outcome === "pending";

              return (
                <tr key={trade._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3 px-2">
                    <p className="text-sm text-white/90">{formatTime(trade.timestamp)}</p>
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-sm text-white/90 max-w-[140px] truncate" title={trade.slug}>
                      {trade.slug}
                    </p>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1.5">
                      {isUp ? (
                        <ArrowUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-sm font-medium ${isUp ? "text-green-400" : "text-red-400"}`}>
                        {trade.direction.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${Math.min(trade.confidence * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/50">
                        {(trade.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className={`text-sm ${trade.windowDelta >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {trade.windowDelta >= 0 ? "+" : ""}{(trade.windowDelta * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-white/70">
                      ${trade.tokenPrice.toFixed(4)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {isPending ? (
                      <Badge variant="warning" size="sm">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    ) : isWin ? (
                      <Badge variant="success" size="sm">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Win
                      </Badge>
                    ) : (
                      <Badge variant="error" size="sm">
                        <XCircle className="w-3 h-3 mr-1" />
                        Loss
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className={`text-sm font-medium ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-white/70">
                      ${trade.bankrollAfter.toFixed(2)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
