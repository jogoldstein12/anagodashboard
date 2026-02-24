# Mission Control Dashboard Overhaul Spec
_Generated Feb 24 2026 by Anago — implement all items in this file_

## Context
Dashboard repo: `/Users/anago/Projects/mission-control`
Workspace: `/Users/anago/.openclaw/workspace`
Convex backend: `convex/` directory
Sync script: `scripts/sync-openclaw.mjs`
Vercel auto-deploys on push to main.

## Issues to Fix

### 1. SwarmGraph — replace hardcoded AGENTS lookups with getAgentConfig()
**File:** `src/app/swarm/_components/SwarmGraph.tsx`
- Replace `import { AGENTS, AGENT_EMOJI, type AgentKey }` with `import { getAgentConfig }`
- Replace `AGENTS[agentKey]?.color || "#ffffff"` with `getAgentConfig(agent.agentId).color`
- Replace `AGENT_EMOJI[agentKey] || "🤖"` with `getAgentConfig(agent.agentId).emoji`
- Remove `as AgentKey` type assertions
- Same fix in the tooltip section of the same file

### 2. TasksPageClient — dynamic agent filter
**File:** `src/app/tasks/_components/TasksPageClient.tsx`
- Replace `const agentKeys = Object.keys(AGENTS) as AgentKey[]` with a Convex query
- Add `const agents = useQuery(api.agents.list)` near the top
- Replace `import { AGENTS, type AgentKey }` with just `import { getAgentConfig }` (or remove entirely)
- The agent filter dropdown should iterate `agents` from Convex, not hardcoded AGENTS object
- Each option: `<option key={a.agentId} value={a.agentId}>{a.name} {a.emoji}</option>`

### 3. TODO.md task sync — parse properly
**File:** `scripts/sync-openclaw.mjs` (syncTasksFromWorkspace function)
- Currently reads `tasks/*.md` files. Keep that BUT ALSO parse `TODO.md` from workspace root
- For TODO.md: parse each `### N. [status_emoji] Title` line as a task
  - Status emoji: ✅ = "done", 🔄 = "in_progress", ⬜ = "up_next", ❌ = "done" (skipped)
  - Read 2-3 lines after each `###` header for description
  - Infer agent from content (keywords: mako/polymarket/scalper → "mako", uni/kalshi/cpi → "uni", iq/instantiq → "iq", courtside/lovb → "courtside", afterdark/party → "afterdark", greensea/green sea/invoice/capex → "greensea", else "anago")
  - Priority: 🔴 Tier 1 section → p0, 🟡 Tier 2 → p1, 🟠 Tier 3 → p2, 🟢 Tier 4 → p3, everything else → p2
  - Generate stable taskId: `todo_${slugified_title}`
  - Push each via `/api/sync/task`

### 4. Uni agent sync in sync-openclaw.mjs
**File:** `scripts/sync-openclaw.mjs`
- In the `syncMakoTrades()` function or a new `syncUniTrades()` function:
- Read `/Users/anago/.openclaw/workspace/agents/uni/phase1/trade_log.csv` if it exists
- Read `/Users/anago/.openclaw/workspace/agents/uni/phase1/pending_trade.json` if it exists
- Read `/Users/anago/.openclaw/workspace/agents/uni/phase1/calibration_db.json` if it exists
- Push Uni status via `/api/sync/uni-status` (see Convex changes below)
- Uni status logic:
  - `status = "active"` if pending_trade.json exists AND status = "pending" or "approved"
  - `status = "idle"` otherwise
  - Include: kalshi_balance (from calibration_db or hardcode 518.76), pending_trade info, next_release_date, win_rate, total_trades, total_pnl

