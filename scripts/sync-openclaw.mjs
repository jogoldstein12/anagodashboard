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
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
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

const SITE_URL = process.env.CONVEX_SITE_URL || process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "https://abundant-bullfrog-757.convex.site";
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
  if (key.includes("agent:uni:")) return "uni";
  
  // Check labels (sub-agent sessions spawned from main)
  if (label.includes("iq") || label.includes("instantiq")) return "iq";
  if (label.includes("greensea") || label.includes("green-sea") || label.includes("green sea")) return "greensea";
  if (label.includes("courtside")) return "courtside";
  if (label.includes("afterdark") || label.includes("after-dark") || label.includes("after dark")) return "afterdark";
  if (label.includes("oracle") || label.includes("mako") || label.includes("poly") || label.includes("polymarket") || label.includes("trading")) return "mako";
  if (label.includes("uni") || label.includes("kalshi") || label.includes("cpi")) return "uni";
  if (label.includes("mc-") || label.includes("mission-control") || label.includes("dashboard")) return "anago";
  
  return "anago";
}

// ─── Sync Agents ────────────────────────────────────────────
async function syncAgents(sessions) {
  console.log("\n🤖 Syncing agents...");
  
  // Get actual agent list from OpenClaw
  const agentsRaw = run("openclaw agents list --json");
  const agentsList = parseJson(agentsRaw) || [];
  
  // ── Build agentDefs dynamically from OpenClaw registry ──────────────────
  // Curated display preferences for known agents.
  // Any new agent registered in openclaw.json will appear automatically
  // on the next sync with a deterministic fallback color + 🤖 emoji.
  const AGENT_DISPLAY = {
    main:      { agentId: "anago", name: "Anago",      emoji: "🍣", trustLevel: "L3", color: "#3b82f6" },
    anago:     { agentId: "anago", name: "Anago",      emoji: "🍣", trustLevel: "L3", color: "#3b82f6" },
    iq:        {                   name: "IQ",          emoji: "🧠", trustLevel: "L1", color: "#22c55e" },
    greensea:  {                   name: "GreenSea",   emoji: "🌊", trustLevel: "L1", color: "#10b981" },
    courtside: {                   name: "Courtside",  emoji: "🏀", trustLevel: "L1", color: "#f97316" },
    afterdark: {                   name: "After Dark", emoji: "🌙", trustLevel: "L1", color: "#a855f7" },
    mako:      {                   name: "Mako",       emoji: "🦈", trustLevel: "L2", color: "#f59e0b" },
    uni:       {                   name: "Uni",        emoji: "🪸", trustLevel: "L2", color: "#06b6d4" },
  };
  const FALLBACK_COLORS = ["#ef4444","#8b5cf6","#ec4899","#14b8a6","#84cc16","#f97316"];
  function hashColor(id) {
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
    return FALLBACK_COLORS[h % FALLBACK_COLORS.length];
  }

  const agentDefs = agentsList.map(a => {
    const display = AGENT_DISPLAY[a.id] || {};
    const agentId = display.agentId || a.id;
    const rawModel = a.model || "";
    const modelShort = rawModel.includes("/") ? rawModel.split("/").pop() : rawModel;
    return {
      agentId,
      name:       display.name       || a.name || a.identityName || agentId,
      emoji:      display.emoji      || a.identityEmoji           || "🤖",
      model:      modelShort                                       || "unknown",
      trustLevel: display.trustLevel                              || "L1",
      color:      display.color      || hashColor(agentId),
    };
  });

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
    
    // Special Mako detection — runs as standalone process, check PID file
    if (agent.agentId === "mako") {
      try {
        // Detect Mako by log file recency (process runs as bare "main.py")
        try {
          const logPath = "/Users/anago/.openclaw/workspace/projects/polymarket/mako_v2/logs/mako_v2.log";
          const logStat = run(`stat -f '%m' ${logPath} 2>/dev/null || echo 0`).trim();
          const logAge = Date.now() - parseInt(logStat) * 1000;
          status = logAge < 120000 ? "active" : "idle"; // active if log written in last 2 min
        } catch {}
      } catch {}
    }

    // Special Uni detection — check if any pending_trade.json or recent trade activity
    if (agent.agentId === "uni") {
      try {
        const pendingPath = "/Users/anago/.openclaw/workspace/agents/uni/phase1/pending_trade.json";
        const pendingExists = run(`test -f ${pendingPath} && echo yes || echo no`).trim();
        if (pendingExists === "yes") {
          const pending = JSON.parse(run(`cat ${pendingPath}`));
          if (pending.status === "pending" || pending.status === "approved") {
            status = "active"; // has a live pending trade
          }
        }
      } catch {}
    }
    
    const result = await post("/api/sync/agent-status", {
      agentId: agent.agentId,
      name: agent.name,
      emoji: agent.emoji,
      model: agent.model,
      trustLevel: agent.trustLevel,
      color: agent.color,
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

// ─── Infer agent from task content ──────────────────────
function inferAgentFromContent(content, file = "") {
  const lower = (content + " " + file).toLowerCase();
  if (lower.includes("mako") || lower.includes("polymarket") || lower.includes("scalper")) return "mako";
  if (lower.includes("uni") || lower.includes("kalshi") || lower.includes("cpi")) return "uni";
  if (lower.includes("iq") || lower.includes("instantiq")) return "iq";
  if (lower.includes("courtside") || lower.includes("lovb")) return "courtside";
  if (lower.includes("afterdark") || lower.includes("party") || lower.includes("after dark")) return "afterdark";
  if (lower.includes("greensea") || lower.includes("green sea") || lower.includes("invoice") || lower.includes("capex")) return "greensea";
  return "anago";
}

// ─── Parse TODO.md ─────────────────────────────────────
async function syncTodoMd(workspaceDir, state) {
  const todoPath = resolve(workspaceDir, "TODO.md");
  if (!existsSync(todoPath)) {
    console.log("  ℹ️  No TODO.md found");
    return 0;
  }

  const content = readFileSync(todoPath, "utf-8");
  const lines = content.split("\n");
  let count = 0;
  let currentTier = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect tier headers
    if (line.startsWith("## 🔥")) currentTier = "p0";       // Active Now
    else if (line.startsWith("## 👤")) currentTier = "p1";   // Needs Josh
    else if (line.startsWith("## ⏸️")) currentTier = "p2";   // On Hold
    else if (line.startsWith("## 📋")) currentTier = "p3";   // Backlog
    // Legacy format support
    else if (line.startsWith("## 🔴")) currentTier = "p0";
    else if (line.startsWith("## 🟡")) currentTier = "p1";
    else if (line.startsWith("## 🟠")) currentTier = "p2";
    else if (line.startsWith("## 🟢")) currentTier = "p3";
    
    // Parse task headers: ### ID. [emoji] Title OR - **ID.** [emoji] Title (backlog inline format)
    const taskMatch = line.match(/^###\s+[\w-]+\.\s*([⬜✅🔄❌])\s*(.+)$/) ||
                      line.match(/^-\s+\*\*[\w-]+\.\*\*\s*([⬜✅🔄❌])\s*(.+)$/);
    if (taskMatch) {
      const statusEmoji = taskMatch[1];
      const title = taskMatch[2].trim();
      
      // Parse status
      let status = "up_next";
      if (statusEmoji === "✅") status = "done";
      else if (statusEmoji === "🔄") status = "in_progress";
      else if (statusEmoji === "❌") status = "done"; // skipped = done for tracking
      
      // Read description (next 2-3 lines)
      let description = "";
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const descLine = lines[j].trim();
        if (descLine && !descLine.startsWith("###") && !descLine.startsWith("##")) {
          description += descLine + " ";
        }
      }
      description = description.trim().substring(0, 500);
      
      // Infer agent from content
      const fullContent = title + " " + description;
      const agent = inferAgentFromContent(fullContent);
      
      // Priority from tier, fallback to content
      let priority = currentTier || "p2";
      if (fullContent.match(/\bp0\b|urgent|critical/i)) priority = "p0";
      else if (fullContent.match(/\bp1\b|high priority/i)) priority = "p1";
      else if (fullContent.match(/\bp3\b|low priority/i)) priority = "p3";
      
      // Generate stable taskId
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 50);
      const taskId = `todo_${slug}`;
      
      // Parse due date if mentioned
      let dueDate = null;
      const dateMatch = fullContent.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) dueDate = new Date(dateMatch[1]).getTime();
      
      await post("/api/sync/task", {
        taskId,
        title,
        description,
        agent,
        priority,
        status,
        dueDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        completedAt: status === "done" ? Date.now() : null,
      });
      
      count++;
    }
  }
  
  console.log(`  ✅ ${count} tasks from TODO.md synced`);
  return count;
}

