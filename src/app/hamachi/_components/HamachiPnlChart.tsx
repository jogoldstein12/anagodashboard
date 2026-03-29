"use client";

import { GlassPanel } from "@/components/GlassPanel";

interface PnlDay {
  _id: string;
  date: string;
  trades: number;
  wins: number;
  pnl: number;
}

interface HamachiPnlChartProps {
  pnl: PnlDay[] | null | undefined;
}

export function HamachiPnlChart({ pnl }: HamachiPnlChartProps) {
  if (!pnl || pnl.length === 0) {
    return (
      <GlassPanel className="p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Daily P&L</h2>
        <p className="text-sm text-white/50">No daily data yet</p>
      </GlassPanel>
    );
  }

  // Sort by date ascending, take last 14 days
  const sorted = [...pnl].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);

  const maxAbs = Math.max(...sorted.map((d) => Math.abs(d.pnl)), 0.01);
  const chartH = 160;
  const barWidth = 100 / sorted.length;
  const midY = chartH / 2;

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Daily P&L</h2>
          <p className="text-sm text-white/50 mt-1">Last {sorted.length} days</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40">Period Total</p>
          <p className={`text-lg font-semibold ${sorted.reduce((s, d) => s + d.pnl, 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
            {sorted.reduce((s, d) => s + d.pnl, 0) >= 0 ? "+" : ""}${sorted.reduce((s, d) => s + d.pnl, 0).toFixed(2)}
          </p>
        </div>
      </div>

      <svg viewBox={`0 0 100 ${chartH}`} className="w-full" preserveAspectRatio="none">
        {/* Zero line */}
        <line x1="0" y1={midY} x2="100" y2={midY} stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />

        {sorted.map((day, i) => {
          const barH = (Math.abs(day.pnl) / maxAbs) * (chartH / 2 - 10);
          const isPositive = day.pnl >= 0;
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          const y = isPositive ? midY - barH : midY;

          return (
            <rect
              key={day.date}
              x={x}
              y={y}
              width={w}
              height={Math.max(barH, 0.5)}
              rx="0.5"
              fill={isPositive ? "rgba(74, 222, 128, 0.7)" : "rgba(248, 113, 113, 0.7)"}
            />
          );
        })}
      </svg>

      {/* Date labels */}
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-white/30">{sorted[0]?.date.slice(5)}</span>
        <span className="text-[10px] text-white/30">{sorted[sorted.length - 1]?.date.slice(5)}</span>
      </div>
    </GlassPanel>
  );
}
