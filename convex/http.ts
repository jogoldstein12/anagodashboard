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

// GET /api/sync/pending — polled by Mac mini sync script
http.route({
  path: "/api/sync/pending",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const pending = await ctx.runQuery(internal.syncRequests.getPendingForHttp);
    return jsonResponse(pending);
  }),
});

// POST /api/sync/complete — called by sync script when done
http.route({
  path: "/api/sync/complete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const count = await ctx.runMutation(internal.syncRequests.fulfillPendingSync);
    // Also insert+fulfill a new request so lastFulfilledAt is always updated
    const id = await ctx.runMutation(internal.syncRequests.createFulfilled);
    return jsonResponse({ fulfilled: count, created: !!id });
  }),
});

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

    // Mark any pending sync requests as fulfilled
    await ctx.runMutation(internal.syncRequests.fulfillPendingSync);

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
      name: body.name,
      emoji: body.emoji,
      model: body.model,
      trustLevel: body.trustLevel,
      color: body.color,
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

// POST /api/sync/document
http.route({
  path: "/api/sync/document",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.documents.upsertByFilePath, {
      type: body.type ?? "document",
      title: body.title,
      content: body.content,
      agent: body.agent ?? "anago",
      filePath: body.filePath,
      tags: body.tags ?? [],
      timestamp: body.timestamp ?? Date.now(),
    });

    return jsonResponse({ ok: true });
  }),
});

// MAKO V2 SYNC ROUTES

