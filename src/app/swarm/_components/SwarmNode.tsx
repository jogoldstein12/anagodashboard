"use client";

import { Agent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SwarmNodeProps {
  agent: Agent;
  x: number;
  y: number;
  size: number;
  color: string;
  emoji: string;
  isCenter: boolean;
  isActive: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function SwarmNode({
  agent,
  x,
  y,
  size,
  color,
  emoji,
  isCenter,
  isActive,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: SwarmNodeProps) {
  const circleRadius = size / 2;
  const fontSize = size * 0.4;
  const labelY = y + circleRadius + 20;

  return (
    <g
      className={cn(
        "cursor-pointer transition-all duration-300",
        isHovered && "scale-110",
        isActive && "animate-float"
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Glow effect for active nodes */}
      {isActive && (
        <circle
          cx={x}
          cy={y}
          r={circleRadius * 1.3}
          fill={color}
          fillOpacity="0.2"
          filter="url(#glow)"
          className="animate-pulse"
        />
      )}

      {/* Main circle */}
      <circle
        cx={x}
        cy={y}
        r={circleRadius}
        fill={color}
        fillOpacity={isCenter ? 0.9 : 0.8}
        stroke={isHovered ? "white" : color}
        strokeWidth={isHovered ? 2 : 1}
        className="transition-all duration-200"
      />

      {/* Emoji */}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fill="white"
        className="select-none"
      >
        {emoji}
      </text>

      {/* Agent name label */}
      <text
        x={x}
        y={labelY}
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="500"
        className="select-none"
      >
        {agent.name}
      </text>

      {/* Activity indicator (small dot) */}
      <circle
        cx={x + circleRadius * 0.7}
        cy={y - circleRadius * 0.7}
        r={size * 0.08}
        fill={isActive ? "#22c55e" : "#6b7280"}
        className={cn(
          "transition-colors duration-300",
          isActive && "animate-pulse"
        )}
      />
    </g>
  );
}