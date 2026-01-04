// Define permissions constants
// Format: resource:action (consistent with Clerk format)
export const PERMISSIONS = {
  // Global
  ALL: 'all', // Super admin permission

  // Leads
  LEADS_READ: 'leads:read',
  LEADS_WRITE: 'leads:write',

  // Conversations (Chat/WhatsApp)
  CONVERSATIONS_READ: 'conversations:read',
  CONVERSATIONS_WRITE: 'conversations:write',

  // Students
  STUDENTS_READ: 'students:read',
  STUDENTS_WRITE: 'students:write',

  // Tickets/Support
  TICKETS_READ: 'tickets:read',
  TICKETS_WRITE: 'tickets:write',

  // Settings
  SETTINGS_WRITE: 'settings:write',

  // Reports/Dashboard
  REPORTS_READ: 'reports:read',
} as const

// Role to Permissions Mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'admin': [PERMISSIONS.ALL],
  'org:admin': [PERMISSIONS.ALL],

  'sdr': [
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.LEADS_WRITE,
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.CONVERSATIONS_READ,
    PERMISSIONS.CONVERSATIONS_WRITE,
  ],
  'org:sdr': [
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.LEADS_WRITE,
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.CONVERSATIONS_READ,
    PERMISSIONS.CONVERSATIONS_WRITE,
  ],

  'cs': [
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.STUDENTS_WRITE,
    PERMISSIONS.CONVERSATIONS_READ,
    PERMISSIONS.CONVERSATIONS_WRITE,
    PERMISSIONS.REPORTS_READ,
  ],
  'org:cs': [
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.STUDENTS_WRITE,
    PERMISSIONS.CONVERSATIONS_READ,
    PERMISSIONS.CONVERSATIONS_WRITE,
    PERMISSIONS.REPORTS_READ,
  ],

  'support': [
    PERMISSIONS.CONVERSATIONS_READ,
    PERMISSIONS.CONVERSATIONS_WRITE,
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_WRITE,
    PERMISSIONS.STUDENTS_READ,
  ],
  'org:support': [
    PERMISSIONS.CONVERSATIONS_READ,
    PERMISSIONS.CONVERSATIONS_WRITE,
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_WRITE,
    PERMISSIONS.STUDENTS_READ,
  ],
}
