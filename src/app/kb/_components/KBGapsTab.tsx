"use client";

import { useState } from "react";
import { GlassPanel } from "@/components/GlassPanel";
import { AlertCircle, Clock, Loader2, CheckCircle, Play, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface KBGapsTabProps {
  snapshot: any;
}

function getGapTypeColor(type: string): string {
  switch (type?.toLowerCase()) {
    case "empty":
      return "bg-red-400/20 text-red-400 border-red-400/30";
    case "stale":
      return "bg-amber-400/20 text-amber-400 border-amber-400/30";
    case "shallow":
      return "bg-yellow-400/20 text-yellow-400 border-yellow-400/30";
    default:
      return "bg-white/10 text-white/60 border-white/20";
  }
}

function getPriorityDots(priority: number): string {
  const dots = "●".repeat(priority) + "○".repeat(5 - priority);
  return dots;
}

async function triggerResearch(topic: string, priority: number) {
  try {
    const res = await fetch("/api/kb/trigger-research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, priority, method: "deep_research" }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export function KBGapsTab({ snapshot }: KBGapsTabProps) {
  const [triggering, setTriggering] = useState<string | null>(null);
  
  const gaps = snapshot?.gaps || [];
  const researchJobs = snapshot?.research_jobs || [];
  
  const runningJobs = researchJobs.filter((j: any) => j.status === "running");
  const queuedJobs = researchJobs.filter((j: any) => j.status === "queued");
  const completedToday = researchJobs.filter((j: any) => {
    if (j.status !== "completed") return false;
    const completed = new Date(j.completed_at || j.updated_at);
    const today = new Date();
    return completed.toDateString() === today.toDateString();
  });

  const handleTrigger = async (gap: any) => {
    setTriggering(gap.topic);
    await triggerResearch(gap.topic, gap.priority || 3);
    setTriggering(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel - Open Gaps */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-semibold text-white">
            Open Knowledge Gaps ({gaps.length})
          </h2>
        </div>

        {gaps.length > 0 ? (
          <div className="space-y-3">
            {gaps.map((gap: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-white/90">{gap.topic}</h3>
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded-full border",
                        getGapTypeColor(gap.gap_type)
                      )}>
                        {gap.gap_type || "unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/50">
                      <span className={cn(
                        "font-mono",
                        gap.priority <= 2 ? "text-red-400" : gap.priority <= 3 ? "text-amber-400" : "text-white/50"
                      )}>
                        P{gap.priority || 5}
                      </span>
                      <span>{getPriorityDots(gap.priority || 3)}</span>
                      <span>·</span>
                      <span>{gap.days_since_research || 0} days since research</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTrigger(gap)}
                    disabled={triggering === gap.topic}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20 transition-colors text-sm disabled:opacity-50"
                  >
                    {triggering === gap.topic ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    {gap.gap_type === "stale" ? "Refresh" : "Research"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🟢</div>
            <p className="text-white/60">No gaps — KB is fully covered</p>
          </div>
        )}
      </GlassPanel>

      {/* Right Panel - Research Queue */}
      <div className="space-y-4">
        {/* Running Jobs */}
        {runningJobs.length > 0 && (
          <GlassPanel className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              <h2 className="text-lg font-semibold text-white">Running</h2>
            </div>
            <div className="space-y-2">
              {runningJobs.map((job: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04]"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="flex-1 text-white/80 text-sm">{job.topic}</span>
                  <span className="text-xs text-white/40">{job.method}</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        )}

        {/* Queued Jobs */}
        {queuedJobs.length > 0 && (
          <GlassPanel className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">
                Queued ({queuedJobs.length})
              </h2>
            </div>
            <div className="space-y-2">
              {queuedJobs.map((job: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04]"
                >
                  <span className="flex-1 text-white/80 text-sm">{job.topic}</span>
                  <span className="px-2 py-0.5 text-xs rounded bg-white/[0.08] text-white/60">
                    {job.method}
                  </span>
                  <span className={cn(
                    "text-xs font-mono",
                    job.priority <= 2 ? "text-red-400" : job.priority <= 3 ? "text-amber-400" : "text-white/50"
                  )}>
                    P{job.priority}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        )}

        {/* Completed Today */}
        <GlassPanel className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">
              Completed Today ({completedToday.length})
            </h2>
          </div>
          {completedToday.length > 0 ? (
            <div className="space-y-2">
              {completedToday.slice(0, 5).map((job: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04]"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400/60" />
                  <span className="flex-1 text-white/60 text-sm">{job.topic}</span>
                </div>
              ))}
              {completedToday.length > 5 && (
                <p className="text-xs text-white/40 text-center pt-2">
                  +{completedToday.length - 5} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/40 text-center py-4">No jobs completed today</p>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
