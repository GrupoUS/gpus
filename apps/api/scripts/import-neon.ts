/**
 * Import pre-exported Convex data into NeonDB.
 *
 * Reads JSON files from `data-export/`, transforms Convex documents
 * (camelCase keys → snake_case, _id removal, _creationTime → createdAt),
 * and inserts them into the corresponding Drizzle tables.
 *
 * Convex string IDs (_id) are NOT used as PKs — the Drizzle schema uses
 * auto-increment integer PKs. A deterministic ID map is built during
 * import to resolve foreign-key references.
 *
 * Usage: bun run import:neon
 *
 * Prerequisites:
 *   - DATABASE_URL environment variable set
 *   - `data-export/` directory with JSON files (run export:convex first)
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// biome-ignore lint/performance/noNamespaceImport: drizzle relational queries require namespace import
import * as schema from '../drizzle/schema';
import { db } from '../server/db';

const DATA_EXPORT_DIR = 'data-export';

/** Tables to import, ordered by dependency (parents first) */
const TABLES_IN_ORDER = [
	'users',
	'leads',
	'students',
	'enrollments',
	'tags',
	'leadTags',
	'objections',
	'activities',
	'tasks',
	'taskMentions',
	'customFields',
	'customFieldValues',
	'settings',
	'dailyMetrics',
	'conversations',
	'messages',
	'notifications',
	'lgpdConsent',
	'lgpdAudit',
	'lgpdRequests',
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
] as const;

/**
 * Maps Convex string IDs → Neon auto-generated integer IDs.
 * Populated during insertion so FK references can be resolved.
 */
const convexIdMap = new Map<string, number>();

/** Convert a camelCase key to snake_case */
function toSnakeCase(key: string): string {
	return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** Transform a single Convex document for Drizzle insertion */
function transformRow(row: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(row)) {
		// Skip internal Convex fields
		if (key === '_id') continue;

		if (key === '_creationTime' && typeof value === 'number') {
			result.created_at = new Date(value);
			continue;
		}

		const snakeKey = toSnakeCase(key);
		result[snakeKey] = value;
	}

	return result;
}

async function importAllData() {
	console.log('Starting data import to NeonDB...\n');

	for (const tableName of TABLES_IN_ORDER) {
		const filePath = path.join(DATA_EXPORT_DIR, `${tableName}.json`);

		if (!existsSync(filePath)) {
			console.warn(`⚠️  File not found: ${filePath} — skipping ${tableName}`);
			continue;
		}

		try {
			const raw = readFileSync(filePath, 'utf-8');
			const data = JSON.parse(raw) as Record<string, unknown>[];

			if (data.length === 0) {
				console.log(`⚪️ No data to import for '${tableName}'.`);
				continue;
			}

			// Resolve the Drizzle table object
			const tableSchema = (schema as Record<string, unknown>)[tableName];
			if (!tableSchema) {
				console.warn(`⚠️  Schema for table '${tableName}' not found in drizzle/schema. Skipping.`);
				continue;
			}

			const transformedData = data.map((row) => {
				const transformed = transformRow(row);

				// Resolve FK references using the ID map
				for (const [key, value] of Object.entries(transformed)) {
					if (
						typeof value === 'string' &&
						convexIdMap.has(value) &&
						key !== 'organization_id' &&
						key !== 'clerk_id'
					) {
						transformed[key] = convexIdMap.get(value);
					}
				}

				return transformed;
			});

			// Insert and capture generated IDs for the ID map
			const inserted = await (db as any)
				.insert(tableSchema)
				.values(transformedData)
				.onConflictDoNothing()
				.returning({ id: (tableSchema as any).id });

			// Map original Convex _id → new integer ID
			for (let i = 0; i < data.length && i < inserted.length; i++) {
				const convexId = data[i]._id;
				if (typeof convexId === 'string' && inserted[i]?.id != null) {
					convexIdMap.set(convexId, inserted[i].id as number);
				}
			}

			console.log(`✅ Imported ${inserted.length} records into '${tableName}'`);
		} catch (error) {
			console.error(
				`❌ Failed to import '${tableName}':`,
				error instanceof Error ? error.message : error,
			);
		}
	}

	console.log('\n📊 ID mappings created:', convexIdMap.size);
	console.log('Data import process completed.');
}

importAllData().catch((err) => {
	console.error('Import failed:', err);
	process.exit(1);
});
