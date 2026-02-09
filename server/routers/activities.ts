import { TRPCError } from '@trpc/server';
import { and, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { activities, tasks } from '../../drizzle/schema';
import { protectedProcedure, router } from '../_core/trpc';

export const activitiesRouter = router({
	/** List activities for an entity */
	list: protectedProcedure
		.input(
			z.object({
				leadId: z.number().optional(),
				studentId: z.number().optional(),
				enrollmentId: z.number().optional(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return [];

			const conditions = [eq(activities.organizationId, orgId)];

			if (input.leadId) conditions.push(eq(activities.leadId, input.leadId));
			if (input.studentId) conditions.push(eq(activities.studentId, input.studentId));
			if (input.enrollmentId) conditions.push(eq(activities.enrollmentId, input.enrollmentId));

			return await ctx.db
				.select()
				.from(activities)
				.where(and(...conditions))
				.orderBy(desc(activities.createdAt))
				.limit(input.limit)
				.offset(input.offset);
		}),

	/** Create activity */
	create: protectedProcedure
		.input(
			z.object({
				type: z.string(),
				description: z.string(),
				leadId: z.number().optional(),
				studentId: z.number().optional(),
				enrollmentId: z.number().optional(),
				conversationId: z.number().optional(),
				metadata: z.any().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });
			}

			const [created] = await ctx.db
				.insert(activities)
				.values({
					type: input.type as 'lead_criado',
					description: input.description,
					leadId: input.leadId,
					studentId: input.studentId,
					enrollmentId: input.enrollmentId,
					conversationId: input.conversationId,
					metadata: input.metadata,
					organizationId: orgId,
					userId: ctx.user?.clerkId,
					performedBy: ctx.user?.clerkId,
				})
				.returning();

			return created;
		}),
});

export const tasksRouter = router({
	/** List tasks */
	list: protectedProcedure
		.input(
			z.object({
				status: z.string().optional(),
				assignedTo: z.string().optional(),
				leadId: z.number().optional(),
				studentId: z.number().optional(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return { data: [], total: 0 };

			const conditions = [eq(tasks.organizationId, orgId)];

			if (input.status) conditions.push(eq(tasks.status, input.status));
			if (input.assignedTo) conditions.push(eq(tasks.assignedTo, input.assignedTo));
			if (input.leadId) conditions.push(eq(tasks.leadId, input.leadId));
			if (input.studentId) conditions.push(eq(tasks.studentId, input.studentId));

			const where = and(...conditions);

			const [data, [{ total }]] = await Promise.all([
				ctx.db
					.select()
					.from(tasks)
					.where(where)
					.orderBy(desc(tasks.dueDate))
					.limit(input.limit)
					.offset(input.offset),
				ctx.db.select({ total: count() }).from(tasks).where(where),
			]);

			return { data, total };
		}),

	/** Create task */
	create: protectedProcedure
		.input(
			z.object({
				title: z.string().optional(),
				description: z.string(),
				type: z.string().optional(),
				priority: z.string().default('medium'),
				dueDate: z.string().optional(),
				assignedTo: z.string().optional(),
				leadId: z.number().optional(),
				studentId: z.number().optional(),
				enrollmentId: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });
			}

			const [created] = await ctx.db
				.insert(tasks)
				.values({
					...input,
					organizationId: orgId,
					status: 'pending',
					createdBy: ctx.user?.clerkId,
					assignedTo: input.assignedTo ?? ctx.user?.clerkId,
					dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
				})
				.returning();

			return created;
		}),

	/** Update task */
	update: protectedProcedure
		.input(
			z.object({
				taskId: z.number(),
				patch: z.object({
					title: z.string().optional(),
					description: z.string().optional(),
					status: z.string().optional(),
					priority: z.string().optional(),
					assignedTo: z.string().optional(),
					dueDate: z.string().optional(),
				}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const updates: Record<string, unknown> = {
				...input.patch,
				updatedAt: new Date(),
			};

			if (input.patch.dueDate) {
				updates.dueDate = new Date(input.patch.dueDate);
			}
			if (input.patch.status === 'completed') {
				updates.completedAt = new Date();
			}

			const [updated] = await ctx.db
				.update(tasks)
				.set(updates)
				.where(eq(tasks.id, input.taskId))
				.returning();

			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Tarefa não encontrada' });
			}
			return updated;
		}),

	/** Delete task */
	delete: protectedProcedure
		.input(z.object({ taskId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const [deleted] = await ctx.db.delete(tasks).where(eq(tasks.id, input.taskId)).returning();

			if (!deleted) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Tarefa não encontrada' });
			}
			return { success: true };
		}),
});
