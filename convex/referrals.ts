import { v } from 'convex/values';

import { internalMutation, mutation, query } from './_generated/server';
import { getOrganizationId, requirePermission } from './lib/auth';
import { PERMISSIONS } from './lib/permissions';

// ---------------------------------------------------------
// QUERIES
// ---------------------------------------------------------

// Get referral statistics for a specific lead (referrer)
export const getReferralStats = query({
	args: { leadId: v.id('leads') },
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		const referrer = await ctx.db.get(args.leadId);
		if (!referrer || referrer.organizationId !== organizationId) {
			// Return empty stats if referrer doesn't exist or belongs to another org
			// Or throw error? "Verify the referrer lead belongs to the current organization"
			// Returning empty sets protects info.
			return {
				totalReferrals: 0,
				convertedReferrals: 0,
				pendingReferrals: 0,
				totalCashback: 0,
			};
		}

		const referrals = await ctx.db
			.query('leads')
			.withIndex('by_referrer', (q) => q.eq('referredById', args.leadId))
			.filter((q) => q.eq(q.field('organizationId'), organizationId))
			.collect();

		// Calculate stats
		const totalReferrals = referrals.length;
		const convertedReferrals = referrals.filter((l) => l.stage === 'fechado_ganho').length;
		const pendingReferrals = referrals.filter(
			(l) => l.stage !== 'fechado_ganho' && l.stage !== 'fechado_perdido',
		).length;

		// Referrer already fetched at start
		const totalCashback = referrer?.cashbackEarned || 0;

		return {
			totalReferrals,
			convertedReferrals,
			pendingReferrals,
			totalCashback,
		};
	},
});

// List all leads referred by a specific lead
export const getMyReferrals = query({
	args: {
		leadId: v.id('leads'),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		const referrer = await ctx.db.get(args.leadId);
		if (!referrer || referrer.organizationId !== organizationId) {
			return [];
		}

		const referrals = await ctx.db
			.query('leads')
			.withIndex('by_referrer', (q) => q.eq('referredById', args.leadId))
			.filter((q) => q.eq(q.field('organizationId'), organizationId))
			.order('desc')
			.take(args.limit ?? 50);

		return referrals.map((r) => ({
			_id: r._id,
			name: r.name,
			phone: r.phone,
			stage: r.stage,
			createdAt: r.createdAt,
			cashbackEarned: r.cashbackEarned || 0,
		}));
	},
});

// Retrieve cashback configuration
export const getCashbackSettings = query({
	args: {},
	handler: async (ctx) => {
		// Admin-only read for settings? Or public if we show "Earn 10%"?
		// Plan says "Require PERMISSIONS.SETTINGS_WRITE (admin-only read)"
		// NOTE: Usually getSettings might be looser, but following plan.
		await requirePermission(ctx, PERMISSIONS.SETTINGS_WRITE);

		const settings = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', 'cashback_config'))
			.unique();

		return (
			settings?.value || {
				enabled: false,
				percentage: 0,
				minAmount: 0,
				maxAmount: 0,
			}
		);
	},
});

// ---------------------------------------------------------
// MUTATIONS
// ---------------------------------------------------------

// Configure cashback system (Admin)
export const setCashbackSettings = mutation({
	args: {
		enabled: v.boolean(),
		percentage: v.number(), // 0-100
		minAmount: v.number(),
		maxAmount: v.number(),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.SETTINGS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		// Validate
		if (args.percentage < 0 || args.percentage > 100) {
			throw new Error('Percentage must be between 0 and 100');
		}
		if (args.minAmount < 0) throw new Error('minAmount must be positive');
		if (args.maxAmount < args.minAmount) {
			throw new Error('maxAmount must be greater than or equal to minAmount');
		}

		const existing = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', 'cashback_config'))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				value: args,
				updatedAt: Date.now(),
			});
		} else {
			await ctx.db.insert('settings', {
				key: 'cashback_config',
				value: args,
				updatedAt: Date.now(),
			});
		}

		// Log activity
		await ctx.db.insert('activities', {
			type: 'integracao_configurada',
			description: 'Configurações de cashback atualizadas',
			organizationId: organizationId || 'system',
			performedBy: identity.subject,
			metadata: { old: existing?.value, new: args },
			createdAt: Date.now(),
		});
	},
});

