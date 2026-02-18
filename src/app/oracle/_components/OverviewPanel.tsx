"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { DollarSign, Cpu, Clock, Activity, Wallet, Brain, Zap } from "lucide-react";

interface OracleStatus {
  _id: string;
  agentId: string;
  status: string;
  model: string;
  uptimeSeconds: number;
  totalTurns: number;
  totalTokens: number;
  usdcBalance: number;
  ethBalance: number;
  lastActivityTimestamp: number;
  lastSyncTimestamp: number;
}

interface OverviewPanelProps {
  status: OracleStatus | null | undefined;
}

export function OverviewPanel({ status }: OverviewPanelProps) {
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "sleeping": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "dead": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (!status) {
    return (
      <GlassPanel className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Oracle Overview</h2>
          <p className="text-sm text-white/50 mt-1">Trading agent status and metrics</p>
        </div>
        <Badge className={getStatusColor(status.status)}>
          {status.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Status Card */}
        <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">Status</p>
              <p className="text-lg font-semibold text-white capitalize">{status.status}</p>
            </div>
          </div>
          <p className="text-xs text-white/30">Model: {status.model}</p>
        </div>

        {/* Uptime Card */}
        <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">Uptime</p>
              <p className="text-lg font-semibold text-white">{formatUptime(status.uptimeSeconds)}</p>
            </div>
          </div>
          <p className="text-xs text-white/30">Last activity: {formatTimeAgo(status.lastActivityTimestamp)}</p>
        </div>

        {/* Activity Card */}
        <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">Activity</p>
              <p className="text-lg font-semibold text-white">{status.totalTurns.toLocaleString()} turns</p>
            </div>
          </div>
          <p className="text-xs text-white/30">{status.totalTokens.toLocaleString()} tokens</p>
        </div>

        {/* USDC Balance */}
        <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">USDC Balance</p>
              <p className="text-lg font-semibold text-white">${status.usdcBalance.toFixed(2)}</p>
            </div>
          </div>
          <p className="text-xs text-white/30">Trading capital</p>
        </div>

        {/* ETH Balance */}
        <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Wallet className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">ETH Balance</p>
              <p className="text-lg font-semibold text-white">{status.ethBalance.toFixed(4)} ETH</p>
            </div>
          </div>
          <p className="text-xs text-white/30">Gas reserves</p>
        </div>

        {/* Model Card */}
        <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-500/20 rounded-lg">
              <Brain className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">Model</p>
              <p className="text-lg font-semibold text-white">Claude Sonnet 4.6</p>
            </div>
          </div>
          <p className="text-xs text-white/30">Trading inference</p>
        </div>
      </div>
    </GlassPanel>
  );
}