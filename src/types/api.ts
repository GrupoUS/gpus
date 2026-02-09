import type { inferRouterOutputs } from '@trpc/server';

import type { AppRouter } from '../../server/routers';

type RouterOutput = inferRouterOutputs<AppRouter>;

// ── Domain Types (auto-derived from tRPC router return types) ──

// Leads
export type Lead = RouterOutput['leads']['get'];
export type LeadListResult = RouterOutput['leads']['list'];
export type LeadListItem = LeadListResult['data'][number];
export type LeadStats = RouterOutput['leads']['stats'];

// Students
export type Student = RouterOutput['students']['get'];
export type StudentListResult = RouterOutput['students']['list'];
export type StudentListItem = StudentListResult['data'][number];

// Users
export type User = RouterOutput['users']['get'];
export type UserMe = RouterOutput['users']['me'];
export type SystemUser = RouterOutput['users']['listSystemUsers'][number];

// Enrollments
export type Enrollment = RouterOutput['enrollments']['get'];

// Conversations & Messages
export type Conversation = RouterOutput['conversations']['get'];
export type ConversationListResult = RouterOutput['conversations']['list'];
export type ConversationListItem = ConversationListResult['data'][number];
export type Message = RouterOutput['messages']['listByConversation'][number];

// Activities & Tasks
export type Activity = RouterOutput['activities']['list'][number];
export type TaskItem = RouterOutput['tasks']['list']['data'][number];
export type TaskListResult = RouterOutput['tasks']['list'];

// Notifications, Tags, Settings
export type Notification = RouterOutput['notifications']['list'][number];
export type Tag = RouterOutput['tags']['list'][number];
export type Setting = RouterOutput['settings']['list'][number];

// Financial
export type FinancialMetrics = RouterOutput['financial']['metrics'];
export type AsaasConflict = RouterOutput['financial']['conflicts']['list'][number];
export type Objection = RouterOutput['financial']['objections']['list'][number];

// Email Marketing
export type EmailContact = RouterOutput['emailMarketing']['contacts']['list'][number];
export type EmailList = RouterOutput['emailMarketing']['lists']['list'][number];
export type EmailCampaign = RouterOutput['emailMarketing']['campaigns']['list'][number];
export type EmailCampaignDetail = RouterOutput['emailMarketing']['campaigns']['get'];
export type EmailTemplate = RouterOutput['emailMarketing']['templates']['list'][number];
export type EmailEvent = RouterOutput['emailMarketing']['events']['list'][number];

// Custom Fields
export type CustomField = RouterOutput['customFields']['list'][number];
export type CustomFieldValue = RouterOutput['customFields']['getValues'][number];

// Message Templates (WhatsApp/SMS)
export type MessageTemplate = RouterOutput['templates']['list'][number];

// Metrics
export type DailyMetrics = RouterOutput['metrics']['daily'];

// LGPD
export type LgpdRequest = RouterOutput['lgpd']['requests']['list'][number];
