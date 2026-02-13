import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { db } from '../server/db';
import * as schema from '../drizzle/schema';

async function validateData() {
    const convexUrl = process.env.CONVEX_URL;
    if (!convexUrl) {
        console.error('CONVEX_URL environment variable is not set.');
        process.exit(1);
    }

    const convexClient = new ConvexHttpClient(convexUrl);

    console.log('Starting data validation...');

    // Validate users table
    // @ts-ignore
    const convexUsers = await convexClient.query(api.users.list, {});
    const neonUsers = await db.select().from(schema.users);

    console.log(`Users count - Convex: ${convexUsers.length}, NeonDB: ${neonUsers.length}`);
    if (convexUsers.length !== neonUsers.length) {
        console.error('❌ User count mismatch!');
    } else {
        console.log('✅ User count matches.');
    }

    // Validate leads table
    // @ts-ignore
    const convexLeads = await convexClient.query(api.leads.list, {});
    const neonLeads = await db.select().from(schema.leads);

    console.log(`Leads count - Convex: ${convexLeads.length}, NeonDB: ${neonLeads.length}`);
    if (convexLeads.length !== neonLeads.length) {
        console.error('❌ Lead count mismatch!');
    } else {
        console.log('✅ Lead count matches.');
    }

    // ... add validation for all other tables

    console.log('\nData validation process completed.');
}

validateData();
