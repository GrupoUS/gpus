import { TRPCError } from '@trpc/server';
import { and, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { conversations, messages } from '../../drizzle/schema';
import { protectedProcedure, router } from '../_core/trpc';

const channels = ['whatsapp', 'instagram', 'portal', 'email'] as const;
const conversationStatuses = [
	'aguardando_atendente',
	'em_atendimento',
	'aguardando_cliente',
	'resolvido',
	'bot_ativo',
] as const;

export const conversationsRouter = router({
	/** List conversations */
	list: protectedProcedure
		.input(
			z.object({
				status: z.enum(conversationStatuses).optional(),
				channel: z.enum(channels).optional(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return { data: [], total: 0 };

			const conditions = [eq(conversations.organizationId, orgId)];

			if (input.status) {
				conditions.push(eq(conversations.status, input.status));
			}
			if (input.channel) {
				conditions.push(eq(conversations.channel, input.channel));
			}

			const where = and(...conditions);

			const [data, [{ total }]] = await Promise.all([
				ctx.db
					.select()
					.from(conversations)
					.where(where)
					.orderBy(desc(conversations.updatedAt))
					.limit(input.limit)
					.offset(input.offset),
				ctx.db.select({ total: count() }).from(conversations).where(where),
			]);

			return { data, total };
		}),

	/** Get conversation by ID */
	get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
		const [conversation] = await ctx.db
			.select()
			.from(conversations)
			.where(eq(conversations.id, input.id))
			.limit(1);

		if (!conversation) {
			throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversa não encontrada' });
		}
		return conversation;
	}),

	/** Create conversation */
	create: protectedProcedure
		.input(
			z.object({
				channel: z.enum(channels),
				leadId: z.number().optional(),
				studentId: z.number().optional(),
				status: z.enum(conversationStatuses).default('aguardando_atendente'),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });
			}

			const [created] = await ctx.db
				.insert(conversations)
				.values({
					...input,
					organizationId: orgId,
					assignedTo: ctx.user?.clerkId,
				})
				.returning();

			return created;
		}),

	/** Update conversation status */
	updateStatus: protectedProcedure
		.input(
			z.object({
				conversationId: z.number(),
				status: z.enum(conversationStatuses),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const updates: Record<string, unknown> = {
				status: input.status,
				updatedAt: new Date(),
			};

			if (input.status === 'resolvido') {
				updates.resolvedAt = new Date();
			}

			const [updated] = await ctx.db
				.update(conversations)
				.set(updates)
				.where(eq(conversations.id, input.conversationId))
				.returning();

			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversa não encontrada' });
			}
			return updated;
		}),
});

const contentTypes = ['text', 'image', 'audio', 'document', 'template'] as const;

export const messagesRouter = router({
	/** List messages for a conversation */
	listByConversation: protectedProcedure
		.input(
			z.object({
				conversationId: z.number(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			return await ctx.db
				.select()
				.from(messages)
				.where(eq(messages.conversationId, input.conversationId))
				.orderBy(desc(messages.createdAt))
				.limit(input.limit)
				.offset(input.offset);
		}),

	/** Send message */
	send: protectedProcedure
		.input(
			z.object({
				conversationId: z.number(),
				content: z.string(),
				contentType: z.enum(contentTypes).default('text'),
				mediaUrl: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [created] = await ctx.db
				.insert(messages)
				.values({
					conversationId: input.conversationId,
					content: input.content,
					contentType: input.contentType,
					mediaUrl: input.mediaUrl,
					sender: 'agent',
					senderId: ctx.user?.clerkId,
					status: 'enviado',
				})
				.returning();

			// Update conversation lastMessageAt
			await ctx.db
				.update(conversations)
				.set({
					lastMessageAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(conversations.id, input.conversationId));

			return created;
		}),
});
