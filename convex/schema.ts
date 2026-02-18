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

  // ORACLE TRADING TABLES
  oracle_status: defineTable({
    agentId: v.string(),
    status: v.string(), // running, sleeping, dead
    model: v.string(),
    uptimeSeconds: v.number(),
    totalTurns: v.number(),
    totalTokens: v.number(),
    usdcBalance: v.number(),
    ethBalance: v.number(),
    lastActivityTimestamp: v.number(),
    lastSyncTimestamp: v.number(),
  })
    .index("by_agentId", ["agentId"])
    .index("by_lastSync", ["lastSyncTimestamp"]),

  oracle_trades: defineTable({
    tradeId: v.string(),
    marketId: v.string(),
    marketQuestion: v.string(),
    outcome: v.string(),
    side: v.string(), // BUY or SELL
    price: v.number(),
    quantity: v.number(),
    amountUsd: v.number(),
    strategy: v.string(),
    pnl: v.number(),
    closed: v.boolean(),
    timestamp: v.number(),
    closedAt: v.optional(v.number()),
    stopLossPrice: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_tradeId", ["tradeId"])
    .index("by_market", ["marketId", "timestamp"])
    .index("by_strategy", ["strategy", "timestamp"])
    .index("by_closed", ["closed", "timestamp"]),

  oracle_positions: defineTable({
    positionId: v.string(),
    marketId: v.string(),
    marketQuestion: v.string(),
    outcome: v.string(),
    entryPrice: v.number(),
    currentPrice: v.number(),
    unrealizedPnl: v.number(),
    positionSizeUsd: v.number(),
    strategy: v.string(),
    timeHeldSeconds: v.number(),
    timestamp: v.number(),
  })
    .index("by_positionId", ["positionId"])
    .index("by_market", ["marketId"])
    .index("by_strategy", ["strategy"]),

  oracle_pnl: defineTable({
    date: v.string(), // YYYY-MM-DD
    totalRealizedPnl: v.number(),
    todaysPnl: v.number(),
    unrealizedPnl: v.number(),
    winRate: v.number(),
    roiPercent: v.number(),
    totalTrades: v.number(),
    winningTrades: v.number(),
    timestamp: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_timestamp", ["timestamp"]),

  oracle_strategy_performance: defineTable({
    strategy: v.string(),
    totalTrades: v.number(),
    winningTrades: v.number(),
    totalPnl: v.number(),
    winRate: v.number(),
    avgPnlPerTrade: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_strategy", ["strategy"])
    .index("by_pnl", ["totalPnl"]),

  oracle_activity_log: defineTable({
    turnId: v.string(),
    agentId: v.string(),
    status: v.string(),
    prompt: v.optional(v.string()),
    toolCalls: v.optional(v.array(v.any())),
    tokenUsage: v.optional(v.any()),
    durationMs: v.number(),
    timestamp: v.number(),
  })
    .index("by_turnId", ["turnId"])
    .index("by_agent", ["agentId", "timestamp"])
    .index("by_timestamp", ["timestamp"]),
});
