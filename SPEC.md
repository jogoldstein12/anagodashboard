# Mission Control — Anago Dashboard

## Overview
A macOS-style glassmorphism dashboard for monitoring Anago (AI assistant) and all sub-agents. Built with Next.js 15 (App Router), Convex (database + real-time), and Tailwind CSS.

## Design System
- **macOS Glass UI**: frosted glass panels (`backdrop-blur-xl bg-white/10 border border-white/20`), subtle shadows, rounded corners (xl/2xl)
- **Dark theme** by default (dark background with glass panels)
- **Background**: deep gradient (`from-slate-950 via-slate-900 to-slate-950`) with subtle animated orbs/blobs for depth
- **Typography**: SF Pro / Inter, clean and minimal
- **Colors**: accent blue (#3b82f6), green for success, amber for warnings, purple for sub-agents
- **Agent badges**: Each agent gets a colored dot — Anago (blue), IQ (green), GreenSea (emerald), Courtside (orange), After Dark (purple)

## Pages & Layout

### Layout (`src/app/layout.tsx`)
- Full-screen dark background with gradient
- Left sidebar (glass panel, ~240px):
  - "Mission Control" title with 🍣 emoji
  - Nav items: Activity Feed, Calendar, Search
  - Agent filter section (toggle which agents to show)
  - Status indicators (green dots for active agents)
- Main content area with glass panel

### 1. Activity Feed (`src/app/page.tsx` — default route)
**Purpose**: Real-time log of every action across all agents.

**Convex table: `activities`**
```
{
  agent: string,        // "anago" | "iq" | "greensea" | "courtside" | "afterdark"
  action: string,       // "email_sent" | "reddit_browsed" | "file_created" | "cron_executed" | "search_performed" | "browser_action" | "message_sent" | "task_completed" | "error"
  title: string,        // Short description: "Sent Reddit opportunities email"
  description: string,  // Longer details
  metadata: object,     // Flexible JSON (links, file paths, etc.)
  status: string,       // "completed" | "in_progress" | "failed"
  timestamp: number,    // Unix ms
}
```

**UI Components**:
- Vertical timeline layout, newest first
- Each entry: glass card with agent badge (colored dot + name), action icon (from lucide-react), title, description, relative timestamp
- Filter bar at top: filter by agent, action type, status
- "Load more" pagination (25 per page)
- Action type icons: Mail (email), Globe (browser), FileText (file), Clock (cron), Search (search), MessageSquare (message), CheckCircle (task), AlertTriangle (error)

### 2. Calendar View (`src/app/calendar/page.tsx`)
**Purpose**: Weekly view of all scheduled cron jobs and upcoming tasks.

**Convex table: `scheduled_tasks`**
```
{
  name: string,
  agent: string,
  schedule: string,     // Human readable: "Weekdays at 9:00 AM"
  cronExpr: string,     // "0 9 * * 1-5"
  timezone: string,     // "America/New_York"
  nextRun: number,      // Unix ms
  lastRun: number,      // Unix ms (nullable)
  status: string,       // "active" | "paused" | "completed"
  description: string,
}
```

**UI Components**:
- Week view grid: 7 columns (Mon-Sun), rows for time slots (hourly from 6am-10pm)
- Current day highlighted with subtle glow
- Tasks shown as colored blocks in their time slots (color = agent color)
- Clicking a task opens a glass modal with full details
- Week navigation: < This Week > arrows
- "Today" button to jump back
- Mini legend showing agent colors

### 3. Global Search (`src/app/search/page.tsx`)
**Purpose**: Search across all memories, documents, tasks, and activities.

**Convex table: `documents`**
```
{
  type: string,         // "memory" | "document" | "task" | "activity"
  title: string,
  content: string,      // Full text content
  agent: string,
  filePath: string,     // Optional, for files
  tags: string[],
  timestamp: number,
}
```

**UI Components**:
- Large search bar at top (glass style, prominent)
- Real-time search as you type (debounced 300ms)
- Results grouped by type with section headers
- Each result: glass card with type icon, title, content preview (highlighted matches), agent badge, timestamp
- Filter chips: Memory, Documents, Tasks, Activities
- Empty state with search suggestions

## Convex Setup

### `convex/schema.ts`
Define all 3 tables with proper indexes:
- activities: by_agent, by_timestamp, by_action
- scheduled_tasks: by_agent, by_next_run, by_status
- documents: search index on title + content

### `convex/activities.ts`
- `list`: paginated query, with optional agent/action/status filters
- `create`: mutation to log a new activity
- `getRecent`: query last N activities

### `convex/scheduledTasks.ts`
- `list`: query all active tasks
- `getWeek`: query tasks for a specific week
- `create`: mutation
- `updateStatus`: mutation

### `convex/documents.ts`
- `search`: full-text search query across title + content
- `create`: mutation
- `listByType`: filtered query

## File Structure
```
src/
  app/
    layout.tsx          # Root layout with sidebar
    page.tsx            # Activity Feed (default)
    calendar/
      page.tsx          # Calendar week view
    search/
      page.tsx          # Global search
  components/
    Sidebar.tsx         # Glass sidebar nav
    ActivityCard.tsx     # Single activity entry
    ActivityFeed.tsx     # Activity list with filters
    CalendarGrid.tsx     # Week grid
    CalendarEvent.tsx    # Single event block
    CalendarModal.tsx    # Event detail modal
    SearchBar.tsx        # Glass search input
    SearchResult.tsx     # Single search result
    AgentBadge.tsx       # Colored agent indicator
    GlassPanel.tsx       # Reusable glass card wrapper
    StatusDot.tsx        # Active/inactive indicator
  lib/
    utils.ts            # cn() helper, date formatting
    constants.ts        # Agent colors, action icons, etc.
convex/
  schema.ts
  activities.ts
  scheduledTasks.ts
  documents.ts
```

## Seed Data
Pre-populate with realistic data so the dashboard looks great on first load:
- 20+ activity entries covering all agents and action types (use real examples from today: Reddit browsing, email sending, competitor audit, landing page review, agent activation, etc.)
- All 4 Reddit cron jobs + heartbeat schedule as scheduled tasks
- 10+ document entries from our workspace (memory files, agent configs, project docs)

## Key Implementation Notes
- Use `npx convex dev` for local development
- ConvexProvider wraps the app in layout.tsx
- All queries use `useQuery` from "convex/react"
- All mutations use `useMutation` from "convex/react"
- Search uses Convex's built-in full-text search index
- Responsive but optimized for desktop/laptop screens
- Animations: subtle fade-in on cards, smooth transitions
- No external UI libraries besides lucide-react for icons
