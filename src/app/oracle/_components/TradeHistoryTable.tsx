"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { ArrowUpRight, ArrowDownRight, Clock, DollarSign, CheckCircle, XCircle, FileText } from "lucide-react";

interface Trade {
  _id: string;
  tradeId: string;
  marketId: string;
  marketQuestion: string;
  outcome: string;
  side: string;
  price: number;
  quantity: number;
  amountUsd: number;
  strategy: string;
  pnl: number;
  closed: boolean;
  timestamp: number;
  closedAt?: number;
  stopLossPrice?: number;
  notes?: string;
}

interface TradeHistoryTableProps {
  trades: Trade[] | null | undefined;
}

export function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getDuration = (timestamp: number, closedAt?: number) => {
    if (!closedAt) return "—";
    const durationMs = closedAt - timestamp;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy.toLowerCase()) {
      case "resolution sniping": return "bg-purple-500/20 text-purple-400";
      case "whale copy-trading": return "bg-blue-500/20 text-blue-400";
      case "news-driven": return "bg-green-500/20 text-green-400";
      case "neg-risk arbitrage": return "bg-amber-500/20 text-amber-400";
      case "market making": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  if (!trades || trades.length === 0) {
    return (
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Trade History</h2>
            <p className="text-sm text-white/50 mt-1">Closed trades and performance</p>
          </div>
          <Badge variant="neutral" size="sm">0 trades</Badge>
        </div>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/[0.04] rounded-full mb-4">
            <FileText className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No trade history</h3>
          <p className="text-sm text-white/50 max-w-sm mx-auto">
            Oracle hasn't closed any trades yet. Trade history will appear here when positions are closed.
          </p>
        </div>
      </GlassPanel>
    );
  }

  const closedTrades = trades.filter(trade => trade.closed);
  const winningTrades = closedTrades.filter(trade => trade.pnl > 0);
  const totalPnl = closedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Trade History</h2>
          <p className="text-sm text-white/50 mt-1">Closed trades and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={totalPnl >= 0 ? "success" : "error"} size="sm">
            ${totalPnl.toFixed(2)} total P&L
          </Badge>
          <Badge variant="neutral" size="sm">{closedTrades.length} trades</Badge>
          <Badge variant={winRate >= 50 ? "success" : "warning"} size="sm">
            {winRate.toFixed(1)}% win rate
          </Badge>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white/[0.04] rounded-lg p-3">
          <p className="text-xs text-white/50 mb-1">Total Trades</p>
          <p className="text-lg font-semibold text-white">{closedTrades.length}</p>
        </div>
        <div className="bg-white/[0.04] rounded-lg p-3">
          <p className="text-xs text-white/50 mb-1">Winning Trades</p>
          <p className="text-lg font-semibold text-green-400">{winningTrades.length}</p>
        </div>
        <div className="bg-white/[0.04] rounded-lg p-3">
          <p className="text-xs text-white/50 mb-1">Losing Trades</p>
          <p className="text-lg font-semibold text-red-400">{closedTrades.length - winningTrades.length}</p>
        </div>
        <div className="bg-white/[0.04] rounded-lg p-3">
          <p className="text-xs text-white/50 mb-1">Avg. P&L per Trade</p>
          <p className={`text-lg font-semibold ${totalPnl / closedTrades.length >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${(closedTrades.length > 0 ? totalPnl / closedTrades.length : 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Trades Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Date</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Market</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Side</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Amount</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">P&L</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Strategy</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Duration</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Result</th>
            </tr>
          </thead>
          <tbody>
            {closedTrades.slice(0, 20).map((trade) => {
              const isWin = trade.pnl > 0;
              const pnlPercent = (trade.pnl / trade.amountUsd) * 100;
              
              return (
                <tr key={trade._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3 px-2">
                    <p className="text-sm text-white/90">{formatDate(trade.timestamp)}</p>
                    {trade.closedAt && (
                      <p className="text-xs text-white/30">{formatDate(trade.closedAt)}</p>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <div className="max-w-[180px]">
                      <p className="text-sm text-white/90 truncate" title={trade.marketQuestion}>
                        {trade.marketQuestion}
                      </p>
                      <p className="text-xs text-white/30">{trade.outcome}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={trade.side === "BUY" ? "success" : "error"} size="sm">
                      {trade.side}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-sm text-white/90">${trade.amountUsd.toFixed(2)}</p>
                    <p className="text-xs text-white/30">@{trade.price.toFixed(2)}</p>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {isWin ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                          ${trade.pnl.toFixed(2)}
                        </p>
                        <p className={`text-xs ${isWin ? 'text-green-400/70' : 'text-red-400/70'}`}>
                          {pnlPercent.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStrategyColor(trade.strategy)}`}>
                      {trade.strategy}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-white/30" />
                      <span className="text-sm text-white/70">{getDuration(trade.timestamp, trade.closedAt)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    {isWin ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Notes Section */}
      {closedTrades.some(trade => trade.notes) && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-sm font-medium text-white mb-3">Trade Notes</h3>
          <div className="space-y-3">
            {closedTrades
              .filter(trade => trade.notes && trade.notes.trim().length > 0)
              .slice(0, 3)
              .map((trade) => (
                <div key={trade._id} className="bg-white/[0.02] rounded-lg p-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm text-white/90 font-medium">{trade.marketQuestion}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStrategyColor(trade.strategy)}`}>
                      {trade.strategy}
                    </span>
                  </div>
                  <p className="text-sm text-white/70">{trade.notes}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${trade.pnl.toFixed(2)} P&L
                    </span>
                    <span className="text-xs text-white/30">{formatDate(trade.timestamp)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Pagination/View More */}
      {closedTrades.length > 20 && (
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <button className="px-4 py-2 bg-white/[0.08] text-white text-sm rounded-lg hover:bg-white/[0.12] transition-colors">
            View All {closedTrades.length} Trades
          </button>
        </div>
      )}
    </GlassPanel>
  );
}