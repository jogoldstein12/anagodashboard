"use client";

import { EnhancedActivityFeed } from "@/components/EnhancedActivityFeed";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Activity Feed"
        description="Every action across all agents, in real time"
      />
      <EnhancedActivityFeed />
    </div>
  );
}
