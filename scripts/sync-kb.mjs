#!/usr/bin/env node
// scripts/sync-kb.mjs
// Usage: node scripts/sync-kb.mjs
// Runs: python3 .../cli.py export --json → pushes to Convex

import { execSync } from 'child_process';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const KB_CLI = '/Users/anago/.openclaw/workspace/projects/knowledge-base/cli.py';
const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

async function main() {
  console.log('[kb-sync] Exporting KB snapshot...');
  
  let snapshot;
  try {
    const output = execSync(`python3 ${KB_CLI} export --json`, { 
      encoding: 'utf8',
      timeout: 60000 
    });
    snapshot = JSON.parse(output);
  } catch (e) {
    console.error('[kb-sync] KB export failed:', e.message);
    // Graceful fail — don't crash the heartbeat
    process.exit(0);
  }

  const client = new ConvexHttpClient(CONVEX_URL);
  
  // Push snapshot
  await client.mutation(api.kb.upsertSnapshot, { snapshot });
  
  // Push individual items for search
  if (snapshot.recent_items?.length) {
    await client.mutation(api.kb.syncItems, { items: snapshot.recent_items.slice(0, 200) });
  }
  
  console.log(`[kb-sync] Done. ${snapshot.stats?.total_items ?? 0} items, ${snapshot.stats?.open_gaps ?? 0} gaps.`);
}

main().catch(console.error);
