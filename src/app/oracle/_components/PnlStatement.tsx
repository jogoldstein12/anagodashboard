import { GlassPanel } from "@/components/GlassPanel";
import { TrendingUp, TrendingDown, Target, BarChart3, DollarSign, Trophy } from "lucide-react";

interface PnlStatementProps {
  pnlData: any[];
}

export function PnlStatement({ pnlData }: PnlStatementProps) {
  const latestPnl = pnlData?.[0];
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getPnlColor = (amount: number) => {
    return amount >= 0 ? "text-green-400" : "text-red-400";
  };

  const getPnlIcon = (amount: number) => {
    return amount >= 0 ? 
      <TrendingUp className="w-5 h-5 text-green-400" /> : 
      <TrendingDown className="w-5 h-5 text-red-400" />;
  };

  return (
    <GlassPanel className="p-6">
      <h2 className="text-xl font-semibold text-white mb-6">P&L Statement</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Realized P&L */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <DollarSign className="w-4 h-4" />
            <span>Total Realized P&L</span>
          </div>
          <div className={`text-2xl font-bold ${getPnlColor(latestPnl?.totalRealizedPnl || 0)}`}>
            {formatCurrency(latestPnl?.totalRealizedPnl || 0)}
          </div>
          <div className="text-xs text-white/50">
            All time
          </div>
        </div>

        {/* Today's P&L */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <BarChart3 className="w-4 h-4" />
            <span>Today's P&L</span>
          </div>
          <div className="flex items-center gap-2">
            {getPnlIcon(latestPnl?.todaysPnl || 0)}
            <div className={`text-2xl font-bold ${getPnlColor(latestPnl?.todaysPnl || 0)}`}>
              {formatCurrency(latestPnl?.todaysPnl || 0)}
            </div>
          </div>
          <div className="text-xs text-white/50">
            Last 24 hours
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Unrealized P&L</span>
          </div>
          <div className={`text-2xl font-bold ${getPnlColor(latestPnl?.unrealizedPnl || 0)}`}>
            {formatCurrency(latestPnl?.unrealizedPnl || 0)}
          </div>
          <div className="text-xs text-white/50">
            Open positions
          </div>
        </div>

        {/* Win Rate */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Target className="w-4 h-4" />
            <span>Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {latestPnl?.winRate?.toFixed(1) || "0.0"}%
          </div>
          <div className="text-xs text-white/50">
            {latestPnl?.winningTrades || 0} / {latestPnl?.totalTrades || 0} trades
          </div>
        </div>

        {/* ROI */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>ROI</span>
          </div>
          <div className={`text-2xl font-bold ${getPnlColor(latestPnl?.roiPercent || 0)}`}>
            {latestPnl?.roiPercent?.toFixed(1) || "0.0"}%
          </div>
          <div className="text-xs text-white/50">
            Return on investment
          </div>
        </div>

        {/* Total Trades */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Trophy className="w-4 h-4" />
            <span>Total Trades</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {latestPnl?.totalTrades || 0}
          </div>
          <div className="text-xs text-white/50">
            {latestPnl?.winningTrades || 0} winning
          </div>
        </div>
      </div>

      {/* P&L Chart Placeholder */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="text-sm text-white/50 mb-4">Cumulative P&L (Last 30 days)</div>
        <div className="h-32 bg-white/[0.03] rounded-lg flex items-center justify-center">
          <div className="text-white/30 text-sm">P&L chart visualization coming soon</div>
        </div>
      </div>
    </GlassPanel>
  );
}