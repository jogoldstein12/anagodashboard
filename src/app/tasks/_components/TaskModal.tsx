"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Modal } from "@/components/ui/Modal";
import { AGENTS, type AgentKey } from "@/lib/constants";
import type { Task } from "@/lib/types";
import { Trash2 } from "lucide-react";

const STATUSES = [
  { value: "backlog", label: "Backlog" },
  { value: "up_next", label: "Up Next" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const PRIORITIES = [
  { value: "p0", label: "P0 - Critical" },
  { value: "p1", label: "P1 - High" },
  { value: "p2", label: "P2 - Medium" },
  { value: "p3", label: "P3 - Low" },
];

const agentKeys = Object.keys(AGENTS) as AgentKey[];

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
}

export function TaskModal({ isOpen, onClose, task }: TaskModalProps) {
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [agent, setAgent] = useState<string>("anago");
  const [priority, setPriority] = useState<string>("p2");
  const [status, setStatus] = useState<string>("backlog");
  const [dueDate, setDueDate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEdit = !!task;

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setAgent(task.agent);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    } else {
      setTitle("");
      setDescription("");
      setAgent("anago");
      setPriority("p2");
      setStatus("backlog");
      setDueDate("");
    }
    setConfirmDelete(false);
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const dueDateMs = dueDate ? new Date(dueDate).getTime() : undefined;

      if (isEdit) {
        await updateTask({
          id: task._id as any,
          title: title.trim(),
          description: description.trim(),
          agent,
          priority,
          status,
          dueDate: dueDateMs,
        });
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim(),
          agent,
          priority,
          status,
          dueDate: dueDateMs,
        });
      }
      onClose();
    } catch {
      // mutation failed — form stays open so user can retry
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setSaving(true);
    try {
      await removeTask({ id: task._id as any });
      onClose();
    } catch {
      // mutation failed
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Task" : "New Task"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className={inputClass}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
            className={inputClass + " resize-none"}
          />
        </div>

        {/* Agent + Priority row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Agent</label>
            <select value={agent} onChange={(e) => setAgent(e.target.value)} className={inputClass}>
              {agentKeys.map((key) => (
                <option key={key} value={key}>{AGENTS[key].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status + Due Date row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors ${
                  confirmDelete
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "text-white/40 hover:text-red-400 hover:bg-white/[0.06]"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {confirmDelete ? "Confirm Delete" : "Delete"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-white/50 hover:text-white/80 px-3 py-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 rounded-lg transition-colors"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
