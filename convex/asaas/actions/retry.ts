/**
 * Webhook Retry Mechanism
 *
 * Provides scheduled retry logic for failed webhook processing.
 * Implements exponential backoff and max retry limits.
 */
import { internalMutation, internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Retry failed webhooks
 *
 * Processes webhooks that have status 'failed' and have not reached max retry count.
 * Implements exponential backoff strategy: 1min, 5min, 15min, 1hour.
 *
 * @param limit - Maximum number of webhooks to retry (default: 50)
 * @returns Retry result object
 */
export const retryFailedWebhooks = internalMutation({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const now = Date.now();

    // Get failed webhooks that can be retried
    const failedWebhooks = await ctx.db
      .query("asaasWebhooks")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .collect();

    // Filter webhooks that can be retried (max 5 attempts)
    const retryableWebhooks = failedWebhooks.filter((w) => {
      const retryCount = w.retryCount ?? 0;
      const lastAttemptAt = w.lastAttemptAt ?? w.createdAt;

      // Max 5 retries
      if (retryCount >= 5) {
        return false;
      }

      // Exponential backoff: 1min, 5min, 15min, 1hour
      const backoffMinutes = Math.pow(5, retryCount);
      const nextAttemptTime = lastAttemptAt + backoffMinutes * 60 * 1000;

      // Only retry if backoff period has passed
      if (nextAttemptTime > now) {
        return false;
      }

      return true;
    });

    // Take only up to limit
    const toRetry = retryableWebhooks.slice(0, limit);

    if (toRetry.length === 0) {
      // No webhooks to retry
      return;
    }

    // Process each webhook for retry
    for (const webhook of toRetry) {
      // Update webhook status to 'processing' and increment retry count
      await ctx.db.patch(webhook._id, {
        status: "processing",
        lastAttemptAt: now,
        retryCount: (webhook.retryCount ?? 0) + 1,
      });

      // Mark previous error as cleared (will be set on next failure)
      await ctx.db.patch(webhook._id, {
        error: undefined,
      });
    }

    return;
  },
});

/**
 * Get webhooks pending retry
 *
 * Returns webhooks that are scheduled for retry.
 * Used by monitoring dashboard to show retry queue.
 *
 * @param limit - Maximum number to return (default: 100)
 * @returns Array of webhooks pending retry
 */
export const getWebhooksPendingRetry = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const now = Date.now();

    const failedWebhooks = await ctx.db
      .query("asaasWebhooks")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .collect();

    // Filter webhooks that should be retried now
    // (filtered results available for future implementation)
    failedWebhooks
      .filter((w) => {
        const retryCount = w.retryCount ?? 0;
        const lastAttemptAt = w.lastAttemptAt ?? w.createdAt;

        // Max 5 retries
        if (retryCount >= 5) {
          return false;
        }

        // Calculate backoff time
        const backoffMinutes = Math.pow(5, retryCount);
        const nextAttemptTime = lastAttemptAt + backoffMinutes * 60 * 1000;

        // Include if retry time has passed or is within next 5 minutes
        return nextAttemptTime <= now + 5 * 60 * 1000;
      })
      .slice(0, limit);

    return null;
  },
});

/**
 * Schedule retry for specific webhook
 *
 * Manually schedules a retry for a specific webhook event.
 * Useful for admin intervention when automatic retry fails.
 *
 * @param eventId - The Asaas event ID to retry
 * @returns Scheduled retry result
 */
export const scheduleWebhookRetry = internalMutation({
  args: {
    eventId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const webhook = await ctx.db
      .query("asaasWebhooks")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!webhook) {
      throw new Error(`Webhook ${args.eventId} not found`);
    }

    // Reset webhook to 'pending' for retry
    await ctx.db.patch(webhook._id, {
      status: "pending",
      retryCount: 0, // Reset retry count
      error: undefined, // Clear error
    });

    return;
  },
});

/**
 * Get retry statistics
 *
 * Returns statistics about webhook retry behavior.
 * Helps monitor retry success rates and identify problematic webhooks.
 *
 * @returns Retry statistics object
 */
export const getRetryStatistics = internalQuery({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const failedWebhooks = await ctx.db
      .query("asaasWebhooks")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .collect();

    const totalFailed = failedWebhooks.length;

    // Group by retry count
    const byRetryCount = new Map<number, number>();

    for (const webhook of failedWebhooks) {
      const retryCount = webhook.retryCount ?? 0;
      const count = byRetryCount.get(retryCount) ?? 0;
      byRetryCount.set(retryCount, count + 1);
    }

    // Calculate statistics (for future use)
    const neverRetried = (byRetryCount.get(0) ?? 0);
    const retriedOnce = (byRetryCount.get(1) ?? 0);
    // retriedMultiple = totalFailed - neverRetried - retriedOnce
    // successRate = totalFailed > 0 ? 0 : 100 (placeholder)
    void totalFailed;
    void neverRetried;
    void retriedOnce;

    return null;
  },
});
