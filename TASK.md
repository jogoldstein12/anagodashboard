# Mission Control — Finish Buildout

## Context
Mission Control is a Next.js + Convex dashboard for monitoring an OpenClaw AI agent system. The frontend (10 pages) and Convex backend (schema, queries, mutations, HTTP sync endpoints, seed data) are built. What's missing:

## Tasks

### 1. Fix Build Error
- `src/app/notes/page.tsx` imports `NotesPageClient` which doesn't exist
- Either create a simple notes page client component (similar style to other pages — glass panel, dark theme) or remove the notes route
- Make sure `npm run build` passes cleanly

### 2. Create OpenClaw Sync Script
Create `scripts/sync-openclaw.ts` (or `.mjs`) — a Node.js script that:
- Reads OpenClaw data via CLI commands and pushes to Convex HTTP endpoints
- Convex site URL: `https://first-ram-850.convex.site`
- Auth: Bearer token via `SYNC_SECRET` env var

#### Data to sync:
a) **Agent status** → `POST /api/sync/agent-status`
   - Read from OpenClaw config: the agents list with their models, status
   - Map our 5 agents: anago, iq, greensea, courtside, afterdark

b) **Cron jobs** → `POST /api/sync/cron`
   - Run: `openclaw cron list --json` (or use the OpenClaw REST API)
   - Map each job to: name, cronId, agent, schedule, cronExpr, timezone, status, nextRun, etc.

c) **Sessions** → `POST /api/sync/session`
   - If there's a way to list recent sessions via CLI

d) **Cost entries** → `POST /api/sync/cost`
   - Parse from session data if available

#### Implementation notes:
- Use `fetch()` for HTTP calls to Convex
- Use `child_process.execSync` to run OpenClaw CLI commands
- Make it runnable: `node scripts/sync-openclaw.mjs`
- Read SYNC_SECRET from env or `.env.local`
- Add error handling, log what was synced

### 3. Create package.json Script
Add `"sync": "node scripts/sync-openclaw.mjs"` to package.json scripts

### 4. Verify Build
Run `npm run build` and fix any remaining TypeScript/build errors.

## Style Guide
- All pages use dark theme with glassmorphism (bg-white/5 backdrop-blur borders)
- Convex queries via `useQuery(api.xxx.yyy)`
- `@ts-nocheck` at top of Convex files (already the pattern)
- lucide-react for icons

## File Structure
```
convex/          — Convex backend (schema, queries, mutations, http endpoints, seed, sync)
src/app/         — Next.js pages (activity, agents, calendar, costs, inbox, memory, notes, notifications, search, settings, swarm, tasks, timeline)
src/components/  — Shared components (Sidebar, GlassPanel, ActivityCard, etc.)
src/lib/         — Constants, types, utils
scripts/         — NEW: sync scripts
```

## Don't Touch
- Don't modify the Convex schema or existing query/mutation logic
- Don't change the design system or color palette
- Keep existing seed data functionality
