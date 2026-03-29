# Mission Control Dashboard Audit
_Audited: 2026-03-25 | Auditor: Claude Opus 4.6_

---

## Executive Summary

The dashboard is **structurally sound** but suffers from **data staleness and missing agent coverage**. The sync script (`sync-openclaw.mjs`) is comprehensive for Mako, Uni, and core agents, but Hamachi (weather bot) and Unagi (overnight runner) have zero dashboard representation. Mako's status displays as "CRASHED" when it's intentionally paused. The biggest value gaps are: (1) no Hamachi page despite active paper trading, (2) Mako shows misleading crash status instead of "paused", (3) macro signals panel shows nothing because `agents/uni/state/macro_signals.json` doesn't exist, and (4) KB sync runs separately from main sync and may not be on a cron.

---

## Page-by-Page Findings

### 1. Home Page `/` (Morning Briefing)
**Status: Partially Working**

**Data sources:**
- `api.agents.list` — agent grid
- `api.activities.list` (limit: 10) — overnight summary
- `api.tasks.list` — needs attention section
- `api.scheduledTasks.list` — today's schedule
- `api.notifications.list` (limit: 5) — recent notifications
- `api.mako.getMakoStatus` — Mako card
- `api.uni.getUniStatus` — Uni card

**What it shows:** Greeting ("Good morning, Josh"), quick stats (active agents, in-progress tasks, completed today, cost today), needs-attention panel, overnight/today's activity, schedule, trading systems (Mako + Uni), agent status, recent notifications.

**Issues:**
1. **Mako card shows misleading data.** Bankroll reads from `makoStatus?.bankroll` which is `$88.10` from `risk_state.json`. The user expects ~$408 total across all trading systems. The home card only shows Mako's Polymarket USDC, not combined trading capital.
2. **Uni card fallback balance is hardcoded.** Line 279: `${(uniStatus?.kalshiBalance ?? 518.76).toFixed(0)}` — the fallback `518.76` is from Feb 24 and will be wrong whenever the Convex query hasn't loaded yet. Current Kalshi balance is fetched live by sync script.
3. **Cost Today shows "—"** because `agents.costToday` is only populated during sync runs, and costs are estimated from session token counts, not actual billing.
4. **No Hamachi card** in the Trading Systems panel. Hamachi has $319 bankroll and active paper trades.
5. **Activity feed depends on today's memory file** (`memory/2026-03-25.md`). This file doesn't exist yet at time of audit. Activity entries are only created when the sync script runs and finds the daily memory file.

**Suggested fixes:**
- Add Hamachi to the Trading Systems panel (link to `/hamachi` once page exists)
- Remove the hardcoded `518.76` fallback for Uni balance — use `0` or a loading state
- Consider renaming "Cost Today" to something that reflects it's an estimate

---

### 2. Mako Dashboard `/mako`
**Status: Partially Working — Misleading Status**

**Data sources:**
- `api.mako.getMakoStatus` — status bar + stats row
- `api.mako.getMakoTrades` (limit: 50) — trade history
- `api.mako.getMakoRiskEvents` (limit: 100) — bankroll chart
- `api.mako.getMakoModuleStats` — module breakdown
- `api.mako.getMakoTrades` (status: "open") — open positions

**What it shows:** Status bar (live/dry-run/stopped/crashed), stats row (P&L, win rate, open positions, total trades), bankroll chart, module stats, open positions, trade history.

**Issues:**
1. **Status shows "CRASHED" (red) when Mako is intentionally PAUSED.** The sync script sets `status = "offline"` when the Mako log file hasn't been written to in 2 minutes. The `MakoStatusBar` maps "offline" to `"CRASHED"` with a red dot. There is no "paused" status option.
   - Source: `MakoStatusBar.tsx:24` — `offline: { emoji: "🔴", label: "CRASHED", color: "text-red-400" }`
   - Source: `sync-openclaw.mjs:709` — sets `makoStatus = logAge < 120000 ? "live" : "offline"`
