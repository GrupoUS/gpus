import { v } from 'convex/values'
import { query } from './_generated/server'

export const getDashboard = query({
  args: {
    period: v.optional(v.union(
      v.literal('7d'),
      v.literal('30d'),
      v.literal('90d'),
      v.literal('year'),
      v.literal('all')
    )),
  },
  handler: async (ctx, args) => {
    const period = args.period || '30d'
    const now = Date.now()
    let startDate = 0
    let previousStartDate = 0

    if (period !== 'all') {
      const periodDays = { '7d': 7, '30d': 30, '90d': 90, 'year': 365 }
      const days = periodDays[period]
      const msPerDay = 24 * 60 * 60 * 1000
      startDate = now - days * msPerDay
      previousStartDate = startDate - days * msPerDay
    }

    // Helper for trends
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    // 1. Leads
    const allLeads = await ctx.db.query('leads').collect()
    
    const currentLeads = period === 'all' ? allLeads : allLeads.filter(l => l.createdAt >= startDate)
    const previousLeads = period === 'all' ? [] : allLeads.filter(l => l.createdAt >= previousStartDate && l.createdAt < startDate)
    
    const totalLeads = currentLeads.length
    const leadsTrend = calculateTrend(totalLeads, previousLeads.length)

    // Leads This Month (for reports)
    const leadsThisMonth = allLeads.filter(
      (lead) => new Date(lead.createdAt).getMonth() === new Date().getMonth() && 
                new Date(lead.createdAt).getFullYear() === new Date().getFullYear()
    ).length

    // Leads By Stage
    const leadsByStage = currentLeads.reduce(
      (acc, lead) => {
        acc[lead.stage] = (acc[lead.stage] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // 2. Conversion (Closed Won)
    const getWon = (list: any[]) => list.filter(l => l.stage === 'fechado_ganho').length
    const currentWon = getWon(currentLeads)
    const previousWon = getWon(previousLeads)
    
    const conversionRate = totalLeads > 0 ? Math.round((currentWon / totalLeads) * 100) : 0
    const previousConversionRate = previousLeads.length > 0 ? Math.round((previousWon / previousLeads.length) * 100) : 0
    const conversionTrend = calculateTrend(conversionRate, previousConversionRate)

    // 3. Revenue (Enrollments)
    const allEnrollments = await ctx.db.query('enrollments').collect()
    const currentEnrollments = period === 'all' ? allEnrollments : allEnrollments.filter(e => e.createdAt >= startDate)
    const previousEnrollments = period === 'all' ? [] : allEnrollments.filter(e => e.createdAt >= previousStartDate && e.createdAt < startDate)

    const sumRevenue = (list: any[]) => list.reduce((acc, curr) => acc + (curr.totalValue || 0), 0)
    const revenue = sumRevenue(currentEnrollments)
    const previousRevenue = sumRevenue(previousEnrollments)
    const revenueTrend = calculateTrend(revenue, previousRevenue)

    // 4. Messages & Response Time
    const allMessages = await ctx.db.query('messages').collect()
    const currentMessages = period === 'all' ? allMessages : allMessages.filter(m => m.createdAt >= startDate)
    
    const messagesCount = currentMessages.length // Renamed from totalMessages to match Reports expectations or alias it
    
    const avgResponseTime = 0 
    const responseTimeTrend = 0

    // 5. Conversations
    const allConversations = await ctx.db.query('conversations').collect()
    const currentConversations = period === 'all' ? allConversations : allConversations.filter(c => c.createdAt >= startDate)
    const conversationsCount = currentConversations.length

    // 6. Funnel
    const funnel = {
      novo: currentLeads.filter(l => l.stage === 'novo').length,
      primeiro_contato: currentLeads.filter(l => l.stage === 'primeiro_contato').length,
      qualificado: currentLeads.filter(l => l.stage === 'qualificado').length,
      proposta: currentLeads.filter(l => l.stage === 'proposta').length,
      negociacao: currentLeads.filter(l => l.stage === 'negociacao').length,
      fechado_ganho: currentWon,
    }

    // 7. Leads by Product
    const leadsByProduct: Record<string, number> = {}
    currentLeads.forEach(l => {
      const p = l.interestedProduct || 'Outros'
      leadsByProduct[p] = (leadsByProduct[p] || 0) + 1
    })

    // 8. Daily Metrics
    let dailyMetrics = await ctx.db.query('dailyMetrics').collect()
    if (period !== 'all') {
      const thresholdDate = new Date(startDate).toISOString().split('T')[0]
      dailyMetrics = dailyMetrics.filter(metric => metric.date >= thresholdDate)
    }
    dailyMetrics.sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalLeads,
      leadsTrend,
      conversationsCount,
      messagesCount, // Alias for reports
      leadsThisMonth,
      
      conversionRate,
      conversionTrend,
      
      revenue,
      revenueTrend,
      
      avgResponseTime,
      responseTimeTrend,
      
      funnel,
      leadsByStage, // For reports
      leadsByProduct,
      
      dailyMetrics: dailyMetrics.map(m => ({
        date: m.date,
        newLeads: m.newLeads,
        messagesReceived: m.messagesReceived,
        messagesSent: m.messagesSent,
        conversions: m.conversions,
      })),
    }
  },
})
