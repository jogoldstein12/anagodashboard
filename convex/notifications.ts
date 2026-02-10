// @ts-nocheck
import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// List notifications with filtering by channel
export const list = query({
  args: {
    channel: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args: { channel?: string; limit?: number; cursor?: string }) => {
    const limit = args.limit ?? 50;
    let q;

    if (args.channel) {
      q = ctx.db
        .query("notifications")
        .withIndex("by_channel", (q: any) => q.eq("channel", args.channel!))
        .order("desc");
    } else {
      q = ctx.db
        .query("notifications")
        .withIndex("by_timestamp")
        .order("desc");
    }

    const results = await q.take(limit + 1);
    
    return results.slice(0, limit);
  },
});

// Create a new notification
export const create = mutation({
  args: {
    channel: v.string(),
    recipient: v.string(),
    subject: v.optional(v.string()),
    content: v.string(),
    status: v.string(),
    activityId: v.optional(v.id("activities")),
  },
  handler: async (ctx: MutationCtx, args: { channel: string; recipient: string; subject?: string; content: string; status: string; activityId?: any }) => {
    const now = Date.now();
    return await ctx.db.insert("notifications", {
      ...args,
      timestamp: now,
    });
  },
});

// Mark notification as read
export const markRead = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx: MutationCtx, args: { id: any }) => {
    const notification = await ctx.db.get(args.id);
    
    if (!notification) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.id, {
      status: "read",
    });
    
    return await ctx.db.get(args.id);
  },
});