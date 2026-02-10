// @ts-nocheck
import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    agent: v.optional(v.string()),
    action: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args: { agent?: string; action?: string; status?: string; limit?: number; cursor?: string }) => {
    const limit = args.limit ?? 25;
    let q;

    if (args.agent) {
      q = ctx.db
        .query("activities")
        .withIndex("by_agent", (q: any) => q.eq("agent", args.agent!))
        .order("desc");
    } else {
      q = ctx.db
        .query("activities")
        .withIndex("by_timestamp")
        .order("desc");
    }

    const results = await q.take(limit + 1);

    let filtered = results;
    if (args.action) {
      filtered = filtered.filter((r) => r.action === args.action);
    }
    if (args.status) {
      filtered = filtered.filter((r) => r.status === args.status);
    }

    return filtered.slice(0, limit);
  },
});

export const getRecent = query({
  args: { count: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, args: { count?: number }) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.count ?? 10);
  },
});

export const create = mutation({
  args: {
    agent: v.string(),
    action: v.string(),
    title: v.string(),
    description: v.string(),
    metadata: v.optional(v.any()),
    status: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx: MutationCtx, args: { agent: string; action: string; title: string; description: string; metadata?: any; status: string; timestamp: number }) => {
    return await ctx.db.insert("activities", args);
  },
});
