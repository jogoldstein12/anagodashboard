// @ts-nocheck
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const syncActivity = internalMutation({
  args: {
    agent: v.string(),
    action: v.string(),
    title: v.string(),
    description: v.string(),
    status: v.string(),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
    duration: v.optional(v.number()),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    cost: v.optional(v.number()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", args);
  },
});

export const syncSession = internalMutation({
  args: {
    sessionId: v.string(),
    sessionKey: v.string(),
    agent: v.string(),
    model: v.string(),
    status: v.string(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    tokensIn: v.number(),
    tokensOut: v.number(),
    cost: v.number(),
    taskSummary: v.optional(v.string()),
    parentSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existing) {
      const { sessionId, ...updates } = args;
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      return await ctx.db.insert("sessions", args);
    }
  },
});

export const syncAgentStatus = internalMutation({
  args: {
    agentId: v.string(),
    status: v.optional(v.string()),
    currentTask: v.optional(v.string()),
    tokensToday: v.optional(v.number()),
    tasksToday: v.optional(v.number()),
    lastActive: v.optional(v.number()),
    costToday: v.optional(v.number()),
    costWeek: v.optional(v.number()),
    costMonth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!agent) {
      return null;
    }

    const { agentId, ...updates } = args;
    const clean = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(agent._id, clean);
    return agent._id;
  },
});

export const syncCronJobs = internalMutation({
  args: {
    jobs: v.array(
      v.object({
        name: v.string(),
        cronId: v.string(),
        agent: v.string(),
        schedule: v.string(),
        cronExpr: v.string(),
        timezone: v.string(),
        status: v.string(),
        nextRun: v.number(),
        lastRun: v.optional(v.number()),
        description: v.optional(v.string()),
        lastStatus: v.optional(v.string()),
        lastDurationMs: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const job of args.jobs) {
      const existing = await ctx.db
        .query("scheduled_tasks")
        .withIndex("by_cronId", (q) => q.eq("cronId", job.cronId))
        .first();

      if (existing) {
        const { cronId, ...updates } = job;
        await ctx.db.patch(existing._id, { cronId, ...updates });
      } else {
        await ctx.db.insert("scheduled_tasks", {
          ...job,
          description: job.description ?? "",
        });
      }
    }
  },
});

export const syncCostEntry = internalMutation({
  args: {
    agent: v.string(),
    model: v.string(),
    tokensIn: v.number(),
    tokensOut: v.number(),
    cost: v.number(),
    sessionId: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cost_entries", args);
  },
});

export const syncNotification = internalMutation({
  args: {
    channel: v.string(),
    recipient: v.string(),
    subject: v.optional(v.string()),
    content: v.string(),
    status: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", args);
  },
});
