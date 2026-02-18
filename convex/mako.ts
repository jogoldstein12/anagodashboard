// @ts-nocheck
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const syncMakoStatus = internalMutation({
  args: {
    status: v.string(),
    mode: v.string(),
    bankroll: v.number(),
    totalPnl: v.number(),
    totalTrades: v.number(),
    winRate: v.number(),
    wins: v.number(),
    losses: v.number(),
    walletUsdc: v.number(),
    lastTradeAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mako_status")
      .first();

    const data = {
      ...args,
      lastSyncAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("mako_status", data);
    }
  },
});

export const syncMakoTrade = internalMutation({
  args: {
    tradeId: v.string(),
    timestamp: v.number(),
    windowStart: v.number(),
    slug: v.string(),
    direction: v.string(),
    confidence: v.number(),
    score: v.number(),
    windowDelta: v.number(),
    tokenPrice: v.number(),
    outcome: v.string(),
    pnl: v.number(),
    bankrollAfter: v.number(),
    dryRun: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mako_trades")
      .withIndex("by_tradeId", (q) => q.eq("tradeId", args.tradeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("mako_trades", args);
    }
  },
});

export const syncMakoPnl = internalMutation({
  args: {
    date: v.string(),
    trades: v.number(),
    wins: v.number(),
    pnl: v.number(),
    bankrollClose: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mako_pnl")
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
      return await ctx.db.insert("mako_pnl", data);
    }
  },
});

// Query functions

export const getMakoStatus = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("mako_status")
      .first();
  },
});

export const getMakoTrades = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    return await ctx.db
      .query("mako_trades")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
  },
});

export const getMakoPnl = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    return await ctx.db
      .query("mako_pnl")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoff))
      .order("desc")
      .collect();
  },
});
