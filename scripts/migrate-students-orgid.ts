import { convex } from './_generated/api.js'

async function migrateStudents() {
  try {
    console.log('🚀 Iniciando migração de organizationId para alunos...')

    const result = await convex.migrations.migrateStudentOrganizationId({
      organizationId: undefined, // Deixa a mutation determinar automaticamente
    })

    console.log('✅ Resultado da migração:', result)

    if (result.migrated > 0) {
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
