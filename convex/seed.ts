// @ts-nocheck
import { mutation, type MutationCtx } from "./_generated/server";

export const clearAll = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const tables = ["activities", "scheduled_tasks", "documents", "agents", "tasks", "sessions", "notifications"] as const;
    let total = 0;
    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
        total++;
      }
    }
    return { deleted: total };
  },
});

export const seedAll = mutation({
  args: {},
  handler: async (ctx: MutationCtx, args: {}) => {
    const now = Date.now();
    const hour = 3600000;
    const day = 86400000;

    // --- Activities (25+ entries from Feb 9, 2026) ---
    const activities = [
      { agent: "anago", action: "task_completed", title: "First boot complete", description: "Met Josh, completed full setup with 6 models configured, Telegram paired, Reddit + Twitter logged in.", status: "completed", timestamp: now - 10 * hour },
      { agent: "anago", action: "browser_action", title: "Reviewed Twitter bookmarks", description: "Browsed 2 weeks of Josh's Twitter bookmarks for OpenClaw/ClawdBot best practices. Found multi-model cost optimization tips, agent leveling system, and shared context architecture.", status: "completed", timestamp: now - 9 * hour },
      { agent: "anago", action: "file_created", title: "Built multi-agent framework", description: "Designed 5-agent system: Anago (orchestrator), IQ (InstantIQ), GreenSea (real estate), Courtside (sports), After Dark (party game). Created AGENT-FRAMEWORK.md with 4-level trust system.", status: "completed", timestamp: now - 8 * hour },
      { agent: "anago", action: "file_created", title: "Created all agent SOUL.md files", description: "Wrote personality and context files for IQ, GreenSea, Courtside, and After Dark agents. Each with specialized knowledge and voice.", status: "completed", timestamp: now - 7.5 * hour },
      { agent: "iq", action: "task_completed", title: "First activation run", description: "Completed competitor audit, voice profile analysis, and landing page review. Key finding: Solvely has 100K users at ~$28/mo, Quizard has 2.9K ratings at 5.0★.", status: "completed", timestamp: now - 6 * hour },
      { agent: "iq", action: "search_performed", title: "Competitor audit complete", description: "Analyzed QuizSolverAI ($18.75/mo), Solvely (100K users), Quizard (5.0★ rating). InstantIQ's pricing ($4.99-$9.99) is significantly more competitive.", status: "completed", timestamp: now - 5.5 * hour },
      { agent: "iq", action: "browser_action", title: "Landing page review", description: "Reviewed instantiq.app landing page. P0 fixes needed: remove '100% accuracy' claim, remove 'thousands of students', fix comparison table.", status: "completed", timestamp: now - 5 * hour },
      { agent: "iq", action: "reddit_browsed", title: "Reddit warmup comments drafted", description: "Drafted 3 Reddit comments across 2 subreddits for Josh's review. Focused on helpful, authentic builder voice.", status: "completed", timestamp: now - 4.5 * hour },
      { agent: "anago", action: "file_created", title: "Fixed DeepSeek/Moonshot integration", description: "Added models.providers entries for deepseek (api.deepseek.com) and moonshot (api.moonshot.cn). Default sub-agent model now deepseek/deepseek-chat for massive cost savings.", status: "completed", timestamp: now - 4 * hour },
      { agent: "anago", action: "email_sent", title: "Sent Reddit comment opportunities", description: "Generated and emailed Reddit comment opportunities to Josh via gog CLI. Found 7 recent posts across 6 key subreddits.", status: "completed", timestamp: now - 3.5 * hour },
      { agent: "anago", action: "cron_executed", title: "Reddit cron job executed", description: "First successful execution of scheduled Reddit comment opportunities cron job at 4:55 PM. Automated search across 6 key subreddits.", status: "completed", timestamp: now - 3 * hour },
      { agent: "iq", action: "reddit_browsed", title: "Reddit post proposals ready", description: "Found 3 Reddit posts for commenting: r/StudyTips (TTS tip), r/sideprojects (n8n workflow), r/micro_saas (vibe-coding costs). Proposed comments in Josh's voice.", status: "completed", timestamp: now - 2.5 * hour },
      { agent: "anago", action: "browser_action", title: "Posted Reddit comment", description: "Attempted to post comment on r/sideprojects n8n workflow post. Reddit's rich text editor required manual paste — Josh posted directly.", status: "completed", timestamp: now - 2 * hour },
      { agent: "anago", action: "email_sent", title: "Gmail OAuth configured", description: "Set up gog CLI with Google OAuth for anagobot26@gmail.com. Successfully sent test email to Josh.", status: "completed", timestamp: now - 1.5 * hour },
      { agent: "anago", action: "cron_executed", title: "4 Reddit cron jobs created", description: "Scheduled daily Reddit comment opportunity emails at 9am, 10:30am, 12pm, and 3pm EST. Each runs on DeepSeek for cost efficiency.", status: "completed", timestamp: now - 1 * hour },
      { agent: "iq", action: "email_sent", title: "Test Reddit opportunities email sent", description: "Sent test email with 8 Reddit posts across target subreddits. Each with ready-to-paste comments in Josh's builder voice.", status: "completed", timestamp: now - 0.5 * hour },
      { agent: "anago", action: "task_completed", title: "Mission Control dashboard started", description: "Began building Mission Control dashboard with Next.js 15, Convex, and macOS glass UI. Three features: Activity Feed, Calendar, Global Search.", status: "in_progress", timestamp: now },
      { agent: "greensea", action: "task_completed", title: "Agent registered", description: "GreenSea agent created for Green Sea Real Estate Partners. Focused on Cleveland affordable housing portfolio, $200M fundraise.", status: "completed", timestamp: now - 7 * hour },
      { agent: "courtside", action: "task_completed", title: "Agent registered", description: "Courtside agent created for Courtside Sports Advisors. Focused on LOVB Miami franchise, $6.8M funding target.", status: "completed", timestamp: now - 7 * hour },
      { agent: "afterdark", action: "task_completed", title: "Agent registered", description: "After Dark agent created for After Hours Party Game. PWA with 500+ prompts, neon-styled pass-the-phone mechanic.", status: "completed", timestamp: now - 7 * hour },
      { agent: "anago", action: "message_sent", title: "Telegram message to Josh", description: "Sent IQ's competitor audit results and Reddit warmup comments to Josh on Telegram for review.", status: "completed", timestamp: now - 4 * hour },
      { agent: "iq", action: "file_created", title: "Reddit Launch Playbook saved", description: "Extracted 60K-char Reddit Launch Playbook from Josh's Claude History. Saved to projects/instantiq/REDDIT_LAUNCH_PLAYBOOK.md.", status: "completed", timestamp: now - 6.5 * hour },
      { agent: "iq", action: "file_created", title: "InstantIQ docs organized", description: "Saved all 8 InstantIQ project docs to projects/instantiq/docs/ — README, ROADMAP, deployment guides, etc.", status: "completed", timestamp: now - 6.5 * hour },
    ];

    for (const a of activities) {
      await ctx.db.insert("activities", a);
    }

    // --- Scheduled Tasks ---
    const tasks = [
      { name: "Reddit Comments - 9am", agent: "anago", schedule: "Weekdays at 9:00 AM", cronExpr: "0 9 * * 1-5", timezone: "America/New_York", nextRun: now + 16 * hour, status: "active", description: "Browse Reddit for 5-7 comment opportunities. Generate ready-to-paste comments in Josh's voice. Email results to jogoldstein12@gmail.com." },
      { name: "Reddit Comments - 10:30am", agent: "anago", schedule: "Weekdays at 10:30 AM", cronExpr: "30 10 * * 1-5", timezone: "America/New_York", nextRun: now + 17.5 * hour, status: "active", description: "Mid-morning Reddit scan. Find fresh posts for karma building. Email suggestions." },
      { name: "Reddit Comments - 12pm", agent: "anago", schedule: "Weekdays at 12:00 PM", cronExpr: "0 12 * * 1-5", timezone: "America/New_York", nextRun: now + 19 * hour, status: "active", description: "Midday Reddit scan. Focus on lunchtime engagement windows. Email suggestions." },
      { name: "Reddit Comments - 3pm", agent: "anago", schedule: "Weekdays at 3:00 PM", cronExpr: "0 15 * * 1-5", timezone: "America/New_York", nextRun: now + 22 * hour, status: "active", description: "Afternoon Reddit scan. Catch late-day posts before evening. Email suggestions." },
      { name: "Heartbeat - Full Check", agent: "anago", schedule: "Every 30 min (8am-4pm)", cronExpr: "*/30 8-15 * * *", timezone: "America/New_York", nextRun: now + 0.5 * hour, status: "active", description: "Full heartbeat check: email, calendar, Reddit monitoring, Twitter notifications, weather. Rotate through checks 2-4 times per day." },
      { name: "EOD Report", agent: "anago", schedule: "Weekdays at 5:00 PM", cronExpr: "0 17 * * 1-5", timezone: "America/New_York", nextRun: now + day, status: "active", description: "End-of-day summary report for all agents. What was accomplished, blockers, next steps." },
      { name: "Morning Report", agent: "anago", schedule: "Weekdays at 9:00 AM", cronExpr: "0 9 * * 1-5", timezone: "America/New_York", nextRun: now + 16 * hour, status: "active", description: "Morning briefing: overnight work summary, today's priorities, calendar events." },
    ];

    for (const t of tasks) {
      await ctx.db.insert("scheduled_tasks", t);
    }

    // --- Documents ---
    const documents = [
      { type: "memory", title: "MEMORY.md - Long-Term Memory", content: "First boot Feb 9 2026. Met Josh in NYC. Full setup complete: 6 models configured, Telegram paired. Josh's businesses: Green Sea REP (affordable housing, Cleveland), Courtside Sports (LOVB volleyball), InstantIQ (Chrome extension), After Hours (party game). Key partner Nicholas Fair. Fiancée Tal, wedding May/June 2027 Europe. Current priorities: InstantIQ launch, taxes (April 15), Green Sea $200M fundraise.", agent: "anago", filePath: "MEMORY.md", tags: ["memory", "long-term", "context"], timestamp: now - 10 * hour },
      { type: "memory", title: "Daily Notes - Feb 9, 2026", content: "Built multi-agent framework with 5 agents and 4-level trust system. IQ agent activated and completed competitor audit. Reddit comment strategy initiated. Gmail OAuth configured. 4 daily Reddit cron jobs scheduled.", agent: "anago", filePath: "memory/2026-02-09.md", tags: ["memory", "daily", "feb-2026"], timestamp: now },
      { type: "document", title: "AGENT-FRAMEWORK.md", content: "Multi-agent framework: Anago (L3 Operator, Opus), IQ (L1 Observer, Kimi), GreenSea (L1 Observer, Kimi), Courtside (L1 Observer, Haiku), After Dark (L1 Observer, Haiku). Trust levels: L1 Observer, L2 Advisor, L3 Operator, L4 Autonomous.", agent: "anago", filePath: "AGENT-FRAMEWORK.md", tags: ["framework", "agents", "architecture"], timestamp: now - 8 * hour },
      { type: "document", title: "Reddit Launch Playbook", content: "InstantIQ Reddit launch strategy. 4 phases across 14 subreddits. Phase 1: Karma building with helpful comments. Phase 2: Soft mentions in relevant threads. Phase 3: Launch post in r/SideProject. Phase 4: Cross-post to education subreddits.", agent: "iq", filePath: "projects/instantiq/REDDIT_LAUNCH_PLAYBOOK.md", tags: ["reddit", "marketing", "instantiq", "launch"], timestamp: now - 6 * hour },
      { type: "document", title: "InstantIQ README", content: "AI-powered quiz answer Chrome extension. GPT-4 Vision + Claude 3.5 Sonnet. Six modes: Solve, Explain, Translate, Calculate, Extract, Rewrite. $4.99 Pro / $9.99 Unlimited pricing.", agent: "iq", filePath: "projects/instantiq/docs/README.md", tags: ["instantiq", "product", "docs"], timestamp: now - 6 * hour },
      { type: "document", title: "IQ Competitor Audit", content: "Solvely: 100K users, ~$28/mo. Quizard: 2.9K ratings, 5.0★. QuizSolverAI: $18.75/mo. InstantIQ advantage: speed (sub-5s), price ($4.99-$9.99 vs $19-$40/mo).", agent: "iq", tags: ["competitors", "instantiq", "market-research"], timestamp: now - 5.5 * hour },
      { type: "document", title: "Green Sea Portfolio Overview", content: "100+ Cleveland properties, section 8 voucher tenants. 10.0% unlevered YOC. Expansion targets: Detroit and Rust Belt markets. Working toward $200M fund raise for affordable housing acquisitions.", agent: "greensea", tags: ["real-estate", "portfolio", "cleveland"], timestamp: now - 7 * hour },
      { type: "document", title: "Courtside LOVB Franchise", content: "LOVB Miami franchise opportunity. $6.8M funding target. League One Volleyball. Partner: Robert Jakobi.", agent: "courtside", tags: ["sports", "lovb", "miami", "franchise"], timestamp: now - 7 * hour },
      { type: "document", title: "After Hours Party Game", content: "Adult party game PWA. Neon-styled, pass-the-phone mechanic. 500+ prompts. NSFW levels: Mild, Medium, Extreme. Next.js 15, TypeScript, Tailwind CSS.", agent: "afterdark", tags: ["party-game", "pwa", "product"], timestamp: now - 7 * hour },
      { type: "document", title: "SOUL.md - Who I Am", content: "Name: Anago. Creature: AI assistant, co-worker, best friend. Trust Level L3 Operator. Orchestrates all specialist agents. Be genuinely helpful, have opinions, be resourceful before asking.", agent: "anago", filePath: "SOUL.md", tags: ["identity", "soul", "personality"], timestamp: now - 10 * hour },
      { type: "document", title: "USER.md - About Josh", content: "Josh Goldstein. NYC. Entrepreneur and real estate investor. Self-taught developer. Businesses: Green Sea REP, Courtside Sports, InstantIQ, After Hours. Fiancée Tal. Loves Jeopardy, golf. Work hours 9-5 EST.", agent: "anago", filePath: "USER.md", tags: ["user", "josh", "context"], timestamp: now - 10 * hour },
      { type: "task", title: "InstantIQ Chrome Web Store submission", content: "InstantIQ submitted to Chrome Web Store. Waiting for approval. Reddit launch strategy ready with 13 subreddits. Landing page needs P0 fixes.", agent: "iq", tags: ["instantiq", "launch", "chrome-store"], timestamp: now - 6 * hour },
      { type: "task", title: "Taxes - April 15 deadline", content: "Personal year-end taxes + business taxes. Deadline April 15, 2026. Accountant: David Roer (personal), Kevin Marchiony (bookkeeper).", agent: "anago", tags: ["taxes", "deadline", "finance"], timestamp: now - 10 * hour },
    ];

    for (const d of documents) {
      await ctx.db.insert("documents", d);
    }

    // --- Agents ---
    const agentsData = [
      { agentId: "anago", name: "Anago", emoji: "🍣", model: "claude-opus-4-6", trustLevel: "L3", status: "active", color: "#3b82f6", currentTask: "Building Mission Control dashboard", tokensToday: 45200, tasksToday: 12, tasksTotal: 47, lastActive: now },
      { agentId: "iq", name: "IQ", emoji: "⚡", model: "kimi-k2.5", trustLevel: "L1", status: "active", color: "#22c55e", currentTask: "Reddit karma building", tokensToday: 18400, tasksToday: 5, tasksTotal: 14, lastActive: now - 0.5 * hour },
      { agentId: "greensea", name: "GreenSea", emoji: "🏠", model: "kimi-k2.5", trustLevel: "L1", status: "idle", color: "#10b981", tokensToday: 0, tasksToday: 0, tasksTotal: 1, lastActive: now - 7 * hour },
      { agentId: "courtside", name: "Courtside", emoji: "🏐", model: "claude-haiku-3.5", trustLevel: "L1", status: "idle", color: "#f97316", tokensToday: 0, tasksToday: 0, tasksTotal: 1, lastActive: now - 7 * hour },
      { agentId: "afterdark", name: "After Dark", emoji: "🎉", model: "claude-haiku-3.5", trustLevel: "L1", status: "offline", color: "#a855f7", tokensToday: 0, tasksToday: 0, tasksTotal: 1, lastActive: now - 7 * hour },
    ];
    for (const a of agentsData) {
      await ctx.db.insert("agents", a);
    }

    // --- Tasks (kanban) ---
    const kanbanTasks = [
      { title: "Monitor Chrome Web Store submission", description: "Check CWS approval status daily for InstantIQ extension", agent: "iq", priority: "p0", status: "in_progress", createdAt: now - 1 * day, updatedAt: now, subtasks: [
        { title: "Submit extension to CWS", status: "done", completedAt: now - 1 * day },
        { title: "Wait for initial review", status: "in_progress" },
        { title: "Fix issues if rejected", status: "pending" },
        { title: "Confirm live in store", status: "pending" },
      ]},
      { title: "Landing page P0 fixes", description: "Remove '100% accuracy' claim, remove 'thousands of students', fix comparison table on instantiq.app", agent: "iq", priority: "p0", status: "up_next", createdAt: now - 0.5 * day, updatedAt: now, subtasks: [
        { title: "Remove '100% accuracy' claim", status: "pending" },
        { title: "Remove 'thousands of students' copy", status: "pending" },
        { title: "Fix comparison table layout", status: "pending" },
        { title: "Add real testimonials / social proof", status: "pending" },
      ]},
      { title: "Reddit karma building", description: "Post helpful comments in target subreddits to build u/nerlenscrafter karma before launch", agent: "iq", priority: "p1", status: "in_progress", createdAt: now - 1 * day, updatedAt: now, subtasks: [
        { title: "Draft 10 helpful comments", status: "done", completedAt: now - 3 * hour },
        { title: "Post in r/SideProject", status: "done", completedAt: now - 2 * hour },
        { title: "Post in r/chrome_extensions", status: "in_progress" },
        { title: "Build to 50+ karma", status: "pending" },
        { title: "Engage in 3+ threads per day", status: "pending" },
      ]},
      { title: "Competitor deep-dive report", description: "Detailed analysis of Solvely, Quizard, QuizSolverAI pricing, features, reviews, and weaknesses", agent: "iq", priority: "p1", status: "done", completedAt: now - 3 * hour, createdAt: now - 1 * day, updatedAt: now },
      { title: "Activate GreenSea agent", description: "Set up GreenSea agent context, priorities, and first tasks for Cleveland portfolio management", agent: "anago", priority: "p2", status: "backlog", createdAt: now - 0.5 * day, updatedAt: now },
      { title: "Taxes - organize docs", description: "Start organizing tax documents for April 15 deadline. Personal + business taxes.", agent: "anago", priority: "p1", status: "backlog", dueDate: now + 64 * day, createdAt: now - 1 * day, updatedAt: now },
      { title: "Twitter Bookmarks Digest setup", description: "Configure daily email digest of Josh's Twitter bookmarks with actionable improvements", agent: "anago", priority: "p1", status: "done", completedAt: now - 2 * hour, createdAt: now - 0.5 * day, updatedAt: now },
      { title: "Mission Control dashboard", description: "Build full Mission Control dashboard with all pages: Activity, Calendar, Search, Agents, Swarm, Tasks, Costs, Memory, Notifications, Settings", agent: "anago", priority: "p0", status: "in_progress", createdAt: now - 0.5 * day, updatedAt: now, subtasks: [
        { title: "Phase 1: Data Layer (Convex)", status: "done", completedAt: now - 12 * hour },
        { title: "Phase 2: Shared UI Components", status: "done", completedAt: now - 10 * hour },
        { title: "Phase 3: Activity Feed", status: "done", completedAt: now - 8 * hour },
        { title: "Phase 4: Agent Pages", status: "done", completedAt: now - 6 * hour },
        { title: "Phase 5: Tasks Page", status: "done", completedAt: now - 4 * hour },
        { title: "Phase 6: Costs Dashboard", status: "done", completedAt: now - 3 * hour },
        { title: "Phase 7: Memory Browser", status: "done", completedAt: now - 2 * hour },
        { title: "Phase 8: Notifications", status: "done", completedAt: now - 1.5 * hour },
        { title: "Phase 9: Settings", status: "done", completedAt: now - 1 * hour },
        { title: "Phase 10: Seed Data + Polish", status: "done", completedAt: now - 0.5 * hour },
      ]},
      { title: "Product Hunt launch prep", description: "Prepare Product Hunt launch page for InstantIQ if applicable", agent: "iq", priority: "p2", status: "backlog", createdAt: now - 1 * day, updatedAt: now },
      { title: "Polymarket trading engine research", description: "Research automated trading strategies for Polymarket prediction markets", agent: "anago", priority: "p2", status: "in_progress", createdAt: now - 0.3 * day, updatedAt: now },
    ];
    for (const t of kanbanTasks) {
      await ctx.db.insert("tasks", t);
    }

    // --- Sessions ---
    const sessionsData = [
      { sessionId: "main-001", sessionKey: "agent:main:main", agent: "anago", model: "claude-opus-4-6", status: "active", startedAt: now - 10 * hour, tokensIn: 32000, tokensOut: 13200, cost: 0.8540, taskSummary: "Main session — full setup, agent framework, Mission Control" },
      { sessionId: "iq-001", sessionKey: "agent:main:subagent:iq-001", agent: "iq", parentSessionId: "main-001", model: "deepseek-chat", status: "completed", startedAt: now - 6 * hour, endedAt: now - 5 * hour, tokensIn: 14200, tokensOut: 5800, cost: 0.0028, taskSummary: "Competitor audit + landing page review" },
      { sessionId: "iq-002", sessionKey: "agent:main:subagent:iq-002", agent: "iq", parentSessionId: "main-001", model: "deepseek-chat", status: "completed", startedAt: now - 4.5 * hour, endedAt: now - 4 * hour, tokensIn: 11000, tokensOut: 4500, cost: 0.0022, taskSummary: "Reddit warmup comments drafting" },
      { sessionId: "reddit-cron-001", sessionKey: "agent:main:cron:reddit-9am", agent: "anago", model: "deepseek-chat", status: "completed", startedAt: now - 3 * hour, endedAt: now - 2.9 * hour, tokensIn: 8500, tokensOut: 3200, cost: 0.0016, taskSummary: "Reddit cron: 7 comment opportunities found" },
      { sessionId: "twitter-001", sessionKey: "agent:main:cron:twitter-digest", agent: "anago", model: "deepseek-chat", status: "completed", startedAt: now - 1 * hour, endedAt: now - 0.5 * hour, tokensIn: 22000, tokensOut: 8400, cost: 0.0042, taskSummary: "Twitter bookmarks daily digest compiled and emailed" },
      { sessionId: "mc-phase2", sessionKey: "agent:main:subagent:mc-phase2", agent: "anago", parentSessionId: "main-001", model: "deepseek-chat", status: "completed", startedAt: now - 2 * hour, endedAt: now - 1.5 * hour, tokensIn: 18000, tokensOut: 12000, cost: 0.0042, taskSummary: "Mission Control Phase 2: shared UI components" },
    ];
    for (const s of sessionsData) {
      await ctx.db.insert("sessions", s);
    }

    // --- Notifications ---
    const notificationsData = [
      { channel: "telegram", recipient: "Josh (6491266739)", subject: "IQ Competitor Audit", content: "Competitor audit complete! Solvely: 100K users at ~$28/mo. Quizard: 2.9K ratings at 5.0★. QuizSolverAI: $18.75/mo. InstantIQ's pricing ($4.99-$9.99) is our biggest differentiator.", status: "delivered", timestamp: now - 4 * hour },
      { channel: "telegram", recipient: "Josh (6491266739)", subject: "Reddit Comment Picks", content: "Top 3 Reddit comment opportunities: r/chrome_extensions x2, r/indiehackers x1. Comments drafted in your voice — casual, helpful, zero self-promo. Ready to paste.", status: "delivered", timestamp: now - 3.5 * hour },
      { channel: "email", recipient: "jogoldstein12@gmail.com", subject: "Reddit Comment Opportunities - Morning", content: "6 Reddit posts found across target subreddits. Each with a ready-to-paste comment in your builder voice. Top picks: r/Entrepreneur 'How to get first 5 users' thread.", status: "sent", timestamp: now - 2.5 * hour },
      { channel: "email", recipient: "jogoldstein12@gmail.com", subject: "🐦 Daily Twitter Bookmarks Digest — Feb 10, 2026", content: "3 bookmarks from last 24h: ClawRouter cost optimization (70% savings), Claude Code WebSocket hack, OpenClaw security concerns. 6 proposed improvements.", status: "sent", timestamp: now - 0.5 * hour },
      { channel: "telegram", recipient: "Josh (6491266739)", subject: "Phase 5 Complete", content: "✅ Phase 5 complete — Tasks Page. Kanban board with 4 columns, glass-panel task cards, agent/priority filters, stats row.", status: "sent", timestamp: now },
    ];
    for (const n of notificationsData) {
      await ctx.db.insert("notifications", n);
    }

    return { activities: activities.length, scheduledTasks: tasks.length, documents: documents.length, agents: agentsData.length, tasks: kanbanTasks.length, sessions: sessionsData.length, notifications: notificationsData.length };
  },
});
