// @ts-nocheck
import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    agent: v.optional(v.string()),
    action: v.optional(v.string()),
    status: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args: { 
    agent?: string; 
    action?: string; 
    status?: string;
    startDate?: number;
    endDate?: number;
    limit?: number; 
    cursor?: string;
  }) => {
    const limit = args.limit ?? 25;
    
    // Start with base query
    let q = ctx.db.query("activities");
    
    // Apply filters using appropriate indexes
    if (args.agent) {
      q = q.withIndex("by_agent", (q: any) => q.eq("agent", args.agent!));
    } else if (args.action) {
      q = q.withIndex("by_action", (q: any) => q.eq("action", args.action!));
    } else {
      q = q.withIndex("by_timestamp");
    }
    
    // Order by timestamp descending
    q = q.order("desc");
    
    // Apply date range filter if provided
    const results = await q.take(limit + 1);
    
    let filtered = results;
    
    // Apply additional filters that weren't covered by indexes
    if (args.agent && args.action) {
      filtered = filtered.filter((r) => r.action === args.action);
    }
    if (args.status) {
      filtered = filtered.filter((r) => r.status === args.status);
    }
    if (args.startDate) {
      filtered = filtered.filter((r) => r.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      filtered = filtered.filter((r) => r.timestamp <= args.endDate!);
    }
    
    // Apply cursor-based pagination
    if (args.cursor) {
      const cursorIndex = filtered.findIndex((r) => r._id === args.cursor);
      if (cursorIndex !== -1) {
        filtered = filtered.slice(cursorIndex + 1);
      }
    }
    
    // Return limited results
    const hasMore = filtered.length > limit;
    const paginated = filtered.slice(0, limit);
    
    return {
      activities: paginated,
      hasMore,
      nextCursor: hasMore ? paginated[paginated.length - 1]?._id : undefined,
    };
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

export const getStats = query({
  args: {
    agent: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args: { agent?: string; startDate?: number; endDate?: number }) => {
    let q = ctx.db.query("activities");
    
    if (args.agent) {
      q = q.withIndex("by_agent", (q: any) => q.eq("agent", args.agent!));
    } else {
      q = q.withIndex("by_timestamp");
    }
    
    const activities = await q.order("desc").take(1000); // Limit for performance
    
    let filtered = activities;
    if (args.startDate) {
      filtered = filtered.filter((r) => r.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      filtered = filtered.filter((r) => r.timestamp <= args.endDate!);
    }
    
    // Calculate stats
    const totalTokens = filtered.reduce((sum, a) => sum + (a.tokensIn || 0) + (a.tokensOut || 0), 0);
    const totalCost = filtered.reduce((sum, a) => sum + (a.cost || 0), 0);
    const totalActivities = filtered.length;
    
    // Group by agent
    const byAgent: Record<string, number> = {};
    filtered.forEach(a => {
      byAgent[a.agent] = (byAgent[a.agent] || 0) + 1;
    });
    
    // Group by status
    const byStatus: Record<string, number> = {};
    filtered.forEach(a => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });
    
    return {
      totalTokens,
      totalCost,
      totalActivities,
      byAgent,
      byStatus,
    };
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
    duration: v.optional(v.number()),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    cost: v.optional(v.number()),
    sessionId: v.optional(v.string()),
    parentActivityId: v.optional(v.id("activities")),
  },
  handler: async (ctx: MutationCtx, args: { 
    agent: string; 
    action: string; 
    title: string; 
    description: string; 
    metadata?: any; 
    status: string; 
    timestamp: number;
    duration?: number;
    tokensIn?: number;
    tokensOut?: number;
    cost?: number;
    sessionId?: string;
    parentActivityId?: string;
  }) => {
    return await ctx.db.insert("activities", args);
  },
});
