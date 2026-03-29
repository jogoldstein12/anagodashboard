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
  const trades = parseCsv(PAPER_TRADES_CSV);

  // Only count live trades (settled="True" = was a real Kalshi order)
  const liveTrades = trades.filter((t) => t.settled === "True");
  // CSV column: settlement_outcome = "YES" | "NO" | "" (empty = open/pending)
  const completedTrades = liveTrades.filter((t) => t.settlement_outcome && t.settlement_outcome !== "");

  function isWin(t) {
    const dir = t.direction; // "BUY_YES" or "BUY_NO"
    const outcome = t.settlement_outcome; // "YES" or "NO"
    return (dir === "BUY_YES" && outcome === "YES") || (dir === "BUY_NO" && outcome === "NO");
  }

  const wins = completedTrades.filter(isWin).length;
  const totalTrades = completedTrades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  // Dollar P&L: use pnl_dollar_taker (contracts × per-contract net) when available
  // Skip rows with no contracts (Mar 24 test trades before position sizing was tracked)
  function tradeDollarPnl(t) {
    const n = parseInt(t.contracts || "0");
    if (n === 0) return 0; // no contract count = can't compute dollar P&L
    if (t.pnl_dollar_taker !== "" && t.pnl_dollar_taker != null) {
      return parseFloat(t.pnl_dollar_taker);
    }
    if (t.pnl_dollar_maker !== "" && t.pnl_dollar_maker != null) {
      return parseFloat(t.pnl_dollar_maker);
    }
    return 0;
  }

  const totalPnl = completedTrades.reduce((sum, t) => sum + tradeDollarPnl(t), 0);

  // Last trade timestamp
  const lastTrade = trades.length > 0 ? trades[trades.length - 1] : null;
  const lastTradeAt = lastTrade?.timestamp
    ? new Date(lastTrade.timestamp).getTime()
    : undefined;

  // Today's P&L — use contract date, not timestamp
  const today = new Date().toISOString().split("T")[0];
  const todayTrades = completedTrades.filter((t) => t.date === today);
  const dailyPnl = todayTrades.reduce((sum, t) => sum + tradeDollarPnl(t), 0);

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
    openPositions: riskState.open_positions ?? 0,
    totalTrades,
    wins,
    winRate: Math.round(winRate * 10) / 10,
    dailyLossHalted: riskState.daily_loss_halted ?? false,
    lastTradeAt,
  };

  console.log(`  Status: ${status} | Kalshi Cash: $${liveCash.toFixed(2)} | Open Positions: $${openPositionsValue.toFixed(2)}`);
  console.log(`  Trades: ${totalTrades} (${riskState.open_positions ?? 0} open) | P&L: $${payload.totalPnl.toFixed(2)} | Win Rate: ${payload.winRate.toFixed(1)}%`);

  await post("/api/sync/hamachi-status", payload);
}

async function syncHamachiTrades() {
  console.log("📈 Syncing Hamachi trades...");

  const trades = parseCsv(PAPER_TRADES_CSV);
  if (trades.length === 0) {
    console.log("  No trades found");
    return;
  }

  // Only sync live trades (real Kalshi orders)
  const liveTrades = trades.filter((t) => t.settled === "True");
  const recent = liveTrades.slice(-100);
  console.log(`  Found ${trades.length} total trades (${liveTrades.length} live), syncing ${recent.length}`);

  // Clear all existing trade records first to prevent duplicates from old tradeId formats
  const clearResult = await post("/api/sync/hamachi-clear-trades", {});
  if (clearResult?.deleted > 0) {
    console.log(`  Cleared ${clearResult.deleted} stale trade records`);
  }

  for (let i = 0; i < recent.length; i++) {
    const t = recent[i];
    const ts = t.timestamp ? new Date(t.timestamp).getTime() : Date.now();

    // Determine outcome string: "win" | "loss" | undefined (open)
    let outcome;
    if (t.settlement_outcome) {
      const dir = t.direction;
      const so = t.settlement_outcome;
      outcome = (dir === "BUY_YES" && so === "YES") || (dir === "BUY_NO" && so === "NO") ? "win" : "loss";
    }

    await post("/api/sync/hamachi-trade", {
      tradeId: `${t.ticker}-${t.direction}-${t.timestamp ? t.timestamp.replace(/[^0-9]/g,'').slice(0,12) : i}`,
      ts,
      city: t.city || "",
      ticker: t.ticker || "",
      strike: parseFloat(t.strike) || 0,
      direction: t.direction || "",
      entryPrice: parseFloat(t.entry_price_maker) || 0,
      exitPrice: undefined, // Hamachi doesn't have explicit exit price
      modelProb: parseFloat(t.model_prob) || 0,
      outcome,
      // pnlNet = total dollar P&L; skip rows with no contract count (pre-tracking test trades)
      pnlNet: (() => {
        const n = parseInt(t.contracts || "0");
        if (n === 0) return undefined;
        if (t.pnl_dollar_taker !== "" && t.pnl_dollar_taker != null) return parseFloat(t.pnl_dollar_taker);
        if (t.pnl_dollar_maker !== "" && t.pnl_dollar_maker != null) return parseFloat(t.pnl_dollar_maker);
        return undefined;
      })(),
      live: t.settled === "True",
      contractDate: t.date || "",
    });
  }
}

async function syncHamachiPnl() {
  console.log("📅 Syncing Hamachi daily P&L...");

  const trades = parseCsv(PAPER_TRADES_CSV);
  const liveTrades2 = trades.filter((t) => t.settled === "True");
  const completedTrades = liveTrades2.filter((t) => t.settlement_outcome && t.settlement_outcome !== "");

  function tradeDollarPnl2(t) {
    const n = parseInt(t.contracts || "0");
    if (n === 0) return 0;
    if (t.pnl_dollar_taker !== "" && t.pnl_dollar_taker != null) return parseFloat(t.pnl_dollar_taker);
    if (t.pnl_dollar_maker !== "" && t.pnl_dollar_maker != null) return parseFloat(t.pnl_dollar_maker);
    return 0;
  }

  function isWinPnl(t) {
    const dir = t.direction;
    const so = t.settlement_outcome;
    return (dir === "BUY_YES" && so === "YES") || (dir === "BUY_NO" && so === "NO");
  }

  // Group by contract date
  const byDate = {};
  for (const t of completedTrades) {
    const date = t.date;
    if (!date) continue;
    if (!byDate[date]) byDate[date] = { trades: 0, wins: 0, pnl: 0 };
    byDate[date].trades++;
    if (isWinPnl(t)) byDate[date].wins++;
    byDate[date].pnl += tradeDollarPnl2(t);
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
