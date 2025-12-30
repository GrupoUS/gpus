/**
 * Asaas Integration - Webhooks
 *
 * Internal mutations for processing Asaas webhook events.
 *
 * LGPD COMPLIANCE:
 * - Webhook payloads are encrypted before storage to protect PII
 * - Automatic 90-day retention policy for webhook logs
 */

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { dateStringToTimestamp } from "./client";
import { encrypt } from "../lib/encryption";

/**
 * Webhook retention period (90 days as per ANPD guidelines)
 */
const WEBHOOK_RETENTION_DAYS = 90;
const WEBHOOK_RETENTION_MS = WEBHOOK_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Type for webhook processing result
 */
type WebhookResult =
  | { processed: true }
  | { processed: false; reason: string }
  | { skipped: true; reason: string; processedAt: number };

/**
 * Generate idempotency key for webhook deduplication
 * Uses SHA-256 hash of unique webhook identifier
 */
async function generateIdempotencyKey(
  event: string,
  paymentId: string | undefined,
): Promise<string> {
  const data = `${event}:${paymentId || "no-payment"}:${Math.floor(Date.now() / 600000)}`; // 10-minute window (Asaas retries at 3.5+ minutes)
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Process webhook event with idempotency check (internal)
 * This is the main entry point for webhook processing
 */
export const processWebhookIdempotent = internalMutation({
  args: {
    event: v.string(),
    paymentId: v.optional(v.string()),
    payload: v.any(),
  },
  handler: async (ctx, args): Promise<WebhookResult> => {
    // Generate idempotency key
    const idempotencyKey = await generateIdempotencyKey(
      args.event,
      args.paymentId,
    );

    // Check if already processed
    const existing = await ctx.db
      .query("asaasWebhookDeduplication")
      .withIndex("by_idempotency_key", (q) =>
        q.eq("idempotencyKey", idempotencyKey),
      )
      .first();

    if (existing) {
      return {
        skipped: true,
        reason: "Already processed",
        processedAt: existing.processedAt,
      };
    }

    // Process the webhook
    const result = (await ctx.runMutation(
      internal.asaas.webhooks.processWebhook,
      args,
    )) as WebhookResult;

    // Store deduplication entry (24h TTL)
    const now = Date.now();
    await ctx.db.insert("asaasWebhookDeduplication", {
      idempotencyKey,
      processedAt: now,
      expiresAt: now + 86400000, // 24 hours
    });

    // Return the result directly to avoid overriding its processed field
    return result;
  },
});

/**
 * Process webhook event (internal)
 * Note: Use processWebhookIdempotent for external calls to prevent duplicates
 *
 * LGPD: Payloads are encrypted before storage to protect sensitive customer data
 */
export const processWebhook = internalMutation({
  args: {
    event: v.string(),
    paymentId: v.optional(v.string()),
    payload: v.any(),
  },
  handler: async (ctx, args): Promise<WebhookResult> => {
    const now = Date.now();
    const retentionUntil = now + WEBHOOK_RETENTION_MS;

    // Encrypt payload before storage (LGPD compliance)
    // Webhook payloads contain PII: name, email, CPF, phone, address
    let encryptedPayload: string | undefined;
    try {
      const payloadJson = JSON.stringify(args.payload);
      encryptedPayload = await encrypt(payloadJson);
    } catch (error) {
      console.error("Failed to encrypt webhook payload:", error);
      // Continue processing but log the error
    }

    // Log webhook event with encrypted payload
    const webhookId = await ctx.db.insert("asaasWebhooks", {
      event: args.event,
      paymentId: args.paymentId,
      payload: encryptedPayload,
      processed: false,
      retentionUntil,
      createdAt: now,
    });

    if (!args.paymentId) {
      await ctx.db.patch(webhookId, {
        processed: true,
        error: "No payment ID in webhook",
      });
      return { processed: false, reason: "No payment ID" };
    }

    try {
      // 1. Handle Subscription Events
      if (args.event.startsWith("SUBSCRIPTION_")) {
        const subscription = args.payload.subscription as any;
        if (subscription && subscription.id) {
          // @ts-ignore
          await ctx.runMutation(
            internal.asaas.mutations.updateSubscriptionStatusInternal,
            {
              asaasSubscriptionId: subscription.id,
              status: subscription.status,
              nextDueDate: subscription.nextDueDate
                ? dateStringToTimestamp(subscription.nextDueDate)
                : undefined,
              value: subscription.value,
            },
          );
        }

        await ctx.db.patch(webhookId, { processed: true });
        return { processed: true };
      }

      // 2. Handle Payment Events
      const payment = args.payload.payment as any;
      if (!payment || !args.paymentId) {
        await ctx.db.patch(webhookId, {
          processed: true,
          error: "No payment data in webhook",
        });
        return { processed: false, reason: "No payment data" };
      }

      // Map Asaas status to our status
      const statusMap: Record<string, any> = {
        PENDING: "PENDING",
        RECEIVED: "RECEIVED",
        CONFIRMED: "CONFIRMED",
        OVERDUE: "OVERDUE",
        REFUNDED: "REFUNDED",
        DELETED: "DELETED",
        CANCELLED: "CANCELLED",
        RECEIVED_IN_CASH: "RECEIVED_IN_CASH",
        RECEIVED_IN_CASH_UNDONE: "RECEIVED_IN_CASH_UNDONE",
      };

      const status = statusMap[payment.status] || "PENDING";
      const confirmedDate = payment.paymentDate
        ? dateStringToTimestamp(payment.paymentDate)
        : undefined;

      // Update payment status
      // @ts-ignore
      await ctx.runMutation(internal.asaas.mutations.updatePaymentStatus, {
        asaasPaymentId: args.paymentId,
        status,
        confirmedDate,
        netValue: payment.netValue,
      });

      // Schedule notification based on payment status
      // Get payment record to get studentId
      const paymentRecord = await ctx.db
        .query("asaasPayments")
        .withIndex("by_asaas_payment_id", (q) =>
          q.eq("asaasPaymentId", args.paymentId!),
        )
        .first();

      if (paymentRecord && paymentRecord.studentId) {
        if (status === "CONFIRMED" || status === "RECEIVED") {
          // @ts-ignore - Deep type instantiation workaround
          await ctx.scheduler.runAfter(
            0,
            internal.notifications.sendPaymentConfirmed,
            {
              paymentId: paymentRecord._id,
              studentId: paymentRecord.studentId,
            },
          );
        } else if (status === "OVERDUE") {
          // @ts-ignore - Deep type instantiation workaround
          await ctx.scheduler.runAfter(
            0,
            internal.notifications.sendPaymentOverdue,
            {
              paymentId: paymentRecord._id,
              studentId: paymentRecord.studentId,
            },
          );
        }
      }

      // Mark webhook as processed
      await ctx.db.patch(webhookId, {
        processed: true,
      });

      return { processed: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await ctx.db.patch(webhookId, {
        processed: true,
        error: errorMessage,
      });
      throw error;
    }
  },
});

/**
 * Clean up expired deduplication entries (internal)
 * Call this periodically to prevent database bloat
 */
export const cleanupExpiredDeduplicationEntries = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("asaasWebhookDeduplication")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", now))
      .collect();

    // Delete expired entries
    for (const entry of expired) {
      await ctx.db.delete(entry._id);
    }

    return { deleted: expired.length };
  },
});

/**
 * Clean up expired webhook entries (LGPD compliance)
 * Deletes webhooks older than retention period (90 days)
 *
 * Call this periodically (e.g., daily) via cron job
 */
export const cleanupExpiredWebhooks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("asaasWebhooks")
      .withIndex("by_retention_until", (q) => q.lt("retentionUntil", now))
      .collect();

    // Delete expired webhook logs
    for (const webhook of expired) {
      await ctx.db.delete(webhook._id);
    }

    return { deleted: expired.length };
  },
});
