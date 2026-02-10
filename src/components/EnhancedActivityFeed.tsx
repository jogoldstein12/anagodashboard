"use client";

import { useState, useEffect } from "react";
import { EnhancedActivityCard } from "./EnhancedActivityCard";
import { Badge } from "./ui/Badge";
import { LoadingState } from "./ui/LoadingState";
import { EmptyState } from "./ui/EmptyState";
import { AGENTS, type AgentKey, ACTION_LABELS, STATUS_COLORS } from "@/lib/constants";
import { Search, Filter, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Activity } from "@/lib/types";

interface FilterState {
  agent?: string;
  action?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Mock data for development
const MOCK_ACTIVITIES: Activity[] = [
  {
    _id: "1",
    agent: "anago",
    action: "task_completed",
    title: "First boot complete",
    description: "Met Josh, completed full setup with 6 models configured, Telegram paired, Reddit + Twitter logged in.",
    metadata: {
      commands: ["openclaw system status", "pnpm install", "convex deploy"],
      files: [
        { path: "/Users/anago/.openclaw/config.json", action: "created" },
        { path: "/Users/anago/Projects/mission-control/package.json", action: "modified" }
      ],
      codeWritten: `export function ActivityCard({ agent, action, title, description, status, timestamp }: ActivityCardProps) {
  const Icon = ACTION_ICONS[action] ?? CheckCircle;
  const statusColor = STATUS_COLORS[status] ?? "text-gray-400";

  return (
    <GlassPanel className="p-4 hover:bg-white/[0.10] transition-all duration-200 group">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center">
            <Icon className="w-4 h-4 text-white/60" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AgentBadge agent={agent} />
            <span className={\`text-[10px] font-medium uppercase tracking-wider \${statusColor}\`}>
              {status.replace("_", " ")}
            </span>
          </div>
          <h3 className="text-sm font-medium text-white/90 mb-1">{title}</h3>
          <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>
        <span className="text-[10px] text-white/30 flex-shrink-0 mt-1">
          {relativeTime(timestamp)}
        </span>
      </div>
    </GlassPanel>
  );
}`
    },
    status: "completed",
    timestamp: Date.now() - 10 * 3600000,
    duration: 1800000,
    tokensIn: 1500,
    tokensOut: 3200,
    cost: 0.0094,
    sessionId: "session_001"
  },
  {
    _id: "2",
    agent: "iq",
    action: "task_completed",
    title: "First activation run",
    description: "Completed competitor audit, voice profile analysis, and landing page review.",
    metadata: {
      commands: ["web_search 'competitor analysis'", "image analyze landing-page.png"],
      files: [
        { path: "/Users/anago/Projects/iq/analysis.md", action: "created" },
        { path: "/Users/anago/Projects/iq/voice-profile.json", action: "created" }
      ],
      codeWritten: `function analyzeCompetitors(competitors) {
  return competitors.map(comp => ({
    name: comp.name,
    strengths: comp.features.filter(f => f.score > 8),
    weaknesses: comp.features.filter(f => f.score < 5),
    opportunityScore: calculateOpportunity(comp)
  }));
}`
    },
    status: "completed",
    timestamp: Date.now() - 6 * 3600000,
    duration: 2400000,
    tokensIn: 2800,
    tokensOut: 4500,
    cost: 0.0146,
    sessionId: "session_002"
  },
  {
    _id: "3",
    agent: "anago",
    action: "email_sent",
    title: "Sent Reddit comment opportunities",
    description: "Generated and emailed Reddit comment opportunities to Josh via gog CLI.",
    metadata: {
      commands: ["gog email send --to=josh --subject='Reddit Opportunities'"],
      files: [
        { path: "/tmp/reddit-opportunities.md", action: "created" }
      ]
    },
    status: "completed",
    timestamp: Date.now() - 3.5 * 3600000,
    duration: 900000,
    tokensIn: 1200,
    tokensOut: 1800,
    cost: 0.006,
    sessionId: "session_003"
  },
  {
    _id: "4",
    agent: "anago",
    action: "cron_executed",
    title: "Reddit cron job executed",
    description: "First successful execution of scheduled Reddit comment opportunities cron job.",
    metadata: {
      commands: ["cron run reddit-scan", "node scripts/reddit-scanner.js"],
      processes: ["reddit-scanner", "node"]
    },
    status: "completed",
    timestamp: Date.now() - 3 * 3600000,
    duration: 300000,
    tokensIn: 800,
    tokensOut: 1200,
    cost: 0.004,
    sessionId: "session_004"
  },
  {
    _id: "5",
    agent: "anago",
    action: "task_completed",
    title: "Mission Control dashboard started",
    description: "Began building Mission Control dashboard with Next.js 15, Convex, and macOS glass UI.",
    metadata: {
      commands: ["next create mission-control", "convex init", "pnpm add tailwindcss"],
      files: [
        { path: "/Users/anago/Projects/mission-control/src/app/page.tsx", action: "created" },
        { path: "/Users/anago/Projects/mission-control/src/components/ActivityCard.tsx", action: "created" },
        { path: "/Users/anago/Projects/mission-control/convex/schema.ts", action: "created" }
      ],
      codeWritten: `export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Activity Feed</h1>
        <p className="text-sm text-white/40 mt-1">
          Every action across all agents, in real time
        </p>
      </div>
      <ActivityFeed />
    </div>
  );
}`
    },
    status: "in_progress",
    timestamp: Date.now(),
    duration: 3600000,
    tokensIn: 3500,
    tokensOut: 5200,
    cost: 0.0174,
    sessionId: "session_005"
  },
];

export function EnhancedActivityFeed() {
  const [filters, setFilters] = useState<FilterState>({});
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [isLoading, setIsLoading] = useState(false);

  // Mock implementation for now
  const filteredActivities = activities.filter(activity => {
    if (filters.agent && activity.agent !== filters.agent) return false;
    if (filters.action && activity.action !== filters.action) return false;
    if (filters.status && activity.status !== filters.status) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        activity.title.toLowerCase().includes(searchTerm) ||
        activity.description.toLowerCase().includes(searchTerm) ||
        activity.agent.toLowerCase().includes(searchTerm)
      );
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      if (activity.timestamp < start) return false;
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      if (activity.timestamp > end) return false;
    }
    return true;
  });

  // Mock stats calculation
  const stats = {
    totalActivities: filteredActivities.length,
    totalTokens: filteredActivities.reduce((sum, a) => sum + (a.tokensIn || 0) + (a.tokensOut || 0), 0),
    totalCost: filteredActivities.reduce((sum, a) => sum + (a.cost || 0), 0),
    byAgent: filteredActivities.reduce((acc, a) => {
      acc[a.agent] = (acc[a.agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: filteredActivities.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // Reset cursor when filters change
  useEffect(() => {
    setCursor(undefined);
    setHasMore(true);
  }, [filters]);

  const handleLoadMore = () => {
    // Mock load more - just show all activities
    setHasMore(false);
  };

  const clearFilters = () => {
    setFilters({});
    setCursor(undefined);
    setHasMore(true);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== "");

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search activities..."
            value={filters.search || ""}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.07] border border-white/[0.12] rounded-xl text-white/70 placeholder-white/30 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Agent filter pills */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-white/30">Agent:</span>
            {(Object.keys(AGENTS) as AgentKey[]).map((key) => {
              const agent = AGENTS[key];
              const isActive = filters.agent === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    agent: isActive ? undefined : key
                  }))}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg transition-colors",
                    isActive
                      ? `${agent.bg} text-white`
                      : "bg-white/[0.07] text-white/50 hover:bg-white/[0.12]"
                  )}
                >
                  {agent.label}
                </button>
              );
            })}
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-white/30">Status:</span>
            {["completed", "in_progress", "failed", "active"].map((status) => {
              const isActive = filters.status === status;
              const colorClass = STATUS_COLORS[status] || "text-gray-400";
              return (
                <button
                  key={status}
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    status: isActive ? undefined : status
                  }))}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg transition-colors",
                    isActive
                      ? "bg-white/[0.15] text-white"
                      : "bg-white/[0.07] text-white/50 hover:bg-white/[0.12]"
                  )}
                >
                  <span className={cn("mr-1", colorClass)}>●</span>
                  {status.replace("_", " ")}
                </button>
              );
            })}
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/[0.07] text-white/50 hover:bg-white/[0.12] rounded-lg transition-colors"
            >
              <Calendar className="w-3 h-3" />
              Date Range
            </button>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/[0.07] text-white/50 hover:bg-white/[0.12] rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>

        {/* Date picker dropdown */}
        {showDatePicker && (
          <div className="bg-white/[0.07] border border-white/[0.12] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Date Range</span>
              <button
                onClick={() => setShowDatePicker(false)}
                className="text-white/30 hover:text-white/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/30 mb-1">From</label>
                <input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm bg-white/[0.05] border border-white/[0.12] rounded-lg text-white/70"
                />
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1">To</label>
                <input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm bg-white/[0.05] border border-white/[0.12] rounded-lg text-white/70"
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white/[0.05] rounded-xl p-3">
            <div className="text-[10px] text-white/30 uppercase tracking-wider">Activities</div>
            <div className="text-lg font-semibold text-white/90">{stats.totalActivities}</div>
          </div>
          <div className="bg-white/[0.05] rounded-xl p-3">
            <div className="text-[10px] text-white/30 uppercase tracking-wider">Total Tokens</div>
            <div className="text-lg font-semibold text-white/90">{stats.totalTokens.toLocaleString()}</div>
          </div>
          <div className="bg-white/[0.05] rounded-xl p-3">
            <div className="text-[10px] text-white/30 uppercase tracking-wider">Estimated Cost</div>
            <div className="text-lg font-semibold text-white/90">${stats.totalCost.toFixed(2)}</div>
          </div>
          <div className="bg-white/[0.05] rounded-xl p-3">
            <div className="text-[10px] text-white/30 uppercase tracking-wider">Active Filters</div>
            <div className="text-lg font-semibold text-white/90">
              {Object.values(filters).filter(v => v !== undefined && v !== "").length}
            </div>
          </div>
        </div>
      </div>

      {/* Activity List */}
      {isLoading ? (
        <LoadingState variant="list" />
      ) : filteredActivities.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-8 h-8" />}
          message={hasActiveFilters ? "No activities match your filters" : "No activities yet"}
          action={hasActiveFilters ? {
            label: "Clear Filters",
            onClick: clearFilters
          } : undefined}
        />
      ) : (
        <>
          <div className="space-y-2">
            {filteredActivities.map((activity: Activity) => (
              <EnhancedActivityCard
                key={activity._id}
                activity={activity}
              />
            ))}
          </div>

          {/* Load More button */}
          {hasMore && filteredActivities.length >= 5 && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                className="px-4 py-2 text-sm font-medium text-white bg-white/[0.12] hover:bg-white/[0.18] rounded-xl transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}