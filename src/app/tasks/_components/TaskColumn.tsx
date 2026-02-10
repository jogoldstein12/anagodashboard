"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { TaskCard } from "./TaskCard";
import type { Task } from "@/lib/types";

const COLUMN_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  backlog: { label: "Backlog", color: "bg-white/20", icon: "📋" },
  up_next: { label: "Up Next", color: "bg-amber-500/20", icon: "⏳" },
  in_progress: { label: "In Progress", color: "bg-blue-500/20", icon: "🔄" },
  done: { label: "Done", color: "bg-emerald-500/20", icon: "✅" },
};

interface TaskColumnProps {
  status: string;
  tasks: Task[];
}

export function TaskColumn({ status, tasks }: TaskColumnProps) {
  const config = COLUMN_CONFIG[status] || COLUMN_CONFIG.backlog;

  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="text-lg">{config.icon}</span>
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          {config.label}
        </h3>
        <span className={`ml-auto text-xs font-mono px-2 py-0.5 rounded-full ${config.color} text-white/70`}>
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-3 flex-1">
        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-white/20 text-sm">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
