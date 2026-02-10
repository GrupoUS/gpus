/**
 * Bun-based scheduler for server-side cron jobs.
 * Server-side scheduled tasks using node-cron for reliable scheduling.
 */
import cron from 'node-cron';

const IS_DEV = process.env.NODE_ENV !== 'production';

export function initSchedulers() {
	if (IS_DEV) {
		// biome-ignore lint/suspicious/noConsole: Scheduler lifecycle log
		console.info('[scheduler] Skipping schedulers in development mode');
		return;
	}

	// biome-ignore lint/suspicious/noConsole: Scheduler lifecycle log
	console.info('[scheduler] Initializing 7 scheduled tasks');

	// 1. ASAAS Customer Sync — every 1 hour
	cron.schedule('0 * * * *', () => {
		// TODO: Implement sync logic
	});

	// 2. ASAAS Payment Sync — every 30 minutes
	cron.schedule('*/30 * * * *', () => {
		// TODO: Implement sync logic
	});

	// 3. ASAAS Alert Check — every 5 minutes
	cron.schedule('*/5 * * * *', () => {
		// TODO: Check API health, sync failures, rate limits, webhook issues, conflicts
	});

	// 4. ASAAS Webhook Retry — every 5 minutes
	cron.schedule('*/5 * * * *', () => {
		// TODO: Retry failed webhooks
	});

	// 5. WhatsApp Message Queue — every 1 minute
	cron.schedule('* * * * *', () => {
		// TODO: Process queued Evolution API messages
	});

	// 6. Task Reminders — Daily 8 AM UTC
	cron.schedule(
		'0 8 * * *',
		() => {
			// TODO: Query overdue tasks and send notifications
		},
		{ timezone: 'UTC' },
	);

	// 7. Idle Lead Reactivation — Daily 8 AM UTC
	cron.schedule(
		'0 8 * * *',
		() => {
			// TODO: Find stale leads and bump them
		},
		{ timezone: 'UTC' },
	);
}
