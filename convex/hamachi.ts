// @ts-nocheck
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Internal Mutations (called by sync script via HTTP) ────────

export const syncHamachiStatus = internalMutation({
  args: {
    status: v.string(),
    bankroll: v.number(),
    deployed: v.number(),
    peakBankroll: v.number(),
    dailyPnl: v.number(),
    totalPnl: v.number(),
    openPositions: v.number(),
    totalTrades: v.number(),
    wins: v.number(),
    winRate: v.number(),
    dailyLossHalted: v.boolean(),
    lastTradeAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("hamachi_status").first();
    const data = { ...args, lastSyncAt: Date.now() };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return await ctx.db.insert("hamachi_status", data);
  },
});

export const syncHamachiTrade = internalMutation({
  args: {
    tradeId: v.string(),
    ts: v.number(),
    city: v.string(),
    ticker: v.string(),
    strike: v.number(),
    direction: v.string(),
    entryPrice: v.number(),
    exitPrice: v.optional(v.number()),
    modelProb: v.number(),
    outcome: v.optional(v.string()),
    pnlNet: v.optional(v.number()),
    live: v.boolean(),
    contractDate: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("hamachi_trades")
      .withIndex("by_tradeId", (q) => q.eq("tradeId", args.tradeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("hamachi_trades", args);
  },
});

export const syncHamachiPnl = internalMutation({
  args: {
    date: v.string(),
    trades: v.number(),
    wins: v.number(),
    pnl: v.number(),
    bankrollClose: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("hamachi_pnl")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    const data = { ...args, timestamp: Date.now() };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return await ctx.db.insert("hamachi_pnl", data);
  },
});

// ─── Query Functions ────────────────────────────────────────────

export const getHamachiStatus = query({
  handler: async (ctx) => {
    return await ctx.db.query("hamachi_status").first();
  },
});

export const getHamachiTrades = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("hamachi_trades")
      .withIndex("by_ts")
      .order("desc")
      .take(limit);
  },
});

export const getHamachiPnl = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    return await ctx.db
      .query("hamachi_pnl")
      .withIndex("by_date")
      .order("desc")
      .collect()
      .then((rows) => rows.filter((r) => r.timestamp >= cutoff));
  },
});
