/**
 * Convex HTTP Router - Handles external webhook endpoints
 *
 * This file defines HTTP endpoints that can be called by external services.
 * Currently supports:
 * - POST /brevo/webhook - Brevo email event webhooks
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  type BrevoWebhookPayload,
  normalizeEventType,
  validateWebhookSecret,
} from "./lib/brevo";
import {
  type MessagingWebhookPayload,
  normalizeMessageStatus,
  validateMessagingWebhookSecret,
} from "./lib/messaging";
// import { serve } from 'inngest/convex'
// import { inngest } from './lib/inngest'
// import { gatherContext, augmentContext } from './inngest'

const http = httpRouter();

/**
 * Brevo Webhook Endpoint
 *
 * Receives email events from Brevo (delivery, opens, clicks, bounces, etc.)
 * and records them in the emailEvents table.
 *
 * POST /brevo/webhook
 *
 * Headers:
 * - X-Brevo-Secret: Webhook secret for authentication
 *
 * Body: BrevoWebhookPayload (JSON)
 */
http.route({
  path: "/brevo/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. Validate webhook secret
    const url = new URL(request.url);
    const secret = request.headers.get("X-Brevo-Secret") ?? url.searchParams.get("secret");
    if (!validateWebhookSecret(secret)) {
      console.error("Brevo webhook: Invalid secret");
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Parse payload
    let payload: BrevoWebhookPayload;
    try {
      payload = (await request.json()) as BrevoWebhookPayload;
    } catch {
      console.error("Brevo webhook: Invalid JSON payload");
      return new Response("Bad Request", { status: 400 });
    }

    // 3. Validate required fields
    if (!payload.event || !payload.email) {
      console.error("Brevo webhook: Missing required fields (event, email)");
      return new Response("Bad Request: Missing required fields", {
        status: 400,
      });
    }

    // 4. Normalize event type to our internal format
    const eventType = normalizeEventType(payload.event);

    // 5. Find contact by email (if exists)
    // @ts-ignore - Deep type instantiation workaround for Convex
    const contact = await ctx.runQuery(
      internal.emailMarketing.getContactByEmailInternal as any,
      {
        email: payload.email,
      },
    );

    // 6. Extract timestamp (prefer epoch, fallback to ts, then current time)
    const timestamp = payload.ts_epoch ?? payload.ts ?? Date.now();

    // 7. Record the event
    await ctx.runMutation(internal.emailMarketing.recordEmailEvent, {
      email: payload.email,
      contactId: contact?._id,
      campaignId: undefined, // Campaign ID not available in webhook payload
      eventType,
      link: payload.link,
      bounceType: payload.reason,
      brevoMessageId: payload["message-id"],
      timestamp,
      metadata: payload,
    });

    // 8. Handle unsubscribe and hard bounce events - update subscription status
    const unsubscribeEvents = ["unsubscribed", "hard_bounce", "invalid_email"];
    if (unsubscribeEvents.includes(payload.event)) {
      await ctx.runMutation(
        internal.emailMarketing.updateContactSubscriptionInternal,
        {
          email: payload.email,
          subscriptionStatus: "unsubscribed",
        },
      );
      console.log("Brevo webhook: Updated subscription status to unsubscribed");
    }

    console.log(`Brevo webhook: Processed ${payload.event}`);
    return new Response("OK", { status: 200 });
  }),
});

/**
 * Messaging Webhook Endpoint
 *
 * Receives message status updates from messaging providers (WhatsApp, SMS, etc.)
 * and updates the message status in the database.
 *
 * POST /messaging/webhook
 *
 * Headers:
 * - X-Messaging-Secret: Webhook secret for authentication
 *
 * Body: MessagingWebhookPayload (JSON)
 */