### 5. New Convex table + API: uni_status
**File:** `convex/schema.ts`
Add a new table `uni_status`:
```
uni_status: defineTable({
  ticker: v.optional(v.string()),         // e.g. "KXCPIYOY-26MAR-T2.5"
  releaseDate: v.optional(v.string()),    // "2026-03-11"
  status: v.string(),                     // "idle" | "pending" | "approved" | "executed"
  tradeDirection: v.optional(v.string()), // "YES" | "NO"
  entryPrice: v.optional(v.number()),     // cents
  betSize: v.optional(v.number()),        // dollars
  multiplier: v.optional(v.number()),
  kalshiBalance: v.number(),
  winRate: v.number(),
  totalTrades: v.number(),
  totalPnl: v.number(),
  lastUpdated: v.number(),
  regime: v.optional(v.string()),         // "HOT" | "FLAT" | "COOL"
  signalSummary: v.optional(v.string()),
})
```

**File:** `convex/http.ts` (or create `convex/uni.ts`)
- Add mutation `upsertUniStatus` that upserts a single row (there should only ever be one)
- Add query `getUniStatus` that returns the latest row
- Add HTTP endpoint `POST /api/sync/uni-status` that calls upsertUniStatus

Also add `uni_trades` table:
```
uni_trades: defineTable({
  tradeId: v.string(),
  releaseDate: v.string(),
  ticker: v.string(),
  entryType: v.string(),        // "T-14" | "T-1"
  entryPrice: v.number(),
  betSize: v.number(),
  contracts: v.number(),
  outcome: v.string(),          // "pending" | "win" | "loss"
  pnl: v.optional(v.number()),
  actualCpi: v.optional(v.number()),
  regime: v.optional(v.string()),
  executedAt: v.number(),
  resolvedAt: v.optional(v.number()),
}).index("by_releaseDate", ["releaseDate"])
```

