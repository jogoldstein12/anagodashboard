"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Clock } from "lucide-react";

interface MakoTrade {
  _id: string;
  tradeId: string;
  ts: number;
  strategy: string;
  eventId: string;
  legAPlatform: string;
  legAMarket: string;
  legASide: string;
  legAPrice: number;
  legAContracts: number;
  legAStatus: string;
  legBPlatform?: string;
  legBSide?: string;
  legBPrice?: number;
  legBContracts?: number;
  expectedProfitCents?: number;
  resolutionDate?: string;
}

interface OpenPositionsProps {
  trades: MakoTrade[] | null | undefined;
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hrs < 24) return `${hrs}h ${remainMins}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

function truncateId(id: string): string {
  if (id.startsWith("0x") && id.length > 14) {
    return `${id.slice(0, 8)}...${id.slice(-4)}`;
  }
  return id.length > 20 ? `${id.slice(0, 17)}...` : id;
}

export function OpenPositions({ trades }: OpenPositionsProps) {
  if (!trades || trades.length === 0) return null;

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Open Positions</h2>
          <p className="text-sm text-white/50 mt-1">{trades.length} active</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Event</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-white/50">Direction</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Contracts</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Leg A Price</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Leg B Price</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Exp. Profit</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-white/50">Time Open</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const timeOpen = Date.now() - trade.ts;
              return (
                <tr key={trade._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3 px-2">
                    <span className="text-sm text-white/90 font-mono">
                      {truncateId(trade.eventId)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-xs text-white/70">
                      <span className="text-blue-400">{trade.legAPlatform}</span>{" "}
                      {trade.legASide}
                      {trade.legBSide && (
                        <>
                          {" + "}
                          <span className="text-purple-400">{trade.legBPlatform}</span>{" "}
                          {trade.legBSide}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-white/70">{trade.legAContracts}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-white/70">
                      {(trade.legAPrice * 100).toFixed(1)}\u00a2
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-white/70">
                      {trade.legBPrice ? `${(trade.legBPrice * 100).toFixed(1)}\u00a2` : "--"}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-green-400/80">
                      {trade.expectedProfitCents
                        ? `+${(trade.expectedProfitCents / 100).toFixed(2)}`
                        : "--"}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-1 text-white/50">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{formatDuration(timeOpen)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
