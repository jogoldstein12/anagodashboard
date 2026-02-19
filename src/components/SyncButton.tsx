"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RefreshCw } from "lucide-react";
import { useCallback } from "react";

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SyncButton() {
  const syncStatus = useQuery(api.syncRequests.getLastSync);
  const requestSync = useMutation(api.syncRequests.requestSync);

  const handleSync = useCallback(async () => {
    if (syncStatus?.isPending) return;
    await requestSync();
  }, [syncStatus?.isPending, requestSync]);

  const isPending = syncStatus?.isPending ?? false;
  const lastSynced = syncStatus?.lastFulfilledAt;

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      title={isPending ? "Sync requested..." : "Sync now"}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all text-sm disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-white/70 disabled:hover:border-white/10"
    >
      <RefreshCw
        className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`}
      />
      <span className="hidden sm:inline">
        {isPending
          ? "Syncing..."
          : lastSynced
            ? `Synced ${formatTimeAgo(lastSynced)}`
            : "Sync now"}
      </span>
    </button>
  );
}
