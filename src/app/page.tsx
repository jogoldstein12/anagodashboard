"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { GlassPanel } from "@/components/GlassPanel";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { AgentBadge } from "@/components/AgentBadge";
import { StatusDot } from "@/components/StatusDot";
import { EnhancedActivityCard } from "@/components/EnhancedActivityCard";
import { relativeTime } from "@/lib/utils";
import { AGENTS, AGENT_EMOJI, type AgentKey } from "@/lib/constants";
import {
  Sun,
  Moon,
  CloudSun,
  Activity,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Users,
  ListTodo,
  Calendar,
  ArrowRight,
  Zap,
  Bell,
} from "lucide-react";
import Link from "next/link";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", icon: <Sun className="w-6 h-6 text-amber-400" /> };
  if (hour < 17) return { text: "Good afternoon", icon: <CloudSun className="w-6 h-6 text-orange-400" /> };
  return { text: "Good evening", icon: <Moon className="w-6 h-6 text-indigo-400" /> };
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function MorningBriefing() {
  const agents = useQuery(api.agents.list) || [];
  const activities = useQuery(api.activities.list, { limit: 10 });
  const allTasks = useQuery(api.tasks.list, {}) || [];
  const scheduledTasks = useQuery(api.scheduledTasks.list, {}) || [];
  const notifications = useQuery(api.notifications.list, { limit: 5 }) || [];

  const greeting = getGreeting();
  const activeAgents = agents.filter((a) => a.status === "active");
  const inProgressTasks = allTasks.filter((t: any) => t.status === "in_progress");
  const pendingTasks = allTasks.filter((t: any) => t.status === "up_next");
  const completedToday = allTasks.filter((t: any) => {
    if (t.status !== "done" || !t.completedAt) return false;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return t.completedAt >= todayStart.getTime();
  });

  // Overnight activities (since midnight)
  const midnightMs = new Date().setHours(0, 0, 0, 0);
  const overnightActivities = (activities?.activities || []).filter(
    (a: any) => a.timestamp >= midnightMs
  );

  // Today's cron jobs
  const now = new Date();
  const todayJobs = scheduledTasks.filter((t: any) => {
    if (t.status !== "active") return false;
    return true; // Show all active cron jobs
  });

  // Total cost today (from agents)
  const totalCostToday = agents.reduce((sum, a) => sum + (a.costToday || 0), 0);
  const totalTokensToday = agents.reduce((sum, a) => sum + (a.tokensToday || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl w-full">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {greeting.icon}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-white truncate">
              {greeting.text}, Josh
            </h1>
            <p className="text-sm text-white/40 mt-0.5">{formatDate()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/40">
          <StatusDot active={true} />
          <span>{activeAgents.length} agents online</span>
        </div>
      </div>

      {/* Quick Stats - 2 cols on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Active Agents"
          value={activeAgents.length}
        />
        <StatCard
          icon={<ListTodo className="w-5 h-5" />}
          label="In Progress"
          value={inProgressTasks.length}
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completed Today"
          value={completedToday.length}
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Cost Today"
          value={totalCostToday > 0 ? `$${totalCostToday.toFixed(2)}` : "—"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Needs Attention + Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Needs Your Attention */}
          {(pendingTasks.length > 0 || inProgressTasks.length > 0) && (
            <GlassPanel className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-medium text-white">Needs Your Attention</h2>
                </div>
                <Link href="/tasks" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {[...inProgressTasks, ...pendingTasks].slice(0, 5).map((task: any) => {
                  const priorityColors: Record<string, string> = {
                    p0: "bg-red-500/20 text-red-400",
                    p1: "bg-amber-500/20 text-amber-400",
                    p2: "bg-blue-500/20 text-blue-400",
                    p3: "bg-white/10 text-white/50",
                  };
                  return (
                    <div
                      key={task._id}
                      className="flex items-center gap-3 bg-white/[0.04] rounded-lg px-3 py-2.5"
                    >
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priorityColors[task.priority] || priorityColors.p3}`}>
                        {task.priority.toUpperCase()}
                      </span>
                      <span className="text-sm text-white/80 flex-1 truncate">{task.title}</span>
                      <AgentBadge agent={task.agent} />
                      <Badge
                        variant={task.status === "in_progress" ? "info" : "warning"}
                        size="sm"
                      >
                        {task.status === "in_progress" ? "Active" : "Up Next"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>
          )}

          {/* Overnight Summary */}
          <GlassPanel className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-medium text-white">
                  {new Date().getHours() < 12 ? "Overnight Summary" : "Today's Activity"}
                </h2>
              </div>
              <Link href="/activity" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Full feed <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {overnightActivities.length > 0 ? (
              <div className="space-y-2">
                {overnightActivities.slice(0, 6).map((activity: any) => (
                  <EnhancedActivityCard key={activity._id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-white/30">
                No activity yet today
              </div>
            )}
          </GlassPanel>
        </div>

        {/* Right column: Schedule + Agents */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <GlassPanel className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-medium text-white">Today&apos;s Schedule</h2>
              </div>
              <Link href="/calendar" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Calendar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {todayJobs.length > 0 ? (
                todayJobs.slice(0, 8).map((job: any) => (
                  <div
                    key={job._id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <Clock className="w-3 h-3 text-white/20 flex-shrink-0" />
                    <span className="text-white/60 flex-1 truncate">{job.name}</span>
                    <span className="text-[10px] text-white/30 font-mono">{job.schedule}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-white/30">
                  No scheduled tasks
                </div>
              )}
            </div>
          </GlassPanel>

          {/* Agent Status */}
          <GlassPanel className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" />
                <h2 className="text-sm font-medium text-white">Agent Status</h2>
              </div>
              <Link href="/agents" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Details <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {agents.map((agent) => {
                const agentKey = agent.agentId as AgentKey;
                const emoji = AGENT_EMOJI[agentKey] || "🤖";
                return (
                  <Link
                    key={agent._id}
                    href={`/agents/${agent.agentId}`}
                    className="flex items-center gap-3 hover:bg-white/[0.04] rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                  >
                    <span className="text-sm">{emoji}</span>
                    <span className="text-sm text-white/80 flex-1">{agent.name}</span>
                    <StatusDot active={agent.status === "active"} />
                    {agent.currentTask && (
                      <span className="text-[10px] text-white/30 truncate max-w-[80px] sm:max-w-[120px]">
                        {agent.currentTask}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </GlassPanel>

          {/* Recent Notifications */}
          <GlassPanel className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-pink-400" />
                <h2 className="text-sm font-medium text-white">Recent Notifications</h2>
              </div>
              <Link href="/notifications" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 4).map((notif: any) => (
                <div key={notif._id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={notif.channel === "telegram" ? "info" : "neutral"} size="sm">
                      {notif.channel}
                    </Badge>
                    <span className="text-white/60 truncate flex-1 max-w-[120px] sm:max-w-none">{notif.subject || notif.content.slice(0, 50)}</span>
                  </div>
                  <div className="text-[10px] text-white/20 mt-0.5 pl-[52px]">
                    {relativeTime(notif.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
