/**
 * Validate data imported into NeonDB against pre-exported Convex JSON files.
 *
 * Compares record counts between `data-export/*.json` and the corresponding
 * NeonDB tables to ensure completeness.
 *
 * Usage: bun run validate:data
 *
 * Prerequisites:
 *   - DATABASE_URL environment variable set
 *   - `data-export/` directory with JSON files
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { count } from 'drizzle-orm';

// biome-ignore lint/performance/noNamespaceImport: drizzle relational queries require namespace import
import * as schema from '../drizzle/schema';
import { db } from '../server/db';

const DATA_EXPORT_DIR = 'data-export';

/** Tables to validate (subset of most important ones) */
const TABLES_TO_VALIDATE = [
	'users',
	'leads',
	'students',
	'enrollments',
	'activities',
	'tasks',
	'conversations',
	'messages',
	'notifications',
	'settings',
	'emailContacts',
	'asaasPayments',
	'asaasSubscriptions',
	'asaasSyncLogs',
	'financialMetrics',
	'tags',
	'leadTags',
] as const;

async function validateData() {
	console.log('Starting data validation...\n');

	let passed = 0;
	let failed = 0;
	let skipped = 0;

	for (const tableName of TABLES_TO_VALIDATE) {
		const filePath = path.join(DATA_EXPORT_DIR, `${tableName}.json`);

		if (!existsSync(filePath)) {
			console.warn(`⚠️  Skipping '${tableName}' — no export file found`);
			skipped++;
			continue;
		}

		const tableSchema = (schema as Record<string, unknown>)[tableName];
		if (!tableSchema) {
			console.warn(`⚠️  Skipping '${tableName}' — no Drizzle table schema found`);
			skipped++;
			continue;
		}

		try {
			const raw = readFileSync(filePath, 'utf-8');
			const exportedData: unknown[] = JSON.parse(raw);
			const exportCount = exportedData.length;

			const [result] = await (db as any).select({ total: count() }).from(tableSchema);

			const neonCount = Number(result?.total ?? 0);

			if (exportCount === neonCount) {
				console.log(`✅ ${tableName}: ${neonCount} records (matches export)`);
				passed++;
			} else {
				console.error(`❌ ${tableName}: Export=${exportCount}, NeonDB=${neonCount} (MISMATCH)`);
				failed++;
			}
		} catch (error) {
			console.error(
				`❌ ${tableName}: validation error —`,
				error instanceof Error ? error.message : error,
			);
			failed++;
		}
	}

	console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);

	if (failed > 0) {
		console.error('\n⚠️  Some tables have mismatched counts. Review above.');
		process.exit(1);
	}

	console.log('\n✅ All validated tables match.');
}

validateData().catch((err) => {
	console.error('Validation failed:', err);
	process.exit(1);
});
