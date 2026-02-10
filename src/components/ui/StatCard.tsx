import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/GlassPanel";
import { StatCardProps } from "@/lib/types";

export function StatCard({ icon, label, value, trend }: StatCardProps) {
  return (
    <GlassPanel className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
          <div className="text-2xl font-semibold text-white">{value}</div>
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium",
            trend.isPositive
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          )}>
            {trend.isPositive ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}