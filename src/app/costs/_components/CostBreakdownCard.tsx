"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { AgentBadge } from "@/components/AgentBadge";
import { AGENTS, type AgentKey } from "@/lib/constants";

interface AgentCost {
  agent: string;
  sessions: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

interface CostBreakdownCardProps {
  agentCosts: AgentCost[];
  totalCost: number;
}

export function CostBreakdownCard({ agentCosts, totalCost }: CostBreakdownCardProps) {
  const sorted = [...agentCosts].sort((a, b) => b.cost - a.cost);

  return (
    <GlassPanel className="p-6 space-y-4">
      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Cost by Agent</h3>
      <div className="space-y-3">
        {sorted.map((ac) => {
          const pct = totalCost > 0 ? (ac.cost / totalCost) * 100 : 0;
          const agentInfo = AGENTS[ac.agent as AgentKey];
          return (
            <div key={ac.agent} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AgentBadge agent={ac.agent} />
                  <span className="text-xs text-white/50">{ac.sessions} sessions</span>
                </div>
                <span className="text-sm font-mono text-white/90">${ac.cost.toFixed(4)}</span>
              </div>
              <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 1)}%`,
                    backgroundColor: agentInfo?.color || "#6b7280",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
