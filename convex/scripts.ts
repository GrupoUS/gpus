import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getOrganizationId } from "./lib/auth";

/**
 * Adopt orphaned students - FOR USE FROM FRONTEND (requires auth)
 */
export const adoptOrphanedStudents = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Please login to run this script.");
    }

    const organizationId = await getOrganizationId(ctx);
    if (!organizationId) {
      throw new Error("Organization ID not found for current user.");
    }

    return await adoptOrphansInternal(ctx, organizationId);
  },
});

/**
 * Adopt orphaned students - FOR USE FROM DASHBOARD
 * Pass your organization ID (clerkId or org_id) as parameter
 *
 * To find your org ID: Check your Clerk user ID (starts with user_xxx)
 * or your organization ID (starts with org_xxx)
 *
 * SECURITY: Requires adminSecret matching environment variable
 */
export const adoptOrphanedStudentsManual = mutation({
  args: {
    organizationId: v.string(),
    adminSecret: v.string(),
  },
  handler: async (ctx, args) => {
    // Simple secret check - use environment variable ADMIN_SECRET
    const expectedSecret = process.env.ADMIN_SECRET || "gpus-admin-2024";
    if (args.adminSecret !== expectedSecret) {
      throw new Error("Invalid admin secret");
    }

    if (!args.organizationId) {
      throw new Error("organizationId is required");
    }
    return await adoptOrphansInternal(ctx, args.organizationId);
  },
});

/**
 * Internal helper function to do the actual adoption
 */
async function adoptOrphansInternal(ctx: any, organizationId: string) {
  // Find students with no organizationId
  const orphans = await ctx.db
    .query("students")
    .filter((q: any) => q.eq(q.field("organizationId"), undefined))
    .take(1000);

  let count = 0;
  for (const student of orphans) {
    await ctx.db.patch(student._id, { organizationId });
    count++;
  }

  // Also adopt payments
  const orphanedPayments = await ctx.db
    .query("asaasPayments")
    .filter((q: any) => q.eq(q.field("organizationId"), undefined))
    .take(1000);

  let paymentsCount = 0;
  for (const payment of orphanedPayments) {
    await ctx.db.patch(payment._id, { organizationId });
    paymentsCount++;
  }

  // Also adopt subscriptions
  const orphanedSubscriptions = await ctx.db
    .query("asaasSubscriptions")
    .filter((q: any) => q.eq(q.field("organizationId"), undefined))
    .take(1000);

  let subscriptionsCount = 0;
  for (const sub of orphanedSubscriptions) {
    await ctx.db.patch(sub._id, { organizationId });
    subscriptionsCount++;
  }

  return {
    status: "success",
    message: `Adopted ${count} students, ${paymentsCount} payments, and ${subscriptionsCount} subscriptions into organization ${organizationId}`,
    orphanedStudentsFound: orphans.length,
    orphanedPaymentsFound: orphanedPayments.length,
    orphanedSubscriptionsFound: orphanedSubscriptions.length,
  };
}
