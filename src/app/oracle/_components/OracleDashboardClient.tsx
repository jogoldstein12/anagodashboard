"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { GlassPanel } from "@/components/GlassPanel";
import { OverviewPanel } from "./OverviewPanel";
import { PnlStatement } from "./PnlStatement";
import { OpenPositionsTable } from "./OpenPositionsTable";
import { TradeHistoryTable } from "./TradeHistoryTable";
import { StrategyPerformance } from "./StrategyPerformance";
import { ActivityLog } from "./ActivityLog";

export function OracleDashboardClient() {
  const oracleStatus = useQuery(api.oracle.getOracleStatus, { agentId: "oracle" });
  const trades = useQuery(api.oracle.getOracleTrades, { limit: 100 });
  const positions = useQuery(api.oracle.getOpenPositions);
  const pnlData = useQuery(api.oracle.getOraclePnl, { days: 30 });
  const strategyPerformance = useQuery(api.oracle.getStrategyPerformance);
  const activityLog = useQuery(api.oracle.getOracleActivityLog, { limit: 50 });

  const isLoading = !oracleStatus && !trades && !positions && !pnlData && !strategyPerformance && !activityLog;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Oracle Dashboard</h1>
            <p className="text-white/50 mt-1">Trading agent status, P&L, positions, and activity</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassPanel className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Oracle Dashboard</h1>
          <p className="text-white/50 mt-1">Trading agent status, P&L, positions, and activity</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-sm font-medium hover:bg-amber-500/30 transition-colors">
            Run Sync
          </button>
          <button className="px-4 py-2 bg-white/[0.12] text-white border border-white/20 rounded-xl text-sm font-medium hover:bg-white/[0.18] transition-colors">
            Manual Trade
          </button>
        </div>
      </div>

      {/* Overview Panel */}
      <OverviewPanel status={oracleStatus} />

      {/* P&L Statement */}
      <PnlStatement pnlData={pnlData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Positions */}
        <OpenPositionsTable positions={positions} />

        {/* Strategy Performance */}
        <StrategyPerformance strategies={strategyPerformance} />
      </div>

      {/* Trade History */}
      <TradeHistoryTable trades={trades} />

      {/* Activity Log */}
      <ActivityLog activities={activityLog} />
    </div>
  );
}