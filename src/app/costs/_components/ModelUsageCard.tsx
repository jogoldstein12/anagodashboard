"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";

interface ModelUsage {
  model: string;
  sessions: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

interface ModelUsageCardProps {
  modelUsage: ModelUsage[];
}

const MODEL_COLORS: Record<string, string> = {
  "claude-opus-4-6": "#8b5cf6",
  "deepseek-chat": "#3b82f6",
  "kimi-k2.5": "#f59e0b",
  "claude-haiku-3.5": "#10b981",
};

export function ModelUsageCard({ modelUsage }: ModelUsageCardProps) {
  const sorted = [...modelUsage].sort((a, b) => b.cost - a.cost);

  return (
    <GlassPanel className="p-6 space-y-4">
      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Model Usage</h3>
      <div className="space-y-3">
        {sorted.map((mu) => (
          <div key={mu.model} className="bg-white/[0.04] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: MODEL_COLORS[mu.model] || "#6b7280" }}
                />
                <span className="text-sm font-mono text-white/80">{mu.model}</span>
              </div>
              <Badge variant="neutral" size="sm">{mu.sessions} runs</Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{(mu.tokensIn + mu.tokensOut).toLocaleString()} tokens</span>
              <span className="font-mono text-white/70">${mu.cost.toFixed(4)}</span>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
