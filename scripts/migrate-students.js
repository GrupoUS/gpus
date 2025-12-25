import { ConvexHttpClient } from 'convex/browser'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local')
let CONVEX_URL = 'https://eager-kangaroo-679.convex.cloud'

try {
  const envContent = readFileSync(envPath, 'utf-8')
  const match = envContent.match(/VITE_CONVEX_URL=([^\n]+)/)
  if (match) {
    CONVEX_URL = match[1]
  }
} catch (e) {
  console.log('⚠️  Could not load .env.local, using default URL')
}

console.log('🔗 Connecting to Convex:', CONVEX_URL)

// Execute migration to fix organizationId for existing students
async function migrateStudents() {
  const client = new ConvexHttpClient(CONVEX_URL)

  try {
    console.log('🚀 Starting migration...')
    const result = await client.mutation(
      'internal.migrations.migrateStudentOrganizationId'
    )
    console.log('\n✅ Migration completed successfully!')
    console.log('\n📊 Results:')
    console.log(`   - ${result.migrated} students were migrated`)
    console.log(`   - Organization ID: ${result.organizationId}`)
    console.log(`   - Message: ${result.message}`)
    console.log('\n✨ Students should now appear in the frontend!')
  } catch (error) {
    console.error('\n❌ Migration failed!')
    console.error('Error:', error.message || error)
    console.error('\n💡 Try running manually from Convex Dashboard:')
    console.error('   Dashboard → Functions → internal.migrations.migrateStudentOrganizationId')
    process.exit(1)
  }
}

migrateStudents()
