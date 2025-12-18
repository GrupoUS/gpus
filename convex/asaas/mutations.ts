import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { dateStringToTimestamp } from "../lib/asaas";

/**
 * Creates a new charge record in the database.
 */
export const createCharge = internalMutation({
  args: {
    studentId: v.id("students"),
    asaasPaymentId: v.string(),
    asaasCustomerId: v.string(), // Added missing arg
    amount: v.number(),
    dueDate: v.string(),
    billingType: v.union(
      v.literal("BOLETO"),
      v.literal("PIX"),
      v.literal("CREDIT_CARD"),
      v.literal("DEBIT_CARD"),
      v.literal("UNDEFINED")
    ),
    description: v.optional(v.string()),
    installmentCount: v.optional(v.number()),
    installmentNumber: v.optional(v.number()),
    boletoUrl: v.optional(v.string()),
    pixQrCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chargeId = await ctx.db.insert("asaasPayments", {
      studentId: args.studentId,
      asaasCustomerId: args.asaasCustomerId,
      asaasPaymentId: args.asaasPaymentId,
      value: args.amount, // Schema uses 'value', input args uses 'amount' to match old code, I'll map it.
      dueDate: dateStringToTimestamp(args.dueDate),
      status: "PENDING", // Default status
      billingType: args.billingType,
      description: args.description,
      totalInstallments: args.installmentCount, // Map installmentCount to totalInstallments
      installmentNumber: args.installmentNumber,
      boletoUrl: args.boletoUrl,
      pixQrCode: args.pixQrCode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return chargeId;
  },
});

/**
 * Updates the status of a charge based on Asaas webhook events.
 */
export const updateChargeStatus = internalMutation({
  args: {
    asaasPaymentId: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("RECEIVED"),
      v.literal("CONFIRMED"),
      v.literal("OVERDUE"),
      v.literal("REFUNDED"),
      v.literal("DELETED"),
      v.literal("DUNNING_REQUESTED"),
      v.literal("DUNNING_RECEIVED"),
      v.literal("AWAITING_RISK_ANALYSIS"),
      v.literal("CANCELLED")
    ),
  },
  handler: async (ctx, args) => {
    const charge = await ctx.db
      .query("asaasPayments")
      .withIndex("by_asaas_payment_id", (q) => q.eq("asaasPaymentId", args.asaasPaymentId))
      .first();

    if (!charge) {
      throw new Error(`Charge with Asaas ID ${args.asaasPaymentId} not found`);
    }

    await ctx.db.patch(charge._id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return charge._id;
  },
});

/**
 * Logs a payment event from Asaas webhook.
 */
export const logPaymentEvent = internalMutation({
  args: {
    asaasPaymentId: v.string(),
    eventType: v.string(),
    webhookPayload: v.any(),
    paidAt: v.optional(v.number()),
    netValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // We want to link the webhook log to the payment, but paymentId in asaasWebhooks is a string (asakPaymentId), not reference?
    // Let's check schema:
    // asaasWebhooks: defineTable({ ... paymentId: v.optional(v.string()), ... })
    // So we don't need to look up the internal ID to insert into asaasWebhooks.

    await ctx.db.insert("asaasWebhooks", {
      event: args.eventType,
      paymentId: args.asaasPaymentId,
      payload: args.webhookPayload,
      processed: true, // we assume processed if we are logging via this mutation called by webhook handler?
      // The plan says "processed: v.boolean() // Se foi processado com sucesso".
      // The webhook handler calls this. If this succeeds, it's processed?
      // Or should the handler call this first?
      // Typically, you log raw webhook first, then process.
      // But here we are logging "Payment Event".
      // I'll stick to: 'processed: true' because we are doing it.

      createdAt: Date.now(),
      // error?
    });

    // Also, if paidAt/netValue provided, we should probably update the payment itself?
    // updateChargeStatus handles status. Does it handle netValue?
    // My updateChargeStatus only takes status.
    // I should update it to take netValue and paidAt if provided.

    if (args.paidAt || args.netValue) {
       const charge = await ctx.db
        .query("asaasPayments")
        .withIndex("by_asaas_payment_id", (q) => q.eq("asaasPaymentId", args.asaasPaymentId))
        .first();

       if (charge) {
         await ctx.db.patch(charge._id, {
           confirmedDate: args.paidAt,
           netValue: args.netValue,
           updatedAt: Date.now()
         });
       }
    }
  },
});

export const updateStudentAsaasId = internalMutation({
  args: {
    studentId: v.id("students"),
    asaasCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.studentId, {
      asaasCustomerId: args.asaasCustomerId,
      asaasCustomerSyncedAt: Date.now(),
    });
  },
});
