"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { getAgentConfig, PRIORITY_COLORS } from "@/lib/constants";
import { 
  ListTodo, 
  PlayCircle, 
  CheckCircle2, 
  AlertCircle, 
  LayoutGrid,
  List,
  Users,
  ArrowUpDown,
  Filter
} from "lucide-react";
import { useState } from "react";
import type { Task } from "@/lib/types";

type ViewMode = "kanban" | "list" | "byAgent";

const STATUSES = ["up_next", "in_progress", "done"] as const;
const PRIORITIES = ["all", "p0", "p1", "p2", "p3"] as const;

const STATUS_COLORS: Record<string, string> = {
  up_next: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  done: "bg-green-500/20 text-green-400 border-green-500/30",
  blocked: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_EMOJI: Record<string, string> = {
  up_next: "⬜",
  in_progress: "🔄",
  done: "✅",
  blocked: "🚫",
};

function TaskCard({ task }: { task: Task }) {
  const config = getAgentConfig(task.agent);
  
  return (
    <div className="bg-white/[0.04] hover:bg-white/[0.08] rounded-lg p-4 transition-colors cursor-pointer group">
      <div className="flex items-start gap-3">
        <span className="text-lg">{STATUS_EMOJI[task.status] || "⬜"}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white group-hover:text-white/90 line-clamp-2">
            {task.title}
          </h4>
          <p className="text-xs text-white/40 mt-1 line-clamp-2">
            {task.description}
          </p>
          
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge 
              variant={task.priority === "p0" ? "error" : task.priority === "p1" ? "warning" : "neutral"} 
              size="sm"
            >
              {task.priority.toUpperCase()}
            </Badge>
            
            <span 
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: `${config.color}20`,
                color: config.color,
              }}
            >
              <span>{config.emoji}</span>
              {config.label}
            </span>
            
            {task.dueDate && (
              <span className="text-[10px] text-white/30">
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TodosPageClient() {
  const allTasks = useQuery(api.tasks.list, {});
  const agents = useQuery(api.agents.list);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "priority">("priority");

  if (allTasks === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader title="Todo Tracker" description="Master task list from TODO.md" />
        <LoadingState variant="grid" />
      </div>
    );
  }

  if (allTasks.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Todo Tracker" description="Master task list from TODO.md" />
        <EmptyState
          icon={<ListTodo className="w-12 h-12" />}
          message="No tasks yet. Tasks from TODO.md will appear here after the next sync."
        />
      </div>
    );
  }

  // Apply filters
  let filtered: Task[] = allTasks as Task[];
  if (agentFilter !== "all") {
    filtered = filtered.filter((t) => t.agent === agentFilter);
  }
  if (statusFilter !== "all") {
    filtered = filtered.filter((t) => t.status === statusFilter);
  }
  if (priorityFilter !== "all") {
    filtered = filtered.filter((t) => t.priority === priorityFilter);
  }

  // Sort
  const priorityOrder: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
  filtered.sort((a, b) => {
    if (sortBy === "priority") {
      return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
    }
    return b._creationTime - a._creationTime;
  });

  // Stats
  const totalTasks = allTasks.length;
  const done = (allTasks as Task[]).filter((t) => t.status === "done").length;
  const inProgress = (allTasks as Task[]).filter((t) => t.status === "in_progress").length;
  const blocked = (allTasks as Task[]).filter((t) => t.status === "blocked").length;

  // Group by status for kanban
  const groupedByStatus: Record<string, Task[]> = {
    up_next: filtered.filter((t) => t.status === "up_next" || t.status === "backlog"),
    in_progress: filtered.filter((t) => t.status === "in_progress"),
    done: filtered.filter((t) => t.status === "done"),
  };

  // Group by agent for byAgent view
  const groupedByAgent: Record<string, Task[]> = {};
  if (viewMode === "byAgent") {
    for (const task of filtered) {
      if (!groupedByAgent[task.agent]) groupedByAgent[task.agent] = [];
      groupedByAgent[task.agent].push(task);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="📋 Todo Tracker" description="Master task list from TODO.md" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<ListTodo className="w-5 h-5" />} label="Total Tasks" value={totalTasks} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Done" value={done} />
        <StatCard icon={<PlayCircle className="w-5 h-5" />} label="In Progress" value={inProgress} />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Blocked" value={blocked} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white/[0.06] rounded-lg p-1">
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              viewMode === "kanban" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/70"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              viewMode === "list" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/70"
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setViewMode("byAgent")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              viewMode === "byAgent" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/70"
            }`}
          >
            <Users className="w-4 h-4" />
            By Agent
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="all">All Agents</option>
            {agents?.map((a) => (
              <option key={a.agentId} value={a.agentId}>{a.name} {a.emoji}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="all">All Statuses</option>
            <option value="up_next">⬜ Up Next</option>
            <option value="in_progress">🔄 In Progress</option>
            <option value="done">✅ Done</option>
            <option value="blocked">🚫 Blocked</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p === "all" ? "All Priorities" : p.toUpperCase()}</option>
            ))}
          </select>

          <button
            onClick={() => setSortBy(sortBy === "date" ? "priority" : "date")}
            className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/[0.10] transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortBy === "date" ? "Date" : "Priority"}
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATUSES.map((status) => (
            <GlassPanel key={status} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
                  {STATUS_EMOJI[status]} {status.replace("_", " ").toUpperCase()}
                </h3>
                <span className="text-xs text-white/40 bg-white/[0.06] px-2 py-1 rounded-full">
                  {groupedByStatus[status]?.length || 0}
                </span>
              </div>
              <div className="space-y-3">
                {groupedByStatus[status]?.map((task) => (
                  <TaskCard key={task._id} task={task} />
                ))}
                {groupedByStatus[status]?.length === 0 && (
                  <div className="text-center py-8 text-sm text-white/30">
                    No tasks
                  </div>
                )}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <GlassPanel className="p-6">
          <div className="space-y-3">
            {filtered.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-sm text-white/30">
                No tasks match your filters
              </div>
            )}
          </div>
        </GlassPanel>
      )}

      {/* By Agent View */}
      {viewMode === "byAgent" && (
        <div className="space-y-6">
          {Object.entries(groupedByAgent).map(([agentId, tasks]) => {
            const config = getAgentConfig(agentId);
            return (
              <GlassPanel key={agentId} className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">{config.emoji}</span>
                  <h3 className="text-base font-medium text-white">{config.label}</h3>
                  <span className="text-xs text-white/40 bg-white/[0.06] px-2 py-1 rounded-full ml-auto">
                    {tasks.length} tasks
                  </span>
                </div>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <TaskCard key={task._id} task={task} />
                  ))}
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