// ---------------------------------------------------------
// INTERNAL MUTATIONS
// ---------------------------------------------------------

export const calculateCashback = internalMutation({
	args: { referredLeadId: v.id('leads') },
	handler: async (ctx, args) => {
		try {
			const referredLead = await ctx.db.get(args.referredLeadId);
			if (!referredLead) {
				// Silent fail
				return;
			}

			if (!referredLead.referredById) {
				// Not a referral
				return;
			}

			const referrer = await ctx.db.get(referredLead.referredById);
			if (!referrer) {
				// Silent fail
				return;
			}

			if (referredLead.cashbackPaidAt) {
				return;
			}

			if (referredLead.organizationId !== referrer.organizationId) {
				// Silent fail
				return;
			}

			// Get Settings
			const settingsRecord = await ctx.db
				.query('settings')
				.withIndex('by_key', (q) => q.eq('key', 'cashback_config'))
				.unique();

			const settings = settingsRecord?.value;
			if (!settings?.enabled) {
				return; // Disabled
			}

			// Match Enrollment to get Total Value
			// Heuristic: Find enrollment for this lead's student (if converted)
			// Or if lead.studentId exists (schema didn't explicitly link lead->studentId in leads table,
			// but students table has leadId).
			// Let's search students by leadId
			const student = await ctx.db
				.query('students')
				.filter((q) => q.eq(q.field('leadId'), referredLead._id))
				.first();

			// Fallback: search by phone/email if student not found by leadId directly
			// (Optimization for later: Add index by_leadId on students)

			let totalValue = 0;

			if (student) {
				const enrollments = await ctx.db
					.query('enrollments')
					.withIndex('by_student', (q) => q.eq('studentId', student._id))
					.collect();

				// Filter for valid enrollments (active or completed) and take the most recent one
				// to avoid overpaying on multiple enrollments or cancelled ones.
				const validEnrollments = enrollments
					.filter(
						(e) =>
							(e.status === 'ativo' || e.status === 'concluido') && e.paymentStatus !== 'cancelado',
					)
					// biome-ignore lint/suspicious/noExplicitAny: sort
					.sort((a, b) => b.createdAt - a.createdAt);

				if (validEnrollments.length > 0) {
					totalValue = validEnrollments[0].totalValue;
				} else {
					return;
				}
			} else {
				return;
			}

			if (totalValue <= 0) return;

			// Calculate
			let cashback = (totalValue * settings.percentage) / 100;

			// Apply Bounds
			cashback = Math.max(settings.minAmount, Math.min(cashback, settings.maxAmount));

			// Update Referrer
			await ctx.db.patch(referrer._id, {
				cashbackEarned: (referrer.cashbackEarned || 0) + cashback,
				updatedAt: Date.now(),
			});

			// Mark referred lead as paid
			await ctx.db.patch(referredLead._id, {
				cashbackPaidAt: Date.now(),
				updatedAt: Date.now(),
			});

			// Log Activities
			const organizationId = referrer.organizationId || 'system';

			// 1. On Referrer
			await ctx.db.insert('activities', {
				type: 'venda_fechada',
				description: `Cashback de R$ ${cashback.toFixed(2)} recebido pela indicação de ${referredLead.name}`,
				leadId: referrer._id,
				organizationId,
				performedBy: 'system',
				metadata: { referredLeadId: args.referredLeadId, cashbackAmount: cashback },
				createdAt: Date.now(),
			});

			// 2. On Referred Lead
			await ctx.db.insert('activities', {
				type: 'venda_fechada',
				description: `Indicado por ${referrer.name} - Cashback gerado`,
				leadId: referredLead._id,
				organizationId: referredLead.organizationId || organizationId,
				performedBy: 'system',
				metadata: { referrerId: referrer._id, cashbackAmount: cashback },
				createdAt: Date.now(),
			});
		} catch (error) {
			console.error('Error calculating cashback:', error);
			// Silent fail as per requirements
		}
	},
});
