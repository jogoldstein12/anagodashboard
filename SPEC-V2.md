# Mission Control v2 — Full Architecture

## Overview
Comprehensive agent operations center for monitoring and managing Anago and all sub-agents. macOS glassmorphism UI, real-time data via Convex, built with Next.js 15.

---

## Pages & Routes

### 1. Activity Feed `/` (Enhanced)
- Vertical timeline, newest first
- Each card is **clickable** → expands inline or opens modal with:
  - Full description
  - Commands/processes run (exec logs)
  - Files created/modified (with diffs if available)
  - Code written (syntax highlighted)
  - Token usage + cost for that task
  - Duration
  - Session ID + link to session timeline
- Filters: agent, action type, status, date range
- Real-time updates (Convex subscriptions)
- Infinite scroll pagination

### 2. Agent Overview `/agents`
- Grid of agent cards (Anago, IQ, GreenSea, Courtside, After Dark)
- Each card shows:
  - Agent name, emoji, colored badge
  - Trust level (L1-L4) with visual indicator
  - Current status (active/idle/offline)
  - Model being used
  - Tasks completed today / this week
  - Current task (if any) with progress
  - Token usage today
- Click card → Agent Profile

### 3. Agent Profile `/agents/[id]`
- Header: agent name, emoji, model, trust level, status
- Tabs:
  - **Overview**: Stats (tasks today/week/total, tokens used, cost), current task, recent activity
  - **Activity**: Filtered activity feed for just this agent
  - **Sessions**: List of all sessions (main + sub-agent), with duration, token count, status
  - **Memory**: Agent's SOUL.md, CONTEXT.md, PRIORITIES.md rendered as markdown
  - **Config**: Model, trust level, allowed tools, workspace path

### 4. Swarm Visualization `/swarm`
- Interactive graph/tree showing agent hierarchy:
  - Anago (center/root) → spawned sub-agents as children
  - Lines show message flow / task delegation
  - Node size = activity level
  - Node color = agent color
  - Animated pulses for active connections
- Built with SVG + CSS animations (no heavy D3 dependency)
- Timeline slider at bottom to replay agent interactions over time
- Hover node → tooltip with agent stats
- Click node → navigate to agent profile

### 5. Calendar `/calendar` (Enhanced)
- Weekly view (existing)
- Add: Monthly view toggle
- Cron health indicators:
  - Green dot = last run succeeded
  - Red dot = last run failed
  - Gray dot = hasn't run yet
- Click event → modal with:
  - Full task details
  - Run history (last 10 runs with status/duration)
  - Next scheduled run
  - Quick action: "Run Now" button

### 6. Task Queue `/tasks`
- Kanban-style board with columns:
  - **Backlog** — future tasks, ideas
  - **Up Next** — queued for today/tomorrow
  - **In Progress** — currently being worked on
  - **Done** — completed (collapsible, last 7 days)
- Each task card:
  - Title, description
  - Assigned agent (badge)
  - Priority (P0-P3 with color)
  - Due date (if any)
  - Status
  - Created/updated timestamps
- Drag & drop between columns (stretch goal)
- Add task form (glass modal)
- Filter by agent, priority

### 7. Cost Dashboard `/costs`
- Time period selector: Today, This Week, This Month
- Summary cards row:
  - Total tokens (in/out)
  - Estimated cost
  - Most expensive agent
  - Most expensive model
- Charts:
  - Bar chart: cost by agent (stacked by model)
  - Line chart: daily cost trend
  - Pie chart: model usage distribution
- Table: detailed breakdown per agent per model
  - Agent | Model | Tokens In | Tokens Out | Est. Cost
- Built with simple SVG charts (no chart library needed)

