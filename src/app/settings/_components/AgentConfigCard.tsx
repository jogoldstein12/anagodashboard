"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { AgentBadge } from "@/components/AgentBadge";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/StatusDot";
import { AGENT_EMOJI, type AgentKey } from "@/lib/constants";
import { Cpu, Shield } from "lucide-react";
import type { Agent } from "@/lib/types";

interface AgentConfigCardProps {
  agent: Agent;
}

export function AgentConfigCard({ agent }: AgentConfigCardProps) {
  const emoji = AGENT_EMOJI[agent.agentId as AgentKey] || "🤖";
  const trustVariant =
    agent.trustLevel === "L4" ? "success" as const :
    agent.trustLevel === "L3" ? "info" as const :
    agent.trustLevel === "L2" ? "warning" as const : "neutral" as const;

  return (
    <GlassPanel className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h4 className="text-sm font-semibold text-white">{agent.name}</h4>
            <AgentBadge agent={agent.agentId} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot active={agent.status === "active"} />
          <Badge variant={agent.status === "active" ? "success" : "neutral"} size="sm">{agent.status}</Badge>
        </div>
      </div>

      {/* Config fields */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-white/[0.04] rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Cpu className="w-3.5 h-3.5" />
            Model
          </div>
          <span className="text-xs font-mono text-white/80">{agent.model}</span>
        </div>

        <div className="flex items-center justify-between bg-white/[0.04] rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Shield className="w-3.5 h-3.5" />
            Trust Level
          </div>
          <Badge variant={trustVariant} size="sm">{agent.trustLevel}</Badge>
        </div>

        <div className="flex items-center justify-between bg-white/[0.04] rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-white/50">
            Total Tasks
          </div>
          <span className="text-xs font-mono text-white/80">{agent.tasksTotal}</span>
        </div>
      </div>
    </GlassPanel>
  );
}
