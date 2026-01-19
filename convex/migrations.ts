import { v } from 'convex/values';

import { internalMutation } from './_generated/server';
import { decrypt, encrypt, encryptCPF, hashSensitiveData } from './lib/encryption';

/**
 * Migrate students to use the new organizationId field
 */
export const migrateStudentOrganizationId = internalMutation({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		const students = await ctx.db.query('students').collect();

		let updatedCount = 0;
		const studentsToUpdate = students.filter((s) => !s.organizationId).slice(0, limit);

		for (const student of studentsToUpdate) {
			await ctx.db.patch(student._id, {
				organizationId: 'grupo-us', // Default organization
				updatedAt: Date.now(),
			});
			updatedCount++;
		}

		return {
			processed: studentsToUpdate.length,
			updated: updatedCount,
			remaining: students.filter((s) => !s.organizationId).length - updatedCount,
		};
	},
});

/**
 * Backfills cpfHash for all students who have encryptedCPF but no cpfHash
 */
export const backfillCpfHash = internalMutation({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		const students = await ctx.db.query('students').collect();

		let updatedCount = 0;
		const studentsWithCpf = students.filter((s) => s.encryptedCPF && !s.cpfHash);
		const studentsToUpdate = studentsWithCpf.slice(0, limit);

		for (const student of studentsToUpdate) {
			try {
				// We need to decrypt to get the clean digits for the hash
				const encryptedCPF = student.encryptedCPF;
				if (encryptedCPF) {
					const decryptedCpf = await decrypt(encryptedCPF);
					const cleanCpf = decryptedCpf.replace(/[^\d]/g, '');

					// Using SHA-256 for the blind index
					const hash = await hashSensitiveData(cleanCpf);

					await ctx.db.patch(student._id, {
						cpfHash: hash,
						updatedAt: Date.now(),
					});
					updatedCount++;
				}
			} catch (_error) {}
		}

		return {
			processed: studentsToUpdate.length,
			updated: updatedCount,
			remaining: studentsWithCpf.length - updatedCount,
		};
	},
});

/**
 * Encrypts legacy plaintext CPFs and generates hashes for blind indexing
 */
export const encryptLegacyCpfs = internalMutation({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		// Find students with plaintext CPF but missing encryption or hash
		const students = await ctx.db.query('students').collect();

		const studentsToMigrate = students
			.filter((s) => s.cpf && !(s.encryptedCPF && s.cpfHash))
			.slice(0, limit);

		let updatedCount = 0;

		for (const student of studentsToMigrate) {
			if (!student.cpf) continue;

			// Clean CPF digits
			const cleanCpf = student.cpf.replace(/[^\d]/g, '');
			if (!cleanCpf) continue;

			const encrypted = await encrypt(cleanCpf);
			const hash = await hashSensitiveData(cleanCpf);

			await ctx.db.patch(student._id, {
				encryptedCPF: encrypted,
				cpfHash: hash,
				// Optionally clear plaintext CPF here or in a separate pass
				// For safety, we keeping it until we confirm migration is successful
				// But the task says "remove", so let's null it out if we are confident.
				// Let's keep it for now as "deprecated" field until full verification.
				// cpf: undefined
				updatedAt: Date.now(),
			});
			updatedCount++;
		}

		const remaining =
			students.filter((s) => s.cpf && !(s.encryptedCPF && s.cpfHash)).length - updatedCount;

		return {
			processed: studentsToMigrate.length,
			updated: updatedCount,
			remaining,
		};
	},
});

export const syncClerkUsers = internalMutation({
	args: {
		users: v.array(
			v.object({
				clerkId: v.string(),
				email: v.string(),
				name: v.optional(v.string()),
				role: v.union(v.literal('admin'), v.literal('sdr'), v.literal('cs'), v.literal('support')),
			}),
		),
	},
	handler: async (ctx, args) => {
		for (const user of args.users) {
			const existing = await ctx.db
				.query('users')
				.withIndex('by_clerk_id', (q) => q.eq('clerkId', user.clerkId))
				.unique();

			if (existing) {
				await ctx.db.patch(existing._id, {
					role: user.role,
					email: user.email,
					name: user.name ?? '',
					updatedAt: Date.now(),
				});
			} else {
				await ctx.db.insert('users', {
					clerkId: user.clerkId,
					email: user.email,
					name: user.name ?? '',
					role: user.role,
					isActive: true,
					organizationId: 'grupo-us',
					createdAt: Date.now(),
					updatedAt: Date.now(),
				});
			}
		}
	},
});

