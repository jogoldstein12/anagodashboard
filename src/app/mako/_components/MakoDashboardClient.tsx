"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { GlassPanel } from "@/components/GlassPanel";
import { MakoStatusBar } from "./MakoStatusBar";
import { MakoStatsRow } from "./MakoStatsRow";
import { BankrollChart } from "./BankrollChart";
import { MakoModuleStats } from "./MakoModuleStats";
import { OpenPositions } from "./OpenPositions";
import { TradeHistory } from "./TradeHistory";

export function MakoDashboardClient() {
  const status = useQuery(api.mako.getMakoStatus);
  const trades = useQuery(api.mako.getMakoTrades, { limit: 50 });
  const riskEvents = useQuery(api.mako.getMakoRiskEvents, { limit: 100 });
  const moduleStats = useQuery(api.mako.getMakoModuleStats);
  const openTrades = useQuery(api.mako.getMakoTrades, { limit: 50, status: "open" });

  if (status === undefined && trades === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span>{"\u{1F988}"}</span> Mako v2
          </h1>
          <p className="text-white/50 mt-1">Dual-leg prediction market trading</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <GlassPanel key={i} className="p-5">
              <div className="animate-pulse">
                <div className="h-3 bg-white/10 rounded w-1/2 mb-3"></div>
                <div className="h-7 bg-white/10 rounded w-2/3"></div>
              </div>
            </GlassPanel>
          ))}
        </div>
        <GlassPanel className="p-6">
          <div className="animate-pulse">
            <div className="h-5 bg-white/10 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span>{"\u{1F988}"}</span> Mako v2
        </h1>
        <p className="text-white/50 mt-1">Dual-leg prediction market trading</p>
      </div>

      {/* Status Bar */}
      <MakoStatusBar status={status} />

      {/* Stats Row */}
      <MakoStatsRow status={status} />

      {/* Two-column: Chart + Module Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BankrollChart
            riskEvents={riskEvents}
            currentBankroll={status?.bankroll ?? 0}
            peakBankroll={status?.peakBankroll ?? 0}
          />
        </div>
        <div>
          <MakoModuleStats modules={moduleStats} />
        </div>
      </div>

      {/* Open Positions */}
      {(openTrades?.length ?? 0) > 0 && <OpenPositions trades={openTrades} />}

      {/* Trade History */}
      <TradeHistory trades={trades} />
    </div>
  );
}
