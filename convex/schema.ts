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

  // MAKO V2 DUAL-LEG TRADING TABLES
  mako_status: defineTable({
    status: v.string(), // "live" | "dry_run" | "stopped"
    polyBalance: v.number(),
    kalshiBalance: v.number(),
    bankroll: v.number(),
    peakBankroll: v.number(),
    drawdownPct: v.number(),
    dailyPnl: v.number(),
    totalPnl: v.number(),
    totalTrades: v.number(),
    openPositions: v.number(),
    winRate: v.number(),
    lastSyncAt: v.number(),
    lastTradeAt: v.optional(v.number()),
    lastCrashAt: v.optional(v.number()),
    lastCrashReason: v.optional(v.string()),
  })
    .index("by_lastSync", ["lastSyncAt"]),

  mako_trades: defineTable({
    tradeId: v.string(),
    ts: v.number(),
    strategy: v.string(),
    eventId: v.string(),
    legAPlatform: v.string(),
    legAMarket: v.string(),
    legASide: v.string(),
    legAPrice: v.number(),
    legAContracts: v.number(),
    legAStatus: v.string(),
    legBPlatform: v.optional(v.string()),
    legBMarket: v.optional(v.string()),
    legBSide: v.optional(v.string()),
    legBPrice: v.optional(v.number()),
    legBContracts: v.optional(v.number()),
    legBStatus: v.optional(v.string()),
    expectedProfitCents: v.optional(v.number()),
    actualProfitCents: v.optional(v.number()),
    status: v.string(),
    resolutionDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    dryRun: v.boolean(),
  })
    .index("by_tradeId", ["tradeId"])
    .index("by_ts", ["ts"])
    .index("by_status", ["status"])
    .index("by_strategy", ["strategy"]),

  mako_pnl: defineTable({
    date: v.string(),
    trades: v.number(),
    wins: v.number(),
    pnlCents: v.optional(v.number()),
    pnl: v.optional(v.number()),
    bankrollClose: v.number(),
    timestamp: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_timestamp", ["timestamp"]),

  mako_risk_events: defineTable({
    ts: v.number(),
    eventType: v.string(),
    bankroll: v.number(),
    dailyPnl: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_ts", ["ts"]),

  // SYNC REQUEST QUEUE (dashboard "Sync Now" button → Mac mini pickup)
  sync_requests: defineTable({
    requestedAt: v.number(),
    fulfilledAt: v.optional(v.number()),
    status: v.string(), // "pending", "fulfilled", "expired"
  }).index("by_status", ["status", "requestedAt"]),

  // KB (KNOWLEDGE BASE) TABLES
  kb_snapshot: defineTable({
    exported_at: v.string(),
    stats: v.any(),
    recent_items: v.array(v.any()),
    watchlists: v.array(v.any()),
    research_jobs: v.array(v.any()),
    gaps: v.array(v.any()),
    competitive_monitors: v.array(v.any()),
    economic_indicators: v.array(v.any()),
    agent_injections: v.array(v.any()),
  }).index("by_exported_at", ["exported_at"]),

  kb_items: defineTable({
    item_id: v.number(),
    title: v.string(),
    source_url: v.optional(v.string()),
    source_type: v.string(),
    source_id: v.optional(v.string()),
    primary_category: v.string(),
    content_summary: v.optional(v.string()),
    quality_score: v.optional(v.number()),
    freshness_score: v.optional(v.number()),
    save_intent: v.optional(v.string()),
    save_project: v.optional(v.string()),
    ingested_at: v.string(),
    tags: v.optional(v.array(v.string())),
    entity_names: v.optional(v.array(v.string())),
    times_referenced: v.optional(v.number()),
  }).searchIndex("search_kb", {
    searchField: "title",
    filterFields: ["primary_category", "source_type"],
  }),

  // UNI KALSHI TRADING TABLES
  uni_status: defineTable({
    ticker: v.optional(v.string()),         // e.g. "KXCPIYOY-26MAR-T2.5"
    releaseDate: v.optional(v.string()),    // "2026-03-11"
    status: v.string(),                     // "idle" | "pending" | "approved" | "executed"
    tradeDirection: v.optional(v.string()), // "YES" | "NO"
    entryPrice: v.optional(v.number()),     // cents
    betSize: v.optional(v.number()),        // dollars
    multiplier: v.optional(v.number()),
    kalshiBalance: v.number(),
    winRate: v.number(),
    totalTrades: v.number(),
    totalPnl: v.number(),
    lastUpdated: v.number(),
    regime: v.optional(v.string()),         // "HOT" | "FLAT" | "COOL"
    signalSummary: v.optional(v.string()),
    openPositionCount: v.optional(v.number()),
    totalDeployed: v.optional(v.number()),
    nextResolution: v.optional(v.string()),
    nowcastCpiMom: v.optional(v.number()),
    macroSignals: v.optional(v.object({
      wti: v.optional(v.number()),
      gasoline: v.optional(v.number()),
      breakeven5yr: v.optional(v.number()),
      clevelandFedNowcast: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    })),
    shockTriggerStatus: v.optional(v.string()),
  })
    .index("by_lastUpdated", ["lastUpdated"]),

  uni_trades: defineTable({
    tradeId: v.string(),
    releaseDate: v.string(),
    ticker: v.string(),
    entryType: v.string(),        // "T-14" | "T-1"
    entryPrice: v.number(),
    betSize: v.number(),
    contracts: v.number(),
    outcome: v.string(),          // "pending" | "win" | "loss"
    pnl: v.optional(v.number()),
    currentMid: v.optional(v.number()),       // live Kalshi mid price in cents
    unrealizedPnl: v.optional(v.number()),    // (currentMid - entryPrice) / 100 * contracts
    actualCpi: v.optional(v.number()),
    regime: v.optional(v.string()),
    executedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_releaseDate", ["releaseDate"])
    .index("by_tradeId", ["tradeId"]),

  // HAMACHI WEATHER TRADING TABLES
  hamachi_status: defineTable({
    status: v.string(),
    bankroll: v.number(),
    deployed: v.number(),
    peakBankroll: v.number(),
    dailyPnl: v.number(),
    totalPnl: v.number(),
    openPositions: v.number(),
    totalTrades: v.number(),
    wins: v.number(),
    winRate: v.number(),
    dailyLossHalted: v.boolean(),
    lastSyncAt: v.number(),
    lastTradeAt: v.optional(v.number()),
  }).index("by_lastSync", ["lastSyncAt"]),

  hamachi_trades: defineTable({
    tradeId: v.string(),
    ts: v.number(),
    city: v.string(),
    ticker: v.string(),
    strike: v.number(),
    direction: v.string(),
    entryPrice: v.number(),
    exitPrice: v.optional(v.number()),
    modelProb: v.number(),
    outcome: v.optional(v.string()),
    pnlNet: v.optional(v.number()),
    live: v.boolean(),
    contractDate: v.string(),
  }).index("by_ts", ["ts"]).index("by_tradeId", ["tradeId"]).index("by_city", ["city", "ts"]),

  hamachi_pnl: defineTable({
    date: v.string(),
    trades: v.number(),
    wins: v.number(),
    pnl: v.number(),
    bankrollClose: v.number(),
    timestamp: v.number(),
  }).index("by_date", ["date"]),
});
