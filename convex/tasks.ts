import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { getOrganizationId, hasPermission, requireAuth } from './lib/auth';
import { PERMISSIONS } from './lib/permissions';

// Helper: Validate user exists
// biome-ignore lint/suspicious/noExplicitAny: Context typing is complex for helpers
async function validateUserExists(ctx: any, userId: Id<'users'>) {
	const user = await ctx.db.get(userId);
	if (!user) {
		throw new Error(`Usuário mencionado não encontrado: ${userId}`);
	}
	return user;
}

// Helper: Validate mentioned users
// biome-ignore lint/suspicious/noExplicitAny: Context typing is complex for helpers
async function validateMentionedUsers(ctx: any, userIds: Id<'users'>[]) {
	if (!userIds || userIds.length === 0) return;
	for (const userId of userIds) {
		await validateUserExists(ctx, userId);
	}
}

// Helper: Get current user document
// biome-ignore lint/suspicious/noExplicitAny: Context typing is complex for helpers
async function getCurrentUser(ctx: any, clerkId: string) {
	const user = await ctx.db
		.query('users')
		// biome-ignore lint/suspicious/noExplicitAny: Query builder optimization
		.withIndex('by_clerk_id', (q: any) => q.eq('clerkId', clerkId))
		.unique();

	if (!user) {
		throw new Error('Usuário não encontrado na base de dados.');
	}
	return user;
}

export const listTasks = query({
	args: {
		leadId: v.optional(v.id('leads')),
		assignedTo: v.optional(v.id('users')),
		completed: v.optional(v.boolean()),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);
		const organizationId = await getOrganizationId(ctx);

		// Validate lead if filtering by it
		if (args.leadId) {
			const lead = await ctx.db.get(args.leadId);
			if (!lead || lead.organizationId !== organizationId) {
				throw new Error('Lead not found or does not belong to your organization.');
			}
		}

		// Validate assigned user if filtering by it
		if (args.assignedTo) {
			const user = await ctx.db.get(args.assignedTo);
			if (!user || user.organizationId !== organizationId) {
				throw new Error('User not found or does not belong to your organization.');
			}
		}

		// biome-ignore lint/suspicious/noExplicitAny: Complex query builder type
		let tasksQuery: any;

		if (args.leadId) {
			tasksQuery = ctx.db.query('tasks').withIndex('by_lead', (q) => q.eq('leadId', args.leadId));
		} else if (args.assignedTo) {
			tasksQuery = ctx.db
				.query('tasks')
				.withIndex('by_assigned_to', (q) => q.eq('assignedTo', args.assignedTo));
		} else {
			tasksQuery = ctx.db
				.query('tasks')
				.withIndex('by_organization', (q) => q.eq('organizationId', organizationId));
		}

		// Enforce organization scope via filter if we used an index that doesn't implicitly guarantee it (like by_assigned_to or by_lead theoretically, though we pre-validated)
		// For safety and strict verified comment compliance:

		// Enforce organization scope via filter if we used an index that doesn't implicitly guarantee it (like by_assigned_to or by_lead theoretically, though we pre-validated)
		// For safety and strict verified comment compliance:
		if (args.leadId || args.assignedTo) {
			// Used by_lead or by_assigned_to. We already validated the Lead/User belongs to Org.
			// But to be absolutely safe against tasks moved between leads/users (unlikely but possible), let's ensure task.organizationId matches.
			// biome-ignore lint/suspicious/noExplicitAny: Filter optimization
			tasksQuery = tasksQuery.filter((q: any) => q.eq(q.field('organizationId'), organizationId));
		}

		if (args.completed !== undefined) {
			// biome-ignore lint/suspicious/noExplicitAny: Filter builder optimization
			tasksQuery = tasksQuery.filter((q: any) => q.eq(q.field('completed'), args.completed));
		}

		return await tasksQuery.paginate(args.paginationOpts);
	},
});

export const getTasksDueToday = internalQuery({
	args: {
		cursor: v.optional(v.string()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const startOfDay = new Date();
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date();
		endOfDay.setHours(23, 59, 59, 999);

		const limit = args.limit ?? 50;

		const result = await ctx.db
			.query('tasks')
			.withIndex('by_due_date', (q) =>
				q.gte('dueDate', startOfDay.getTime()).lte('dueDate', endOfDay.getTime()),
			)
			.filter((q) => q.eq(q.field('completed'), false))
			.paginate({ cursor: args.cursor ?? null, numItems: limit });

		// Populate assignedTo and mentionedUserIds
		const tasksWithUsers = await Promise.all(
			result.page.map(async (task) => {
				const assignedToUser = task.assignedTo ? await ctx.db.get(task.assignedTo) : null;
				const mentionedUsers = task.mentionedUserIds
					? await Promise.all(task.mentionedUserIds.map((id) => ctx.db.get(id)))
					: [];

				return {
					...task,
					assignedToUser,
					mentionedUsers: mentionedUsers.filter((u) => u !== null),
				};
			}),
		);

		return {
			tasks: tasksWithUsers,
			continueCursor: result.continueCursor,
			isDone: result.isDone,
		};
	},
});

export const markTaskReminded = internalMutation({
	args: {
		taskId: v.id('tasks'),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.taskId, {
			remindedAt: Date.now(),
		});
	},
});

