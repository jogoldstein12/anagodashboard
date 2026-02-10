"use client";

import { useState, useMemo, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { SearchResult } from "@/components/SearchResult";
import { GlassPanel } from "@/components/GlassPanel";
import { BookOpen, FileText, CheckCircle, Activity } from "lucide-react";

const TYPE_FILTERS = [
  { key: "all", label: "All", icon: null },
  { key: "memory", label: "Memory", icon: BookOpen },
  { key: "document", label: "Documents", icon: FileText },
  { key: "task", label: "Tasks", icon: CheckCircle },
  { key: "activity", label: "Activities", icon: Activity },
];

// Mock data for development
const MOCK_DOCUMENTS = [
  {
    _id: "1",
    type: "memory",
    title: "Agent Framework Design",
    content: "Designed 5-agent system: Anago (orchestrator), IQ (InstantIQ), GreenSea (real estate), Courtside (sports), After Dark (party game). Created AGENT-FRAMEWORK.md with 4-level trust system.",
    agent: "anago",
    filePath: "/workspace/AGENT-FRAMEWORK.md",
    tags: ["framework", "agents", "architecture"],
    timestamp: Date.now() - 8 * 3600000,
  },
  {
    _id: "2",
    type: "document",
    title: "Reddit Launch Playbook",
    content: "Extracted 60K-char Reddit Launch Playbook from Josh's Claude History. Saved to projects/instantiq/REDDIT_LAUNCH_PLAYBOOK.md.",
    agent: "iq",
    filePath: "projects/instantiq/REDDIT_LAUNCH_PLAYBOOK.md",
    tags: ["reddit", "marketing", "playbook"],
    timestamp: Date.now() - 6.5 * 3600000,
  },
  {
    _id: "3",
    type: "task",
    title: "Competitor Audit Complete",
    content: "Analyzed QuizSolverAI ($18.75/mo), Solvely (100K users), Quizard (5.0★ rating). InstantIQ's pricing ($4.99-$9.99) is significantly more competitive.",
    agent: "iq",
    tags: ["competitor", "analysis", "pricing"],
    timestamp: Date.now() - 5.5 * 3600000,
  },
  {
    _id: "4",
    type: "activity",
    title: "First boot complete",
    content: "Met Josh, completed full setup with 6 models configured, Telegram paired, Reddit + Twitter logged in.",
    agent: "anago",
    tags: ["setup", "onboarding"],
    timestamp: Date.now() - 10 * 3600000,
  },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const debouncedQuery = useDebounce(query, 300);

  // Mock implementation for now
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    
    const lowerQuery = debouncedQuery.toLowerCase();
    return MOCK_DOCUMENTS.filter(doc => {
      if (typeFilter !== "all" && doc.type !== typeFilter) return false;
      
      return (
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.content.toLowerCase().includes(lowerQuery) ||
        doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }, [debouncedQuery, typeFilter]);

  const grouped = useMemo(() => {
    if (!results) return {};
    const groups: Record<string, typeof results> = {};
    for (const r of results) {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    }
    return groups;
  }, [results]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Search</h1>
        <p className="text-sm text-white/40 mt-1">
          Find anything across memories, documents, and tasks
        </p>
      </div>

      <SearchBar value={query} onChange={setQuery} />

      {/* Type filters */}
      <div className="flex items-center gap-2 mt-4 mb-6">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setTypeFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === f.key
                ? "bg-white/[0.12] text-white font-medium"
                : "bg-white/[0.04] text-white/40 hover:text-white/60 hover:bg-white/[0.07]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {!debouncedQuery.trim() ? (
        <GlassPanel className="p-12 text-center">
          <div className="text-white/20 text-sm">
            <p className="text-lg mb-2">🔍</p>
            <p>Start typing to search across all your data</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["InstantIQ", "Reddit", "Cleveland", "competitors", "taxes"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/30 hover:text-white/50 hover:bg-white/[0.10] transition-all"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        </GlassPanel>
      ) : results === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <GlassPanel className="p-12 text-center">
          <p className="text-white/30 text-sm">
            No results found for &ldquo;{debouncedQuery}&rdquo;
          </p>
        </GlassPanel>
      ) : (
        <div className="space-y-2">
          {results.map((result: any) => (
            <SearchResult
              key={result._id}
              type={result.type}
              title={result.title}
              content={result.content}
              agent={result.agent}
              filePath={result.filePath}
              tags={result.tags}
              timestamp={result.timestamp}
              query={debouncedQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
