"use client";

import { ActivityFeed } from "@/components/ActivityFeed";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Activity Feed</h1>
        <p className="text-sm text-white/40 mt-1">
          Every action across all agents, in real time
        </p>
      </div>
      <ActivityFeed />
    </div>
  );
}
