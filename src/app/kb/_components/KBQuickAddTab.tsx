"use client";

import { useState } from "react";
import { GlassPanel } from "@/components/GlassPanel";
import { Link, FileText, CheckCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface KBQuickAddTabProps {
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

const PROJECTS = [
  "Green Sea Cleveland",
  "Green Sea Detroit",
  "Mako",
  "Uni",
  "Courtside",
  "InstantIQ",
  "Personal",
];

export function KBQuickAddTab({ isModal, onClose, onSuccess }: KBQuickAddTabProps) {
  const [activeTab, setActiveTab] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [intent, setIntent] = useState("");
  const [project, setProject] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/kb/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: activeTab === "url" ? url : undefined,
          text: activeTab === "text" ? text : undefined,
          title: activeTab === "text" ? title : undefined,
          intent,
          project: project || undefined,
        }),
      });

      const data = await res.json();
      
      if (data.ok) {
        setResult({ success: true, message: "Item added successfully!" });
        // Reset form
        setUrl("");
        setTitle("");
        setText("");
        setIntent("");
        setProject("");
        onSuccess?.();
      } else {
        setResult({ success: false, message: data.error || "Failed to add item" });
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message || "An error occurred" });
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = activeTab === "url" ? url.trim() : (title.trim() && text.trim());

  const content = (
    <div className={cn("space-y-4", isModal ? "" : "max-w-2xl")}>
      {/* Tab Toggle */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/[0.05] border border-white/[0.08]">
        <button
          onClick={() => setActiveTab("url")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "url"
              ? "bg-white/[0.10] text-white"
              : "text-white/50 hover:text-white/70"
          )}
        >
          <Link className="w-4 h-4" />
          URL
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "text"
              ? "bg-white/[0.10] text-white"
              : "text-white/50 hover:text-white/70"
          )}
        >
          <FileText className="w-4 h-4" />
          Paste Text
        </button>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {activeTab === "url" ? (
          <div>
            <label className="block text-sm text-white/50 mb-2">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl bg-white/[0.07] border border-white/[0.12] text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.10] transition-all"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm text-white/50 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title..."
                className="w-full px-4 py-3 rounded-xl bg-white/[0.07] border border-white/[0.12] text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.10] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Text Content</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.07] border border-white/[0.12] text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.10] transition-all resize-none"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm text-white/50 mb-2">
            Why are you saving this? (Intent)
          </label>
          <input
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="e.g., Detroit expansion research..."
            className="w-full px-4 py-3 rounded-xl bg-white/[0.07] border border-white/[0.12] text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.10] transition-all"
          />
        </div>

        <div>
          <label className="block text-sm text-white/50 mb-2">Project</label>
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.07] border border-white/[0.12] text-white focus:outline-none focus:border-white/30 focus:bg-white/[0.10] transition-all appearance-none cursor-pointer"
            style={{ backgroundImage: "none" }}
          >
            <option value="" className="bg-gray-900">Select a project...</option>
            {PROJECTS.map((proj) => (
              <option key={proj} value={proj} className="bg-gray-900">{proj}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div className={cn(
          "p-4 rounded-xl flex items-center gap-3",
          result.success ? "bg-emerald-400/10 border border-emerald-400/30" : "bg-red-400/10 border border-red-400/30"
        )}>
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <X className="w-5 h-5 text-red-400" />
          )}
          <span className={cn("text-sm", result.success ? "text-emerald-400" : "text-red-400")}>
            {result.message}
          </span>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        className={cn(
          "w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
          isValid && !submitting
            ? "bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20"
            : "bg-white/[0.07] border border-white/[0.12] text-white/40 cursor-not-allowed"
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Adding...
          </>
        ) : (
          <>Add to Knowledge Base</>
        )}
      </button>
    </div>
  );

  if (isModal) {
    return (
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Add to Knowledge Base</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {content}
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Quick Add</h2>
        <p className="text-sm text-white/50 mt-1">Add new items to your knowledge base</p>
      </div>
      {content}
    </GlassPanel>
  );
}
