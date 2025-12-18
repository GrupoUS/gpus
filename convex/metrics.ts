import { v } from 'convex/values'
import { withQuerySecurity } from './lib/securityMiddleware'

export const getDashboard = withQuerySecurity(
  async (ctx, args: {
    period: '7d' | '30d' | '90d' | 'year' | 'all'
  }) => {
    // Calculate date ranges
    const now = Date.now()
    let startDate = 0
    let previousStartDate = 0

    if (args.period !== 'all') {
      const periodDays = { '7d': 7, '30d': 30, '90d': 90, 'year': 365 }
      const days = periodDays[args.period]
      startDate = now - days * 24 * 60 * 60 * 1000
      previousStartDate = startDate - days * 24 * 60 * 60 * 1000
    }

    // 1. Leads Metrics (with Trends)
    const currentLeads = await (args.period === 'all'
      ? ctx.db.query('leads')
      : ctx.db.query('leads').withIndex('by_created', (q) => q.gte('createdAt', startDate))
    ).collect()

    const previousLeads =
      args.period === 'all'
        ? []
        : await ctx.db
            .query('leads')
            .withIndex('by_created', (q) =>
              q.gte('createdAt', previousStartDate).lt('createdAt', startDate)
            )
            .collect()

    const totalLeads = currentLeads.length
    const previousTotalLeads = previousLeads.length

    // Explicitly 0 trend for 'all'
    const leadsTrend =
      args.period !== 'all' && previousTotalLeads > 0
        ? ((totalLeads - previousTotalLeads) / previousTotalLeads) * 100
        : 0

    // leadsThisMonth (specific for reports)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const leadsThisMonth = (
      await ctx.db
        .query('leads')
        .withIndex('by_created', (q) => q.gte('createdAt', startOfMonth.getTime()))
        .collect()
    ).length

    // Conversion Rate (stage = 'fechado_ganho')
    const currentConversions = currentLeads.filter((l) => l.stage === 'fechado_ganho').length
    const previousConversions = previousLeads.filter((l) => l.stage === 'fechado_ganho').length

    const conversionRate = totalLeads > 0 ? (currentConversions / totalLeads) * 100 : 0
    const previousConversionRate =
      previousTotalLeads > 0 ? (previousConversions / previousTotalLeads) * 100 : 0

    const conversionTrend =
      args.period !== 'all' && previousConversionRate > 0
        ? ((conversionRate - previousConversionRate) / previousConversionRate) * 100
        : 0

    // 2. Revenue (from Enrollments)
    const currentEnrollments = await (args.period === 'all'
      ? ctx.db.query('enrollments')
      : ctx.db.query('enrollments').withIndex('by_created', (q) => q.gte('createdAt', startDate))
    ).collect()

    const previousEnrollments =
      args.period === 'all'
        ? []
        : await ctx.db
            .query('enrollments')
            .withIndex('by_created', (q) =>
              q.gte('createdAt', previousStartDate).lt('createdAt', startDate)
            )
            .collect()

    const revenue = currentEnrollments.reduce((sum, e) => sum + e.totalValue, 0)
    const previousRevenue = previousEnrollments.reduce((sum, e) => sum + e.totalValue, 0)

    const revenueTrend =
      args.period !== 'all' && previousRevenue > 0
        ? ((revenue - previousRevenue) / previousRevenue) * 100
        : 0

    // 3. Messages & Response Time
    const currentMessages = await (args.period === 'all'
      ? ctx.db.query('messages')
      : ctx.db.query('messages').withIndex('by_created', (q) => q.gte('createdAt', startDate))
    ).collect()

    const totalMessages = currentMessages.length

    // Avg Response Time (from Conversations)
    const currentConversations = await (args.period === 'all'
      ? ctx.db.query('conversations').filter((c) => c.neq(c.field('firstResponseAt'), undefined))
      : ctx.db
          .query('conversations')
          .withIndex('by_created', (q) => q.gte('createdAt', startDate))
          .filter((c) => c.neq(c.field('firstResponseAt'), undefined))
    ).collect()

    const previousConversations =
      args.period === 'all'
        ? []
        : await ctx.db
            .query('conversations')
            .withIndex('by_created', (q) =>
              q.gte('createdAt', previousStartDate).lt('createdAt', startDate)
            )
            .filter((c) => c.neq(c.field('firstResponseAt'), undefined))
            .collect()

    const conversationsCount = currentConversations.length

    const calculateAvgResponseTime = (convs: typeof currentConversations) => {
      if (convs.length === 0) return 0
      const totalTime = convs.reduce((sum, c) => sum + ((c.firstResponseAt || 0) - c.createdAt), 0)
      return Math.round(totalTime / convs.length / 60000) // in minutes
    }

    const avgResponseTime = calculateAvgResponseTime(currentConversations)
    const previousAvgResponseTime = calculateAvgResponseTime(previousConversations)

    const responseTimeTrend =
      args.period !== 'all' && previousAvgResponseTime > 0
        ? ((avgResponseTime - previousAvgResponseTime) / previousAvgResponseTime) * 100
        : 0

    // 4. Funnel
    const funnel = {
      novo: currentLeads.filter((l) => l.stage === 'novo').length,
      primeiro_contato: currentLeads.filter((l) => l.stage === 'primeiro_contato').length,
      qualificado: currentLeads.filter((l) => l.stage === 'qualificado').length,
      proposta: currentLeads.filter((l) => l.stage === 'proposta').length,
      negociacao: currentLeads.filter((l) => l.stage === 'negociacao').length,
      fechado_ganho: currentLeads.filter((l) => l.stage === 'fechado_ganho').length,
    }

    // 5. Leads By Product
    const leadsByProduct: Record<string, number> = {}
    currentLeads.forEach((l) => {
      const prod = l.interestedProduct || 'indefinido'
      leadsByProduct[prod] = (leadsByProduct[prod] || 0) + 1
    })

    // 6. Daily Metrics for Charts
    const dailyMetricsData = await ctx.db.query('dailyMetrics').collect()
    const dailyMetrics = dailyMetricsData
      .filter((m) => (args.period === 'all' ? true : new Date(m.date).getTime() >= startDate))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Round trend values to one decimal place for readability
    const roundTrend = (value: number) => Math.round(value * 10) / 10

    return {
      totalLeads,
      leadsTrend: roundTrend(leadsTrend),
      leadsThisMonth,
      conversionRate,
      conversionTrend: roundTrend(conversionTrend),
      revenue,
      revenueTrend: roundTrend(revenueTrend),
      totalMessages,
      conversationsCount,
      avgResponseTime,
      responseTimeTrend: roundTrend(responseTimeTrend),
      funnel,
      leadsByStage: funnel,
      leadsByProduct,
      dailyMetrics,
      messagesCount: totalMessages,
    }
  },
  {
    validationSchema: {
      period: v.union(v.literal('7d'), v.literal('30d'), v.literal('90d'), v.literal('year'), v.literal('all')),
    },
    allowedRoles: ['admin', 'sdr'],
  }
)

