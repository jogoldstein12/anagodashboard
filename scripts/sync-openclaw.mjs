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
import { readFileSync, writeFileSync, existsSync } from "fs";
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

function inferAgent(session) {
  const key = session.key || "";
  const label = session.label || session.displayName || "";
  
  if (key.includes("agent:iq:") || label.toLowerCase().includes("iq")) return "iq";
  if (key.includes("agent:greensea:") || label.toLowerCase().includes("greensea")) return "greensea";
  if (key.includes("agent:courtside:") || label.toLowerCase().includes("courtside")) return "courtside";
  if (key.includes("agent:afterdark:") || label.toLowerCase().includes("after")) return "afterdark";
  return "anago";
}

// ─── Sync Agents ────────────────────────────────────────────
async function syncAgents(sessions) {
  console.log("\n🤖 Syncing agents...");
  
  const agentDefs = [
    { agentId: "anago", name: "Anago", emoji: "🍣", model: "claude-opus-4-6", trustLevel: "L3", color: "#3b82f6" },
    { agentId: "iq", name: "IQ", emoji: "🧠", model: "kimi-k2.5", trustLevel: "L1", color: "#22c55e" },
    { agentId: "greensea", name: "GreenSea", emoji: "🌊", model: "kimi-k2.5", trustLevel: "L1", color: "#10b981" },
    { agentId: "courtside", name: "Courtside", emoji: "🏀", model: "haiku-3.5", trustLevel: "L1", color: "#f97316" },
    { agentId: "afterdark", name: "After Dark", emoji: "🌙", model: "haiku-3.5", trustLevel: "L1", color: "#a855f7" },
  ];

  // Calculate per-agent stats from sessions
  const agentStats = {};
  for (const s of sessions) {
    const agent = inferAgent(s);
    if (!agentStats[agent]) agentStats[agent] = { tokens: 0, sessions: 0, cost: 0, lastActive: 0 };
    agentStats[agent].tokens += s.totalTokens || 0;
    agentStats[agent].sessions += 1;
    agentStats[agent].lastActive = Math.max(agentStats[agent].lastActive, s.updatedAt || 0);
    
    // Estimate cost — assume 30% input, 70% output for typical assistant pattern
    const total = s.totalTokens || 0;
    const tokensIn = Math.round(total * 0.3);
    const tokensOut = Math.round(total * 0.7);
    agentStats[agent].cost += estimateCost(s.model, tokensIn, tokensOut);
  }

  for (const agent of agentDefs) {
    const stats = agentStats[agent.agentId] || {};
    const result = await post("/api/sync/agent-status", {
      agentId: agent.agentId,
      status: stats.lastActive && (Date.now() - stats.lastActive) < 3600000 ? "active" : "idle",
      tokensToday: stats.tokens || 0,
      tasksToday: stats.sessions || 0,
      lastActive: stats.lastActive || Date.now(),
      costToday: Math.round((stats.cost || 0) * 100) / 100,
    });
    if (result) console.log(`  ✅ ${agent.name} (${stats.sessions || 0} sessions, $${(stats.cost || 0).toFixed(2)})`);
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
  for (const s of sessions) {
    const sessionId = s.sessionId || s.key;
    const agent = inferAgent(s);
    const model = s.model || "unknown";
    const totalTokens = s.totalTokens || 0;
    const tokensIn = Math.round(totalTokens * 0.3);
    const tokensOut = Math.round(totalTokens * 0.7);
    const cost = estimateCost(model, tokensIn, tokensOut);
    
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
  
  // Print cost summary
  const totalCost = sessions.reduce((sum, s) => {
    const total = s.totalTokens || 0;
    return sum + estimateCost(s.model, Math.round(total * 0.3), Math.round(total * 0.7));
  }, 0);
  console.log(`  💰 Estimated total cost across sessions: $${totalCost.toFixed(2)}`);
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

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log(`🚀 Mission Control Sync — ${new Date().toLocaleString()}`);
  console.log(`   Target: ${SITE_URL}`);
  if (DRY_RUN) console.log("   ⚠️  DRY RUN — no data will be sent");
  
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
  await syncRecentActivity(state);
  
  state.lastSync = Date.now();
  saveState(state);
  
  console.log("\n✅ Sync complete!");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
