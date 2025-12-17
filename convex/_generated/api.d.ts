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
import type * as conversations from "../conversations.js";
import type * as debug_tool from "../debug_tool.js";
import type * as emailMarketing from "../emailMarketing.js";
import type * as enrollments from "../enrollments.js";
import type * as leads from "../leads.js";
import type * as lgpd from "../lgpd.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_brevo from "../lib/brevo.js";
import type * as messageTemplates from "../messageTemplates.js";
import type * as messages from "../messages.js";
import type * as metrics from "../metrics.js";
import type * as students from "../students.js";
import type * as students_import from "../students-import.js";
import type * as templates from "../templates.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  conversations: typeof conversations;
  debug_tool: typeof debug_tool;
  emailMarketing: typeof emailMarketing;
  enrollments: typeof enrollments;
  leads: typeof leads;
  lgpd: typeof lgpd;
  "lib/auth": typeof lib_auth;
  "lib/brevo": typeof lib_brevo;
  messageTemplates: typeof messageTemplates;
  messages: typeof messages;
  metrics: typeof metrics;
  students: typeof students;
  "students-import": typeof students_import;
  templates: typeof templates;
  users: typeof users;
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
