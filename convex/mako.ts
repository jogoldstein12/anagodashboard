// @ts-nocheck
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Internal Mutations (called by sync script via HTTP) ────────

export const syncMakoStatus = internalMutation({
  args: {
    status: v.string(),
    polyBalance: v.number(),
    kalshiBalance: v.number(),
    bankroll: v.number(),
    peakBankroll: v.number(),
    drawdownPct: v.number(),
    dailyPnl: v.number(),
    totalPnl: v.number(),
    totalTrades: v.number(),
    openPositions: v.number(),
    winRate: v.number(),
    lastTradeAt: v.optional(v.number()),
    lastCrashAt: v.optional(v.number()),
    lastCrashReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("mako_status").first();
    const data = { ...args, lastSyncAt: Date.now() };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return await ctx.db.insert("mako_status", data);
  },
});

export const syncMakoTrade = internalMutation({
  args: {
    tradeId: v.string(),
    ts: v.number(),
    strategy: v.string(),
    eventId: v.string(),
    legAPlatform: v.string(),
    legAMarket: v.string(),
    legASide: v.string(),
    legAPrice: v.number(),
    legAContracts: v.number(),
    legAStatus: v.string(),
    legBPlatform: v.optional(v.string()),
    legBMarket: v.optional(v.string()),
    legBSide: v.optional(v.string()),
    legBPrice: v.optional(v.number()),
    legBContracts: v.optional(v.number()),
    legBStatus: v.optional(v.string()),
    expectedProfitCents: v.optional(v.number()),
    actualProfitCents: v.optional(v.number()),
    status: v.string(),
    resolutionDate: v.optional(v.string()),
    notes: v.optional(v.string()),
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
    }
    return await ctx.db.insert("mako_trades", args);
  },
});

export const syncMakoPnl = internalMutation({
  args: {
    date: v.string(),
    trades: v.number(),
    wins: v.number(),
    pnlCents: v.number(),
    bankrollClose: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mako_pnl")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    const data = { ...args, timestamp: Date.now() };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return await ctx.db.insert("mako_pnl", data);
  },
});

export const syncMakoRiskEvent = internalMutation({
  args: {
    ts: v.number(),
    eventType: v.string(),
    bankroll: v.number(),
    dailyPnl: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Deduplicate by ts + eventType
    const existing = await ctx.db
      .query("mako_risk_events")
      .withIndex("by_ts", (q) => q.eq("ts", args.ts))
      .first();

    if (existing && existing.eventType === args.eventType) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("mako_risk_events", args);
  },
});

export const purgePhantomTrades = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete everything that isn't a real cross_arb trade.
    // The only real trade is OKC cross_arb (event_id: nba-2026-okc).
    const trades = await ctx.db.query("mako_trades").collect();
    let deleted = 0;
    for (const t of trades) {
      const isRealCrossArb =
        t.strategy === "cross_arb" && t.event_id === "nba-2026-okc";
      if (!isRealCrossArb) {
        await ctx.db.delete(t._id);
        deleted++;
      }
    }
    // Also nuke all risk events (all were drawdown halt spam)
    const events = await ctx.db.query("mako_risk_events").collect();
    for (const e of events) await ctx.db.delete(e._id);
    return { deletedTrades: deleted, deletedRiskEvents: events.length };
  },
});

export const clearMakoHistory = internalMutation({
  args: {},
  handler: async (ctx) => {
    const trades = await ctx.db.query("mako_trades").collect();
    for (const t of trades) await ctx.db.delete(t._id);
    const pnls = await ctx.db.query("mako_pnl").collect();
    for (const p of pnls) await ctx.db.delete(p._id);
    const events = await ctx.db.query("mako_risk_events").collect();
    for (const e of events) await ctx.db.delete(e._id);
    return { deletedTrades: trades.length, deletedPnl: pnls.length, deletedEvents: events.length };
  },
});

// ─── Query Functions ────────────────────────────────────────────

export const getMakoStatus = query({
  handler: async (ctx) => {
    return await ctx.db.query("mako_status").first();
  },
});

export const getMakoTrades = query({
  args: {
    limit: v.optional(v.number()),
    strategy: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    if (args.status) {
      return await ctx.db
        .query("mako_trades")
        .withIndex("by_status", (q) => q.eq("status", args.status))
        .order("desc")
        .take(limit);
    }

    if (args.strategy) {
      return await ctx.db
        .query("mako_trades")
        .withIndex("by_strategy", (q) => q.eq("strategy", args.strategy))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("mako_trades")
      .withIndex("by_ts")
      .order("desc")
      .take(limit);
  },
});

export const getMakoPnl = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    return await ctx.db
      .query("mako_pnl")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoff))
      .order("desc")
      .collect();
  },
});

export const getMakoRiskEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("mako_risk_events")
      .withIndex("by_ts")
      .order("desc")
      .take(limit);
  },
});

export const getMakoModuleStats = query({
  handler: async (ctx) => {
    // Get all closed trades to aggregate by strategy
    const trades = await ctx.db
      .query("mako_trades")
      .withIndex("by_status", (q) => q.eq("status", "closed"))
      .collect();

    const modules: Record<string, { count: number; wins: number; totalProfitCents: number }> = {};

    for (const t of trades) {
      if (!modules[t.strategy]) {
        modules[t.strategy] = { count: 0, wins: 0, totalProfitCents: 0 };
      }
      const m = modules[t.strategy];
      m.count++;
      if ((t.actualProfitCents ?? 0) > 0) m.wins++;
      m.totalProfitCents += t.actualProfitCents ?? 0;
    }

    return Object.entries(modules).map(([strategy, stats]) => ({
      strategy,
      count: stats.count,
      wins: stats.wins,
      winRate: stats.count > 0 ? (stats.wins / stats.count) * 100 : 0,
      totalProfitCents: stats.totalProfitCents,
      avgProfitCents: stats.count > 0 ? stats.totalProfitCents / stats.count : 0,
    }));
  },
});
