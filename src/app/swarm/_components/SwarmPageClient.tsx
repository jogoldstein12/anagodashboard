"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";
import SwarmGraph from "./SwarmGraph";

export default function SwarmPageClient() {
  const agents = useQuery(api.agents.list);

  if (agents === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Swarm Visualization" 
          description="Interactive view of agent hierarchy and connections"
        />
        <LoadingState variant="grid" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Swarm Visualization" 
          description="Interactive view of agent hierarchy and connections"
        />
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          message="No agents found. Agents will appear here once they are created."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Swarm Visualization" 
        description="Interactive view of agent hierarchy and connections"
      />
      <SwarmGraph agents={agents} />
    </div>
  );
}