// ─── Sync Tasks from Workspace ─────────────────────────
async function syncTasks(state) {
  console.log("\n📝 Syncing tasks from workspace...");
  
  const workspaceDir = resolve(ROOT, "..", "..", ".openclaw", "workspace");
  const tasksDir = resolve(workspaceDir, "tasks");
  
  let totalCount = 0;
  
  // Sync TODO.md first
  totalCount += await syncTodoMd(workspaceDir, state);
  
  // Sync tasks/*.md files
  try {
    const files = readdirSync(tasksDir).filter(f => f.endsWith(".md"));
    
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
      agent = inferAgentFromContent(content, file);
      
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
      
      totalCount++;
    }
    
    console.log(`  ✅ ${totalCount} total tasks synced (TODO.md + tasks/)`);
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

// ─── Sync Mako v2 Trades from SQLite ────────────────────────────
async function syncMako(state) {
  console.log("\n🦈 Syncing Mako v2 trades...");

  const DB_PATH = resolve(process.env.HOME, ".openclaw/workspace/projects/polymarket/mako_v2/data/mako_v2.db");
  const PID_FILE = resolve(process.env.HOME, ".openclaw/workspace/projects/polymarket/mako_v2/logs/mako_v2.pid");
  const LOG_FILE = resolve(process.env.HOME, ".openclaw/workspace/projects/polymarket/mako_v2/logs/mako_v2.log");
  const RISK_STATE = resolve(process.env.HOME, ".openclaw/workspace/projects/polymarket/mako_v2/data/risk_state.json");

  if (!existsSync(DB_PATH)) {
    console.log("  ⚠️  Mako v2 DB not found at", DB_PATH);
    return;
  }

  // ── Process status ──────────────────────────────────────────
  let makoStatus = "offline";
  let makoMode = "live";
  let lastCrashAt = undefined;
  let lastCrashReason = undefined;
  try {
    const pidRaw = run(`cat "${PID_FILE}" 2>/dev/null || true`)?.trim();
    if (pidRaw) {
      const alive = run(`ps -p ${pidRaw} -o pid= 2>/dev/null || true`)?.trim();
      if (alive) {
        makoStatus = "live";
        const procArgs = run(`ps -p ${pidRaw} -o args= 2>/dev/null || true`)?.trim() || "";
        makoMode = procArgs.includes("--dry-run") ? "dry-run" : "live";
      } else {
        // PID file exists but process dead — check log recency
        const logStat = run(`stat -f '%m' "${LOG_FILE}" 2>/dev/null || true`)?.trim();
        if (logStat) {
          const logAge = Date.now() - parseInt(logStat) * 1000;
          makoStatus = logAge < 300000 ? "idle" : "offline";
        }
      }
    }
  } catch {}

  // ── Detect SIGTERM crashes from log ────────────────────────
  try {
    const sigLines = run(`grep -i "SIGTERM\\|signal 15\\|killed\\|terminated" "${LOG_FILE}" 2>/dev/null | tail -5 || true`)?.trim();
    if (sigLines) {
      const lines = sigLines.split("\n").filter(Boolean);
      const lastLine = lines[lines.length - 1] || "";
      // Try to extract timestamp from log line (ISO format or epoch)
      const tsMatch = lastLine.match(/(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/);
      if (tsMatch) {
        lastCrashAt = new Date(tsMatch[1]).getTime();
        lastCrashReason = "SIGTERM";
      } else {
        // Use log file modification time as fallback
        const logStat = run(`stat -f '%m' "${LOG_FILE}" 2>/dev/null || true`)?.trim();
        if (logStat && makoStatus === "offline") {
          lastCrashAt = parseInt(logStat) * 1000;
          lastCrashReason = "SIGTERM";
        }
      }
    }
  } catch {}

  // ── Bankroll from risk_state.json ───────────────────────────
  let reportedBankroll = 0;
  let liquidUsdc = 0;
  let positionValue = 0;
  try {
    const riskRaw = run(`cat "${RISK_STATE}" 2>/dev/null || true`);
    const risk = riskRaw ? JSON.parse(riskRaw) : null;
    if (risk) {
      reportedBankroll = risk.bankroll || 0;
      liquidUsdc = risk.liquid_usdc || 0;
      positionValue = risk.position_value || 0;
    }
  } catch {}

  // Fall back to on-chain USDC balance if risk_state unavailable
  if (!reportedBankroll) {
    try {
      const proxy = "0xC6EEEDF1AEAC0ab054CEd5b327566b12b7f4DdeC";
      const usdcContract = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
      const callData = "0x70a08231" + proxy.slice(2).toLowerCase().padStart(64, "0");
      const rpcPayload = JSON.stringify({
        jsonrpc: "2.0", method: "eth_call",
        params: [{ to: usdcContract, data: callData }, "latest"], id: 1,
      });
      const rpcRaw = run(`curl -s -X POST https://polygon-bor.publicnode.com -H 'Content-Type: application/json' -d '${rpcPayload}'`);
      const rpcResp = rpcRaw ? JSON.parse(rpcRaw) : null;
      if (rpcResp?.result) reportedBankroll = parseInt(rpcResp.result, 16) / 1e6;
    } catch {}
  }

  // ── New trades ───────────────────────────────────────────────
  const lastSyncedId = state.lastMakoTradeId || 0;
  const query = `SELECT id, ts, strategy, event_id, leg_a_platform, leg_a_market, leg_a_side, leg_a_price, leg_a_contracts, leg_a_status, leg_b_platform, leg_b_market, leg_b_side, leg_b_price, leg_b_contracts, leg_b_status, expected_profit_cents, actual_profit_cents, status, resolution_date, notes FROM trades WHERE id > ${lastSyncedId} ORDER BY id ASC LIMIT 100;`;
  const raw = run(`sqlite3 -json "${DB_PATH}" "${query}"`);

  if (raw === null || raw === undefined) {
    console.log("  ⚠️  Could not query Mako v2 DB");
  } else {
    const trades = parseJson(raw) || [];
    if (!trades || trades.length === 0) {
      console.log("  ℹ️  No new trades to sync");
    } else {
      let maxId = lastSyncedId;
      for (const t of trades) {
        // Map v2 fields → Convex mako-trade schema
        // strategy: 'cross_arb' | 'mm_fill' | 'mm_quote'
        // Use event_id as slug, leg_a_side as direction, leg_a_price as tokenPrice
        const isCrossArb = t.strategy === "cross_arb";
        const outcome = t.status === "closed" ? (t.actual_profit_cents > 0 ? "win" : "loss")
                      : t.status === "open" ? "pending"
                      : t.status;

        await post("/api/sync/mako-trade", {
          tradeId: String(t.id),
          timestamp: t.ts * 1000,
          windowStart: t.ts * 1000,
          slug: t.event_id || t.leg_a_market || "",
          direction: t.leg_a_side || "buy",
          confidence: t.leg_a_price || 0,
          score: t.expected_profit_cents || 0,
          windowDelta: 0,
          tokenPrice: t.leg_a_price || 0,
          outcome,
          pnl: t.actual_profit_cents ? t.actual_profit_cents / 100 : 0,
          bankrollAfter: reportedBankroll,
          dryRun: false,
          // Extra v2 metadata stored in notes field
          notes: JSON.stringify({
            strategy: t.strategy,
            leg_a: `${t.leg_a_platform}:${t.leg_a_market} ${t.leg_a_side}@${t.leg_a_price} ×${t.leg_a_contracts}`,
            leg_b: t.leg_b_platform ? `${t.leg_b_platform}:${t.leg_b_market} ${t.leg_b_side}@${t.leg_b_price} ×${t.leg_b_contracts}` : null,
            expected_profit_cents: t.expected_profit_cents,
            resolution_date: t.resolution_date,
          }),
        });
        if (t.id > maxId) maxId = t.id;
      }
      state.lastMakoTradeId = maxId;
      console.log(`  ✅ ${trades.length} Mako v2 trades synced (last id: ${maxId})`);
    }
  }

  // ── Aggregate stats ──────────────────────────────────────────
  const statsQuery = `SELECT
    COUNT(*) as total,
    SUM(CASE WHEN status='closed' AND actual_profit_cents > 0 THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN status='closed' AND actual_profit_cents <= 0 THEN 1 ELSE 0 END) as losses,
    SUM(CASE WHEN status='closed' THEN actual_profit_cents ELSE 0 END) / 100.0 as total_pnl,
    MAX(ts) as last_trade_ts,
    SUM(CASE WHEN status='closed' THEN 1 ELSE 0 END) as settled
    FROM trades;`;
  const statsRaw = run(`sqlite3 -json "${DB_PATH}" "${statsQuery}"`);
  const statsArr = parseJson(statsRaw);
  const stats = statsArr && statsArr[0] ? statsArr[0] : null;

  const totalTrades = stats?.total || 0;
  const settledTrades = stats?.settled || 0;
  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const winRate = settledTrades > 0 ? (wins / settledTrades) * 100 : 0;

  // ── Daily P&L from DB ─────────────────────────────────────────
  let dailyPnl = 0;
  let openPositionCount = 0;
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dayStart = Math.floor(new Date(todayStr + "T00:00:00Z").getTime() / 1000);
    const dailyQuery = `SELECT SUM(actual_profit_cents)/100.0 as daily_pnl, COUNT(*) as open_count FROM trades WHERE ts >= ${dayStart} AND status='open';`;
    const dailyRaw = run(`sqlite3 -json "${DB_PATH}" "${dailyQuery}"`);
    const dailyArr = parseJson(dailyRaw);
    const daily = dailyArr?.[0];
    dailyPnl = daily?.daily_pnl || 0;
    openPositionCount = daily?.open_count || 0;
  } catch {}

  // ── Peak bankroll + drawdown from risk_state ───────────────
  let peakBankroll = reportedBankroll;
  let drawdownPct = 0;
  try {
    const riskRaw = run(`cat "${RISK_STATE}" 2>/dev/null || true`);
    const risk = riskRaw ? JSON.parse(riskRaw) : null;
    if (risk) {
      peakBankroll = risk.peak_bankroll || reportedBankroll;
      if (peakBankroll > 0) {
        drawdownPct = Math.max(0, ((peakBankroll - reportedBankroll) / peakBankroll) * 100);
      }
      dailyPnl = risk.daily_pnl ?? dailyPnl;
    }
  } catch {}

  await post("/api/sync/mako-status", {
    status: makoStatus,
    polyBalance: liquidUsdc,
    kalshiBalance: 0,          // Mako trades on Poly only
    bankroll: reportedBankroll,
    peakBankroll,
    drawdownPct: Math.round(drawdownPct * 10) / 10,
    dailyPnl,
    totalPnl: stats?.total_pnl || 0,
    totalTrades,
    openPositions: openPositionCount,
    winRate: Math.round(winRate * 10) / 10,
    lastTradeAt: stats?.last_trade_ts ? stats.last_trade_ts * 1000 : undefined,
    ...(lastCrashAt && { lastCrashAt }),
    ...(lastCrashReason && { lastCrashReason }),
  });

  console.log(`  📊 Mako v2: ${makoStatus} | bankroll=$${reportedBankroll.toFixed(2)} | trades=${totalTrades} | winRate=${winRate.toFixed(1)}%`);
}


// ─── Sync Uni Kalshi Trading ─────────────────────────────
async function syncUni(state) {
  console.log("\n🪸 Syncing Uni Kalshi trading...");

  const uniDir = resolve(process.env.HOME, ".openclaw/workspace/agents/uni/phase1");
  
  // Default values — will be overridden by live Kalshi balance fetch below
  let kalshiBalance = 0;
  let winRate = 0;
  let totalTrades = 0;
  let totalPnl = 0;
  let nextReleaseDate = null;
  let regime = null;
  let pendingTrade = null;
  let status = "idle";

  // Read calibration_db.json for balance and stats
  const calibrationPath = resolve(uniDir, "calibration_db.json");
  if (existsSync(calibrationPath)) {
    try {
      const calibration = JSON.parse(readFileSync(calibrationPath, "utf-8"));
      kalshiBalance = calibration.balance || calibration.kalshi_balance || kalshiBalance;
      winRate = calibration.win_rate || calibration.winRate || 0;
      totalTrades = calibration.total_trades || calibration.totalTrades || 0;
      totalPnl = calibration.total_pnl || calibration.totalPnl || 0;
      nextReleaseDate = calibration.next_release_date || calibration.nextReleaseDate || null;
      regime = calibration.regime || null;
    } catch (err) {
      console.log(`  ⚠️  Error reading calibration_db.json: ${err.message}`);
    }
  }

  // ── CSV column layout (as of Mar 6 2026) ──────────────────────────────────
  // 0:id  1:entry_date  2:target_exit_date  3:ticker  4:direction  5:quantity
  // 6:entry_price  7:cost  8:status  9:order_id  10:filled_qty  11:mid_at_entry
  // 12:col13  13:exit_price  14:pnl  15:notes
  // ──────────────────────────────────────────────────────────────────────────

  // Read trade_log.csv for stats + open position detection
  const tradeLogPath = resolve(uniDir, "trade_log.csv");
  let openPositions = [];
  if (existsSync(tradeLogPath)) {
    try {
      const csvContent = readFileSync(tradeLogPath, "utf-8");
      const lines = csvContent.trim().split("\n").slice(1); // Skip header row

      let wins = 0;
      let pnlSum = 0;
      let closedCount = 0;

      for (const line of lines) {
        // Handle quoted fields (notes may contain commas)
        const cols = line.match(/(".*?"|[^,]+)(?=,|$)|(?<=,|^)(?=,|$)/g)
          ?.map(c => c?.replace(/^"|"$/g, "").trim()) ?? line.split(",").map(c => c.trim());

        const rowId        = cols[0] || "";
        const entryDate    = cols[1] || "";
        const exitDate     = cols[2] || "";
        const ticker       = cols[3] || "";
        const direction    = cols[4] || "";
        const quantity     = parseInt(cols[5]) || 0;
        const entryPrice   = parseFloat(cols[6]) || 0;
        const cost         = parseFloat(cols[7]) || 0;
        const rowStatus    = (cols[8] || "").toLowerCase();
        const exitPrice    = parseFloat(cols[13]) || 0;
        const pnl          = parseFloat(cols[14]) || 0;
        const notes        = cols[15] || "";

        if (!rowId || !ticker) continue;

        if (rowStatus === "open") {
          openPositions.push({ rowId, entryDate, exitDate, ticker, direction, quantity, entryPrice, cost, notes });
          status = "active"; // Has live open positions → mark active
        } else if (rowStatus === "closed") {
          closedCount++;
          if (exitPrice > 0 && exitPrice > entryPrice) wins++;
          pnlSum += pnl;
        }
      }

      totalTrades = lines.filter(l => l.trim()).length;
      if (totalTrades > 0 && closedCount > 0) winRate = (wins / closedCount) * 100;
      if (totalPnl === 0) totalPnl = pnlSum;
    } catch (err) {
      console.log(`  ⚠️  Error reading trade_log.csv: ${err.message}`);
    }
  }

  // Fetch live Kalshi portfolio balance via Python (RSA-PSS auth)
  try {
    const balScript = `
import sys, os
sys.path.insert(0, '/Users/anago/.openclaw/workspace/projects/polymarket/mako_v2')
sys.path.insert(0, '/Users/anago/.openclaw/workspace/agents/uni/data/kalshi_raw/code/kalshi_scraping')
os.chdir('/Users/anago/.openclaw/workspace/projects/polymarket/mako_v2')
from clients.kalshi import KalshiClient
import json
k = KalshiClient()
bal = k.get_balance()
print(json.dumps({"balance": bal}))
`.trim();
    const balRaw = run(`/opt/homebrew/bin/python3 -c "${balScript.replace(/"/g, '\\"').replace(/\n/g, '; ')}" 2>/dev/null`);
    if (balRaw) {
      const parsed = JSON.parse(balRaw);
      if (parsed?.balance != null) kalshiBalance = parsed.balance;
    }
  } catch {}

  // Fetch live mid-prices from Kalshi for open positions
  async function fetchKalshiMid(ticker) {
    try {
      const url = `https://api.elections.kalshi.com/trade-api/v2/markets/${ticker}`;
      const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const data = await res.json();
      const m = data?.market || {};
      const bid = m.yes_bid || 0;
      const ask = m.yes_ask || 0;
      return bid && ask ? Math.round((bid + ask) / 2 * 10) / 10 : null;
    } catch { return null; }
  }

  // Read pending_trade.json for trades awaiting Josh's approval
  const pendingPath = resolve(uniDir, "pending_trade.json");
  if (existsSync(pendingPath)) {
    try {
      pendingTrade = JSON.parse(readFileSync(pendingPath, "utf-8"));
      if (pendingTrade.status === "pending" || pendingTrade.status === "approved") {
        status = "active";
      }
    } catch (err) {
      console.log(`  ⚠️  Error reading pending_trade.json: ${err.message}`);
    }
  }

  // Build status payload — use first open position as the "active trade" shown on dashboard
  const firstOpen = openPositions[0] || null;
  const firstOpenMid = firstOpen ? await fetchKalshiMid(firstOpen.ticker) : null;
  const firstOpenPnl = firstOpen && firstOpenMid
    ? Math.round((firstOpenMid - firstOpen.entryPrice) / 100 * firstOpen.quantity * 100) / 100
    : null;

  // ── Compute aggregate open position stats ────────────────────
  const totalDeployed = openPositions.reduce((sum, p) => sum + (p.cost || 0), 0);
  const nextResolution = openPositions.length > 0
    ? openPositions.map(p => p.exitDate).filter(Boolean).sort()[0] || null
    : null;

  // ── Read macro signals from state/macro_signals.json ────────
  let macroSignals = undefined;
  let nowcastCpiMom = undefined;
  const macroSignalsPath = resolve(process.env.HOME, ".openclaw/workspace/agents/uni/state/macro_signals.json");
  try {
    if (existsSync(macroSignalsPath)) {
      const macroRaw = JSON.parse(readFileSync(macroSignalsPath, "utf-8"));
      macroSignals = {
        wti: macroRaw.wti ?? macroRaw.WTI ?? undefined,
        gasoline: macroRaw.gasoline ?? macroRaw.Gasoline ?? undefined,
        breakeven5yr: macroRaw.breakeven_5yr ?? macroRaw.breakeven5yr ?? undefined,
        clevelandFedNowcast: macroRaw.cleveland_fed_nowcast ?? macroRaw.nowcast ?? undefined,
        updatedAt: macroRaw.updated_at ? new Date(macroRaw.updated_at).getTime() : Date.now(),
      };
      nowcastCpiMom = macroSignals.clevelandFedNowcast;
    }
  } catch (err) {
    console.log(`  ⚠️  Error reading macro_signals.json: ${err.message}`);
  }

  // ── Shock trigger status ──────────────────────────────────────
  let shockTriggerStatus = undefined;
  const shockScriptPath = resolve(process.env.HOME, ".openclaw/workspace/agents/uni/scripts/shock_trigger_check.py");
  if (existsSync(shockScriptPath)) {
    shockTriggerStatus = "Daily shock check active — next run 10:30 AM ET";
  }

  // Sync status to Convex — strip undefined/null optional fields (Convex rejects null for optional validators)
  const uniStatusPayload = {
    status,
    kalshiBalance,
    winRate,
    totalTrades,
    totalPnl,
    // Active trade info: prefer open CSV position over pending_trade.json
    ...(firstOpen?.ticker        && { ticker: firstOpen.ticker }),
    ...(firstOpen?.exitDate      && { releaseDate: firstOpen.exitDate }),
    ...(firstOpen?.direction     && { tradeDirection: firstOpen.direction }),
    ...(firstOpen?.entryPrice    && { entryPrice: firstOpen.entryPrice }),
    ...(firstOpen?.cost          && { betSize: firstOpen.cost }),
    ...(firstOpenPnl !== null    && { unrealizedPnl: firstOpenPnl }),
    // Fallback to pending_trade.json fields if no CSV open position
    ...(!firstOpen && pendingTrade?.ticker        && { ticker: pendingTrade.ticker }),
    ...(!firstOpen && pendingTrade?.release_date  && { releaseDate: pendingTrade.release_date }),
    ...(!firstOpen && pendingTrade?.direction     && { tradeDirection: pendingTrade.direction }),
    ...(!firstOpen && pendingTrade?.entry_price   && { entryPrice: pendingTrade.entry_price }),
    ...(!firstOpen && pendingTrade?.bet_size      && { betSize: pendingTrade.bet_size }),
    ...(!firstOpen && pendingTrade?.signal_summary && { signalSummary: pendingTrade.signal_summary }),
    ...(regime && { regime }),
    // New fields
    openPositionCount: openPositions.length,
    totalDeployed: Math.round(totalDeployed * 100) / 100,
    ...(nextResolution && { nextResolution }),
    ...(nowcastCpiMom !== undefined && { nowcastCpiMom }),
    ...(macroSignals && { macroSignals }),
    ...(shockTriggerStatus && { shockTriggerStatus }),
  };
  await post("/api/sync/uni-status", uniStatusPayload);

  // Log open positions summary
  if (openPositions.length > 0) {
    for (const pos of openPositions) {
      const mid = await fetchKalshiMid(pos.ticker);
      const pnl = mid ? Math.round((mid - pos.entryPrice) / 100 * pos.quantity * 100) / 100 : null;
      const pnlStr = pnl !== null ? ` | P&L: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}` : "";
      console.log(`  📊 Open: ${pos.ticker} | ${pos.quantity} contracts @ ${pos.entryPrice}¢ | mid=${mid ?? "?"}¢${pnlStr}`);
    }
  }

  console.log(`  ✅ Uni status synced: ${status}, $${kalshiBalance.toFixed(2)} balance, ${totalTrades} trades, ${openPositions.length} open`);

  // Sync individual trades from CSV — correct column mapping
  if (existsSync(tradeLogPath)) {
    try {
      const csvContent = readFileSync(tradeLogPath, "utf-8");
      const lines = csvContent.trim().split("\n").slice(1);
      let syncedTrades = 0;

      for (const line of lines) {
        const cols = line.match(/(".*?"|[^,]+)(?=,|$)|(?<=,|^)(?=,|$)/g)
          ?.map(c => c?.replace(/^"|"$/g, "").trim()) ?? line.split(",").map(c => c.trim());

        const tradeId    = cols[0]?.trim();
        const entryDate  = cols[1]?.trim();
        const exitDate   = cols[2]?.trim();
        const ticker     = cols[3]?.trim();
        const direction  = cols[4]?.trim();
        const quantity   = parseInt(cols[5]) || 0;
        const entryPrice = parseFloat(cols[6]) || 0;
        const cost       = parseFloat(cols[7]) || 0;
        const rowStatus  = (cols[8] || "pending").trim().toLowerCase();
        const exitPrice  = parseFloat(cols[13]) || 0;
        const pnl        = parseFloat(cols[14]) || 0;

        const outcome = rowStatus === "open" ? "pending"
                      : rowStatus === "closed" && exitPrice > 0 && exitPrice >= entryPrice ? "win"
                      : rowStatus === "closed" ? "loss"
                      : "pending";

        if (tradeId && ticker) {
          // For open positions: fetch live mid price and compute unrealized P&L
          let currentMid = undefined;
          let unrealizedPnl = undefined;
          if (outcome === "pending" && ticker) {
            currentMid = await fetchKalshiMid(ticker);
            if (currentMid !== null && entryPrice > 0) {
              unrealizedPnl = Math.round((currentMid - entryPrice) / 100 * quantity * 100) / 100;
            }
          }

          await post("/api/sync/uni-trade", {
            tradeId,
            releaseDate: exitDate || entryDate,
            ticker,
            entryType: direction,
            entryPrice,
            betSize: cost,
            contracts: quantity,
            outcome,
            pnl: outcome !== "pending" ? pnl : 0,
            ...(currentMid !== undefined && currentMid !== null && { currentMid }),
            ...(unrealizedPnl !== undefined && { unrealizedPnl }),
            regime: "N/A",
            executedAt: new Date(entryDate).getTime() || Date.now(),
          });
          syncedTrades++;
        }
      }

      console.log(`  ✅ ${syncedTrades} Uni trades synced`);
    } catch (err) {
      console.log(`  ⚠️  Error syncing Uni trades: ${err.message}`);
    }
  }
}

// ─── Sync Memory Files ──────────────────────────────────────
async function syncMemoryFiles(state) {
  console.log("\n🧠 Syncing memory files...");
  
  const workspaceDir = resolve(process.env.HOME || "~", ".openclaw", "workspace");
  const memoryDir = resolve(workspaceDir, "memory");
  
  // Initialize lastModified tracking in state if not present
  if (!state.lastModifiedMs) state.lastModifiedMs = {};
  
  let syncedCount = 0;
  let skippedCount = 0;
  
  // Helper to check if file needs sync
  const needsSync = (filePath, mtimeMs) => {
    const lastSynced = state.lastModifiedMs[filePath] || 0;
    return mtimeMs > lastSynced;
  };
  
  // Helper to sync a single file
  const syncFile = async (filePath, title, type, tags) => {
    try {
      const fullPath = resolve(workspaceDir, filePath);
      if (!existsSync(fullPath)) return false;
      
      const stats = statSync(fullPath);
      const mtimeMs = stats.mtimeMs;
      
      if (!needsSync(filePath, mtimeMs)) {
        skippedCount++;
        return true; // Already synced, count as success
      }
      
      const content = readFileSync(fullPath, "utf-8");
      
      const result = await post("/api/sync/document", {
        type,
        title,
        content,
        agent: "anago",
        filePath,
        tags,
        timestamp: Math.floor(mtimeMs),
      });
      
      if (result) {
        state.lastModifiedMs[filePath] = mtimeMs;
        syncedCount++;
        console.log(`  ✅ ${filePath}`);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`  ❌ ${filePath}: ${err.message}`);
      return false;
    }
  };
  
  // 1. Sync MEMORY.md
  await syncFile("MEMORY.md", "Long-Term Memory (MEMORY.md)", "memory", ["long-term", "memory"]);
  
  // 2. Sync TODO.md
  await syncFile("TODO.md", "TODO & Task Tracker", "document", ["todo", "tasks"]);
  
  // 3. Sync ANAGO_IMPROVEMENTS.md
  await syncFile("memory/ANAGO_IMPROVEMENTS.md", "Anago Self-Assessment", "memory", ["self-assessment", "improvements", "memory"]);
  
  // 4. Sync daily notes for last 30 days
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const monthStr = dateStr.slice(0, 7); // YYYY-MM
    
    const filePath = `memory/${dateStr}.md`;
    
    const success = await syncFile(
      filePath,
      `Daily Note — ${dateStr}`,
      "memory",
      ["daily-note", monthStr, "memory"]
    );
    
    // Stop at first missing file (going backwards from today)
    if (!success && i > 5) {
      // Only stop if we're past the first week (recent files might not exist yet)
      // Actually, continue to check all 30 days since some days might be missing
    }
  }
  
  console.log(`  ✅ ${syncedCount} files synced, ${skippedCount} unchanged`);
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
  await syncUni(state);
  await syncMemoryFiles(state);
  
  state.lastSync = Date.now();
  saveState(state);

  // Fulfill any pending "Sync Now" button requests + update lastFulfilledAt
  try {
    await post("/api/sync/complete", {});
  } catch (e) {
    console.log("  ⚠️ Failed to update sync timestamp:", e.message);
  }

  console.log("\n✅ Sync complete!");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
