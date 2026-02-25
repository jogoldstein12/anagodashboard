"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Database, Calendar, AlertCircle, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface KBStatsTabProps {
  snapshot: any;
}

function getQualityStars(score: number | undefined): string {
  if (!score) return "☆☆☆☆☆";
  const filled = Math.round(score * 5);
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

// Simple SVG Donut Chart component
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <div className="h-48 flex items-center justify-center text-white/30">No data</div>;

  let currentAngle = 0;
  const radius = 80;
  const center = 100;
  const strokeWidth = 30;

  return (
    <div className="flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {data.map((segment, idx) => {
          const angle = (segment.value / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          currentAngle += angle;

          const startRad = ((startAngle - 90) * Math.PI) / 180;
          const endRad = ((endAngle - 90) * Math.PI) / 180;

          const x1 = center + radius * Math.cos(startRad);
          const y1 = center + radius * Math.sin(startRad);
          const x2 = center + radius * Math.cos(endRad);
          const y2 = center + radius * Math.sin(endRad);

          const largeArc = angle > 180 ? 1 : 0;

          return (
            <path
              key={idx}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        })}
        <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" className="fill-white text-2xl font-semibold">
          {total}
        </text>
        <text x={center} y={center + 20} textAnchor="middle" dominantBaseline="middle" className="fill-white/50 text-xs">
          items
        </text>
      </svg>
    </div>
  );
}