export const internalCreateTask = internalMutation({
	args: {
		description: v.string(),
		leadId: v.optional(v.id('leads')),
		studentId: v.optional(v.id('students')),
		dueDate: v.optional(v.number()),
		mentionedUserIds: v.optional(v.array(v.id('users'))),
		assignedTo: v.optional(v.id('users')),
		organizationId: v.string(),
		createdBy: v.string(),
	},
	handler: async (ctx, args) => {
		// No auth check for internal mutation

		const now = Date.now();

		// Build object to avoid undefined values
		// biome-ignore lint/suspicious/noExplicitAny: Dynamic fields
		const taskFields: any = {
			description: args.description,
			organizationId: args.organizationId,
			createdBy: args.createdBy,
			completed: false,
			createdAt: now,
			updatedAt: now,
		};

		if (args.leadId !== undefined) taskFields.leadId = args.leadId;
		if (args.studentId !== undefined) taskFields.studentId = args.studentId;
		if (args.dueDate !== undefined) taskFields.dueDate = args.dueDate;
		if (args.mentionedUserIds !== undefined) taskFields.mentionedUserIds = args.mentionedUserIds;
		if (args.assignedTo !== undefined) taskFields.assignedTo = args.assignedTo;

		const taskId = await ctx.db.insert('tasks', taskFields);

		// Handle Mentions
		if (args.mentionedUserIds && args.mentionedUserIds.length > 0) {
			for (const userId of args.mentionedUserIds) {
				await ctx.db.insert('taskMentions', {
					taskId,
					userId,
					organizationId: args.organizationId,
					createdAt: now,
				});
			}
		}

		// Activity Log
		await ctx.db.insert('activities', {
			type: 'task_created',
			description: `Task created (system): ${args.description}`,
			leadId: args.leadId,
			studentId: args.studentId,
			organizationId: args.organizationId,
			performedBy: args.createdBy,
			createdAt: now,
			metadata: {
				taskId,
				assignedTo: args.assignedTo,
				dueDate: args.dueDate,
			},
		});

		return taskId;
	},
});

export const getMyTasks = query({
	args: {
		userId: v.optional(v.id('users')),
		completed: v.optional(v.boolean()),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);
		const organizationId = await getOrganizationId(ctx);
		const currentUser = await getCurrentUser(ctx, identity.subject);

		let targetUserId = currentUser._id;

		// If userId is provided and different from current user, check permissions
		if (args.userId && args.userId !== currentUser._id) {
			const hasAccess = await hasPermission(ctx, PERMISSIONS.ALL);
			if (!hasAccess) {
				throw new Error('Permission denied. You cannot view tasks of other users.');
			}
			targetUserId = args.userId;
		}

		let tasksQuery = ctx.db
			.query('tasks')
			.withIndex('by_assigned_to', (q) => q.eq('assignedTo', targetUserId));

		// Scope to organization
		// biome-ignore lint/suspicious/noExplicitAny: Filter builder optimization
		tasksQuery = (tasksQuery as any).filter((q: any) =>
			q.eq(q.field('organizationId'), organizationId),
		);

		if (args.completed !== undefined) {
			// biome-ignore lint/suspicious/noExplicitAny: Query builder optimization
			tasksQuery = (tasksQuery as any).filter((q: any) =>
				q.eq(q.field('completed'), args.completed),
			);
		}

		return await tasksQuery.order('asc').paginate(args.paginationOpts);
	},
});

