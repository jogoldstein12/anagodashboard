"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { X, ExternalLink, Star, Clock, Tag, User, Building, MapPin, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface KBItemDrawerProps {
  item: any;
  onClose: () => void;
}

function getFreshnessColor(ingestedAt: string): string {
  const days = Math.floor(
    (Date.now() - new Date(ingestedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days < 7) return "text-emerald-400";
  if (days < 30) return "text-amber-400";
  return "text-red-400";
}

function getQualityStars(score: number | undefined): string {
  if (!score) return "☆☆☆☆☆";
  const filled = Math.round(score * 5);
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

export function KBItemDrawer({ item, onClose }: KBItemDrawerProps) {
  const daysSinceIngested = Math.floor(
    (Date.now() - new Date(item.ingested_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-black/80 backdrop-blur-xl border-l border-white/[0.12] z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-semibold text-white/90">{item.title}</h2>
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 mt-1 transition-colors"
                >
                  {new URL(item.source_url).hostname}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/[0.08] transition-colors text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap gap-3 mb-6 text-sm">
            <div className="px-3 py-1.5 rounded-lg bg-white/[0.07] border border-white/[0.12]">
              <span className="text-white/50">Source:</span>{" "}
              <span className="text-white/80">{item.source_type}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/[0.07] border border-white/[0.12]">
              <span className="text-white/50">Category:</span>{" "}
              <span className="text-white/80">{item.primary_category}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/[0.07] border border-white/[0.12] flex items-center gap-1">
              <span className="text-white/50">Quality:</span>{" "}
              <span className="text-amber-400">{getQualityStars(item.quality_score)}</span>
            </div>
            <div className={cn(
              "px-3 py-1.5 rounded-lg bg-white/[0.07] border border-white/[0.12] flex items-center gap-1",
              getFreshnessColor(item.ingested_at)
            )}>
              <Clock className="w-3 h-3" />
              <span>{daysSinceIngested} days old</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/[0.07] border border-white/[0.12]">
              <span className="text-white/50">Ingested:</span>{" "}
              <span className="text-white/80">{new Date(item.ingested_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Save Intent */}
          {item.save_intent && (
            <div className="mb-6">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                <Quote className="w-4 h-4" />
                <span>Why saved</span>
              </div>
              <GlassPanel className="p-4 border-l-4 border-l-emerald-400/50">
                <p className="text-white/70 italic">{item.save_intent}</p>
              </GlassPanel>
            </div>
          )}

          {/* Content Summary */}
          {item.content_summary && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white/50 mb-2">Summary</h3>
              <GlassPanel className="p-4 max-h-64 overflow-y-auto">
                <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
                  {item.content_summary}
                </p>
              </GlassPanel>
            </div>
          )}

          {/* Entity Chips */}
          {item.entity_names && item.entity_names.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white/50 mb-2">Entities</h3>
              <div className="flex flex-wrap gap-2">
                {item.entity_names.map((entity: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.07] border border-white/[0.12] text-sm text-white/70 flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3 text-white/40" />
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white/50 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-sm text-emerald-400/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Project Badge */}
          {item.save_project && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white/50 mb-2">Project</h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-400/10 border border-blue-400/20 text-blue-400">
                <Building className="w-4 h-4" />
                {item.save_project}
              </span>
            </div>
          )}

          {/* Times Referenced */}
          {item.times_referenced !== undefined && item.times_referenced > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05]">
                <User className="w-4 h-4 text-white/40" />
                <span className="text-white/60 text-sm">
                  Referenced by agents <span className="text-white font-medium">{item.times_referenced}</span> times
                </span>
              </div>
            </div>
          )}

          {/* Item ID footer */}
          <div className="pt-4 border-t border-white/[0.08] text-center">
            <span className="text-xs text-white/30">Item ID: {item.item_id}</span>
          </div>
        </div>
      </div>
    </>
  );
}
