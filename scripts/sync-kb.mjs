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
  
  // Push individual items for search — map to Convex schema fields only
  if (snapshot.recent_items?.length) {
    const items = snapshot.recent_items.slice(0, 200).map(item => ({
      item_id: item.id,
      title: item.title,
      ingested_at: item.ingested_at,
      primary_category: item.primary_category,
      source_type: item.source_type,
      ...(item.source_url != null && { source_url: item.source_url }),
      ...(item.content_summary != null && { content_summary: item.content_summary }),
      ...(item.quality_score != null && { quality_score: item.quality_score }),
      ...(item.freshness_score != null && { freshness_score: item.freshness_score }),
      ...(item.save_intent != null && { save_intent: item.save_intent }),
      ...(item.save_project != null && { save_project: item.save_project }),
      ...(item.times_referenced != null && { times_referenced: item.times_referenced }),
      ...(item.entity_names != null && { entity_names: item.entity_names }),
      ...(item.tags != null && { tags: item.tags }),
      ...(item.source_id != null && { source_id: item.source_id }),
    }));
    await client.mutation(api.kb.syncItems, { items });
  }
  
  console.log(`[kb-sync] Done. ${snapshot.stats?.total_items ?? 0} items, ${snapshot.stats?.open_gaps ?? 0} gaps.`);
}

main().catch(console.error);
