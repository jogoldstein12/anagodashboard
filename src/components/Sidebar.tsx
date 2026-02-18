"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Calendar, Search, Users, Network, ListTodo, DollarSign, Brain, Bell, Settings, Inbox, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENTS, type AgentKey, AGENT_EMOJI } from "@/lib/constants";
import { StatusDot } from "./StatusDot";
import { GlassPanel } from "./GlassPanel";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Activity },
  { href: "/activity", label: "Activity Feed", icon: Activity },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/oracle", label: "Oracle", icon: DollarSign },
  { href: "/swarm", label: "Swarm", icon: Network },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/costs", label: "Costs", icon: DollarSign },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/search", label: "Search", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        window.innerWidth < 768 &&
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      onClose();
    }
  }, [pathname, onClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (window.innerWidth < 768 && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const sidebarContent = (
    <>
      {/* Close button (mobile only) */}
      <button
        onClick={onClose}
        className="md:hidden absolute top-4 right-4 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors z-50"
        aria-label="Close sidebar"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          🍣 Mission Control
        </h1>
        <p className="text-xs text-white/40 mt-1">Anago Agent Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 mb-8 overflow-y-auto">
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
      <div className="overflow-y-auto">
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
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - always visible */}
      <div className="hidden md:block">
        <GlassPanel className="w-60 flex-shrink-0 flex flex-col h-full p-4 rounded-none rounded-r-2xl">
          {sidebarContent}
        </GlassPanel>
      </div>

      {/* Mobile Sidebar - overlay */}
      <>
        {/* Backdrop */}
        <div
          className={cn(
            "md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300",
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={onClose}
        />
        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className={cn(
            "md:hidden fixed top-0 left-0 h-full w-72 z-50 transition-transform duration-300 ease-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <GlassPanel className="h-full flex flex-col p-4 rounded-none rounded-r-2xl overflow-y-auto">
            {sidebarContent}
          </GlassPanel>
        </div>
      </>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden fixed top-4 left-4 z-30 p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-white/15 transition-all"
      aria-label="Open sidebar"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
