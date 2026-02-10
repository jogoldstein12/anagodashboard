#!/usr/bin/env node
/**
 * Dump OpenClaw session data to JSON for the sync script.
 * Called by Anago during heartbeats/sync via: node scripts/dump-sessions.mjs
 * 
 * This reads from stdin (piped from openclaw session-related commands)
 * or accepts --data <json> argument.
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DUMP_PATH = resolve(__dirname, ".sessions-dump.json");

// Accept data from --data argument
const dataIdx = process.argv.indexOf("--data");
if (dataIdx > -1 && process.argv[dataIdx + 1]) {
  const data = JSON.parse(process.argv[dataIdx + 1]);
  writeFileSync(DUMP_PATH, JSON.stringify(data, null, 2));
  console.log(`✅ Dumped ${data.sessions?.length || 0} sessions to ${DUMP_PATH}`);
  process.exit(0);
}

// Or read from stdin
let input = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => input += chunk);
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    writeFileSync(DUMP_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Dumped ${data.sessions?.length || 0} sessions to ${DUMP_PATH}`);
  } catch (err) {
    console.error("❌ Invalid JSON input:", err.message);
    process.exit(1);
  }
});
