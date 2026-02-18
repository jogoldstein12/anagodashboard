// @ts-nocheck
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const syncOracleStatus = internalMutation({
  args: {
    agentId: v.string(),
    status: v.string(),
    model: v.string(),
    uptimeSeconds: v.number(),
    totalTurns: v.number(),
    totalTokens: v.number(),
    usdcBalance: v.number(),
    ethBalance: v.number(),
    lastActivityTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("oracle_status")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    const data = {
      ...args,
      lastSyncTimestamp: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("oracle_status", data);
    }
  },
});

export const syncOracleTrade = internalMutation({
  args: {
    tradeId: v.string(),
    marketId: v.string(),
    marketQuestion: v.string(),
    outcome: v.string(),
    side: v.string(),
    price: v.number(),
    quantity: v.number(),
    amountUsd: v.number(),
    strategy: v.string(),
    pnl: v.number(),
    closed: v.boolean(),
    timestamp: v.number(),
    closedAt: v.optional(v.number()),
    stopLossPrice: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("oracle_trades")
      .withIndex("by_tradeId", (q) => q.eq("tradeId", args.tradeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("oracle_trades", args);
    }
  },
});

export const syncOraclePosition = internalMutation({
  args: {
    positionId: v.string(),
    marketId: v.string(),
    marketQuestion: v.string(),
    outcome: v.string(),
    entryPrice: v.number(),
    currentPrice: v.number(),
    unrealizedPnl: v.number(),
    positionSizeUsd: v.number(),
    strategy: v.string(),
    timeHeldSeconds: v.number(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("oracle_positions")
      .withIndex("by_positionId", (q) => q.eq("positionId", args.positionId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("oracle_positions", args);
    }
  },
});

export const syncOraclePnl = internalMutation({
  args: {
    date: v.string(),
    totalRealizedPnl: v.number(),
    todaysPnl: v.number(),
    unrealizedPnl: v.number(),
    winRate: v.number(),
    roiPercent: v.number(),
    totalTrades: v.number(),
    winningTrades: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("oracle_pnl")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    const data = {
      ...args,
      timestamp: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("oracle_pnl", data);
    }
  },
});

export const syncOracleStrategyPerformance = internalMutation({
  args: {
    strategy: v.string(),
    totalTrades: v.number(),
    winningTrades: v.number(),
    totalPnl: v.number(),
    winRate: v.number(),
    avgPnlPerTrade: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("oracle_strategy_performance")
      .withIndex("by_strategy", (q) => q.eq("strategy", args.strategy))
      .first();

    const data = {
      ...args,
      lastUpdated: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("oracle_strategy_performance", data);
    }
  },
});

export const syncOracleActivityLog = internalMutation({
  args: {
    turnId: v.string(),
    agentId: v.string(),
    status: v.string(),
    prompt: v.optional(v.string()),
    toolCalls: v.optional(v.array(v.any())),
    tokenUsage: v.optional(v.any()),
    durationMs: v.number(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("oracle_activity_log")
      .withIndex("by_turnId", (q) => q.eq("turnId", args.turnId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("oracle_activity_log", args);
    }
  },
});

// Query functions
import { query } from "./_generated/server";

export const getOracleStatus = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("oracle_status")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
  },
});

export const getOracleTrades = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    return await ctx.db
      .query("oracle_trades")
      .order("desc")
      .take(limit);
  },
});

export const getOpenPositions = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("oracle_positions")
      .order("desc")
      .collect();
  },
});

export const getOraclePnl = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    return await ctx.db
      .query("oracle_pnl")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoff))
      .order("desc")
      .collect();
  },
});

export const getStrategyPerformance = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("oracle_strategy_performance")
      .order("desc")
      .collect();
  },
});

export const getOracleActivityLog = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("oracle_activity_log")
      .order("desc")
      .take(limit);
  },
});