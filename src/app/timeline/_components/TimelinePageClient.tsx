"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { AgentBadge } from "@/components/AgentBadge";
import { Badge } from "@/components/ui/Badge";
import { GlassPanel } from "@/components/GlassPanel";
import { relativeTime } from "@/lib/utils";
import { AGENT_EMOJI, type AgentKey } from "@/lib/constants";
import {
  GitCommit,
  Mail,
  Globe,
  FileText,
  Clock,
  Search as SearchIcon,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Zap,
  Filter,
} from "lucide-react";
import { useState, useMemo } from "react";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  email_sent: <Mail className="w-3.5 h-3.5" />,
  browser_action: <Globe className="w-3.5 h-3.5" />,
  file_created: <FileText className="w-3.5 h-3.5" />,
  cron_executed: <Clock className="w-3.5 h-3.5" />,
  search_performed: <SearchIcon className="w-3.5 h-3.5" />,
  message_sent: <MessageSquare className="w-3.5 h-3.5" />,
  task_completed: <CheckCircle className="w-3.5 h-3.5" />,
  reddit_browsed: <Globe className="w-3.5 h-3.5" />,
  error: <AlertTriangle className="w-3.5 h-3.5" />,
};

function groupByDate(activities: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  for (const a of activities) {
    const date = new Date(a.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(a);
  }
  return groups;
}

export default function TimelinePageClient() {
  const result = useQuery(api.activities.list, { limit: 100 });
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const activities = useMemo(() => {
    if (!result?.activities) return [];
    let filtered = result.activities as any[];
    if (agentFilter !== "all") filtered = filtered.filter((a) => a.agent === agentFilter);
    if (actionFilter !== "all") filtered = filtered.filter((a) => a.action === actionFilter);
    return filtered;
  }, [result, agentFilter, actionFilter]);

  const actionTypes = useMemo(() => {
    if (!result?.activities) return [];
    const types = new Set((result.activities as any[]).map((a: any) => a.action));
    return Array.from(types).sort();
  }, [result]);

  if (result === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader title="Timeline" description="Chronological log of all agent actions" />
        <LoadingState variant="list" />
      </div>
    );
  }

  const grouped = groupByDate(activities);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Timeline" description="Chronological log of all agent actions" />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-white/30" />
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none"
        >
          <option value="all">All Agents</option>
          <option value="anago">Anago</option>
          <option value="iq">IQ</option>
          <option value="greensea">GreenSea</option>
          <option value="courtside">Courtside</option>
          <option value="afterdark">After Dark</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none"
        >
          <option value="all">All Actions</option>
          {actionTypes.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      {activities.length === 0 ? (
        <EmptyState icon={<GitCommit className="w-12 h-12" />} message="No activity matches your filters." />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="text-xs font-medium text-white/30 uppercase tracking-wider">{date}</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <div className="relative ml-6">
                {/* Vertical line */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/[0.08]" />

                <div className="space-y-4">
                  {items.map((activity: any) => {
                    const emoji = AGENT_EMOJI[activity.agent as AgentKey] || "🤖";
                    const icon = ACTION_ICONS[activity.action] || <Zap className="w-3.5 h-3.5" />;
                    const time = new Date(activity.timestamp).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <div key={activity._id} className="relative pl-8">
                        {/* Dot on timeline */}
                        <div className="absolute left-[-5px] top-3 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-white/20" />

                        <GlassPanel className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <span className="text-white/40 mt-0.5">{icon}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs">{emoji}</span>
                                  <h4 className="text-sm font-medium text-white">{activity.title}</h4>
                                </div>
                                <p className="text-xs text-white/40 mt-1 line-clamp-2">{activity.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                              <Badge
                                variant={activity.status === "completed" ? "success" : activity.status === "failed" ? "error" : "info"}
                                size="sm"
                              >
                                {activity.status}
                              </Badge>
                              <span className="text-[10px] text-white/20 font-mono">{time}</span>
                            </div>
                          </div>

                          {/* Cost info if available */}
                          {(activity.tokensIn || activity.cost) && (
                            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/[0.06] text-[10px] text-white/20">
                              {activity.tokensIn && <span>↑{activity.tokensIn.toLocaleString()} tokens</span>}
                              {activity.tokensOut && <span>↓{activity.tokensOut.toLocaleString()} tokens</span>}
                              {activity.cost && <span>${activity.cost.toFixed(4)}</span>}
                              {activity.duration && <span>{(activity.duration / 1000).toFixed(1)}s</span>}
                            </div>
                          )}
                        </GlassPanel>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
