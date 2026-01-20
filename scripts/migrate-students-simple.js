#!/usr/bin/env node

/**
 * Migration script to fix organizationId for students without one
 * This fixes the bug where XLSX import didn't set organizationId
 */

import { ConvexClient } from 'convex/browser';

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
	console.error('❌ ERROR: CONVEX_URL environment variable not found');
	process.exit(1);
}

console.log('🚀 Starting student organizationId migration...');
console.log(`📍 Convex URL: ${CONVEX_URL}`);

// Use admin credentials for this migration
// You need to pass the authorization token via environment variable
const ADMIN_TOKEN = process.env.ADMIN_AUTH_TOKEN;

if (!ADMIN_TOKEN) {
	console.error('❌ ERROR: ADMIN_AUTH_TOKEN not set');
	console.log(
		'Please run: ADMIN_AUTH_TOKEN="your_token" bun run scripts/migrate-students-simple.js',
	);
	process.exit(1);
}

const client = new ConvexClient(CONVEX_URL, {
	fetchOptions: {
		headers: {
			Authorization: `Bearer ${ADMIN_TOKEN}`,
		},
	},
});

async function runMigration() {
	try {
		console.log('⏳ Executing migration...');

		// Call the migration mutation via function runner
		// This requires the mutation to be accessible as a public function
		const result = await client.mutation('migrations.executeMigration', {});

		console.log('✅ Migration completed successfully!');
		console.log('📊 Result:', result);
	} catch (error) {
		console.error('❌ Migration failed:', error.message);
		process.exit(1);
	}
}

runMigration();
