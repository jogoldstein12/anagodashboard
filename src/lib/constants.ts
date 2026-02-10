import {
  Mail,
  Globe,
  FileText,
  Clock,
  Search,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

export const AGENTS = {
  anago: { label: "Anago", color: "#3b82f6", bg: "bg-blue-500", dot: "bg-blue-400" },
  iq: { label: "IQ", color: "#22c55e", bg: "bg-green-500", dot: "bg-green-400" },
  greensea: { label: "GreenSea", color: "#10b981", bg: "bg-emerald-500", dot: "bg-emerald-400" },
  courtside: { label: "Courtside", color: "#f97316", bg: "bg-orange-500", dot: "bg-orange-400" },
  afterdark: { label: "After Dark", color: "#a855f7", bg: "bg-purple-500", dot: "bg-purple-400" },
} as const;

export type AgentKey = keyof typeof AGENTS;

export const AGENT_EMOJI: Record<AgentKey, string> = {
  anago: "🍣",
  iq: "🧠",
  greensea: "🌊",
  courtside: "🏀",
  afterdark: "🌙",
};

export const ACTION_ICONS: Record<string, LucideIcon> = {
  email_sent: Mail,
  reddit_browsed: Globe,
  file_created: FileText,
  cron_executed: Clock,
  search_performed: Search,
  browser_action: Globe,
  message_sent: MessageSquare,
  task_completed: CheckCircle,
  error: AlertTriangle,
};

export const ACTION_LABELS: Record<string, string> = {
  email_sent: "Email Sent",
  reddit_browsed: "Reddit Browsed",
  file_created: "File Created",
  cron_executed: "Cron Executed",
  search_performed: "Search",
  browser_action: "Browser Action",
  message_sent: "Message Sent",
  task_completed: "Task Completed",
  error: "Error",
};

export const STATUS_COLORS: Record<string, string> = {
  completed: "text-green-400",
  in_progress: "text-amber-400",
  failed: "text-red-400",
  active: "text-green-400",
  paused: "text-gray-400",
};

export const PRIORITY_COLORS: Record<string, string> = {
  p0: "bg-red-500/20 text-red-400 border-red-500/30",
  p1: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  p2: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  p3: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export const PRIORITY_LABELS: Record<string, string> = {
  p0: "P0 - Critical",
  p1: "P1 - High",
  p2: "P2 - Medium",
  p3: "P3 - Low",
};

export const DOC_TYPE_ICONS: Record<string, LucideIcon> = {
  memory: Clock,
  document: FileText,
  task: CheckCircle,
  activity: MessageSquare,
};

export const BADGE_VARIANTS = {
  success: "bg-green-500/20 text-green-400 border-green-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  neutral: "bg-gray-500/20 text-gray-400 border-gray-500/30",
} as const;
