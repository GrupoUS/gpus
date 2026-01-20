import { v } from 'convex/values';

import { internalMutation, mutation, query } from './_generated/server';
import { getOrganizationId, requirePermission } from './lib/auth';
import { PERMISSIONS } from './lib/permissions';

// ═══════════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════════

export const getReferralStats = query({
	args: { leadId: v.id('leads') },
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		// Find all leads referred by this leadId
		const referrals = await ctx.db
			.query('leads')
			.withIndex('by_referred_by', (q) => q.eq('referredById', args.leadId))
			.filter((q) => q.eq(q.field('organizationId'), organizationId))
			.collect();

		const totalReferrals = referrals.length;
		const convertedReferrals = referrals.filter((r) => r.stage === 'fechado_ganho').length;
		const pendingReferrals = referrals.filter(
			(r) => r.stage !== 'fechado_ganho' && r.stage !== 'fechado_perdido',
		).length;

		// Get the referrer's current cashback balance
		const referrer = await ctx.db.get(args.leadId);
		const totalCashback = referrer?.cashbackEarned ?? 0;

		return {
			totalReferrals,
			convertedReferrals,
			pendingReferrals,
			totalCashback,
		};
	},
});

export const getMyReferrals = query({
	args: {
		leadId: v.id('leads'),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		const limit = args.limit ?? 50;

		const referrals = await ctx.db
			.query('leads')
			.withIndex('by_referred_by', (q) => q.eq('referredById', args.leadId))
			.filter((q) => q.eq(q.field('organizationId'), organizationId))
			.order('desc')
			.take(limit);

		return referrals.map((r) => ({
			// biome-ignore lint/style/useNamingConvention: Convex system field
			_id: r._id,
			name: r.name,
			phone: r.phone,
			stage: r.stage,
			createdAt: r.createdAt,
			cashbackEarned: r.cashbackEarned,
		}));
	},
});

// ═══════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════

export const getCashbackSettings = query({
	args: {},
	handler: async (ctx) => {
		await requirePermission(ctx, PERMISSIONS.SETTINGS_WRITE); // Admin only read
		const settings = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', 'cashback_config'))
			.unique();

		return (
			settings?.value ?? {
				enabled: false,
				percentage: 0,
				minAmount: 0,
				maxAmount: 0,
			}
		);
	},
});

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

		if (
			args.percentage < 0 ||
			args.percentage > 100 ||
			args.minAmount < 0 ||
			args.maxAmount < args.minAmount
		) {
			throw new Error('Invalid cashback configuration');
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

		await ctx.db.insert('activities', {
			type: 'integracao_configurada',
			description: 'Configurações de cashback atualizadas',
			organizationId: organizationId ?? 'system',
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: {
				oldSettings: existing?.value,
				newSettings: args,
			},
		});
	},
});

// ═══════════════════════════════════════════════════════
// CALCULATION (INTERNAL)
// ═══════════════════════════════════════════════════════

export const calculateCashback = internalMutation({
	args: {
		referredLeadId: v.id('leads'),
	},
	handler: async (ctx, args) => {
		try {
			// 1. Get Referred Lead
			const referredLead = await ctx.db.get(args.referredLeadId);
			if (!referredLead) {
				// biome-ignore lint/suspicious/noConsole: Log useful for debugging background job
				console.error(`Referred lead not found: ${args.referredLeadId}`);
				return;
			}

			if (!referredLead.referredById) {
				// Not a referral
				return;
			}

			// 2. Get Referrer Lead
			const referrer = await ctx.db.get(referredLead.referredById);
			if (!referrer) {
				// biome-ignore lint/suspicious/noConsole: Log useful for debugging background job
				console.error(`Referrer not found: ${referredLead.referredById}`);
				return;
			}

			// 3. Get Settings
			const settingsRecord = await ctx.db
				.query('settings')
				.withIndex('by_key', (q) => q.eq('key', 'cashback_config'))
				.unique();

			const settings = settingsRecord?.value;

			if (!settings?.enabled) {
				return; // Cashback disabled
			}

			// 4. Get Enrollment Value
			// Assuming there's a link or we search by studentId -> enrollment
			// referredLead -> student (by leadId) -> enrollment
			const student = await ctx.db
				.query('students')
				// .withIndex('leadId', ...) - Schema doesn't have by_leadId index on students?
				// Let's check schema: student has leadId: v.optional(v.id('leads')).
				// Index: .index('by_email', ['email']), .index('by_phone', ['phone']).
				// No index by leadId directly on students.
				// But we can search by phone if needed, or scan (expensive).
				// WAIT: conversions usually create a student linked to lead.
				// Schema check: students table definition around line 201.
				// Index scan might be needed if no index.
				// Alternative: filter by phone which is indexed.
				.withIndex('by_phone', (q) => q.eq('phone', referredLead.phone))
				.first();

			if (!student) {
				// biome-ignore lint/suspicious/noConsole: Log useful for debugging background job
				console.log(`Student not found for lead ${args.referredLeadId}, skipping cashback`);
				return;
			}

			// Get latest enrollment
			const enrollment = await ctx.db
				.query('enrollments')
				.withIndex('by_student', (q) => q.eq('studentId', student._id))
				.order('desc')
				.first();

			if (!enrollment) {
				// biome-ignore lint/suspicious/noConsole: Log useful for debugging background job
				console.log(`No enrollment found for student ${student._id}, skipping cashback`);
				return;
			}

			// 5. Calculate Amount
			const totalValue = enrollment.totalValue;
			const rawCashback = (totalValue * settings.percentage) / 100;
			const cashback = Math.max(settings.minAmount, Math.min(rawCashback, settings.maxAmount));

			if (cashback <= 0) return;

			// 6. Apply to Referrer
			await ctx.db.patch(referrer._id, {
				cashbackEarned: (referrer.cashbackEarned ?? 0) + cashback,
				updatedAt: Date.now(),
			});

			// 7. Log Activities
			// Log for referrer
			await ctx.db.insert('activities', {
				type: 'venda_fechada', // Reuse type
				description: `Cashback de R$ ${cashback.toFixed(2)} recebido pela indicação de ${referredLead.name}`,
				leadId: referrer._id,
				organizationId: referrer.organizationId ?? 'system',
				performedBy: 'system',
				createdAt: Date.now(),
				metadata: {
					referredLeadId: args.referredLeadId,
					cashbackEarned: cashback,
					source: 'referral_bonus',
				},
			});

			// Log for referred
			await ctx.db.insert('activities', {
				type: 'venda_fechada',
				description: `Indicado por ${referrer.name} - Cashback gerado`,
				leadId: referredLead._id,
				organizationId: referredLead.organizationId ?? 'system',
				performedBy: 'system',
				createdAt: Date.now(),
				metadata: {
					referrerId: referrer._id,
					cashbackEarned: cashback,
				},
			});
		} catch (error) {
			// biome-ignore lint/suspicious/noConsole: Log useful for debugging background job
			console.error('Error calculating cashback:', error);
			// Don't throw to avoid failing the transaction that triggered this
		}
	},
});
