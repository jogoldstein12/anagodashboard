import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function GlassPanel({ children, className, style, onClick }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl shadow-lg",
        className
      )}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
