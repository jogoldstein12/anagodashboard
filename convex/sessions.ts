// @ts-nocheck
import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// List sessions with filtering by agent and/or status
export const list = query({
  args: {
    agent: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args: { agent?: string; status?: string; limit?: number }) => {
    const limit = args.limit ?? 50;
    let q;

    if (args.agent && args.status) {
      // Need to filter manually since we don't have a compound index
      q = ctx.db
        .query("sessions")
        .withIndex("by_agent", (q: any) => q.eq("agent", args.agent!))
        .order("desc");
    } else if (args.agent) {
      q = ctx.db
        .query("sessions")
        .withIndex("by_agent", (q: any) => q.eq("agent", args.agent!))
        .order("desc");
    } else if (args.status) {
      q = ctx.db
        .query("sessions")
        .withIndex("by_status", (q: any) => q.eq("status", args.status!))
        .order("desc");
    } else {
      q = ctx.db
        .query("sessions")
        .order("desc");
    }

    const results = await q.take(limit);

    // Apply additional filters if needed
    let filtered = results;
    if (args.agent && args.status) {
      filtered = filtered.filter((r) => r.agent === args.agent && r.status === args.status);
    }

    return filtered;
  },
});

// Get session tree (session + children by parentSessionId)
export const getTree = query({
  args: {
    parentSessionId: v.optional(v.string()),
    depth: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args: { parentSessionId?: string; depth?: number }) => {
    const depth = args.depth ?? 2;
    
    if (!args.parentSessionId) {
      // Get root sessions (no parent)
      const rootSessions = await ctx.db
        .query("sessions")
        .filter((q: any) => q.eq(q.field("parentSessionId"), undefined))
        .order("desc")
        .take(20);
      
      // Get children for each root session
      const sessionsWithChildren = await Promise.all(
        rootSessions.map(async (session) => {
          const children = await ctx.db
            .query("sessions")
            .withIndex("by_parent", (q: any) => q.eq("parentSessionId", session.sessionId))
            .order("desc")
            .take(10);
          
          return {
            ...session,
            children,
          };
        })
      );
      
      return sessionsWithChildren;
    } else {
      // Get specific session and its children
      const session = await ctx.db
        .query("sessions")
        .filter((q: any) => q.eq(q.field("sessionId"), args.parentSessionId))
        .first();
      
      if (!session) {
        return null;
      }
      
      const children = await ctx.db
        .query("sessions")
        .withIndex("by_parent", (q: any) => q.eq("parentSessionId", args.parentSessionId))
        .order("desc")
        .take(20);
      
      return {
        ...session,
        children,
      };
    }
  },
});

// Create a new session
export const create = mutation({
  args: {
    sessionId: v.string(),
    sessionKey: v.string(),
    agent: v.string(),
    parentSessionId: v.optional(v.string()),
    model: v.string(),
    status: v.string(),
    taskSummary: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { sessionId: string; sessionKey: string; agent: string; parentSessionId?: string; model: string; status: string; taskSummary?: string }) => {
    const now = Date.now();
    return await ctx.db.insert("sessions", {
      ...args,
      startedAt: now,
      tokensIn: 0,
      tokensOut: 0,
      cost: 0,
    });
  },
});

// Update session (end session, update tokens/cost)
export const update = mutation({
  args: {
    id: v.id("sessions"),
    status: v.optional(v.string()),
    endedAt: v.optional(v.number()),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    cost: v.optional(v.number()),
    taskSummary: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { id: any; status?: string; endedAt?: number; tokensIn?: number; tokensOut?: number; cost?: number; taskSummary?: string }) => {
    const { id, ...updates } = args;
    const session = await ctx.db.get(id);
    
    if (!session) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(id, updates);
    
    return await ctx.db.get(id);
  },
});