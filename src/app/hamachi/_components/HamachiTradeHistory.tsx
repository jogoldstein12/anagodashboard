"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { FileText } from "lucide-react";

interface HamachiTrade {
  _id: string;
  tradeId: string;
  ts: number;
  city: string;
  ticker: string;
  strike: number;
  direction: string;
  entryPrice: number;
  exitPrice?: number;
  modelProb: number;
  outcome?: string;
  pnlNet?: number;
  live: boolean;
  contractDate: string;
}

interface HamachiTradeHistoryProps {
  trades: HamachiTrade[] | null | undefined;
}

const OUTCOME_VARIANT: Record<string, "success" | "warning" | "error" | "neutral"> = {
  win: "success",
  loss: "error",
  pending: "warning",
};

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function HamachiTradeHistory({ trades }: HamachiTradeHistoryProps) {
  if (!trades || trades.length === 0) {
    return (
      <GlassPanel className="p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Trade History</h2>
        <p className="text-sm text-white/50 mb-6">Recent weather trades</p>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/[0.04] rounded-full mb-4">
            <FileText className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No trades yet</h3>
          <p className="text-sm text-white/50 max-w-sm mx-auto">
            Trades will appear here once Hamachi starts executing.
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
          <p className="text-sm text-white/50 mt-1">Last {trades.length} trades</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Time</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">City</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Date</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Direction</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Strike</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Entry</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Model Prob</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">P&L</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const outcomeLabel = trade.outcome || "pending";
              const variant = OUTCOME_VARIANT[outcomeLabel] ?? "neutral";

              return (
                <tr key={trade._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3 px-2">
                    <span className="text-sm text-white/90">{formatTime(trade.ts)}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-white/80">{trade.city}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-white/60 font-mono">{trade.contractDate}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`text-sm font-medium ${trade.direction === "YES" ? "text-green-400" : "text-red-400"}`}>
                      {trade.direction}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-white/70">{trade.strike}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-white/70">{(trade.entryPrice * 100).toFixed(0)}\u00a2</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-white/60">{(trade.modelProb * 100).toFixed(1)}%</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    {trade.pnlNet != null ? (
                      <span className={`text-sm font-medium ${trade.pnlNet >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {trade.pnlNet >= 0 ? "+" : ""}${trade.pnlNet.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-white/30">--</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={variant} size="sm">
                      {outcomeLabel}
                    </Badge>
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
