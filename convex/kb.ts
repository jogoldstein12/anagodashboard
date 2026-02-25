// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query functions

export const getLatestSnapshot = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("kb_snapshot")
      .withIndex("by_exported_at")
      .order("desc")
      .first();
  },
});

export const searchItems = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    source: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    if (args.query.trim() === "") {
      // Return recent items if no search query
      return await ctx.db
        .query("kb_items")
        .order("desc")
        .take(limit);
    }
    
    // Use search index
    let searchQuery = ctx.db
      .query("kb_items")
      .withSearchIndex("search_kb", (q) => q.search("title", args.query));
    
    if (args.category && args.category !== "all") {
      searchQuery = searchQuery.filter((q) => 
        q.eq(q.field("primary_category"), args.category)
      );
    }
    
    if (args.source && args.source !== "all") {
      searchQuery = searchQuery.filter((q) => 
        q.eq(q.field("source_type"), args.source)
      );
    }
    
    return await searchQuery.take(limit);
  },
});

export const getItemsByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("kb_items")
      .filter((q) => q.eq(q.field("primary_category"), args.category))
      .order("desc")
      .take(limit);
  },
});

export const listRecentItems = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("kb_items")
      .order("desc")
      .take(limit);
  },
});

// Mutation functions

export const upsertSnapshot = mutation({
  args: {
    snapshot: v.object({
      exported_at: v.string(),
      stats: v.any(),
      recent_items: v.array(v.any()),
      watchlists: v.array(v.any()),
      research_jobs: v.array(v.any()),
      gaps: v.array(v.any()),
      competitive_monitors: v.array(v.any()),
      economic_indicators: v.array(v.any()),
      agent_injections: v.array(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    // Check if snapshot with same exported_at exists
    const existing = await ctx.db
      .query("kb_snapshot")
      .withIndex("by_exported_at", (q) => 
        q.eq("exported_at", args.snapshot.exported_at)
      )
      .first();
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, args.snapshot);
      return existing._id;
    } else {
      // Insert new
      return await ctx.db.insert("kb_snapshot", args.snapshot);
    }
  },
});

export const syncItems = mutation({
  args: {
    items: v.array(v.object({
      item_id: v.number(),
      title: v.string(),
      source_url: v.optional(v.string()),
      source_type: v.string(),
      source_id: v.optional(v.string()),
      primary_category: v.string(),
      content_summary: v.optional(v.string()),
      quality_score: v.optional(v.number()),
      freshness_score: v.optional(v.number()),
      save_intent: v.optional(v.string()),
      save_project: v.optional(v.string()),
      ingested_at: v.string(),
      tags: v.optional(v.array(v.string())),
      entity_names: v.optional(v.array(v.string())),
      times_referenced: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const item of args.items) {
      // Check if item already exists by item_id
      const existing = await ctx.db
        .query("kb_items")
        .filter((q) => q.eq(q.field("item_id"), item.item_id))
        .first();
      
      if (existing) {
        // Update existing
        await ctx.db.patch(existing._id, item);
        results.push({ id: existing._id, action: "updated" });
      } else {
        // Insert new
        const id = await ctx.db.insert("kb_items", item);
        results.push({ id, action: "inserted" });
      }
    }
    
    return { synced: results.length };
  },
});

export const clearItems = mutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("kb_items").collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    return { deleted: items.length };
  },
});