// Simple SVG Bar Chart component
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 20;
  const gap = 8;
  const chartHeight = 120;

  return (
    <svg viewBox={`0 0 ${data.length * (barWidth + gap) + gap} ${chartHeight + 30}`} className="w-full h-40">
      {data.map((d, idx) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        const x = gap + idx * (barWidth + gap);
        const y = chartHeight - barHeight;

        return (
          <g key={idx}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill="#10B981"
              rx={4}
              opacity={0.6 + (idx / data.length) * 0.4}
            />
            <text x={x + barWidth / 2} y={chartHeight + 15} textAnchor="middle" className="fill-white/40 text-[8px]">
              {d.label.slice(0, 3)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function KBStatsTab({ snapshot }: KBStatsTabProps) {
  const stats = snapshot?.stats || {};
  const itemsByCategory = stats.items_by_category || {};
  const topSources = stats.top_sources || [];
  const agentInjections = snapshot?.agent_injections || [];

  // Calculate freshness distribution from recent_items
  const recentItems = snapshot?.recent_items || [];
  const now = Date.now();
  const freshnessCounts = recentItems.reduce(
    (acc: any, item: any) => {
      const days = Math.floor((now - new Date(item.ingested_at).getTime()) / (1000 * 60 * 60 * 24));
      if (days < 7) acc.fresh++;
      else if (days < 30) acc.recent++;
      else if (days < 90) acc.aging++;
      else acc.stale++;
      return acc;
    },
    { fresh: 0, recent: 0, aging: 0, stale: 0 }
  );

  // Prepare category data for donut chart
  const categoryColors = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];
  const categoryData = Object.entries(itemsByCategory)
    .slice(0, 6)
    .map(([label, value], idx) => ({
      label,
      value: value as number,
      color: categoryColors[idx % categoryColors.length],
    }));

  // Prepare ingestion data for bar chart (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().slice(0, 10);
  });

  const itemsByDate = recentItems.reduce((acc: any, item: any) => {
    const date = item.ingested_at?.slice(0, 10);
    if (date && last30Days.includes(date)) {
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {});

  const ingestionData = last30Days.map((date) => ({
    label: date.slice(5),
    value: itemsByDate[date] || 0,
  })).slice(-14); // Last 14 days for visibility

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/50">Total Items</span>
          </div>
          <p className="text-2xl font-semibold text-white">{stats.total_items || 0}</p>
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/50">Added This Week</span>
          </div>
          <p className="text-2xl font-semibold text-white">{stats.items_this_week || 0}</p>
          {stats.items_this_week && stats.items_this_week > 0 && (
            <p className="text-xs text-emerald-400/60 mt-1">
              +{stats.items_this_week} new
            </p>
          )}
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/50">Open Gaps</span>
          </div>
          <p className="text-2xl font-semibold text-white">{stats.open_gaps || 0}</p>
          <p className="text-xs text-white/30 mt-1">
            {snapshot?.gaps?.filter((g: any) => g.priority <= 2).length || 0} critical
          </p>
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/50">Avg Quality</span>
          </div>
          <p className="text-2xl font-semibold text-white">
            {stats.avg_quality?.toFixed(2) || stats.avg_freshness_score?.toFixed(2) || "0.00"}
          </p>
          <p className="text-xs text-amber-400/60 mt-1">
            {getQualityStars(stats.avg_quality || stats.avg_freshness_score)}
          </p>
        </GlassPanel>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Items by Category */}
        <GlassPanel className="p-5">
          <h3 className="text-sm font-medium text-white/70 mb-4">Items by Category</h3>
          <div className="flex items-center gap-6">
            <DonutChart data={categoryData} />
            <div className="flex-1 space-y-2">
              {categoryData.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-white/60 capitalize">{cat.label.replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-white font-medium">{cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* Ingestion Over Time */}
        <GlassPanel className="p-5">
          <h3 className="text-sm font-medium text-white/70 mb-4">Ingestion (Last 14 Days)</h3>
          <BarChart data={ingestionData} />
        </GlassPanel>
      </div>

      {/* Top Sources Table */}
      <GlassPanel className="p-5">
        <h3 className="text-sm font-medium text-white/70 mb-4">Top Sources</h3>
        {topSources.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-white/40 border-b border-white/[0.08]">
                  <th className="pb-2 font-medium">Source</th>
                  <th className="pb-2 font-medium">Items</th>
                  <th className="pb-2 font-medium">Avg Quality</th>
                  <th className="pb-2 font-medium">Last Ingested</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {topSources.slice(0, 5).map((source: any, idx: number) => (
                  <tr key={idx} className="border-b border-white/[0.04] last:border-0">
                    <td className="py-3 text-white/80 capitalize">{source.source_id?.replace(/_/g, " ") || "Unknown"}</td>
                    <td className="py-3 text-white/60">{source.count || 0}</td>
                    <td className="py-3">
                      <span className="text-amber-400/80">{getQualityStars(source.avg_quality)}</span>
                    </td>
                    <td className="py-3 text-white/40">{source.last_ingested || "Unknown"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-white/40 text-center py-4">No source data available</p>
        )}
      </GlassPanel>

      {/* Agent Injections */}
      <GlassPanel className="p-5">
        <h3 className="text-sm font-medium text-white/70 mb-4">Agent Injections</h3>
        {agentInjections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agentInjections.slice(0, 6).map((injection: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white/80">{injection.agent || "Unknown"}</span>
                  <span className="text-xs text-white/40">{injection.count || 0} injections</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{injection.used_in_decisions || 0}</span>
                  <span className="text-white/40">used in decisions</span>
                </div>
                {injection.count > 0 && (
                  <div className="mt-2 w-full bg-white/[0.08] rounded-full h-1.5">
                    <div
                      className="bg-emerald-400 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, ((injection.used_in_decisions || 0) / injection.count) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40 text-center py-4">No injection data available</p>
        )}
      </GlassPanel>

      {/* Freshness Distribution */}
      <GlassPanel className="p-5">
        <h3 className="text-sm font-medium text-white/70 mb-4">Freshness Distribution</h3>
        <div className="space-y-3">
          {[
            { label: "Fresh (<7d)", count: freshnessCounts.fresh, color: "bg-emerald-400", icon: "🟢" },
            { label: "Recent (7-30d)", count: freshnessCounts.recent, color: "bg-blue-400", icon: "🔵" },
            { label: "Aging (30-90d)", count: freshnessCounts.aging, color: "bg-amber-400", icon: "🟡" },
            { label: "Stale (>90d)", count: freshnessCounts.stale, color: "bg-red-400", icon: "🔴" },
          ].map((item, idx) => {
            const total = recentItems.length || 1;
            const pct = Math.round((item.count / total) * 100);
            return (
              <div key={idx} className="flex items-center gap-4">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/60">{item.label}</span>
                    <span className="text-sm text-white font-medium">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-white/[0.08] rounded-full h-2">
                    <div className={cn("h-2 rounded-full", item.color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassPanel>
    </div>
  );
}
