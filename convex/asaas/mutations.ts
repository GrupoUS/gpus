import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Creates a new charge record in the database.
 */
export const createCharge = internalMutation({
  args: {
    studentId: v.id("students"),
    asaasPaymentId: v.string(),
    amount: v.number(),
    dueDate: v.string(),
    billingType: v.union(
      v.literal("BOLETO"),
      v.literal("PIX"),
      v.literal("CREDIT_CARD"),
      v.literal("UNDEFINED")
    ),
    description: v.optional(v.string()),
    installmentCount: v.optional(v.number()),
    installmentNumber: v.optional(v.number()),
    boletoUrl: v.optional(v.string()),
    pixQrCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chargeId = await ctx.db.insert("charges", {
      studentId: args.studentId,
      asaasPaymentId: args.asaasPaymentId,
      amount: args.amount,
      dueDate: args.dueDate,
      status: "PENDING", // Default status
      billingType: args.billingType,
      description: args.description,
      installmentCount: args.installmentCount,
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
    ),
  },
  handler: async (ctx, args) => {
    const charge = await ctx.db
      .query("charges")
      .withIndex("by_asaas_id", (q) => q.eq("asaasPaymentId", args.asaasPaymentId))
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
    const charge = await ctx.db
      .query("charges")
      .withIndex("by_asaas_id", (q) => q.eq("asaasPaymentId", args.asaasPaymentId))
      .first();

    if (!charge) {
      // If charge not found, we might still want to log it if we can find the student?
      // But schema requires chargeId.
      // For now, fail or skip.
      // To be robust, we might logging to a separate "raw_webhooks" table if needed,
      // but schema says paymentLogs links to charge.
      throw new Error(`Charge with Asaas ID ${args.asaasPaymentId} not found for logging`);
    }

    await ctx.db.insert("paymentLogs", {
      chargeId: charge._id,
      eventType: args.eventType,
      webhookPayload: args.webhookPayload,
      paidAt: args.paidAt,
      netValue: args.netValue,
      createdAt: Date.now(),
    });
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
    });
  },
});
