"use client";

import { DOC_TYPE_ICONS } from "@/lib/constants";
import { relativeTime } from "@/lib/utils";
import { AgentBadge } from "./AgentBadge";
import { GlassPanel } from "./GlassPanel";
import { FileText } from "lucide-react";

interface SearchResultProps {
  type: string;
  title: string;
  content: string;
  agent: string;
  filePath?: string;
  tags: string[];
  timestamp: number;
  query: string;
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const words = query.trim().split(/\s+/);
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} className="bg-blue-400/30 text-white rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function SearchResult({
  type,
  title,
  content,
  agent,
  filePath,
  tags,
  timestamp,
  query,
}: SearchResultProps) {
  const Icon = DOC_TYPE_ICONS[type] ?? FileText;

  // Get a content snippet around the match
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase().split(/\s+/)[0] || "";
  const matchIndex = lowerContent.indexOf(lowerQuery);
  const snippetStart = Math.max(0, matchIndex - 80);
  const snippet = content.slice(snippetStart, snippetStart + 200);

  return (
    <GlassPanel className="p-4 hover:bg-white/[0.10] transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center">
            <Icon className="w-4 h-4 text-white/60" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
              {type}
            </span>
            <AgentBadge agent={agent} />
          </div>

          <h3 className="text-sm font-medium text-white/90 mb-1">
            {highlightMatch(title, query)}
          </h3>

          <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
            {snippetStart > 0 && "…"}
            {highlightMatch(snippet, query)}
            {snippet.length >= 200 && "…"}
          </p>

          <div className="flex items-center gap-2 mt-2">
            {filePath && (
              <code className="text-[10px] text-white/20 bg-white/[0.05] px-1.5 py-0.5 rounded">
                {filePath}
              </code>
            )}
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-blue-400/60 bg-blue-400/[0.08] px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
            <span className="text-[10px] text-white/20 ml-auto">
              {relativeTime(timestamp)}
            </span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
