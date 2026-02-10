"use client";

import { ACTION_ICONS, STATUS_COLORS } from "@/lib/constants";
import { relativeTime } from "@/lib/utils";
import { AgentBadge } from "./AgentBadge";
import { GlassPanel } from "./GlassPanel";
import { CheckCircle } from "lucide-react";

interface ActivityCardProps {
  agent: string;
  action: string;
  title: string;
  description: string;
  status: string;
  timestamp: number;
}

export function ActivityCard({
  agent,
  action,
  title,
  description,
  status,
  timestamp,
}: ActivityCardProps) {
  const Icon = ACTION_ICONS[action] ?? CheckCircle;
  const statusColor = STATUS_COLORS[status] ?? "text-gray-400";

  return (
    <GlassPanel className="p-4 hover:bg-white/[0.10] transition-all duration-200 group">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center">
            <Icon className="w-4 h-4 text-white/60" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AgentBadge agent={agent} />
            <span className={`text-[10px] font-medium uppercase tracking-wider ${statusColor}`}>
              {status.replace("_", " ")}
            </span>
          </div>
          <h3 className="text-sm font-medium text-white/90 mb-1">{title}</h3>
          <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-white/30 flex-shrink-0 mt-1">
          {relativeTime(timestamp)}
        </span>
      </div>
    </GlassPanel>
  );
}
