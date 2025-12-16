import type { ActionCtx, MutationCtx, QueryCtx } from '../_generated/server'

/**
 * Interface for Clerk JWT identity claims
 *
 * Standard OIDC claims + custom claims from Clerk JWT Template
 */
export interface ClerkIdentity {
	// Standard OIDC claims
	subject: string // user_xxx (Clerk User ID)
	tokenIdentifier: string
	issuer: string // https://apparent-oryx-57.clerk.accounts.dev

	// Optional standard claims
	email?: string
	name?: string
	pictureUrl?: string

	// Custom claims from Clerk JWT Template (if configured)
	org_id?: string
	org_role?: string
	org_slug?: string
	org_permissions?: string[]
}

type Context = QueryCtx | MutationCtx | ActionCtx

/**
 * Get the authenticated user's identity
 * @returns ClerkIdentity if authenticated, null otherwise
 */
export async function getIdentity(ctx: Context): Promise<ClerkIdentity | null> {
	const identity = await ctx.auth.getUserIdentity()
	return identity as ClerkIdentity | null
}

/**
 * Require authentication - throws if not authenticated
 * @throws Error if user is not authenticated
 */
export async function requireAuth(ctx: Context): Promise<ClerkIdentity> {
	const identity = await getIdentity(ctx)

	if (!identity) {
		throw new Error('Não autenticado. Faça login para continuar.')
	}

	return identity
}

/**
 * Get the user's Clerk ID (subject claim)
 * @throws Error if not authenticated
 */
export async function getClerkId(ctx: Context): Promise<string> {
	const identity = await requireAuth(ctx)
	return identity.subject
}

/**
 * Check if user has one of the allowed organization roles
 * @returns true if user has one of the roles, false otherwise
 */
export async function hasOrgRole(
	ctx: Context,
	allowedRoles: string[],
): Promise<boolean> {
	const identity = await getIdentity(ctx)

	if (!identity?.org_role) {
		return false
	}

	return allowedRoles.includes(identity.org_role)
}

/**
 * Require one of the specified organization roles
 * @throws Error if user doesn't have required role
 */
export async function requireOrgRole(
	ctx: Context,
	allowedRoles: string[],
): Promise<ClerkIdentity> {
	const identity = await requireAuth(ctx)

	if (!identity.org_role || !allowedRoles.includes(identity.org_role)) {
		throw new Error(
			`Permissão negada. Role necessária: ${allowedRoles.join(' ou ')}`,
		)
	}

	return identity
}
