"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { AgentBadge } from "@/components/AgentBadge";
import { Badge } from "@/components/ui/Badge";
import { relativeTime } from "@/lib/utils";
import { Clock, Calendar, PlayCircle, PauseCircle } from "lucide-react";

interface ScheduledTask {
  _id: string;
  name: string;
  agent: string;
  schedule: string;
  cronExpr: string;
  timezone: string;
  nextRun: number;
  lastRun?: number;
  status: string;
  description: string;
}

interface CronJobCardProps {
  task: ScheduledTask;
}

export function CronJobCard({ task }: CronJobCardProps) {
  const isActive = task.status === "active";
  const isPast = task.nextRun < Date.now();

  return (
    <GlassPanel className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive ? (
            <PlayCircle className="w-4 h-4 text-green-400" />
          ) : (
            <PauseCircle className="w-4 h-4 text-white/30" />
          )}
          <h4 className="text-sm font-medium text-white">{task.name}</h4>
        </div>
        <div className="flex items-center gap-2">
          <AgentBadge agent={task.agent} />
          <Badge variant={isActive ? "success" : "neutral"} size="sm">{task.status}</Badge>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-white/50">{task.description}</p>

      {/* Schedule info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.04] rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1">
            <Clock className="w-3 h-3" />
            Schedule
          </div>
          <div className="text-xs font-mono text-white/70">{task.schedule}</div>
          <div className="text-[10px] font-mono text-white/30 mt-0.5">{task.cronExpr} ({task.timezone})</div>
        </div>

        <div className="bg-white/[0.04] rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1">
            <Calendar className="w-3 h-3" />
            Next Run
          </div>
          <div className={`text-xs font-mono ${isPast ? "text-amber-400" : "text-white/70"}`}>
            {new Date(task.nextRun).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </div>
          {task.lastRun && (
            <div className="text-[10px] text-white/30 mt-0.5">Last: {relativeTime(task.lastRun)}</div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
