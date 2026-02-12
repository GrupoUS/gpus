import { neon } from '@neondatabase/serverless';
// biome-ignore lint/performance/noNamespaceImport: drizzle relational queries require namespace import
import * as schema from '@repo/shared/db/schema';
import { drizzle } from 'drizzle-orm/neon-http';

function createDb() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		// biome-ignore lint/suspicious/noConsole: startup diagnostic
		console.warn('⚠️  DATABASE_URL not set — database calls will fail');
		// Return a proxy that throws on any property access (lazy error)
		return new Proxy({} as ReturnType<typeof drizzle>, {
			get(_, prop) {
				if (prop === 'then' || prop === Symbol.toPrimitive) return undefined;
				throw new Error('DATABASE_URL is required. Add it to .env.local to use the database.');
			},
		});
	}
	const sql = neon(connectionString);
	return drizzle(sql, { schema });
}

export const db = createDb();

export type Database = ReturnType<typeof drizzle>;
