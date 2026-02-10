"use client";

import { useState } from "react";
import { ActivityCard } from "./ActivityCard";
import { AGENTS, type AgentKey, ACTION_LABELS } from "@/lib/constants";

// Mock data for development
const MOCK_ACTIVITIES = [
  {
    _id: "1",
    agent: "anago",
    action: "task_completed",
    title: "First boot complete",
    description: "Met Josh, completed full setup with 6 models configured, Telegram paired, Reddit + Twitter logged in.",
    status: "completed",
    timestamp: Date.now() - 10 * 3600000,
  },
  {
    _id: "2",
    agent: "iq",
    action: "task_completed",
    title: "First activation run",
    description: "Completed competitor audit, voice profile analysis, and landing page review.",
    status: "completed",
    timestamp: Date.now() - 6 * 3600000,
  },
  {
    _id: "3",
    agent: "anago",
    action: "email_sent",
    title: "Sent Reddit comment opportunities",
    description: "Generated and emailed Reddit comment opportunities to Josh via gog CLI.",
    status: "completed",
    timestamp: Date.now() - 3.5 * 3600000,
  },
  {
    _id: "4",
    agent: "anago",
    action: "cron_executed",
    title: "Reddit cron job executed",
    description: "First successful execution of scheduled Reddit comment opportunities cron job.",
    status: "completed",
    timestamp: Date.now() - 3 * 3600000,
  },
  {
    _id: "5",
    agent: "anago",
    action: "task_completed",
    title: "Mission Control dashboard started",
    description: "Began building Mission Control dashboard with Next.js 15, Convex, and macOS glass UI.",
    status: "in_progress",
    timestamp: Date.now(),
  },
];

export function ActivityFeed() {
  const [agentFilter, setAgentFilter] = useState<string | undefined>();
  const [actionFilter, setActionFilter] = useState<string | undefined>();

  // Mock implementation for now
  const filteredActivities = MOCK_ACTIVITIES.filter(activity => {
    if (agentFilter && activity.agent !== agentFilter) return false;
    if (actionFilter && activity.action !== actionFilter) return false;
    return true;
  });
  const activities = filteredActivities;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Agent filter */}
        <select
          value={agentFilter ?? ""}
          onChange={(e) => setAgentFilter(e.target.value || undefined)}
          className="text-xs bg-white/[0.07] border border-white/[0.12] rounded-lg px-3 py-1.5 text-white/70 backdrop-blur-sm appearance-none cursor-pointer focus:outline-none focus:border-white/30"
        >
          <option value="">All Agents</option>
          {(Object.keys(AGENTS) as AgentKey[]).map((key) => (
            <option key={key} value={key}>
              {AGENTS[key].label}
            </option>
          ))}
        </select>

        {/* Action filter */}
        <select
          value={actionFilter ?? ""}
          onChange={(e) => setActionFilter(e.target.value || undefined)}
          className="text-xs bg-white/[0.07] border border-white/[0.12] rounded-lg px-3 py-1.5 text-white/70 backdrop-blur-sm appearance-none cursor-pointer focus:outline-none focus:border-white/30"
        >
          <option value="">All Actions</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {(agentFilter || actionFilter) && (
          <button
            onClick={() => {
              setAgentFilter(undefined);
              setActionFilter(undefined);
            }}
            className="text-[10px] text-white/40 hover:text-white/70 transition-colors px-2 py-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Activity List */}
      {activities === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-white/[0.04] animate-pulse"
            />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">
          No activities found
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity: any) => (
            <ActivityCard
              key={activity._id}
              agent={activity.agent}
              action={activity.action}
              title={activity.title}
              description={activity.description}
              status={activity.status}
              timestamp={activity.timestamp}
            />
          ))}
        </div>
      )}
    </div>
  );
}
