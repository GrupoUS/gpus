import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

import { activities, emailContacts, financialMetrics, leads, users } from '../drizzle/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error('DATABASE_URL is required');
}

const client = neon(connectionString);
const db = drizzle(client);

// Data from Convex (manual mapping of IDs)
const USERS_DATA = [
	{
		clerkId: 'user_36rPetU2FCZFvOFyhzxBQrEMTZ6',
		email: 'msm.jur@gmail.com',
		name: 'Master Admin',
		role: 'admin',
		isActive: true,
		createdAt: new Date(1_768_594_370_996),
		updatedAt: new Date(1_768_594_370_996),
		// new fields default to 0/null
	},
];

const LEADS_DATA = [
	{
		// ID 1 (originally js7a0g35rn7rbp7cwkkdtywz857zbk7s)
		name: 'Mauri Test',
		email: 'mauri@test.com',
		phone: '+5511999999999',
		source: 'landing_page',
		sourceDetail: 'typebot_test_clre581p70023ug1x6arhrszx',
		stage: 'novo',
		temperature: 'frio',
		lgpdConsent: true,
		whatsappConsent: true,
		consentVersion: 'v1.0',
		consentGrantedAt: new Date(1_768_583_550_462),
		createdAt: new Date(1_768_583_550_462),
		updatedAt: new Date(1_768_583_550_462),
	},
	{
		// ID 2 (originally js751ykwvstmkpg8nesg663wk57zbyqe)
		name: 'Teste Integracao Typebot',
		email: 'teste@typebot.com',
		phone: '+5511999998888',
		source: 'landing_page',
		sourceDetail: 'typebot_test_script',
		stage: 'novo',
		temperature: 'frio',
		hasClinic: true,
		interestedProduct: 'trintae3',
		profession: 'dentista',
		yearsInAesthetics: 10,
		lgpdConsent: true,
		whatsappConsent: true,
		consentVersion: 'v1.0',
		consentGrantedAt: new Date(1_768_583_799_562),
		utmSource: 'test',
		utmCampaign: 'integration_verification',
		createdAt: new Date(1_768_583_799_562),
		updatedAt: new Date(1_768_583_799_562),
	},
];

// Map Convex IDs to Postgres IDs (assuming insertion order 1, 2)
const LEAD_ID_MAP: Record<string, number> = {
	js7a0g35rn7rbp7cwkkdtywz857zbk7s: 1,
	js751ykwvstmkpg8nesg663wk57zbyqe: 2,
};

const ACTIVITIES_DATA = [
	{
		description: 'Lead "Mauri Test" capturado via Landing Page',
		leadId: 'js7a0g35rn7rbp7cwkkdtywz857zbk7s',
		organizationId: 'public',
		performedBy: 'system_landing_page',
		type: 'lead_criado',
		createdAt: 1_768_583_550_462,
	},
	{
		description: 'Lead "Teste Integracao Typebot" capturado via Landing Page',
		leadId: 'js751ykwvstmkpg8nesg663wk57zbyqe',
		organizationId: 'public',
		performedBy: 'system_landing_page',
		type: 'lead_criado',
		createdAt: 1_768_583_799_562,
	},
	// System cron logs (simplified)
	...Array.from({ length: 24 }).map((_, i) => ({
		description: 'Reactivated 0 idle leads',
		organizationId: 'system',
		performedBy: 'system_cron',
		type: 'system_lead_reactivation',
		createdAt: 1_768_982_400_230 + i * 86_400_000,
	})),
];

const EMAIL_CONTACTS_DATA = [
	{
		firstName: 'Mauri',
		lastName: 'Test',
		email: 'mauri@test.com',
		leadId: 'js7a0g35rn7rbp7cwkkdtywz857zbk7s',
		organizationId: 'public',
		sourceType: 'lead',
		subscriptionStatus: 'pending',
		createdAt: 1_768_583_550_521,
	},
	{
		firstName: 'Teste',
		lastName: 'Integracao Typebot',
		email: 'teste@typebot.com',
		leadId: 'js751ykwvstmkpg8nesg663wk57zbyqe',
		organizationId: 'public',
		sourceType: 'lead',
		subscriptionStatus: 'pending',
		createdAt: 1_768_583_799_625,
	},
];

const FINANCIAL_METRICS_DATA = [
	{
		organizationId: 'public',
		totalValue: '0',
		totalReceived: '0',
		totalPending: '0',
		totalOverdue: '0',
		paymentsCount: 0,
		updatedAt: 1_766_779_909_588,
	},
];

async function main() {
	console.log('Starting data import...');

	// 1. Truncate tables
	console.log('Truncating tables...');
	await db.execute(
		sql`TRUNCATE TABLE users, leads, activities, email_contacts, financial_metrics, students, enrollments, settings, tasks, notifications, conversations, messages, lgpd_consent RESTART IDENTITY CASCADE`,
	);

	// 2. Insert Users
	console.log('Inserting users...');
	await db.insert(users).values(USERS_DATA as any);

	// 3. Insert Leads (this will generate IDs 1 and 2)
	console.log('Inserting leads...');
	await db.insert(leads).values(LEADS_DATA as any);

	// 4. Insert Activities
	console.log('Inserting activities...');
	const activitiesData = ACTIVITIES_DATA.map((a) => ({
		...a,
		leadId: 'leadId' in a && a.leadId ? LEAD_ID_MAP[a.leadId] : null,
		createdAt: new Date(a.createdAt),
	}));
	await db.insert(activities).values(activitiesData as any);

	// 5. Insert Email Contacts
	console.log('Inserting email contacts...');
	const emailContactsData = EMAIL_CONTACTS_DATA.map((c) => ({
		...c,
		leadId: c.leadId ? LEAD_ID_MAP[c.leadId] : null,
		createdAt: new Date(c.createdAt),
		updatedAt: new Date(c.createdAt),
	}));
	await db.insert(emailContacts).values(emailContactsData as any);

	// 6. Insert Financial Metrics
	console.log('Inserting financial metrics...');
	const finMetrics = FINANCIAL_METRICS_DATA.map((m) => ({
		...m,
		updatedAt: new Date(m.updatedAt),
		createdAt: new Date(m.updatedAt),
	}));
	await db.insert(financialMetrics).values(finMetrics as any);

	console.log('Data import completed successfully!');
}

main().catch((err) => {
	console.error('Import failed:', err);
	process.exit(1);
});
