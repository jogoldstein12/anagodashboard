// @ts-nocheck
import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// List tasks with filtering by status and/or agent
export const list = query({
  args: {
    status: v.optional(v.string()),
    agent: v.optional(v.string()),
    priority: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args: { status?: string; agent?: string; priority?: string; limit?: number }) => {
    const limit = args.limit ?? 50;
    let q;

    if (args.status) {
      q = ctx.db
        .query("tasks")
        .withIndex("by_status", (q: any) => q.eq("status", args.status!))
        .order("desc");
    } else if (args.agent) {
      q = ctx.db
        .query("tasks")
        .withIndex("by_agent", (q: any) => q.eq("agent", args.agent!))
        .order("desc");
    } else if (args.priority) {
      q = ctx.db
        .query("tasks")
        .withIndex("by_priority", (q: any) => q.eq("priority", args.priority!))
        .order("desc");
    } else {
      q = ctx.db
        .query("tasks")
        .order("desc");
    }

    const results = await q.take(limit);

    // Apply additional filters if multiple filters provided
    let filtered = results;
    if (args.status && args.agent) {
      filtered = filtered.filter((r) => r.status === args.status && r.agent === args.agent);
    }
    if (args.priority && args.agent) {
      filtered = filtered.filter((r) => r.priority === args.priority && r.agent === args.agent);
    }

    return filtered;
  },
});

// Get tasks by specific agent
export const getByAgent = query({
  args: {
    agent: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args: { agent: string; status?: string }) => {
    let q = ctx.db
      .query("tasks")
      .withIndex("by_agent", (q: any) => q.eq("agent", args.agent))
      .order("desc");

    const results = await q.take(100);
    
    if (args.status) {
      return results.filter((r) => r.status === args.status);
    }
    
    return results;
  },
});

// Create a new task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    agent: v.string(),
    priority: v.string(),
    status: v.string(),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, args: { title: string; description: string; agent: string; priority: string; status: string; dueDate?: number }) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a task
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    agent: v.optional(v.string()),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, args: { id: any; title?: string; description?: string; agent?: string; priority?: string; status?: string; dueDate?: number }) => {
    const { id, ...updates } = args;
    const task = await ctx.db.get(id);
    
    if (!task) {
      throw new Error("Task not found");
    }

    const now = Date.now();
    const completedAt = args.status === "done" && task.status !== "done" ? now : task.completedAt;
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
      completedAt,
    });
    
    return await ctx.db.get(id);
  },
});

// Update task status specifically
export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.string(),
  },
  handler: async (ctx: MutationCtx, args: { id: any; status: string }) => {
    const task = await ctx.db.get(args.id);
    
    if (!task) {
      throw new Error("Task not found");
    }

    const now = Date.now();
    const completedAt = args.status === "done" && task.status !== "done" ? now : task.completedAt;
    
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: now,
      completedAt,
    });
    
    return await ctx.db.get(args.id);
  },
});