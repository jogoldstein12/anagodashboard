"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";

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
  regime?: string;
  executedAt: number;
}

interface TradeHistoryProps {
  trades: UniTrade[] | null | undefined;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  if (!trades || trades.length === 0) {
    return (
      <GlassPanel className="p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Trade History</h2>
        <p className="text-sm text-white/50 mb-6">Kalshi CPI prediction market trades</p>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/[0.04] rounded-full mb-4">
            <FileText className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No trades yet</h3>
          <p className="text-sm text-white/50 max-w-sm mx-auto">
            First trade planned for March 11, 2026. Trades will appear here once executed.
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
          <p className="text-sm text-white/50 mt-1">Last {trades.length} Kalshi trades</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Release Date</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Ticker</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Entry Type</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Entry Price</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Bet Size</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Outcome</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">P&L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const isWin = trade.outcome === "win";
              const isPending = trade.outcome === "pending";
              const isLoss = trade.outcome === "loss";

              return (
                <tr key={trade._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3 px-2">
                    <p className="text-sm text-white/90">{formatDate(trade.releaseDate)}</p>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm font-mono text-white/70">{trade.ticker}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-white/70">{trade.entryType}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-white/70">¢{trade.entryPrice.toFixed(1)}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-white/70">${trade.betSize.toFixed(2)}</span>
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
                    {trade.pnl !== undefined && trade.pnl !== null ? (
                      <span className={`text-sm font-medium ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm text-white/30">—</span>
                    )}
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
