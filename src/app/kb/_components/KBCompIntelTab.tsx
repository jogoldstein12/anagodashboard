"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { ExternalLink, TrendingUp, TrendingDown, Minus, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface KBCompIntelTabProps {
  snapshot: any;
  onSelectCompetitor: (name: string) => void;
}

function getSentimentBadge(sentiment: string) {
  switch (sentiment?.toLowerCase()) {
    case "positive":
      return { icon: "🟢", label: "Positive", class: "bg-emerald-400/10 text-emerald-400 border-emerald-400/30" };
    case "negative":
      return { icon: "🔴", label: "Negative", class: "bg-red-400/10 text-red-400 border-red-400/30" };
    default:
      return { icon: "⚪", label: "Neutral", class: "bg-white/10 text-white/60 border-white/20" };
  }
}

function getTrendIndicator(current: number, previous: number) {
  const diff = current - previous;
  if (diff > 0) {
    return { icon: TrendingUp, color: "text-emerald-400", text: `+${diff} from last week` };
  } else if (diff < 0) {
    return { icon: TrendingDown, color: "text-red-400", text: `${diff} from last week` };
  }
  return { icon: Minus, color: "text-white/40", text: "Same as last week" };
}

export function KBCompIntelTab({ snapshot, onSelectCompetitor }: KBCompIntelTabProps) {
  const monitors = snapshot?.competitive_monitors || [];

  if (monitors.length === 0) {
    return (
      <GlassPanel className="p-8 text-center">
        <div className="text-4xl mb-4">🏢</div>
        <h3 className="text-lg font-medium text-white mb-2">No competitors being tracked yet</h3>
        <p className="text-white/50">Add competitors to start monitoring their mentions and sentiment.</p>
      </GlassPanel>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {monitors.map((comp: any, idx: number) => {
        const sentiment = getSentimentBadge(comp.sentiment);
        const trend = getTrendIndicator(comp.mentions_this_week || 0, comp.mentions_last_week || 0);
        const TrendIcon = trend.icon;

        return (
          <GlassPanel key={idx} className="p-5 hover:bg-white/[0.10] transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white/90">{comp.name}</h3>
                {comp.domain && (
                  <a
                    href={`https://${comp.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-400/80 hover:text-emerald-400 transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    {comp.domain}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{comp.mentions_this_week || 0}</span>
                <span className="text-sm text-white/50">mentions this week</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <TrendIcon className={cn("w-4 h-4", trend.color)} />
                <span className={cn("text-white/60", trend.color)}>{trend.text}</span>
              </div>

              {/* Sentiment Badge */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs border",
                  sentiment.class
                )}>
                  {sentiment.icon} {sentiment.label}
                </span>
              </div>

              {/* Last Mention */}
              {comp.last_mention_date && (
                <p className="text-xs text-white/40">
                  Last mention: {new Date(comp.last_mention_date).toLocaleDateString()}
                </p>
              )}

              {/* Context Snippet */}
              {comp.recent_context && (
                <p className="text-sm text-white/60 line-clamp-2">
                  &ldquo;{comp.recent_context}&rdquo;
                </p>
              )}

              {/* View Button */}
              <button
                onClick={() => onSelectCompetitor(comp.name)}
                className="w-full mt-2 px-4 py-2 rounded-lg bg-white/[0.07] text-white/70 text-sm hover:bg-white/[0.12] hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                View Mentions
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </GlassPanel>
        );
      })}
    </div>
  );
}
