"use client";

import { AGENTS, type AgentKey } from "@/lib/constants";

export function AgentBadge({ agent }: { agent: string }) {
  const info = AGENTS[agent as AgentKey] ?? {
    label: agent,
    dot: "bg-gray-400",
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70">
      <span className={`w-2 h-2 rounded-full ${info.dot}`} />
      {info.label}
    </span>
  );
}
