/**
 * Master Admin Configuration
 *
 * Emails listed in MASTER_ADMIN_EMAILS have unrestricted access to all system
 * settings and administrative functions, regardless of their assigned role in Clerk.
 *
 * These users bypass all permission checks and have full access to the system.
 */

/**
 * List of Master Admin emails
 * These users have unrestricted access to all system settings and administrative functions
 */
export const MASTER_ADMIN_EMAILS = ['msm.jur@gmail.com'] as const;

/**
 * Check if an email belongs to a Master Admin
 * @param email - Email address to check
 * @returns true if email is a Master Admin, false otherwise
 */
export function isMasterAdmin(email?: string): boolean {
	if (!email) return false;
	return MASTER_ADMIN_EMAILS.includes(email as (typeof MASTER_ADMIN_EMAILS)[number]);
}
