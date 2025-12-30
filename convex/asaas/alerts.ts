/**
 * Asaas Alerts System
 *
 * Creates, updates, and manages alerts for Asaas integration issues.
 * Includes automated alert checking and deduplication.
 */

import { v } from "convex/values";
import { internalMutation, internalAction, mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";

// ═══════════════════════════════════════════════════════
// INTERNAL MUTATIONS (for workers and actions)
// ═══════════════════════════════════════════════════════

/**
 * Create a new alert or update existing alert (increment count)
 * Implements alert deduplication by type + entity
 */
export const createAlert = internalMutation({
  args: {
    alertType: v.union(
      v.literal("api_error"),
      v.literal("sync_failure"),
      v.literal("rate_limit"),
      v.literal("webhook_timeout"),
      v.literal("duplicate_detection"),
      v.literal("data_integrity"),
    ),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
    title: v.string(),
    message: v.string(),
    details: v.optional(v.any()),
    studentId: v.optional(v.id("students")),
    paymentId: v.optional(v.id("asaasPayments")),
    subscriptionId: v.optional(v.id("asaasSubscriptions")),
    syncLogId: v.optional(v.id("asaasSyncLogs")),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing active alert with same type and entity
    const existing = await findExistingAlert(ctx, args);

    if (existing) {
      // Update existing alert
      await ctx.db.patch(existing._id, {
        count: existing.count + 1,
        lastSeenAt: now,
        updatedAt: now,
        // Keep the highest severity
        severity: compareSeverity(args.severity, existing.severity),
      });

      return existing._id;
    }

    // Create new alert
    const alertId = await ctx.db.insert("asaasAlerts", {
      alertType: args.alertType,
      severity: args.severity,
      status: "active",
      title: args.title,
      message: args.message,
      details: args.details,
      studentId: args.studentId,
      paymentId: args.paymentId,
      subscriptionId: args.subscriptionId,
      syncLogId: args.syncLogId,
      organizationId: args.organizationId,
      count: 1,
      firstSeenAt: now,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return alertId;
  },
});

/**
 * Resolve an alert
 */
export const resolveAlert = internalMutation({
  args: {
    alertId: v.id("asaasAlerts"),
    resolvedBy: v.optional(v.string()),
    resolutionNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const alert = await ctx.db.get(args.alertId);

    if (!alert) {
      throw new Error(`Alert ${args.alertId} not found`);
    }

    await ctx.db.patch(args.alertId, {
      status: "resolved",
      resolvedAt: now,
      resolvedBy: args.resolvedBy,
      resolutionNote: args.resolutionNote,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Acknowledge an alert (mark as seen but not resolved)
 */
export const acknowledgeAlert = internalMutation({
  args: {
    alertId: v.id("asaasAlerts"),
    acknowledgedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const alert = await ctx.db.get(args.alertId);

    if (!alert) {
      throw new Error(`Alert ${args.alertId} not found`);
    }

    await ctx.db.patch(args.alertId, {
      status: "acknowledged",
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Suppress alerts for a specific period
 */
export const suppressAlert = internalMutation({
  args: {
    alertId: v.id("asaasAlerts"),
    suppressUntil: v.number(), // Timestamp
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const alert = await ctx.db.get(args.alertId);

    if (!alert) {
      throw new Error(`Alert ${args.alertId} not found`);
    }

    await ctx.db.patch(args.alertId, {
      status: "suppressed",
      suppressedUntil: args.suppressUntil,
      updatedAt: now,
    });

    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════
// PUBLIC MUTATIONS (for UI)
// ═══════════════════════════════════════════════════════

/**
 * Public mutation to resolve an alert
 */
export const resolveAlertPublic = mutation({
  args: {
    alertId: v.id("asaasAlerts"),
    resolutionNote: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // @ts-ignore - Deep type instantiation
    return await ctx.runMutation(internal.asaas.alerts.resolveAlert, {
      alertId: args.alertId,
      resolvedBy: identity.subject,
      resolutionNote: args.resolutionNote,
    });
  },
});

/**
 * Public mutation to acknowledge an alert
 */
export const acknowledgeAlertPublic = mutation({
  args: {
    alertId: v.id("asaasAlerts"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // @ts-ignore - Deep type instantiation
    return await ctx.runMutation(internal.asaas.alerts.acknowledgeAlert, {
      alertId: args.alertId,
      acknowledgedBy: identity.subject,
    });
  },
});

/**
 * Public mutation to suppress an alert
 */
export const suppressAlertPublic = mutation({
  args: {
    alertId: v.id("asaasAlerts"),
    suppressForHours: v.number(), // How long to suppress
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const suppressUntil = Date.now() + args.suppressForHours * 60 * 60 * 1000;

    // @ts-ignore - Deep type instantiation
    return await ctx.runMutation(internal.asaas.alerts.suppressAlert, {
      alertId: args.alertId,
      suppressUntil,
    });
  },
});

// ═══════════════════════════════════════════════════════
// AUTOMATED ALERT CHECKING (Internal Action)
// ═══════════════════════════════════════════════════════

/**
 * Automated alert checking action
 * Runs periodically to detect and create alerts for various issues
 */
export const checkAndCreateAlerts = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const alertsCreated: string[] = [];

    // 1. Check for high API error rate
    const apiHealth = await checkApiErrorRate(ctx);
    if (apiHealth.shouldAlert) {
      // @ts-ignore - Deep type instantiation
      const alertId = await ctx.runMutation(internal.asaas.alerts.createAlert, {
        alertType: "api_error",
        severity: apiHealth.severity,
        title: "High API Error Rate Detected",
        message: `Asaas API error rate is ${apiHealth.errorRate}% over the last hour`,
        details: apiHealth,
      });
      alertsCreated.push(`api_error:${alertId}`);
    }

    // 2. Check for recent sync failures
    const syncHealth = await checkRecentSyncFailures(ctx);
    if (syncHealth.shouldAlert) {
      // @ts-ignore - Deep type instantiation
      const alertId = await ctx.runMutation(internal.asaas.alerts.createAlert, {
        alertType: "sync_failure",
        severity: syncHealth.severity,
        title: "Recent Sync Failures Detected",
        message: `${syncHealth.failedCount} sync operations have failed recently`,
        details: syncHealth,
      });
      alertsCreated.push(`sync_failure:${alertId}`);
    }

    // 3. Check for rate limit warnings
    const rateLimitHealth = await checkRateLimitWarnings(ctx);
    if (rateLimitHealth.shouldAlert) {
      // @ts-ignore - Deep type instantiation
      const alertId = await ctx.runMutation(internal.asaas.alerts.createAlert, {
        alertType: "rate_limit",
        severity: rateLimitHealth.severity,
        title: "Rate Limit Warnings",
        message: `${rateLimitHealth.rateLimitCount} rate limit responses detected`,
        details: rateLimitHealth,
      });
      alertsCreated.push(`rate_limit:${alertId}`);
    }

    // 4. Check for stale webhooks
    const webhookHealth = await checkStaleWebhooks(ctx);
    if (webhookHealth.shouldAlert) {
      // @ts-ignore - Deep type instantiation
      const alertId = await ctx.runMutation(internal.asaas.alerts.createAlert, {
        alertType: "webhook_timeout",
        severity: webhookHealth.severity,
        title: "Stale Webhook Detected",
        message: `${webhookHealth.staleCount} webhooks pending processing`,
        details: webhookHealth,
      });
      alertsCreated.push(`webhook_timeout:${alertId}`);
    }

    // 5. Check for pending conflicts
    const conflictHealth = await checkPendingConflicts(ctx);
    if (conflictHealth.shouldAlert) {
      // @ts-ignore - Deep type instantiation
      const alertId = await ctx.runMutation(internal.asaas.alerts.createAlert, {
        alertType: "duplicate_detection",
        severity: conflictHealth.severity,
        title: "Pending Conflicts Require Attention",
        message: `${conflictHealth.conflictCount} conflicts pending resolution`,
        details: conflictHealth,
      });
      alertsCreated.push(`conflict_check:${alertId}`);
    }

    return {
      success: true,
      alertsCreated,
      timestamp: now,
    };
  },
});

// ═══════════════════════════════════════════════════════
// ALERT CHECKING HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Check API error rate
 */
async function checkApiErrorRate(ctx: any): Promise<{
  shouldAlert: boolean;
  severity: "low" | "medium" | "high" | "critical";
  errorRate: number;
  errorCount: number;
  totalRequests: number;
}> {
  // @ts-ignore - Deep type instantiation
  const logs = await ctx.runQuery(internal.asaas.monitoring.getApiHealthMetricsInternal, {
    hours: 1,
  });

  const errorRate = logs.errorRate || 0;

  // Alert thresholds
  if (errorRate >= 50) {
    return { shouldAlert: true, severity: "critical", errorRate, errorCount: 0, totalRequests: 0 };
  } else if (errorRate >= 25) {
    return { shouldAlert: true, severity: "high", errorRate, errorCount: 0, totalRequests: 0 };
  } else if (errorRate >= 10) {
    return { shouldAlert: true, severity: "medium", errorRate, errorCount: 0, totalRequests: 0 };
  } else if (errorRate >= 5) {
    return { shouldAlert: true, severity: "low", errorRate, errorCount: 0, totalRequests: 0 };
  }

  return { shouldAlert: false, severity: "low", errorRate, errorCount: 0, totalRequests: 0 };
}

/**
 * Check for recent sync failures
 */
async function checkRecentSyncFailures(ctx: any): Promise<{
  shouldAlert: boolean;
  severity: "low" | "medium" | "high" | "critical";
  failedCount: number;
}> {
  // @ts-ignore - Deep type instantiation
  const stats = await ctx.runQuery(internal.asaas.queries.getSyncStatisticsInternal, {});

  const totalFailed =
    (stats.customers?.failed || 0) +
    (stats.payments?.failed || 0) +
    (stats.subscriptions?.failed || 0);

  // Alert thresholds
  if (totalFailed >= 10) {
    return { shouldAlert: true, severity: "critical", failedCount: totalFailed };
  } else if (totalFailed >= 5) {
    return { shouldAlert: true, severity: "high", failedCount: totalFailed };
  } else if (totalFailed >= 3) {
    return { shouldAlert: true, severity: "medium", failedCount: totalFailed };
  } else if (totalFailed >= 1) {
    return { shouldAlert: true, severity: "low", failedCount: totalFailed };
  }

  return { shouldAlert: false, severity: "low", failedCount: totalFailed };
}

/**
 * Check for rate limit warnings
 */
async function checkRateLimitWarnings(ctx: any): Promise<{
  shouldAlert: boolean;
  severity: "low" | "medium" | "high" | "critical";
  rateLimitCount: number;
}> {
  // Get recent API audit logs for 429 status codes
  const hourAgo = Date.now() - 60 * 60 * 1000;

  // @ts-ignore - Deep type instantiation
  const auditLogs = await ctx.runQuery(internal.asaas.queries.getRecentAuditLogs, {
    since: hourAgo,
  });

  const rateLimitCount = auditLogs.filter((l: any) => l.statusCode === 429).length;

  // Alert thresholds
  if (rateLimitCount >= 50) {
    return { shouldAlert: true, severity: "critical", rateLimitCount };
  } else if (rateLimitCount >= 20) {
    return { shouldAlert: true, severity: "high", rateLimitCount };
  } else if (rateLimitCount >= 10) {
    return { shouldAlert: true, severity: "medium", rateLimitCount };
  } else if (rateLimitCount >= 5) {
    return { shouldAlert: true, severity: "low", rateLimitCount };
  }

  return { shouldAlert: false, severity: "low", rateLimitCount };
}

/**
 * Check for stale webhooks
 */
async function checkStaleWebhooks(ctx: any): Promise<{
  shouldAlert: boolean;
  severity: "low" | "medium" | "high" | "critical";
  staleCount: number;
}> {
  // Get unprocessed webhooks older than 1 hour
  const hourAgo = Date.now() - 60 * 60 * 1000;

  // @ts-ignore - Deep type instantiation
  const staleWebhooks = await ctx.runQuery(internal.asaas.queries.getStaleWebhooks, {
    olderThan: hourAgo,
  });

  const staleCount = staleWebhooks.length;

  // Alert thresholds
  if (staleCount >= 100) {
    return { shouldAlert: true, severity: "critical", staleCount };
  } else if (staleCount >= 50) {
    return { shouldAlert: true, severity: "high", staleCount };
  } else if (staleCount >= 20) {
    return { shouldAlert: true, severity: "medium", staleCount };
  } else if (staleCount >= 5) {
    return { shouldAlert: true, severity: "low", staleCount };
  }

  return { shouldAlert: false, severity: "low", staleCount };
}

/**
 * Check for pending conflicts
 */
async function checkPendingConflicts(ctx: any): Promise<{
  shouldAlert: boolean;
  severity: "low" | "medium" | "high" | "critical";
  conflictCount: number;
}> {
  // @ts-ignore - Deep type instantiation
  const conflicts = await ctx.runQuery(internal.asaas.conflict_resolution.getPendingConflicts, {});

  const conflictCount = conflicts.length;

  // Alert thresholds
  if (conflictCount >= 50) {
    return { shouldAlert: true, severity: "critical", conflictCount };
  } else if (conflictCount >= 20) {
    return { shouldAlert: true, severity: "high", conflictCount };
  } else if (conflictCount >= 10) {
    return { shouldAlert: true, severity: "medium", conflictCount };
  } else if (conflictCount >= 5) {
    return { shouldAlert: true, severity: "low", conflictCount };
  }

  return { shouldAlert: false, severity: "low", conflictCount };
}

// ═══════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════

/**
 * Find existing alert with same type and entity
 */
async function findExistingAlert(
  ctx: any,
  args: any,
): Promise<Doc<"asaasAlerts"> | null> {
  const now = Date.now();

  // Get active alerts of this type
  // @ts-ignore - Deep type instantiation
  const alerts = await ctx.runQuery(internal.asaas.monitoring.getAlertsByTypeInternal, {
    alertType: args.alertType,
    organizationId: args.organizationId,
    limit: 100,
  });

  // Filter for active alerts and matching entities
  for (const alert of alerts) {
    if (alert.status !== "active") continue;
    if (alert.suppressedUntil && alert.suppressedUntil > now) continue;

    // Check entity matching
    if (args.studentId && alert.studentId !== args.studentId) continue;
    if (args.paymentId && alert.paymentId !== args.paymentId) continue;
    if (args.subscriptionId && alert.subscriptionId !== args.subscriptionId) continue;
    if (args.syncLogId && alert.syncLogId !== args.syncLogId) continue;

    // Found matching alert
    return alert;
  }

  return null;
}

/**
 * Compare two severities and return the higher one
 */
function compareSeverity(
  a: "low" | "medium" | "high" | "critical",
  b: "low" | "medium" | "high" | "critical",
): "low" | "medium" | "high" | "critical" {
  const order = { low: 1, medium: 2, high: 3, critical: 4 };
  return order[a] >= order[b] ? a : b;
}