export const getTeamPerformance = withQuerySecurity(
  async (ctx, args: {
    period: '7d' | '30d' | '90d' | 'year'
  }) => {
    // Metric: "Conversions in the selected period" based on lead.updatedAt for 'fechado_ganho' leads.
    const periodDays = { '7d': 7, '30d': 30, '90d': 90, 'year': 365 }
    const days = periodDays[args.period]
    const startDate = Date.now() - days * 24 * 60 * 60 * 1000

    const leads = await ctx.db
      .query('leads')
      .withIndex('by_stage', (q) => q.eq('stage', 'fechado_ganho'))
      .collect()

    // Ensure we only count leads updated to won within the period
    const leadsInPeriod = leads.filter((l) => l.updatedAt >= startDate)

    // Group by assignedTo
    const performance = new Map<string, number>()
    for (const lead of leadsInPeriod) {
      if (lead.assignedTo) {
        performance.set(lead.assignedTo, (performance.get(lead.assignedTo) || 0) + 1)
      }
    }

    const users = await ctx.db.query('users').collect()

    const result = users.map((u) => ({
      _id: u._id,
      name: u.name,
      role: u.role,
      metric: performance.get(u._id) || 0,
      metricLabel: 'Conversões',
      period: args.period,
    }))

    return result.sort((a, b) => b.metric - a.metric).slice(0, 5)
  },
  {
    validationSchema: {
      period: v.union(v.literal('7d'), v.literal('30d'), v.literal('90d'), v.literal('year')),
    },
    allowedRoles: ['admin'],
  }
)
