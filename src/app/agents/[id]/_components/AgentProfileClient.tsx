"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { EnhancedActivityCard } from "@/components/EnhancedActivityCard";
import { AgentBadge } from "@/components/AgentBadge";
import { StatusDot } from "@/components/StatusDot";
import { AGENTS, AGENT_EMOJI, type AgentKey } from "@/lib/constants";
import { relativeTime } from "@/lib/utils";
import { 
  Cpu, 
  Shield, 
  Activity as ActivityIcon, 
  Clock, 
  Hash, 
  CheckCircle, 
  DollarSign,
  Terminal,
  Brain,
  Settings,
  FileText,
  ListTodo
} from "lucide-react";
import type { Agent, Activity, Session } from "@/lib/types";

export function AgentProfileClient() {
  const params = useParams();
  const agentId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");
  
  const agent = useQuery(api.agents.get, { agentId });
  const activities = useQuery(api.activities.list, { 
    agent: agentId,
    limit: 10 
  });
  const sessions = useQuery(api.sessions.list, { 
    agent: agentId,
    limit: 10 
  });
  const agentTasks = useQuery(api.tasks.getByAgent, { agent: agentId });
  
  if (agent === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agent Profile" />
        <LoadingState variant="card" />
      </div>
    );
  }
  
  if (!agent) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agent Profile" />
        <EmptyState
          icon={<ActivityIcon className="w-12 h-12" />}
          message={`Agent "${agentId}" not found.`}
        />
      </div>
    );
  }
  
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
  
  const tabs = [
    { label: "Overview", value: "overview" },
    { label: "Activity", value: "activity" },
    { label: "Sessions", value: "sessions" },
    { label: "Memory", value: "memory" },
    { label: "Config", value: "config" },
  ];
  
  // Calculate weekly tasks (placeholder - would need actual data)
  const weeklyTasks = Math.floor(agent.tasksToday * 3.5);
  const weeklyTokens = Math.floor(agent.tokensToday * 3.5);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{emoji}</div>
          <div>
            <h1 className="text-2xl font-semibold text-white">{agent.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <AgentBadge agent={agent.agentId} />
              <div className="flex items-center gap-2">
                <StatusDot active={isActive} />
                <Badge variant={statusVariant} size="sm">
                  {agent.status}
                </Badge>
              </div>
              <Badge variant={trustLevelVariant} size="sm">
                {agent.trustLevel}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm text-white/60">
          <Cpu className="w-4 h-4" />
          <span className="font-mono">{agent.model}</span>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs 
        tabs={tabs} 
        activeTab={activeTab} 
        onChange={setActiveTab}
      />
      
      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<CheckCircle className="w-4 h-4" />}
                label="Tasks Today"
                value={agent.tasksToday}
                trend={{ value: 12, isPositive: true }}
              />
              <StatCard
                icon={<Hash className="w-4 h-4" />}
                label="Tokens Today"
                value={agent.tokensToday.toLocaleString()}
                trend={{ value: 8, isPositive: true }}
              />
              <StatCard
                icon={<CheckCircle className="w-4 h-4" />}
                label="Total Tasks"
                value={agent.tasksTotal}
              />
              <StatCard
                icon={<DollarSign className="w-4 h-4" />}
                label="Weekly Cost"
                value={`$${(weeklyTokens * 0.000002).toFixed(2)}`}
              />
            </div>
            
            {/* Current Task */}
            {agent.currentTask && (
              <div className="bg-white/[0.07] border border-white/[0.12] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ActivityIcon className="w-4 h-4 text-white/60" />
                  <h3 className="text-sm font-medium text-white">Current Task</h3>
                </div>
                <p className="text-white/70">{agent.currentTask}</p>
              </div>
            )}
            
            {/* Agent Tasks */}
            {agentTasks && agentTasks.length > 0 && (() => {
              const tasksByStatus: Record<string, typeof agentTasks> = {
                in_progress: [],
                up_next: [],
                backlog: [],
                done: [],
              };
              for (const t of agentTasks) {
                if (tasksByStatus[t.status]) tasksByStatus[t.status].push(t);
              }
              const openTasks = agentTasks.filter((t) => t.status !== "done").length;
              const doneTasks = agentTasks.filter((t) => t.status === "done").length;
              const allSubtasks = agentTasks.flatMap((t) => (t as any).subtasks || []);
              const remainingSubtasks = allSubtasks.filter((s: any) => s.status !== "done").length;

              const statusLabels: Record<string, string> = {
                in_progress: "In Progress",
                up_next: "Up Next",
                backlog: "Backlog",
                done: "Done",
              };
              const statusColors: Record<string, string> = {
                in_progress: "text-blue-400",
                up_next: "text-amber-400",
                backlog: "text-white/40",
                done: "text-green-400",
              };
              const priorityColors: Record<string, string> = {
                p0: "bg-red-500/20 text-red-400",
                p1: "bg-amber-500/20 text-amber-400",
                p2: "bg-blue-500/20 text-blue-400",
                p3: "bg-white/10 text-white/50",
              };

              return (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-white/60" />
                      <h3 className="text-sm font-medium text-white">Tasks</h3>
                    </div>
                    <span className="text-xs text-white/40">
                      {doneTasks}/{agentTasks.length} complete{remainingSubtasks > 0 ? ` · ${remainingSubtasks} subtasks remaining` : ""}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {(["in_progress", "up_next", "backlog", "done"] as const).map((status) => {
                      const tasks = tasksByStatus[status];
                      if (tasks.length === 0) return null;
                      return (
                        <div key={status}>
                          <div className={`text-xs font-medium mb-2 ${statusColors[status]}`}>
                            {statusLabels[status]} ({tasks.length})
                          </div>
                          <div className="space-y-1.5">
                            {tasks.map((t) => (
                              <div key={t._id} className="flex items-center gap-3 bg-white/[0.05] rounded-lg px-3 py-2">
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priorityColors[t.priority] || priorityColors.p3}`}>
                                  {t.priority.toUpperCase()}
                                </span>
                                <span className={`text-sm flex-1 ${status === "done" ? "text-white/40 line-through" : "text-white/80"}`}>
                                  {t.title}
                                </span>
                                <span className="text-xs text-white/30">{relativeTime(t.updatedAt)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Recent Activity */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-white/60" />
                <h3 className="text-sm font-medium text-white">Recent Activity</h3>
              </div>
              
              {activities?.activities && activities.activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.activities.slice(0, 5).map((activity) => (
                    <EnhancedActivityCard key={activity._id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="bg-white/[0.07] border border-white/[0.12] rounded-xl p-8 text-center">
                  <p className="text-white/40">No recent activity</p>
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === "activity" && (
          <div>
            {activities?.activities && activities.activities.length > 0 ? (
              <div className="space-y-3">
                {activities.activities.map((activity) => (
                  <EnhancedActivityCard key={activity._id} activity={activity} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ActivityIcon className="w-12 h-12" />}
                message="No activity found for this agent."
              />
            )}
          </div>
        )}
        
        {activeTab === "sessions" && (
          <div>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session._id}
                    className="bg-white/[0.07] border border-white/[0.12] rounded-xl p-4 hover:bg-white/[0.10] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-white/60" />
                        <span className="text-sm font-medium text-white">
                          {session.sessionId.slice(0, 8)}...
                        </span>
                      </div>
                      <Badge 
                        variant={
                          session.status === "active" ? "success" :
                          session.status === "completed" ? "info" : "error"
                        }
                        size="sm"
                      >
                        {session.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <div className="text-white/30">Duration</div>
                        <div className="text-white/70">
                          {session.endedAt 
                            ? `${Math.round((session.endedAt - session.startedAt) / 60000)}m`
                            : "Active"
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-white/30">Tokens</div>
                        <div className="text-white/70">
                          {(session.tokensIn + session.tokensOut).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/30">Cost</div>
                        <div className="text-white/70">
                          ${session.cost.toFixed(4)}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/30">Started</div>
                        <div className="text-white/70">
                          {relativeTime(session.startedAt)}
                        </div>
                      </div>
                    </div>
                    
                    {session.taskSummary && (
                      <div className="mt-3 pt-3 border-t border-white/[0.12]">
                        <div className="text-xs text-white/30">Task Summary</div>
                        <p className="text-sm text-white/60 mt-1 line-clamp-2">
                          {session.taskSummary}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Terminal className="w-12 h-12" />}
                message="No sessions found for this agent."
              />
            )}
          </div>
        )}
        
        {activeTab === "memory" && (
          <EmptyState
            icon={<Brain className="w-12 h-12" />}
            message="Memory browser coming soon. This will display agent-specific memory files."
          />
        )}
        
        {activeTab === "config" && (
          <div className="space-y-4">
            <div className="bg-white/[0.07] border border-white/[0.12] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-white/60" />
                <h3 className="text-sm font-medium text-white">Agent Configuration</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-white/30 mb-1">Agent ID</div>
                    <div className="text-sm text-white/90 font-mono">{agent.agentId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/30 mb-1">Name</div>
                    <div className="text-sm text-white/90">{agent.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/30 mb-1">Model</div>
                    <div className="text-sm text-white/90 font-mono">{agent.model}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/30 mb-1">Trust Level</div>
                    <div className="text-sm text-white/90">{agent.trustLevel}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/30 mb-1">Status</div>
                    <div className="text-sm text-white/90">{agent.status}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/30 mb-1">Color</div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: agent.color }}
                      />
                      <span className="text-sm text-white/90 font-mono">{agent.color}</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/[0.12]">
                  <div className="text-xs text-white/30 mb-1">Last Active</div>
                  <div className="text-sm text-white/90">
                    {new Date(agent.lastActive).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/[0.07] border border-white/[0.12] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-white/60" />
                <h3 className="text-sm font-medium text-white">Permissions & Tools</h3>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm text-white/60">
                  Agent has access to all standard tools based on trust level {agent.trustLevel}.
                </div>
                <div className="text-xs text-white/40">
                  • File system access (read/write)
                  <br />
                  • Browser automation
                  <br />
                  • Email sending
                  <br />
                  • Command execution
                  <br />
                  • Web search
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}