import type { ActionCtx, MutationCtx, QueryCtx } from '../_generated/server';

/**
 * Interface for Clerk JWT identity claims
 *
 * Standard OIDC claims + custom claims from Clerk JWT Template
 */
export interface ClerkIdentity {
	// Standard OIDC claims
	subject: string; // user_xxx (Clerk User ID)
	tokenIdentifier: string;
	issuer: string; // https://apparent-oryx-57.clerk.accounts.dev

	// Optional standard claims
	email?: string;
	name?: string;
	pictureUrl?: string;

	// Custom claims from Clerk JWT Template (if configured)
	org_id?: string;
	org_role?: string;
	org_slug?: string;
	org_permissions?: string[];
}

type Context = QueryCtx | MutationCtx | ActionCtx;

/**
 * Get the authenticated user's identity
 * @returns ClerkIdentity if authenticated, null otherwise
 */
export async function getIdentity(ctx: Context): Promise<ClerkIdentity | null> {
	const identity = await ctx.auth.getUserIdentity();
	return identity as ClerkIdentity | null;
}

/**
 * Require authentication - throws if not authenticated
 * @throws Error if user is not authenticated
 */
export async function requireAuth(ctx: Context): Promise<ClerkIdentity> {
	const identity = await getIdentity(ctx);

	if (!identity) {
		throw new Error('Não autenticado. Faça login para continuar.');
	}

	return identity;
}

/**
 * Get the organization ID for multi-tenant data access
 *
 * Priority:
 * 1. org_id from JWT (if user is in an organization context)
 * 2. subject (clerkId) as fallback (personal organization)
 */
export async function getOrganizationId(ctx: Context): Promise<string> {
	const identity = await requireAuth(ctx);

	// If org_id is present in JWT, user is in an organization context
	if (identity.org_id) {
		return identity.org_id;
	}

	// Fallback: use the user's own ID as their "personal organization"
	return identity.subject;
}

/**
 * Get the user's Clerk ID (subject claim)
 * @throws Error if not authenticated
 */
export async function getClerkId(ctx: Context): Promise<string> {
	const identity = await requireAuth(ctx);
	return identity.subject;
}

/**
 * Check if user has one of the allowed organization roles
 * @returns true if user has one of the roles, false otherwise
 */
export async function hasOrgRole(ctx: Context, allowedRoles: string[]): Promise<boolean> {
	const identity = await getIdentity(ctx);

	if (!identity?.org_role) {
		return false;
	}

	return allowedRoles.includes(identity.org_role);
}

/**
 * Require one of the specified organization roles
 * @throws Error if user doesn't have required role
 */
export async function requireOrgRole(ctx: Context, allowedRoles: string[]): Promise<ClerkIdentity> {
	const identity = await requireAuth(ctx);

	if (!(identity.org_role && allowedRoles.includes(identity.org_role))) {
		throw new Error(`Permissão negada. Role necessária: ${allowedRoles.join(' ou ')}`);
	}

	return identity;
}

/**
 * Require authenticated user and return their user ID
 * Use this when you need to know who is making the request for audit purposes
 */
export async function requireAuthAsUser(ctx: Context): Promise<ClerkIdentity> {
	const identity = await requireAuth(ctx);

	// Verify it's actually a user (not a system account)
	// In Clerk, we can check metadata or just assume if they have a subject they are a user.
	// But we also check if they exist in our DB.
	if (!('db' in ctx)) {
		// Action context doesn't have db access directly, so we can't verify against DB here easily
		// unless we run a query. But actions shouldn't verify DB existence usually, mutations do.
		// If this is used in mutation/query:
		return identity;
	}

	// Verify that the user exists in our database
	const user = await ctx.db
		.query('users')
		.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
		.first();

	if (!user) {
		throw new Error('User not found in database');
	}

	return identity;
}

import { PERMISSIONS, ROLE_PERMISSIONS } from './permissions';

/**
 * Convert permission format from code (leads:read) to Clerk format (org:leads_read:leads_read)
 */
function toClerkPermissionFormat(permission: string): string {
	if (permission === PERMISSIONS.ALL) {
		return PERMISSIONS.ALL;
	}
	// Convert leads:read -> org:leads_read:leads_read
	const parts = permission.split(':');
	if (parts.length === 2) {
		const [resource, action] = parts;
		return `org:${resource}_${action}:${resource}_${action}`;
	}
	return permission;
}

/**
 * Check if user has a specific permission
 * @param ctx Context (Query, Mutation, or Action)
 * @param permission Permission to check (e.g., 'leads:read')
 * @returns true if user has the permission, false otherwise
 */
export async function hasPermission(ctx: Context, permission: string): Promise<boolean> {
	const identity = await getIdentity(ctx);

	if (!identity) {
		return false;
	}

	// Admin and Owner have all permissions
	const role = identity.org_role;
	if (role === 'org:admin' || role === 'org:owner' || role === 'admin' || role === 'owner') {
		return true;
	}

	// Check if permission is in JWT claims
	// Clerk returns permissions in format org:resource_action:resource_action
	if (identity.org_permissions && Array.isArray(identity.org_permissions)) {
		const clerkPermission = toClerkPermissionFormat(permission);
		if (identity.org_permissions.includes(clerkPermission)) {
			return true;
		}
		// Also check for 'all' permission in the array just in case
		if (identity.org_permissions.includes(PERMISSIONS.ALL)) {
			return true;
		}
	}

	// Fallback: Check DB role if JWT claims are missing or insufficient
	const permissions = await getUserPermissions(ctx, identity);
	return permissions.includes(permission) || permissions.includes(PERMISSIONS.ALL);
}

/**
 * Require a specific permission - throws if not authorized
 * @param ctx Context (Query, Mutation, or Action)
 * @param permission Permission required (e.g., 'leads:write')
 * @throws Error if user doesn't have the permission
 */
export async function requirePermission(ctx: Context, permission: string): Promise<ClerkIdentity> {
	const identity = await requireAuth(ctx);
	const isAllowed = await hasPermission(ctx, permission);

	if (!isAllowed) {
		// Differentiate between "User not found" (sync issue) and "Permission denied" (role issue)
		// We can check if the user actually exists in DB by calling getUserPermissions internally or checking identity.org_permissions
		const permissions = await getUserPermissions(ctx, identity);

		if (permissions.length === 0 && !identity.org_permissions) {
			throw new Error('Usuário não sincronizado. Tente fazer logout e login novamente.');
		}
		throw new Error(
			`Permissão negada. Você precisa da permissão "${permission}" para realizar esta ação. Contate o administrador.`,
		);
	}

	return identity;
}

/**
 * Check if user has any of the specified permissions
 * @param ctx Context (Query, Mutation, or Action)
 * @param permissions Array of permissions to check
 * @returns true if user has at least one permission, false otherwise
 */
export async function hasAnyPermission(ctx: Context, permissions: string[]): Promise<boolean> {
	if (permissions.length === 0) return true;

	for (const permission of permissions) {
		if (await hasPermission(ctx, permission)) {
			return true;
		}
	}

	return false;
}

/**
 * Helper to get permissions from DB role fallback
 */
async function getUserPermissions(ctx: Context, identity: ClerkIdentity): Promise<string[]> {
	// Action context doesn't have direct DB access
	if (!('db' in ctx)) {
		return [];
	}

	const user = await ctx.db
		.query('users')
		.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
		.first();

	if (!user || typeof user.role !== 'string') {
		return [];
	}

	return ROLE_PERMISSIONS[user.role] || [];
}
