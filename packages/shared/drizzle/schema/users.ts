import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/pg-core';

import { inviteStatusEnum, userRoleEnum } from '../enums';

// ── Users ──
export const users = pgTable(
	'users',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		clerkId: varchar({ length: 255 }).notNull(),
		email: varchar({ length: 255 }).notNull(),
		name: varchar({ length: 255 }).notNull(),
		role: userRoleEnum().notNull().default('member'),
		organizationId: varchar({ length: 255 }),
		organizationRole: varchar({ length: 100 }),
		avatarUrl: text(),
		phone: varchar({ length: 50 }),
		department: varchar({ length: 100 }),
		isActive: boolean().notNull().default(true),
		// Convex metrics
		leadsAtribuidos: integer().default(0),
		conversoes: integer().default(0),
		tempoMedioResposta: integer(),
		// Convex preferences (nested object)
		preferences: jsonb().$type<{
			notifications?: boolean;
			theme?: string;
			sidebarCollapsed?: boolean;
		}>(),
		// Drizzle extras
		lastLoginAt: timestamp({ withTimezone: true }),
		inviteStatus: inviteStatusEnum().default('pending'),
		invitedBy: varchar({ length: 255 }),
		invitedAt: timestamp({ withTimezone: true }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		uniqueIndex('users_clerk_id_idx').on(t.clerkId),
		index('users_email_idx').on(t.email),
		index('users_organization_idx').on(t.organizationId),
		index('users_organization_role_idx').on(t.organizationId, t.role),
		index('users_active_idx').on(t.isActive),
	],
);
