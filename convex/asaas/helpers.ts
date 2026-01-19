/**
 * Asaas Integration - Helper Functions
 *
 * Shared utility functions for Asaas integration operations.
 */

import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

/**
 * Enrollment matching result
 */
export type EnrollmentMatchResult =
	| {
			enrollmentId: Id<'enrollments'>;
			matchType: 'exact' | 'single' | 'product_match' | 'first';
	  }
	| {
			enrollmentId: undefined;
			reason: 'no_active_enrollments' | 'multiple_without_match';
	  };

/**
 * Finds the best matching enrollment for a student based on various strategies.
 *
 * Strategy:
 * 1. If only one active enrollment exists, use it (exact match)
 * 2. If description provided, try to match by product keywords
 * 3. If multiple enrollments but no description match, return first active (fallback)
 * 4. If no active enrollments, return undefined
 *
 * @param ctx - Mutation context
 * @param studentId - Student ID to find enrollments for
 * @param description - Optional payment description for product matching
 * @returns EnrollmentMatchResult with enrollment ID or reason for no match
 */
export async function findMatchingEnrollment(
	ctx: MutationCtx,
	studentId: Id<'students'>,
	description?: string,
): Promise<EnrollmentMatchResult> {
	// Get all non-cancelled enrollments for the student
	const activeEnrollments = await ctx.db
		.query('enrollments')
		.withIndex('by_student', (q) => q.eq('studentId', studentId))
		.filter((q) => q.neq(q.field('status'), 'cancelado'))
		.collect();

	// No active enrollments found
	if (activeEnrollments.length === 0) {
		return { enrollmentId: undefined, reason: 'no_active_enrollments' };
	}

	// Single active enrollment - exact match
	if (activeEnrollments.length === 1) {
		return { enrollmentId: activeEnrollments[0]._id, matchType: 'single' };
	}

	// Multiple enrollments - try product matching if description provided
	if (description && activeEnrollments.length > 1) {
		const desc = description.toLowerCase();

		// Product keyword mapping
		const productKeywords: Record<string, string[]> = {
			trintae3: ['trinta', '30e3', '30 e 3', 'trinta e três'],
			otb: ['otb', 'outside', 'beyond'],
			black_neon: ['black', 'neon'],
			comunidade: ['comunidade', 'club', 'community'],
			auriculo: ['aurículo', 'acupuntura', 'auriculotherapy'],
			na_mesa_certa: ['mesa', 'table'],
		};

		// Try to find matching enrollment by product keywords
		for (const [product, keywords] of Object.entries(productKeywords)) {
			if (keywords.some((keyword) => desc.includes(keyword))) {
				const matched = activeEnrollments.find((e) => e.product === product);
				if (matched) {
					return { enrollmentId: matched._id, matchType: 'product_match' };
				}
			}
		}
	}

	// Multiple enrollments without product match - return first as fallback
	// This is a deliberate fallback to avoid blocking payment processing
	return { enrollmentId: activeEnrollments[0]._id, matchType: 'first' };
}

/**
 * Safely gets an enrollment ID with fallback behavior.
 * Wrapper around findMatchingEnrollment for easier use in mutations.
 *
 * @param ctx - Mutation context
 * @param studentId - Student ID
 * @param explicitEnrollmentId - Explicitly provided enrollment ID (takes precedence)
 * @param description - Optional description for product matching
 * @returns Enrollment ID or undefined
 */
export async function getEnrollmentIdOrDefault(
	ctx: MutationCtx,
	studentId: Id<'students'>,
	explicitEnrollmentId: Id<'enrollments'> | undefined,
	description?: string,
): Promise<Id<'enrollments'> | undefined> {
	// If explicitly provided, use it
	if (explicitEnrollmentId) {
		return explicitEnrollmentId;
	}

	// Otherwise, find best match
	const result = await findMatchingEnrollment(ctx, studentId, description);

	if (result.enrollmentId) {
		return result.enrollmentId;
	}

	return undefined;
}
