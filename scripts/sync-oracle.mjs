#!/usr/bin/env node
/**
 * Sync Oracle trading data → Convex Mission Control
 * 
 * Reads:
 * - ~/.automaton/state.db (turns, status, activity)
 * - ~/.automaton/workspace/trading.db (trades, positions, markets)
 * - ~/.automaton/oracle.log (activity log)
 * - On-chain balances via viem (USDC, ETH)
 * 
 * Syncs: oracle_status, oracle_trades, oracle_positions, oracle_pnl, 
 *        oracle_strategy_performance, oracle_activity_log
 * 
 * Usage: node scripts/sync-oracle.mjs [--dry-run]
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── Config ─────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");

// Oracle wallet address
const ORACLE_WALLET = "0x9E68dCad11854cF3a62A434814540C8C805C99a4";

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

// ─── Database Paths ────────────────────────────────────────
const STATE_DB_PATH = resolve(process.env.HOME, ".automaton/state.db");
const TRADING_DB_PATH = resolve(process.env.HOME, ".automaton/workspace/trading.db");
const ORACLE_LOG_PATH = resolve(process.env.HOME, ".automaton/oracle.log");

// Check if databases exist
if (!existsSync(STATE_DB_PATH)) {
  console.error(`❌ State DB not found: ${STATE_DB_PATH}`);
  process.exit(1);
}

if (!existsSync(TRADING_DB_PATH)) {
  console.error(`❌ Trading DB not found: ${TRADING_DB_PATH}`);
  process.exit(1);
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

// ─── Database Functions ─────────────────────────────────────
// Note: We'll use sqlite3 via exec for now since we can't import it directly
async function querySQLite(dbPath, sql) {
  const { execSync } = await import('child_process');
  try {
    const result = execSync(`sqlite3 ${dbPath} -json "${sql.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result.trim() ? JSON.parse(result) : [];
  } catch (error) {
    console.error(`SQLite query error: ${error.message}`);
    return [];
  }
}

// ─── On-chain Balance Check ────────────────────────────────
async function getWalletBalances() {
  // For now, return placeholder values since viem isn't installed
  // TODO: Implement actual balance checking
  console.log("⚠️  Wallet balance checking requires viem package. Using placeholder values.");
  return {
    ethBalance: 0.1, // Placeholder
    usdcBalance: 1000 // Placeholder
  };
}

// ─── Sync Functions ────────────────────────────────────────
async function syncOracleStatus() {
  console.log("📊 Syncing Oracle status...");
  
  // Get status from state.db
  const turns = await querySQLite(STATE_DB_PATH, 
    "SELECT COUNT(*) as totalTurns FROM turns");
  
  // Get total tokens from all turns
  const tokenUsage = await querySQLite(STATE_DB_PATH,
    "SELECT token_usage FROM turns WHERE token_usage != '{}'");
  
  let totalTokens = 0;
  tokenUsage.forEach(usage => {
    try {
      const parsed = JSON.parse(usage.token_usage);
      totalTokens += parsed.totalTokens || 0;
    } catch (e) {
      // Ignore parse errors
    }
  });
  
  const kv = await querySQLite(STATE_DB_PATH,
    "SELECT value FROM kv WHERE key = 'start_time'");
  
  const startTime = kv[0] ? new Date(kv[0].value).getTime() : Date.now();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  
  // Get latest turn for last activity
  const latestTurn = await querySQLite(STATE_DB_PATH,
    "SELECT timestamp FROM turns ORDER BY timestamp DESC LIMIT 1");
  
  // Get wallet balances
  const balances = await getWalletBalances();
  
  const statusData = {
    agentId: "oracle",
    status: "running", // TODO: Determine from heartbeat or last activity
    model: "claude-sonnet-4-6", // Default, could be read from config
    uptimeSeconds,
    totalTurns: turns[0]?.totalTurns || 0,
    totalTokens,
    usdcBalance: balances.usdcBalance,
    ethBalance: balances.ethBalance,
    lastActivityTimestamp: latestTurn[0] ? new Date(latestTurn[0].timestamp).getTime() : Date.now(),
  };
  
  await post("/syncOracleStatus", statusData);
  console.log("  ✅ Oracle status synced");
}

async function syncOracleTrades() {
  console.log("💱 Syncing Oracle trades...");
  
  const trades = await querySQLite(TRADING_DB_PATH, `
    SELECT 
      t.trade_id as tradeId,
      t.market_id as marketId,
      m.question as marketQuestion,
      t.outcome,
      t.side,
      t.price,
      t.quantity,
      t.amount_usd as amountUsd,
      t.strategy,
      t.pnl,
      t.closed,
      strftime('%s', t.timestamp) * 1000 as timestamp,
      CASE WHEN t.closed_at IS NOT NULL THEN strftime('%s', t.closed_at) * 1000 ELSE NULL END as closedAt,
      t.stop_loss_price as stopLossPrice,
      t.notes
    FROM trades t
    LEFT JOIN markets m ON t.market_id = m.market_id
    ORDER BY t.timestamp DESC
    LIMIT 100
  `);
  
  for (const trade of trades) {
    await post("/syncOracleTrade", {
      ...trade,
      timestamp: parseInt(trade.timestamp),
      closedAt: trade.closedAt ? parseInt(trade.closedAt) : undefined,
      stopLossPrice: trade.stopLossPrice || undefined,
      notes: trade.notes || undefined
    });
  }
  
  console.log(`  ✅ ${trades.length} trades synced`);
}

async function syncOpenPositions() {
  console.log("📈 Syncing open positions...");
  
  const openTrades = await querySQLite(TRADING_DB_PATH, `
    SELECT 
      t.trade_id as positionId,
      t.market_id as marketId,
      m.question as marketQuestion,
      t.outcome,
      t.price as entryPrice,
      -- TODO: Get current price from market_prices table
      t.price as currentPrice,
      0 as unrealizedPnl, -- TODO: Calculate based on current price
      t.amount_usd as positionSizeUsd,
      t.strategy,
      (strftime('%s', 'now') - strftime('%s', t.timestamp)) as timeHeldSeconds,
      strftime('%s', t.timestamp) * 1000 as timestamp
    FROM trades t
    LEFT JOIN markets m ON t.market_id = m.market_id
    WHERE t.closed = 0
    ORDER BY t.timestamp DESC
  `);
  
  for (const position of openTrades) {
    await post("/syncOraclePosition", {
      ...position,
      timestamp: parseInt(position.timestamp),
      timeHeldSeconds: parseInt(position.timeHeldSeconds),
      unrealizedPnl: 0 // TODO: Implement price lookup
    });
  }
  
  console.log(`  ✅ ${openTrades.length} open positions synced`);
}

async function syncPnlData() {
  console.log("💰 Syncing P&L data...");
  
  // Calculate today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Get total realized P&L (closed trades)
  const realizedPnlResult = await querySQLite(TRADING_DB_PATH, `
    SELECT 
      SUM(pnl) as totalRealizedPnl,
      COUNT(*) as totalTrades,
      SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winningTrades
    FROM trades 
    WHERE closed = 1
  `);
  
  // Get today's P&L
  const todayPnlResult = await querySQLite(TRADING_DB_PATH, `
    SELECT 
      SUM(pnl) as todaysPnl
    FROM trades 
    WHERE closed = 1 
      AND date(timestamp) = date('now')
  `);
  
  // Get unrealized P&L (open positions)
  const unrealizedPnlResult = await querySQLite(TRADING_DB_PATH, `
    SELECT 
      SUM(0) as unrealizedPnl -- TODO: Calculate based on current prices
    FROM trades 
    WHERE closed = 0
  `);
  
  const realizedPnl = realizedPnlResult[0] || { totalRealizedPnl: 0, totalTrades: 0, winningTrades: 0 };
  const todayPnl = todayPnlResult[0] || { todaysPnl: 0 };
  const unrealizedPnl = unrealizedPnlResult[0] || { unrealizedPnl: 0 };
  
  const winRate = realizedPnl.totalTrades > 0 
    ? (realizedPnl.winningTrades / realizedPnl.totalTrades) * 100 
    : 0;
  
  // TODO: Get starting capital for ROI calculation
  const startingCapital = 1000; // Placeholder
  const roiPercent = startingCapital > 0 
    ? (realizedPnl.totalRealizedPnl / startingCapital) * 100 
    : 0;
  
  await post("/syncOraclePnl", {
    date: today,
    totalRealizedPnl: realizedPnl.totalRealizedPnl || 0,
    todaysPnl: todayPnl.todaysPnl || 0,
    unrealizedPnl: unrealizedPnl.unrealizedPnl || 0,
    winRate,
    roiPercent,
    totalTrades: realizedPnl.totalTrades || 0,
    winningTrades: realizedPnl.winningTrades || 0
  });
  
  console.log("  ✅ P&L data synced");
}

async function syncStrategyPerformance() {
  console.log("🎯 Syncing strategy performance...");
  
  const strategyPerf = await querySQLite(TRADING_DB_PATH, `
    SELECT 
      strategy,
      total_trades as totalTrades,
      winning_trades as winningTrades,
      total_pnl as totalPnl,
      win_rate as winRate
    FROM strategy_performance
  `);
  
  for (const strategy of strategyPerf) {
    const avgPnlPerTrade = strategy.totalTrades > 0 
      ? strategy.totalPnl / strategy.totalTrades 
      : 0;
    
    await post("/syncOracleStrategyPerformance", {
      strategy: strategy.strategy,
      totalTrades: strategy.totalTrades,
      winningTrades: strategy.winningTrades,
      totalPnl: strategy.totalPnl,
      winRate: strategy.winRate * 100, // Convert to percentage
      avgPnlPerTrade
    });
  }
  
  console.log(`  ✅ ${strategyPerf.length} strategies synced`);
}

async function syncActivityLog() {
  console.log("📝 Syncing activity log...");
  
  // Get recent turns from state.db
  const turns = await querySQLite(STATE_DB_PATH, `
    SELECT 
      id as turnId,
      state as status,
      input as prompt,
      tool_calls as toolCalls,
      token_usage as tokenUsage,
      strftime('%s', timestamp) * 1000 as timestamp
    FROM turns 
    ORDER BY timestamp DESC 
    LIMIT 50
  `);
  
  for (const turn of turns) {
    // Parse JSON fields if they exist
    let toolCalls, tokenUsage;
    try {
      toolCalls = turn.toolCalls ? JSON.parse(turn.toolCalls) : undefined;
    } catch (e) {
      toolCalls = undefined;
    }
    
    try {
      tokenUsage = turn.tokenUsage ? JSON.parse(turn.tokenUsage) : undefined;
    } catch (e) {
      tokenUsage = undefined;
    }
    
    await post("/syncOracleActivityLog", {
      turnId: turn.turnId,
      agentId: "oracle",
      status: turn.status,
      prompt: turn.prompt || undefined,
      toolCalls,
      tokenUsage,
      durationMs: 0, // Not available in schema
      timestamp: parseInt(turn.timestamp)
    });
  }
  
  console.log(`  ✅ ${turns.length} activity logs synced`);
}

// ─── Main ──────────────────────────────────────────────────
async function main() {
  console.log("🚀 Starting Oracle sync...");
  
  try {
    await syncOracleStatus();
    await syncOracleTrades();
    await syncOpenPositions();
    await syncPnlData();
    await syncStrategyPerformance();
    await syncActivityLog();
    
    console.log("✅ Oracle sync completed!");
  } catch (error) {
    console.error(`❌ Sync failed: ${error.message}`);
    process.exit(1);
  }
}

main();