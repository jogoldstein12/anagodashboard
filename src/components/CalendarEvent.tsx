"use client";

import { AGENTS, type AgentKey } from "@/lib/constants";
import { formatTime } from "@/lib/utils";

interface CalendarEventProps {
  name: string;
  agent: string;
  nextRun: number;
  schedule: string;
  onClick: () => void;
}

export function CalendarEvent({
  name,
  agent,
  nextRun,
  schedule,
  onClick,
}: CalendarEventProps) {
  const agentInfo = AGENTS[agent as AgentKey] ?? {
    label: agent,
    color: "#6b7280",
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-2 py-1 rounded-lg text-[10px] leading-tight transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-white/20"
      style={{
        backgroundColor: agentInfo.color + "22",
        borderLeftWidth: 2,
        borderLeftColor: agentInfo.color,
      }}
    >
      <div className="font-medium text-white/80 truncate">{name}</div>
      <div className="text-white/40">{formatTime(nextRun)}</div>
    </button>
  );
}
