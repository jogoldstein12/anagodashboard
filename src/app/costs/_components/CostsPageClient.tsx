"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { CostBreakdownCard } from "./CostBreakdownCard";
import { ModelUsageCard } from "./ModelUsageCard";
import { SessionsTable } from "./SessionsTable";
import { DollarSign, Zap, Hash, TrendingDown } from "lucide-react";
import type { Session } from "@/lib/types";

export default function CostsPageClient() {
  const sessions = useQuery(api.sessions.list, { limit: 100 });

  if (sessions === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader title="Costs" description="Model usage and cost tracking across all agents" />
        <LoadingState variant="grid" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Costs" description="Model usage and cost tracking across all agents" />
        <EmptyState
          icon={<DollarSign className="w-12 h-12" />}
          message="No session data yet. Costs will appear here as agents run."
        />
      </div>
    );
  }

  const typedSessions = sessions as Session[];

  // Compute totals
  const totalCost = typedSessions.reduce((sum, s) => sum + s.cost, 0);
  const totalTokensIn = typedSessions.reduce((sum, s) => sum + s.tokensIn, 0);
  const totalTokensOut = typedSessions.reduce((sum, s) => sum + s.tokensOut, 0);
  const totalSessions = typedSessions.length;

  // Group by agent
  const agentMap = new Map<string, { sessions: number; tokensIn: number; tokensOut: number; cost: number }>();
  for (const s of typedSessions) {
    const existing = agentMap.get(s.agent) || { sessions: 0, tokensIn: 0, tokensOut: 0, cost: 0 };
    existing.sessions++;
    existing.tokensIn += s.tokensIn;
    existing.tokensOut += s.tokensOut;
    existing.cost += s.cost;
    agentMap.set(s.agent, existing);
  }
  const agentCosts = Array.from(agentMap.entries()).map(([agent, data]) => ({ agent, ...data }));

  // Group by model
  const modelMap = new Map<string, { sessions: number; tokensIn: number; tokensOut: number; cost: number }>();
  for (const s of typedSessions) {
    const existing = modelMap.get(s.model) || { sessions: 0, tokensIn: 0, tokensOut: 0, cost: 0 };
    existing.sessions++;
    existing.tokensIn += s.tokensIn;
    existing.tokensOut += s.tokensOut;
    existing.cost += s.cost;
    modelMap.set(s.model, existing);
  }
  const modelUsage = Array.from(modelMap.entries()).map(([model, data]) => ({ model, ...data }));

  // Avg cost per session
  const avgCost = totalSessions > 0 ? totalCost / totalSessions : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Costs" description="Model usage and cost tracking across all agents" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Cost" value={`$${totalCost.toFixed(2)}`} />
        <StatCard icon={<Hash className="w-5 h-5" />} label="Total Sessions" value={totalSessions} />
        <StatCard icon={<Zap className="w-5 h-5" />} label="Total Tokens" value={`${((totalTokensIn + totalTokensOut) / 1000).toFixed(0)}K`} />
        <StatCard icon={<TrendingDown className="w-5 h-5" />} label="Avg $/Session" value={`$${avgCost.toFixed(4)}`} />
      </div>

      {/* Breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CostBreakdownCard agentCosts={agentCosts} totalCost={totalCost} />
        <ModelUsageCard modelUsage={modelUsage} />
      </div>

      {/* Sessions table */}
      <SessionsTable sessions={typedSessions.slice(0, 20)} />
    </div>
  );
}
