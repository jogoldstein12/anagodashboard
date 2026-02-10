"use client";

import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/GlassPanel";
import { AgentBadge } from "@/components/AgentBadge";
import { StatusDot } from "@/components/StatusDot";
import { Badge } from "@/components/ui/Badge";
import { AGENTS, AGENT_EMOJI, type AgentKey } from "@/lib/constants";
import { relativeTime } from "@/lib/utils";
import { Cpu, CheckCircle, Hash, Clock, ListTodo } from "lucide-react";
import type { Agent } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const router = useRouter();
  const agentTasks = useQuery(api.tasks.getByAgent, { agent: agent.agentId });
  const openTaskCount = agentTasks ? agentTasks.filter((t) => t.status !== "done").length : 0;
  const agentKey = agent.agentId as AgentKey;
  const agentInfo = AGENTS[agentKey];
  const emoji = AGENT_EMOJI[agentKey] || "🤖";
  
  const isActive = agent.status === "active";
  const isIdle = agent.status === "idle";
  const isOffline = agent.status === "offline";
  
  const statusVariant = isActive ? "success" : isIdle ? "warning" : "neutral";
  const trustLevelVariant = 
    agent.trustLevel === "L4" ? "success" :
    agent.trustLevel === "L3" ? "info" :
    agent.trustLevel === "L2" ? "warning" : "neutral";
  
  const handleClick = () => {
    router.push(`/agents/${agent.agentId}`);
  };
  
  return (
    <GlassPanel
      className={cn(
        "p-5 cursor-pointer transition-all duration-200",
        "hover:scale-[1.01] hover:bg-white/[0.10]",
        "border-l-4"
      )}
      style={{ borderLeftColor: agentInfo?.color || "#6b7280" }}
      onClick={handleClick}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{emoji}</div>
            <div>
              <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <AgentBadge agent={agent.agentId} />
                <Badge variant={trustLevelVariant} size="sm">
                  {agent.trustLevel}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <StatusDot active={isActive} />
            <Badge variant={statusVariant} size="sm">
              {agent.status}
            </Badge>
            {openTaskCount > 0 && (
              <Badge variant="info" size="sm">
                <ListTodo className="w-3 h-3 mr-1 inline" />
                {openTaskCount}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Model */}
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Cpu className="w-4 h-4" />
          <span className="font-mono">{agent.model}</span>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.05] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-3 h-3 text-white/40" />
              <div className="text-[10px] text-white/30 uppercase tracking-wider">Tasks Today</div>
            </div>
            <div className="text-xl font-semibold text-white">{agent.tasksToday}</div>
          </div>
          
          <div className="bg-white/[0.05] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-3 h-3 text-white/40" />
              <div className="text-[10px] text-white/30 uppercase tracking-wider">Tokens Today</div>
            </div>
            <div className="text-xl font-semibold text-white">
              {agent.tokensToday.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Current Task */}
        {agent.currentTask && (
          <div className="pt-3 border-t border-white/[0.12]">
            <div className="text-xs text-white/40 mb-1">Current Task</div>
            <p className="text-sm text-white/70 line-clamp-2">{agent.currentTask}</p>
          </div>
        )}
        
        {/* Last Active */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.12]">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Clock className="w-3 h-3" />
            Last active
          </div>
          <div className="text-xs text-white/60">
            {relativeTime(agent.lastActive)}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}