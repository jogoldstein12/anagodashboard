// @ts-nocheck
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const FIVE_MINUTES = 5 * 60 * 1000;

export const requestSync = mutation({
  args: {},
  handler: async (ctx) => {
    // Expire any pending requests older than 5 minutes
    const stale = await ctx.db
      .query("sync_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    for (const req of stale) {
      if (Date.now() - req.requestedAt > FIVE_MINUTES) {
        await ctx.db.patch(req._id, { status: "expired" });
      }
    }

    // Insert new pending request
    return await ctx.db.insert("sync_requests", {
      requestedAt: Date.now(),
      status: "pending",
    });
  },
});

export const getLastSync = query({
  args: {},
  handler: async (ctx) => {
    // Check for any pending request
    const pending = await ctx.db
      .query("sync_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .first();

    // Get most recent fulfilled request
    const fulfilled = await ctx.db
      .query("sync_requests")
      .withIndex("by_status", (q) => q.eq("status", "fulfilled"))
      .order("desc")
      .first();

    return {
      isPending: !!pending,
      lastFulfilledAt: fulfilled?.fulfilledAt ?? null,
    };
  },
});

export const getPendingForHttp = internalQuery({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("sync_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .first();

    return {
      pending: !!pending,
      requestedAt: pending?.requestedAt ?? null,
    };
  },
});

export const fulfillPendingSync = internalMutation({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("sync_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const now = Date.now();
    for (const req of pending) {
      await ctx.db.patch(req._id, {
        status: "fulfilled",
        fulfilledAt: now,
      });
    }

    return pending.length;
  },
});
