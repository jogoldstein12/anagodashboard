"use client";

interface SwarmEdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  isActive: boolean;
}

export default function SwarmEdge({
  x1,
  y1,
  x2,
  y2,
  color,
  isActive,
}: SwarmEdgeProps) {
  return (
    <g>
      {/* Base line (subtle) */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.3"
        className="transition-all duration-300"
      />

      {/* Animated line for active connections */}
      {isActive && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth="2"
          strokeDasharray="5,5"
          strokeOpacity="0.8"
          className="animate-dash"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="10"
            dur="1s"
            repeatCount="indefinite"
          />
        </line>
      )}
    </g>
  );
}