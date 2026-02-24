"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { Signal, Calendar, TrendingUp, Activity } from "lucide-react";

interface UniStatus {
  status: string;
  ticker?: string;
  releaseDate?: string;
  tradeDirection?: string;
  entryPrice?: number;
  betSize?: number;
  multiplier?: number;
  regime?: string;
  signalSummary?: string;
}

interface SignalCardProps {
  status: UniStatus | null | undefined;
}

export function SignalCard({ status }: SignalCardProps) {
  const s = status;

  // Regime color coding
  const regimeColors: Record<string, string> = {
    HOT: "bg-red-500/20 text-red-400 border-red-500/30",
    FLAT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    COOL: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  // If there's a pending/active trade, show trade details
  const hasActiveTrade = s?.status === "active" || s?.status === "pending";

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Signal className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">
          {hasActiveTrade ? "Active Trade" : "Next Trade"}
        </h2>
      </div>

      {hasActiveTrade && s?.ticker ? (
        // Show active trade details
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/[0.04] rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                Ticker
              </div>
              <p className="text-white font-mono text-sm">{s.ticker}</p>
            </div>
            
            <div className="bg-white/[0.04] rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                <Activity className="w-3 h-3" />
                Direction
              </div>
              <p className={`font-semibold ${s.tradeDirection === "YES" ? "text-green-400" : "text-red-400"}`}>
                {s.tradeDirection || "TBD"}
              </p>
            </div>
            
            <div className="bg-white/[0.04] rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                Entry Price
              </div>
              <p className="text-white">{s.entryPrice ? `¢${s.entryPrice.toFixed(1)}` : "TBD"}</p>
            </div>
            
            <div className="bg-white/[0.04] rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                Bet Size
              </div>
              <p className="text-white">${s.betSize?.toFixed(2) || "TBD"}</p>
            </div>
          </div>

          {s.signalSummary && (
            <div className="bg-white/[0.04] rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                <Signal className="w-3 h-3" />
                Signal Summary
              </div>
              <p className="text-white/80 text-sm">{s.signalSummary}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            {s.regime && (
              <Badge variant={s.regime === "HOT" ? "error" : s.regime === "FLAT" ? "warning" : "info"} size="sm">
                Regime: {s.regime}
              </Badge>
            )}
            {s.multiplier && (
              <Badge variant="neutral" size="sm">
                Multiplier: {s.multiplier}x
              </Badge>
            )}
          </div>
        </div>
      ) : (
        // No active trade
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/[0.04] rounded-full mb-4">
            <Calendar className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No Active Trade</h3>
          <p className="text-sm text-white/50 max-w-sm mx-auto">
            {s?.releaseDate 
              ? `Next review scheduled for ${s.releaseDate}. Uni will analyze PCE/PPI data and market signals to determine entry.`
              : "Uni is monitoring market conditions. Next trade opportunity will appear here."
            }
          </p>
          
          {s?.regime && (
            <div className="mt-4">
              <Badge 
                variant={s.regime === "HOT" ? "error" : s.regime === "FLAT" ? "warning" : "info"} 
                size="md"
              >
                Current Regime: {s.regime}
              </Badge>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
}
