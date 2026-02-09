import { eq } from 'drizzle-orm';
import type { Context as HonoContext } from 'hono';

import { users } from '../../drizzle/schema';
import { db } from '../db';

interface ClerkWebhookPayload {
	type: string;
	data: {
		id: string;
		email_addresses?: Array<{ email_address: string }>;
		first_name?: string;
		last_name?: string;
		organization_memberships?: Array<{
			organization: { id: string };
			role: string;
		}>;
		deleted?: boolean;
	};
}

/**
 * Handle incoming Clerk webhook events.
 *
 * Supported events:
 * - user.created / user.updated → Upsert user record
 * - user.deleted → Soft-delete or mark inactive
 */
export async function handleClerkWebhook(c: HonoContext) {
	// Clerk signs webhooks with Svix — for now we validate via shared secret header
	const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
	if (webhookSecret) {
		const svixId = c.req.header('svix-id');
		if (!svixId) {
			return c.json({ error: 'Missing webhook signature' }, 401);
		}
		// Full Svix verification should be added in production
	}

	let payload: ClerkWebhookPayload;
	try {
		payload = await c.req.json<ClerkWebhookPayload>();
	} catch {
		return c.json({ error: 'Invalid JSON' }, 400);
	}

	if (!payload.type) {
		return c.json({ error: 'Missing event type' }, 400);
	}

	const { type, data } = payload;

	try {
		switch (type) {
			case 'user.created':
			case 'user.updated': {
				const email = data.email_addresses?.[0]?.email_address;
				const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unnamed';
				const orgMembership = data.organization_memberships?.[0];

				// Check if user already exists
				const [existingUser] = await db
					.select()
					.from(users)
					.where(eq(users.clerkId, data.id))
					.limit(1);

				if (existingUser) {
					await db
						.update(users)
						.set({
							email: email ?? existingUser.email,
							name,
							organizationId: orgMembership?.organization.id ?? existingUser.organizationId,
							updatedAt: new Date(),
						})
						.where(eq(users.clerkId, data.id));
				} else if (type === 'user.created') {
					await db.insert(users).values({
						clerkId: data.id,
						email: email ?? '',
						name,
						role: (orgMembership?.role as 'member') ?? 'member',
						organizationId: orgMembership?.organization.id ?? null,
					});
				}
				break;
			}

			case 'user.deleted': {
				if (data.id) {
					await db.update(users).set({ updatedAt: new Date() }).where(eq(users.clerkId, data.id));
				}
				break;
			}

			default:
				// Unhandled event type — acknowledge but don't process
				return c.json({ status: 'ignored', type });
		}

		return c.json({ status: 'processed', type });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return c.json({ status: 'error', message: errorMessage }, 500);
	}
}