/**
 * Re-encrypts all student data with the current ENCRYPTION_KEY.
 *
 * Use this when ENCRYPTION_KEY has been rotated to re-encrypt existing data.
 *
 * Features:
 * - Attempts to decrypt each field with the current key first
 * - If decryption fails, uses the plaintext field as fallback
 * - Re-encrypts all fields with the current key
 * - Supports dry-run mode for testing
 * - Includes LGPD audit logging
 *
 * @example
 * // Dry run to see what would be updated
 * const result = await reEncryptAllData(ctx, { limit: 10, dryRun: true })
 *
 * // Actual migration
 * const result = await reEncryptAllData(ctx, { limit: 50 })
 */
export const reEncryptAllData = internalMutation({
	args: {
		limit: v.optional(v.number()),
		dryRun: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		const dryRun = args.dryRun ?? false;

		const students = await ctx.db.query('students').collect();

		let processed = 0;
		let updated = 0;
		const failures: Array<{
			id: string;
			name: string;
			field: string;
			error: string;
		}> = [];

		for (const student of students) {
			if (processed >= limit) break;
			processed++;

			const updates: Record<string, string> = {};

			// Process CPF: try decrypt, if fails use plaintext and re-encrypt
			if (student.encryptedCPF || student.cpf) {
				try {
					// Try decrypting existing encrypted field
					if (student.encryptedCPF) {
						await decrypt(student.encryptedCPF);
						// Decryption successful - already encrypted with current key
					} else if (student.cpf) {
						// No encrypted field, use plaintext
						updates.encryptedCPF = await encryptCPF(student.cpf);
					}
				} catch (_e) {
					// Decryption failed - key was rotated, use plaintext as fallback
					if (student.cpf) {
						updates.encryptedCPF = await encryptCPF(student.cpf);
					} else {
						failures.push({
							id: student._id,
							name: student.name,
							field: 'cpf',
							error: 'Decryption failed and no plaintext fallback available',
						});
					}
				}
			}

			// Process email: try decrypt, if fails use plaintext and re-encrypt
			if (student.encryptedEmail || student.email) {
				try {
					if (student.encryptedEmail) {
						await decrypt(student.encryptedEmail);
						// Decryption successful
					} else if (student.email) {
						updates.encryptedEmail = await encrypt(student.email);
					}
				} catch (_e) {
					// Decryption failed - key was rotated
					if (student.email) {
						updates.encryptedEmail = await encrypt(student.email);
					} else {
						failures.push({
							id: student._id,
							name: student.name,
							field: 'email',
							error: 'Decryption failed and no plaintext fallback available',
						});
					}
				}
			}

			// Process phone: try decrypt, if fails use plaintext and re-encrypt
			if (student.encryptedPhone || student.phone) {
				try {
					if (student.encryptedPhone) {
						await decrypt(student.encryptedPhone);
						// Decryption successful
					} else if (student.phone) {
						updates.encryptedPhone = await encrypt(student.phone);
					}
				} catch (_e) {
					// Decryption failed - key was rotated
					if (student.phone) {
						updates.encryptedPhone = await encrypt(student.phone);
					} else {
						failures.push({
							id: student._id,
							name: student.name,
							field: 'phone',
							error: 'Decryption failed and no plaintext fallback available',
						});
					}
				}
			}

			// Apply updates if not dry run
			if (Object.keys(updates).length > 0) {
				if (!dryRun) {
					await ctx.db.patch(student._id, {
						...updates,
						updatedAt: Date.now(),
					});

					// Import logAudit dynamically to avoid circular dependency
					const { logAudit } = await import('./lgpd');
					await logAudit(ctx, {
						studentId: student._id,
						actionType: 'data_modification',
						dataCategory: 'encryption_rotation',
						description: `Re-encrypted data with new key: ${Object.keys(updates).join(', ')}`,
						legalBasis: 'seguranca_e_integridade',
					});
				}
				updated++;
			}
		}

		return {
			processed,
			updated,
			dryRun,
			remaining: students.length - processed,
			failures: failures.length > 0 ? failures : undefined,
		};
	},
});

