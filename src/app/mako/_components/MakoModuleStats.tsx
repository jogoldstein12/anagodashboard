"use client";

import { GlassPanel } from "@/components/GlassPanel";

interface ModuleStat {
  strategy: string;
  count: number;
  wins: number;
  winRate: number;
  totalProfitCents: number;
  avgProfitCents: number;
}

interface MakoModuleStatsProps {
  modules: ModuleStat[] | null | undefined;
}

const STRATEGY_LABELS: Record<string, { label: string; badge: string; color: string }> = {
  market_making: { label: "Market Making", badge: "A", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  cross_arb: { label: "Cross-Platform Arb", badge: "B", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  info_lag: { label: "Info Lag", badge: "C", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  resolution_edge: { label: "Resolution Edge", badge: "D", color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

export function MakoModuleStats({ modules }: MakoModuleStatsProps) {
  const allStrategies = ["market_making", "cross_arb", "info_lag", "resolution_edge"];
  const moduleMap = new Map((modules ?? []).map((m) => [m.strategy, m]));

  return (
    <GlassPanel className="p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Module Breakdown</h2>
      <p className="text-sm text-white/50 mb-4">Per-strategy performance (closed trades)</p>

      <div className="space-y-3">
        {allStrategies.map((key) => {
          const cfg = STRATEGY_LABELS[key];
          const m = moduleMap.get(key);

          return (
            <div
              key={key}
              className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold border ${cfg.color}`}
                >
                  {cfg.badge}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{cfg.label}</p>
                  <p className="text-xs text-white/40">
                    {m ? `${m.count} trades` : "No trades"}
                  </p>
                </div>
              </div>

              {m && m.count > 0 ? (
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-xs text-white/40">Win Rate</p>
                    <p className="text-sm font-medium text-white">
                      {m.winRate.toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Avg Profit</p>
                    <p
                      className={`text-sm font-medium ${m.avgProfitCents >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {m.avgProfitCents >= 0 ? "+" : ""}
                      {(m.avgProfitCents / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-white/20">--</span>
              )}
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
