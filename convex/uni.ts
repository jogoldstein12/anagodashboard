// @ts-nocheck
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const syncUniStatus = internalMutation({
  args: {
    ticker: v.optional(v.string()),
    releaseDate: v.optional(v.string()),
    status: v.string(),
    tradeDirection: v.optional(v.string()),
    entryPrice: v.optional(v.number()),
    betSize: v.optional(v.number()),
    multiplier: v.optional(v.number()),
    kalshiBalance: v.number(),
    winRate: v.number(),
    totalTrades: v.number(),
    totalPnl: v.number(),
    regime: v.optional(v.string()),
    signalSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("uni_status")
      .first();

    const data = {
      ...args,
      lastUpdated: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("uni_status", data);
    }
  },
});

export const syncUniTrade = internalMutation({
  args: {
    tradeId: v.string(),
    releaseDate: v.string(),
    ticker: v.string(),
    entryType: v.string(),
    entryPrice: v.number(),
    betSize: v.number(),
    contracts: v.number(),
    outcome: v.string(),
    pnl: v.optional(v.number()),
    actualCpi: v.optional(v.number()),
    regime: v.optional(v.string()),
    executedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("uni_trades")
      .withIndex("by_tradeId", (q) => q.eq("tradeId", args.tradeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("uni_trades", args);
    }
  },
});

// Query functions

export const getUniStatus = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("uni_status")
      .first();
  },
});

export const getUniTrades = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    return await ctx.db
      .query("uni_trades")
      .withIndex("by_releaseDate")
      .order("desc")
      .take(limit);
  },
});
