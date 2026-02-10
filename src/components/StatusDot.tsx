import { cn } from "@/lib/utils";

interface StatusDotProps {
  active?: boolean;
}

export function StatusDot({ active = true }: StatusDotProps) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      )}
      <span
        className={cn(
          "relative inline-flex rounded-full h-2.5 w-2.5",
          active ? "bg-green-400" : "bg-gray-500"
        )}
      />
    </span>
  );
}
