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

// ═══════════════════════════════════════════════════════
// IMPORT HELPER QUERIES (Internal)
// ═══════════════════════════════════════════════════════

import { internalQuery } from "../_generated/server";

/**
 * Get student by Asaas customer ID
 */
export const getStudentByAsaasId = internalQuery({
  args: { asaasCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .filter((q) => q.eq(q.field("asaasCustomerId"), args.asaasCustomerId))
      .first();
  },
});

/**
 * Get student by Email or CPF (for deduplication)
 */
export const getStudentByEmailOrCpf = internalQuery({
  args: {
    email: v.optional(v.string()),
    cpf: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Try by Email (Indexed)
    if (args.email) {
      const studentByEmail = await ctx.db
        .query("students")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      if (studentByEmail) return studentByEmail;
    }

    // 2. Try by CPF (Filter - slower but necessary)
    if (args.cpf) {
      // Clean CPF just in case, though usually stored raw or formatted.
      // We assume args.cpf is consistent with DB storage.
      const studentByCpf = await ctx.db
        .query("students")
        .filter((q) => q.eq(q.field("cpf"), args.cpf))
        .first();

      if (studentByCpf) return studentByCpf;
    }

    return null;
  },
});

/**
 * Get payment by Asaas payment ID
 */
export const getPaymentByAsaasId = internalQuery({
  args: { asaasPaymentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("asaasPayments")
      .withIndex("by_asaas_payment_id", (q) => q.eq("asaasPaymentId", args.asaasPaymentId))
      .first();
  },
});

/**
 * Get subscription by Asaas subscription ID
 */
export const getSubscriptionByAsaasId = internalQuery({
  args: { asaasSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("asaasSubscriptions")
      .withIndex("by_asaas_subscription_id", (q) => q.eq("asaasSubscriptionId", args.asaasSubscriptionId))
      .first();
  },
});

// ═══════════════════════════════════════════════════════
// IMPORT MUTATIONS (Internal)
// ═══════════════════════════════════════════════════════

/**
 * Create a new student from Asaas customer data
 */
export const createStudentFromAsaas = internalMutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    cpf: v.optional(v.string()),
    asaasCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("students", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      cpf: args.cpf,
      asaasCustomerId: args.asaasCustomerId,
      asaasCustomerSyncedAt: now,
      status: "ativo",
      // Required fields with sensible defaults for Asaas imports
      profession: "Não informado",
      hasClinic: false,
      churnRisk: "baixo",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update student from Asaas customer data
 */
export const updateStudentFromAsaas = internalMutation({
  args: {
    studentId: v.id("students"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    cpf: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { studentId, ...updates } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.email !== undefined) patch.email = updates.email;
    if (updates.phone !== undefined) patch.phone = updates.phone;
    if (updates.cpf !== undefined) patch.cpf = updates.cpf;

    await ctx.db.patch(studentId, patch);
  },
});

/**
 * Create a new payment record from Asaas data
 */
export const createPaymentFromAsaas = internalMutation({
  args: {
    studentId: v.id("students"),
    asaasPaymentId: v.string(),
    asaasCustomerId: v.string(),
    value: v.number(),
    netValue: v.optional(v.number()),
    status: v.string(),
    dueDate: v.number(),
    billingType: v.union(
      v.literal("BOLETO"),
      v.literal("PIX"),
      v.literal("CREDIT_CARD"),
      v.literal("DEBIT_CARD"),
      v.literal("UNDEFINED")
    ),
    description: v.optional(v.string()),
    boletoUrl: v.optional(v.string()),
    confirmedDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("asaasPayments", {
      studentId: args.studentId,
      asaasPaymentId: args.asaasPaymentId,
      asaasCustomerId: args.asaasCustomerId,
      value: args.value,
      netValue: args.netValue,
      status: args.status as any, // Trust the status from Asaas
      dueDate: args.dueDate,
      billingType: args.billingType,
      description: args.description,
      boletoUrl: args.boletoUrl,
      confirmedDate: args.confirmedDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update payment from Asaas data
 */
export const updatePaymentFromAsaas = internalMutation({
  args: {
    paymentId: v.id("asaasPayments"),
    status: v.optional(v.string()),
    netValue: v.optional(v.number()),
    confirmedDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { paymentId, ...updates } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.netValue !== undefined) patch.netValue = updates.netValue;
    if (updates.confirmedDate !== undefined) patch.confirmedDate = updates.confirmedDate;

    await ctx.db.patch(paymentId, patch);
  },
});

/**
 * Create a new subscription record from Asaas data
 */
export const createSubscriptionFromAsaas = internalMutation({
  args: {
    studentId: v.id("students"),
    asaasSubscriptionId: v.string(),
    asaasCustomerId: v.string(),
    value: v.number(),
    cycle: v.union(
      v.literal("WEEKLY"),
      v.literal("BIWEEKLY"),
      v.literal("MONTHLY"),
      v.literal("QUARTERLY"),
      v.literal("SEMIANNUALLY"),
      v.literal("YEARLY")
    ),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("INACTIVE"),
      v.literal("CANCELLED"),
      v.literal("EXPIRED")
    ),
    nextDueDate: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("asaasSubscriptions", {
      studentId: args.studentId,
      asaasSubscriptionId: args.asaasSubscriptionId,
      asaasCustomerId: args.asaasCustomerId,
      value: args.value,
      cycle: args.cycle,
      status: args.status,
      nextDueDate: args.nextDueDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update subscription from Asaas data
 */
export const updateSubscriptionFromAsaas = internalMutation({
  args: {
    subscriptionId: v.id("asaasSubscriptions"),
    status: v.optional(v.union(
      v.literal("ACTIVE"),
      v.literal("INACTIVE"),
      v.literal("CANCELLED"),
      v.literal("EXPIRED")
    )),
    value: v.optional(v.number()),
    nextDueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { subscriptionId, ...updates } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.value !== undefined) patch.value = updates.value;
    if (updates.nextDueDate !== undefined) patch.nextDueDate = updates.nextDueDate;

    await ctx.db.patch(subscriptionId, patch);
  },
});
