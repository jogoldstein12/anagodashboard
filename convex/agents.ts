// @ts-nocheck
import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// List all agents
export const list = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    return await ctx.db
      .query("agents")
      .order("desc")
      .collect();
  },
});

// Get agent by agentId
export const get = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx: QueryCtx, args: { agentId: string }) => {
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q: any) => q.eq("agentId", args.agentId))
      .collect();
    
    return agents[0] || null;
  },
});

// Create a new agent
export const create = mutation({
  args: {
    agentId: v.string(),
    name: v.string(),
    emoji: v.string(),
    model: v.string(),
    trustLevel: v.string(),
    status: v.string(),
    color: v.string(),
    currentTask: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { agentId: string; name: string; emoji: string; model: string; trustLevel: string; status: string; color: string; currentTask?: string }) => {
    const now = Date.now();
    return await ctx.db.insert("agents", {
      ...args,
      tokensToday: 0,
      tasksToday: 0,
      tasksTotal: 0,
      lastActive: now,
    });
  },
});

// Update agent details
export const update = mutation({
  args: {
    id: v.id("agents"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    model: v.optional(v.string()),
    trustLevel: v.optional(v.string()),
    status: v.optional(v.string()),
    color: v.optional(v.string()),
    currentTask: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { id: any; name?: string; emoji?: string; model?: string; trustLevel?: string; status?: string; color?: string; currentTask?: string }) => {
    const { id, ...updates } = args;
    const agent = await ctx.db.get(id);
    
    if (!agent) {
      throw new Error("Agent not found");
    }

    await ctx.db.patch(id, updates);
    
    return await ctx.db.get(id);
  },
});

// Update agent stats (tokens, tasks, last active)
export const updateStats = mutation({
  args: {
    id: v.id("agents"),
    tokensToday: v.optional(v.number()),
    tasksToday: v.optional(v.number()),
    tasksTotal: v.optional(v.number()),
    lastActive: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, args: { id: any; tokensToday?: number; tasksToday?: number; tasksTotal?: number; lastActive?: number }) => {
    const { id, ...updates } = args;
    const agent = await ctx.db.get(id);
    
    if (!agent) {
      throw new Error("Agent not found");
    }

    // Increment values if provided
    const patchData: any = {};
    if (args.tokensToday !== undefined) {
      patchData.tokensToday = agent.tokensToday + args.tokensToday;
    }
    if (args.tasksToday !== undefined) {
      patchData.tasksToday = agent.tasksToday + args.tasksToday;
    }
    if (args.tasksTotal !== undefined) {
      patchData.tasksTotal = agent.tasksTotal + args.tasksTotal;
    }
    if (args.lastActive !== undefined) {
      patchData.lastActive = args.lastActive;
    }

    await ctx.db.patch(id, patchData);
    
    return await ctx.db.get(id);
  },
});