"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { TrendingUp, TrendingDown, DollarSign, Percent, Target, BarChart } from "lucide-react";

interface PnlData {
  _id: string;
  date: string;
  totalRealizedPnl: number;
  todaysPnl: number;
  unrealizedPnl: number;
  winRate: number;
  roiPercent: number;
  totalTrades: number;
  winningTrades: number;
  timestamp: number;
}

interface PnlStatementProps {
  pnlData: PnlData[] | null | undefined;
}

export function PnlStatement({ pnlData }: PnlStatementProps) {
  if (!pnlData || pnlData.length === 0) {
    return (
      <GlassPanel className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </GlassPanel>
    );
  }

  const latest = pnlData[0];
  const isPositive = latest.totalRealizedPnl > 0;
  const isTodayPositive = latest.todaysPnl > 0;

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">P&L Statement</h2>
          <p className="text-sm text-white/50 mt-1">Profit & Loss performance metrics</p>
        </div>
        <div className="text-sm text-white/50">
          Updated {new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Total Realized P&L */}
        <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-white/50">Total Realized P&L</p>
                <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  ${latest.totalRealizedPnl.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/30">All-time profit/loss from closed trades</p>
        </div>

        {/* Today's P&L */}
        <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isTodayPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <DollarSign className={`w-4 h-4 ${isTodayPositive ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <div>
                <p className="text-sm text-white/50">Today's P&L</p>
                <p className={`text-2xl font-bold ${isTodayPositive ? 'text-green-400' : 'text-red-400'}`}>
                  ${latest.todaysPnl.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/30">Profit/loss for {latest.date}</p>
        </div>

        {/* Unrealized P&L */}
        <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BarChart className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Unrealized P&L</p>
                <p className={`text-2xl font-bold ${latest.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${latest.unrealizedPnl.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/30">Open positions value</p>
        </div>

        {/* Win Rate */}
        <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Target className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Win Rate</p>
                <p className="text-2xl font-bold text-white">{latest.winRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/30">
            {latest.winningTrades} wins / {latest.totalTrades} trades
          </p>
        </div>

        {/* ROI */}
        <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Percent className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">ROI</p>
                <p className={`text-2xl font-bold ${latest.roiPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {latest.roiPercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/30">Return on investment</p>
        </div>

        {/* Trade Stats */}
        <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <BarChart className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Trade Stats</p>
                <p className="text-2xl font-bold text-white">{latest.totalTrades}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-green-400">{latest.winningTrades} winning</span>
            <span className="text-white/50">{latest.totalTrades - latest.winningTrades} losing</span>
          </div>
        </div>
      </div>

      {/* Historical P&L Chart Placeholder */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white">30-Day P&L Trend</h3>
          <span className="text-xs text-white/30">Last 30 days</span>
        </div>
        <div className="h-32 bg-white/[0.02] rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-white/50">P&L chart visualization</p>
            <p className="text-xs text-white/30 mt-1">(Chart component to be implemented)</p>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}