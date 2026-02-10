"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search memories, documents, tasks..."
        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/[0.07] border border-white/[0.12] backdrop-blur-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.10] transition-all"
        autoFocus
      />
    </div>
  );
}
