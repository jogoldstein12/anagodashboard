"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { AgentBadge } from "@/components/AgentBadge";
import { Badge } from "@/components/ui/Badge";
import { relativeTime } from "@/lib/utils";
import type { Session } from "@/lib/types";

interface SessionsTableProps {
  sessions: Session[];
}

export function SessionsTable({ sessions }: SessionsTableProps) {
  return (
    <GlassPanel className="p-6 space-y-4">
      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Recent Sessions</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-white/40 uppercase tracking-wider border-b border-white/[0.08]">
              <th className="text-left py-2 pr-4">Agent</th>
              <th className="text-left py-2 pr-4">Model</th>
              <th className="text-right py-2 pr-4">Tokens In</th>
              <th className="text-right py-2 pr-4">Tokens Out</th>
              <th className="text-right py-2 pr-4">Cost</th>
              <th className="text-left py-2 pr-4">Status</th>
              <th className="text-right py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const statusVariant = session.status === "completed" ? "success" : session.status === "active" ? "info" : "error";
              return (
                <tr key={session._id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                  <td className="py-3 pr-4"><AgentBadge agent={session.agent} /></td>
                  <td className="py-3 pr-4 font-mono text-xs text-white/60">{session.model}</td>
                  <td className="py-3 pr-4 text-right font-mono text-white/70">{session.tokensIn.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right font-mono text-white/70">{session.tokensOut.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right font-mono text-white/90">${session.cost.toFixed(4)}</td>
                  <td className="py-3 pr-4"><Badge variant={statusVariant} size="sm">{session.status}</Badge></td>
                  <td className="py-3 text-right text-xs text-white/40">{relativeTime(session.startedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
