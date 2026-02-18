// @ts-nocheck
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function checkAuth(request: Request): boolean {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("Authorization");
  return authHeader === `Bearer ${secret}`;
}

// POST /api/sync/activity
http.route({
  path: "/api/sync/activity",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.sync.syncActivity, {
      agent: body.agent,
      action: body.action,
      title: body.title,
      description: body.description ?? "",
      status: body.status ?? "completed",
      timestamp: body.timestamp ?? Date.now(),
      metadata: body.metadata,
      duration: body.duration,
      tokensIn: body.tokensIn,
      tokensOut: body.tokensOut,
      cost: body.cost,
      sessionId: body.sessionId,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /api/sync/session
http.route({
  path: "/api/sync/session",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.sync.syncSession, {
      sessionId: body.sessionId,
      sessionKey: body.sessionKey ?? "",
      agent: body.agent,
      model: body.model ?? "unknown",
      status: body.status ?? "completed",
      startedAt: body.startedAt ?? Date.now(),
      endedAt: body.endedAt,
      tokensIn: body.tokensIn ?? 0,
      tokensOut: body.tokensOut ?? 0,
      cost: body.cost ?? 0,
      taskSummary: body.taskSummary,
      parentSessionId: body.parentSessionId,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /api/sync/agent-status
http.route({
  path: "/api/sync/agent-status",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.sync.syncAgentStatus, {
      agentId: body.agentId,
      status: body.status,
      currentTask: body.currentTask,
      tokensToday: body.tokensToday,
      tasksToday: body.tasksToday,
      lastActive: body.lastActive,
      costToday: body.costToday,
      costWeek: body.costWeek,
      costMonth: body.costMonth,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /api/sync/cron
http.route({
  path: "/api/sync/cron",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.sync.syncCronJobs, {
      jobs: body.jobs,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /api/sync/cost
http.route({
  path: "/api/sync/cost",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.sync.syncCostEntry, {
      agent: body.agent,
      model: body.model,
      tokensIn: body.tokensIn ?? 0,
      tokensOut: body.tokensOut ?? 0,
      cost: body.cost ?? 0,
      sessionId: body.sessionId,
      timestamp: body.timestamp ?? Date.now(),
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /api/sync/notification
http.route({
  path: "/api/sync/notification",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.sync.syncNotification, {
      channel: body.channel ?? "system",
      recipient: body.recipient ?? "josh",
      subject: body.subject,
      content: body.content ?? "",
      status: body.status ?? "unread",
      timestamp: body.timestamp ?? Date.now(),
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /api/sync/task
http.route({
  path: "/api/sync/task",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.sync.syncTask, {
      taskId: body.taskId,
      title: body.title,
      description: body.description ?? "",
      agent: body.agent,
      priority: body.priority ?? "p2",
      status: body.status ?? "up_next",
      dueDate: body.dueDate ?? undefined,
      createdAt: body.createdAt ?? Date.now(),
      updatedAt: body.updatedAt ?? Date.now(),
      completedAt: body.completedAt ?? undefined,
    });

    return jsonResponse({ ok: true });
  }),
});

// ORACLE SYNC ROUTES

// POST /syncOracleStatus
http.route({
  path: "/syncOracleStatus",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.oracle.syncOracleStatus, {
      agentId: body.agentId,
      status: body.status,
      model: body.model,
      uptimeSeconds: body.uptimeSeconds,
      totalTurns: body.totalTurns,
      totalTokens: body.totalTokens,
      usdcBalance: body.usdcBalance,
      ethBalance: body.ethBalance,
      lastActivityTimestamp: body.lastActivityTimestamp,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /syncOracleTrade
http.route({
  path: "/syncOracleTrade",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.oracle.syncOracleTrade, {
      tradeId: body.tradeId,
      marketId: body.marketId,
      marketQuestion: body.marketQuestion,
      outcome: body.outcome,
      side: body.side,
      price: body.price,
      quantity: body.quantity,
      amountUsd: body.amountUsd,
      strategy: body.strategy,
      pnl: body.pnl,
      closed: body.closed,
      timestamp: body.timestamp,
      closedAt: body.closedAt,
      stopLossPrice: body.stopLossPrice,
      notes: body.notes,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /syncOraclePosition
http.route({
  path: "/syncOraclePosition",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.oracle.syncOraclePosition, {
      positionId: body.positionId,
      marketId: body.marketId,
      marketQuestion: body.marketQuestion,
      outcome: body.outcome,
      entryPrice: body.entryPrice,
      currentPrice: body.currentPrice,
      unrealizedPnl: body.unrealizedPnl,
      positionSizeUsd: body.positionSizeUsd,
      strategy: body.strategy,
      timeHeldSeconds: body.timeHeldSeconds,
      timestamp: body.timestamp,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /syncOraclePnl
http.route({
  path: "/syncOraclePnl",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.oracle.syncOraclePnl, {
      date: body.date,
      totalRealizedPnl: body.totalRealizedPnl,
      todaysPnl: body.todaysPnl,
      unrealizedPnl: body.unrealizedPnl,
      winRate: body.winRate,
      roiPercent: body.roiPercent,
      totalTrades: body.totalTrades,
      winningTrades: body.winningTrades,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /syncOracleStrategyPerformance
http.route({
  path: "/syncOracleStrategyPerformance",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.oracle.syncOracleStrategyPerformance, {
      strategy: body.strategy,
      totalTrades: body.totalTrades,
      winningTrades: body.winningTrades,
      totalPnl: body.totalPnl,
      winRate: body.winRate,
      avgPnlPerTrade: body.avgPnlPerTrade,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /syncOracleActivityLog
http.route({
  path: "/syncOracleActivityLog",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.oracle.syncOracleActivityLog, {
      turnId: body.turnId,
      agentId: body.agentId,
      status: body.status,
      prompt: body.prompt,
      toolCalls: body.toolCalls,
      tokenUsage: body.tokenUsage,
      durationMs: body.durationMs,
      timestamp: body.timestamp,
    });

    return jsonResponse({ ok: true });
  }),
});

export default http;
