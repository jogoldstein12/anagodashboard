"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Calendar, Clock, AlertCircle, Play, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface KBEconTabProps {
  snapshot: any;
  onSelectIndicator: (indicator: string, date: string) => void;
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((target - now) / (1000 * 60 * 60 * 24));
}

function getFreshnessColor(days: number): string {
  if (days < 7) return "🟢";
  if (days < 30) return "🟡";
  return "🔴";
}

function getSurpriseBadge(actual: number, expected: number) {
  const diff = actual - expected;
  const threshold = 0.1;
  
  if (diff > threshold) {
    return { text: "🔴 Hot", class: "text-red-400 bg-red-400/10 border-red-400/30" };
  } else if (diff < -threshold) {
    return { text: "🟢 Cool", class: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" };
  }
  return { text: "⚪ Inline", class: "text-white/60 bg-white/10 border-white/20" };
}

async function triggerResearch(topic: string) {
  try {
    const res = await fetch("/api/kb/trigger-research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, priority: 3, method: "deep_research" }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export function KBEconTab({ snapshot, onSelectIndicator }: KBEconTabProps) {
  const indicators = snapshot?.economic_indicators || [];

  // Get upcoming releases (next 30 days)
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const upcomingReleases = indicators
    .filter((ind: any) => {
      const releaseDate = new Date(ind.release_date || ind.date);
      return releaseDate >= now && releaseDate <= thirtyDaysFromNow;
    })
    .sort((a: any, b: any) => 
      new Date(a.release_date || a.date).getTime() - new Date(b.release_date || b.date).getTime()
    );

  // Get recent releases (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(now.getMonth() - 12);

  const recentReleases = indicators
    .filter((ind: any) => {
      const releaseDate = new Date(ind.release_date || ind.date);
      return releaseDate <= now && releaseDate >= twelveMonthsAgo && ind.actual !== undefined;
    })
    .sort((a: any, b: any) => 
      new Date(b.release_date || b.date).getTime() - new Date(a.release_date || a.date).getTime()
    )
    .slice(0, 12);

  return (
    <div className="space-y-6">
      {/* Upcoming Releases */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Upcoming Releases (Next 30 Days)</h2>
        </div>

        {upcomingReleases.length > 0 ? (
          <div className="space-y-3">
            {upcomingReleases.map((ind: any, idx: number) => {
              const daysUntil = getDaysUntil(ind.release_date || ind.date);
              const isStale = !ind.kb_coverage || ind.kb_coverage.days_since_research > 7;
              
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-white/90">{ind.name || ind.indicator}</h3>
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded-full",
                          daysUntil <= 7 ? "bg-red-400/10 text-red-400 border border-red-400/30" : "bg-white/10 text-white/60 border border-white/20"
                        )}>
                          {daysUntil >= 0 ? `${daysUntil} days away` : "Today"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <span>Release: {new Date(ind.release_date || ind.date).toLocaleDateString()}</span>
                        {ind.kb_coverage && (
                          <>
                            <span>·</span>
                            <span>
                              {getFreshnessColor(ind.kb_coverage.days_since_research)} KB: {ind.kb_coverage.item_count} items, last {ind.kb_coverage.days_since_research}d ago
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {isStale && (
                      <button
                        onClick={() => triggerResearch(ind.name || ind.indicator)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 hover:bg-amber-400/20 transition-colors text-sm"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Research
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Clock className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/50">No upcoming releases in the next 30 days</p>
          </div>
        )}
      </GlassPanel>

      {/* Recent Releases Table */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Recent Releases (Last 12 Months)</h2>
        </div>

        {recentReleases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-white/40 border-b border-white/[0.08]">
                  <th className="pb-3 font-medium">Indicator</th>
                  <th className="pb-3 font-medium">Release Date</th>
                  <th className="pb-3 font-medium">Actual</th>
                  <th className="pb-3 font-medium">Expected</th>
                  <th className="pb-3 font-medium">Surprise</th>
                  <th className="pb-3 font-medium">Direction</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentReleases.map((ind: any, idx: number) => {
                  const surprise = getSurpriseBadge(ind.actual, ind.expected);
                  return (
                    <tr 
                      key={idx} 
                      className="border-b border-white/[0.04] last:border-0 cursor-pointer hover:bg-white/[0.04] transition-colors"
                      onClick={() => onSelectIndicator(ind.name || ind.indicator, ind.release_date || ind.date)}
                    >
                      <td className="py-3 text-white/80 font-medium">{ind.name || ind.indicator}</td>
                      <td className="py-3 text-white/60">
                        {new Date(ind.release_date || ind.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-white font-medium">{ind.actual?.toFixed ? ind.actual.toFixed(1) : ind.actual}{ind.unit || "%"}</td>
                      <td className="py-3 text-white/50">{ind.expected?.toFixed ? ind.expected.toFixed(1) : ind.expected}{ind.unit || "%"}</td>
                      <td className="py-3">
                        <span className={cn("px-2 py-0.5 text-xs rounded border", surprise.class)}>
                          {surprise.text}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={cn(
                          "text-xs",
                          ind.direction === "hot" || ind.direction === "Hawkish" ? "text-red-400" :
                          ind.direction === "cool" || ind.direction === "Dovish" ? "text-emerald-400" :
                          "text-white/50"
                        )}>
                          {ind.direction || ind.regime || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-white/50">No recent release data available</p>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
