import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/GlassPanel";
import { EmptyStateProps } from "@/lib/types";

export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <GlassPanel className="p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-white/30">{icon}</div>
        <div className="space-y-2">
          <p className="text-white/60">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="px-4 py-2 text-sm font-medium text-white bg-white/[0.12] hover:bg-white/[0.18] rounded-lg transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}