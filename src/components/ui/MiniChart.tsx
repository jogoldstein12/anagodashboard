import { MiniChartProps } from "@/lib/types";

export function MiniChart({ 
  data, 
  color = "#3b82f6", 
  width = 80, 
  height = 40 
}: MiniChartProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const divisor = data.length > 1 ? data.length - 1 : 1;

  const points = data.map((value, index) => {
    const x = (index / divisor) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}