/**
 * Bun-based scheduler for server-side cron jobs.
 * Server-side scheduled tasks (replaces previous cron system).
 */

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
	setInterval(
		() => {
			// TODO: Implement sync logic
		},
		60 * 60 * 1000,
	);

	// 2. ASAAS Payment Sync — every 30 minutes
	setInterval(
		() => {
			// TODO: Implement sync logic
		},
		30 * 60 * 1000,
	);

	// 3. ASAAS Alert Check — every 5 minutes
	setInterval(
		() => {
			// TODO: Check API health, sync failures, rate limits, webhook issues, conflicts
		},
		5 * 60 * 1000,
	);

	// 4. ASAAS Webhook Retry — every 5 minutes
	setInterval(
		() => {
			// TODO: Retry failed webhooks
		},
		5 * 60 * 1000,
	);

	// 5. WhatsApp Message Queue — every 1 minute
	setInterval(() => {
		// TODO: Process queued Evolution API messages
	}, 60 * 1000);

	// 6. Task Reminders — Daily 8 AM UTC
	scheduleDailyTask(8, 0, () => {
		// TODO: Query overdue tasks and send notifications
	});

	// 7. Idle Lead Reactivation — Daily 8 AM UTC
	scheduleDailyTask(8, 0, () => {
		// TODO: Find stale leads and bump them
	});
}

function scheduleDailyTask(hourUTC: number, minuteUTC: number, fn: () => void) {
	const runAtNextTime = () => {
		const now = new Date();
		const next = new Date(now);
		next.setUTCHours(hourUTC, minuteUTC, 0, 0);
		if (next <= now) next.setDate(next.getDate() + 1);
		const ms = next.getTime() - now.getTime();
		setTimeout(() => {
			fn();
			runAtNextTime();
		}, ms);
	};
	runAtNextTime();
}
