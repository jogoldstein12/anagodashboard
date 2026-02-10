"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskColumn } from "./TaskColumn";
import { TaskModal } from "./TaskModal";
import { ListTodo, PlayCircle, CheckCircle2, AlertCircle, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { AGENTS, type AgentKey } from "@/lib/constants";
import type { Task } from "@/lib/types";

const STATUSES = ["backlog", "up_next", "in_progress", "done"] as const;
const PRIORITIES = ["all", "p0", "p1", "p2", "p3"] as const;

export default function TasksPageClient() {
  const allTasks = useQuery(api.tasks.list, {});
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "priority">("date");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleNewTask = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTask(null);
  };

  if (allTasks === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tasks" description="Kanban board for all agent tasks" action={{ label: "New Task", onClick: handleNewTask }} />
        <LoadingState variant="grid" />
      </div>
    );
  }

  if (allTasks.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tasks" description="Kanban board for all agent tasks" action={{ label: "New Task", onClick: handleNewTask }} />
        <EmptyState
          icon={<ListTodo className="w-12 h-12" />}
          message="No tasks yet. Click 'New Task' to create one."
        />
        <TaskModal isOpen={modalOpen} onClose={handleCloseModal} task={editingTask} />
      </div>
    );
  }

  // Apply filters
  let filtered: Task[] = allTasks as Task[];
  if (agentFilter !== "all") {
    filtered = filtered.filter((t) => t.agent === agentFilter);
  }
  if (priorityFilter !== "all") {
    filtered = filtered.filter((t) => t.priority === priorityFilter);
  }

  // Group by status
  const grouped: Record<string, Task[]> = {
    backlog: [],
    up_next: [],
    in_progress: [],
    done: [],
  };
  for (const task of filtered) {
    if (grouped[task.status]) {
      grouped[task.status].push(task);
    }
  }

  // Sort within each column
  const priorityOrder: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
  for (const status of Object.keys(grouped)) {
    grouped[status].sort((a, b) => {
      if (sortBy === "priority") {
        return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
      }
      // Sort by date: newest first; Done column sorts by completedAt
      if (status === "done") {
        return (b.completedAt ?? b.updatedAt) - (a.completedAt ?? a.updatedAt);
      }
      return b.createdAt - a.createdAt;
    });
  }

  // Stats
  const totalTasks = allTasks.length;
  const inProgress = (allTasks as Task[]).filter((t) => t.status === "in_progress").length;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const completedToday = (allTasks as Task[]).filter(
    (t) => t.status === "done" && t.completedAt && t.completedAt >= todayStart.getTime()
  ).length;
  const overdue = (allTasks as Task[]).filter(
    (t) => t.dueDate && t.dueDate < Date.now() && t.status !== "done"
  ).length;

  const agentKeys = Object.keys(AGENTS) as AgentKey[];

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description="Kanban board for all agent tasks" action={{ label: "New Task", onClick: handleNewTask }} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<ListTodo className="w-5 h-5" />} label="Total Tasks" value={totalTasks} />
        <StatCard icon={<PlayCircle className="w-5 h-5" />} label="In Progress" value={inProgress} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed Today" value={completedToday} />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Overdue" value={overdue} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="all">All Agents</option>
          {agentKeys.map((key) => (
            <option key={key} value={key}>{AGENTS[key].label}</option>
          ))}
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
          Sort: {sortBy === "date" ? "Date" : "Priority"}
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATUSES.map((status) => (
          <TaskColumn key={status} status={status} tasks={grouped[status]} onEditTask={handleEditTask} />
        ))}
      </div>

      {/* Task Modal */}
      <TaskModal isOpen={modalOpen} onClose={handleCloseModal} task={editingTask} />
    </div>
  );
}
