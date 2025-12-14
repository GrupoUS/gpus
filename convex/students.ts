import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const listStudents = query({
  args: {
    status: v.optional(v.string()),
    assignedCS: v.optional(v.id('users')),
    churnRisk: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let students = await ctx.db
      .query('students')
      .order('desc')
      .collect()

    if (args.status && args.status !== 'all') {
      students = students.filter(s => s.status === args.status)
    }

    if (args.assignedCS) {
      students = students.filter(s => s.assignedCS === args.assignedCS)
    }

    if (args.churnRisk) {
      students = students.filter(s => s.churnRisk === args.churnRisk)
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase()
      students = students.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.email.toLowerCase().includes(searchLower) ||
        s.phone.includes(args.search!)
      )
    }

    return students
  },
})

export const getStudent = query({
  args: { studentId: v.id('students') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.studentId)
  },
})

export const createStudent = mutation({
  args: {
    leadId: v.optional(v.id('leads')),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    cpf: v.optional(v.string()),
    profession: v.string(),
    professionalId: v.optional(v.string()),
    hasClinic: v.boolean(),
    clinicName: v.optional(v.string()),
    clinicCity: v.optional(v.string()),
    assignedCS: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const now = Date.now()

    return await ctx.db.insert('students', {
      ...args,
      status: 'ativo',
      churnRisk: 'baixo',
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updateStudent = mutation({
  args: {
    studentId: v.id('students'),
    patch: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      status: v.optional(v.union(
        v.literal('ativo'),
        v.literal('inativo'),
        v.literal('pausado'),
        v.literal('formado')
      )),
      churnRisk: v.optional(v.union(
        v.literal('baixo'),
        v.literal('medio'),
        v.literal('alto')
      )),
      assignedCS: v.optional(v.id('users')),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    await ctx.db.patch(args.studentId, {
      ...args.patch,
      updatedAt: Date.now(),
    })
  },
})

export const getStudentWithEnrollments = query({
  args: { studentId: v.id('students') },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId)
    if (!student) return null

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_student', q => q.eq('studentId', args.studentId))
      .collect()

    return { student, enrollments }
  },
})
