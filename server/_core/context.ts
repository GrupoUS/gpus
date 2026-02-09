import { getAuth } from '@hono/clerk-auth';
import type { Context as HonoContext } from 'hono';

import { db } from '../db';

export function createContext(c: HonoContext) {
	const auth = getAuth(c);

	let user: { clerkId: string; role: string } | null = null;
	if (auth?.userId) {
		// TODO AT-101: Uncomment once drizzle/schema.ts exists with users table
		// import { eq } from 'drizzle-orm';
		// import { users } from '../../drizzle/schema';
		// const [dbUser] = await db.select().from(users).where(eq(users.clerkId, auth.userId)).limit(1);
		// user = dbUser ?? null;

		// Temporary: pass userId from Clerk auth directly
		user = { clerkId: auth.userId, role: 'member' as const };
	}

	return { auth, user, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
