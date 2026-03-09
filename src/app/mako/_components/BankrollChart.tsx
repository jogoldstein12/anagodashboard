"use client";

import { useMemo } from "react";
import { GlassPanel } from "@/components/GlassPanel";

interface RiskEvent {
  _id: string;
  ts: number;
  bankroll: number;
  eventType: string;
}

interface BankrollChartProps {
  riskEvents: RiskEvent[] | null | undefined;
  currentBankroll: number;
  peakBankroll: number;
}

export function BankrollChart({ riskEvents, currentBankroll, peakBankroll }: BankrollChartProps) {
  const chartData = useMemo(() => {
    if (!riskEvents || riskEvents.length === 0) return null;

    const sorted = [...riskEvents]
      .filter((e) => e.bankroll > 0)
      .sort((a, b) => a.ts - b.ts);

    if (sorted.length === 0) return null;

    const values = sorted.map((e) => e.bankroll);
    const min = Math.min(...values) * 0.98;
    const max = Math.max(...values) * 1.02;
    const range = max - min || 1;

    const width = 800;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const points = sorted.map((e, i) => {
      const x = padding.left + (i / Math.max(sorted.length - 1, 1)) * chartW;
      const y = padding.top + chartH - ((e.bankroll - min) / range) * chartH;
      return { x, y, event: e };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const val = min + (range * i) / 4;
      const y = padding.top + chartH - (i / 4) * chartH;
      return { val, y };
    });

    const lastVal = values[values.length - 1];
    const firstVal = values[0];
    const isUp = lastVal >= firstVal;

    return { points, linePath, areaPath, yTicks, width, height, padding, chartH, isUp };
  }, [riskEvents]);

  if (!chartData) {
    return (
      <GlassPanel className="p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Bankroll</h2>
        <p className="text-sm text-white/50 mb-4">Bankroll over time from risk events</p>
        <div className="flex items-center gap-6 mb-4">
          <div>
            <span className="text-xs text-white/40">Current</span>
            <p className="text-lg font-semibold text-white">${currentBankroll.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-xs text-white/40">Peak</span>
            <p className="text-lg font-semibold text-white/70">${peakBankroll.toFixed(2)}</p>
          </div>
        </div>
        <div className="h-[200px] bg-white/[0.02] rounded-lg flex items-center justify-center">
          <p className="text-sm text-white/30">No risk event data for chart</p>
        </div>
      </GlassPanel>
    );
  }

  const lineColor = chartData.isUp ? "#22c55e" : "#ef4444";
  const gradientId = "bankroll-gradient-v2";

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Bankroll</h2>
          <p className="text-sm text-white/50 mt-1">
            Over {riskEvents?.length ?? 0} risk events
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-white/40">Current</span>
            <p className="text-lg font-semibold text-white">${currentBankroll.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-white/40">Peak</span>
            <p className="text-lg font-semibold text-white/70">${peakBankroll.toFixed(2)}</p>
          </div>
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
                ${tick.val.toFixed(0)}
              </text>
            </g>
          ))}

          <path d={chartData.areaPath} fill={`url(#${gradientId})`} />

          <path
            d={chartData.linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {chartData.points.length <= 50 &&
            chartData.points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="2.5"
                fill={lineColor}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1"
              />
            ))}
        </svg>
      </div>
    </GlassPanel>
  );
}
