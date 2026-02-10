"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Calendar, Search, Users, Network, ListTodo, DollarSign, Brain, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENTS, type AgentKey, AGENT_EMOJI } from "@/lib/constants";
import { StatusDot } from "./StatusDot";
import { GlassPanel } from "./GlassPanel";

const NAV_ITEMS = [
  { href: "/", label: "Activity Feed", icon: Activity },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/swarm", label: "Swarm", icon: Network },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/costs", label: "Costs", icon: DollarSign },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/search", label: "Search", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <GlassPanel className="w-60 flex-shrink-0 flex flex-col h-full p-4 rounded-none rounded-r-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          🍣 Mission Control
        </h1>
        <p className="text-xs text-white/40 mt-1">Anago Agent Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 mb-8">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                isActive
                  ? "bg-white/[0.12] text-white font-medium"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Agents */}
      <div>
        <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3 px-3">
          Agents
        </h2>
        <div className="space-y-1">
          {(Object.keys(AGENTS) as AgentKey[]).map((key) => (
            <Link
              key={key}
              href={`/agents/${key}`}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200",
                pathname === `/agents/${key}`
                  ? "bg-white/[0.12] text-white"
                  : "text-white/60 hover:text-white/80 hover:bg-white/[0.05]"
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs">{AGENT_EMOJI[key]}</span>
                {AGENTS[key].label}
              </span>
              <StatusDot active={key === "anago" || key === "iq"} />
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-white/[0.08]">
        <p className="text-[10px] text-white/20 text-center">
          v1.0 · Feb 2026
        </p>
      </div>
    </GlassPanel>
  );
}
