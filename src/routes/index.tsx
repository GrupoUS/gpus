import { createFileRoute } from '@tanstack/react-router'
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, MessageSquare, TrendingUp } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

const chartData = [
  { name: "Jan", leads: 40, conversoes: 24 },
  { name: "Fev", leads: 30, conversoes: 13 },
  { name: "Mar", leads: 45, conversoes: 28 },
  { name: "Abr", leads: 50, conversoes: 35 },
  { name: "Mai", leads: 49, conversoes: 30 },
  { name: "Jun", leads: 60, conversoes: 42 },
]

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu negócio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Leads este mês"
          value="127"
          description="vs. mês anterior"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Taxa de Conversão"
          value="24.5%"
          description="vs. mês anterior"
          icon={TrendingUp}
          trend={{ value: 4.5, isPositive: true }}
        />
        <StatsCard
          title="Faturamento"
          value="R$ 245.000"
          description="vs. mês anterior"
          icon={DollarSign}
          trend={{ value: 18, isPositive: true }}
        />
        <StatsCard
          title="Mensagens"
          value="1.234"
          description="últimas 24h"
          icon={MessageSquare}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads vs Conversões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversoes"
                    stackId="2"
                    stroke="hsl(142 76% 36%)"
                    fill="hsl(142 76% 36% / 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "TRINTAE3", value: 45, color: "bg-purple-500" },
                { name: "Black NEON", value: 28, color: "bg-pink-500" },
                { name: "Comunidade US", value: 32, color: "bg-blue-500" },
                { name: "OTB MBA", value: 12, color: "bg-amber-500" },
                { name: "Aurículo", value: 10, color: "bg-green-500" },
              ].map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${(item.value / 50) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
