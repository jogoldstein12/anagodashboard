"use client";

import { useState, useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  isSameDay,
  isToday,
  eachDayOfInterval,
  setHours,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AGENTS, type AgentKey } from "@/lib/constants";
import { CalendarEvent } from "./CalendarEvent";
import { CalendarModal } from "./CalendarModal";
import { GlassPanel } from "./GlassPanel";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am - 10pm

// Mock data for development
const MOCK_TASKS = [
  {
    _id: "1",
    name: "Reddit Comments - 9am",
    agent: "anago",
    schedule: "Weekdays at 9:00 AM",
    cronExpr: "0 9 * * 1-5",
    timezone: "America/New_York",
    nextRun: Date.now() + 16 * 3600000,
    status: "active",
    description: "Browse Reddit for 5-7 comment opportunities. Generate ready-to-paste comments in Josh's voice.",
  },
  {
    _id: "2",
    name: "Reddit Comments - 10:30am",
    agent: "anago",
    schedule: "Weekdays at 10:30 AM",
    cronExpr: "30 10 * * 1-5",
    timezone: "America/New_York",
    nextRun: Date.now() + 17.5 * 3600000,
    status: "active",
    description: "Mid-morning Reddit scan. Find fresh posts for karma building.",
  },
  {
    _id: "3",
    name: "Heartbeat - Full Check",
    agent: "anago",
    schedule: "Every 30 min (8am-4pm)",
    cronExpr: "*/30 8-15 * * *",
    timezone: "America/New_York",
    nextRun: Date.now() + 0.5 * 3600000,
    status: "active",
    description: "Full heartbeat check: email, calendar, Reddit monitoring, Twitter notifications, weather.",
  },
  {
    _id: "4",
    name: "EOD Report",
    agent: "anago",
    schedule: "Weekdays at 5:00 PM",
    cronExpr: "0 17 * * 1-5",
    timezone: "America/New_York",
    nextRun: Date.now() + 86400000,
    status: "active",
    description: "End-of-day summary report for all agents.",
  },
];

export function CalendarGrid() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const tasks = MOCK_TASKS;

  // For recurring tasks, generate occurrences for the current week
  const weekEvents = useMemo(() => {
    if (!tasks) return [];

    const events: Array<{
      task: typeof tasks[0];
      day: Date;
      hour: number;
      minute: number;
    }> = [];

    for (const task of tasks as any[]) {
      if (task.status !== "active") continue;

      // Parse cron to get day-of-week and time
      const parts = task.cronExpr.split(" ");
      if (parts.length < 5) continue;

      const minute = parts[0] === "*" ? 0 : parseInt(parts[0]);
      const hour = parts[1] === "*" ? 9 : parseInt(parts[1]);
      const dow = parts[4]; // day of week

      // Determine which days this runs
      let runDays: number[] = [];
      if (dow === "*") {
        runDays = [0, 1, 2, 3, 4, 5, 6];
      } else if (dow.includes("-")) {
        const [start, end] = dow.split("-").map(Number);
        for (let d = start; d <= end; d++) runDays.push(d);
      } else if (dow.includes(",")) {
        runDays = dow.split(",").map(Number);
      } else {
        runDays = [parseInt(dow)];
      }

      // Map to days in the week
      for (const day of days) {
        const jsDay = day.getDay(); // 0=Sun
        // cron: 0=Sun or 7=Sun, 1=Mon...
        if (runDays.includes(jsDay) || (jsDay === 0 && runDays.includes(7))) {
          events.push({ task, day, hour, minute });
        }
      }

      // Handle */N patterns for hours
      if (parts[1].startsWith("*/")) {
        const interval = parseInt(parts[1].replace("*/", ""));
        const hourRange = parts[1]; // Already handled above
      }
    }

    return events;
  }, [tasks, days]);

  const getEventsForDayHour = (day: Date, hour: number) => {
    return weekEvents.filter(
      (e) => isSameDay(e.day, day) && e.hour === hour
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            className="p-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-white/50 hover:text-white/80 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-medium text-white/70">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </h2>
          <button
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            className="p-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-white/50 hover:text-white/80 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-white/50 hover:text-white/80 transition-all"
          >
            Today
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        {(Object.keys(AGENTS) as AgentKey[]).map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-[10px] text-white/40">
            <span
              className="w-2.5 h-2.5 rounded"
              style={{ backgroundColor: AGENTS[key].color + "44" }}
            />
            {AGENTS[key].label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <GlassPanel className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.08]">
              <div className="p-2" />
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`p-2 text-center border-l border-white/[0.06] ${
                    isToday(day)
                      ? "bg-blue-500/[0.08]"
                      : ""
                  }`}
                >
                  <div className="text-[10px] text-white/30 uppercase">
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      isToday(day) ? "text-blue-400" : "text-white/60"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>

            {/* Time rows */}
            <div className="max-h-[600px] overflow-y-auto">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.04] min-h-[48px]"
                >
                  <div className="p-1 text-[10px] text-white/20 text-right pr-2 pt-1">
                    {hour === 0
                      ? "12 AM"
                      : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                      ? "12 PM"
                      : `${hour - 12} PM`}
                  </div>
                  {days.map((day) => {
                    const events = getEventsForDayHour(day, hour);
                    return (
                      <div
                        key={day.toISOString() + hour}
                        className={`border-l border-white/[0.04] p-0.5 ${
                          isToday(day) ? "bg-blue-500/[0.03]" : ""
                        }`}
                      >
                        {events.map((e, i) => (
                          <CalendarEvent
                            key={i}
                            name={e.task.name}
                            agent={e.task.agent}
                            nextRun={setHours(e.day, e.hour).getTime()}
                            schedule={e.task.schedule}
                            onClick={() => setSelectedTask(e.task)}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Modal */}
      {selectedTask && (
        <CalendarModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
