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
  })
    .index("by_agent", ["agent"])
    .index("by_next_run", ["nextRun"])
    .index("by_status", ["status"]),

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
    .index("by_parent", ["parentSessionId", "startedAt"]),

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
});
