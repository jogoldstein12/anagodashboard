"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { ArrowUpRight, ArrowDownRight, Clock, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface Position {
  _id: string;
  positionId: string;
  marketId: string;
  marketQuestion: string;
  outcome: string;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  positionSizeUsd: number;
  strategy: string;
  timeHeldSeconds: number;
  timestamp: number;
}

interface OpenPositionsTableProps {
  positions: Position[] | null | undefined;
}

export function OpenPositionsTable({ positions }: OpenPositionsTableProps) {
  const formatTimeHeld = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
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

  if (!positions || positions.length === 0) {
    return (
      <GlassPanel className="p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Open Positions</h2>
            <p className="text-sm text-white/50 mt-1">Currently active trades</p>
          </div>
          <Badge variant="neutral" size="sm">0 positions</Badge>
        </div>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/[0.04] rounded-full mb-4">
            <DollarSign className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No open positions</h3>
          <p className="text-sm text-white/50 max-w-sm mx-auto">
            Oracle doesn't have any active trades. Positions will appear here when trades are executed.
          </p>
        </div>
      </GlassPanel>
    );
  }

  const totalUnrealizedPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
  const totalPositionSize = positions.reduce((sum, pos) => sum + pos.positionSizeUsd, 0);

  return (
    <GlassPanel className="p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Open Positions</h2>
          <p className="text-sm text-white/50 mt-1">Currently active trades</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={totalUnrealizedPnl >= 0 ? "success" : "error"} size="sm">
            ${totalUnrealizedPnl.toFixed(2)} total P&L
          </Badge>
          <Badge variant="neutral" size="sm">{positions.length} positions</Badge>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/[0.04] rounded-lg p-3">
          <p className="text-xs text-white/50 mb-1">Total Exposure</p>
          <p className="text-lg font-semibold text-white">${totalPositionSize.toFixed(2)}</p>
        </div>
        <div className="bg-white/[0.04] rounded-lg p-3">
          <p className="text-xs text-white/50 mb-1">Avg. Time Held</p>
          <p className="text-lg font-semibold text-white">
            {formatTimeHeld(positions.reduce((sum, pos) => sum + pos.timeHeldSeconds, 0) / positions.length)}
          </p>
        </div>
      </div>

      {/* Positions Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Market</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Outcome</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Size</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">P&L</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Strategy</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Time</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => {
              const pnlPercent = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
              const isPositive = position.unrealizedPnl > 0;
              
              return (
                <tr key={position._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3 px-2">
                    <div className="max-w-[200px]">
                      <p className="text-sm text-white/90 truncate" title={position.marketQuestion}>
                        {position.marketQuestion}
                      </p>
                      <p className="text-xs text-white/30">ID: {position.marketId.slice(0, 8)}...</p>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={position.outcome === "YES" ? "success" : "error"} size="sm">
                      {position.outcome}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-sm text-white/90">${position.positionSizeUsd.toFixed(2)}</p>
                    <p className="text-xs text-white/30">
                      {position.entryPrice.toFixed(2)} → {position.currentPrice.toFixed(2)}
                    </p>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          ${position.unrealizedPnl.toFixed(2)}
                        </p>
                        <p className={`text-xs ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
                          {pnlPercent.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStrategyColor(position.strategy)}`}>
                      {position.strategy}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-white/30" />
                      <span className="text-sm text-white/70">{formatTimeHeld(position.timeHeldSeconds)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Strategy Distribution */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-sm font-medium text-white mb-3">Strategy Distribution</h3>
        <div className="space-y-2">
          {Array.from(new Set(positions.map(p => p.strategy))).map(strategy => {
            const strategyPositions = positions.filter(p => p.strategy === strategy);
            const strategyPnl = strategyPositions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
            const count = strategyPositions.length;
            
            return (
              <div key={strategy} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStrategyColor(strategy)}`}>
                    {strategy}
                  </span>
                  <span className="text-xs text-white/50">{count} positions</span>
                </div>
                <span className={`text-sm ${strategyPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${strategyPnl.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
}