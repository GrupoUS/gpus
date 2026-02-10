/**
 * Export data from pre-exported Convex JSON files.
 *
 * Originally designed to pull from the Convex HTTP API, this script now
 * validates that the `data-export/` directory contains the expected JSON
 * files from a previous Convex export.
 *
 * Usage: bun run export:convex
 *
 * Prerequisites:
 *   - A `data-export/` directory with JSON files for each table
 *     (manually exported from the Convex dashboard or CLI).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const DATA_EXPORT_DIR = 'data-export';

/** All tables expected from the original Convex schema */
const EXPECTED_TABLES = [
	'users',
	'leads',
	'objections',
	'students',
	'enrollments',
	'conversations',
	'messages',
	'messageTemplates',
	'activities',
	'tasks',
	'taskMentions',
	'customFields',
	'customFieldValues',
	'notifications',
	'settings',
	'dailyMetrics',
	'lgpdConsent',
	'lgpdAudit',
	'lgpdRetention',
	'lgpdRequests',
	'lgpdDataBreach',
	'marketing_leads',
	'emailContacts',
	'emailLists',
	'emailCampaigns',
	'emailTemplates',
	'emailEvents',
	'asaasPayments',
	'asaasWebhooks',
	'asaasWebhookDeduplication',
	'asaasSubscriptions',
	'asaasSyncLogs',
	'asaasApiAudit',
	'financialMetrics',
	'asaasConflicts',
	'asaasAlerts',
	'organizationAsaasApiKeys',
	'rateLimits',
	'evolutionApiQueue',
	'tags',
	'leadTags',
] as const;

function validateExport() {
	if (!existsSync(DATA_EXPORT_DIR)) {
		console.error(`❌ Directory '${DATA_EXPORT_DIR}/' does not exist.`);
		console.error('   Export your Convex data first using the Convex dashboard or CLI.');
		process.exit(1);
	}

	const existingFiles = new Set(readdirSync(DATA_EXPORT_DIR));
	let totalRecords = 0;
	let missingCount = 0;

	console.log('Validating Convex data export...\n');

	for (const table of EXPECTED_TABLES) {
		const fileName = `${table}.json`;
		if (!existingFiles.has(fileName)) {
			console.warn(`⚠️  Missing: ${fileName}`);
			missingCount++;
			continue;
		}

		try {
			const raw = readFileSync(`${DATA_EXPORT_DIR}/${fileName}`, 'utf-8');
			const data: unknown[] = JSON.parse(raw);
			totalRecords += data.length;
			console.log(`✅ ${table}: ${data.length} records`);
		} catch (error) {
			console.error(
				`❌ Failed to read ${fileName}:`,
				error instanceof Error ? error.message : error,
			);
		}
	}

	console.log(`\n📊 Total records across all files: ${totalRecords}`);
	if (missingCount > 0) {
		console.warn(`⚠️  ${missingCount} table file(s) missing`);
	} else {
		console.log('✅ All expected table files present.');
	}
}

validateExport();