export const createTask = mutation({
	args: {
		description: v.string(),
		leadId: v.optional(v.id('leads')),
		studentId: v.optional(v.id('students')),
		dueDate: v.optional(v.number()),
		mentionedUserIds: v.optional(v.array(v.id('users'))),
		assignedTo: v.optional(v.id('users')),
	},
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Mutation has many validations
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);
		const organizationId = await getOrganizationId(ctx);

		const currentUser = await getCurrentUser(ctx, identity.subject);
		// Comment 1: Default assignedTo to current user if not provided
		const assignedToId = args.assignedTo ?? currentUser._id;

		// Validate mentioned users
		if (args.mentionedUserIds) {
			await validateMentionedUsers(ctx, args.mentionedUserIds);
		}

		// Validate lead exists and belongs to org
		if (args.leadId) {
			const lead = await ctx.db.get(args.leadId);
			if (!lead || lead.organizationId !== organizationId) {
				throw new Error('Lead não encontrado ou não pertence à organização.');
			}
		}

		// Validate student exists and belongs to org
		if (args.studentId) {
			const student = await ctx.db.get(args.studentId);
			if (!student || student.organizationId !== organizationId) {
				throw new Error('Aluno não encontrado ou não pertence à organização.');
			}
		}

		if (assignedToId) {
			// Validate assigned user exists
			const user = await validateUserExists(ctx, assignedToId);
			// Optional: We could also validate `user.organizationId === organizationId` strictly
			if (user.organizationId !== organizationId) {
				throw new Error('Cannot assign task to user from another organization.');
			}
		}

		const now = Date.now();

		// Build object to avoid undefined values
		// biome-ignore lint/suspicious/noExplicitAny: Dynamic fields
		const taskFields: any = {
			description: args.description,
			organizationId,
			createdBy: identity.subject,
			completed: false,
			createdAt: now,
			updatedAt: now,
			assignedTo: assignedToId, // Always set
		};

		if (args.leadId !== undefined) taskFields.leadId = args.leadId;
		if (args.studentId !== undefined) taskFields.studentId = args.studentId;
		if (args.dueDate !== undefined) taskFields.dueDate = args.dueDate;
		if (args.mentionedUserIds !== undefined) taskFields.mentionedUserIds = args.mentionedUserIds;
		// assignedTo is set above

		const taskId = await ctx.db.insert('tasks', taskFields);

		// Handle Mentions
		if (args.mentionedUserIds && args.mentionedUserIds.length > 0) {
			for (const userId of args.mentionedUserIds) {
				await ctx.db.insert('taskMentions', {
					taskId,
					userId,
					organizationId,
					createdAt: now,
				});
			}
		}

		// Activity Log
		await ctx.db.insert('activities', {
			type: 'task_created',
			description: `Task created: ${args.description}`,
			leadId: args.leadId,
			studentId: args.studentId,
			organizationId,
			performedBy: identity.subject,
			createdAt: now,
			metadata: {
				taskId,
				assignedTo: assignedToId,
				dueDate: args.dueDate,
				leadId: args.leadId,
				studentId: args.studentId,
			},
		});

		return taskId;
	},
});

export const updateTask = mutation({
	args: {
		taskId: v.id('tasks'),
		updates: v.object({
			description: v.optional(v.string()),
			dueDate: v.optional(v.number()),
			mentionedUserIds: v.optional(v.array(v.id('users'))),
			assignedTo: v.optional(v.id('users')),
			leadId: v.optional(v.id('leads')),
			studentId: v.optional(v.id('students')),
		}),
	},
	// Update Task Handler
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Mutation has many validation checks
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);
		const organizationId = await getOrganizationId(ctx);

		const task = await ctx.db.get(args.taskId);
		if (!task || task.organizationId !== organizationId) {
			throw new Error('Tarefa não encontrada ou sem permissão de acesso.');
		}

		const currentUser = await getCurrentUser(ctx, identity.subject);
		const isAdmin = await hasPermission(ctx, PERMISSIONS.ALL);
		const canEdit =
			task.createdBy === identity.subject || task.assignedTo === currentUser._id || isAdmin;

		if (!canEdit) {
			throw new Error(
				'Permissão negada. Apenas o criador, responsável ou administrador pode editar esta tarefa.',
			);
		}

		if (args.updates.mentionedUserIds) {
			await validateMentionedUsers(ctx, args.updates.mentionedUserIds);
		}

		if (args.updates.assignedTo) {
			await validateUserExists(ctx, args.updates.assignedTo);
		}

		if (args.updates.leadId) {
			const l = await ctx.db.get(args.updates.leadId);
			if (!l || l.organizationId !== organizationId) throw new Error('Lead inválido');
		}

		if (args.updates.studentId) {
			const s = await ctx.db.get(args.updates.studentId);
			if (!s || s.organizationId !== organizationId) throw new Error('Aluno inválido');
		}

		// Handle Mentions Update
		if (args.updates.mentionedUserIds !== undefined) {
			// Delete existing
			const existingMentions = await ctx.db
				.query('taskMentions')
				.withIndex('by_task', (q) => q.eq('taskId', args.taskId))
				.collect();

			for (const mention of existingMentions) {
				await ctx.db.delete(mention._id);
			}

			// Insert new
			for (const userId of args.updates.mentionedUserIds) {
				await ctx.db.insert('taskMentions', {
					taskId: args.taskId,
					userId,
					organizationId,
					createdAt: Date.now(),
				});
			}
		}

		// Build clean updates object
		// biome-ignore lint/suspicious/noExplicitAny: Dynamic fields
		const updates: any = { updatedAt: Date.now() };
		if (args.updates.description !== undefined) updates.description = args.updates.description;
		if (args.updates.dueDate !== undefined) updates.dueDate = args.updates.dueDate;
		if (args.updates.mentionedUserIds !== undefined)
			updates.mentionedUserIds = args.updates.mentionedUserIds;
		if (args.updates.assignedTo !== undefined) updates.assignedTo = args.updates.assignedTo;
		if (args.updates.leadId !== undefined) updates.leadId = args.updates.leadId;
		if (args.updates.studentId !== undefined) updates.studentId = args.updates.studentId;

		await ctx.db.patch(args.taskId, updates);

		await ctx.db.insert('activities', {
			type: 'task_updated',
			description: 'Task updated',
			leadId: task.leadId,
			studentId: task.studentId,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: {
				taskId: args.taskId,
				changes: Object.keys(args.updates),
			},
		});
	},
});