2. **Bankroll shows $88.10**, which is only Polymarket USDC. This is correct for Mako specifically (it only trades on Polymarket), but the user described ~$408 "total" which includes Uni Kalshi + Hamachi Kalshi balances.
3. **Kalshi balance shows $0.00** on the status bar because `kalshiBalance: 0` is hardcoded in the sync script line 869 (`kalshiBalance: 0, // Mako trades on Poly only`). This is correct — Mako doesn't trade on Kalshi.
4. **Win rate shows 0.0%** despite `risk_state.json` showing `realized_pnl: $104.46`. The win rate calculation in the sync script queries the SQLite DB for `actual_profit_cents > 0` on closed trades. If trades are settled but actual_profit_cents wasn't recorded, wins = 0.
5. **SIGTERM crash banner** appears correctly when `lastCrashAt` is within 24h. The overnight_plan.json confirms SIGTERM is a known issue with a fix planned before March 27.
6. **Data is stale.** `risk_state.json` was last modified Mar 23 17:40. The `lastSyncAt` field would be from the last sync run (today 2:30 AM).

**Suggested fixes:**
- Add a "paused" status to both the sync script and MakoStatusBar. Detect paused state via a flag file or config, not just log inactivity.
- Show a "PAUSED" yellow indicator when Mako is intentionally stopped, not "CRASHED" red.
- Fix win rate calculation — check if SQLite trades table is properly tracking `actual_profit_cents`.

---

### 3. Uni Dashboard `/uni`
**Status: Mostly Working**

**Data sources:**
- `api.uni.getUniStatus` — stats row + signal card
- `api.uni.getUniTrades` (limit: 20) — trade history

**What it shows:** Stats row (status, Kalshi balance, win rate, total P&L), signal card (open positions with live mid prices + unrealized P&L, OR pending trade info, plus macro signals panel), trade history table.

