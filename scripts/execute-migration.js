import { ConvexHttpClient } from 'convex/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = new ConvexHttpClient({
  address: process.env.VITE_CONVEX_URL || 'https://frugal-goose-158.convex.cloud',
});

async function executeMigration() {
  console.log('🚀 Starting student organizationId migration...');

  try {
    const result = await client.mutation('migrationTrigger.triggerStudentMigration', {});

    console.log('✅ Migration completed:', result);
    console.log(`   - Students migrated: ${result.migrated}`);
    console.log(`   - OrganizationId: ${result.organizationId}`);
    console.log(`   - Message: ${result.message}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

executeMigration()
  .then(() => {
    console.log('✨ Migration finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration error:', error);
    process.exit(1);
  });
