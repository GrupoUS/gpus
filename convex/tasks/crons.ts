import { v } from 'convex/values';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const internal = require('../_generated/api').internal;

import { internalAction } from '../_generated/server';

export const sendTaskReminders = internalAction({
	args: {
		cursor: v.optional(v.string()),
	},
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Cron job has complex nested logic
	handler: async (ctx, args) => {
		const result = {
			tasksProcessed: 0,
			notificationsSent: 0,
			errors: [] as string[],
		};

		try {
			// biome-ignore lint/suspicious/noExplicitAny: Break type instantiation recursion
			const getTasksDueToday = (internal as any).tasks.getTasksDueToday;
			const queryResult = (await ctx.runQuery(getTasksDueToday, {
				cursor: args.cursor,
				limit: 50,
				// biome-ignore lint/suspicious/noExplicitAny: Internal query result
			})) as { tasks: any[]; continueCursor: string; isDone: boolean };

			const startOfDay = new Date();
			startOfDay.setHours(0, 0, 0, 0);

			for (const task of queryResult.tasks) {
				try {
					// Idempotency check
					if (task.remindedAt && task.remindedAt > startOfDay.getTime()) continue;
					if (!task.dueDate) continue;

					// Collect unique recipients for this task
					const recipientIds = new Set<string>();
					if (task.assignedTo) recipientIds.add(task.assignedTo);
					if (task.mentionedUserIds) {
						for (const userId of task.mentionedUserIds) {
							recipientIds.add(userId);
						}
					}

					if (recipientIds.size === 0) {
						result.tasksProcessed++;
						continue;
					}

					// Track success for all recipients
					let allSucceeded = true;

					for (const recipientId of recipientIds) {
						try {
							// biome-ignore lint/suspicious/noExplicitAny: internal api typing
							await ctx.runMutation((internal as any).tasks.createTaskReminder, {
								taskId: task._id,
								recipientId,
								recipientType: 'user',
								taskDescription: task.description,
								dueDate: task.dueDate,
								organizationId: task.organizationId,
							});
							result.notificationsSent++;
						} catch (err: unknown) {
							allSucceeded = false;
							const msg = err instanceof Error ? err.message : String(err);
							// biome-ignore lint/suspicious/noConsole: Cron logging
							console.error(
								`Error sending notification to ${recipientId} for task ${task._id}:`,
								msg,
							);
							result.errors.push(`Task ${task._id} recipient ${recipientId}: ${msg}`);
						}
					}

					// Only mark remindedAt if all recipients were successfully notified
					if (allSucceeded) {
						// biome-ignore lint/suspicious/noExplicitAny: internal api typing
						await ctx.runMutation((internal as any).tasks.markTaskReminded, {
							taskId: task._id,
						});
					}

					result.tasksProcessed++;
				} catch (err: unknown) {
					const msg = err instanceof Error ? err.message : String(err);
					// biome-ignore lint/suspicious/noConsole: Cron logging
					console.error(`Error processing task reminder ${task._id}:`, msg);
					result.errors.push(`Task ${task._id}: ${msg}`);
				}
			}

			// Schedule continuation if more tasks remain
			if (!queryResult.isDone && queryResult.continueCursor) {
				// biome-ignore lint/suspicious/noExplicitAny: internal api typing
				await ctx.scheduler.runAfter(0, (internal as any).tasks.crons.sendTaskReminders, {
					cursor: queryResult.continueCursor,
				});
			}

			// Log Activity
			// biome-ignore lint/suspicious/noExplicitAny: internal api typing
			await ctx.runMutation((internal as any).tasks.logCronActivity, {
				type: 'system_task_reminder',
				description: `Sent ${result.notificationsSent} reminders for ${result.tasksProcessed} tasks`,
				organizationId: 'system',
				metadata: { transform: result, hasMore: !queryResult.isDone },
			});

			return result;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			const stack = err instanceof Error ? err.stack : undefined;
			// biome-ignore lint/suspicious/noConsole: Cron logging
			console.error('Fatal error in sendTaskReminders:', msg);

			// Log failure activity before rethrow
			// biome-ignore lint/suspicious/noExplicitAny: internal api typing
			await ctx.runMutation((internal as any).tasks.logCronActivity, {
				type: 'system_task_reminder_failed',
				description: `Cron failed: ${msg}`,
				organizationId: 'system',
				metadata: { error: msg, stack },
			});

			throw new Error(`Cron failed: ${msg}`);
		}
	},
});

export const reactivateIdleLeads = internalAction({
	args: {},
	handler: async (ctx) => {
		const result = {
			leadsProcessed: 0,
			leadsReactivated: 0,
			errors: [] as string[],
		};

		try {
			// biome-ignore lint/suspicious/noExplicitAny: internal api typing
			const leads = await ctx.runQuery((internal as any).leads.getIdleLeads, {
				days: 7, // Plan says 7 days
				limit: 50,
			});

			for (const lead of leads) {
				try {
					result.leadsProcessed++;
					// biome-ignore lint/suspicious/noExplicitAny: internal api typing
					await ctx.runMutation((internal as any).leads.reactivateLead, {
						leadId: lead._id,
					});
					result.leadsReactivated++;
				} catch (err: unknown) {
					const msg = err instanceof Error ? err.message : String(err);
					// biome-ignore lint/suspicious/noConsole: Cron logging
					console.error(`Error reactivating lead ${lead._id}:`, msg);
					result.errors.push(`Lead ${lead._id}: ${msg}`);
				}
			}

			// biome-ignore lint/suspicious/noExplicitAny: internal api typing
			await ctx.runMutation((internal as any).tasks.logCronActivity, {
				type: 'system_lead_reactivation',
				description: `Reactivated ${result.leadsReactivated} idle leads`,
				organizationId: 'system',
				metadata: { transform: result },
			});

			return result;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			const stack = err instanceof Error ? err.stack : undefined;
			// biome-ignore lint/suspicious/noConsole: Cron logging
			console.error('Fatal error in reactivateIdleLeads:', msg);

			// Log failure activity before rethrow
			// biome-ignore lint/suspicious/noExplicitAny: internal api typing
			await ctx.runMutation((internal as any).tasks.logCronActivity, {
				type: 'system_lead_reactivation_failed',
				description: `Cron failed: ${msg}`,
				organizationId: 'system',
				metadata: { error: msg, stack },
			});

			throw new Error(`Cron failed: ${msg}`);
		}
	},
});
