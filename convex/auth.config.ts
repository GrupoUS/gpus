import type { AuthConfig } from 'convex/server'

/**
 * Convex Auth Configuration for Clerk JWT Verification
 *
 * Algorithm: RS256 (RSA Signature with SHA-256)
 * JWKS Endpoint: https://apparent-oryx-57.clerk.accounts.dev/.well-known/jwks.json
 *
 * The Convex backend automatically fetches public keys from the JWKS endpoint
 * to verify JWT signatures on each authenticated request.
 */
export default {
	providers: [
		{
			// Clerk JWT Issuer Domain
			// Convex auto-fetches JWKS from: {domain}/.well-known/jwks.json
			domain: process.env.CLERK_ISSUER_URL || 'https://apparent-oryx-57.clerk.accounts.dev',
			// 'convex' matches the audience claim in Clerk's JWT Template
			applicationID: 'convex',
		},
	],
} satisfies AuthConfig
