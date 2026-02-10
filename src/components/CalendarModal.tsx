"use client";

import { X, Clock, Terminal, Globe2 } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { AgentBadge } from "./AgentBadge";
import { STATUS_COLORS } from "@/lib/constants";

interface CalendarModalProps {
  task: {
    name: string;
    agent: string;
    schedule: string;
    cronExpr: string;
    timezone: string;
    status: string;
    description: string;
    nextRun: number;
    lastRun?: number;
  };
  onClose: () => void;
}

export function CalendarModal({ task, onClose }: CalendarModalProps) {
  const statusColor = STATUS_COLORS[task.status] ?? "text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <GlassPanel className="relative w-full max-w-md p-6 bg-slate-900/80 border-white/[0.15]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-semibold text-white mb-4">{task.name}</h2>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AgentBadge agent={task.agent} />
            <span className={`text-xs font-medium uppercase ${statusColor}`}>
              {task.status}
            </span>
          </div>

          <p className="text-sm text-white/50 leading-relaxed">
            {task.description}
          </p>

          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Clock className="w-3.5 h-3.5" />
              <span>{task.schedule}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Terminal className="w-3.5 h-3.5" />
              <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-[10px]">
                {task.cronExpr}
              </code>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Globe2 className="w-3.5 h-3.5" />
              <span>{task.timezone}</span>
            </div>
          </div>

          {task.lastRun && (
            <div className="text-[10px] text-white/30 pt-2">
              Last run: {new Date(task.lastRun).toLocaleString()}
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
