import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { writeFileSync, mkdirSync } from 'fs';

// Ensure the output directory exists
mkdirSync('data-export', { recursive: true });

// List of all tables to be exported
const tables = [
    'users',
    'leads',
    'objections',
    'students',
    'enrollments',
    'conversations',
    'messages',
    'messageTemplates',
    'activities',
    'tasks',
    'taskMentions',
    'customFields',
    'customFieldValues',
    'notifications',
    'settings',
    'dailyMetrics',
    'lgpdConsent',
    'lgpdAudit',
    'lgpdRetention',
    'lgpdRequests',
    'lgpdDataBreach',
    'marketing_leads',
    'emailContacts',
    'emailLists',
    'emailCampaigns',
    'emailTemplates',
    'emailEvents',
    'asaasPayments',
    'asaasWebhooks',
    'asaasWebhookDeduplication',
    'asaasSubscriptions',
    'asaasSyncLogs',
    'asaasApiAudit',
    'financialMetrics',
    'asaasConflicts',
    'asaasAlerts',
    'organizationAsaasApiKeys',
    'rateLimits',
    'evolutionApiQueue',
    'tags',
    'leadTags',
];

async function exportAllData() {
    const convexUrl = process.env.CONVEX_URL;
    if (!convexUrl) {
        console.error('CONVEX_URL environment variable is not set.');
        process.exit(1);
    }

    const client = new ConvexHttpClient(convexUrl);

    console.log('Starting data export from Convex...');

    for (const table of tables) {
        try {
            // Assuming a 'list' query exists for each table
            // @ts-ignore
            const data = await client.query(api[table].list, {});
            const filePath = `data-export/${table}.json`;
            writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Successfully exported ${data.length} records from '${table}' to ${filePath}`);
        } catch (error) {
            console.error(`❌ Failed to export data from '${table}':`, error);
        }
    }

    console.log('\nData export process completed.');
}

exportAllData();
