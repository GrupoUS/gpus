import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error('DATABASE_URL is required');
}

const client = neon(connectionString);
const db = drizzle(client);

async function main() {
	console.log('Resetting database...');

	// Drop all tables with CASCADE
	const tables = [
		'users',
		'leads',
		'activities',
		'custom_field_values',
		'custom_fields',
		'daily_metrics',
		'lead_tags',
		'objections',
		'settings',
		'tags',
		'task_mentions',
		'tasks',
		'asaas_alerts',
		'asaas_api_audit',
		'asaas_conflicts',
		'asaas_payments',
		'asaas_subscriptions',
		'asaas_sync_logs',
		'asaas_webhook_deduplication',
		'asaas_webhooks',
		'evolution_api_queue',
		'financial_metrics',
		'organization_asaas_api_keys',
		'rate_limits',
		'lgpd_audit',
		'lgpd_consent',
		'lgpd_data_breach',
		'lgpd_requests',
		'lgpd_retention',
		'email_campaigns',
		'email_contacts',
		'email_events',
		'email_lists',
		'email_templates',
		'marketing_leads',
		'conversations',
		'message_templates',
		'messages',
		'notifications',
		'enrollments',
		'students',
	];

	const dropQuery = sql.raw(`DROP TABLE IF EXISTS ${tables.join(', ')} CASCADE`);

	console.log('Dropping tables...');
	await db.execute(dropQuery);

	// Also drop enums if needed, but Drizzle usually handles valid enum creation if they don't exist.
	// For clean slate, dropping types is good too.
	// But let's start with tables. db:push will recreate enums if needed or reuse.

	console.log('Database reset successfully!');
}

main().catch((err) => {
	console.error('Reset failed:', err);
	process.exit(1);
});
