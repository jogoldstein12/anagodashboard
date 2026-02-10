// @ts-nocheck
import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const search = query({
  args: {
    query: v.string(),
    type: v.optional(v.string()),
    agent: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args: { query: string; type?: string; agent?: string }) => {
    if (!args.query.trim()) return [];

    let q = ctx.db
      .query("documents")
      .withSearchIndex("search_content", (q) => {
        let search = q.search("content", args.query);
        if (args.type) search = search.eq("type", args.type);
        if (args.agent) search = search.eq("agent", args.agent);
        return search;
      });

    const contentResults = await q.take(20);

    let titleQ = ctx.db
      .query("documents")
      .withSearchIndex("search_title", (q) => {
        let search = q.search("title", args.query);
        if (args.type) search = search.eq("type", args.type);
        if (args.agent) search = search.eq("agent", args.agent);
        return search;
      });

    const titleResults = await titleQ.take(20);

    const seen = new Set<string>();
    const combined = [];
    for (const doc of [...titleResults, ...contentResults]) {
      if (!seen.has(doc._id)) {
        seen.add(doc._id);
        combined.push(doc);
      }
    }
    return combined.slice(0, 25);
  },
});

export const create = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    content: v.string(),
    agent: v.string(),
    filePath: v.optional(v.string()),
    tags: v.array(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx: MutationCtx, args: { type: string; title: string; content: string; agent: string; filePath?: string; tags: string[]; timestamp: number }) => {
    return await ctx.db.insert("documents", args);
  },
});

export const listByType = query({
  args: {
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args: { type?: string; limit?: number }) => {
    if (args.type) {
      return await ctx.db
        .query("documents")
        .withIndex("by_type", (q: any) => q.eq("type", args.type!))
        .order("desc")
        .take(args.limit ?? 50);
    }
    return await ctx.db
      .query("documents")
      .order("desc")
      .take(args.limit ?? 100);
  },
});
