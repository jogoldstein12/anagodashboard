"use client";

import { useState } from "react";
import { ACTION_ICONS, STATUS_COLORS } from "@/lib/constants";
import { relativeTime, formatTime, formatDate } from "@/lib/utils";
import { AgentBadge } from "./AgentBadge";
import { GlassPanel } from "./GlassPanel";
import { Badge } from "./ui/Badge";
import { CodeBlock } from "./ui/CodeBlock";
import { CheckCircle, ChevronDown, ChevronUp, Terminal, FileText, Code, DollarSign, Clock, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Activity } from "@/lib/types";

interface EnhancedActivityCardProps {
  activity: Activity;
}

interface ActivityMetadata {
  commands?: string[];
  files?: Array<{
    path: string;
    action: "created" | "modified" | "deleted";
    diff?: string;
  }>;
  codeWritten?: string;
  processes?: string[];
}

export function EnhancedActivityCard({ activity }: EnhancedActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = ACTION_ICONS[activity.action] ?? CheckCircle;
  const statusColor = STATUS_COLORS[activity.status] ?? "text-gray-400";
  
  // Parse metadata
  const metadata = activity.metadata as ActivityMetadata | undefined;
  
  // Calculate total tokens and cost
  const totalTokens = (activity.tokensIn || 0) + (activity.tokensOut || 0);
  const estimatedCost = activity.cost || (totalTokens * 0.000002); // Rough estimate: $0.002 per 1K tokens
  
  // Format duration
  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <GlassPanel className="p-4 hover:bg-white/[0.10] transition-all duration-200 group cursor-pointer">
      {/* Header - Clickable area */}
      <div 
        className="flex items-start gap-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center">
            <Icon className="w-4 h-4 text-white/60" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AgentBadge agent={activity.agent} />
            <span className={`text-[10px] font-medium uppercase tracking-wider ${statusColor}`}>
              {activity.status.replace("_", " ")}
            </span>
            <span className="text-[10px] text-white/30">
              {formatDate(activity.timestamp)} at {formatTime(activity.timestamp)}
            </span>
          </div>
          <h3 className="text-sm font-medium text-white/90 mb-1">{activity.title}</h3>
          <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
            {activity.description}
          </p>
          
          {/* Quick stats */}
          <div className="flex items-center gap-3 mt-2">
            {totalTokens > 0 && (
              <span className="text-[10px] text-white/30 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {totalTokens.toLocaleString()} tokens
              </span>
            )}
            {estimatedCost > 0 && (
              <span className="text-[10px] text-white/30 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${estimatedCost.toFixed(4)}
              </span>
            )}
            {activity.duration && (
              <span className="text-[10px] text-white/30 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(activity.duration)}
              </span>
            )}
          </div>
        </div>

        {/* Expand/collapse button */}
        <div className="flex-shrink-0 mt-1">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/30" />
          )}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div 
          className={cn(
            "mt-4 pt-4 border-t border-white/[0.12] space-y-4",
            "animate-in fade-in duration-200"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Full description */}
          <div>
            <h4 className="text-xs font-medium text-white/60 mb-2">Description</h4>
            <p className="text-sm text-white/70 leading-relaxed">{activity.description}</p>
          </div>

          {/* Commands/Processes */}
          {metadata?.commands && metadata.commands.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-white/60 mb-2 flex items-center gap-2">
                <Terminal className="w-3 h-3" />
                Commands Run
              </h4>
              <div className="space-y-1">
                {metadata.commands.map((cmd, idx) => (
                  <div key={idx} className="text-xs font-mono text-white/50 bg-white/[0.05] px-3 py-2 rounded-lg">
                    {cmd}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {metadata?.files && metadata.files.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-white/60 mb-2 flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Files
              </h4>
              <div className="space-y-2">
                {metadata.files.map((file, idx) => (
                  <div key={idx} className="text-xs text-white/70">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        file.action === "created" ? "success" :
                        file.action === "modified" ? "warning" : "error"
                      } size="sm">
                        {file.action}
                      </Badge>
                      <span className="font-mono">{file.path}</span>
                    </div>
                    {file.diff && (
                      <div className="mt-1 ml-6 text-xs text-white/40 font-mono whitespace-pre-wrap">
                        {file.diff}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code written */}
          {metadata?.codeWritten && (
            <div>
              <h4 className="text-xs font-medium text-white/60 mb-2 flex items-center gap-2">
                <Code className="w-3 h-3" />
                Code Written
              </h4>
              <CodeBlock code={metadata.codeWritten} language="typescript" />
            </div>
          )}

          {/* Token usage and cost */}
          {(activity.tokensIn || activity.tokensOut || activity.cost) && (
            <div className="grid grid-cols-2 gap-4">
              {activity.tokensIn !== undefined && (
                <div className="bg-white/[0.05] rounded-lg p-3">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">Tokens In</div>
                  <div className="text-sm font-medium text-white/90">{activity.tokensIn.toLocaleString()}</div>
                </div>
              )}
              {activity.tokensOut !== undefined && (
                <div className="bg-white/[0.05] rounded-lg p-3">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">Tokens Out</div>
                  <div className="text-sm font-medium text-white/90">{activity.tokensOut.toLocaleString()}</div>
                </div>
              )}
              {totalTokens > 0 && (
                <div className="bg-white/[0.05] rounded-lg p-3">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">Total Tokens</div>
                  <div className="text-sm font-medium text-white/90">{totalTokens.toLocaleString()}</div>
                </div>
              )}
              {estimatedCost > 0 && (
                <div className="bg-white/[0.05] rounded-lg p-3">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">Estimated Cost</div>
                  <div className="text-sm font-medium text-white/90">${estimatedCost.toFixed(4)}</div>
                </div>
              )}
            </div>
          )}

          {/* Session info */}
          {activity.sessionId && (
            <div>
              <h4 className="text-xs font-medium text-white/60 mb-2">Session</h4>
              <div className="text-xs font-mono text-white/50 bg-white/[0.05] px-3 py-2 rounded-lg">
                {activity.sessionId}
              </div>
            </div>
          )}

          {/* Duration */}
          {activity.duration && (
            <div>
              <h4 className="text-xs font-medium text-white/60 mb-2">Duration</h4>
              <div className="text-sm text-white/70">{formatDuration(activity.duration)}</div>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
}