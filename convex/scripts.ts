import { mutation } from "./_generated/server";
import { getOrganizationId } from "./lib/auth";

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

    // Find students with no organizationId
    // Note: We can't index on 'undefined' easily, so we might need to filter.
    // Ideally we would have an index, but for a repair script, full scan or close to it is acceptable if dataset isn't huge.
    // Or we can use the 'by_organization' index and look for null? No, sparse index excludes them?
    // Convex indexes include null/undefined if indexed?
    // Schema says: .index('by_organization', ['organizationId'])
    // If organizationId is optional, they should be in the index with value null/undefined.
    // Let's try to query with organizationId = undefined or null.

    const orphans = await ctx.db
      .query("students")
      .filter((q) => q.eq(q.field("organizationId"), undefined))
      .take(1000); // Process in batches if needed

    let count = 0;
    for (const student of orphans) {
      await ctx.db.patch(student._id, { organizationId });
      count++;
    }

    // Also adopt payments
    const orphanedPayments = await ctx.db
       .query("asaasPayments")
       .filter((q) => q.eq(q.field("organizationId"), undefined))
       .take(1000);

    let paymentsCount = 0;
    for (const payment of orphanedPayments) {
        await ctx.db.patch(payment._id, { organizationId });
        paymentsCount++;
    }

    return {
      status: "success",
      message: `Adopted ${count} students and ${paymentsCount} payments into organization ${organizationId}`,
      orphanedStudentsFound: orphans.length,
      orphanedPaymentsFound: orphanedPayments.length
    };
  },
});
