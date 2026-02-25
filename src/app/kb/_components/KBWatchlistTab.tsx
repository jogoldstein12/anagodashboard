"use client";

import { useState } from "react";
import { GlassPanel } from "@/components/GlassPanel";
import { Plus, MoreHorizontal, Clock, Bookmark, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface KBWatchlistTabProps {
  snapshot: any;
}

function getFreshnessIndicator(lastResearched: string | undefined, threshold: number = 7): { color: string; label: string } {
  if (!lastResearched) return { color: "🔴", label: "never" };
  const days = Math.floor(
    (Date.now() - new Date(lastResearched).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days < threshold * 0.5) return { color: "🟢", label: "fresh" };
  if (days < threshold) return { color: "🟡", label: "aging" };
  return { color: "🔴", label: "stale" };
}

function getPriorityDots(priority: number): string {
  return "●".repeat(priority) + "○".repeat(5 - priority);
}

export function KBWatchlistTab({ snapshot }: KBWatchlistTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const watchlists = snapshot?.watchlists || [];

  const handleAdd = () => {
    setShowAddModal(true);
  };

  const handleEdit = (wl: any) => {
    setEditingWatchlist(wl);
    setMenuOpen(null);
  };

  const handleDelete = (idx: number) => {
    // In a real implementation, this would call an API
    setMenuOpen(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Active Watchlists ({watchlists.length})
        </h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Watchlist Grid */}
      {watchlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {watchlists.map((wl: any, idx: number) => {
            const freshness = getFreshnessIndicator(wl.last_researched, wl.staleness_threshold);
            return (
              <GlassPanel key={idx} className="p-4 relative group">
                {/* Menu Button */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => setMenuOpen(menuOpen === idx ? null : idx)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {menuOpen === idx && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-32 bg-black/90 backdrop-blur-xl border border-white/[0.12] rounded-lg shadow-xl z-50 py-1">
                        <button
                          onClick={() => handleEdit(wl)}
                          className="w-full px-3 py-2 text-left text-sm text-white/70 hover:bg-white/[0.08] hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(idx)}
                          className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/[0.08] transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="pr-8">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-white/90">{wl.topic}</h3>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <span className={cn(
                      "font-mono",
                      wl.priority <= 2 ? "text-red-400" : wl.priority <= 3 ? "text-amber-400" : "text-white/50"
                    )}>
                      P{wl.priority}
                    </span>
                    <span className="text-white/30">{getPriorityDots(wl.priority || 3)}</span>
                  </div>

                  {wl.related_agents && wl.related_agents.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {wl.related_agents.map((agent: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs rounded bg-white/[0.06] text-white/50"
                        >
                          {agent}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {wl.last_researched
                        ? `${Math.floor((Date.now() - new Date(wl.last_researched).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                        : "never"}
                    </span>
                    {wl.item_count !== undefined && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Bookmark className="w-3 h-3" />
                          {wl.item_count} items
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span>{freshness.color} {freshness.label}</span>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      ) : (
        <GlassPanel className="p-8 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-white mb-2">No watchlists yet</h3>
          <p className="text-white/50 mb-4">Create your first watchlist to track topics automatically.</p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20 transition-colors"
          >
            Add Watchlist
          </button>
        </GlassPanel>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingWatchlist) && (
        <AddWatchlistModal
          onClose={() => {
            setShowAddModal(false);
            setEditingWatchlist(null);
          }}
          initialData={editingWatchlist}
        />
      )}
    </div>
  );
}

function AddWatchlistModal({ onClose, initialData }: { onClose: () => void; initialData?: any }) {
  const [topic, setTopic] = useState(initialData?.topic || "");
  const [priority, setPriority] = useState(initialData?.priority || 3);
  const [agents, setAgents] = useState<string[]>(initialData?.related_agents || []);
  const [threshold, setThreshold] = useState(initialData?.staleness_threshold || 7);

  const agentOptions = ["Uni", "Mako", "GreenSea CRM", "IQ", "Courtside"];

  const toggleAgent = (agent: string) => {
    setAgents((prev) =>
      prev.includes(agent) ? prev.filter((a) => a !== agent) : [...prev, agent]
    );
  };

  const handleSubmit = () => {
    // In a real implementation, this would call an API
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassPanel className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {initialData ? "Edit Watchlist" : "Add Watchlist"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/50 mb-2">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Cleveland rental market"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.07] border border-white/[0.12] text-white placeholder:text-white/25 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-2">Priority: {priority}</label>
            <input
              type="range"
              min={1}
              max={5}
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
              className="w-full accent-emerald-400"
            />
            <div className="flex justify-between text-xs text-white/30 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-2">Related Agents</label>
            <div className="flex flex-wrap gap-2">
              {agentOptions.map((agent) => (
                <button
                  key={agent}
                  onClick={() => toggleAgent(agent)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-colors",
                    agents.includes(agent)
                      ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/30"
                      : "bg-white/[0.07] text-white/50 border border-white/[0.12] hover:bg-white/[0.10]"
                  )}
                >
                  {agents.includes(agent) && <Check className="w-3 h-3 inline mr-1" />}
                  {agent}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-2">Staleness Threshold (days)</label>
            <input
              type="number"
              min={1}
              max={90}
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.07] border border-white/[0.12] text-white focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.07] text-white/70 hover:bg-white/[0.10] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!topic.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initialData ? "Save Changes" : "Add Watchlist"}
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
