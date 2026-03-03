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
    
    // Special Mako detection — runs as standalone scalper process, not an OpenClaw session
    if (agent.agentId === "mako") {
      try {
        const makoProc = run("pgrep -f 'scalper.py' || true").trim();
        if (makoProc) {
          status = "active";
          // Check log recency (correct path)
          try {
            const logPath = "/Users/anago/.openclaw/workspace/projects/polymarket/trading/logs/scalper_stdout.log";
            const logStat = run(`stat -f '%m' ${logPath} 2>/dev/null || true`).trim();
            if (logStat) {
              const logAge = Date.now() - parseInt(logStat) * 1000;
              status = logAge < 300000 ? "active" : "idle"; // active if log updated in last 5 min
            }
          } catch {}
        }
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
    if (line.startsWith("## 🔴")) currentTier = "p0";
    else if (line.startsWith("## 🟡")) currentTier = "p1";
    else if (line.startsWith("## 🟠")) currentTier = "p2";
    else if (line.startsWith("## 🟢")) currentTier = "p3";
    
    // Parse task headers: ### ID. [emoji] Title (ID can be number or alphanumeric like KB-P1-C)
    const taskMatch = line.match(/^###\s+[\w-]+\.\s*([⬜✅🔄❌])\s*(.+)$/);
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

  // Empty string is valid (no trades yet) — only bail on actual null/undefined
  if (raw === null || raw === undefined) {
    console.log("  ⚠️  Could not query Mako DB");
    return;
  }

  const trades = parseJson(raw) || [];
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

  // Re-sync any previously-pending trades that have now resolved.
  // syncMakoTrade is an upsert by tradeId — safe to call repeatedly.
  if (lastSyncedId > 0) {
    const resolvedQuery = `SELECT id, ts, window_start, slug, direction, confidence, score, window_delta, token_price, outcome, pnl, bankroll_after, dry_run FROM scalp_trades WHERE outcome != 'pending' AND id <= ${lastSyncedId} ORDER BY id ASC;`;
    const resolvedRaw = run(`sqlite3 -json "${DB_PATH}" "${resolvedQuery}"`);
    const resolvedTrades = parseJson(resolvedRaw) || [];
    if (resolvedTrades.length > 0) {
      for (const t of resolvedTrades) {
        const betSize = t.token_price >= 0.97 ? 10.00 : 5.00;
        await post("/api/sync/mako-trade", {
          tradeId: String(t.id),
          timestamp: t.ts * 1000,
          windowStart: (t.window_start || 0) * 1000,
          slug: t.slug || "",
          direction: t.direction || "up",
          confidence: t.token_price || 0,
          score: t.score || 0,
          windowDelta: t.window_delta || 0,
          tokenPrice: t.token_price || 0,
          betSize: betSize,
          outcome: t.outcome || "pending",
          pnl: t.pnl || 0,
          bankrollAfter: t.bankroll_after || 0,
          dryRun: t.dry_run === 1 || t.dry_run === true,
        });
      }
      console.log(`  ✅ ${resolvedTrades.length} previously-pending trade(s) updated`);
    }
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
      const logStat = run("stat -f '%m' /Users/anago/.openclaw/workspace/projects/polymarket/trading/logs/scalper_stdout.log 2>/dev/null || true")?.trim();
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

  // Query on-chain USDC balance of proxy wallet
  let walletUsdc = 0;
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
    if (rpcResp?.result) walletUsdc = parseInt(rpcResp.result, 16) / 1e6;
  } catch {}

  // If no trades yet, use bankroll from plist/startup as reported bankroll
  const reportedBankroll = latest?.bankroll_after || walletUsdc || 0;

  await post("/api/sync/mako-status", {
    status: makoStatus,
    mode: makoMode,
    bankroll: reportedBankroll,
    totalPnl: stats?.total_pnl || 0,
    totalTrades,
    winRate: Math.round(winRate * 10) / 10,
    wins,
    losses,
    walletUsdc: Math.round(walletUsdc * 100) / 100,
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

// ─── Sync Uni Kalshi Trading ─────────────────────────────
async function syncUni(state) {
  console.log("\n🪸 Syncing Uni Kalshi trading...");

  const uniDir = resolve(process.env.HOME, ".openclaw/workspace/agents/uni/phase1");
  
  // Default values
  let kalshiBalance = 518.76;
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

  // Read trade_log.csv for additional stats if calibration not present
  const tradeLogPath = resolve(uniDir, "trade_log.csv");
  if (existsSync(tradeLogPath)) {
    try {
      const csvContent = readFileSync(tradeLogPath, "utf-8");
      const lines = csvContent.trim().split("\n").slice(1); // Skip header
      
      if (totalTrades === 0) totalTrades = lines.length;
      
      // Calculate wins and PnL from CSV
      let wins = 0;
      let pnlSum = 0;
      for (const line of lines) {
        const cols = line.split(",");
        if (cols.length > 5) {
          const outcome = cols[5]?.toLowerCase();
          const pnl = parseFloat(cols[6]) || 0;
          if (outcome === "win") wins++;
          pnlSum += pnl;
        }
      }
      
      if (totalTrades > 0) winRate = (wins / totalTrades) * 100;
      if (totalPnl === 0) totalPnl = pnlSum;
    } catch (err) {
      console.log(`  ⚠️  Error reading trade_log.csv: ${err.message}`);
    }
  }

  // Read pending_trade.json for active trade info
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

  // Sync status to Convex — strip undefined/null optional fields (Convex rejects null for optional validators)
  const uniStatusPayload = {
    status,
    kalshiBalance,
    winRate,
    totalTrades,
    totalPnl,
    ...(pendingTrade?.ticker        && { ticker: pendingTrade.ticker }),
    ...(pendingTrade?.release_date  && { releaseDate: pendingTrade.release_date }),
    ...((pendingTrade?.release_date || nextReleaseDate) && { releaseDate: pendingTrade?.release_date || nextReleaseDate }),
    ...(pendingTrade?.direction     && { tradeDirection: pendingTrade.direction }),
    ...(pendingTrade?.entry_price   && { entryPrice: pendingTrade.entry_price }),
    ...(pendingTrade?.bet_size      && { betSize: pendingTrade.bet_size }),
    ...(pendingTrade?.multiplier    && { multiplier: pendingTrade.multiplier }),
    ...(pendingTrade?.signal_summary && { signalSummary: pendingTrade.signal_summary }),
    ...(regime                      && { regime }),
  };
  await post("/api/sync/uni-status", uniStatusPayload);

  console.log(`  ✅ Uni status synced: ${status}, $${kalshiBalance.toFixed(2)} balance, ${totalTrades} trades`);

  // Sync individual trades from CSV
  if (existsSync(tradeLogPath)) {
    try {
      const csvContent = readFileSync(tradeLogPath, "utf-8");
      const lines = csvContent.trim().split("\n").slice(1);
      let syncedTrades = 0;

      for (const line of lines) {
        const cols = line.split(",");
        if (cols.length >= 7) {
          const tradeId = cols[0]?.trim();
          const releaseDate = cols[1]?.trim();
          const ticker = cols[2]?.trim();
          const entryType = cols[3]?.trim();
          const entryPrice = parseFloat(cols[4]) || 0;
          const betSize = parseFloat(cols[5]) || 0;
          const outcome = cols[6]?.trim().toLowerCase() || "pending";
          const pnl = parseFloat(cols[7]) || 0;
          const contracts = Math.round((betSize / entryPrice) * 100) || 0;

          if (tradeId && releaseDate) {
            await post("/api/sync/uni-trade", {
              tradeId,
              releaseDate,
              ticker,
              entryType: entryType === "T14" ? "T-14" : (entryType === "T1" ? "T-1" : entryType),
              entryPrice,
              betSize,
              contracts,
              outcome: outcome === "win" ? "win" : (outcome === "loss" ? "loss" : "pending"),
              pnl: outcome !== "pending" ? pnl : null,
              regime: null,
              executedAt: Date.now(),
            });
            syncedTrades++;
          }
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

  // Fulfill any pending "Sync Now" button requests
  try {
    await post("/api/sync/fulfill-sync-request", {});
  } catch {}

  console.log("\n✅ Sync complete!");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