**Issues:**
1. **Open positions are correct.** trade_log.csv has 2 open positions: KXCPI-26MAR-T0.9 (100 contracts @ 50c) and KXCPI-26MAR-T1.0 (111 contracts @ 27c). The sync script correctly detects these and fetches live Kalshi mid prices.
2. **Macro signals panel is empty.** The sync script reads from `agents/uni/state/macro_signals.json` which **does not exist** (confirmed: `agents/uni/state/` directory doesn't exist). So `macroSignals` is never populated in the uni_status Convex record.
3. **Shock trigger status is hardcoded.** The sync script at line 1059 sets `shockTriggerStatus = "Daily shock check active — next run 10:30 AM ET"` simply if the shock_trigger_check.py file exists, regardless of actual run status or results.
4. **Stale pending_trade.json.** File contains a Feb trade (KXCPIYOY-26FEB-T2.5, status "pending", created Mar 10). This trade has already resolved. However, the sync script prioritizes open CSV positions over pending_trade.json, so this doesn't affect the dashboard currently.
5. **Win rate from calibration_db.json says 100% (1/1)** but trade_log.csv shows more nuanced results (1 win, 1 loss on the 2b strategy, 2 break-evens). The sync script recalculates from CSV and overrides the calibration value.
6. **Resolution date for open positions.** The CSV `target_exit_date` column is empty for the 2 open positions. The sync script sends `nextResolution` as null. The user says these resolve April 10 — this info is only in the CSV notes column, not parsed.

**Suggested fixes:**
- Create `agents/uni/state/macro_signals.json` via a cron or the shock_trigger_check.py script so the macro panel populates
- Parse "Resolves April 10" from trade notes or add a proper resolution date to the CSV
- Clean up stale `pending_trade.json` (Feb trade that already resolved)

---

### 4. Agents `/agents` and `/agents/[id]`
**Status: Working but Incomplete Agent Roster**

**Data sources:**
- `api.agents.list` — agent grid
- Agent profile uses `api.agents.list`, `api.activities.list`, `api.sessions.list`, `api.tasks.list`, `api.documents.list`

**What it shows:** Grid of agent cards with name, emoji, status dot, model, trust level, tasks today, tokens today. Profile page has tabs: Overview, Activity, Sessions, Memory, Config.

**Issues:**
1. **Missing agents:** The registered OpenClaw agents are: main (Anago), iq, mako, greensea, uni, claude. The sync script syncs whatever `openclaw agents list` returns. **Hamachi** and **Unagi** are NOT registered as OpenClaw agents and will NOT appear on the dashboard.
2. **GreenSea agent status.** GreenSea is registered in OpenClaw and has curated display info in the sync script. However, it was just created on Mar 24 and runs from a separate workspace (`~/.openclaw/workspaces/greensea/`). Its activity/sessions may not be tracked properly since the session inference logic (`inferAgent`) looks for "greensea" in session keys/labels.
3. **"claude" agent appears.** The OpenClaw agents list includes "claude" (Claude Code). This will appear on the dashboard with a fallback style (robot emoji, deterministic color) since it's not in AGENT_DISPLAY. This is likely unwanted — Claude Code is a tool, not a business agent.
4. **Agent status logic.** Status is "active" if last session activity was within 1 hour, "idle" if the agent exists but no recent activity, "offline" if the agent doesn't exist in OpenClaw. This means IQ, Courtside, After Dark will show as "idle" or "offline" correctly.

**Suggested fixes:**
- Register Hamachi and Unagi as OpenClaw agents, or add them to AGENT_DISPLAY with manual status detection
- Filter out "claude" from the dashboard agent list (it's not a business agent)
- Add Hamachi/Unagi to the AGENT_DISPLAY map in sync script with appropriate emojis/colors

---

### 5. Tasks `/tasks`
**Status: Working**

**Data sources:**
- `api.tasks.list` — all tasks
- `api.agents.list` — agent filter dropdown (dynamic, not hardcoded)

**What it shows:** Kanban board with columns: Backlog, Up Next, In Progress, Done. Each card has title, description, agent badge, priority badge, status. Filter by agent and priority. "New Task" button opens modal to create tasks via Convex mutation.

**Issues:**
1. **Task sync from TODO.md is working.** The sync script parses `TODO.md` tier headers and task lines, infers agent and priority, generates stable IDs, and pushes via `/api/sync/task`.
2. **TODO.md was last updated Mar 20** (5 days ago). Any tasks created or completed since then won't be reflected.
3. **No bi-directional sync.** Tasks created via the dashboard "New Task" button are stored in Convex only. They don't write back to TODO.md. Similarly, marking a task "done" on the dashboard doesn't update TODO.md.
4. **Duplicate risk.** If the same task title appears in both TODO.md and a tasks/*.md file, it could be synced twice with different IDs (`todo_` prefix vs `task_` prefix).
5. **Task agent filter uses dynamic Convex query** (`api.agents.list`) — this was properly fixed per DASHBOARD_OVERHAUL_SPEC.md item #2.

**Suggested fixes:**
- Add a warning banner when TODO.md hasn't been modified in >3 days
- Consider bi-directional sync (dashboard changes write back to workspace)

---

### 6. Todos `/todos`
**Status: Working**

**Data sources:**
- `api.tasks.list` — same data as Tasks page

**What it shows:** Three view modes (kanban, list, by-agent). Each task card shows title, agent badge (via `getAgentConfig`), priority badge, status emoji, description. Filters by agent, status, priority. Stats row: total tasks, done, in progress, blocked.

**Issues:**
1. **Redundant with Tasks page.** Both `/tasks` and `/todos` read from the same `tasks` table. `/tasks` is a kanban board; `/todos` is a more flexible view with list/agent/kanban modes.
2. **No direct link to TODO.md source.** Users can't see which tasks came from TODO.md vs tasks/*.md vs manual creation.

**Suggested fixes:**
- Consider merging `/tasks` and `/todos` into one page, or differentiate their purposes clearly in nav

---

### 7. Memory Browser `/memory`
**Status: Partially Working**

**Data sources:**
- `api.documents.list` — filtered by type "memory"

**What it shows:** File tree sidebar, markdown content viewer, edit mode with textarea.

**Issues:**
1. **Content depends on sync script running.** Memory files are synced by `syncMemoryFiles()` which reads daily notes from `~/.openclaw/workspace/memory/*.md` for the last 30 days. Only files that changed since last sync are pushed.
2. **No 2026-03-25.md exists yet** (today's memory file). The last daily memory file is `2026-03-24.md`. This means the Memory Browser shows content up through yesterday.
3. **Memory audit files** (audit_2026-03-20.txt through audit_2026-03-24.txt) exist in the memory directory but may not be synced since the sync script only looks for `.md` files matching `YYYY-MM-DD.md` pattern.
4. **MEMORY.md (system memory index) is synced** as type "memory" with title "Long-Term Memory (MEMORY.md)".

**Suggested fixes:**
- Sync audit files and other non-daily-note memory content
- Show "today's memory not yet generated" when the current day's file doesn't exist

---

### 8. Knowledge Base `/kb`
**Status: Partially Working — Separate Sync Mechanism**

**Data sources:**
- `api.kb.getLatestSnapshot` — main snapshot with stats, gaps, watchlists, research jobs, competitive monitors, economic indicators
- `api.kb.searchItems` — full-text search on kb_items

**What it shows:** Tabbed interface: Search, Gaps, Watchlists, Stats, Competitive Intel, Economic, Quick Add.

**Issues:**
1. **KB sync is separate from main sync.** `scripts/sync-kb.mjs` runs `python3 cli.py export --json` and pushes to Convex. This script is NOT called by `sync-openclaw.mjs` or `check-and-sync.sh`.
2. **KB may not be on a cron.** `sync-kb.mjs` must be run manually or via a separate cron. If it's not scheduled, the dashboard KB data goes stale.
3. **424 items in SQLite** (`kb_items` table). The user expected 413+, so the count is slightly higher (424). The dashboard should show this if the snapshot was recently synced.
4. **Recent items limited to 200.** `sync-kb.mjs` line 36: `snapshot.recent_items.slice(0, 200)` — only the 200 most recent items are synced to Convex's `kb_items` table. The remaining 224 items are only in the SQLite DB.
5. **Quick Add tab** allows adding items via Convex mutation. These go to Convex only, not back to the SQLite KB.

**Suggested fixes:**
- Add `sync-kb.mjs` to the heartbeat sync chain or to `check-and-sync.sh`
- Increase the recent_items limit or sync all items
- Add a "last synced" timestamp to the KB page header

---

### 9. Calendar `/calendar`
**Status: Working**

**Data sources:**
- `api.scheduledTasks.list` — cron jobs

**What it shows:** Weekly calendar view with cron jobs placed by schedule.

**Issues:**
1. **41 cron jobs** were synced as of the last sync run. These come from `openclaw cron list --json`.
2. **No cron health indicators.** The SPEC-V2 calls for green/red/gray dots based on last run status. The schema has `lastStatus` and `lastDurationMs` fields, and the sync script populates them, but the calendar UI may not display health status visually.
3. **No monthly view toggle** as specified in SPEC-V2.

**Suggested fixes:**
- Add cron health dots (green/red/gray) to calendar entries
- Add monthly view option

---

### 10. Swarm `/swarm`
**Status: Outdated / Low Value**

**Data sources:**
- `api.agents.list` — agent nodes
- `api.sessions.list` — connections between agents

**What it shows:** Interactive SVG graph with agent nodes, connections showing delegation/message flow.

**Issues:**
1. **The swarm visualization was designed for a multi-agent hierarchy** (Anago spawning sub-agents). In practice, most agents run independently or via crons, not as a real-time swarm.
2. **Still uses `getAgentConfig`** for colors/emoji — this was fixed per DASHBOARD_OVERHAUL_SPEC.md item #1.
3. **Low utility.** The swarm graph looks cool but doesn't provide actionable information for the current agent architecture.

**Suggested fixes:**
- Consider replacing with a simpler agent status grid, or keep as-is for visual appeal
- Add real-time connection animations only when agents are actually active

---

### 11. Costs `/costs`
**Status: Working — Estimates Only**

**Data sources:**
- `api.costEntries` — cost entries by agent/model
- `api.agents.list` — per-agent cost rollups

**What it shows:** Cost breakdown by agent and model, daily trends, time period selector.

**Issues:**
1. **All costs are estimates.** The sync script estimates costs from token counts using hardcoded pricing (`MODEL_PRICING` in sync-openclaw.mjs). Actual API billing may differ.
2. **Agent cost fields (`costToday`, `costWeek`, `costMonth`)** are populated but `costWeek` and `costMonth` currently just use all-time cost (sync script line 320-321: `costWeek: Math.round((stats.cost || 0) * 100) / 100, // All-time cost for now`).

**Suggested fixes:**
- Fix costWeek/costMonth to use actual time-windowed calculations
- Add a disclaimer that costs are estimates

---

### 12. Tennis `/tennis`
**Status: Working (Seasonal)**

**What it shows:** iframe dashboard + ELO ratings table for grass court tennis betting (Queens/Halle/Wimbledon 2026).

**Issues:**
1. **Seasonal relevance.** Wimbledon is in July. This page may be premature for March.
2. **No data sync.** Content appears to be a static iframe + hardcoded table.

---

### 13. Inbox `/inbox`
**Status: Built but Low Activity**

**Data sources:**
- `api.approvals` table

**What it shows:** Items pending Josh's approval.

**Issues:**
1. **No sync mechanism populates approvals.** The sync script doesn't push approval items. This page would only show data if approvals are manually created via Convex.

---

### 14. Other Pages

| Page | Status | Notes |
|------|--------|-------|
| `/activity` | Working | Activity feed from `api.activities.list`. Depends on sync populating activities from daily memory files. |
| `/notifications` | Working | From `api.notifications.list`. No sync pushes notifications currently. |
| `/search` | Working | Full-text search across activities, tasks, documents. |
| `/settings` | Partially Working | Quick actions panel. "Sync Now" button works (creates sync_request in Convex, picked up by check-and-sync.sh). |
| `/chat` | Unknown | Not investigated in detail. |
| `/notes` | Unknown | Not investigated in detail. |
| `/reports` | Unknown | Not investigated in detail. |
| `/timeline` | Unknown | Not investigated in detail. |

---

## Sync Script Findings

### What `sync-openclaw.mjs` pushes:
1. **Agents** — from `openclaw agents list --json` + session stats + special Mako/Uni detection
2. **Cron jobs** — from `openclaw cron list --json` (41 jobs)
3. **Sessions + costs** — from `.sessions-dump.json` file
4. **Tasks** — from `TODO.md` + `tasks/*.md` files in workspace
5. **Recent activity** — from today's daily memory file (`memory/YYYY-MM-DD.md`)
6. **Mako** — from SQLite DB (`mako_v2.db`) + `risk_state.json` + PID/log detection + on-chain USDC balance fallback
7. **Uni** — from `trade_log.csv` + `calibration_db.json` + `pending_trade.json` + live Kalshi API balance + live Kalshi mid prices for open positions + `macro_signals.json` (missing)
8. **Memory files** — daily notes for last 30 days + MEMORY.md + TODO.md + ANAGO_IMPROVEMENTS.md

### What it's missing:
1. **Hamachi weather bot.** No sync for `hamachi_risk_state.json` ($319 bankroll), no sync for `agents/weather/logs/paper_trades.csv` (4 trades, 3 settled, 1 open).
2. **Unagi task status.** No sync for `state/overnight_plan.json` (7 tasks in queue).
3. **KB sync.** Handled by separate `sync-kb.mjs` script, not part of the heartbeat chain.
4. **Macro signals.** The file `agents/uni/state/macro_signals.json` doesn't exist. The sync script tries to read it but silently fails.
5. **GreenSea agent activity.** GreenSea runs from a separate workspace (`~/.openclaw/workspaces/greensea/`). The sync script infers GreenSea from session labels but may miss activity from the separate workspace.
6. **Notification sync.** No mechanism pushes sent Telegram messages or emails to the notifications table.
7. **Approval sync.** No mechanism creates approval items in Convex.

### Convex URL note:
- `.env.local` sets `NEXT_PUBLIC_CONVEX_SITE_URL=https://abundant-bullfrog-757.convex.site`
- `check-and-sync.sh` hardcodes `CONVEX_URL="https://abundant-bullfrog-757.convex.site"`
- `sync-openclaw.mjs` defaults to `"https://abundant-bullfrog-757.convex.site"` but reads env vars first
- These all match. No URL mismatch issue.

### Sync cadence:
- `check-and-sync.sh` runs every ~30 seconds (based on log), checks for pending sync requests
- Full sync only runs when triggered by "Sync Now" button or heartbeat
- Last full sync: **2026-03-25 at 2:30 AM** (from `.sync-state.json`)
- Regular heartbeat interval unclear — sync-watcher.log shows mostly "No pending sync request" entries

---

## Missing Pages / Features

### 1. Hamachi Weather Bot Dashboard (`/hamachi`)
**Priority: HIGH**

Hamachi is actively paper trading with $319 bankroll and 4 paper trades. Phase 2 live execution infrastructure was just built (LIVE_TRADING=False). There is no dashboard representation whatsoever.

**Should show:**
- Paper trading status (Phase 1 active, Phase 2 built but not live)
- Bankroll: $319
- Paper trades table: DEN (loss -$0.79), CHI (win +$0.25), MIA (win +$0.24), AUS (pending)
- Paper P&L: net ~ -$0.30
- 48h paper trading gate countdown
- Phase 2 readiness checklist

**Data source:** `hamachi_risk_state.json` + `agents/weather/logs/paper_trades.csv`

### 2. Unagi Overnight Runner Status
**Priority: MEDIUM**

Unagi has 7 tasks in its queue (`state/overnight_plan.json`) including time-sensitive items. No visibility on the dashboard.

**Should show:**
- Current task queue (from overnight_plan.json)
- Incomplete threads
- Time-sensitive items with deadlines
- Last run status

### 3. GreenSea CRM Dashboard (`/greensea` or `/business/greensea`)
**Priority: MEDIUM**

GreenSea agent was just activated Mar 24 with dedicated workspace. UPGRADE_SPEC.md specifies `/business/greensea` page.

### 4. IQ/InstantIQ Dashboard
**Priority: LOW**

No dedicated page. IQ agent handles TikTok content pipeline but is currently idle. Could be a future page when the pipeline is active.

### 5. Cron Health Dashboard
**Priority: MEDIUM**

The overnight plan mentions 5 crons with error status. A dedicated cron health view (beyond the calendar) showing consecutive failures, last run times, and health trends would be valuable.

---

## Needs Josh Decision

1. **Mako "paused" status.** Should Mako show as "PAUSED" (yellow, intentional) or "CRASHED" (red, alarming)? Currently shows crashed. Need a mechanism to distinguish intentional pause from actual crash. Options: (a) flag file `mako_paused.flag`, (b) config in Convex, (c) status field in risk_state.json.

2. **Combined bankroll view.** Should the home page show individual system bankrolls or a combined total? Currently Mako shows $88, Uni shows live Kalshi balance, Hamachi isn't shown. The ~$408 total requires summing across platforms.

3. **Hamachi page priority.** Hamachi is paper trading with real money allocated ($319). Should a dashboard page be built before Phase 2 goes live?

4. **Unagi visibility.** Should overnight_plan.json tasks appear in the Tasks/Todos page, or does Unagi need its own section?

5. **Claude agent filtering.** "claude" (Claude Code) appears in the agents list from OpenClaw. Should it be filtered out of the dashboard?

6. **Todos vs Tasks page.** These are redundant — both show the same data from the `tasks` table. Keep both, merge, or differentiate?

7. **KB sync cadence.** `sync-kb.mjs` is not part of the heartbeat chain. Should it be? Running `python3 cli.py export` every 30 minutes could be heavy.

8. **Tennis page timing.** Wimbledon is in July. Is the Tennis page worth keeping in nav for March?

---

## Sync Script Bugs (from deep code review)

### Bug 1: Mako Trade Field Name Mismatch (HIGH)
The sync script sends simplified field names (`windowStart`, `slug`, `direction`, `confidence`, `tokenPrice`) in the `/api/sync/mako-trade` POST body (sync-openclaw.mjs lines 788-810), but the Convex `syncMakoTrade` mutation expects dual-leg schema fields (`strategy`, `eventId`, `legAPlatform`, `legAMarket`, `legASide`, `legAPrice`, `legAContracts`, `legAStatus`). The HTTP handler in `convex/http.ts` maps some of these, but the field translation may be incomplete or silently dropping data.

### Bug 2: Agent "tasksToday" Is Actually Session Count (MEDIUM)
`sync-openclaw.mjs:317` sends `tasksToday: stats.sessionsToday || 0`. This is the count of OpenClaw *sessions* for the day, not actual tasks completed. The agents grid and home page display this as "tasks today" which is misleading.

### Bug 3: costWeek and costMonth Are Identical (MEDIUM)
`sync-openclaw.mjs:320-321` sets both `costWeek` and `costMonth` to the same all-time cost value. Comments say `// All-time cost for now`. The Costs page may display wrong weekly/monthly breakdowns.

---

## Priority Fix List

| # | Fix | Value | Effort | Details |
|---|-----|-------|--------|---------|
| 1 | **Add "paused" status to Mako** | HIGH | Small | Add `paused` to MakoStatusBar config. Detect via flag file or config. Prevents misleading "CRASHED" display. |
| 2 | **Build Hamachi page** | HIGH | Medium | New `/hamachi` page. Read `hamachi_risk_state.json` + `paper_trades.csv`. Add to sync script. $319 deployed with no visibility. |
| 3 | **Create `macro_signals.json`** | HIGH | Small | The Uni macro signals panel is empty because this file doesn't exist at `agents/uni/state/macro_signals.json`. Either create it via a cron (shock_trigger_check.py could write it) or seed it manually. |
| 4 | **Fix Mako trade sync field mapping** | HIGH | Small | Align sync script POST body fields with `syncMakoTrade` mutation args. Current mismatch may cause silent sync failures. |
| 5 | **Add KB sync to heartbeat** | MEDIUM | Small | Add `node scripts/sync-kb.mjs` to `check-and-sync.sh` or the main sync script. KB data goes stale without this. |
| 6 | **Register Hamachi + Unagi as agents** | MEDIUM | Small | `openclaw agents register hamachi` and `unagi`. Add to AGENT_DISPLAY in sync script. They'll then appear in agents grid. |
| 7 | **Fix "tasksToday" label** | MEDIUM | Tiny | Either rename the field to `sessionsToday` or compute actual task count. Currently shows session count as "tasks". |
| 8 | **Fix Mako win rate** | MEDIUM | Small | Win rate shows 0% despite $104 realized P&L. Check if `actual_profit_cents` is being recorded in the SQLite trades table for settled trades. |
| 9 | **Fix costWeek/costMonth** | MEDIUM | Small | Both fields are set to all-time cost. Compute actual time-windowed values from `cost_entries` table or filter sessions by date. |
| 10 | **Add overnight_plan.json to sync** | MEDIUM | Medium | Parse `state/overnight_plan.json` and push tasks to Convex with source="unagi". Show in Tasks/Todos or a dedicated section. |
