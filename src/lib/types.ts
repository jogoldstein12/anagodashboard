// Shared TypeScript interfaces for Mission Control

export interface Agent {
  _id: string;
  agentId: string; // "anago" | "iq" | "greensea" | "courtside" | "afterdark"
  name: string;
  emoji: string;
  model: string;
  trustLevel: string; // "L1" | "L2" | "L3" | "L4"
  status: string; // "active" | "idle" | "offline"
  color: string;
  currentTask?: string;
  tokensToday: number;
  tasksToday: number;
  tasksTotal: number;
  lastActive: number;
}

export interface Subtask {
  title: string;
  status: string; // "done" | "in_progress" | "pending"
  completedAt?: number;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  agent: string;
  priority: string; // "p0" | "p1" | "p2" | "p3"
  status: string; // "backlog" | "up_next" | "in_progress" | "done"
  dueDate?: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  subtasks?: Subtask[];
}

export interface Session {
  _id: string;
  sessionId: string;
  sessionKey: string;
  agent: string;
  parentSessionId?: string;
  model: string;
  status: string; // "active" | "completed" | "error"
  startedAt: number;
  endedAt?: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  taskSummary?: string;
}

export interface Notification {
  _id: string;
  channel: string; // "telegram" | "email"
  recipient: string;
  subject?: string;
  content: string;
  status: string; // "sent" | "delivered" | "read"
  timestamp: number;
  activityId?: string;
}

export interface Activity {
  _id: string;
  agent: string;
  action: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  status: string;
  timestamp: number;
  duration?: number;
  tokensIn?: number;
  tokensOut?: number;
  cost?: number;
  sessionId?: string;
  parentActivityId?: string;
}

export interface Tab {
  label: string;
  value: string;
}

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface BadgeProps {
  variant: "success" | "warning" | "error" | "info" | "neutral";
  children: React.ReactNode;
  size?: "sm" | "md";
}

export interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface LoadingStateProps {
  variant: "card" | "list" | "grid";
}

export interface MiniChartProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export interface CodeBlockProps {
  code: string;
  language?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}