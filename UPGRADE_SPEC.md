# Mission Control Upgrade Spec

## Feature 1: Live OpenClaw Integration

### Architecture
- Convex HTTP actions serve as the API layer
- OpenClaw (Anago) pushes data via HTTP calls to Convex
- A sync script runs periodically to keep MC in sync with reality
- Convex node actions handle the HTTP endpoints

### New Convex HTTP Endpoints (convex/http.ts)

All endpoints require `Authorization: Bearer <SYNC_SECRET>` header.

#### POST /api/sync/activity
Log a new activity from OpenClaw.
```json
{
  "agent": "anago",
  "action": "email_sent",
  "title": "Sent Reddit opportunities email",
  "description": "...",
  "status": "completed",
  "tokensIn": 1200,
  "tokensOut": 800,
  "cost": 0.002,
  "sessionId": "abc-123"
}
```

#### POST /api/sync/session
Create or update a session.
```json
{
  "sessionId": "abc-123",
  "sessionKey": "agent:main:subagent:xyz",
  "agent": "anago",
  "model": "deepseek-chat",
  "status": "completed",
  "startedAt": 1770700000000,
  "endedAt": 1770700300000,
  "tokensIn": 5000,
  "tokensOut": 2000,
  "cost": 0.001,
  "taskSummary": "Reddit comment scan"
}
```

#### POST /api/sync/agent-status
Update an agent's live status.
```json
{
  "agentId": "anago",
  "status": "active",
  "currentTask": "Building Mission Control",
  "tokensToday": 45200,
  "tasksToday": 12,
  "lastActive": 1770740000000
}
```

#### POST /api/sync/cron
Sync cron job states from OpenClaw.
```json
{
  "jobs": [
    {
      "name": "Reddit Comments - 9am",
      "cronId": "98b4fb90-...",
      "agent": "anago",
      "schedule": "Weekdays at 9:00 AM",
      "cronExpr": "0 9 * * 1-5",
      "timezone": "America/New_York",
      "status": "active",
      "nextRun": 1770818400000,
      "lastRun": 1770732179791
    }
  ]
}
```

#### POST /api/sync/notification
Log a notification that was sent.

#### POST /api/sync/cost
Log a cost entry for tracking.

### Schema Changes

Add to `agents` table:
- `costToday: v.optional(v.number())` — running cost for today
- `costWeek: v.optional(v.number())` — running cost for this week  
- `costMonth: v.optional(v.number())` — running cost for this month

New table: `cost_entries`
```
{
  agent: string,
  model: string,
  tokensIn: number,
  tokensOut: number,
  cost: number,
  sessionId: optional string,
  timestamp: number,
}
```
Indexes: by_agent, by_timestamp, by_model

Add to `scheduled_tasks`:
- `cronId: v.optional(v.string())` — OpenClaw cron job ID for syncing
- `lastStatus: v.optional(v.string())` — last run status
- `lastDurationMs: v.optional(v.number())` — last run duration

### Sync Script (scripts/sync-to-mc.ts)

A Node.js script that:
1. Reads OpenClaw cron jobs via `cron list`
2. Reads recent sessions via `sessions_list`  
3. Reads session status for cost data
4. Pushes everything to Convex via HTTP endpoints

This script will be called from OpenClaw heartbeat checks.

### Environment
- `CONVEX_SYNC_SECRET` — shared secret for API auth
- `CONVEX_HTTP_URL` — Convex deployment HTTP URL (e.g., https://first-ram-850.convex.site)

## Feature 2: Quick Actions Panel

### UI: Command palette (Cmd+K)
- Floating modal with search input
- Actions: Create task, trigger cron, send agent message, change task status
- Recent actions for quick access
- Keyboard shortcut: Cmd+K or Ctrl+K

### New Components
- `src/components/CommandPalette.tsx` — modal with search + action list
- Integrate into layout.tsx with keyboard listener

### Convex Mutations Needed
- tasks.create (exists)
- tasks.updateStatus (exists)  
- New: `commands.ts` — mutation to log commands and trigger actions

## Feature 5: Morning Briefing Homepage

### Replace current Activity Feed (/) with a Morning Briefing layout

Sections:
1. **Good morning, Josh** — greeting + date + weather widget
2. **Overnight Summary** — what agents accomplished since midnight
3. **Today's Schedule** — calendar events + cron jobs for today
4. **Needs Your Attention** — tasks/approvals waiting on Josh
5. **Quick Stats** — costs today, tasks completed, active agents
6. **Recent Activity** — compact feed (last 10 items)

### New Route
- Keep `/` as the briefing page
- Move current activity feed to `/activity`

## Feature 6: Inbox / Approval Queue

### New Route: /inbox

Shows all items pending Josh's approval:
- Reddit comments to approve (from notifications/emails)
- Twitter digest improvements to greenlight
- Agent outputs awaiting review
- Task completions to acknowledge

### Schema: Add `approvals` table
```
{
  type: string,          // "reddit_comment" | "improvement" | "task_review" | "general"
  title: string,
  description: string,
  agent: string,
  status: string,        // "pending" | "approved" | "rejected" | "expired"
  data: optional any,    // Flexible payload (comment text, improvement details, etc.)
  createdAt: number,
  resolvedAt: optional number,
}
```

## Feature 4: Real-Time Cost Tracking

Depends on Feature 1 (cost_entries table + sync).

### Enhanced /costs page:
- Daily cost chart (last 30 days)
- Cost by model breakdown (pie chart)
- Cost by agent breakdown
- Budget indicator with configurable limits
- Most expensive sessions list
- Cost trend (is spending going up or down?)

## Feature 3: Business Dashboard Tabs

### New Routes:
- /business/instantiq
- /business/greensea
- /business/courtside
- /business/afterhours

### Per-business view:
- KPI cards (customizable per business)
- Related tasks
- Recent agent activity for that business
- Key contacts
- Links to external tools (Excel models, websites, etc.)

### Schema: Add `businesses` table
```
{
  businessId: string,
  name: string,
  emoji: string,
  color: string,
  agents: string[],      // which agents work on this
  kpis: optional any,    // flexible KPI data
  contacts: optional any,
  links: optional any,
  updatedAt: number,
}
```
