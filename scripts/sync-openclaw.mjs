#!/usr/bin/env node
/**
 * Sync OpenClaw data → Convex Mission Control
 * 
 * Usage: node scripts/sync-openclaw.mjs
 * Env: SYNC_SECRET (required), CONVEX_SITE_URL (optional, defaults to .env.local value)
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Load env
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

async function post(path, body) {
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
  } catch (err) {
    console.error(`  ⚠️  Command failed: ${cmd}`);
    return null;
  }
}

function parseJson(str) {
  try { return JSON.parse(str); } catch { return null; }
}

// ─── Sync Agents ────────────────────────────────────────────
async function syncAgents() {
  console.log("\n🤖 Syncing agents...");
  
  const agents = [
    { agentId: "anago", name: "Anago", emoji: "🍣", model: "claude-opus-4-6", trustLevel: "L3", color: "#3b82f6" },
    { agentId: "iq", name: "IQ", emoji: "🧠", model: "kimi-k2.5", trustLevel: "L1", color: "#22c55e" },
    { agentId: "greensea", name: "GreenSea", emoji: "🌊", model: "kimi-k2.5", trustLevel: "L1", color: "#10b981" },
    { agentId: "courtside", name: "Courtside", emoji: "🏀", model: "haiku-3.5", trustLevel: "L1", color: "#f97316" },
    { agentId: "afterdark", name: "After Dark", emoji: "🌙", model: "haiku-3.5", trustLevel: "L1", color: "#a855f7" },
  ];

  for (const agent of agents) {
    const result = await post("/api/sync/agent-status", {
      agentId: agent.agentId,
      status: agent.agentId === "anago" ? "active" : "idle",
      lastActive: Date.now(),
    });
    if (result) console.log(`  ✅ ${agent.name}`);
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

// ─── Sync Sessions ──────────────────────────────────────────
async function syncSessions() {
  console.log("\n📡 Syncing sessions...");
  
  // Use the sessions list from OpenClaw gateway API
  const raw = run("openclaw session list --json 2>/dev/null");
  if (!raw) {
    console.log("  ⚠️  No session list available (CLI may not support --json)");
    return;
  }
  
  const data = parseJson(raw);
  if (!data) return;
  
  // Sync each session
  const sessions = Array.isArray(data) ? data : (data.sessions || []);
  for (const s of sessions.slice(0, 20)) {
    await post("/api/sync/session", {
      sessionId: s.id || s.sessionKey || String(Math.random()),
      sessionKey: s.sessionKey || s.id || "",
      agent: s.agentId || "main",
      model: s.model || "unknown",
      status: s.status || "completed",
      startedAt: s.startedAt || s.createdAt || Date.now(),
      endedAt: s.endedAt,
      tokensIn: s.tokensIn || 0,
      tokensOut: s.tokensOut || 0,
      cost: s.cost || 0,
      taskSummary: s.taskSummary || s.label,
      parentSessionId: s.parentSessionId,
    });
  }
  console.log(`  ✅ ${Math.min(sessions.length, 20)} sessions synced`);
}

// ─── Sync Activity from Memory ──────────────────────────────
async function syncRecentActivity() {
  console.log("\n📋 Syncing recent activity...");
  
  // Read today's memory file for activity entries
  const today = new Date().toISOString().split("T")[0];
  const memPath = resolve(ROOT, "..", "..", ".openclaw", "workspace", "memory", `${today}.md`);
  
  try {
    const content = readFileSync(memPath, "utf-8");
    const lines = content.split("\n").filter(l => l.startsWith("- ") || l.startsWith("## "));
    
    let section = "";
    let count = 0;
    for (const line of lines) {
      if (line.startsWith("## ")) {
        section = line.replace("## ", "");
        continue;
      }
      if (line.startsWith("- ") && count < 30) {
        const text = line.replace("- ", "");
        await post("/api/sync/activity", {
          agent: "anago",
          action: "task_completed",
          title: text.slice(0, 100),
          description: text,
          status: "completed",
          timestamp: Date.now() - (30 - count) * 60000,
        });
        count++;
      }
    }
    console.log(`  ✅ ${count} activity entries synced`);
  } catch {
    console.log("  ⚠️  No memory file for today");
  }
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log(`🚀 Mission Control Sync — ${new Date().toLocaleString()}`);
  console.log(`   Target: ${SITE_URL}`);
  
  await syncAgents();
  await syncCronJobs();
  await syncSessions();
  await syncRecentActivity();
  
  console.log("\n✅ Sync complete!");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