export const completeTask = mutation({
	args: {
		taskId: v.id('tasks'),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);
		const organizationId = await getOrganizationId(ctx);

		const task = await ctx.db.get(args.taskId);
		if (!task || task.organizationId !== organizationId) {
			throw new Error('Tarefa não encontrada ou sem permissão de acesso.');
		}

		const currentUser = await getCurrentUser(ctx, identity.subject);
		const isAdmin = await hasPermission(ctx, PERMISSIONS.ALL);
		const canEdit =
			task.createdBy === identity.subject || task.assignedTo === currentUser._id || isAdmin;

		if (!canEdit) {
			throw new Error(
				'Permissão negada. Apenas o criador, responsável ou administrador pode editar esta tarefa.',
			);
		}

		const now = Date.now();
		await ctx.db.patch(args.taskId, {
			completed: true,
			completedAt: now,
			updatedAt: now,
		});

		await ctx.db.insert('activities', {
			type: 'task_completed',
			description: `Task completed: ${task.description}`,
			leadId: task.leadId,
			studentId: task.studentId,
			organizationId,
			performedBy: identity.subject,
			createdAt: now,
			metadata: {
				taskId: args.taskId,
				completedBy: identity.subject,
				completedAt: now,
			},
		});
	},
});

export const deleteTask = mutation({
	args: {
		taskId: v.id('tasks'),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);
		const organizationId = await getOrganizationId(ctx);

		const task = await ctx.db.get(args.taskId);
		if (!task || task.organizationId !== organizationId) {
			throw new Error('Tarefa não encontrada ou sem permissão de acesso.');
		}

		// Only creator or admin can delete
		const isAdmin = await hasPermission(ctx, PERMISSIONS.ALL);
		const canDelete = task.createdBy === identity.subject || isAdmin;

		if (!canDelete) {
			throw new Error('Permissão negada. Apenas o criador ou admin pode excluir esta tarefa.');
		}

		await ctx.db.delete(args.taskId);

		await ctx.db.insert('activities', {
			type: 'task_updated', // Using 'task_updated' as proxy for deleted if 'task_deleted' type doesn't exist yet, plan said "or create new 'task_deleted'", but schema doesn't have it.
			description: 'Task deleted',
			leadId: task.leadId,
			studentId: task.studentId,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: {
				taskId: args.taskId,
				deletedBy: identity.subject,
			},
		});
	},
});

export const createTaskReminder = internalMutation({
	args: {
		taskId: v.id('tasks'),
		recipientId: v.union(v.id('students'), v.id('users')),
		recipientType: v.union(v.literal('student'), v.literal('lead'), v.literal('user')),
		taskDescription: v.string(),
		dueDate: v.number(),
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		// Insert Notification only - remindedAt is updated per-task in cron after all recipients succeed
		await ctx.db.insert('notifications', {
			organizationId: args.organizationId,
			recipientId: args.recipientId,
			recipientType: args.recipientType,
			type: 'task_reminder',
			title: 'Lembrete de Tarefa',
			message: `Você tem uma tarefa vencendo hoje: ${args.taskDescription}`,
			read: false,
			channel: 'system',
			status: 'sent',
			createdAt: Date.now(),
			link: `/dashboard/tasks?taskId=${args.taskId}`,
			metadata: { taskId: args.taskId, dueDate: args.dueDate },
		});
	},
});

export const logCronActivity = internalMutation({
	args: {
		type: v.string(),
		description: v.string(),
		metadata: v.optional(v.any()),
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert('activities', {
			// biome-ignore lint/suspicious/noExplicitAny: generic log type
			type: args.type as any,
			description: args.description,
			organizationId: args.organizationId,
			performedBy: 'system_cron',
			createdAt: Date.now(),
			metadata: args.metadata,
		});
	},
});
