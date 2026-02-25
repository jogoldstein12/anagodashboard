"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { GlassPanel } from "@/components/GlassPanel";
import { SearchBar } from "@/components/SearchBar";
import { KBItemDrawer } from "./KBItemDrawer";
import { Search, Filter, Calendar, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface KBSearchTabProps {
  snapshot: any;
}

const CATEGORIES = [
  "All",
  "Real Estate",
  "Economic Indicator",
  "Mako Macro",
  "LOVB/Sports",
  "InstantIQ",
  "Affordable Housing",
  "Deal Docs",
  "Research Reports",
  "Personal",
];

const SOURCES = [
  "All",
  "BLS",
  "HUD",
  "Federal Reserve",
  "Twitter",
  "Reddit",
  "Deep Research",
  "last30days",
  "Email",
  "Manual",
];

const PROJECTS = [
  "All",
  "Green Sea Cleveland",
  "Green Sea Detroit",
  "Mako",
  "Uni",
  "Courtside",
  "InstantIQ",
];

const FRESHNESS_OPTIONS = [
  { id: "all", label: "All" },
  { id: "fresh", label: "Fresh (<7d)", days: 7 },
  { id: "recent", label: "Recent (7-30d)", days: 30 },
  { id: "aging", label: "Aging (30-90d)", days: 90 },
  { id: "stale", label: "Stale (>90d)", days: 999 },
];

function getFreshnessColor(ingestedAt: string): string {
  const days = Math.floor(
    (Date.now() - new Date(ingestedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days < 7) return "bg-emerald-400";
  if (days < 30) return "bg-amber-400";
  return "bg-red-400";
}

function getQualityStars(score: number | undefined): string {
  if (!score) return "☆☆☆☆☆";
  const filled = Math.round(score * 5);
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

export function KBSearchTab({ snapshot }: KBSearchTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSource, setSelectedSource] = useState("All");
  const [selectedProject, setSelectedProject] = useState("All");
  const [selectedFreshness, setSelectedFreshness] = useState("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Debounce search query
  const debouncedQuery = useMemo(() => {
    return searchQuery;
  }, [searchQuery]);

  // Use recent items from snapshot as fallback
  const items = useMemo(() => {
    if (!snapshot?.recent_items) return [];
    
    let filtered = [...snapshot.recent_items];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          item.content_summary?.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (item) => item.primary_category === selectedCategory
      );
    }
    
    // Filter by source
    if (selectedSource !== "All") {
      filtered = filtered.filter(
        (item) => item.source_type === selectedSource
      );
    }
    
    // Filter by project
    if (selectedProject !== "All") {
      filtered = filtered.filter(
        (item) => item.save_project === selectedProject
      );
    }
    
    // Filter by freshness
    if (selectedFreshness !== "all") {
      const option = FRESHNESS_OPTIONS.find((o) => o.id === selectedFreshness);
      if (option) {
        const now = Date.now();
        filtered = filtered.filter((item) => {
          const itemDate = new Date(item.ingested_at).getTime();
          const days = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
          if (selectedFreshness === "fresh") return days < 7;
          if (selectedFreshness === "recent") return days >= 7 && days < 30;
          if (selectedFreshness === "aging") return days >= 30 && days < 90;
          if (selectedFreshness === "stale") return days >= 90;
          return true;
        });
      }
    }
    
    return filtered;
  }, [snapshot, searchQuery, selectedCategory, selectedSource, selectedProject, selectedFreshness]);

  if (!snapshot) {
    return (
      <GlassPanel className="p-8 text-center">
        <div className="text-4xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-white mb-2">KB not yet synced</h3>
        <p className="text-white/50">Run sync-kb.mjs to populate the Knowledge Base.</p>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search knowledge base..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/[0.07] border border-white/[0.12] backdrop-blur-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.10] transition-all"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {/* Category Filter */}
        <div className="relative group">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none px-3 py-1.5 rounded-lg bg-white/[0.07] border border-white/[0.12] text-sm text-white/80 focus:outline-none focus:border-white/30 cursor-pointer pr-8"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
        </div>

        {/* Source Filter */}
        <div className="relative group">
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="appearance-none px-3 py-1.5 rounded-lg bg-white/[0.07] border border-white/[0.12] text-sm text-white/80 focus:outline-none focus:border-white/30 cursor-pointer pr-8"
          >
            {SOURCES.map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
          <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
        </div>

        {/* Project Filter */}
        <div className="relative group">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="appearance-none px-3 py-1.5 rounded-lg bg-white/[0.07] border border-white/[0.12] text-sm text-white/80 focus:outline-none focus:border-white/30 cursor-pointer pr-8"
          >
            {PROJECTS.map((proj) => (
              <option key={proj} value={proj}>{proj}</option>
            ))}
          </select>
          <Briefcase className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
        </div>

        {/* Freshness Filter */}
        <div className="relative group">
          <select
            value={selectedFreshness}
            onChange={(e) => setSelectedFreshness(e.target.value)}
            className="appearance-none px-3 py-1.5 rounded-lg bg-white/[0.07] border border-white/[0.12] text-sm text-white/80 focus:outline-none focus:border-white/30 cursor-pointer pr-8"
          >
            {FRESHNESS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
        </div>
      </div>

      {/* Results Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <GlassPanel
              key={item.item_id}
              className="p-4 cursor-pointer hover:bg-white/[0.10] transition-colors"
              onClick={() => setSelectedItem(item)}
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", getFreshnessColor(item.ingested_at))} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white/90 truncate">{item.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
                    <span>{item.source_type}</span>
                    <span>·</span>
                    <span>{item.primary_category}</span>
                    <span>·</span>
                    <span>{new Date(item.ingested_at).toLocaleDateString()}</span>
                  </div>
                  {item.content_summary && (
                    <p className="text-sm text-white/60 mt-2 line-clamp-2">
                      {item.content_summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    {item.save_project && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.08] text-white/60">
                        {item.save_project}
                      </span>
                    )}
                    <span className="text-xs text-amber-400/80">
                      {getQualityStars(item.quality_score)}
                    </span>
                  </div>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      ) : (
        <GlassPanel className="p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-white mb-2">No items found</h3>
          <p className="text-white/50">
            {searchQuery 
              ? "Try adjusting your search or filters." 
              : "No items yet. Add your first item with Quick Add →"}
          </p>
        </GlassPanel>
      )}

      {/* Item Drawer */}
      {selectedItem && (
        <KBItemDrawer 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </div>
  );
}
