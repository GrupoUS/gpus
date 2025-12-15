import { v } from 'convex/values'
import { query } from './_generated/server'

export const getDashboard = query({
  args: {
    period: v.union(
      v.literal('7d'),
      v.literal('30d'),
      v.literal('90d'),
      v.literal('year')
    ),
  },
  handler: async (ctx, args) => {
    const periodDays = { '7d': 7, '30d': 30, '90d': 90, 'year': 365 }
    const days = periodDays[args.period]
    const now = Date.now()
    const msPerDay = 24 * 60 * 60 * 1000
    const startDate = now - days * msPerDay
    const previousStartDate = startDate - days * msPerDay

    // Helper for trends
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    // 1. Leads
    const allLeads = await ctx.db.query('leads').collect()
    
    const currentLeads = allLeads.filter(l => l.createdAt >= startDate)
    const previousLeads = allLeads.filter(l => l.createdAt >= previousStartDate && l.createdAt < startDate)
    
    const totalLeads = currentLeads.length
    const leadsTrend = calculateTrend(totalLeads, previousLeads.length)

    // 2. Conversion (Closed Won)
    // Assuming status 'fechado_ganho' or 'won' based on common patterns. 
    // Plan uses 'fechado_ganho' in funnel description.
    const getWon = (list: any[]) => list.filter(l => l.status === 'fechado_ganho' || l.status === 'won').length
    const currentWon = getWon(currentLeads)
    const previousWon = getWon(previousLeads)
    
    const conversionRate = totalLeads > 0 ? Math.round((currentWon / totalLeads) * 100) : 0
    const previousConversionRate = previousLeads.length > 0 ? Math.round((previousWon / previousLeads.length) * 100) : 0
    const conversionTrend = calculateTrend(conversionRate, previousConversionRate)

    // 3. Revenue (Enrollments)
    const allEnrollments = await ctx.db.query('enrollments').collect()
    const currentEnrollments = allEnrollments.filter(e => e.createdAt >= startDate)
    const previousEnrollments = allEnrollments.filter(e => e.createdAt >= previousStartDate && e.createdAt < startDate)

    const sumRevenue = (list: any[]) => list.reduce((acc, curr) => acc + (curr.totalValue || 0), 0)
    const revenue = sumRevenue(currentEnrollments)
    const previousRevenue = sumRevenue(previousEnrollments)
    const revenueTrend = calculateTrend(revenue, previousRevenue)

    // 4. Messages & Response Time
    const allMessages = await ctx.db.query('messages').collect()
    const currentMessages = allMessages.filter(m => m.createdAt >= startDate)
    const previousMessages = allMessages.filter(m => m.createdAt >= previousStartDate && m.createdAt < startDate) // Logic fix
    
    const totalMessages = currentMessages.length
    
    // Avg response time - placeholder logic as specific tracking fields aren't guaranteed
    // If we can't calculate accurately without complex logic, we return 0 or mock
    const avgResponseTime = 0 
    const responseTimeTrend = 0

    // 5. Funnel
    const funnel = {
      novo: currentLeads.filter(l => l.status === 'novo' || l.status === 'new').length,
      primeiro_contato: currentLeads.filter(l => l.status === 'primeiro_contato').length,
      qualificado: currentLeads.filter(l => l.status === 'qualificado').length,
      proposta: currentLeads.filter(l => l.status === 'proposta').length,
      negociacao: currentLeads.filter(l => l.status === 'negociacao').length,
      fechado_ganho: currentWon,
    }

    // 6. Leads by Product (using 'product' field on leads if exists, or enrollments?)
    // Plan says "Leads by Product". Leads usually have 'product' interest.
    const leadsByProduct: Record<string, number> = {}
    currentLeads.forEach(l => {
      const p = l.product || 'Outros'
      leadsByProduct[p] = (leadsByProduct[p] || 0) + 1
    })

    return {
      totalLeads,
      leadsTrend,
      conversionRate,
      conversionTrend,
      revenue,
      revenueTrend,
      totalMessages,
      avgResponseTime,
      responseTimeTrend,
      funnel,
      leadsByProduct,
    }
  },
})
