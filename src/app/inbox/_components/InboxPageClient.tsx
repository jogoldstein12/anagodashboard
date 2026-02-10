// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { AgentBadge } from "@/components/AgentBadge";
import { relativeTime } from "@/lib/utils";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Lightbulb,
  ListTodo,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  reddit_comment: { icon: <MessageSquare className="w-4 h-4" />, label: "Reddit Comment", color: "text-orange-400" },
  improvement: { icon: <Lightbulb className="w-4 h-4" />, label: "Improvement", color: "text-amber-400" },
  task_review: { icon: <ListTodo className="w-4 h-4" />, label: "Task Review", color: "text-blue-400" },
  general: { icon: <FileText className="w-4 h-4" />, label: "General", color: "text-white/50" },
};

const STATUS_FILTER = ["all", "pending", "approved", "rejected"] as const;

export default function InboxPageClient() {
  const approvals = useQuery(api.approvals.list, {});
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // These mutations may not exist yet — we'll add them
  let resolve: any;
  try {
    resolve = useMutation(api.approvals.resolve);
  } catch {
    resolve = null;
  }

  if (approvals === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader title="Inbox" description="Items waiting for your review and approval" />
        <LoadingState variant="list" />
      </div>
    );
  }

  const filtered = statusFilter === "all"
    ? approvals
    : approvals.filter((a: any) => a.status === statusFilter);

  const pendingCount = approvals.filter((a: any) => a.status === "pending").length;
  const approvedCount = approvals.filter((a: any) => a.status === "approved").length;
  const rejectedCount = approvals.filter((a: any) => a.status === "rejected").length;

  const handleResolve = async (id: string, status: "approved" | "rejected") => {
    if (resolve) {
      await resolve({ id, status });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Inbox" description="Items waiting for your review and approval" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={pendingCount} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Approved" value={approvedCount} />
        <StatCard icon={<XCircle className="w-5 h-5" />} label="Rejected" value={rejectedCount} />
        <StatCard icon={<Inbox className="w-5 h-5" />} label="Total" value={approvals.length} />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {STATUS_FILTER.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              statusFilter === s
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-white/[0.06] text-white/50 border border-white/[0.08] hover:text-white/70"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            {s === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500/30 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-12 h-12" />}
          message={statusFilter === "pending" ? "Nothing pending — you're all caught up! 🎉" : "No items match this filter."}
        />
      ) : (
        <div className="space-y-3">
          {(filtered as any[]).map((item: any) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;
            const isExpanded = expandedId === item._id;
            const isPending = item.status === "pending";

            return (
              <GlassPanel
                key={item._id}
                className={`p-5 transition-colors ${isPending ? "border-l-4 border-l-amber-500/50" : ""}`}
              >
                <div
                  className="cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={config.color}>{config.icon}</span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-white">{item.title}</h4>
                        <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <AgentBadge agent={item.agent} />
                      <Badge
                        variant={
                          item.status === "pending" ? "warning" :
                          item.status === "approved" ? "success" : "error"
                        }
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                      <span className="text-xs text-white/20">{relativeTime(item.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/[0.08]">
                    <div className="text-sm text-white/60 whitespace-pre-wrap mb-4">
                      {item.description}
                    </div>

                    {item.data && (
                      <div className="bg-white/[0.04] rounded-lg p-3 mb-4">
                        <pre className="text-xs text-white/50 font-mono whitespace-pre-wrap">
                          {typeof item.data === "string" ? item.data : JSON.stringify(item.data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {isPending && resolve && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleResolve(item._id, "approved")}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleResolve(item._id, "rejected")}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