### 6. New page: /uni (Uni Trading Dashboard)
**Create files:**
- `src/app/uni/page.tsx` (server component, exports metadata)
- `src/app/uni/_components/UniDashboardClient.tsx`
- `src/app/uni/_components/UniStatsRow.tsx`
- `src/app/uni/_components/TradeHistory.tsx` (reuse/adapt Mako's)
- `src/app/uni/_components/SignalCard.tsx`

**UniDashboardClient design (similar to MakoDashboardClient):**

Header: "🪸 Uni Dashboard" subtitle "Kalshi CPI prediction market trader"

Stats row (4 cards): 
- Status (idle/active — green dot if active)
- Kalshi Balance ($)
- Win Rate (%)
- Total P&L ($)

Next Trade card:
- Shows pending_trade info if exists: ticker, entry price, bet size, multiplier, signal summary, regime
- If no pending trade: "No active trade — next review [date]"

Signal Analysis card:
- Regime (HOT/FLAT/COOL) with color coding
- PCE/PPI reading
- Entry recommendation (T-14 vs T-1)
- Active multipliers

Trade History table:
- Columns: Release Date, Ticker, Entry Type, Entry Price, Bet Size, Outcome, P&L
- Color: green for wins, red for losses, gray for pending
- Empty state: "No trades yet — first trade planned for March 11, 2026"

All data reads from Convex `uni_status` and `uni_trades` tables via useQuery.

### 7. New page: /todos (Todo & Task Tracker)
**Create files:**
- `src/app/todos/page.tsx`
- `src/app/todos/_components/TodosPageClient.tsx`

**Design:**
- Header: "📋 Todo Tracker" subtitle "Master task list from TODO.md"
- Three view modes: Kanban (default), List, By Agent
- In kanban: columns for TODO / IN PROGRESS / DONE  
- In list: flat list sorted by priority/date with agent badge and status emoji
- Each task card shows:
  - Title
  - Agent badge (colored pill with emoji + name using getAgentConfig())
  - Priority badge (P0/P1/P2/P3)
  - Status badge
  - Description (truncated)
- Filter by agent (dynamic from Convex agents)
- Filter by status
- Filter by priority
- Real-time from Convex `tasks` table (already populated by syncTasksFromWorkspace)
- Stats row: Total tasks, Done, In Progress, Blocked

### 8. Sidebar updates
**File:** `src/components/Sidebar.tsx`
Add to NAV_ITEMS:
- `{ href: "/uni", label: "Uni", icon: TrendingUp }` — add after Mako
- `{ href: "/todos", label: "Todos", icon: ClipboardList }` — add after Tasks

Import `TrendingUp, ClipboardList` from lucide-react.

Also: make the agent list in the sidebar dynamic — use `useQuery(api.agents.list)` instead of hardcoded `Object.keys(AGENTS)`. The sidebar already has an agent section; check if it's hardcoded and fix if so.

### 9. AgentCard — ensure dynamic
**File:** `src/app/agents/_components/AgentCard.tsx`
- Make sure it uses `getAgentConfig(agent.agentId)` for colors/emoji
- Remove any hardcoded AGENTS references

### 10. Home page (/) — add Uni card
**File:** `src/app/page.tsx`
- Read the current page to understand its structure
- Add a Uni status card similar to however Mako is displayed
- If there's a "quick stats" section, add Uni balance and last trade status

## Implementation Notes

### File locations for Uni data
- `trade_log.csv`: `/Users/anago/.openclaw/workspace/agents/uni/phase1/trade_log.csv`
- `pending_trade.json`: `/Users/anago/.openclaw/workspace/agents/uni/phase1/pending_trade.json`
- `calibration_db.json`: `/Users/anago/.openclaw/workspace/agents/uni/phase1/calibration_db.json`

### Convex HTTP endpoints pattern
Look at `convex/http.ts` to see existing endpoint patterns for `/api/sync/mako-trade` and `/api/sync/mako-status`. Follow the same pattern for `/api/sync/uni-status` and `/api/sync/uni-trade`.

### TypeScript / Build
- Run `npm run build` at the end to verify no type errors
- The project uses `// @ts-nocheck` in convex files so types are loose there
- Frontend files should have proper types

### Commit when done
After all changes are complete and build passes:
```bash
cd /Users/anago/Projects/mission-control
git add -A
git commit -m "feat: uni dashboard, todos page, dynamic agents, fix swarm hardcoding, fix task sync"
git push origin main
```

Then run:
```
openclaw system event --text "Done: Dashboard overhaul complete — Uni dashboard, Todos page, dynamic agents, all hardcoding removed, build passing" --mode now
```

### 11. Fix "Sync Now" button — add local sync-watcher cron
**Problem:** The button writes a pending request to Convex, but nothing triggers the sync script immediately. It just waits for the next heartbeat.

**Fix:** Add an OpenClaw cron job that polls Convex every 60 seconds for pending sync requests and fires `sync-openclaw.mjs` immediately when found.

In `scripts/sync-openclaw.mjs`:
- At the very END of the main sync function (after all sync steps), add a call to fulfill any pending requests:
```js
// Fulfill any pending sync requests (triggered by "Sync Now" button)
await post("/api/sync/fulfill-sync-request", {});
```

In `convex/http.ts`:
- Add a GET endpoint `/api/check-pending-sync` that returns `{ pending: bool }` using `getPendingForHttp`
- Add a POST endpoint `/api/sync/fulfill-sync-request` that calls `fulfillPendingSync`

Then create the watcher cron in openclaw:
- Name: `sync-watcher`  
- Schedule: every 60 seconds
- Command: Check Convex for pending sync, run sync if found
- Model: haiku (lightweight polling task)
- Script to run: `node /Users/anago/Projects/mission-control/scripts/sync-openclaw.mjs`

Actually, the simplest implementation:
Add `/api/check-pending-sync` GET endpoint to convex/http.ts.
Then add a new openclaw cron `dashboard-sync-watcher` that runs every 2 minutes:
```
curl -s https://first-ram-850.convex.site/api/check-pending-sync | grep -q '"pending":true' && node /Users/anago/Projects/mission-control/scripts/sync-openclaw.mjs
```

At the end of sync-openclaw.mjs main(), always POST to `/api/sync/fulfill-sync-request` to clear any pending flag.
