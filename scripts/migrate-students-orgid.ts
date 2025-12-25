import { ConvexClient } from 'convex/browser'
import { api } from '../convex/_generated/api.js'

async function migrateStudents() {
  const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL

  if (!CONVEX_URL) {
    console.error('❌ ERROR: CONVEX_URL environment variable not found')
    process.exit(1)
  }

  const client = new ConvexClient(CONVEX_URL)

  try {
    console.log('🚀 Iniciando migração de organizationId para alunos...')

    // Usamos a mutation trigger que chama a internal migration
    // Note: Em produção, isso precisaria de autenticação de admin
    const result = await client.mutation(api.migrationTrigger.triggerStudentMigration, {
      organizationId: undefined, // Deixa a mutation determinar automaticamente
    })

    console.log('✅ Resultado da migração:', result)

    if (result && typeof result === 'object' && 'migrated' in result && (result.migrated as number) > 0) {
      console.log(`\n🎉 ${result.migrated} alunos foram migrados com sucesso!`)
      console.log(`organizationId usado: ${result.organizationId}`)
    } else {
      console.log('\nℹ️  Nenhum aluno precisou ser migrado.')
    }
  } catch (error) {
    console.error('❌ Erro na migração:', error)
    throw error
  }
}

migrateStudents()
