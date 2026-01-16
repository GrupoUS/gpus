// Define permissions constants
// Format: resource:action (consistent with Clerk format)
export const PERMISSIONS = {
	// Global
	ALL: 'all', // Super admin permission (granted to Master Admins, Owners, and Admins)

	// Leads
	LEADS_READ: 'leads:read',
	LEADS_WRITE: 'leads:write',

	// Marketing Leads (public capture)
	MARKETING_LEADS_READ: 'marketing_leads:read',
	MARKETING_LEADS_WRITE: 'marketing_leads:write',

	// Conversations (Chat/WhatsApp)
	CONVERSATIONS_READ: 'conversations:read',
	CONVERSATIONS_WRITE: 'conversations:write',

	// Students
	STUDENTS_READ: 'students:read',
	STUDENTS_WRITE: 'students:write',

	// Tickets/Support
	TICKETS_READ: 'tickets:read',
	TICKETS_WRITE: 'tickets:write',

	// Reports/Dashboard
	REPORTS_READ: 'reports:read',

	// Settings
	SETTINGS_WRITE: 'settings:write',

	// Dashboard
	DASHBOARD_READ: 'dashboard:read',

	// Team Management
	TEAM_MANAGE: 'team:manage',
	TEAM_READ: 'team:read',
} as const;

// Role to Permissions Mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
	owner: [PERMISSIONS.ALL],
	admin: [PERMISSIONS.ALL, 'manage:settings', PERMISSIONS.TEAM_MANAGE], // Corrected manage:team to team:manage via constant
	manager: [
		PERMISSIONS.STUDENTS_READ,
		PERMISSIONS.CONVERSATIONS_READ,
		PERMISSIONS.REPORTS_READ,
		PERMISSIONS.TEAM_READ,
		'manage:content',
	],
	member: [PERMISSIONS.CONVERSATIONS_READ, PERMISSIONS.STUDENTS_READ, 'view:content'],

	// Legacy / Specific Roles
	sdr: [
		PERMISSIONS.LEADS_READ,
		PERMISSIONS.LEADS_WRITE,
		PERMISSIONS.MARKETING_LEADS_READ,
		PERMISSIONS.MARKETING_LEADS_WRITE,
		PERMISSIONS.STUDENTS_READ,
		PERMISSIONS.CONVERSATIONS_READ,
		PERMISSIONS.CONVERSATIONS_WRITE,
	],
	cs: [
		PERMISSIONS.STUDENTS_READ,
		PERMISSIONS.STUDENTS_WRITE,
		PERMISSIONS.CONVERSATIONS_READ,
		PERMISSIONS.CONVERSATIONS_WRITE,
		PERMISSIONS.REPORTS_READ,
	],
	support: [
		PERMISSIONS.CONVERSATIONS_READ,
		PERMISSIONS.CONVERSATIONS_WRITE,
		PERMISSIONS.TICKETS_READ,
		PERMISSIONS.TICKETS_WRITE,
		PERMISSIONS.STUDENTS_READ,
	],
};
