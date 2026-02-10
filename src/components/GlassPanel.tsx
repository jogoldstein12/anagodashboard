import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassPanel({ children, className }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}
