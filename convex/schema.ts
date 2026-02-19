// @ts-nocheck
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  activities: defineTable({
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
  })
    .index("by_agent", ["agent", "timestamp"])
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action", "timestamp"])
    .index("by_session", ["sessionId", "timestamp"]),

  scheduled_tasks: defineTable({
    name: v.string(),
    agent: v.string(),
    schedule: v.string(),
    cronExpr: v.string(),
    timezone: v.string(),
    nextRun: v.number(),
    lastRun: v.optional(v.number()),
    status: v.string(),
    description: v.string(),
    cronId: v.optional(v.string()),
    lastStatus: v.optional(v.string()),
    lastDurationMs: v.optional(v.number()),
  })
    .index("by_agent", ["agent"])
    .index("by_next_run", ["nextRun"])
    .index("by_status", ["status"])
    .index("by_cronId", ["cronId"]),

  documents: defineTable({
    type: v.string(),
    title: v.string(),
    content: v.string(),
    agent: v.string(),
    filePath: v.optional(v.string()),
    tags: v.array(v.string()),
    timestamp: v.number(),
  })
    .index("by_type", ["type", "timestamp"])
    .index("by_agent", ["agent", "timestamp"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["type", "agent"],
    })
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["type", "agent"],
    }),

  // NEW TABLES FOR MISSION CONTROL V2
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    agent: v.string(),
    priority: v.string(),
    status: v.string(),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    subtasks: v.optional(v.array(v.object({
      title: v.string(),
      status: v.string(),
      completedAt: v.optional(v.number()),
    }))),
  })
    .index("by_status", ["status", "createdAt"])
    .index("by_agent", ["agent", "status"])
    .index("by_priority", ["priority", "createdAt"]),

  agents: defineTable({
    agentId: v.string(),
    name: v.string(),
    emoji: v.string(),
    model: v.string(),
    trustLevel: v.string(),
    status: v.string(),
    color: v.string(),
    currentTask: v.optional(v.string()),
    tokensToday: v.number(),
    tasksToday: v.number(),
    tasksTotal: v.number(),
    lastActive: v.number(),
    costToday: v.optional(v.number()),
    costWeek: v.optional(v.number()),
    costMonth: v.optional(v.number()),
  })
    .index("by_agentId", ["agentId"]),

  sessions: defineTable({
    sessionId: v.string(),
    sessionKey: v.string(),
    agent: v.string(),
    parentSessionId: v.optional(v.string()),
    model: v.string(),
    status: v.string(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    tokensIn: v.number(),
    tokensOut: v.number(),
    cost: v.number(),
    taskSummary: v.optional(v.string()),
  })
    .index("by_agent", ["agent", "startedAt"])
    .index("by_status", ["status", "startedAt"])
    .index("by_parent", ["parentSessionId", "startedAt"])
    .index("by_sessionId", ["sessionId"]),

  notifications: defineTable({
    channel: v.string(),
    recipient: v.string(),
    subject: v.optional(v.string()),
    content: v.string(),
    status: v.string(),
    timestamp: v.number(),
    activityId: v.optional(v.id("activities")),
  })
    .index("by_channel", ["channel", "timestamp"])
    .index("by_timestamp", ["timestamp"]),

  cost_entries: defineTable({
    agent: v.string(),
    model: v.string(),
    tokensIn: v.number(),
    tokensOut: v.number(),
    cost: v.number(),
    sessionId: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_agent", ["agent", "timestamp"])
    .index("by_timestamp", ["timestamp"])
    .index("by_model", ["model", "timestamp"]),

  approvals: defineTable({
    type: v.string(),
    title: v.string(),
    description: v.string(),
    agent: v.string(),
    status: v.string(),
    data: v.optional(v.any()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_status", ["status", "createdAt"])
    .index("by_agent", ["agent", "createdAt"]),

  // MAKO SCALPER TRADING TABLES
  mako_status: defineTable({
    status: v.string(), // "active", "idle", "offline"
    mode: v.string(), // "live" or "dry-run"
    bankroll: v.number(),
    totalPnl: v.number(),
    totalTrades: v.number(),
    winRate: v.number(),
    wins: v.number(),
    losses: v.number(),
    walletUsdc: v.number(),
    lastTradeAt: v.number(),
    lastSyncAt: v.number(),
  })
    .index("by_lastSync", ["lastSyncAt"]),

  mako_trades: defineTable({
    tradeId: v.string(),
    timestamp: v.number(),
    windowStart: v.number(),
    slug: v.string(),
    direction: v.string(), // "up" or "down"
    confidence: v.number(),
    score: v.number(),
    windowDelta: v.number(),
    tokenPrice: v.number(),
    outcome: v.string(), // "win", "loss", "pending"
    pnl: v.number(),
    bankrollAfter: v.number(),
    dryRun: v.boolean(),
  })
    .index("by_tradeId", ["tradeId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_outcome", ["outcome", "timestamp"]),

  mako_pnl: defineTable({
    date: v.string(), // YYYY-MM-DD
    trades: v.number(),
    wins: v.number(),
    pnl: v.number(),
    bankrollClose: v.number(),
    timestamp: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_timestamp", ["timestamp"]),

  // SYNC REQUEST QUEUE (dashboard "Sync Now" button → Mac mini pickup)
  sync_requests: defineTable({
    requestedAt: v.number(),
    fulfilledAt: v.optional(v.number()),
    status: v.string(), // "pending", "fulfilled", "expired"
  }).index("by_status", ["status", "requestedAt"]),
});
