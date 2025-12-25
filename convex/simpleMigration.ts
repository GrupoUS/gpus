import { mutation } from './_generated/server'
import { v } from 'convex/values'
import { requireAuth } from './lib/auth'

/**
 * Simples mutation pública para diagnosticar e corrigir alunos sem organizationId
 * Execute via console: convexMutation('students:fixOrganizationId', {})
 */
export const fixOrganizationId = mutation({
  args: {},
  handler: async (ctx) => {
    // Apenas usuários autenticados
    const identity = await requireAuth(ctx)

    // Obter organizationId do usuário (pode ser org_id do Clerk ou clerkId como fallback)
    const organizationId = identity.org_id || identity.subject

    console.log(`[Fix] User: ${identity.email}, orgId: ${organizationId}`)

    // Buscar todos os alunos
    const allStudents = await ctx.db.query('students').collect()
    console.log(`[Fix] Total alunos no banco: ${allStudents.length}`)

    // Filtrar alunos sem organizationId ou com organizationId diferente
    const studentsToFix = allStudents.filter(
      (s) => !s.organizationId || s.organizationId !== organizationId
    )
    console.log(`[Fix] Alunos para corrigir: ${studentsToFix.length}`)

    if (studentsToFix.length === 0) {
      return {
        message: '✅ Todos os alunos já têm o organizationId correto!',
        organizationId,
        totalStudents: allStudents.length,
        fixed: 0,
        sampleStudents: allStudents.slice(0, 3).map((s) => ({
          _id: s._id,
          name: s.name,
          organizationId: s.organizationId,
        })),
      }
    }

    // Atualizar cada aluno
    for (const student of studentsToFix) {
      await ctx.db.patch(student._id, { organizationId })
    }

    console.log(
      `[Fix] ✅ Atualizados ${studentsToFix.length} alunos com orgId: ${organizationId}`
    )

    return {
      message: `✅ ${studentsToFix.length} alunos atualizados!`,
      organizationId,
      totalStudents: allStudents.length,
      fixed: studentsToFix.length,
      sampleStudents: studentsToFix.slice(0, 3).map((s) => ({
        _id: s._id,
        name: s.name,
        oldOrganizationId: s.organizationId,
        newOrganizationId: organizationId,
      })),
    }
  },
})
