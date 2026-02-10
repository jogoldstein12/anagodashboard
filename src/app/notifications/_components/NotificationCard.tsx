"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { relativeTime } from "@/lib/utils";
import { Mail, MessageSquare, Bell, CheckCircle, Eye, Send } from "lucide-react";

interface NotificationData {
  _id: string;
  channel: string;
  recipient: string;
  subject?: string;
  content: string;
  status: string;
  timestamp: number;
}

const CHANNEL_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  telegram: { icon: <MessageSquare className="w-4 h-4" />, label: "Telegram", color: "#0088cc" },
  email: { icon: <Mail className="w-4 h-4" />, label: "Email", color: "#ea4335" },
};

const STATUS_CONFIG: Record<string, { variant: "info" | "success" | "neutral"; icon: React.ReactNode }> = {
  sent: { variant: "info", icon: <Send className="w-3 h-3" /> },
  delivered: { variant: "success", icon: <CheckCircle className="w-3 h-3" /> },
  read: { variant: "neutral", icon: <Eye className="w-3 h-3" /> },
};

interface NotificationCardProps {
  notification: NotificationData;
  onMarkRead?: () => void;
}

export function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const channel = CHANNEL_CONFIG[notification.channel] || { icon: <Bell className="w-4 h-4" />, label: notification.channel, color: "#6b7280" };
  const status = STATUS_CONFIG[notification.status] || STATUS_CONFIG.sent;
  const isUnread = notification.status !== "read";

  return (
    <GlassPanel className={`p-4 space-y-3 transition-colors ${isUnread ? "bg-white/[0.06] border-l-2" : ""}`} style={isUnread ? { borderLeftColor: channel.color } : undefined}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div style={{ color: channel.color }}>{channel.icon}</div>
          <span className="text-xs font-medium text-white/60">{channel.label}</span>
          <span className="text-xs text-white/30">→ {notification.recipient}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant} size="sm">
            <span className="flex items-center gap-1">{status.icon} {notification.status}</span>
          </Badge>
          {isUnread && onMarkRead && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Mark read
            </button>
          )}
        </div>
      </div>

      {/* Subject */}
      {notification.subject && (
        <h4 className="text-sm font-medium text-white">{notification.subject}</h4>
      )}

      {/* Content */}
      <p className="text-sm text-white/60 line-clamp-3">{notification.content}</p>

      {/* Timestamp */}
      <div className="text-xs text-white/30">{relativeTime(notification.timestamp)}</div>
    </GlassPanel>
  );
}
