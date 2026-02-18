"use client";

import { useMemo } from "react";
import { GlassPanel } from "@/components/GlassPanel";

interface MakoTrade {
  _id: string;
  timestamp: number;
  bankrollAfter: number;
  pnl: number;
  outcome: string;
}

interface BankrollChartProps {
  trades: MakoTrade[] | null | undefined;
}

export function BankrollChart({ trades }: BankrollChartProps) {
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    // Trades come sorted desc; reverse to get chronological order
    const sorted = [...trades].reverse();
    const values = sorted.map((t) => t.bankrollAfter);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const width = 800;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const points = sorted.map((t, i) => {
      const x = padding.left + (i / Math.max(sorted.length - 1, 1)) * chartW;
      const y = padding.top + chartH - ((t.bankrollAfter - min) / range) * chartH;
      return { x, y, trade: t };
    });

    // SVG path for the line
    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    // Area fill under the line
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    // Y-axis labels (5 ticks)
    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const val = min + (range * i) / 4;
      const y = padding.top + chartH - (i / 4) * chartH;
      return { val, y };
    });

    const lastVal = values[values.length - 1];
    const firstVal = values[0];
    const isUp = lastVal >= firstVal;

    return { points, linePath, areaPath, yTicks, width, height, padding, chartH, isUp };
  }, [trades]);

  if (!chartData) {
    return (
      <GlassPanel className="p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Bankroll</h2>
        <p className="text-sm text-white/50 mb-4">Bankroll over time</p>
        <div className="h-[200px] bg-white/[0.02] rounded-lg flex items-center justify-center">
          <p className="text-sm text-white/30">No trade data for chart</p>
        </div>
      </GlassPanel>
    );
  }

  const gradientId = "bankroll-gradient";
  const lineColor = chartData.isUp ? "#22c55e" : "#ef4444";
  const fillColor = chartData.isUp ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)";

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Bankroll</h2>
          <p className="text-sm text-white/50 mt-1">Bankroll over last {trades?.length ?? 0} trades</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg">
        <svg
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {chartData.yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={chartData.padding.left}
                y1={tick.y}
                x2={chartData.width - chartData.padding.right}
                y2={tick.y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 4"
              />
              <text
                x={chartData.padding.left - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="fill-white/30 text-[10px]"
              >
                ${tick.val.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={chartData.areaPath} fill={`url(#${gradientId})`} />

          {/* Line */}
          <path
            d={chartData.linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {chartData.points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill={p.trade.outcome === "win" ? "#22c55e" : p.trade.outcome === "loss" ? "#ef4444" : "#f59e0b"}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
    </GlassPanel>
  );
}
