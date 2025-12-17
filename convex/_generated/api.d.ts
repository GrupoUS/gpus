/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activities from "../activities.js";
import type * as conversations from "../conversations.js";
import type * as debug_tool from "../debug_tool.js";
import type * as emailMarketing from "../emailMarketing.js";
import type * as enrollments from "../enrollments.js";
import type * as http from "../http.js";
import type * as leads from "../leads.js";
import type * as lgpd from "../lgpd.js";
import type * as lib_audit_logging from "../lib/audit-logging.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_brevo from "../lib/brevo.js";
import type * as lib_encryption from "../lib/encryption.js";
import type * as lib_index from "../lib/index.js";
import type * as lib_lgpd_compliance from "../lib/lgpd-compliance.js";
import type * as lib_lgpd_data_rights from "../lib/lgpd-data-rights.js";
import type * as lib_security_health from "../lib/security-health.js";
import type * as lib_security_middleware from "../lib/security-middleware.js";
import type * as lib_validation from "../lib/validation.js";
import type * as messageTemplates from "../messageTemplates.js";
import type * as messages from "../messages.js";
import type * as metrics from "../metrics.js";
import type * as students_import from "../students-import.js";
import type * as students from "../students.js";
import type * as templates from "../templates.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  conversations: typeof conversations;
  debug_tool: typeof debug_tool;
  emailMarketing: typeof emailMarketing;
  enrollments: typeof enrollments;
  http: typeof http;
  leads: typeof leads;
  lgpd: typeof lgpd;
  "lib/audit-logging": typeof lib_audit_logging;
  "lib/auth": typeof lib_auth;
  "lib/brevo": typeof lib_brevo;
  "lib/encryption": typeof lib_encryption;
  "lib/index": typeof lib_index;
  "lib/lgpd-compliance": typeof lib_lgpd_compliance;
  "lib/lgpd-data-rights": typeof lib_lgpd_data_rights;
  "lib/security-health": typeof lib_security_health;
  "lib/security-middleware": typeof lib_security_middleware;
  "lib/validation": typeof lib_validation;
  messageTemplates: typeof messageTemplates;
  messages: typeof messages;
  metrics: typeof metrics;
  "students-import": typeof students_import;
  students: typeof students;
  templates: typeof templates;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