### 8. Memory Browser `/memory`
- File tree sidebar showing:
  - MEMORY.md
  - memory/*.md files
  - Agent-specific files (agents/iq/SOUL.md, etc.)
- Main panel: rendered markdown content
- Edit button → switch to textarea editor
- Search within files
- Last modified timestamp per file
- Tabs for different memory scopes (Global, Per-Agent)

### 9. Global Search `/search` (Enhanced)
- Existing search + improvements:
  - Search across activities, tasks, documents, memory, sessions
  - Result type badges with icons
  - Preview panel on click (split view)
  - Filter by date range
  - Keyboard shortcuts (/ to focus search)

### 10. Notification Center `/notifications`
- Chronological list of all outbound communications:
  - Telegram messages sent to Josh
  - Emails sent
  - Alerts raised
- Status: sent/delivered/read
- Click to see full message content
- Filter by channel (Telegram, Email)

### 11. Settings `/settings`
- Quick Actions panel:
  - "Run Reddit Scan" button
  - "Force Heartbeat" button
  - "Spawn Agent Task" (dropdown agent + text input)
  - "Check Email" button
- Agent configuration overview
- Cron job management (enable/disable/edit)
- Hook status (command-logger, session-memory)

---

## Data Schema (Convex)

### activities (enhanced)
```
{
  agent: string,
  action: string,
  title: string,
  description: string,
  metadata: optional(any),     // { commands: [], files: [], diffs: [], codeWritten: string }
  status: string,
  timestamp: number,
  duration: optional(number),  // ms
  tokensIn: optional(number),
  tokensOut: optional(number),
  cost: optional(number),      // estimated USD
  sessionId: optional(string),
  parentActivityId: optional(id),  // for sub-tasks
}
```

### scheduled_tasks (enhanced)
```
{
  name: string,
  agent: string,
  schedule: string,
  cronExpr: string,
  timezone: string,
  nextRun: number,
  lastRun: optional(number),
  status: string,
  description: string,
  runHistory: optional(array),  // last 10 runs: [{timestamp, status, duration}]
}
```

### documents (existing, no changes)

### tasks (NEW — for task queue)
```
{
  title: string,
  description: string,
  agent: string,
  priority: string,        // "p0" | "p1" | "p2" | "p3"
  status: string,          // "backlog" | "up_next" | "in_progress" | "done"
  dueDate: optional(number),
  createdAt: number,
  updatedAt: number,
  completedAt: optional(number),
}
```

### agents (NEW — agent registry)
```
{
  agentId: string,         // "anago" | "iq" | "greensea" | "courtside" | "afterdark"
  name: string,
  emoji: string,
  model: string,
  trustLevel: string,      // "L1" | "L2" | "L3" | "L4"
  status: string,          // "active" | "idle" | "offline"
  color: string,           // hex color
  currentTask: optional(string),
  tokensToday: number,
  tasksToday: number,
  tasksTotal: number,
  lastActive: number,
}
```

### sessions (NEW — session tracking)
```
{
  sessionId: string,
  sessionKey: string,
  agent: string,
  parentSessionId: optional(string),  // for sub-agent tree
  model: string,
  status: string,          // "active" | "completed" | "error"
  startedAt: number,
  endedAt: optional(number),
  tokensIn: number,
  tokensOut: number,
  cost: number,
  taskSummary: optional(string),
}
```

### notifications (NEW)
```
{
  channel: string,         // "telegram" | "email"
  recipient: string,
  subject: optional(string),
  content: string,
  status: string,          // "sent" | "delivered" | "read"
  timestamp: number,
  activityId: optional(id),
}
```

---

## Component Architecture

### Shared Components
- GlassPanel (existing)
- AgentBadge (existing)
- StatusDot (existing)
- Sidebar (enhanced — add new nav items)
- PageHeader — consistent page title + description
- Modal — glass modal wrapper
- Badge — colored status/priority badge
- Tabs — tab navigation component
- EmptyState — consistent empty states
- LoadingState — skeleton loaders
- StatCard — glass card with icon, label, value
- MiniChart — small inline SVG chart for stat cards

### Page-Specific Components
- ActivityDetail — expanded activity view with code/diffs
- AgentCard — grid card for /agents
- AgentHeader — profile header with stats
- SwarmGraph — SVG agent tree visualization
- SwarmNode — single node in the graph
- SwarmEdge — connection line between nodes
- TaskCard — kanban task card
- TaskColumn — kanban column
- TaskForm — add/edit task modal
- CostChart — SVG bar/line/pie charts
- CostTable — detailed cost breakdown
- MemoryTree — file tree sidebar
- MemoryViewer — markdown renderer + editor
- NotificationCard — single notification entry
- QuickAction — button with icon for settings page
- RunHistoryList — cron run history
- CodeBlock — syntax highlighted code display
- DiffViewer — inline diff display

---

## Design Tokens

### Colors
- Background: slate-950 gradient
- Glass: bg-white/[0.07], border-white/[0.12], backdrop-blur-xl
- Glass hover: bg-white/[0.10]
- Glass active: bg-white/[0.15]
- Text primary: white/90
- Text secondary: white/50
- Text muted: white/30
- Agent colors: blue(anago), green(iq), emerald(greensea), orange(courtside), purple(afterdark)
- Priority: red(p0), orange(p1), yellow(p2), gray(p3)
- Status: green(success/active), amber(in_progress), red(failed), gray(idle)

### Typography
- Headings: Inter, semibold
- Body: Inter, regular
- Code: JetBrains Mono or system monospace
- Sizes: text-2xl (page title), text-sm (body), text-xs (meta), text-[10px] (tiny labels)

### Spacing
- Page padding: p-6
- Card padding: p-4 or p-5
- Gap between cards: space-y-2 or gap-3
- Section gap: space-y-6

### Animations
- Card hover: scale-[1.01], bg lighten
- Page transitions: fade-in (200ms)
- Skeleton pulse for loading states
- Swarm graph: gentle node float, pulse on active connections

---

## Build Phases

### Phase 1: Data Layer
- Update Convex schema with all new tables
- Write all Convex functions (queries + mutations)
- Update seed data with comprehensive examples
- Deploy schema

### Phase 2: Shared Components
- Update Sidebar with all new routes
- Build all shared components (Modal, Tabs, Badge, StatCard, etc.)
- Build CodeBlock and DiffViewer

### Phase 3: Enhanced Activity Feed
- Activity detail expansion/modal
- Code/diff display
- Token/cost display per activity

### Phase 4: Agent Pages
- /agents overview grid
- /agents/[id] profile with tabs
- Agent stats + current task display

### Phase 5: Swarm Visualization
- SVG graph component
- Node + edge rendering
- Animation + interactivity
- Timeline slider

### Phase 6: Task Queue
- Kanban board layout
- Task CRUD operations
- Priority + status management

### Phase 7: Cost Dashboard
- SVG charts (bar, line, pie)
- Cost calculations
- Breakdown table

### Phase 8: Memory Browser
- File tree
- Markdown renderer
- Editor mode

### Phase 9: Remaining Pages
- Notification center
- Settings + Quick Actions
- Enhanced calendar + search

### Phase 10: Polish
- Loading states everywhere
- Empty states
- Animations
- Final build check
