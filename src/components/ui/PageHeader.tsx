import { Plus } from "lucide-react";
import { PageHeaderProps } from "@/lib/types";

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {description && (
            <p className="text-white/50 mt-1">{description}</p>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-white/[0.12] hover:bg-white/[0.18] rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}