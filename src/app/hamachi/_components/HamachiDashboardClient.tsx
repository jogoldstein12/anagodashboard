"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { GlassPanel } from "@/components/GlassPanel";
import { HamachiStatusBar } from "./HamachiStatusBar";
import { HamachiStatsRow } from "./HamachiStatsRow";
import { HamachiTradeHistory } from "./HamachiTradeHistory";
import { HamachiPnlChart } from "./HamachiPnlChart";

export function HamachiDashboardClient() {
  const status = useQuery(api.hamachi.getHamachiStatus);
  const trades = useQuery(api.hamachi.getHamachiTrades, { limit: 50 });
  const pnl = useQuery(api.hamachi.getHamachiPnl, { days: 30 });

  if (status === undefined && trades === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span>{"\u{1F324}\u{FE0F}"}</span> Hamachi
          </h1>
          <p className="text-white/50 mt-1">Weather prediction market trading</p>
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
          <span>{"\u{1F324}\u{FE0F}"}</span> Hamachi
        </h1>
        <p className="text-white/50 mt-1">Weather prediction market trading</p>
      </div>

      {/* Status Bar */}
      <HamachiStatusBar status={status} />

      {/* Stats Row */}
      <HamachiStatsRow status={status} />

      {/* P&L Chart */}
      <HamachiPnlChart pnl={pnl} />

      {/* Trade History */}
      <HamachiTradeHistory trades={trades} />
    </div>
  );
}
