#!/bin/bash
# check-and-sync.sh — triggered every 2 min by cron
# Checks Convex for a pending "Sync Now" request; fires sync if found.

CONVEX_URL="https://first-ram-850.convex.site"

result=$(curl -s --max-time 5 "$CONVEX_URL/api/check-pending-sync" 2>/dev/null)

if echo "$result" | grep -q '"pending":true'; then
  echo "[$(date)] Pending sync request found — running sync..."
  node /Users/anago/Projects/mission-control/scripts/sync-openclaw.mjs
  node /Users/anago/Projects/mission-control/scripts/sync-mako.mjs
  echo "[$(date)] Sync complete."
else
  echo "[$(date)] No pending sync request."
fi
