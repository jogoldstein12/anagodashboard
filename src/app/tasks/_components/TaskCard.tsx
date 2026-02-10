"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { GlassPanel } from "@/components/GlassPanel";
import { AgentBadge } from "@/components/AgentBadge";
import { Badge } from "@/components/ui/Badge";
import { relativeTime } from "@/lib/utils";
import { Calendar, Clock, ChevronDown, ChevronUp, CheckCircle2, Circle, Loader2, ArrowRight } from "lucide-react";
import type { Task } from "@/lib/types";

const PRIORITY_CONFIG: Record<string, { variant: "error" | "warning" | "info" | "neutral"; label: string }> = {
  p0: { variant: "error", label: "P0" },
  p1: { variant: "warning", label: "P1" },
  p2: { variant: "info", label: "P2" },
  p3: { variant: "neutral", label: "P3" },
};

const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog", icon: "📋" },
  { value: "up_next", label: "Up Next", icon: "⏳" },
  { value: "in_progress", label: "In Progress", icon: "🔄" },
  { value: "done", label: "Done", icon: "✅" },
];

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const updateStatus = useMutation(api.tasks.updateStatus);

  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.p3;
  const isOverdue = task.dueDate && task.dueDate < Date.now() && task.status !== "done";

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.status === "done").length;
  const totalSubtasks = subtasks.length;
  const progressPct = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    if (statusMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [statusMenuOpen]);

  const handleStatusChange = async (newStatus: string) => {
    setStatusMenuOpen(false);
    if (newStatus === task.status) return;
    try {
      await updateStatus({ id: task._id as any, status: newStatus });
    } catch {
      // failed
    }
  };

  return (
    <GlassPanel className="p-4 space-y-3 hover:bg-white/[0.08] transition-colors cursor-pointer group">
      {/* Header: Priority + Agent */}
      <div className="flex items-center justify-between" onClick={() => onEdit?.(task)}>
        <Badge variant={priority.variant} size="sm">{priority.label}</Badge>
        <AgentBadge agent={task.agent} />
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-white leading-snug" onClick={() => onEdit?.(task)}>
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-white/50 line-clamp-2" onClick={() => onEdit?.(task)}>
          {task.description}
        </p>
      )}

      {/* Subtask Progress */}
      {totalSubtasks > 0 && (
        <div className="space-y-2">
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="flex items-center justify-between w-full text-xs text-white/60 hover:text-white/80 transition-colors"
          >
            <span>{completedSubtasks}/{totalSubtasks} subtasks</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                backgroundColor: progressPct === 100 ? "#22c55e" : progressPct > 50 ? "#3b82f6" : "#f59e0b",
              }}
            />
          </div>

          {/* Expanded subtask list */}
          {expanded && (
            <div className="space-y-1.5 pt-1">
              {subtasks.map((sub, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {sub.status === "done" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  ) : sub.status === "in_progress" ? (
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 animate-spin" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                  )}
                  <span className={sub.status === "done" ? "text-white/40 line-through" : "text-white/70"}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer: Due date + Quick Status + Created */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
        {task.dueDate ? (
          <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : "text-white/40"}`}>
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        ) : (
          <div />
        )}

        {/* Quick Status Change */}
        <div className="relative" ref={statusRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setStatusMenuOpen(!statusMenuOpen); }}
            className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
            title="Change status"
          >
            <ArrowRight className="w-3 h-3" />
            <Clock className="w-3 h-3" />
            {relativeTime(task.createdAt)}
          </button>
          {statusMenuOpen && (
            <div className="absolute right-0 bottom-full mb-1 z-20 w-40 bg-[#1a1a2e] border border-white/[0.12] rounded-lg shadow-xl overflow-hidden">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={(e) => { e.stopPropagation(); handleStatusChange(opt.value); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                    task.status === opt.value
                      ? "bg-white/[0.12] text-white"
                      : "text-white/60 hover:bg-white/[0.08] hover:text-white/90"
                  }`}
                >
                  <span>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
