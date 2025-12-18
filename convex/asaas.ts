import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ═══════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════

export const getFinancialSummary = query({
  args: {
    startDate: v.optional(v.string()), // YYYY-MM-DD
    endDate: v.optional(v.string()), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    // Basic implementation (fetch all and aggregate)
    // Optimize with specialized tables/aggregates for scale
    const payments = await ctx.db.query("asaasPayments").collect();

    let totalReceived = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let countOverdue = 0;

    for (const p of payments) {
      if (args.startDate && p.dueDate < args.startDate) continue;
      if (args.endDate && p.dueDate > args.endDate) continue;

      if (p.status === "RECEIVED" || p.status === "CONFIRMED") {
         totalReceived += p.netValue || p.value;
      } else if (p.status === "PENDING") {
         totalPending += p.value;
      } else if (p.status === "OVERDUE") {
         totalOverdue += p.value;
         countOverdue++;
      }
    }

    return {
      received: totalReceived,
      pending: totalPending,
      overdue: totalOverdue,
      overdueCount: countOverdue
    };
  },
});

export const listPayments = query({
    args: {
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        if (args.status) {
            return await ctx.db
                .query("asaasPayments")
                .withIndex("by_status", (q) => q.eq("status", args.status as any))
                .take(limit);
        } else {
            return await ctx.db
                .query("asaasPayments")
                .order("desc")
                .take(limit);
        }
    }
});

export const getPaymentsByStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("asaasPayments")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();
  },
});

export const getPayment = query({
    args: { paymentId: v.id("asaasPayments") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.paymentId);
    }
});

// ═══════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════

export const registerSubscription = mutation({
  args: {
    studentId: v.id("students"),
    asaasSubscriptionId: v.string(),
    asaasCustomerId: v.string(),
    value: v.number(),
    cycle: v.union(v.literal("WEEKLY"), v.literal("BIWEEKLY"), v.literal("MONTHLY"), v.literal("QUARTERLY"), v.literal("SEMIANNUALLY"), v.literal("YEARLY")),
    status: v.union(v.literal("ACTIVE"), v.literal("INACTIVE"), v.literal("EXPIRED")),
    nextDueDate: v.string(),
    enrollmentId: v.optional(v.id("enrollments"))
  },
  handler: async (ctx, args) => {
      await ctx.db.insert("asaasSubscriptions", {
          studentId: args.studentId,
          asaasSubscriptionId: args.asaasSubscriptionId,
          asaasCustomerId: args.asaasCustomerId,
          value: args.value,
          cycle: args.cycle,
          status: args.status,
          nextDueDate: args.nextDueDate,
          enrollmentId: args.enrollmentId,
          createdAt: Date.now(),
          updatedAt: Date.now()
      });
  }
});
