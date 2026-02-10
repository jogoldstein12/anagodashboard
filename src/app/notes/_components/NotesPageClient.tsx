"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";

export default function NotesPageClient() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="w-6 h-6 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Notes</h1>
          <p className="text-sm text-gray-400">Quick notes and scratch pad</p>
        </div>
      </div>
      <EmptyState
        icon={<FileText className="w-12 h-12" />}
        message="Notes coming soon — a quick scratch pad for capturing ideas on the fly."
      />
    </div>
  );
}
