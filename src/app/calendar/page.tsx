"use client";

import { CalendarGrid } from "@/components/CalendarGrid";

export default function CalendarPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Calendar</h1>
        <p className="text-sm text-white/40 mt-1">
          Scheduled tasks and cron jobs — weekly view
        </p>
      </div>
      <CalendarGrid />
    </div>
  );
}
