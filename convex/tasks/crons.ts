import { internal } from '../_generated/api';
import { internalAction } from '../_generated/server';

export const sendTaskReminders = internalAction({
	args: {},
	handler: async (ctx) => {
		// Fetch tasks due today
		// biome-ignore lint/suspicious/noExplicitAny: internal api typing
		const tasks = await ctx.runQuery((internal as any).tasks.getTasksDueToday);

		const startOfDay = new Date();
		startOfDay.setHours(0, 0, 0, 0);

		for (const task of tasks) {
			// Idempotency: skip if already reminded today
			if (task.remindedAt && task.remindedAt > startOfDay.getTime()) continue;

			// Send Reminder
			// biome-ignore lint/suspicious/noExplicitAny: internal api typing
			await ctx.runMutation((internal as any).tasks.createTaskReminder, {
				taskId: task._id,
			});
		}
	},
});

export const reactivateIdleLeads = internalAction({
	args: {},
	handler: async (ctx) => {
		// Fetch idle leads (e.g., 30 days inactive)
		// biome-ignore lint/suspicious/noExplicitAny: internal api typing
		const leads = await ctx.runQuery((internal as any).leads.getIdleLeads, {
			days: 30,
			limit: 50, // Batch limit
		});

		for (const lead of leads) {
			// Reactivate
			// biome-ignore lint/suspicious/noExplicitAny: internal api typing
			await ctx.runMutation((internal as any).leads.reactivateLead, {
				leadId: lead._id,
			});
		}
	},
});
