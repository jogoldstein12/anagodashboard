"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { DollarSign, TrendingUp, Target, Layers, Activity } from "lucide-react";

interface HamachiStatus {
  bankroll: number;
  totalPnl: number;
  dailyPnl: number;
  totalTrades: number;
  openPositions: number;
  winRate: number;
}

interface HamachiStatsRowProps {
  status: HamachiStatus | null | undefined;
}

export function HamachiStatsRow({ status }: HamachiStatsRowProps) {
  const s = status;
  const pnlPositive = (s?.totalPnl ?? 0) >= 0;
  const dailyPositive = (s?.dailyPnl ?? 0) >= 0;

  const stats = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Total P&L",
      value: `${pnlPositive ? "+" : ""}$${(s?.totalPnl ?? 0).toFixed(2)}`,
      color: pnlPositive ? "text-green-400" : "text-red-400",
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      label: "Today's P&L",
      value: `${dailyPositive ? "+" : ""}$${(s?.dailyPnl ?? 0).toFixed(2)}`,
      color: dailyPositive ? "text-green-400" : "text-red-400",
    },
    {
      icon: <Target className="w-4 h-4" />,
      label: "Win Rate",
      value: `${(s?.winRate ?? 0).toFixed(1)}%`,
      color: "text-white",
    },
    {
      icon: <Layers className="w-4 h-4" />,
      label: "Deployed",
      value: `$${(s?.deployed ?? 0).toFixed(2)}`,
      color: "text-white",
    },
    {
      icon: <Activity className="w-4 h-4" />,
      label: "Total Trades",
      value: String(s?.totalTrades ?? 0),
      color: "text-white",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <GlassPanel key={stat.label} className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/40">{stat.icon}</span>
            <span className="text-xs text-white/50">{stat.label}</span>
          </div>
          <p className={`text-xl font-semibold ${stat.color}`}>{stat.value}</p>
        </GlassPanel>
      ))}
    </div>
  );
}
