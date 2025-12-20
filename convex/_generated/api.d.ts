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
import type * as asaas_actions from "../asaas/actions.js";
import type * as asaas_index from "../asaas/index.js";
import type * as asaas_mutations from "../asaas/mutations.js";
import type * as asaas_queries from "../asaas/queries.js";
import type * as asaas_sync from "../asaas/sync.js";
import type * as asaas_webhooks from "../asaas/webhooks.js";
import type * as conversations from "../conversations.js";
import type * as crons from "../crons.js";
import type * as debug_access from "../debug_access.js";
import type * as debug_tool from "../debug_tool.js";
import type * as debug_users from "../debug_users.js";
import type * as emailMarketing from "../emailMarketing.js";
import type * as enrollments from "../enrollments.js";
import type * as fix_admin from "../fix_admin.js";
import type * as http from "../http.js";
import type * as inngest from "../inngest.js";
import type * as integrations from "../integrations.js";
import type * as integrations_actions from "../integrations/actions.js";
import type * as leads from "../leads.js";
import type * as lgpd from "../lgpd.js";
import type * as lib_asaas from "../lib/asaas.js";
import type * as lib_auditLogging from "../lib/auditLogging.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_brevo from "../lib/brevo.js";
import type * as lib_contextProcessor from "../lib/contextProcessor.js";
import type * as lib_encryption from "../lib/encryption.js";
import type * as lib_index from "../lib/index.js";
import type * as lib_inngest from "../lib/inngest.js";
import type * as lib_lgpdCompliance from "../lib/lgpdCompliance.js";
import type * as lib_lgpdDataRights from "../lib/lgpdDataRights.js";
import type * as lib_messaging from "../lib/messaging.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_securityHealth from "../lib/securityHealth.js";
import type * as lib_securityMiddleware from "../lib/securityMiddleware.js";
import type * as lib_validation from "../lib/validation.js";
import type * as messageTemplates from "../messageTemplates.js";
import type * as messages from "../messages.js";
import type * as metrics from "../metrics.js";
import type * as migrations from "../migrations.js";
import type * as migrations_syncExistingClerkUsers from "../migrations/syncExistingClerkUsers.js";
import type * as notifications from "../notifications.js";
import type * as scripts from "../scripts.js";
import type * as scripts_syncUsers from "../scripts/syncUsers.js";
import type * as settings from "../settings.js";
import type * as students from "../students.js";
import type * as studentsImport from "../studentsImport.js";
import type * as templates from "../templates.js";
import type * as transactionalEmails from "../transactionalEmails.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  "asaas/actions": typeof asaas_actions;
  "asaas/index": typeof asaas_index;
  "asaas/mutations": typeof asaas_mutations;
  "asaas/queries": typeof asaas_queries;
  "asaas/sync": typeof asaas_sync;
  "asaas/webhooks": typeof asaas_webhooks;
  conversations: typeof conversations;
  crons: typeof crons;
  debug_access: typeof debug_access;
  debug_tool: typeof debug_tool;
  debug_users: typeof debug_users;
  emailMarketing: typeof emailMarketing;
  enrollments: typeof enrollments;
  fix_admin: typeof fix_admin;
  http: typeof http;
  inngest: typeof inngest;
  integrations: typeof integrations;
  "integrations/actions": typeof integrations_actions;
  leads: typeof leads;
  lgpd: typeof lgpd;
  "lib/asaas": typeof lib_asaas;
  "lib/auditLogging": typeof lib_auditLogging;
  "lib/auth": typeof lib_auth;
  "lib/brevo": typeof lib_brevo;
  "lib/contextProcessor": typeof lib_contextProcessor;
  "lib/encryption": typeof lib_encryption;
  "lib/index": typeof lib_index;
  "lib/inngest": typeof lib_inngest;
  "lib/lgpdCompliance": typeof lib_lgpdCompliance;
  "lib/lgpdDataRights": typeof lib_lgpdDataRights;
  "lib/messaging": typeof lib_messaging;
  "lib/permissions": typeof lib_permissions;
  "lib/securityHealth": typeof lib_securityHealth;
  "lib/securityMiddleware": typeof lib_securityMiddleware;
  "lib/validation": typeof lib_validation;
  messageTemplates: typeof messageTemplates;
  messages: typeof messages;
  metrics: typeof metrics;
  migrations: typeof migrations;
  "migrations/syncExistingClerkUsers": typeof migrations_syncExistingClerkUsers;
  notifications: typeof notifications;
  scripts: typeof scripts;
  "scripts/syncUsers": typeof scripts_syncUsers;
  settings: typeof settings;
  students: typeof students;
  studentsImport: typeof studentsImport;
  templates: typeof templates;
  transactionalEmails: typeof transactionalEmails;
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