http.route({
  path: "/messaging/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. Validate webhook secret
    const secret = request.headers.get("X-Messaging-Secret");
    if (!validateMessagingWebhookSecret(secret)) {
      console.error("Messaging webhook: Invalid secret");
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Parse payload
    let payload: MessagingWebhookPayload;
    try {
      payload = (await request.json()) as MessagingWebhookPayload;
    } catch {
      console.error("Messaging webhook: Invalid JSON payload");
      return new Response("Bad Request", { status: 400 });
    }

    // 3. Validate required fields
    if (!payload.messageId || !payload.status) {
      console.error(
        "Messaging webhook: Missing required fields (messageId, status)",
      );
      return new Response("Bad Request: Missing required fields", {
        status: 400,
      });
    }

    // 4. Normalize status to internal format
    const normalizedStatus = normalizeMessageStatus(payload.status);

    // 5. Update message status via internal mutation
    try {
      await ctx.runMutation(internal.messages.updateStatusInternal, {
        messageId: payload.messageId as any, // ID comes from external provider
        status: normalizedStatus,
      });
    } catch (error) {
      console.error(
        "Messaging webhook: Failed to update message status",
        error,
      );
      return new Response("Internal Server Error", { status: 500 });
    }

    console.log(
      `Messaging webhook: Updated message ${payload.messageId} to ${normalizedStatus}`,
    );
    return new Response("OK", { status: 200 });
  }),
});

/**
 * Timing-safe string comparison to prevent timing attacks
 * Compares two strings in constant time regardless of their content
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Verify HMAC SHA256 signature for Asaas webhooks
 * Asaas sends signature in 'asaas_signature' header
 */
async function verifyAsaasSignature(
  payload: string,
  signature: string | null,
  secret: string | undefined,
): Promise<boolean> {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Encode payload and secret
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);

    // Import secret key for HMAC
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    // Generate HMAC signature
    const payloadBuffer = encoder.encode(payload);
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      payloadBuffer,
    );

    // Convert to hex
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Use timing-safe comparison
    return timingSafeEqual(signature, expectedSignature);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Simple in-memory rate limiter for webhook endpoints
 * Prevents abuse by limiting requests per IP
 */
class WebhookRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(ip: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this IP
    let ipRequests = this.requests.get(ip) || [];

    // Filter out old requests outside the time window
    ipRequests = ipRequests.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (ipRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    ipRequests.push(now);
    this.requests.set(ip, ipRequests);

    return true;
  }

  // Cleanup old entries to prevent memory leak
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [ip, requests] of this.requests.entries()) {
      const validRequests = requests.filter((t) => t > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, validRequests);
      }
    }
  }
}

// Create rate limiter instance (100 requests per minute per IP)
const webhookRateLimiter = new WebhookRateLimiter(100, 60000);

// Cleanup rate limiter every 5 minutes
setInterval(() => webhookRateLimiter.cleanup(), 5 * 60 * 1000);

type AsaasWebhookPayload = {
  id?: string;
  event?: string;
  payment?: {
    id?: string;
    customer?: string;
  };
  subscription?: {
    id?: string;
    customer?: string;
  };
  customer?: {
    id?: string;
  };
};

function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function extractAsaasWebhookMeta(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const data = payload as AsaasWebhookPayload;
  return {
    eventId: getOptionalString(data.id),
    eventType: getOptionalString(data.event),
    paymentId: getOptionalString(data.payment?.id),
    subscriptionId: getOptionalString(data.subscription?.id),
    customerId:
      getOptionalString(data.payment?.customer) ||
      getOptionalString(data.subscription?.customer) ||
      getOptionalString(data.customer?.id),
  };
}

/**
 * Asaas Webhook Endpoint
 *
 * Receives payment, subscription, and customer events from Asaas.
 * and processes them asynchronously.
 *
 * POST /asaas/webhook
 *
 * Security Features:
 * - HMAC SHA256 signature verification (asaas_signature header)
 * - Timing-safe string comparison
 * - Rate limiting per IP
 * - Fallback to token-based auth for backward compatibility
 *
 * Headers:
 * - asaas_signature: HMAC SHA256 signature (preferred)
 * - asaas-access-token: Webhook token (fallback, deprecated)
 *
 * Body: Asaas webhook payload with event and payment data
 */
