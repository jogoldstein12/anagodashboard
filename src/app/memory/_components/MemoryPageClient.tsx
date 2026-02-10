"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemoryCard } from "./MemoryCard";
import { Brain, FileText, Search, Database } from "lucide-react";
import { useState, useMemo } from "react";

const DOC_TYPES = ["all", "memory", "document", "task", "activity"] as const;

export default function MemoryPageClient() {
  const docs = useQuery(api.documents.listByType, {});
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Search results (always call hook, use empty query when not searching)
  const searchResults = useQuery(api.documents.search, { query: searchQuery.length >= 2 ? searchQuery : "" });

  if (docs === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader title="Memory" description="Browse all memories, documents, and knowledge" />
        <LoadingState variant="list" />
      </div>
    );
  }

  // Use search results when searching, otherwise use filtered docs
  const isSearching = searchQuery.length >= 2;
  const displayDocs = isSearching
    ? (searchResults || [])
    : typeFilter === "all"
      ? docs
      : docs.filter((d: any) => d.type === typeFilter);

  // Stats
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { memory: 0, document: 0, task: 0, activity: 0 };
    for (const d of docs as any[]) {
      if (counts[d.type] !== undefined) counts[d.type]++;
    }
    return counts;
  }, [docs]);

  return (
    <div className="space-y-6">
      <PageHeader title="Memory" description="Browse all memories, documents, and knowledge" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Database className="w-5 h-5" />} label="Total Docs" value={docs.length} />
        <StatCard icon={<Brain className="w-5 h-5" />} label="Memories" value={typeCounts.memory} />
        <StatCard icon={<FileText className="w-5 h-5" />} label="Documents" value={typeCounts.document} />
        <StatCard icon={<Search className="w-5 h-5" />} label="Activities" value={typeCounts.activity} />
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg pl-10 pr-4 py-2 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>{t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {displayDocs.length === 0 ? (
        <EmptyState
          icon={<Brain className="w-12 h-12" />}
          message={isSearching ? "No results found." : "No documents yet."}
        />
      ) : (
        <div className="space-y-3">
          {(displayDocs as any[]).map((doc: any) => (
            <MemoryCard
              key={doc._id}
              doc={doc}
              expanded={expandedId === doc._id}
              onToggle={() => setExpandedId(expandedId === doc._id ? null : doc._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
