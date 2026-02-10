/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as agents from "../agents.js";
import type * as approvals from "../approvals.js";
import type * as costEntries from "../costEntries.js";
import type * as documents from "../documents.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as scheduledTasks from "../scheduledTasks.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as sync from "../sync.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  agents: typeof agents;
  approvals: typeof approvals;
  costEntries: typeof costEntries;
  documents: typeof documents;
  http: typeof http;
  notifications: typeof notifications;
  scheduledTasks: typeof scheduledTasks;
  seed: typeof seed;
  sessions: typeof sessions;
  sync: typeof sync;
  tasks: typeof tasks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
