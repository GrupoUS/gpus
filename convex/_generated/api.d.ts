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
import type * as http from "../http.js";
import type * as leads from "../leads.js";
import type * as lgpd from "../lgpd.js";
import type * as lib_auditLogging from "../lib/auditLogging.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_brevo from "../lib/brevo.js";
import type * as lib_encryption from "../lib/encryption.js";
import type * as lib_index from "../lib/index.js";
import type * as lib_lgpdCompliance from "../lib/lgpdCompliance.js";
import type * as lib_lgpdDataRights from "../lib/lgpdDataRights.js";
import type * as lib_messaging from "../lib/messaging.js";
import type * as lib_securityHealth from "../lib/securityHealth.js";
import type * as lib_securityMiddleware from "../lib/securityMiddleware.js";
import type * as lib_validation from "../lib/validation.js";
import type * as messageTemplates from "../messageTemplates.js";
import type * as messages from "../messages.js";
import type * as metrics from "../metrics.js";
import type * as students from "../students.js";
import type * as studentsImport from "../studentsImport.js";
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
  http: typeof http;
  leads: typeof leads;
  lgpd: typeof lgpd;
  "lib/auditLogging": typeof lib_auditLogging;
  "lib/auth": typeof lib_auth;
  "lib/brevo": typeof lib_brevo;
  "lib/encryption": typeof lib_encryption;
  "lib/index": typeof lib_index;
  "lib/lgpdCompliance": typeof lib_lgpdCompliance;
  "lib/lgpdDataRights": typeof lib_lgpdDataRights;
  "lib/messaging": typeof lib_messaging;
  "lib/securityHealth": typeof lib_securityHealth;
  "lib/securityMiddleware": typeof lib_securityMiddleware;
  "lib/validation": typeof lib_validation;
  messageTemplates: typeof messageTemplates;
  messages: typeof messages;
  metrics: typeof metrics;
  students: typeof students;
  studentsImport: typeof studentsImport;
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
