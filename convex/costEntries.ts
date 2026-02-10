// @ts-nocheck
import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    agent: v.optional(v.string()),
    model: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args: {
    agent?: string;
    model?: string;
    startTime?: number;
    endTime?: number;
  }) => {
    let q;

    if (args.agent) {
      q = ctx.db
        .query("cost_entries")
        .withIndex("by_agent", (q: any) => q.eq("agent", args.agent!));
    } else if (args.model) {
      q = ctx.db
        .query("cost_entries")
        .withIndex("by_model", (q: any) => q.eq("model", args.model!));
    } else {
      q = ctx.db
        .query("cost_entries")
        .withIndex("by_timestamp");
    }

    const results = await q.order("desc").take(200);

    let filtered = results;

    if (args.agent && args.model) {
      filtered = filtered.filter((r) => r.model === args.model);
    }
    if (args.startTime) {
      filtered = filtered.filter((r) => r.timestamp >= args.startTime!);
    }
    if (args.endTime) {
      filtered = filtered.filter((r) => r.timestamp <= args.endTime!);
    }

    return filtered.slice(0, 100);
  },
});

export const getByAgent = query({
  args: {
    agent: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args: { agent: string; limit?: number }) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("cost_entries")
      .withIndex("by_agent", (q: any) => q.eq("agent", args.agent))
      .order("desc")
      .take(limit);
  },
});

export const getDailyCosts = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args: { days?: number }) => {
    const days = args.days ?? 30;
    const now = Date.now();
    const startTime = now - days * 24 * 60 * 60 * 1000;

    const entries = await ctx.db
      .query("cost_entries")
      .withIndex("by_timestamp")
      .order("desc")
      .take(5000);

    const filtered = entries.filter((e) => e.timestamp >= startTime);

    const dailyMap: Record<string, { date: string; cost: number; tokensIn: number; tokensOut: number; count: number }> = {};

    for (const entry of filtered) {
      const date = new Date(entry.timestamp).toISOString().split("T")[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { date, cost: 0, tokensIn: 0, tokensOut: 0, count: 0 };
      }
      dailyMap[date].cost += entry.cost;
      dailyMap[date].tokensIn += entry.tokensIn;
      dailyMap[date].tokensOut += entry.tokensOut;
      dailyMap[date].count += 1;
    }

    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const create = mutation({
  args: {
    agent: v.string(),
    model: v.string(),
    tokensIn: v.number(),
    tokensOut: v.number(),
    cost: v.number(),
    sessionId: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx: MutationCtx, args: {
    agent: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    cost: number;
    sessionId?: string;
    timestamp: number;
  }) => {
    return await ctx.db.insert("cost_entries", args);
  },
});