/**
 * Removes plaintext PII fields after confirming encrypted versions exist.
 *
 * **CRITICAL**: Only run this AFTER reEncryptAllData succeeds completely.
 * This operation CANNOT be undone - plaintext fields will be permanently deleted.
 *
 * Use this migration to remove plaintext security-sensitive fields (cpf, email, phone)
 * that are now stored in encrypted form only. This eliminates the security vulnerability
 * of having PII stored in both plaintext AND encrypted form.
 *
 * Features:
 * - Only removes plaintext fields when encrypted versions exist (safety check)
 * - Supports dry-run mode to preview changes before applying
 * - Creates LGPD audit log entries for compliance
 * - Batch processing with limit parameter for large datasets
 *
 * @example
 * // IMPORTANT: Always run with dryRun: true first!
 * const result = await ctx.runMutation(internal.migrations.removePlaintextPii, { limit: 10, dryRun: true })
 *
 * // After verifying dry-run results, run actual migration
 * const result = await ctx.runMutation(internal.migrations.removePlaintextPii, { limit: 50 })
 */
export const removePlaintextPii = internalMutation({
	args: {
		limit: v.optional(v.number()),
		dryRun: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		const dryRun = args.dryRun ?? false;

		const students = await ctx.db.query('students').collect();

		let processed = 0;
		let updated = 0;
		const skipped: Array<{
			id: string;
			name: string;
			reason: string;
		}> = [];

		for (const student of students) {
			if (processed >= limit) break;
			processed++;

			const removals: Record<string, undefined> = {};

			// Only remove plaintext if encrypted version exists
			if (student.encryptedCPF && student.cpf) {
				removals.cpf = undefined;
			}
			if (student.encryptedEmail && student.email) {
				removals.email = undefined;
			}
			if (student.encryptedPhone && student.phone) {
				removals.phone = undefined;
			}

			if (Object.keys(removals).length > 0) {
				if (!dryRun) {
					await ctx.db.patch(student._id, {
						...removals,
						updatedAt: Date.now(),
					});

					// Import logAudit dynamically to avoid circular dependency
					const { logAudit } = await import('./lgpd');
					await logAudit(ctx, {
						studentId: student._id,
						actionType: 'data_modification',
						dataCategory: 'pii_sanitization',
						description: `Removed plaintext PII fields: ${Object.keys(removals).join(', ')}`,
						legalBasis: 'seguranca_e_integridade',
						metadata: {
							fieldsRemoved: Object.keys(removals),
							migration: 'removePlaintextPii',
						},
					});
				}
				updated++;
			} else {
				// Track why we didn't update this student
				const hasPlaintext = !!(student.cpf || student.email || student.phone);
				const hasEncrypted = !!(
					student.encryptedCPF ||
					student.encryptedEmail ||
					student.encryptedPhone
				);

				if (hasPlaintext && !hasEncrypted) {
					skipped.push({
						id: student._id,
						name: student.name,
						reason: 'Has plaintext but no encrypted version - data would be lost',
					});
				}
				// If no plaintext exists, we don't need to skip (already clean)
			}
		}

		return {
			processed,
			updated,
			dryRun,
			remaining: students.length - processed,
			skipped: skipped.length > 0 ? skipped : undefined,
		};
	},
});

/**
 * Migration: Fix Missing Consent Fields in Leads Table
 *
 * This migration adds default values for lgpdConsent and whatsappConsent
 * to existing leads documents that are missing these fields.
 *
 * This resolves schema validation error during Convex deployment.
 */
export const fixLeadsConsentFields = internalMutation({
	args: {},
	handler: async (ctx) => {
		// Query all leads that are missing lgpdConsent or whatsappConsent
		const allLeads = await ctx.db.query('leads').collect();

		let updatedCount = 0;
		const errors: string[] = [];

		for (const lead of allLeads) {
			const updates: Record<string, boolean | number> = {};
			let needsUpdate = false;

			// Add default value for lgpdConsent if missing
			if (lead.lgpdConsent === undefined) {
				updates.lgpdConsent = false;
				needsUpdate = true;
			}

			// Add default value for whatsappConsent if missing
			if (lead.whatsappConsent === undefined) {
				updates.whatsappConsent = false;
				needsUpdate = true;
			}

			// Update lead if any fields are missing
			if (needsUpdate) {
				try {
					await ctx.db.patch(lead._id, {
						...updates,
						updatedAt: Date.now(),
					});
					updatedCount++;
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : String(error);
					errors.push(`Failed to update lead ${lead._id}: ${errorMsg}`);
				}
			}
		}

		// Return migration results
		return {
			totalLeads: allLeads.length,
			updatedLeads: updatedCount,
			errors,
			timestamp: Date.now(),
		};
	},
});
