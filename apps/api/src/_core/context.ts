import { getAuth } from '@hono/clerk-auth';
import { users } from '@repo/shared/db/schema';
import { eq } from 'drizzle-orm';
import type { Context as HonoContext } from 'hono';

import { db } from '../db';

export async function createContext(c: HonoContext) {
	const auth = getAuth(c);

	let user: typeof users.$inferSelect | null = null;
	if (auth?.userId) {
		const [dbUser] = await db.select().from(users).where(eq(users.clerkId, auth.userId)).limit(1);
		user = dbUser ?? null;
	}

	return { auth, user, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