// POST /api/sync/mako-status
http.route({
  path: "/api/sync/mako-status",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.mako.syncMakoStatus, {
      status: body.status,
      polyBalance: body.polyBalance,
      kalshiBalance: body.kalshiBalance,
      bankroll: body.bankroll,
      peakBankroll: body.peakBankroll,
      drawdownPct: body.drawdownPct,
      dailyPnl: body.dailyPnl,
      totalPnl: body.totalPnl,
      totalTrades: body.totalTrades,
      openPositions: body.openPositions,
      winRate: body.winRate,
      lastTradeAt: body.lastTradeAt,
      lastCrashAt: body.lastCrashAt,
      lastCrashReason: body.lastCrashReason,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /api/sync/mako-trade
http.route({
  path: "/api/sync/mako-trade",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.mako.syncMakoTrade, {
      tradeId: body.tradeId,
      ts: body.ts,
      strategy: body.strategy,
      eventId: body.eventId,
      legAPlatform: body.legAPlatform,
      legAMarket: body.legAMarket,
      legASide: body.legASide,
      legAPrice: body.legAPrice,
      legAContracts: body.legAContracts,
      legAStatus: body.legAStatus,
      legBPlatform: body.legBPlatform,
      legBMarket: body.legBMarket,
      legBSide: body.legBSide,
      legBPrice: body.legBPrice,
      legBContracts: body.legBContracts,
      legBStatus: body.legBStatus,
      expectedProfitCents: body.expectedProfitCents,
      actualProfitCents: body.actualProfitCents,
      status: body.status,
      resolutionDate: body.resolutionDate,
      notes: body.notes,
      dryRun: body.dryRun,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /api/sync/mako-pnl
http.route({
  path: "/api/sync/mako-pnl",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.mako.syncMakoPnl, {
      date: body.date,
      trades: body.trades,
      wins: body.wins,
      pnlCents: body.pnlCents,
      bankrollClose: body.bankrollClose,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /api/sync/mako-risk-event
http.route({
  path: "/api/sync/mako-risk-event",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.mako.syncMakoRiskEvent, {
      ts: body.ts,
      eventType: body.eventType,
      bankroll: body.bankroll,
      dailyPnl: body.dailyPnl,
      notes: body.notes,
    });

    return jsonResponse({ ok: true });
  }),
});

// UNI SYNC ROUTES

// POST /api/sync/uni-status
http.route({
  path: "/api/sync/uni-status",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.uni.syncUniStatus, {
      ticker: body.ticker,
      releaseDate: body.releaseDate,
      status: body.status,
      tradeDirection: body.tradeDirection,
      entryPrice: body.entryPrice,
      betSize: body.betSize,
      multiplier: body.multiplier,
      kalshiBalance: body.kalshiBalance,
      winRate: body.winRate,
      totalTrades: body.totalTrades,
      totalPnl: body.totalPnl,
      regime: body.regime,
      signalSummary: body.signalSummary,
      openPositionCount: body.openPositionCount,
      totalDeployed: body.totalDeployed,
      nextResolution: body.nextResolution,
      nowcastCpiMom: body.nowcastCpiMom,
      macroSignals: body.macroSignals,
      shockTriggerStatus: body.shockTriggerStatus,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /api/sync/uni-trade
http.route({
  path: "/api/sync/uni-trade",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.uni.syncUniTrade, {
      tradeId: body.tradeId,
      releaseDate: body.releaseDate,
      ticker: body.ticker,
      entryType: body.entryType,
      entryPrice: body.entryPrice,
      betSize: body.betSize,
      contracts: body.contracts,
      outcome: body.outcome,
      pnl: body.pnl,
      ...(body.currentMid !== undefined && { currentMid: body.currentMid }),
      ...(body.unrealizedPnl !== undefined && { unrealizedPnl: body.unrealizedPnl }),
      actualCpi: body.actualCpi,
      regime: body.regime,
      executedAt: body.executedAt,
      resolvedAt: body.resolvedAt,
    });

    return jsonResponse({ ok: true });
  }),
});

// HAMACHI SYNC ROUTES

// POST /api/sync/hamachi-status
http.route({
  path: "/api/sync/hamachi-status",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.hamachi.syncHamachiStatus, {
      status: body.status,
      bankroll: body.bankroll,
      deployed: body.deployed,
      peakBankroll: body.peakBankroll,
      dailyPnl: body.dailyPnl,
      totalPnl: body.totalPnl,
      openPositions: body.openPositions,
      totalTrades: body.totalTrades,
      wins: body.wins,
      winRate: body.winRate,
      dailyLossHalted: body.dailyLossHalted,
      lastTradeAt: body.lastTradeAt,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /api/sync/hamachi-trade
http.route({
  path: "/api/sync/hamachi-trade",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.hamachi.syncHamachiTrade, {
      tradeId: body.tradeId,
      ts: body.ts,
      city: body.city,
      ticker: body.ticker,
      strike: body.strike,
      direction: body.direction,
      entryPrice: body.entryPrice,
      exitPrice: body.exitPrice,
      modelProb: body.modelProb,
      outcome: body.outcome,
      pnlNet: body.pnlNet,
      live: body.live,
      contractDate: body.contractDate,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /api/sync/hamachi-pnl
http.route({
  path: "/api/sync/hamachi-pnl",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    await ctx.runMutation(internal.hamachi.syncHamachiPnl, {
      date: body.date,
      trades: body.trades,
      wins: body.wins,
      pnl: body.pnl,
      bankrollClose: body.bankrollClose,
    });

    return jsonResponse({ ok: true });
  }),
});

// POST /api/admin/clear-mako-history — wipes stale mako_trades + mako_pnl from Convex
http.route({
  path: "/api/admin/clear-mako-history",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const result = await ctx.runMutation(internal.mako.clearMakoHistory, {});
    return jsonResponse({ ok: true, ...result });
  }),
});

// POST /api/sync/purge-phantom-trades — delete mm_quote/mm_fill phantom rows, keep real cross_arb
http.route({
  path: "/api/sync/purge-phantom-trades",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const result = await ctx.runMutation(internal.mako.purgePhantomTrades, {});
    return jsonResponse({ ok: true, ...result });
  }),
});

// POST /api/sync/fulfill-sync-request — called at end of every sync run
http.route({
  path: "/api/sync/fulfill-sync-request",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    await ctx.runMutation(internal.syncRequests.fulfillPendingSync);
    return jsonResponse({ ok: true });
  }),
});

// GET /api/check-pending-sync — lightweight poll for "Sync Now" button watcher
http.route({
  path: "/api/check-pending-sync",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const result = await ctx.runQuery(internal.syncRequests.getPendingForHttp);
    return jsonResponse({ pending: result.pending, requestedAt: result.requestedAt });
  }),
});

export default http;
