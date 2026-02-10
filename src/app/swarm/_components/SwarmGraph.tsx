"use client";

import { Agent } from "@/lib/types";
import { AGENTS, AGENT_EMOJI, type AgentKey } from "@/lib/constants";
import SwarmNode from "./SwarmNode";
import SwarmEdge from "./SwarmEdge";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SwarmGraphProps {
  agents: Agent[];
}

interface NodePosition {
  x: number;
  y: number;
  size: number;
  isActive: boolean;
}

export default function SwarmGraph({ agents }: SwarmGraphProps) {
  const router = useRouter();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Find Anago (center node)
  const anago = agents.find(agent => agent.agentId === "anago");
  const subAgents = agents.filter(agent => agent.agentId !== "anago");

  // Graph dimensions
  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  // Calculate node positions
  const nodePositions: Record<string, NodePosition> = {};
  
  // Anago (center)
  if (anago) {
    const activityLevel = Math.min(anago.tasksToday * 10 + anago.tokensToday / 1000, 100);
    const size = 60 + (activityLevel * 0.4);
    const isActive = anago.status === "active";
    
    nodePositions[anago._id] = {
      x: centerX,
      y: centerY,
      size,
      isActive,
    };
  }

  // Sub-agents arranged in a circle
  subAgents.forEach((agent, index) => {
    const angle = (index / subAgents.length) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    const activityLevel = Math.min(agent.tasksToday * 10 + agent.tokensToday / 1000, 100);
    const size = 40 + (activityLevel * 0.3);
    const isActive = agent.status === "active";
    
    nodePositions[agent._id] = {
      x,
      y,
      size,
      isActive,
    };
  });

  const handleNodeClick = (agentId: string) => {
    router.push(`/agents/${agentId}`);
  };

  return (
    <div className="bg-white/[0.07] border border-white/[0.12] backdrop-blur-xl rounded-xl p-6">
      <div className="relative w-full h-[600px]">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0"
        >
          {/* Define glow filter */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Render edges from Anago to sub-agents */}
          {anago && subAgents.map(agent => {
            const anagoPos = nodePositions[anago._id];
            const agentPos = nodePositions[agent._id];
            
            if (!anagoPos || !agentPos) return null;
            
            const agentKey = agent.agentId as AgentKey;
            const color = AGENTS[agentKey]?.color || "#ffffff";
            
            return (
              <SwarmEdge
                key={`edge-${agent._id}`}
                x1={anagoPos.x}
                y1={anagoPos.y}
                x2={agentPos.x}
                y2={agentPos.y}
                color={color}
                isActive={agentPos.isActive || anagoPos.isActive}
              />
            );
          })}

          {/* Render nodes */}
          {agents.map(agent => {
            const pos = nodePositions[agent._id];
            if (!pos) return null;
            
            const agentKey = agent.agentId as AgentKey;
            const color = AGENTS[agentKey]?.color || "#ffffff";
            const emoji = AGENT_EMOJI[agentKey] || "🤖";
            const isCenter = agent.agentId === "anago";
            
            return (
              <SwarmNode
                key={agent._id}
                agent={agent}
                x={pos.x}
                y={pos.y}
                size={pos.size}
                color={color}
                emoji={emoji}
                isCenter={isCenter}
                isActive={pos.isActive}
                isHovered={hoveredNode === agent._id}
                onClick={() => handleNodeClick(agent.agentId)}
                onMouseEnter={() => setHoveredNode(agent._id)}
                onMouseLeave={() => setHoveredNode(null)}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredNode && (() => {
          const agent = agents.find(a => a._id === hoveredNode);
          if (!agent) return null;
          
          const agentKey = agent.agentId as AgentKey;
          const color = AGENTS[agentKey]?.color || "#ffffff";
          const pos = nodePositions[hoveredNode];
          
          if (!pos) return null;
          
          // Calculate tooltip position (offset from node)
          const tooltipX = pos.x + pos.size / 2 + 10;
          const tooltipY = pos.y - 20;
          
          return (
            <div 
              className="absolute z-10 bg-slate-900/95 border border-white/20 backdrop-blur-xl rounded-lg p-3 shadow-xl min-w-[200px]"
              style={{
                left: `${(tooltipX / width) * 100}%`,
                top: `${(tooltipY / height) * 100}%`,
                transform: 'translate(0, -100%)',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <h3 className="font-semibold text-white">{agent.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-white/60">Model</div>
                  <div className="text-white">{agent.model}</div>
                  
                  <div className="text-white/60">Trust</div>
                  <div className="text-white">{agent.trustLevel}</div>
                  
                  <div className="text-white/60">Tasks Today</div>
                  <div className="text-white">{agent.tasksToday}</div>
                  
                  <div className="text-white/60">Status</div>
                  <div className="text-white capitalize">{agent.status}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}