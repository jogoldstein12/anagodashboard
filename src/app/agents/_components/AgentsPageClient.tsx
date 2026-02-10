"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { AgentCard } from "./AgentCard";
import { Users } from "lucide-react";

export function AgentsPageClient() {
  const agents = useQuery(api.agents.list);
  
  if (agents === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Agents" 
          description="Monitor and manage all active agents in the swarm"
        />
        <LoadingState variant="grid" />
      </div>
    );
  }
  
  if (agents.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Agents" 
          description="Monitor and manage all active agents in the swarm"
        />
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          message="No agents found. Agents will appear here when they become active."
        />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Agents" 
        description="Monitor and manage all active agents in the swarm"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent._id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
