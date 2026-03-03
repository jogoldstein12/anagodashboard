// @ts-nocheck
import { query, mutation, action, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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
    subtasks: v.optional(v.array(v.object({
      title: v.string(),
      status: v.string(),
      completedAt: v.optional(v.number()),
    }))),
  },
  handler: async (ctx: MutationCtx, args: { title: string; description: string; agent: string; priority: string; status: string; dueDate?: number; subtasks?: Array<{ title: string; status: string; completedAt?: number }> }) => {
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

// Delete a task
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx: MutationCtx, args: { id: any }) => {
    await ctx.db.delete(args.id);
  },
});
// Send Telegram notification when task status changes from dashboard
const TELEGRAM_BOT_TOKEN = "8359421785:AAFKWgxdEArOhH7PJdXaldtNmgDP6l2aPcA";
const TELEGRAM_CHAT_ID = "6491266739";

async function sendTelegramNotification(title: string, oldStatus: string, newStatus: string) {
  const statusEmoji: Record<string, string> = {
    backlog: "📋",
    up_next: "⏳",
    in_progress: "🔄",
    done: "✅",
  };

  const message = `📊 *Dashboard Task Update*\n\n*${title}*\n${statusEmoji[oldStatus] || "❓"} ${oldStatus} → ${statusEmoji[newStatus] || "❓"} ${newStatus}\n\n_Changed by Josh from Mission Control_`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (e) {
    console.error("Failed to send Telegram notification:", e);
  }
}

// Update status + send Telegram notification (action wraps mutation + HTTP call)
export const updateStatusWithNotify = action({
  args: {
    id: v.id("tasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the task first
    const task: any = await ctx.runQuery(api.tasks.getById, { id: args.id });
    if (!task) throw new Error("Task not found");

    const oldStatus = task.status;

    // Update status via mutation
    await ctx.runMutation(api.tasks.updateStatus, {
      id: args.id,
      status: args.status,
    });

    // Send Telegram notification (only if status actually changed)
    if (oldStatus !== args.status) {
      await sendTelegramNotification(task.title, oldStatus, args.status);
    }

    return { success: true, title: task.title, oldStatus, newStatus: args.status };
  },
});

// Get a single task by ID (needed by the action above)
export const getById = query({
  args: { id: v.id("tasks") },
  handler: async (ctx: QueryCtx, args: { id: any }) => {
    return await ctx.db.get(args.id);
  },
});
