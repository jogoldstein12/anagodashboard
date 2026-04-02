#!/usr/bin/env node
/**
 * Sync Hamachi weather trading data → Convex Mission Control
 *
 * Reads:
 * - hamachi_risk_state.json (bankroll, deployed, halt status)
 * - paper_trades.csv (trade history)
 * - signals.csv (scanner signals)
 * - scanner.log (process liveness)
 *
 * Usage: node scripts/sync-hamachi.mjs [--dry-run]
 */

import { execSync } from "child_process";
import { readFileSync, existsSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Data Paths ─────────────────────────────────────────────
const WEATHER_ROOT = resolve(process.env.HOME, ".openclaw/workspace/agents/weather");
const RISK_STATE_PATH = resolve(process.env.HOME, ".openclaw/workspace/state/hamachi_risk_state.json");
const SCANNER_LOG = resolve(WEATHER_ROOT, "logs/scanner.log");
const PAPER_TRADES_CSV = resolve(WEATHER_ROOT, "logs/paper_trades.csv");
const EXITS_CSV = resolve(WEATHER_ROOT, "logs/exits.csv");
const SIGNALS_CSV = resolve(WEATHER_ROOT, "logs/signals.csv");

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

// ─── Helpers ────────────────────────────────────────────────
async function post(path, body) {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] POST ${path}`, JSON.stringify(body).slice(0, 300));
    return { ok: true };
  }
  const url = `${SITE_URL}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SYNC_SECRET}`,
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

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function parseCsv(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8").trim();
    if (!content) return [];
    const lines = content.split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim());
      const row = {};
      headers.forEach((h, i) => {
        row[h] = vals[i] || "";
      });
      return row;
    });
  } catch {
    return [];
  }
}

function isProcessRunning() {
  try {
    execSync('pgrep -f "scanner.runner"', { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function isScannerActive() {
  // Check process first, then fall back to log recency
  if (isProcessRunning()) return true;
  try {
    const stat = statSync(SCANNER_LOG);
    const age = Date.now() - stat.mtimeMs;
    return age < 120000; // active if log written in last 2 min
  } catch {
    return false;
  }
}

// ─── Load combined trade data from both CSV sources ───────
// exits.csv = Phase 2 live exits (deduplicated by ticker+direction)
// paper_trades.csv = Phase 1 settled trades (settled=True rows)
function loadAllCompletedTrades() {
  const completed = [];

  // Phase 1: paper_trades.csv (settled=True, has settlement_outcome)
  const paperTrades = parseCsv(PAPER_TRADES_CSV);
  for (const t of paperTrades) {
    if (t.settled === "True" && t.settlement_outcome && t.settlement_outcome !== "") {
      // Determine win: BUY_YES wins if outcome=YES, BUY_NO wins if outcome=NO
      const isWin = (t.direction === "BUY_YES" && t.settlement_outcome === "YES") ||
                    (t.direction === "BUY_NO" && t.settlement_outcome === "NO");
      const n = parseInt(t.contracts || "0");
      let pnlDollar;
      if (t.pnl_dollar_taker !== "" && t.pnl_dollar_taker != null) {
        const d = parseFloat(t.pnl_dollar_taker);
        pnlDollar = Math.abs(d) > 0.001 ? d : parseFloat(t.pnl_net_taker || "0");
      } else if (n > 1 && t.pnl_net_taker !== "") {
        pnlDollar = parseFloat(t.pnl_net_taker) * n;
      } else {
        pnlDollar = parseFloat(t.pnl_net_taker || "0");
      }
      completed.push({
        source: "paper",
        timestamp: t.timestamp,
        date: t.date,
        ticker: t.ticker,
        city: t.city || "",
        direction: t.direction,
        entryPrice: parseFloat(t.entry_price_maker) || 0,
        exitPrice: undefined,
        contracts: n || 1,
        modelProb: parseFloat(t.model_prob) || 0,
        strike: parseFloat(t.strike) || 0,
        outcome: isWin ? "win" : "loss",
        pnlDollar,
      });
    }
  }

  // Phase 2: exits.csv — deduplicate by ticker+direction (same position exited multiple times)
  const exitRows = parseCsv(EXITS_CSV);
  const seenExits = new Set();
  for (const t of exitRows) {
    const key = `${t.ticker}_${t.direction}`;
    if (seenExits.has(key)) continue;
    seenExits.add(key);
    const n = parseInt(t.contracts || "1");
    const pnlDollar = parseFloat(t.pnl_net || "0");
    // exits.csv has no outcome — determine from pnl_net sign
    // positive = win, negative = loss
    const outcome = pnlDollar >= 0 ? "win" : "loss";
    // Extract city from ticker: KXHIGHCHI → CHI, KXHIGHDEN → DEN, etc.
    const cityMatch = t.ticker.match(/KXHIGH([A-Z]+)-/);
    const city = cityMatch ? cityMatch[1] : "";
    // Extract date from ticker: KXHIGHCHI-26APR03-T60 → 2026-04-03
    const dateMatch = t.ticker.match(/-26(\w{3})(\d{2})-/);
    let contractDate = t.timestamp ? t.timestamp.slice(0, 10) : "";
    if (dateMatch) {
      const months = {JAN:"01",FEB:"02",MAR:"03",APR:"04",MAY:"05",JUN:"06",JUL:"07",AUG:"08",SEP:"09",OCT:"10",NOV:"11",DEC:"12"};
      contractDate = `2026-${months[dateMatch[1]] || "00"}-${dateMatch[2]}`;
    }
    // Extract strike from ticker: KXHIGHCHI-26APR03-T60 → 60
    const strikeMatch = t.ticker.match(/-T(\d+)$/);
    const strike = strikeMatch ? parseInt(strikeMatch[1]) : 0;
    completed.push({
      source: "exits",
      timestamp: t.timestamp,
      date: contractDate,
      ticker: t.ticker,
      city,
      direction: t.direction,
      entryPrice: parseFloat(t.entry_price) || 0,
      exitPrice: parseFloat(t.exit_price) || 0,
      contracts: n,
      modelProb: 0,
      strike,
      outcome,
      pnlDollar,
    });
  }

  // Sort by timestamp ascending
  completed.sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""));
  return completed;
}

// ─── Sync Functions ─────────────────────────────────────────

async function fetchKalshiBalance() {
  try {
    const { execSync } = await import("child_process");
    const scriptPath = resolve(__dirname, "kalshi_balance.py");
    const result = execSync(`python3 ${scriptPath}`, { encoding: "utf-8", timeout: 10000 });
    const data = JSON.parse(result.trim());
    return {
      cash: (data.balance || 0) / 100,
      portfolioValue: (data.portfolio_value || 0) / 100,
    };
  } catch (e) {
    console.log("  ⚠️  Could not fetch Kalshi balance:", e.message?.slice(0, 80));
    return null;
  }
}

async function syncHamachiStatus() {
  console.log("🌤️  Syncing Hamachi status...");

  const riskState = readJson(RISK_STATE_PATH);
  if (!riskState) {
    console.log("  ⚠️  Risk state not found at", RISK_STATE_PATH);
    return;
  }

  // Fetch live Kalshi balance (cash only, excludes open positions)
  const kalshiBalance = await fetchKalshiBalance();
  const liveCash = kalshiBalance?.cash ?? riskState.bankroll ?? 0;
  const openPositionsValue = kalshiBalance?.portfolioValue ?? 0;

  const running = isScannerActive();
  const completedTrades = loadAllCompletedTrades();

  const wins = completedTrades.filter((t) => t.outcome === "win").length;
  const totalTrades = completedTrades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const totalPnl = completedTrades.reduce((sum, t) => sum + t.pnlDollar, 0);

  const lastTrade = completedTrades.length > 0 ? completedTrades[completedTrades.length - 1] : null;
  const lastTradeAt = lastTrade?.timestamp ? new Date(lastTrade.timestamp).getTime() : undefined;

  const today = new Date().toISOString().split("T")[0];
  const todayTrades = completedTrades.filter((t) => t.date === today);
  const dailyPnl = todayTrades.reduce((sum, t) => sum + t.pnlDollar, 0);

  const status = running
    ? riskState.daily_loss_halted
      ? "halted"
      : "live"
    : "stopped";

  const payload = {
    status,
    // Use live Kalshi cash balance — single source of truth
    bankroll: liveCash,
    deployed: openPositionsValue,
    peakBankroll: Math.max(riskState.peak_bankroll ?? 0, liveCash + openPositionsValue),
    dailyPnl: Math.round(dailyPnl * 100) / 100 || riskState.daily_realized_pnl || 0,
    totalPnl: Math.round(totalPnl * 100) / 100,
    openPositions: typeof riskState.open_positions === "object" ? Object.keys(riskState.open_positions).length : (riskState.open_positions ?? 0),
    totalTrades,
    wins,
    winRate: Math.round(winRate * 10) / 10,
    dailyLossHalted: riskState.daily_loss_halted ?? false,
    lastTradeAt,
  };

  console.log(`  Status: ${status} | Kalshi Cash: $${liveCash.toFixed(2)} | Open Positions: $${openPositionsValue.toFixed(2)}`);
  console.log(`  Trades: ${totalTrades} (${payload.openPositions} open) | P&L: $${payload.totalPnl.toFixed(2)} | Win Rate: ${payload.winRate.toFixed(1)}%`);

  await post("/api/sync/hamachi-status", payload);
}

async function syncHamachiTrades() {
  console.log("📈 Syncing Hamachi trades...");

  const allTrades = loadAllCompletedTrades();
  if (allTrades.length === 0) {
    console.log("  No trades found");
    return;
  }

  const recent = allTrades.slice(-100);
  console.log(`  Found ${allTrades.length} completed trades, syncing ${recent.length}`);

  // Clear stale records first
  const clearResult = await post("/api/sync/hamachi-clear-trades", {});
  if (clearResult?.deleted > 0) {
    console.log(`  Cleared ${clearResult.deleted} stale trade records`);
  }

  for (let i = 0; i < recent.length; i++) {
    const t = recent[i];
    const ts = t.timestamp ? new Date(t.timestamp).getTime() : Date.now();
    const tradeId = `${t.ticker}-${t.direction}-${t.source}-${t.timestamp ? t.timestamp.replace(/[^0-9]/g,'').slice(0,12) : i}`;

    await post("/api/sync/hamachi-trade", {
      tradeId,
      ts,
      city: t.city,
      ticker: t.ticker,
      strike: t.strike,
      direction: t.direction,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      modelProb: t.modelProb,
      outcome: t.outcome,
      pnlNet: t.pnlDollar,
      live: true,
      contractDate: t.date,
    });
  }
}

async function syncHamachiPnl() {
  console.log("📅 Syncing Hamachi daily P&L...");

  const completedTrades = loadAllCompletedTrades();

  // Group by contract date
  const byDate = {};
  for (const t of completedTrades) {
    const date = t.date;
    if (!date) continue;
    if (!byDate[date]) byDate[date] = { trades: 0, wins: 0, pnl: 0 };
    byDate[date].trades++;
    if (t.outcome === "win") byDate[date].wins++;
    byDate[date].pnl += t.pnlDollar;
  }

  const riskState = readJson(RISK_STATE_PATH);
  const bankroll = riskState?.bankroll ?? 0;

  const dates = Object.keys(byDate).sort().slice(-60);
  console.log(`  Found ${dates.length} daily P&L rows`);

  for (const date of dates) {
    const d = byDate[date];
    await post("/api/sync/hamachi-pnl", {
      date,
      trades: d.trades,
      wins: d.wins,
      pnl: Math.round(d.pnl * 100) / 100,
      bankrollClose: bankroll,
    });
  }
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log(`\n🌤️  Hamachi Weather Sync ${DRY_RUN ? "(DRY RUN)" : ""}`);
  console.log(`   Risk State: ${RISK_STATE_PATH}`);
  console.log(`   Trades: ${PAPER_TRADES_CSV}`);
  console.log(`   Target: ${SITE_URL}\n`);

  await syncHamachiStatus();
  await syncHamachiTrades();
  await syncHamachiPnl();

  console.log("\n✅ Hamachi sync complete.\n");
}

main().catch((err) => {
  console.error("❌ Hamachi sync failed:", err);
  process.exit(1);
});
