"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, TrendingDown, Target, BarChart, PieChart, DollarSign } from "lucide-react";

interface StrategyPerformance {
  _id: string;
  strategy: string;
  totalTrades: number;
  winningTrades: number;
  totalPnl: number;
  winRate: number;
  avgPnlPerTrade: number;
  lastUpdated: number;
}

interface StrategyPerformanceProps {
  strategies: StrategyPerformance[] | null | undefined;
}

export function StrategyPerformance({ strategies }: StrategyPerformanceProps) {
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

  const getStrategyIcon = (strategy: string) => {
    switch (strategy.toLowerCase()) {
      case "resolution sniping": return "🎯";
      case "whale copy-trading": return "🐋";
      case "news-driven": return "📰";
      case "neg-risk arbitrage": return "⚖️";
      case "market making": return "🏛️";
      default: return "📊";
    }
  };

  if (!strategies || strategies.length === 0) {
    return (
      <GlassPanel className="p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Strategy Performance</h2>
            <p className="text-sm text-white/50 mt-1">Performance by trading strategy</p>
          </div>
          <Badge variant="neutral" size="sm">0 strategies</Badge>
        </div>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/[0.04] rounded-full mb-4">
            <PieChart className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No strategy data</h3>
          <p className="text-sm text-white/50 max-w-sm mx-auto">
            Strategy performance data will appear here after Oracle executes trades using different strategies.
          </p>
        </div>
      </GlassPanel>
    );
  }

  const sortedStrategies = [...strategies].sort((a, b) => b.totalPnl - a.totalPnl);
  const totalPnl = strategies.reduce((sum, s) => sum + s.totalPnl, 0);
  const totalTrades = strategies.reduce((sum, s) => sum + s.totalTrades, 0);
  const bestStrategy = sortedStrategies[0];
  const worstStrategy = sortedStrategies[sortedStrategies.length - 1];

  return (
    <GlassPanel className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Strategy Performance</h2>
          <p className="text-sm text-white/50 mt-1">Performance by trading strategy</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={totalPnl >= 0 ? "success" : "error"} size="sm">
            ${totalPnl.toFixed(2)} total
          </Badge>
          <Badge variant="neutral" size="sm">{totalTrades} trades</Badge>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/[0.04] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-500/20 rounded">
              <TrendingUp className="w-3 h-3 text-green-400" />
            </div>
            <p className="text-xs text-white/50">Best Strategy</p>
          </div>
          {bestStrategy && (
            <>
              <p className="text-sm font-medium text-white truncate">{bestStrategy.strategy}</p>
              <p className="text-lg font-bold text-green-400">${bestStrategy.totalPnl.toFixed(2)}</p>
            </>
          )}
        </div>
        
        <div className="bg-white/[0.04] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-500/20 rounded">
              <TrendingDown className="w-3 h-3 text-red-400" />
            </div>
            <p className="text-xs text-white/50">Worst Strategy</p>
          </div>
          {worstStrategy && worstStrategy.totalPnl < 0 && (
            <>
              <p className="text-sm font-medium text-white truncate">{worstStrategy.strategy}</p>
              <p className="text-lg font-bold text-red-400">${worstStrategy.totalPnl.toFixed(2)}</p>
            </>
          )}
        </div>
      </div>

      {/* Strategy List */}
      <div className="space-y-3">
        {sortedStrategies.map((strategy) => {
          const isPositive = strategy.totalPnl > 0;
          const tradeSuccessRate = strategy.totalTrades > 0 
            ? (strategy.winningTrades / strategy.totalTrades) * 100 
            : 0;
          
          return (
            <div key={strategy._id} className="bg-white/[0.04] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStrategyIcon(strategy.strategy)}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{strategy.strategy}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">{strategy.totalTrades} trades</span>
                      <span className="text-xs text-white/30">•</span>
                      <span className="text-xs text-green-400">{strategy.winningTrades} wins</span>
                    </div>
                  </div>
                </div>
                <span className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  ${strategy.totalPnl.toFixed(2)}
                </span>
              </div>
              
              {/* Progress Bars */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Win Rate</span>
                  <span className="text-xs font-medium text-white">{strategy.winRate.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, strategy.winRate)}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Avg. P&L per Trade</span>
                  <span className={`text-xs font-medium ${strategy.avgPnlPerTrade >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${strategy.avgPnlPerTrade.toFixed(2)}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${strategy.avgPnlPerTrade >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, Math.abs(strategy.avgPnlPerTrade) * 10)}%` }}
                  />
                </div>
              </div>
              
              {/* Strategy Stats */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10">
                <div className="text-center">
                  <p className="text-xs text-white/50">Success</p>
                  <p className={`text-sm font-medium ${tradeSuccessRate >= 50 ? 'text-green-400' : 'text-amber-400'}`}>
                    {tradeSuccessRate.toFixed(0)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-white/50">Volume</p>
                  <p className="text-sm font-medium text-white">
                    ${(strategy.totalTrades * Math.abs(strategy.avgPnlPerTrade)).toFixed(0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-white/50">ROI</p>
                  <p className={`text-sm font-medium ${strategy.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {strategy.totalTrades > 0 ? (strategy.totalPnl / (strategy.totalTrades * 100) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Summary */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-sm font-medium text-white mb-3">Performance Insights</h3>
        <div className="space-y-2">
          {bestStrategy && bestStrategy.totalPnl > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1 bg-green-500/20 rounded">
                <TrendingUp className="w-3 h-3 text-green-400" />
              </div>
              <span className="text-white/70">
                <span className="text-green-400 font-medium">{bestStrategy.strategy}</span> is the most profitable strategy
              </span>
            </div>
          )}
          
          {worstStrategy && worstStrategy.totalPnl < 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1 bg-red-500/20 rounded">
                <TrendingDown className="w-3 h-3 text-red-400" />
              </div>
              <span className="text-white/70">
                <span className="text-red-400 font-medium">{worstStrategy.strategy}</span> needs improvement
              </span>
            </div>
          )}
          
          {strategies.some(s => s.winRate >= 70) && (
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1 bg-blue-500/20 rounded">
                <Target className="w-3 h-3 text-blue-400" />
              </div>
              <span className="text-white/70">
                High win rate strategies ({strategies.filter(s => s.winRate >= 70).length}) show consistent performance
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1 bg-purple-500/20 rounded">
              <BarChart className="w-3 h-3 text-purple-400" />
            </div>
            <span className="text-white/70">
              Total strategy diversity: <span className="text-purple-400 font-medium">{strategies.length}</span> active strategies
            </span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}