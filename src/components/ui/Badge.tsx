import { cn } from "@/lib/utils";
import { BADGE_VARIANTS } from "@/lib/constants";
import { BadgeProps } from "@/lib/types";

export function Badge({ variant, className, children, size = "md" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border rounded-full font-medium",
        variant && BADGE_VARIANTS[variant],
        className,
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm"
      )}
    >
      {children}
    </span>
  );
}