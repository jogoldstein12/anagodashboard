"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { FileText } from "lucide-react";

interface MakoTrade {
  _id: string;
  tradeId: string;
  ts: number;
  strategy: string;
  eventId: string;
  legAPlatform: string;
  legASide: string;
  legAPrice: number;
  legAContracts: number;
  legBPlatform?: string;
  legBSide?: string;
  legBPrice?: number;
  legBContracts?: number;
  expectedProfitCents?: number;
  actualProfitCents?: number;
  status: string;
}

interface TradeHistoryProps {
  trades: MakoTrade[] | null | undefined;
}

const MODULE_BADGES: Record<string, { badge: string; color: string }> = {
  market_making: { badge: "A", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  cross_arb: { badge: "B", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  info_lag: { badge: "C", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  resolution_edge: { badge: "D", color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "neutral"> = {
  open: "warning",
  closed: "success",
  partial_fill_abort: "error",
  failed: "error",
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

function truncateId(id: string): string {
  if (id.startsWith("0x") && id.length > 14) {
    return `${id.slice(0, 8)}...${id.slice(-4)}`;
  }
  return id.length > 20 ? `${id.slice(0, 17)}...` : id;
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  if (!trades || trades.length === 0) {
    return (
      <GlassPanel className="p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Trade History</h2>
        <p className="text-sm text-white/50 mb-6">Recent dual-leg trades</p>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/[0.04] rounded-full mb-4">
            <FileText className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No trades yet</h3>
          <p className="text-sm text-white/50 max-w-sm mx-auto">
            Trades will appear here once Mako v2 starts executing.
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
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Module</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Event</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Legs</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Contracts</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Exp / Actual</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Status</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const mod = MODULE_BADGES[trade.strategy] ?? {
                badge: "?",
                color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
              };

              const legsSummary = trade.legBPrice
                ? `${(trade.legAPrice * 100).toFixed(0)}\u00a2 ${trade.legAPlatform} ${trade.legASide} + ${(trade.legBPrice * 100).toFixed(0)}\u00a2 ${trade.legBPlatform} ${trade.legBSide}`
                : `${(trade.legAPrice * 100).toFixed(0)}\u00a2 ${trade.legAPlatform} ${trade.legASide}`;

              const expCents = trade.expectedProfitCents ?? 0;
              const actCents = trade.actualProfitCents;
              const statusVariant = STATUS_VARIANT[trade.status] ?? "neutral";
              const statusLabel = trade.status === "partial_fill_abort" ? "Aborted" : trade.status;

              return (
                <tr key={trade._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3 px-2">
                    <span className="text-sm text-white/90">{formatTime(trade.ts)}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold border ${mod.color}`}
                    >
                      {mod.badge}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-white/70 font-mono">
                      {truncateId(trade.eventId)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs text-white/60">{legsSummary}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-white/70">{trade.legAContracts}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-xs text-white/50">
                      {expCents > 0 ? `${(expCents / 100).toFixed(2)}` : "--"}
                    </span>
                    <span className="text-white/20 mx-1">/</span>
                    {actCents != null ? (
                      <span
                        className={`text-sm font-medium ${actCents >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {actCents >= 0 ? "+" : ""}${(actCents / 100).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-white/30">--</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={statusVariant} size="sm">
                      {statusLabel}
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
