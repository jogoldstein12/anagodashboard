import { GlassPanel } from "@/components/GlassPanel";
import { TrendingUp, TrendingDown, Clock, Target } from "lucide-react";

interface OpenPositionsTableProps {
  positions: any[];
}

export function OpenPositionsTable({ positions }: OpenPositionsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? "text-green-400" : "text-red-400";
  };

  const getPnlIcon = (pnl: number) => {
    return pnl >= 0 ? 
      <TrendingUp className="w-4 h-4 text-green-400" /> : 
      <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Open Positions</h2>
        <div className="text-sm text-white/50">
          {positions?.length || 0} positions
        </div>
      </div>

      {!positions || positions.length === 0 ? (
        <div className="text-center py-8 text-white/50">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No open positions</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Market</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Outcome</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Entry / Current</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">P&L</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Size</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Strategy</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/50">Held</th>
              </tr>
            </thead>
            <tbody>
              {positions?.slice(0, 5).map((position) => (
                <tr key={position.positionId} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3 px-4">
                    <div className="text-sm text-white font-medium">
                      {truncateText(position.marketQuestion)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                      position.outcome === "YES" 
                        ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}>
                      {position.outcome}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-white">
                      ${position.entryPrice?.toFixed(3)} / ${position.currentPrice?.toFixed(3)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      {getPnlIcon(position.unrealizedPnl)}
                      <div className={`text-sm font-medium ${getPnlColor(position.unrealizedPnl)}`}>
                        {formatCurrency(position.unrealizedPnl)}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-white">
                      {formatCurrency(position.positionSizeUsd)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-white/70">
                      {position.strategy}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-sm text-white/70">
                      <Clock className="w-3 h-3" />
                      {formatTime(position.timeHeldSeconds)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {positions.length > 5 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-amber-400 hover:text-amber-300">
                View all {positions.length} positions →
              </button>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
}