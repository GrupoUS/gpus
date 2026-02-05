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
import type * as asaas from "../asaas.js";
import type * as asaas_actions from "../asaas/actions.js";
import type * as asaas_actions_retry from "../asaas/actions/retry.js";
import type * as asaas_alerts from "../asaas/alerts.js";
import type * as asaas_audit from "../asaas/audit.js";
import type * as asaas_batchProcessor from "../asaas/batchProcessor.js";
import type * as asaas_client from "../asaas/client.js";
import type * as asaas_config from "../asaas/config.js";
import type * as asaas_conflictResolution from "../asaas/conflictResolution.js";
import type * as asaas_errors from "../asaas/errors.js";
import type * as asaas_export from "../asaas/export.js";
import type * as asaas_exportWorkers from "../asaas/exportWorkers.js";
import type * as asaas_helpers from "../asaas/helpers.js";
import type * as asaas_idempotency from "../asaas/idempotency.js";
import type * as asaas_importWorkers from "../asaas/importWorkers.js";
import type * as asaas_index from "../asaas/index.js";
import type * as asaas_monitoring from "../asaas/monitoring.js";
import type * as asaas_mutations from "../asaas/mutations.js";
import type * as asaas_organizationKeys from "../asaas/organizationKeys.js";
import type * as asaas_queries from "../asaas/queries.js";
import type * as asaas_queries_health from "../asaas/queries/health.js";
import type * as asaas_retry from "../asaas/retry.js";
import type * as asaas_sync from "../asaas/sync.js";
import type * as asaas_testPayloads from "../asaas/testPayloads.js";
import type * as asaas_test_sync from "../asaas/test_sync.js";
import type * as asaas_types from "../asaas/types.js";
import type * as asaas_validation from "../asaas/validation.js";
import type * as asaas_webhooks from "../asaas/webhooks.js";
import type * as clerk from "../clerk.js";
import type * as conversations from "../conversations.js";
import type * as crons from "../crons.js";
import type * as customFields from "../customFields.js";
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
import type * as lib_config from "../lib/config.js";
import type * as lib_contextProcessor from "../lib/contextProcessor.js";
import type * as lib_encryption from "../lib/encryption.js";
import type * as lib_index from "../lib/index.js";
import type * as lib_inngest from "../lib/inngest.js";
import type * as lib_lgpdCompliance from "../lib/lgpdCompliance.js";
import type * as lib_lgpdDataRights from "../lib/lgpdDataRights.js";
import type * as lib_masking from "../lib/masking.js";
import type * as lib_messaging from "../lib/messaging.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_securityHealth from "../lib/securityHealth.js";
import type * as lib_securityMiddleware from "../lib/securityMiddleware.js";
import type * as lib_typebot from "../lib/typebot.js";
import type * as lib_validation from "../lib/validation.js";
import type * as lib_validators from "../lib/validators.js";
import type * as marketingLeads from "../marketingLeads.js";
import type * as messageTemplates from "../messageTemplates.js";
import type * as messages from "../messages.js";
import type * as metrics from "../metrics.js";
import type * as migrationTrigger from "../migrationTrigger.js";
import type * as migrations from "../migrations.js";
import type * as migrations_syncExistingClerkUsers from "../migrations/syncExistingClerkUsers.js";
import type * as migrations_updateRoles from "../migrations/updateRoles.js";
import type * as notifications from "../notifications.js";
import type * as objections from "../objections.js";
import type * as referrals from "../referrals.js";
import type * as scripts from "../scripts.js";
import type * as scripts_syncUsers from "../scripts/syncUsers.js";
import type * as settings from "../settings.js";
import type * as students from "../students.js";
import type * as studentsImport from "../studentsImport.js";
import type * as tags from "../tags.js";
import type * as tasks from "../tasks.js";
import type * as tasks_crons from "../tasks/crons.js";
import type * as templates from "../templates.js";
import type * as test_helpers from "../test/helpers.js";
import type * as transactionalEmails from "../transactionalEmails.js";
import type * as users from "../users.js";
import type * as whatsapp from "../whatsapp.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  asaas: typeof asaas;
  "asaas/actions": typeof asaas_actions;
  "asaas/actions/retry": typeof asaas_actions_retry;
  "asaas/alerts": typeof asaas_alerts;
  "asaas/audit": typeof asaas_audit;
  "asaas/batchProcessor": typeof asaas_batchProcessor;
  "asaas/client": typeof asaas_client;
  "asaas/config": typeof asaas_config;
  "asaas/conflictResolution": typeof asaas_conflictResolution;
  "asaas/errors": typeof asaas_errors;
  "asaas/export": typeof asaas_export;
  "asaas/exportWorkers": typeof asaas_exportWorkers;
  "asaas/helpers": typeof asaas_helpers;
  "asaas/idempotency": typeof asaas_idempotency;
  "asaas/importWorkers": typeof asaas_importWorkers;
  "asaas/index": typeof asaas_index;
  "asaas/monitoring": typeof asaas_monitoring;
  "asaas/mutations": typeof asaas_mutations;
  "asaas/organizationKeys": typeof asaas_organizationKeys;
  "asaas/queries": typeof asaas_queries;
  "asaas/queries/health": typeof asaas_queries_health;
  "asaas/retry": typeof asaas_retry;
  "asaas/sync": typeof asaas_sync;
  "asaas/testPayloads": typeof asaas_testPayloads;
  "asaas/test_sync": typeof asaas_test_sync;
  "asaas/types": typeof asaas_types;
  "asaas/validation": typeof asaas_validation;
  "asaas/webhooks": typeof asaas_webhooks;
  clerk: typeof clerk;
  conversations: typeof conversations;
  crons: typeof crons;
  customFields: typeof customFields;
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
  "lib/config": typeof lib_config;
  "lib/contextProcessor": typeof lib_contextProcessor;
  "lib/encryption": typeof lib_encryption;
  "lib/index": typeof lib_index;
  "lib/inngest": typeof lib_inngest;
  "lib/lgpdCompliance": typeof lib_lgpdCompliance;
  "lib/lgpdDataRights": typeof lib_lgpdDataRights;
  "lib/masking": typeof lib_masking;
  "lib/messaging": typeof lib_messaging;
  "lib/permissions": typeof lib_permissions;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/securityHealth": typeof lib_securityHealth;
  "lib/securityMiddleware": typeof lib_securityMiddleware;
  "lib/typebot": typeof lib_typebot;
  "lib/validation": typeof lib_validation;
  "lib/validators": typeof lib_validators;
  marketingLeads: typeof marketingLeads;
  messageTemplates: typeof messageTemplates;
  messages: typeof messages;
  metrics: typeof metrics;
  migrationTrigger: typeof migrationTrigger;
  migrations: typeof migrations;
  "migrations/syncExistingClerkUsers": typeof migrations_syncExistingClerkUsers;
  "migrations/updateRoles": typeof migrations_updateRoles;
  notifications: typeof notifications;
  objections: typeof objections;
  referrals: typeof referrals;
  scripts: typeof scripts;
  "scripts/syncUsers": typeof scripts_syncUsers;
  settings: typeof settings;
  students: typeof students;
  studentsImport: typeof studentsImport;
  tags: typeof tags;
  tasks: typeof tasks;
  "tasks/crons": typeof tasks_crons;
  templates: typeof templates;
  "test/helpers": typeof test_helpers;
  transactionalEmails: typeof transactionalEmails;
  users: typeof users;
  whatsapp: typeof whatsapp;
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
