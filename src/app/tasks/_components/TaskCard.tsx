"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { AgentBadge } from "@/components/AgentBadge";
import { Badge } from "@/components/ui/Badge";
import { relativeTime } from "@/lib/utils";
import { Calendar, Clock } from "lucide-react";
import type { Task } from "@/lib/types";

const PRIORITY_CONFIG: Record<string, { variant: "error" | "warning" | "info" | "neutral"; label: string }> = {
  p0: { variant: "error", label: "P0" },
  p1: { variant: "warning", label: "P1" },
  p2: { variant: "info", label: "P2" },
  p3: { variant: "neutral", label: "P3" },
};

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.p3;
  const isOverdue = task.dueDate && task.dueDate < Date.now() && task.status !== "done";

  return (
    <GlassPanel className="p-4 space-y-3 hover:bg-white/[0.08] transition-colors">
      {/* Header: Priority + Agent */}
      <div className="flex items-center justify-between">
        <Badge variant={priority.variant} size="sm">{priority.label}</Badge>
        <AgentBadge agent={task.agent} />
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-white leading-snug">{task.title}</h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-white/50 line-clamp-2">{task.description}</p>
      )}

      {/* Footer: Due date + Created */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
        {task.dueDate ? (
          <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : "text-white/40"}`}>
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-1 text-xs text-white/30">
          <Clock className="w-3 h-3" />
          {relativeTime(task.createdAt)}
        </div>
      </div>
    </GlassPanel>
  );
}
