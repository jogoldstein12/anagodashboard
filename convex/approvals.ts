// @ts-nocheck
import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    status: v.optional(v.string()),
    agent: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args: { status?: string; agent?: string; limit?: number }) => {
    const limit = args.limit ?? 50;

    if (args.status) {
      const results = await ctx.db
        .query("approvals")
        .withIndex("by_status", (q: any) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
      if (args.agent) return results.filter((r) => r.agent === args.agent);
      return results;
    }

    const results = await ctx.db
      .query("approvals")
      .order("desc")
      .take(limit);
    if (args.agent) return results.filter((r) => r.agent === args.agent);
    return results;
  },
});

export const getPending = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    return await ctx.db
      .query("approvals")
      .withIndex("by_status", (q: any) => q.eq("status", "pending"))
      .order("desc")
      .take(50);
  },
});

export const create = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    description: v.string(),
    agent: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx: MutationCtx, args: { type: string; title: string; description: string; agent: string; data?: any }) => {
    return await ctx.db.insert("approvals", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const resolve = mutation({
  args: {
    id: v.id("approvals"),
    status: v.string(),
  },
  handler: async (ctx: MutationCtx, args: { id: any; status: string }) => {
    const approval = await ctx.db.get(args.id);
    if (!approval) throw new Error("Approval not found");

    await ctx.db.patch(args.id, {
      status: args.status,
      resolvedAt: Date.now(),
    });
    return await ctx.db.get(args.id);
  },
});