http.route({
  path: "/asaas/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. Rate limiting check
    const clientIP =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unknown";

    if (!webhookRateLimiter.isAllowed(clientIP)) {
      console.warn(`Asaas webhook: Rate limit exceeded for IP ${clientIP}`);
      return new Response("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": "60",
        },
      });
    }

    // 2. Get raw payload for signature verification
    const rawPayload = await request.text();

    // 3. Verify HMAC signature (preferred method)
    const signature = request.headers.get("asaas_signature");
    const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;

    const signatureValid = await verifyAsaasSignature(
      rawPayload,
      signature,
      webhookSecret,
    );

    // 4. Fallback to token-based auth for backward compatibility
    let tokenValid = false;
    if (!signatureValid) {
      const receivedToken = request.headers.get("asaas-access-token");
      const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
      tokenValid = expectedToken
        ? timingSafeEqual(receivedToken || "", expectedToken)
        : false;
    }

    if (!signatureValid && !tokenValid) {
      console.error("Asaas webhook: Invalid signature or token");
      return new Response("Unauthorized", { status: 401 });
    }

    // 5. Parse payload
    let payload: unknown;
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      console.error("Asaas webhook: Invalid JSON payload");
      return new Response("Bad Request", { status: 400 });
    }

    // 6. Validate required fields
    const { eventId, eventType, paymentId, subscriptionId, customerId } =
      extractAsaasWebhookMeta(payload);

    if (!eventId || !eventType) {
      console.error(
        "Asaas webhook: Missing required fields (id, event)",
      );
      return new Response("Bad Request: Missing required fields", {
        status: 400,
      });
    }

    if (!paymentId && !subscriptionId && !customerId) {
      console.error(
        "Asaas webhook: Missing required entity data (payment, subscription, customer)",
      );
      return new Response("Bad Request: Missing required data", {
        status: 400,
      });
    }

    // 7. Log + enqueue processing (idempotent)
    try {
      await ctx.runAction(internal.asaas.webhooks.processWebhookIdempotent, {
        eventId,
        eventType,
        paymentId,
        subscriptionId,
        customerId,
        payload,
      });
    } catch (error) {
      console.error(
        `Asaas webhook: Failed to enqueue event ${eventType} (${eventId})`,
        error,
      );
      return new Response("Internal Server Error", { status: 500 });
    }

    // 8. Return immediate success response
    console.log(`Asaas webhook: Received ${eventType} (${eventId})`);
    return new Response("OK", { status: 200 });
  }),
});

/**
 * Asaas Webhook Test Endpoint (dev only)
 *
 * POST /asaas/webhook/test
 */
http.route({
  path: "/asaas/webhook/test",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (process.env.NODE_ENV === "production") {
      return new Response("Not Found", { status: 404 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const meta = extractAsaasWebhookMeta(payload);
    const eventId = meta.eventId || `test_${Date.now()}`;
    const eventType = meta.eventType || "PAYMENT_CREATED";

    await ctx.runAction(internal.asaas.webhooks.processWebhookIdempotent, {
      eventId,
      eventType,
      paymentId: meta.paymentId,
      subscriptionId: meta.subscriptionId,
      customerId: meta.customerId,
      payload,
    });

    return new Response(
      JSON.stringify({ received: true, eventId, eventType }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }),
});

/**
 * Inngest Serve Handler
 *
 * Exposes the Inngest API endpoints for the workflow functions.
 * This allows Inngest to trigger our context gathering and augmentation functions.
 *
 * GET /api/inngest
 * POST /api/inngest
 */
/*
http.route({
	path: '/api/inngest',
	method: 'ANY',
	handler: serve(inngest, [gatherContext, augmentContext]),
})
*/


/**
 * Clerk Users Integration
 *
 * Implements team management via Clerk Backend SDK.
 * Exposes endpoints for listing, inviting, updating roles, and removing users.
 */


export default http;
