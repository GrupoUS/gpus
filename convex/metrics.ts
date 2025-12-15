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
    // Calculate date ranges
    const periodDays = { '7d': 7, '30d': 30, '90d': 90, 'year': 365 }
    const days = periodDays[args.period]
    const now = Date.now()
    const startDate = now - (days * 24 * 60 * 60 * 1000)
    const previousStartDate = startDate - (days * 24 * 60 * 60 * 1000)

    // 1. Leads Metrics
    // We could optimize using 'by_created' index if we assume we only want recent ones.
    // However, leads table might be small enough. For robustness, let's just collect all.
    // Or better: use index range.
    const allLeads = await ctx.db.query('leads').collect()
    
    const currentLeads = allLeads.filter(l => l.createdAt >= startDate)
    const previousLeads = allLeads.filter(l => l.createdAt >= previousStartDate && l.createdAt < startDate)
    
    const totalLeads = currentLeads.length
    const previousTotalLeads = previousLeads.length
    const leadsTrend = previousTotalLeads > 0 
      ? ((totalLeads - previousTotalLeads) / previousTotalLeads) * 100 
      : 0

    // Conversion Rate (stage = 'fechado_ganho')
    const currentConversions = currentLeads.filter(l => l.stage === 'fechado_ganho').length
    const previousConversions = previousLeads.filter(l => l.stage === 'fechado_ganho').length
    
    const conversionRate = totalLeads > 0 ? (currentConversions / totalLeads) * 100 : 0
    const previousConversionRate = previousTotalLeads > 0 ? (previousConversions / previousTotalLeads) * 100 : 0
    const conversionTrend = previousConversionRate > 0 
      ? ((conversionRate - previousConversionRate) / previousConversionRate) * 100 
      : 0

    // 2. Revenue (from Enrollments)
    const allEnrollments = await ctx.db.query('enrollments').collect()
    const currentEnrollments = allEnrollments.filter(e => e.createdAt >= startDate)
    const previousEnrollments = allEnrollments.filter(e => e.createdAt >= previousStartDate && e.createdAt < startDate)

    const revenue = currentEnrollments.reduce((sum, e) => sum + e.totalValue, 0)
    const previousRevenue = previousEnrollments.reduce((sum, e) => sum + e.totalValue, 0)
    const revenueTrend = previousRevenue > 0 
      ? ((revenue - previousRevenue) / previousRevenue) * 100 
      : 0

    // 3. Messages & Response Time
    // This is heavy if many messages. For now, following plan.
    const allMessages = await ctx.db.query('messages').collect()
    const currentMessages = allMessages.filter(m => m.createdAt >= startDate)
    
    const totalMessages = currentMessages.length

    // Avg Response Time (Not trivial to calculate from raw messages list without context)
    // Plan says "avgResponseTime".
    // Using 'dailyMetrics' table might be better if populated?
    // But plan says "getDashboard... Calcular métricas... avgResponseTime".
    // Let's rely on 'dailyMetrics' or just return a placeholder / simplify.
    // actually, `conversations` has `firstResponseAt` and `createdAt`.
    const conversations = await ctx.db.query('conversations').collect()
    const currentConversations = conversations.filter(c => c.createdAt >= startDate && c.firstResponseAt)
    const previousConversations = conversations.filter(c => c.createdAt >= previousStartDate && c.createdAt < startDate && c.firstResponseAt)
    
    const calculateAvgResponseTime = (convs: typeof conversations) => {
      if (convs.length === 0) return 0
      const totalTime = convs.reduce((sum, c) => sum + ((c.firstResponseAt || 0) - c.createdAt), 0)
      return (totalTime / convs.length) / 60000 // in minutes
    }
    
    const avgResponseTime = calculateAvgResponseTime(currentConversations)
    const previousAvgResponseTime = calculateAvgResponseTime(previousConversations)
    const responseTimeTrend = previousAvgResponseTime > 0 
      ? ((avgResponseTime - previousAvgResponseTime) / previousAvgResponseTime) * 100 
      : 0

    // 4. Funnel
    const funnel = {
        novo: currentLeads.filter(l => l.stage === 'novo').length,
        first_contact: currentLeads.filter(l => l.stage === 'primeiro_contato').length,
        qualified: currentLeads.filter(l => l.stage === 'qualificado').length,
        proposal: currentLeads.filter(l => l.stage === 'proposta').length,
        negotiation: currentLeads.filter(l => l.stage === 'negociacao').length,
        won: currentLeads.filter(l => l.stage === 'fechado_ganho').length,
    }

    // 5. Leads By Product
    // lead.interestedProduct
    const leadsByProduct: Record<string, number> = {}
    currentLeads.forEach(l => {
        const prod = l.interestedProduct || 'indefinido'
        leadsByProduct[prod] = (leadsByProduct[prod] || 0) + 1
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

export const getTeamPerformance = query({
  args: {
    period: v.union(v.literal('7d'), v.literal('30d'), v.literal('90d'), v.literal('year')),
  },
  handler: async (ctx, args) => {
    // Return users sorted by conversions for now
    // Ideally we filter by changes in the period, but schema has total aggregated 'conversoes'.
    // We'll use the aggregated value for simplicity as we don't have historical snapshots per user easily available 
    // unless we aggregate from 'activities' or 'leads' assignedTo.
    // For now, simple user list sorted by performance.
    
    // We can aggregate from leads if we want precision for the period.
    // Let's do that for consistency with the dashboard period filter.
    
    const periodDays = { '7d': 7, '30d': 30, '90d': 90, 'year': 365 }
    const days = periodDays[args.period]
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000)
    
    const leads = await ctx.db.query('leads').filter(q => q.eq(q.field('stage'), 'fechado_ganho')).collect()
    const leadsInPeriod = leads.filter(l => l.updatedAt >= startDate) // using updatedAt for conversion time approx
    
    // Group by assignedTo
    const performance = new Map<string, number>()
    for (const lead of leadsInPeriod) {
        if (lead.assignedTo) {
            performance.set(lead.assignedTo, (performance.get(lead.assignedTo) || 0) + 1)
        }
    }
    
    const users = await ctx.db.query('users').collect()
    
    const result = users.map(u => ({
        _id: u._id,
        name: u.name,
        role: u.role,
        metric: performance.get(u._id) || 0,
        metricLabel: 'Conversões',
    }))
    
    return result.sort((a, b) => b.metric - a.metric).slice(0, 5)
  },
})
