import { mutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { requireAuth } from './lib/auth';

/**
 * Temporary public mutation to trigger student organizationId migration
 * This calls internal.migrations.migrateStudentOrganizationId
 */
export const triggerStudentMigration = mutation({
  args: { organizationId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<{
    migrated: number;
    organizationId: string | null;
    message: string;
  }> => {
    // Only authenticated users can execute migration
    const identity = await requireAuth(ctx);

    // Call internal mutation
    const result: {
      migrated: number;
      organizationId: string | null;
      message: string;
    } = await ctx.runMutation(
      internal.migrations.migrateStudentOrganizationId,
      args
    );

    console.log(`[Migration] Triggered by ${identity.subject}:`, result);

    return result;
  },
});
