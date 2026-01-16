import { mutation, query } from './_generated/server';

/**
 * DEBUG: Investigate encrypted data in students table
 * Returns info about encrypted fields without attempting decryption
 */
export const debugEncryptedData = query({
	args: {},
	handler: async (ctx) => {
		const students = await ctx.db.query('students').take(5);

		return students.map((s) => ({
			id: s._id,
			name: s.name,
			hasEncryptedCPF: !!s.encryptedCPF,
			encryptedCPFLength: s.encryptedCPF?.length || 0,
			encryptedCPFSample: s.encryptedCPF?.substring(0, 50) || null,
			hasEncryptedEmail: !!s.encryptedEmail,
			encryptedEmailLength: s.encryptedEmail?.length || 0,
			hasEncryptedPhone: !!s.encryptedPhone,
			encryptedPhoneLength: s.encryptedPhone?.length || 0,
			// Check for plain text fields
			hasCpf: !!s.cpf,
			hasEmail: !!s.email,
			hasPhone: !!s.phone,
		}));
	},
});

/**
 * Verify authentication configuration
 *
 * Returns detailed information about the current authentication state.
 */
export const checkAuth = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();

		const debug = {
			timestamp: new Date().toISOString(),
			authenticated: !!identity,
			identity: identity
				? {
						// Standard OIDC claims
						subject: identity.subject,
						tokenIdentifier: identity.tokenIdentifier,
						issuer: identity.issuer,
						email: identity.email,
						name: identity.name,

						// Custom claims from Clerk JWT Template
						org_id: (identity as any).org_id || null,
						org_role: (identity as any).org_role || null,
						org_slug: (identity as any).org_slug || null,
					}
				: null,

			// Configuration reference
			verification: {
				jwks_url: 'https://apparent-oryx-57.clerk.accounts.dev/.well-known/jwks.json',
				expected_issuer: 'https://apparent-oryx-57.clerk.accounts.dev',
				algorithm: 'RS256',
				jwt_template: 'convex',
			},
		};

		return debug;
	},
});

/**
 * DEBUG: Test database write permissions
 *
 * Creates and immediately deletes a test lead to verify
 * both authentication and database operations work correctly.
 */
export const testCreate = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			return {
				success: false,
				error: 'Não autenticado',
				suggestion: "Verifique se o JWT template 'convex' está configurado no Clerk Dashboard",
			};
		}

		try {
			// Create a test lead
			const testId = await ctx.db.insert('leads', {
				name: '[TESTE] Lead de Debug - Deletar',
				phone: '00000000000',
				source: 'outro',
				stage: 'novo',
				temperature: 'frio',
				organizationId: (identity as any).org_id || identity.subject,
				lgpdConsent: false,
				whatsappConsent: false,
				message: 'Debug lead',
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});

			// Delete immediately
			await ctx.db.delete(testId);

			return {
				success: true,
				message: 'Criação e deleção funcionando corretamente',
				userId: identity.subject,
				email: identity.email,
			};
		} catch (error) {
			return {
				success: false,
				error: String(error),
				suggestion: 'Verifique o schema e os índices no Convex',
			};
		}
	},
});
