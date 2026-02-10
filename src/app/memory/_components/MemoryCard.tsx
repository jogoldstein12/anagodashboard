"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { AgentBadge } from "@/components/AgentBadge";
import { Badge } from "@/components/ui/Badge";
import { relativeTime } from "@/lib/utils";
import { FileText, Brain, ClipboardList, Activity, Tag } from "lucide-react";

interface Document {
  _id: string;
  type: string;
  title: string;
  content: string;
  agent: string;
  filePath?: string;
  tags: string[];
  timestamp: number;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; variant: "info" | "success" | "warning" | "neutral" }> = {
  memory: { icon: <Brain className="w-4 h-4" />, variant: "info" },
  document: { icon: <FileText className="w-4 h-4" />, variant: "neutral" },
  task: { icon: <ClipboardList className="w-4 h-4" />, variant: "warning" },
  activity: { icon: <Activity className="w-4 h-4" />, variant: "success" },
};

interface MemoryCardProps {
  doc: Document;
  expanded?: boolean;
  onToggle?: () => void;
}

export function MemoryCard({ doc, expanded, onToggle }: MemoryCardProps) {
  const typeConfig = TYPE_CONFIG[doc.type] || TYPE_CONFIG.document;

  return (
    <GlassPanel
      className="p-5 space-y-3 cursor-pointer hover:bg-white/[0.08] transition-colors"
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-white/50">{typeConfig.icon}</div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium text-white truncate">{doc.title}</h4>
            {doc.filePath && (
              <p className="text-xs font-mono text-white/30 truncate">{doc.filePath}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <Badge variant={typeConfig.variant} size="sm">{doc.type}</Badge>
          <AgentBadge agent={doc.agent} />
        </div>
      </div>

      {/* Content preview / expanded */}
      <div className={`text-sm text-white/60 ${expanded ? "" : "line-clamp-3"}`}>
        <pre className="whitespace-pre-wrap font-sans">{doc.content}</pre>
      </div>

      {/* Footer: Tags + Timestamp */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
        <div className="flex items-center gap-1 flex-wrap">
          {doc.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 text-xs text-white/40 bg-white/[0.06] px-2 py-0.5 rounded-full">
              <Tag className="w-2.5 h-2.5" />{tag}
            </span>
          ))}
          {doc.tags.length > 4 && (
            <span className="text-xs text-white/30">+{doc.tags.length - 4}</span>
          )}
        </div>
        <span className="text-xs text-white/30">{relativeTime(doc.timestamp)}</span>
      </div>
    </GlassPanel>
  );
}
