import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { users } from '../../drizzle/schema';
import { protectedProcedure, router } from '../_core/trpc';

export const usersRouter = router({
	/** Get current authenticated user */
	me: protectedProcedure.query(({ ctx }) => {
		return ctx.user;
	}),

	/** List all users in the organization */
	list: protectedProcedure.query(async ({ ctx }) => {
		const orgId = ctx.user?.organizationId;
		if (!orgId) return [];

		return await ctx.db.select().from(users).where(eq(users.organizationId, orgId));
	}),

	/** List users for dropdown selectors (minimal data) */
	listSystemUsers: protectedProcedure.query(async ({ ctx }) => {
		const orgId = ctx.user?.organizationId;
		if (!orgId) return [];

		return await ctx.db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role,
			})
			.from(users)
			.where(eq(users.organizationId, orgId));
	}),

	/** Get user by ID */
	get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
		const [user] = await ctx.db.select().from(users).where(eq(users.id, input.id)).limit(1);

		if (!user) {
			throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
		}
		return user;
	}),

	/** Sync user from Clerk (ensure exists) */
	ensureUser: protectedProcedure
		.input(
			z.object({
				clerkId: z.string(),
				email: z.string().email(),
				name: z.string(),
				avatarUrl: z.string().optional(),
				organizationId: z.string().optional(),
				role: z.enum(['admin', 'sdr', 'cs', 'support', 'member']).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [existing] = await ctx.db
				.select()
				.from(users)
				.where(eq(users.clerkId, input.clerkId))
				.limit(1);

			if (existing) {
				const [updated] = await ctx.db
					.update(users)
					.set({
						email: input.email,
						name: input.name,
						avatarUrl: input.avatarUrl ?? existing.avatarUrl,
						organizationId: input.organizationId ?? existing.organizationId,
						lastLoginAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(users.id, existing.id))
					.returning();
				return updated;
			}

			const [created] = await ctx.db
				.insert(users)
				.values({
					clerkId: input.clerkId,
					email: input.email,
					name: input.name,
					role: input.role ?? 'member',
					avatarUrl: input.avatarUrl,
					organizationId: input.organizationId,
					lastLoginAt: new Date(),
				})
				.returning();
			return created;
		}),

	/** Update user (admin) */
	update: protectedProcedure
		.input(
			z.object({
				userId: z.number(),
				patch: z.object({
					name: z.string().optional(),
					role: z.enum(['admin', 'sdr', 'cs', 'support', 'member']).optional(),
					isActive: z.boolean().optional(),
					phone: z.string().optional(),
					department: z.string().optional(),
				}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(users)
				.set({ ...input.patch, updatedAt: new Date() })
				.where(eq(users.id, input.userId))
				.returning();

			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
			}
			return updated;
		}),

	/** Update own profile */
	updateProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().optional(),
				avatarUrl: z.string().optional(),
				preferences: z
					.object({
						notifications: z.boolean().optional(),
						theme: z.string().optional(),
						sidebarCollapsed: z.boolean().optional(),
					})
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: 'UNAUTHORIZED' });
			}

			const [updated] = await ctx.db
				.update(users)
				.set({
					...(input.name && { name: input.name }),
					...(input.avatarUrl && { avatarUrl: input.avatarUrl }),
					...(input.preferences && { preferences: input.preferences }),
					updatedAt: new Date(),
				})
				.where(eq(users.id, ctx.user.id))
				.returning();

			return updated;
		}),

	/** Delete user (soft delete — set isActive false) */
	delete: protectedProcedure
		.input(z.object({ userId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const [deleted] = await ctx.db
				.update(users)
				.set({ isActive: false, updatedAt: new Date() })
				.where(eq(users.id, input.userId))
				.returning();

			if (!deleted) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
			}
			return deleted;
		}),
});
