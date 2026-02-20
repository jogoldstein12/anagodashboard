"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, X, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAddTaskProps {
  // No props needed - self-contained component
}

type Priority = "p0" | "p1" | "p2" | "p3";
type Assignee = "Anago" | "Josh";

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "p0", label: "P0", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "p1", label: "P1", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { value: "p2", label: "P2", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "p3", label: "P3", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
];

const ASSIGNEES: Assignee[] = ["Anago", "Josh"];

export function QuickAddTask({}: QuickAddTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("p1");
  const [assignee, setAssignee] = useState<Assignee>("Anago");
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const createTask = useMutation(api.tasks.create);

  // Keyboard shortcut: Cmd+Shift+K (Mac) / Ctrl+Shift+K (Windows)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "K") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setPriority("p1");
      setAssignee("Anago");
      setShowSuccess(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return;

    try {
      await createTask({
        title: title.trim(),
        description: "",
        agent: assignee.toLowerCase(),
        priority,
        status: "backlog",
      });

      setShowSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
      }, 800);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  }, [title, assignee, priority, createTask]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[480px] z-[70]"
        onClick={handleModalClick}
      >
        <div className="bg-slate-900/95 border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-white/50" />
              <span className="text-sm font-medium text-white/80">Quick Add Task</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Title Input */}
            <div>
              <input
                ref={inputRef}
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-white text-base placeholder:text-white/30 focus:outline-none"
                disabled={showSuccess}
              />
            </div>

            {/* Priority Pills */}
            <div>
              <label className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-2 block">
                Priority
              </label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => !showSuccess && setPriority(p.value)}
                    disabled={showSuccess}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                      priority === p.value
                        ? p.color
                        : "bg-white/[0.05] text-white/40 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/60"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee Toggle */}
            <div>
              <label className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-2 block">
                Assignee
              </label>
              <div className="flex gap-2">
                {ASSIGNEES.map((a) => (
                  <button
                    key={a}
                    onClick={() => !showSuccess && setAssignee(a)}
                    disabled={showSuccess}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                      assignee === a
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : "bg-white/[0.05] text-white/40 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/60"
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.08]">
            <div className="flex items-center gap-1 text-[10px] text-white/20">
              <kbd className="bg-white/[0.06] px-1 py-0.5 rounded">↵</kbd>
              <span>to add</span>
            </div>

            {showSuccess ? (
              <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                <Check className="w-4 h-4" />
                Task added
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  title.trim()
                    ? "bg-white/[0.12] text-white hover:bg-white/[0.18]"
                    : "bg-white/[0.05] text-white/30 cursor-not-allowed"
                )}
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
