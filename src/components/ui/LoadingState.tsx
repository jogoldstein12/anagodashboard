import { LoadingStateProps } from "@/lib/types";

export function LoadingState({ variant }: LoadingStateProps) {
  if (variant === "card") {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-white/[0.07] border border-white/[0.12] rounded-xl animate-pulse" />
        <div className="h-32 bg-white/[0.07] border border-white/[0.12] rounded-xl animate-pulse" />
        <div className="h-32 bg-white/[0.07] border border-white/[0.12] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-white/[0.07] border border-white/[0.12] rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-48 bg-white/[0.07] border border-white/[0.12] rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return null;
}