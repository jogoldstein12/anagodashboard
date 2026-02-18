import { GlassPanel } from "@/components/GlassPanel";
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface TradeHistoryTableProps {
  trades: any[];
}

export function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "MMM d, HH:mm");
  };

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? "text-green-400" : "text-red-400";
  };

  const getPnlIcon = (pnl: number) => {
    return pnl >= 0 ? 
      <TrendingUp className="w-4 h-4 text-green-400" /> : 
      <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  const getTradeStatusIcon = (closed: boolean, pnl: number) => {
    if (!closed) return <Clock className="w-4 h-4 text-amber-400" />;
    return pnl >= 0 ? 
      <CheckCircle className="w-4 h-4 text-green-400" /> : 
      <XCircle className="w-4 h-4 text-red-400" />;
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatDuration = (start: number, end?: number) => {
    if (!end) return "Open";
    const hours = Math.floor((end - start) / (1000 * 60 * 60));
    const minutes = Math.floor(((end - start) % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Filter to show closed trades first, then sort by timestamp
  const sortedTrades = [...(trades || [])].sort((a, b) => {
    if (a.closed && !b.closed) return -1;
    if (!a.closed && b.closed) return 1;
    return b.timestamp - a.timestamp;
  });

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Trade History</h2>
        <div className="text-sm text-white/50">
          {sortedTrades?.filter(t => t.closed).length || 0} closed trades
        </div>
      </div>

      {!sortedTrades || sortedTrades.length === 0 ? (
        <div className="text-center py-8 text-white/50">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No trade history</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Market</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Outcome</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Side</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Entry / Exit</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">P&L</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Strategy</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Duration</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Time</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrades.slice(0, 10).map((trade) => (
                <tr key={trade.tradeId} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {getTradeStatusIcon(trade.closed, trade.pnl)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-white font-medium max-w-xs">
                      {truncateText(trade.marketQuestion)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                      trade.outcome === "YES" 
                        ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}>
                      {trade.outcome}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                      trade.side === "BUY" 
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                        : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    }`}>
                      {trade.side}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-white">
                      ${trade.price?.toFixed(3)}
                      {trade.closedAt && (
                        <span className="text-white/50"> → ${trade.closedAt}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      {getPnlIcon(trade.pnl)}
                      <div className={`text-sm font-medium ${getPnlColor(trade.pnl)}`}>
                        {formatCurrency(trade.pnl)}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-white/70">
                      {trade.strategy}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-white/70">
                      {formatDuration(trade.timestamp, trade.closedAt)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-white/70">
                      {formatDate(trade.timestamp)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedTrades.length > 10 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-amber-400 hover:text-amber-300">
                View all {sortedTrades.length} trades →
              </button>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
}