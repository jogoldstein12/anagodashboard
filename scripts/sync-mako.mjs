#!/usr/bin/env node
/**
 * Sync Mako v2 trading data → Convex Mission Control
 *
 * Reads:
 * - mako_v2.db (trades, risk_events, mm_inventory)
 * - risk_state.json (bankroll, drawdown, halt status)
 * - mako_v2.pid (process liveness)
 * - Polymarket CLOB balance (via python3)
 * - Kalshi balance (via python3)
 *
 * Usage: node scripts/sync-mako.mjs [--dry-run]
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Data Paths ─────────────────────────────────────────────
const MAKO_ROOT = resolve(process.env.HOME, ".openclaw/workspace/projects/polymarket/mako_v2");
const DB_PATH = resolve(MAKO_ROOT, "data/mako_v2.db");
const RISK_STATE_PATH = resolve(MAKO_ROOT, "data/risk_state.json");
const MARKET_PAIRS_PATH = resolve(MAKO_ROOT, "data/market_pairs.json");
const PID_FILE = resolve(MAKO_ROOT, "logs/mako_v2.pid");

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

if (!existsSync(DB_PATH)) {
  console.error(`❌ Mako v2 DB not found: ${DB_PATH}`);
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

function querySQLite(sql) {
  try {
    const result = execSync(
      `sqlite3 "${DB_PATH}" -json "${sql.replace(/"/g, '\\"')}"`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    return result.trim() ? JSON.parse(result) : [];
  } catch (error) {
    console.error(`  SQLite error: ${error.message}`);
    return [];
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function isProcessRunning() {
  try {
    if (!existsSync(PID_FILE)) return false;
    const pid = readFileSync(PID_FILE, "utf-8").trim();
    if (!pid) return false;
    execSync(`ps -p ${pid}`, { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

function getPolyBalance() {
  try {
    const result = execSync(
      `python3 -c "
import sys, json
sys.path.insert(0, '${resolve(process.env.HOME, ".openclaw/workspace/projects/polymarket/mako_v2")}')
sys.path.insert(0, '${resolve(process.env.HOME, ".openclaw/workspace/projects/polymarket/trading")}')
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import BalanceAllowanceParams, AssetType
wallet = json.loads(open('${resolve(process.env.HOME, ".openclaw/workspace/projects/polymarket/trading/wallet.json")}').read())
PROXY = '0xC6EEEDF1AEAC0ab054CEd5b327566b12b7f4DdeC'
clob = ClobClient(host='https://clob.polymarket.com', chain_id=137, key=wallet['privateKey'], signature_type=2, funder=PROXY)
creds = clob.create_or_derive_api_creds()
clob.set_api_creds(creds)
params = BalanceAllowanceParams(asset_type=AssetType.COLLATERAL, signature_type=2)
bal = clob.get_balance_allowance(params=params)
print(int(bal['balance'])/1e6)
" 2>/dev/null`,
      { encoding: "utf-8", timeout: 30000 }
    );
    return parseFloat(result.trim()) || 0;
  } catch (err) {
    console.error("  ⚠️  Failed to get Poly balance:", err.message);
    return 0;
  }
}

function getKalshiBalance() {
  try {
    const result = execSync(
      `python3 -c "
import sys
sys.path.insert(0, '${resolve(process.env.HOME, ".openclaw/workspace/projects/polymarket/mako_v2")}')
from clients.kalshi import KalshiClient
k = KalshiClient()
print(k.get_balance())
" 2>/dev/null`,
      { encoding: "utf-8", timeout: 30000 }
    );
    return parseFloat(result.trim()) || 0;
  } catch (err) {
    console.error("  ⚠️  Failed to get Kalshi balance:", err.message);
    return 0;
  }
}

// ─── Sync Functions ─────────────────────────────────────────

async function syncMakoStatus() {
  console.log("📊 Syncing Mako status...");

  const riskState = readJson(RISK_STATE_PATH);
  const running = isProcessRunning();

  // Trade aggregates from DB
  const countRows = querySQLite("SELECT status, COUNT(*) as cnt FROM trades GROUP BY status");
  const statusCounts = {};
  for (const row of countRows) statusCounts[row.status] = row.cnt;

  const totalTrades = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const openPositions = statusCounts["open"] || 0;

  // Win rate from closed trades only
  const closedTrades = querySQLite(
    "SELECT COUNT(*) as total, SUM(CASE WHEN actual_profit_cents > 0 THEN 1 ELSE 0 END) as wins FROM trades WHERE status='closed'"
  );
  const closedTotal = closedTrades[0]?.total || 0;
  const wins = closedTrades[0]?.wins || 0;
  const winRate = closedTotal > 0 ? (wins / closedTotal) * 100 : 0;

  // Total P&L from closed trades
  const pnlRow = querySQLite(
    "SELECT COALESCE(SUM(actual_profit_cents), 0) as total_cents FROM trades WHERE status='closed'"
  );
  const totalPnlCents = pnlRow[0]?.total_cents || 0;

  // Daily P&L
  const todayPnl = querySQLite(
    "SELECT COALESCE(SUM(actual_profit_cents), 0) as cents FROM trades WHERE status='closed' AND date(ts, 'unixepoch', 'localtime') = date('now', 'localtime')"
  );
  const dailyPnlCents = todayPnl[0]?.cents || 0;

  // Last trade timestamp
  const lastTradeRow = querySQLite("SELECT MAX(ts) as last_ts FROM trades");
  const lastTradeTs = lastTradeRow[0]?.last_ts || null;

  // Balances
  const polyBalance = getPolyBalance();
  const kalshiBalance = getKalshiBalance();

  let status = "stopped";
  if (running) {
    status = riskState?.daily_halted || riskState?.all_halted ? "stopped" : "live";
  }

  const bankroll = riskState?.bankroll ?? 0;
  const peakBankroll = riskState?.peak_bankroll ?? bankroll;
  const drawdownPct = peakBankroll > 0 ? ((peakBankroll - bankroll) / peakBankroll) * 100 : 0;

  const payload = {
    status,
    polyBalance,
    kalshiBalance,
    bankroll,
    peakBankroll,
    drawdownPct: Math.round(drawdownPct * 100) / 100,
    dailyPnl: dailyPnlCents / 100,
    totalPnl: totalPnlCents / 100,
    totalTrades,
    openPositions,
    winRate: Math.round(winRate * 10) / 10,
    lastTradeAt: lastTradeTs ? lastTradeTs * 1000 : undefined,
  };

  console.log(`  Status: ${status} | Bankroll: $${bankroll} | Poly: $${polyBalance.toFixed(2)} | Kalshi: $${kalshiBalance.toFixed(2)}`);
  console.log(`  Trades: ${totalTrades} (${openPositions} open) | P&L: $${(totalPnlCents / 100).toFixed(2)} | Win Rate: ${winRate.toFixed(1)}%`);

  await post("/api/sync/mako-status", payload);
}

async function syncMakoTrades() {
  console.log("📈 Syncing Mako trades (last 100)...");

  const trades = querySQLite(
    "SELECT * FROM trades ORDER BY ts DESC LIMIT 100"
  );

  console.log(`  Found ${trades.length} trades to sync`);

  for (const t of trades) {
    await post("/api/sync/mako-trade", {
      tradeId: String(t.id),
      ts: t.ts * 1000,
      strategy: t.strategy,
      eventId: t.event_id || "",
      legAPlatform: t.leg_a_platform,
      legAMarket: t.leg_a_market,
      legASide: t.leg_a_side,
      legAPrice: t.leg_a_price,
      legAContracts: t.leg_a_contracts,
      legAStatus: t.leg_a_status || "unknown",
      legBPlatform: t.leg_b_platform || undefined,
      legBMarket: t.leg_b_market || undefined,
      legBSide: t.leg_b_side || undefined,
      legBPrice: t.leg_b_price || undefined,
      legBContracts: t.leg_b_contracts || undefined,
      legBStatus: t.leg_b_status || undefined,
      expectedProfitCents: t.expected_profit_cents || undefined,
      actualProfitCents: t.actual_profit_cents || undefined,
      status: t.status,
      resolutionDate: t.resolution_date || undefined,
      notes: t.notes || undefined,
      dryRun: false,
    });
  }
}

async function syncMakoPnl() {
  console.log("📅 Syncing Mako daily P&L...");

  const rows = querySQLite(`
    SELECT
      date(ts, 'unixepoch', 'localtime') as day,
      COUNT(*) as trades,
      SUM(CASE WHEN actual_profit_cents > 0 THEN 1 ELSE 0 END) as wins,
      COALESCE(SUM(actual_profit_cents), 0) as pnl_cents
    FROM trades
    WHERE status = 'closed'
    GROUP BY date(ts, 'unixepoch', 'localtime')
    ORDER BY day DESC
    LIMIT 60
  `);

  console.log(`  Found ${rows.length} daily P&L rows`);

  const riskState = readJson(RISK_STATE_PATH);
  const bankroll = riskState?.bankroll ?? 0;

  for (const row of rows) {
    await post("/api/sync/mako-pnl", {
      date: row.day,
      trades: row.trades,
      wins: row.wins,
      pnlCents: row.pnl_cents,
      bankrollClose: bankroll,
    });
  }
}

async function syncMakoRiskEvents() {
  console.log("⚠️  Syncing Mako risk events...");

  const events = querySQLite(
    "SELECT * FROM risk_events ORDER BY ts DESC LIMIT 50"
  );

  console.log(`  Found ${events.length} risk events`);

  for (const e of events) {
    await post("/api/sync/mako-risk-event", {
      ts: e.ts * 1000,
      eventType: e.event_type,
      bankroll: e.bankroll || 0,
      dailyPnl: e.daily_pnl || 0,
      notes: e.notes || undefined,
    });
  }
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log(`\n🦈 Mako v2 Sync ${DRY_RUN ? "(DRY RUN)" : ""}`);
  console.log(`   DB: ${DB_PATH}`);
  console.log(`   Target: ${SITE_URL}\n`);

  await syncMakoStatus();
  await syncMakoTrades();
  await syncMakoPnl();
  await syncMakoRiskEvents();

  console.log("\n✅ Mako v2 sync complete.\n");
}

main().catch((err) => {
  console.error("❌ Mako sync failed:", err);
  process.exit(1);
});
