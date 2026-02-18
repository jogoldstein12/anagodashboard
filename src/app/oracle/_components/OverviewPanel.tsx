import { GlassPanel } from "@/components/GlassPanel";
import { Activity, Cpu, Clock, Database, Wallet, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface OverviewPanelProps {
  status: any;
}

export function OverviewPanel({ status }: OverviewPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "running": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "sleeping": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "dead": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Overview</h2>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status?.status)}`}>
          {status?.status?.toUpperCase() || "UNKNOWN"}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Activity className="w-4 h-4" />
            <span>Status</span>
          </div>
          <div className="text-white font-medium">
            {status?.status?.charAt(0).toUpperCase() + status?.status?.slice(1) || "Unknown"}
          </div>
        </div>

        {/* Model */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Cpu className="w-4 h-4" />
            <span>Model</span>
          </div>
          <div className="text-white font-medium">
            {status?.model?.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "Claude Sonnet 4.6"}
          </div>
        </div>

        {/* Uptime */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Clock className="w-4 h-4" />
            <span>Uptime</span>
          </div>
          <div className="text-white font-medium">
            {status?.uptimeSeconds ? formatUptime(status.uptimeSeconds) : "0m"}
          </div>
        </div>

        {/* Turns & Tokens */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Database className="w-4 h-4" />
            <span>Turns / Tokens</span>
          </div>
          <div className="text-white font-medium">
            {formatNumber(status?.totalTurns || 0)} / {formatNumber(status?.totalTokens || 0)}
          </div>
        </div>

        {/* USDC Balance */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Wallet className="w-4 h-4" />
            <span>USDC Balance</span>
          </div>
          <div className="text-white font-medium">
            {formatCurrency(status?.usdcBalance || 0)}
          </div>
        </div>

        {/* ETH Balance */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>ETH Balance</span>
          </div>
          <div className="text-white font-medium">
            {status?.ethBalance?.toFixed(4) || "0.0000"} ETH
          </div>
        </div>
      </div>

      {/* Last Activity */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="text-sm text-white/50">
          Last activity: {status?.lastActivityTimestamp ? 
            formatDistanceToNow(new Date(status.lastActivityTimestamp), { addSuffix: true }) : 
            "Never"}
        </div>
      </div>
    </GlassPanel>
  );
}