"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Search,
  ListTodo,
  Users,
  Calendar,
  DollarSign,
  Brain,
  Bell,
  Settings,
  Activity,
  Network,
  Play,
  Plus,
  ArrowRight,
  Command,
  X,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: "navigate" | "action" | "agent";
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: "nav-home", label: "Morning Briefing", description: "Go to home dashboard", icon: <Activity className="w-4 h-4" />, category: "navigate", action: () => navigate("/"), keywords: ["home", "dashboard", "briefing"] },
    { id: "nav-activity", label: "Activity Feed", description: "View all agent activity", icon: <Activity className="w-4 h-4" />, category: "navigate", action: () => navigate("/activity"), keywords: ["feed", "log", "timeline"] },
    { id: "nav-agents", label: "Agents", description: "View all agents", icon: <Users className="w-4 h-4" />, category: "navigate", action: () => navigate("/agents"), keywords: ["team", "bots"] },
    { id: "nav-tasks", label: "Tasks", description: "Kanban task board", icon: <ListTodo className="w-4 h-4" />, category: "navigate", action: () => navigate("/tasks"), keywords: ["kanban", "todo", "board"] },
    { id: "nav-calendar", label: "Calendar", description: "Cron job schedule", icon: <Calendar className="w-4 h-4" />, category: "navigate", action: () => navigate("/calendar"), keywords: ["schedule", "cron"] },
    { id: "nav-costs", label: "Costs", description: "API spend tracking", icon: <DollarSign className="w-4 h-4" />, category: "navigate", action: () => navigate("/costs"), keywords: ["money", "spend", "budget", "tokens"] },
    { id: "nav-memory", label: "Memory", description: "Browse documents & memories", icon: <Brain className="w-4 h-4" />, category: "navigate", action: () => navigate("/memory"), keywords: ["docs", "search", "files"] },
    { id: "nav-notifications", label: "Notifications", description: "Message history", icon: <Bell className="w-4 h-4" />, category: "navigate", action: () => navigate("/notifications"), keywords: ["messages", "alerts"] },
    { id: "nav-inbox", label: "Inbox", description: "Items needing your approval", icon: <Bell className="w-4 h-4" />, category: "navigate", action: () => navigate("/inbox"), keywords: ["approve", "review", "pending"] },
    { id: "nav-swarm", label: "Swarm", description: "Agent visualization", icon: <Network className="w-4 h-4" />, category: "navigate", action: () => navigate("/swarm"), keywords: ["graph", "network"] },
    { id: "nav-settings", label: "Settings", description: "Configuration", icon: <Settings className="w-4 h-4" />, category: "navigate", action: () => navigate("/settings"), keywords: ["config", "preferences"] },

    // Agents
    { id: "agent-anago", label: "Anago 🍣", description: "Orchestrator — Opus 4.6", icon: <ArrowRight className="w-4 h-4" />, category: "agent", action: () => navigate("/agents/anago"), keywords: ["main", "orchestrator"] },
    { id: "agent-iq", label: "IQ ⚡", description: "InstantIQ — Kimi K2.5", icon: <ArrowRight className="w-4 h-4" />, category: "agent", action: () => navigate("/agents/iq"), keywords: ["instantiq", "chrome"] },
    { id: "agent-greensea", label: "GreenSea 🏠", description: "Real Estate — Kimi K2.5", icon: <ArrowRight className="w-4 h-4" />, category: "agent", action: () => navigate("/agents/greensea"), keywords: ["real estate", "cleveland"] },
    { id: "agent-courtside", label: "Courtside 🏐", description: "Sports — Haiku 3.5", icon: <ArrowRight className="w-4 h-4" />, category: "agent", action: () => navigate("/agents/courtside"), keywords: ["lovb", "volleyball", "miami"] },
    { id: "agent-afterdark", label: "After Dark 🎉", description: "Party Game — Haiku 3.5", icon: <ArrowRight className="w-4 h-4" />, category: "agent", action: () => navigate("/agents/afterdark"), keywords: ["party", "game"] },
  ], []);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.keywords?.some((k) => k.includes(q))
    );
  }, [query, commands]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selectedIndex]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  const groupedCommands = {
    navigate: filtered.filter((c) => c.category === "navigate"),
    action: filtered.filter((c) => c.category === "action"),
    agent: filtered.filter((c) => c.category === "agent"),
  };

  let flatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50">
        <div className="bg-slate-900/95 border border-white/[0.15] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
            <Search className="w-5 h-5 text-white/30" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search commands, pages, agents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none"
            />
            <kbd className="hidden sm:flex items-center gap-1 text-[10px] text-white/20 bg-white/[0.06] px-1.5 py-0.5 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-white/30">
                No results found
              </div>
            ) : (
              <>
                {groupedCommands.navigate.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 text-[10px] font-medium text-white/20 uppercase tracking-wider">
                      Pages
                    </div>
                    {groupedCommands.navigate.map((cmd) => {
                      const idx = flatIndex++;
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            idx === selectedIndex
                              ? "bg-blue-500/20 text-white"
                              : "text-white/70 hover:bg-white/[0.05]"
                          }`}
                        >
                          <span className="text-white/40">{cmd.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">{cmd.label}</div>
                            {cmd.description && (
                              <div className="text-xs text-white/30 truncate">{cmd.description}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {groupedCommands.agent.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 text-[10px] font-medium text-white/20 uppercase tracking-wider mt-1">
                      Agents
                    </div>
                    {groupedCommands.agent.map((cmd) => {
                      const idx = flatIndex++;
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            idx === selectedIndex
                              ? "bg-blue-500/20 text-white"
                              : "text-white/70 hover:bg-white/[0.05]"
                          }`}
                        >
                          <span className="text-white/40">{cmd.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">{cmd.label}</div>
                            {cmd.description && (
                              <div className="text-xs text-white/30 truncate">{cmd.description}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {groupedCommands.action.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 text-[10px] font-medium text-white/20 uppercase tracking-wider mt-1">
                      Actions
                    </div>
                    {groupedCommands.action.map((cmd) => {
                      const idx = flatIndex++;
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            idx === selectedIndex
                              ? "bg-blue-500/20 text-white"
                              : "text-white/70 hover:bg-white/[0.05]"
                          }`}
                        >
                          <span className="text-white/40">{cmd.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">{cmd.label}</div>
                            {cmd.description && (
                              <div className="text-xs text-white/30 truncate">{cmd.description}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.08] text-[10px] text-white/20">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="bg-white/[0.06] px-1 py-0.5 rounded">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-white/[0.06] px-1 py-0.5 rounded">↵</kbd> select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-white/[0.06] px-1 py-0.5 rounded">esc</kbd> close
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Command className="w-3 h-3" />K to toggle
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
