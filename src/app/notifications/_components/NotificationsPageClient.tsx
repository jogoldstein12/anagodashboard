"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotificationCard } from "./NotificationCard";
import { Bell, Mail, MessageSquare, Eye } from "lucide-react";
import { useState } from "react";

const CHANNELS = ["all", "telegram", "email"] as const;

export default function NotificationsPageClient() {
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const notifications = useQuery(api.notifications.list, 
    channelFilter === "all" ? {} : { channel: channelFilter }
  );
  const markRead = useMutation(api.notifications.markRead);

  if (notifications === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" description="All outbound notifications across channels" />
        <LoadingState variant="list" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" description="All outbound notifications across channels" />
        <EmptyState
          icon={<Bell className="w-12 h-12" />}
          message="No notifications yet. They'll appear here as agents send messages."
        />
      </div>
    );
  }

  // Stats
  const total = notifications.length;
  const telegramCount = notifications.filter((n: any) => n.channel === "telegram").length;
  const emailCount = notifications.filter((n: any) => n.channel === "email").length;
  const unread = notifications.filter((n: any) => n.status !== "read").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="All outbound notifications across channels" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Bell className="w-5 h-5" />} label="Total" value={total} />
        <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Telegram" value={telegramCount} />
        <StatCard icon={<Mail className="w-5 h-5" />} label="Email" value={emailCount} />
        <StatCard icon={<Eye className="w-5 h-5" />} label="Unread" value={unread} />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          {CHANNELS.map((c) => (
            <option key={c} value={c}>{c === "all" ? "All Channels" : c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {(notifications as any[]).map((n: any) => (
          <NotificationCard
            key={n._id}
            notification={n}
            onMarkRead={n.status !== "read" ? () => markRead({ id: n._id }) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
