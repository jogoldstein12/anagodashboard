#!/usr/bin/env node
/**
 * Sync OpenClaw data → Convex Mission Control
 * 
 * Syncs: agents, cron jobs, sessions (with cost estimation), activity
 * 
 * Usage: node scripts/sync-openclaw.mjs
 *   --sessions-json <file>  Read sessions from JSON file instead of CLI
 *   --dry-run               Print what would be synced without sending
 * 
 * Env: SYNC_SECRET (required), CONVEX_SITE_URL (optional)
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const STATE_FILE = resolve(ROOT, "scripts", ".sync-state.json");

// ─── Config ─────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");

// Model pricing per 1M tokens (input/output) in USD
const MODEL_PRICING = {
  "claude-opus-4-6":      { input: 15.00, output: 75.00 },
  "claude-sonnet-4-6":    { input: 3.00,  output: 15.00 },
  "claude-haiku-3.5":     { input: 0.80,  output: 4.00 },
  "deepseek-chat":        { input: 0.27,  output: 1.10 },
  "kimi-k2.5":            { input: 0.40,  output: 1.60 },
  "gemini-2.5-flash":     { input: 0.15,  output: 0.60 },
  // Fallback
  "default":              { input: 3.00,  output: 15.00 },
};

// ─── Env ────────────────────────────────────────────────────
function loadEnv() {
  try {
    const envFile = readFileSync(resolve(ROOT, ".env.local"), "utf-8");
    for (const line of envFile.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.+?)(\s*#.*)?$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
  } catch {}
}
loadEnv();

const SITE_URL = process.env.CONVEX_SITE_URL || process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "https://first-ram-850.convex.site";
const SYNC_SECRET = process.env.SYNC_SECRET;

if (!SYNC_SECRET) {
  console.error("❌ SYNC_SECRET not set. Add it to .env.local or export it.");
  process.exit(1);
}

// ─── State ──────────────────────────────────────────────────
function loadState() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return { lastSync: 0, syncedSessionIds: [], syncedActivityHashes: [] };
  }
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Helpers ────────────────────────────────────────────────
async function post(path, body) {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] POST ${path}`, JSON.stringify(body).slice(0, 200));
    return { ok: true };
  }
  const url = `${SITE_URL}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SYNC_SECRET}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`  ❌ ${path}: ${res.status} ${text}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`  ❌ ${path}: ${err.message}`);
    return null;
  }
}

async function getAuth(path) {
  const url = `${SITE_URL}${path}`;
  try {
    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${SYNC_SECRET}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 30000 }).trim();
  } catch {
    return null;
  }
}

function parseJson(str) {
  try { return JSON.parse(str); } catch { return null; }
}

function estimateCost(model, tokensIn, tokensOut) {
  // Normalize model name
  const shortModel = model?.replace(/^(anthropic|deepseek|moonshot|google)\//, "")
    .replace("anthropic/", "")
    .replace("deepseek/", "") || "default";
  
  const pricing = MODEL_PRICING[shortModel] || MODEL_PRICING["default"];
  const inputCost = (tokensIn / 1_000_000) * pricing.input;
  const outputCost = (tokensOut / 1_000_000) * pricing.output;
  return Math.round((inputCost + outputCost) * 10000) / 10000; // 4 decimal places
}

function getActualTokens(session) {
  // Use actual inputTokens and outputTokens if available
  // Some sessions might have totalTokens as context window size, not actual usage
  let tokensIn = session.inputTokens || 0;
  let tokensOut = session.outputTokens || 0;
  
  // If we have reasonable token counts, use them
  if (tokensIn > 0 || tokensOut > 0) {
    return { tokensIn, tokensOut };
  }
  
  // Fallback: estimate from totalTokens if it seems reasonable (not context window)
  // Most sessions are ~70% input (prompts/context) and ~30% output (responses)
  const total = session.totalTokens || 0;
  if (total > 0 && total < 100000) { // Reasonable token count, not context window
    tokensIn = Math.round(total * 0.7);
    tokensOut = Math.round(total * 0.3);
  }
  
  return { tokensIn, tokensOut };
}

function inferAgent(session) {
  const key = session.key || "";
  const label = (session.label || session.displayName || session.subject || "").toLowerCase();
  const model = (session.model || "").toLowerCase();
  
  // Check key prefix (named agent sessions)
  if (key.includes("agent:iq:")) return "iq";
  if (key.includes("agent:greensea:")) return "greensea";
  if (key.includes("agent:courtside:")) return "courtside";
  if (key.includes("agent:afterdark:")) return "afterdark";
  if (key.includes("agent:mako:") || key.includes("agent:poly:")) return "mako";
  
  // Check labels (sub-agent sessions spawned from main)
  if (label.includes("iq") || label.includes("instantiq")) return "iq";
  if (label.includes("greensea") || label.includes("green-sea") || label.includes("green sea")) return "greensea";
  if (label.includes("courtside")) return "courtside";
  if (label.includes("afterdark") || label.includes("after-dark") || label.includes("after dark")) return "afterdark";
  if (label.includes("oracle") || label.includes("mako") || label.includes("poly") || label.includes("polymarket") || label.includes("trading")) return "mako";
  if (label.includes("mc-") || label.includes("mission-control") || label.includes("dashboard")) return "anago";
  
  return "anago";
}

// ─── Sync Agents ────────────────────────────────────────────
async function syncAgents(sessions) {
  console.log("\n🤖 Syncing agents...");
  
  // Get actual agent list from OpenClaw
  const agentsRaw = run("openclaw agents list --json");
  const agentsList = parseJson(agentsRaw) || [];
  
  const agentDefs = [
    { agentId: "anago", name: "Anago", emoji: "🍣", model: "claude-opus-4-6", trustLevel: "L3", color: "#3b82f6" },
    { agentId: "iq", name: "IQ", emoji: "🧠", model: "kimi-k2.5", trustLevel: "L1", color: "#22c55e" },
    { agentId: "greensea", name: "GreenSea", emoji: "🌊", model: "kimi-k2.5", trustLevel: "L1", color: "#10b981" },
    { agentId: "courtside", name: "Courtside", emoji: "🏀", model: "haiku-3.5", trustLevel: "L1", color: "#f97316" },
    { agentId: "afterdark", name: "After Dark", emoji: "🌙", model: "haiku-3.5", trustLevel: "L1", color: "#a855f7" },
    { agentId: "mako", name: "Mako", emoji: "🦈", model: "kimi-k2.5", trustLevel: "L2", color: "#f59e0b" },
  ];

  // Calculate per-agent stats from sessions
  const agentStats = {};
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();
  
  for (const s of sessions) {
    const agent = inferAgent(s);
    if (!agentStats[agent]) agentStats[agent] = { 
      tokens: 0, sessions: 0, cost: 0, lastActive: 0, 
      actualTokensIn: 0, actualTokensOut: 0,
      tokensToday: 0, sessionsToday: 0, costToday: 0 
    };
    
    agentStats[agent].tokens += s.totalTokens || 0;
    agentStats[agent].sessions += 1;
    agentStats[agent].lastActive = Math.max(agentStats[agent].lastActive, s.updatedAt || 0);
    
    // Use actual token counts when available
    const { tokensIn, tokensOut } = getActualTokens(s);
    agentStats[agent].actualTokensIn += tokensIn;
    agentStats[agent].actualTokensOut += tokensOut;
    const cost = estimateCost(s.model, tokensIn, tokensOut);
    agentStats[agent].cost += cost;
    
    // Calculate today's stats
    if (s.updatedAt && s.updatedAt >= todayStartMs) {
      agentStats[agent].tokensToday += tokensIn + tokensOut;
      agentStats[agent].sessionsToday += 1;
      agentStats[agent].costToday += cost;
    }
  }

  for (const agent of agentDefs) {
    const stats = agentStats[agent.agentId] || {};
    
    // Check if agent exists in OpenClaw agents list
    // Note: Anago has id "main" in OpenClaw, not "anago"
    const agentExists = agentsList.some(a => 
      a.id === agent.agentId || 
      a.name === agent.name ||
      (agent.agentId === "anago" && a.id === "main")
    );
    
    // Determine status: active if recent activity AND agent exists in OpenClaw
    let status = "idle";
    if (agentExists && stats.lastActive && (Date.now() - stats.lastActive) < 3600000) {
      status = "active";
    } else if (!agentExists) {
      status = "offline";
    }
    
    // Special Mako detection — runs as standalone scalper process
    if (agent.agentId === "mako") {
      try {
        const makoProc = run("pgrep -f 'scalper.py' || true").trim();
        if (makoProc) {
          status = "active";
          // Check log recency
          try {
            const logStat = run("stat -f '%m' ~/mako_trading/scalper.log 2>/dev/null || true").trim();
            if (logStat) {
              const logAge = Date.now() - parseInt(logStat) * 1000;
              if (logAge < 300000) status = "active"; // log updated in last 5 min
            }
          } catch {}
        }
      } catch {}
    }
    
    const result = await post("/api/sync/agent-status", {
      agentId: agent.agentId,
      status,
      tokensToday: stats.tokensToday || 0,
      tasksToday: stats.sessionsToday || 0,
      lastActive: stats.lastActive || Date.now(),
      costToday: Math.round((stats.costToday || 0) * 100) / 100,
      costWeek: Math.round((stats.cost || 0) * 100) / 100, // All-time cost for now
      costMonth: Math.round((stats.cost || 0) * 100) / 100, // All-time cost for now
    });
    if (result) console.log(`  ✅ ${agent.name} (${status}, ${stats.sessionsToday || 0} today, $${(stats.costToday || 0).toFixed(2)} today)`);
  }
}

// ─── Sync Cron Jobs ─────────────────────────────────────────
async function syncCronJobs() {
  console.log("\n⏰ Syncing cron jobs...");
  
  const raw = run("openclaw cron list --json");
  if (!raw) return;
  
  const data = parseJson(raw);
  if (!data?.jobs) { console.error("  ⚠️  No jobs found"); return; }

  const jobs = data.jobs.map(job => ({
    name: job.name || "Unnamed",
    cronId: job.id,
    agent: job.agentId || "main",
    schedule: job.schedule?.kind === "cron" 
      ? `${job.schedule.expr} (${job.schedule.tz || "UTC"})` 
      : job.schedule?.kind || "unknown",
    cronExpr: job.schedule?.expr || "",
    timezone: job.schedule?.tz || "UTC",
    status: job.enabled ? "active" : "disabled",
    nextRun: job.state?.nextRunAtMs || 0,
    lastRun: job.state?.lastRunAtMs,
    description: typeof job.payload?.message === "string" 
      ? job.payload.message.slice(0, 200) 
      : (job.payload?.text?.slice(0, 200) || ""),
    lastStatus: job.state?.lastStatus,
    lastDurationMs: job.state?.lastDurationMs,
  }));

  const result = await post("/api/sync/cron", { jobs });
  if (result) console.log(`  ✅ ${jobs.length} cron jobs synced`);
}

// ─── Sync Sessions + Costs ──────────────────────────────────
async function syncSessions(sessions, state) {
  console.log("\n📡 Syncing sessions + costs...");
  
  let synced = 0;
  let totalActualCost = 0;
  
  for (const s of sessions) {
    const sessionId = s.sessionId || s.key;
    const agent = inferAgent(s);
    const model = s.model || "unknown";
    
    // Use actual token counts when available
    const { tokensIn, tokensOut } = getActualTokens(s);
    const cost = estimateCost(model, tokensIn, tokensOut);
    totalActualCost += cost;
    
    // Sync session
    await post("/api/sync/session", {
      sessionId,
      sessionKey: s.key || "",
      agent,
      model,
      status: s.abortedLastRun ? "failed" : "completed",
      startedAt: s.updatedAt ? s.updatedAt - 300000 : Date.now(), // estimate start ~5min before update
      endedAt: s.updatedAt || Date.now(),
      tokensIn,
      tokensOut,
      cost,
      taskSummary: s.label || s.displayName || "",
      parentSessionId: undefined,
    });

    // Sync cost entry
    if (!state.syncedSessionIds.includes(sessionId)) {
      await post("/api/sync/cost", {
        agent,
        model,
        tokensIn,
        tokensOut,
        cost,
        sessionId,
        timestamp: s.updatedAt || Date.now(),
      });
      state.syncedSessionIds.push(sessionId);
    }
    
    synced++;
  }
  
  // Keep only last 100 session IDs in state
  state.syncedSessionIds = state.syncedSessionIds.slice(-100);
  
  console.log(`  ✅ ${synced} sessions synced with cost data`);
  console.log(`  💰 Actual total cost across sessions: $${totalActualCost.toFixed(2)}`);
}

// ─── Sync Tasks from Workspace ─────────────────────────
async function syncTasks(state) {
  console.log("\n📝 Syncing tasks from workspace...");
  
  const workspaceDir = resolve(ROOT, "..", "..", ".openclaw", "workspace");
  const tasksDir = resolve(workspaceDir, "tasks");
  
  try {
    const files = readdirSync(tasksDir).filter(f => f.endsWith(".md"));
    let count = 0;
    
    for (const file of files) {
      const filePath = resolve(tasksDir, file);
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      
      // Extract task info from markdown
      const title = lines[0].replace(/^#+\s*/, "").trim();
      if (!title) continue;
      
      // Generate a stable task ID from filename
      const taskId = `task_${file.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
      
      // Parse task metadata
      let description = "";
      let agent = "anago";
      let priority = "p2";
      let status = "up_next";
      let dueDate = null;
      let createdAt = Date.now();
      let updatedAt = Date.now();
      let completedAt = null;
      
      // Simple parsing of markdown content
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("## Goal") || line.startsWith("## Description")) {
          description = lines.slice(i + 1).join("\n").substring(0, 500);
          break;
        }
      }
      
      if (!description) {
        description = content.substring(0, 500);
      }
      
      // Infer status from filename/content - more accurate
      const lowerContent = content.toLowerCase();
      if (file.includes("complete") || file.includes("done") || 
          lowerContent.match(/\b(completed|done|finished|resolved|closed)\b/)) {
        status = "done";
        // Try to extract completion date from content
        const dateMatch = content.match(/\[(\d{4}-\d{2}-\d{2})\]/);
        if (dateMatch) {
          completedAt = new Date(dateMatch[1]).getTime();
        } else {
          completedAt = Date.now() - 86400000; // Assume completed yesterday
        }
      } else if (file.includes("in-progress") || lowerContent.match(/\b(in progress|working on|active|wip)\b/i)) {
        status = "in_progress";
      } else if (file.includes("blocked") || lowerContent.match(/\b(blocked|stuck|waiting)\b/)) {
        status = "blocked";
      }
      
      // Infer priority
      if (file.includes("p0") || content.match(/urgent|critical|p0/i)) priority = "p0";
      else if (file.includes("p1") || content.match(/high priority|p1/i)) priority = "p1";
      else if (file.includes("p3") || content.match(/low priority|p3/i)) priority = "p3";
      
      // Infer agent
      if (file.includes("iq") || content.match(/\biq\b|instantiq|instant.?iq/i)) agent = "iq";
      else if (file.includes("green-sea") || file.includes("greensea") || content.match(/green.?sea|capex|invoice|expense.?track/i)) agent = "greensea";
      else if (file.includes("oracle") || file.includes("mako") || file.includes("polymarket") || content.match(/oracle|mako|polymarket|trading/i)) agent = "mako";
      else if (file.includes("courtside") || content.match(/courtside|lovb/i)) agent = "courtside";
      else if (file.includes("afterdark") || content.match(/after.?dark|party.?game/i)) agent = "afterdark";
      
      await post("/api/sync/task", {
        taskId,
        title,
        description,
        agent,
        priority,
        status,
        dueDate,
        createdAt,
        updatedAt,
        completedAt,
      });
      
      count++;
    }
    
    console.log(`  ✅ ${count} tasks synced`);
  } catch (err) {
    console.log(`  ⚠️  Error syncing tasks: ${err.message}`);
  }
}

// ─── Sync Activity from Memory ──────────────────────────────
async function syncRecentActivity(state) {
  console.log("\n📋 Syncing recent activity...");
  
  const today = new Date().toISOString().split("T")[0];
  const workspaceDir = resolve(ROOT, "..", "..", ".openclaw", "workspace");
  const memPath = resolve(workspaceDir, "memory", `${today}.md`);
  
  try {
    const content = readFileSync(memPath, "utf-8");
    const lines = content.split("\n").filter(l => l.startsWith("- "));
    
    let count = 0;
    for (const line of lines) {
      const text = line.replace(/^- /, "");
      const hash = text.slice(0, 50); // simple dedup
      
      if (state.syncedActivityHashes.includes(hash)) continue;
      
      // Infer action type from content
      let action = "task_completed";
      if (text.match(/email|sent|gmail/i)) action = "email_sent";
      if (text.match(/reddit|subreddit/i)) action = "reddit_browsed";
      if (text.match(/cron|schedule/i)) action = "cron_executed";
      if (text.match(/file|created|wrote|saved/i)) action = "file_created";
      if (text.match(/browser|twitter|browse/i)) action = "browser_action";
      if (text.match(/error|fail|crash/i)) action = "error";
      if (text.match(/message|telegram/i)) action = "message_sent";
      
      await post("/api/sync/activity", {
        agent: "anago",
        action,
        title: text.slice(0, 100),
        description: text,
        status: "completed",
        timestamp: Date.now() - (lines.length - count) * 60000,
      });
      
      state.syncedActivityHashes.push(hash);
      count++;
    }
    
    // Keep only last 200 hashes
    state.syncedActivityHashes = state.syncedActivityHashes.slice(-200);
    
    console.log(`  ✅ ${count} new activity entries synced`);
  } catch {
    console.log("  ⚠️  No memory file for today");
  }
}

// ─── Sync Mako Trades from SQLite ────────────────────────────
async function syncMako(state) {
  console.log("\n🦈 Syncing Mako scalper trades...");

  const DB_PATH = resolve(process.env.HOME, ".openclaw/workspace/projects/polymarket/trading/data/oracle.db");

  // Check if DB exists
  if (!existsSync(DB_PATH)) {
    console.log("  ⚠️  Mako DB not found at", DB_PATH);
    return;
  }

  // Track last synced trade ID
  const lastSyncedId = state.lastMakoTradeId || 0;

  // Query new trades from SQLite via CLI
  const query = `SELECT id, ts, window_start, slug, direction, confidence, score, window_delta, token_price, outcome, pnl, bankroll_after, dry_run FROM scalp_trades WHERE id > ${lastSyncedId} ORDER BY id ASC LIMIT 100;`;
  const raw = run(`sqlite3 -json "${DB_PATH}" "${query}"`);

  if (!raw) {
    console.log("  ⚠️  Could not query Mako DB");
    return;
  }

  const trades = parseJson(raw);
  if (!trades || !Array.isArray(trades) || trades.length === 0) {
    console.log("  ℹ️  No new trades to sync");
  } else {
    let maxId = lastSyncedId;
    for (const t of trades) {
      await post("/api/sync/mako-trade", {
        tradeId: String(t.id),
        timestamp: t.ts * 1000,
        windowStart: (t.window_start || 0) * 1000,
        slug: t.slug || "",
        direction: t.direction || "up",
        confidence: t.confidence || 0,
        score: t.score || 0,
        windowDelta: t.window_delta || 0,
        tokenPrice: t.token_price || 0,
        outcome: t.outcome || "pending",
        pnl: t.pnl || 0,
        bankrollAfter: t.bankroll_after || 0,
        dryRun: t.dry_run === 1 || t.dry_run === true,
      });
      if (t.id > maxId) maxId = t.id;
    }
    state.lastMakoTradeId = maxId;
    console.log(`  ✅ ${trades.length} trades synced (last id: ${maxId})`);
  }

  // Compute aggregate stats for mako-status
  const statsQuery = `SELECT
    COUNT(*) as total,
    SUM(CASE WHEN outcome='win' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN outcome='loss' THEN 1 ELSE 0 END) as losses,
    SUM(pnl) as total_pnl,
    MAX(ts) as last_trade_ts
    FROM scalp_trades;`;
  const statsRaw = run(`sqlite3 -json "${DB_PATH}" "${statsQuery}"`);
  const statsArr = parseJson(statsRaw);
  const stats = statsArr && statsArr[0] ? statsArr[0] : null;

  // Get latest bankroll
  const brQuery = `SELECT bankroll_after, dry_run FROM scalp_trades ORDER BY id DESC LIMIT 1;`;
  const brRaw = run(`sqlite3 -json "${DB_PATH}" "${brQuery}"`);
  const brArr = parseJson(brRaw);
  const latest = brArr && brArr[0] ? brArr[0] : null;

  // Detect scalper process status
  let makoStatus = "offline";
  let makoMode = "dry-run";
  const scalperPid = run("pgrep -f 'scalper.py' || true")?.trim();
  if (scalperPid) {
    makoStatus = "active";
    // Check if --dry-run flag is present in process args
    const procArgs = run(`ps -p ${scalperPid.split("\\n")[0]} -o args= 2>/dev/null || true`)?.trim() || "";
    makoMode = procArgs.includes("--dry-run") ? "dry-run" : "live";
  } else {
    // Check log recency as fallback
    try {
      const logStat = run("stat -f '%m' ~/mako_trading/scalper.log 2>/dev/null || true")?.trim();
      if (logStat) {
        const logAge = Date.now() - parseInt(logStat) * 1000;
        if (logAge < 300000) makoStatus = "idle";
      }
    } catch {}
  }

  if (latest && latest.dry_run === 1) makoMode = "dry-run";

  const totalTrades = stats?.total || 0;
  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  await post("/api/sync/mako-status", {
    status: makoStatus,
    mode: makoMode,
    bankroll: latest?.bankroll_after || 0,
    totalPnl: stats?.total_pnl || 0,
    totalTrades,
    winRate: Math.round(winRate * 10) / 10,
    wins,
    losses,
    walletUsdc: 0, // TODO: query on-chain balance
    lastTradeAt: (stats?.last_trade_ts || 0) * 1000,
  });
  console.log(`  ✅ Status synced: ${makoStatus} (${makoMode}), ${totalTrades} trades, ${winRate.toFixed(1)}% WR`);

  // Daily PnL summary
  const dailyQuery = `SELECT
    date(ts, 'unixepoch', 'localtime') as day,
    COUNT(*) as trades,
    SUM(CASE WHEN outcome='win' THEN 1 ELSE 0 END) as wins,
    SUM(pnl) as pnl,
    (SELECT bankroll_after FROM scalp_trades t2
     WHERE date(t2.ts, 'unixepoch', 'localtime') = date(scalp_trades.ts, 'unixepoch', 'localtime')
     ORDER BY t2.id DESC LIMIT 1) as bankroll_close
    FROM scalp_trades
    GROUP BY day
    ORDER BY day DESC
    LIMIT 30;`;
  const dailyRaw = run(`sqlite3 -json "${DB_PATH}" "${dailyQuery}"`);
  const dailyData = parseJson(dailyRaw);

  if (dailyData && Array.isArray(dailyData)) {
    for (const d of dailyData) {
      await post("/api/sync/mako-pnl", {
        date: d.day,
        trades: d.trades || 0,
        wins: d.wins || 0,
        pnl: d.pnl || 0,
        bankrollClose: d.bankroll_close || 0,
      });
    }
    console.log(`  ✅ ${dailyData.length} daily PnL records synced`);
  }
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log(`🚀 Mission Control Sync — ${new Date().toLocaleString()}`);
  console.log(`   Target: ${SITE_URL}`);
  if (DRY_RUN) console.log("   ⚠️  DRY RUN — no data will be sent");

  // Check if this sync was requested from the dashboard
  const pendingCheck = await getAuth("/api/sync/pending");
  if (pendingCheck?.pending) {
    console.log(`   🔔 Dashboard-requested sync (requested at ${new Date(pendingCheck.requestedAt).toLocaleTimeString()})`);
  } else {
    console.log("   ⏰ Scheduled sync");
  }

  const state = loadState();
  
  // Get sessions from the sessions JSON file if provided, or try OpenClaw API
  let sessions = [];
  const sessionsArg = process.argv.indexOf("--sessions-json");
  if (sessionsArg > -1 && process.argv[sessionsArg + 1]) {
    const data = parseJson(readFileSync(process.argv[sessionsArg + 1], "utf-8"));
    sessions = data?.sessions || data || [];
  } else {
    // Try to read from the gateway's session store
    const sessionDir = resolve(ROOT, "..", "..", ".openclaw", "sessions");
    if (existsSync(sessionDir)) {
      // Read session metadata from transcripts
      console.log("  📂 Reading sessions from gateway store...");
    }
    // Fall back to a dump file we create during heartbeats
    const dumpPath = resolve(ROOT, "scripts", ".sessions-dump.json");
    if (existsSync(dumpPath)) {
      const data = parseJson(readFileSync(dumpPath, "utf-8"));
      sessions = data?.sessions || [];
      console.log(`  📂 Loaded ${sessions.length} sessions from dump`);
    }
  }
  
  await syncAgents(sessions);
  await syncCronJobs();
  await syncSessions(sessions, state);
  await syncTasks(state);
  await syncRecentActivity(state);
  await syncMako(state);
  
  state.lastSync = Date.now();
  saveState(state);
  
  console.log("\n✅ Sync complete!");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
