"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { AgentConfigCard } from "./AgentConfigCard";
import { CronJobCard } from "./CronJobCard";
import { Settings, Users, Clock } from "lucide-react";
import { useState } from "react";
import type { Agent } from "@/lib/types";

const TABS = [
  { label: "Agents", value: "agents" },
  { label: "Cron Jobs", value: "cron" },
];

export default function SettingsPageClient() {
  const [activeTab, setActiveTab] = useState("agents");
  const agents = useQuery(api.agents.list);
  const cronJobs = useQuery(api.scheduledTasks.list, {});

  const isLoading = agents === undefined || cronJobs === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Agent configuration and scheduled tasks" />
        <LoadingState variant="grid" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Agent configuration and scheduled tasks" />

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "agents" && (
        <>
          {(agents as Agent[]).length === 0 ? (
            <EmptyState icon={<Users className="w-12 h-12" />} message="No agents configured." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(agents as Agent[]).map((agent) => (
                <AgentConfigCard key={agent._id} agent={agent} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "cron" && (
        <>
          {(cronJobs as any[]).length === 0 ? (
            <EmptyState icon={<Clock className="w-12 h-12" />} message="No cron jobs configured." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(cronJobs as any[]).map((job: any) => (
                <CronJobCard key={job._id} task={job} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
