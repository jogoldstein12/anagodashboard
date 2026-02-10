// @ts-nocheck
import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    agent: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args: { agent?: string; status?: string }) => {
    let q;
    if (args.status) {
      q = ctx.db
        .query("scheduled_tasks")
        .withIndex("by_status", (q) => q.eq("status", args.status!));
    } else if (args.agent) {
      q = ctx.db
        .query("scheduled_tasks")
        .withIndex("by_agent", (q) => q.eq("agent", args.agent!));
    } else {
      q = ctx.db.query("scheduled_tasks");
    }
    return await q.collect();
  },
});

export const getWeek = query({
  args: {
    weekStart: v.number(),
    weekEnd: v.number(),
  },
  handler: async (ctx: QueryCtx, args: { weekStart: number; weekEnd: number }) => {
    return await ctx.db
      .query("scheduled_tasks")
      .withIndex("by_next_run", (q) =>
        q.gte("nextRun", args.weekStart).lte("nextRun", args.weekEnd)
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    agent: v.string(),
    schedule: v.string(),
    cronExpr: v.string(),
    timezone: v.string(),
    nextRun: v.number(),
    lastRun: v.optional(v.number()),
    status: v.string(),
    description: v.string(),
  },
  handler: async (ctx: MutationCtx, args: { name: string; agent: string; schedule: string; cronExpr: string; timezone: string; nextRun: number; lastRun?: number; status: string; description: string }) => {
    return await ctx.db.insert("scheduled_tasks", args);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("scheduled_tasks"),
    status: v.string(),
    lastRun: v.optional(v.number()),
    nextRun: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, args: { id: any; status: string; lastRun?: number; nextRun?: number }) => {
    const { id, ...updates } = args;
    const clean = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, clean);
  },
});
