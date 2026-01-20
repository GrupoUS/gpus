import { internal } from '../_generated/api';
import { internalAction } from '../_generated/server';

export const sendTaskReminders = internalAction({
	args: {},
	handler: async (ctx) => {
		const result = {
			tasksProcessed: 0,
			notificationsSent: 0,
			errors: [] as string[],
		};

		try {
			// biome-ignore lint/suspicious/noExplicitAny: internal api typing
			const tasks = (await ctx.runQuery((internal as any).tasks.getTasksDueToday)) as any[];

			const startOfDay = new Date();
			startOfDay.setHours(0, 0, 0, 0);

			for (const task of tasks) {
				try {
					// Idempotency check handled in query filtering mostly, but double check
					if (task.remindedAt && task.remindedAt > startOfDay.getTime()) continue;

// sent variable removed as it was unused

					// 1. Notify Assigned User
					if (task.assignedTo) {
						// biome-ignore lint/suspicious/noExplicitAny: internal api typing
						await ctx.runMutation((internal as any).tasks.createTaskReminder, {
							taskId: task._id,
							recipientId: task.assignedTo,
							recipientType: 'user',
							taskDescription: task.description,
							dueDate: task.dueDate!,
						});
						result.notificationsSent++;
					}

					// 2. Notify Mentioned Users
					if (task.mentionedUserIds && task.mentionedUserIds.length > 0) {
						for (const userId of task.mentionedUserIds) {
							// biome-ignore lint/suspicious/noExplicitAny: internal api typing
							await ctx.runMutation((internal as any).tasks.createTaskReminder, {
								taskId: task._id,
								recipientId: userId,
								recipientType: 'user',
								taskDescription: task.description,
								dueDate: task.dueDate!,
							});
							result.notificationsSent++;
						}
					}

					result.tasksProcessed++;
				} catch (err: any) {
					console.error(`Error processing task reminder ${task._id}:`, err);
					result.errors.push(`Task ${task._id}: ${err.message}`);
				}
			}

			// Log Activity
			// biome-ignore lint/suspicious/noExplicitAny: internal api typing
			await ctx.runMutation((internal as any).tasks.logCronActivity, {
				type: 'system_task_reminder',
				description: `Sent ${result.notificationsSent} reminders for ${result.tasksProcessed} tasks`,
				organizationId: 'system',
				metadata: { transform: result },
			});

			return result;
		} catch (err: any) {
			console.error('Fatal error in sendTaskReminders:', err);
			throw new Error(`Cron failed: ${err.message}`);
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
				} catch (err: any) {
					console.error(`Error reactivating lead ${lead._id}:`, err);
					result.errors.push(`Lead ${lead._id}: ${err.message}`);
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
		} catch (err: any) {
			console.error('Fatal error in reactivateIdleLeads:', err);
			throw new Error(`Cron failed: ${err.message}`);
		}
	},
});
