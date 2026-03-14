"use client";

import { useState, useEffect, useMemo } from "react";
import { GlassPanel } from "@/components/GlassPanel";
import { ExternalLink, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "dashboard" | "elo";

interface EloPlayer {
  player_name: string;
  overall_elo: number;
  grass_elo: number;
  hard_elo: number;
  clay_elo: number;
  total_matches: number;
  grass_matches: number;
  last_updated: string;
}

type SortField = "grass_elo" | "overall_elo" | "hard_elo" | "clay_elo";

export function TennisDashboardClient() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [players, setPlayers] = useState<EloPlayer[]>([]);
  const [eloError, setEloError] = useState<string | null>(null);
  const [eloLoading, setEloLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("grass_elo");

  useEffect(() => {
    if (tab === "elo" && players.length === 0 && !eloLoading) {
      setEloLoading(true);
      fetch("/api/tennis/elo")
        .then((r) => r.json())
        .then((data) => {
          setPlayers(data.players ?? []);
          if (data.error) setEloError(data.error);
        })
        .catch((e) => setEloError(e.message))
        .finally(() => setEloLoading(false));
    }
  }, [tab, players.length, eloLoading]);

  const filteredPlayers = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = q
      ? players.filter((p) => p.player_name.toLowerCase().includes(q))
      : players;
    return [...filtered]
      .sort((a, b) => b[sortBy] - a[sortBy])
      .slice(0, 50);
  }, [players, search, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span>🎾</span> Tennis Grass Betting
          </h1>
          <p className="text-white/50 mt-1">
            Queens/Halle &middot; Wimbledon 2026
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400">Live</span>
          <span className="text-white/40 ml-1">Dashboard Running</span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {(
          [
            { id: "dashboard", label: "Dashboard" },
            { id: "elo", label: "ELO Ratings" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
              tab === t.id
                ? "bg-white/[0.12] text-white"
                : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "dashboard" && <DashboardTab />}
      {tab === "elo" && (
        <EloTab
          players={filteredPlayers}
          loading={eloLoading}
          error={eloError}
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      )}
    </div>
  );
}

function DashboardTab() {
  return (
    <div className="space-y-4">
      <GlassPanel className="p-0 overflow-hidden">
        <iframe
          src="http://localhost:8503"
          className="w-full border-0"
          style={{ height: "calc(100vh - 200px)" }}
          title="Tennis Betting Dashboard"
        />
      </GlassPanel>

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30">
          Dashboard runs locally on Mac mini &middot; Access via local network
        </p>
        <a
          href="http://localhost:8503"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
        >
          Open in New Tab
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

interface EloTabProps {
  players: EloPlayer[];
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (v: string) => void;
  sortBy: SortField;
  onSortChange: (v: SortField) => void;
}

function EloTab({
  players,
  loading,
  error,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
}: EloTabProps) {
  if (loading) {
    return (
      <GlassPanel className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-white/10 rounded w-1/4 mb-4" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-white/10 rounded" />
          ))}
        </div>
      </GlassPanel>
    );
  }

  if (error && players.length === 0) {
    return (
      <GlassPanel className="p-6">
        <p className="text-white/50 text-sm">{error}</p>
      </GlassPanel>
    );
  }

  const sortOptions: { field: SortField; label: string }[] = [
    { field: "grass_elo", label: "Grass" },
    { field: "overall_elo", label: "Overall" },
    { field: "hard_elo", label: "Hard" },
    { field: "clay_elo", label: "Clay" },
  ];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/[0.07] border border-white/[0.12] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <span>Sort:</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.field}
              onClick={() => onSortChange(opt.field)}
              className={cn(
                "px-2 py-1 rounded-lg transition-colors",
                sortBy === opt.field
                  ? "bg-white/[0.12] text-white"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <GlassPanel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-white/40 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Player</th>
                <th className="text-right px-4 py-3 font-medium">Overall</th>
                <th className="text-right px-4 py-3 font-medium">Grass</th>
                <th className="text-right px-4 py-3 font-medium">Hard</th>
                <th className="text-right px-4 py-3 font-medium">Clay</th>
                <th className="text-right px-4 py-3 font-medium">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr
                  key={p.player_name}
                  className="border-b border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                >
                  <td className="px-4 py-3 text-white/30">{i + 1}</td>
                  <td className="px-4 py-3 text-white font-medium">
                    {p.player_name}
                  </td>
                  <td className="px-4 py-3 text-right text-white/70">
                    {p.overall_elo.toFixed(1)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-medium",
                      sortBy === "grass_elo"
                        ? "text-emerald-400"
                        : "text-white/70"
                    )}
                  >
                    {p.grass_elo.toFixed(1)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right",
                      sortBy === "hard_elo"
                        ? "text-blue-400 font-medium"
                        : "text-white/70"
                    )}
                  >
                    {p.hard_elo.toFixed(1)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right",
                      sortBy === "clay_elo"
                        ? "text-orange-400 font-medium"
                        : "text-white/70"
                    )}
                  >
                    {p.clay_elo.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right text-white/30 text-xs">
                    {p.last_updated}
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-white/30"
                  >
                    No players found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      <p className="text-xs text-white/20">
        Showing top {players.length} by{" "}
        {sortOptions.find((o) => o.field === sortBy)?.label} ELO
      </p>
    </div>
  );
}
