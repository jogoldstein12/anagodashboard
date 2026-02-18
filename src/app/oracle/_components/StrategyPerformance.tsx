import { GlassPanel } from "@/components/GlassPanel";
import { TrendingUp, Target, BarChart3, Trophy, Zap, Users } from "lucide-react";

interface StrategyPerformanceProps {
  strategies: any[];
}

export function StrategyPerformance({ strategies }: StrategyPerformanceProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy?.toLowerCase()) {
      case "resolution sniping":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "whale copy-trading":
        return <Users className="w-4 h-4 text-blue-400" />;
      case "news-driven":
        return <BarChart3 className="w-4 h-4 text-green-400" />;
      case "neg-risk arbitrage":
        return <Target className="w-4 h-4 text-purple-400" />;
      case "market making":
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      default:
        return <Trophy className="w-4 h-4 text-white/50" />;
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy?.toLowerCase()) {
      case "resolution sniping":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "whale copy-trading":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "news-driven":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "neg-risk arbitrage":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "market making":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? "text-green-400" : "text-red-400";
  };

  // Sort strategies by total P&L (descending)
  const sortedStrategies = [...(strategies || [])].sort((a, b) => b.totalPnl - a.totalPnl);

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Strategy Performance</h2>
        <div className="text-sm text-white/50">
          {sortedStrategies.length} strategies
        </div>
      </div>

      {sortedStrategies.length === 0 ? (
        <div className="text-center py-8 text-white/50">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No strategy performance data</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedStrategies.map((strategy) => (
            <div key={strategy.strategy} className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStrategyIcon(strategy.strategy)}
                  <div>
                    <div className="text-white font-medium">{strategy.strategy}</div>
                    <div className="text-xs text-white/50">
                      {strategy.totalTrades} trades • {strategy.winRate?.toFixed(1)}% win rate
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStrategyColor(strategy.strategy)}`}>
                  {strategy.strategy.split(' ')[0]}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-white/50">Total P&L</div>
                  <div className={`text-lg font-bold ${getPnlColor(strategy.totalPnl)}`}>
                    {formatCurrency(strategy.totalPnl)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-white/50">Avg P&L/Trade</div>
                  <div className={`text-lg font-bold ${getPnlColor(strategy.avgPnlPerTrade)}`}>
                    {formatCurrency(strategy.avgPnlPerTrade)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-white/50">Win Rate</div>
                  <div className="text-lg font-bold text-white">
                    {strategy.winRate?.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Progress bar for win rate */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/50 mb-1">
                  <span>Performance</span>
                  <span>{strategy.winningTrades}W / {strategy.totalTrades - strategy.winningTrades}L</span>
                </div>
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, strategy.winRate)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary stats */}
      {sortedStrategies.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {sortedStrategies.reduce((sum, s) => sum + s.totalTrades, 0)}
              </div>
              <div className="text-xs text-white/50">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(sortedStrategies.reduce((sum, s) => sum + s.totalPnl, 0))}
              </div>
              <div className="text-xs text-white/50">Combined P&L</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {sortedStrategies.length}
              </div>
              <div className="text-xs text-white/50">Active Strategies</div>
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}