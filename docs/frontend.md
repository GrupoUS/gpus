# 🚀 REPLIT AGENT PROMPT: Portal Grupo US

## CONTEXTO DO PROJETO

Você vai criar o **Portal Grupo US**, uma plataforma de gerenciamento para um ecossistema educacional de Saúde Estética. O portal inclui CRM, gestão de alunos, chat integrado com WhatsApp e dashboards.

**Referências obrigatórias:**
- **Tema visual:** https://tweakcn.com/themes/cmj4lb6u1000304jxaz15frkc (tema escuro elegante)
- **Componentes base:** https://github.com/GrupoUS/aegiswallet (copiar estrutura de componentes UI)
- **Documentação shadcn:** https://ui.shadcn.com

---

## STACK TÉCNICA (OBRIGATÓRIA)

```json
{
  "runtime": "bun",
  "framework": "react",
  "bundler": "vite",
  "router": "@tanstack/react-router",
  "ui": "shadcn/ui",
  "styling": "tailwindcss v4",
  "auth": "@clerk/clerk-react",
  "backend": "convex",
  "forms": "react-hook-form + zod",
  "icons": "lucide-react",
  "charts": "recharts",
  "drag-drop": "@dnd-kit/core"
}
```

---

## CONFIGURAÇÃO INICIAL

### 1. Criar projeto com Vite + React + TypeScript

```bash
bun create vite grupo-us-portal --template react-ts
cd grupo-us-portal
bun install
```

### 2. Instalar dependências core

```bash
# UI e Styling
bun add tailwindcss @tailwindcss/vite postcss autoprefixer
bun add class-variance-authority clsx tailwind-merge
bun add lucide-react

# Routing
bun add @tanstack/react-router @tanstack/router-devtools

# Auth
bun add @clerk/clerk-react

# Backend
bun add convex

# Forms e Validação
bun add react-hook-form @hookform/resolvers zod

# Utilitários
bun add date-fns recharts @dnd-kit/core @dnd-kit/sortable
bun add sonner cmdk vaul

# Dev
bun add -D @types/node
```

### 3. Inicializar shadcn/ui

```bash
bunx shadcn@latest init
```

Quando perguntado, usar estas configurações:
- Style: New York
- Base color: Zinc
- CSS variables: Yes
- Tailwind CSS: Yes
- Components directory: src/components
- Utils directory: src/lib/utils

### 4. Adicionar componentes shadcn necessários

```bash
bunx shadcn@latest add button card input label select textarea
bunx shadcn@latest add dialog sheet dropdown-menu popover
bunx shadcn@latest add table tabs avatar badge
bunx shadcn@latest add form toast sonner
bunx shadcn@latest add sidebar navigation-menu breadcrumb
bunx shadcn@latest add calendar command scroll-area separator
bunx shadcn@latest add skeleton alert progress
```

---

## TEMA PERSONALIZADO (GRUPO US)

### globals.css

Substituir o conteúdo do `src/index.css` por:

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 262 83% 58%;
    --primary-foreground: 0 0% 100%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 262 83% 58%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 262 83% 58%;
    --radius: 0.75rem;
    
    /* Cores Grupo US */
    --us-purple: 262 83% 58%;
    --us-purple-light: 262 83% 68%;
    --us-purple-dark: 262 83% 48%;
    --us-gold: 45 93% 47%;
    --us-success: 142 76% 36%;
    --us-warning: 38 92% 50%;
    --us-info: 199 89% 48%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 262 83% 58%;
    --primary-foreground: 0 0% 100%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 262 83% 58%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 262 83% 58%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Scrollbar personalizada */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: hsl(var(--muted));
  border-radius: 4px;
}
::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
```

---

## ESTRUTURA DE PASTAS

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── layout/
│   │   ├── app-sidebar.tsx    # Sidebar principal
│   │   ├── header.tsx         # Header com user menu
│   │   ├── main-layout.tsx    # Layout wrapper
│   │   └── breadcrumbs.tsx
│   ├── crm/
│   │   ├── lead-card.tsx      # Card do lead no Kanban
│   │   ├── lead-form.tsx      # Formulário de lead
│   │   ├── pipeline-kanban.tsx # Kanban board
│   │   ├── lead-filters.tsx   # Filtros do CRM
│   │   └── lead-detail.tsx    # Drawer de detalhes
│   ├── chat/
│   │   ├── conversation-list.tsx
│   │   ├── chat-window.tsx
│   │   ├── message-bubble.tsx
│   │   ├── template-picker.tsx
│   │   └── chat-input.tsx
│   ├── students/
│   │   ├── student-card.tsx
│   │   ├── student-form.tsx
│   │   ├── enrollment-card.tsx
│   │   └── student-timeline.tsx
│   └── dashboard/
│       ├── stats-card.tsx
│       ├── conversion-chart.tsx
│       ├── leads-by-source.tsx
│       └── team-performance.tsx
├── routes/
│   ├── __root.tsx             # Root layout
│   ├── index.tsx              # Dashboard
│   ├── crm/
│   │   ├── index.tsx          # CRM Kanban
│   │   └── $leadId.tsx        # Lead detail
│   ├── chat/
│   │   ├── index.tsx          # Chat inbox
│   │   └── $conversationId.tsx
│   ├── students/
│   │   ├── index.tsx          # Students list
│   │   └── $studentId.tsx
│   └── settings/
│       └── index.tsx
├── lib/
│   ├── utils.ts               # cn() e helpers
│   ├── constants.ts           # Enums e constantes
│   └── validations.ts         # Schemas Zod
├── hooks/
│   ├── use-leads.ts
│   ├── use-conversations.ts
│   └── use-students.ts
├── convex/
│   ├── schema.ts              # Definição de tabelas
│   ├── leads.ts               # Mutations/queries leads
│   ├── conversations.ts
│   ├── students.ts
│   └── _generated/
├── App.tsx
├── main.tsx
└── routeTree.gen.ts
```

---

## COMPONENTES PRINCIPAIS

### 1. Layout Principal (src/components/layout/main-layout.tsx)

```tsx
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumbs } from "./breadcrumbs"

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumbs />
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### 2. Sidebar (src/components/layout/app-sidebar.tsx)

```tsx
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "@tanstack/react-router"
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  GraduationCap,
  Settings,
  Kanban,
  BarChart3,
} from "lucide-react"
import { UserButton } from "@clerk/clerk-react"

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "CRM", icon: Kanban, href: "/crm" },
  { title: "Chat", icon: MessageSquare, href: "/chat" },
  { title: "Alunos", icon: GraduationCap, href: "/students" },
  { title: "Relatórios", icon: BarChart3, href: "/reports" },
  { title: "Configurações", icon: Settings, href: "/settings" },
]

export function AppSidebar() {
  const location = useLocation()
  
  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">US</span>
          </div>
          <div>
            <p className="font-semibold text-sm">Grupo US</p>
            <p className="text-xs text-muted-foreground">Portal de Gestão</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.href}
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/sign-in" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Usuário</p>
            <p className="text-xs text-muted-foreground truncate">SDR</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
```

### 3. Pipeline Kanban (src/components/crm/pipeline-kanban.tsx)

```tsx
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LeadCard } from "./lead-card"
import { ScrollArea } from "@/components/ui/scroll-area"

const stages = [
  { id: "novo", label: "Novo", color: "bg-blue-500" },
  { id: "primeiro_contato", label: "Primeiro Contato", color: "bg-yellow-500" },
  { id: "qualificado", label: "Qualificado", color: "bg-purple-500" },
  { id: "proposta", label: "Proposta", color: "bg-orange-500" },
  { id: "negociacao", label: "Negociação", color: "bg-pink-500" },
  { id: "fechado_ganho", label: "Fechado ✓", color: "bg-green-500" },
]

interface Lead {
  _id: string
  name: string
  phone: string
  profession?: string
  interestedProduct?: string
  temperature: "frio" | "morno" | "quente"
  stage: string
  lastContactAt?: number
}

interface PipelineKanbanProps {
  leads: Lead[]
  onDragEnd: (leadId: string, newStage: string) => void
}

export function PipelineKanban({ leads, onDragEnd }: PipelineKanbanProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      onDragEnd(active.id as string, over.id as string)
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.id)
          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-[300px]"
            >
              <Card className="h-[calc(100vh-200px)]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                      {stage.label}
                    </CardTitle>
                    <Badge variant="secondary">{stageLeads.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100%-60px)]">
                    <div className="space-y-3 pr-4">
                      {stageLeads.map((lead) => (
                        <LeadCard key={lead._id} lead={lead} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </DndContext>
  )
}
```

### 4. Lead Card (src/components/crm/lead-card.tsx)

```tsx
import { useDraggable } from "@dnd-kit/core"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, MessageSquare, Flame, Thermometer, Snowflake } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface LeadCardProps {
  lead: {
    _id: string
    name: string
    phone: string
    profession?: string
    interestedProduct?: string
    temperature: "frio" | "morno" | "quente"
    lastContactAt?: number
  }
}

const temperatureIcons = {
  frio: { icon: Snowflake, color: "text-blue-500" },
  morno: { icon: Thermometer, color: "text-yellow-500" },
  quente: { icon: Flame, color: "text-red-500" },
}

const productLabels: Record<string, string> = {
  trintae3: "TRINTAE3",
  otb: "OTB MBA",
  black_neon: "Black NEON",
  comunidade: "Comunidade",
  auriculo: "Aurículo",
  na_mesa_certa: "Na Mesa Certa",
}

export function LeadCard({ lead }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead._id,
  })

  const TempIcon = temperatureIcons[lead.temperature].icon

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{lead.name}</p>
            <TempIcon
              className={`h-3.5 w-3.5 flex-shrink-0 ${temperatureIcons[lead.temperature].color}`}
            />
          </div>
          {lead.profession && (
            <p className="text-xs text-muted-foreground truncate">
              {lead.profession}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {lead.interestedProduct && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {productLabels[lead.interestedProduct] || lead.interestedProduct}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-muted-foreground">
            <button className="hover:text-primary transition-colors">
              <Phone className="h-3.5 w-3.5" />
            </button>
            <button className="hover:text-primary transition-colors">
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            {lead.lastContactAt && (
              <span className="text-[10px] ml-auto">
                {formatDistanceToNow(lead.lastContactAt, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
```

### 5. Stats Card (src/components/dashboard/stats-card.tsx)

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                trend.isPositive ? "text-green-500" : "text-red-500"
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {trend.value}%
            </span>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## PÁGINAS PRINCIPAIS

### Dashboard (src/routes/index.tsx)

```tsx
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

const chartData = [
  { name: "Jan", leads: 40, conversoes: 24 },
  { name: "Fev", leads: 30, conversoes: 13 },
  { name: "Mar", leads: 45, conversoes: 28 },
  { name: "Abr", leads: 50, conversoes: 35 },
  { name: "Mai", leads: 49, conversoes: 30 },
  { name: "Jun", leads: 60, conversoes: 42 },
]

export default function DashboardPage() {
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
```

---

## CONVEX SETUP

### Schema (convex/schema.ts)

```typescript
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  leads: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    source: v.string(),
    profession: v.optional(v.string()),
    hasClinic: v.optional(v.boolean()),
    interestedProduct: v.optional(v.string()),
    mainPain: v.optional(v.string()),
    stage: v.string(),
    temperature: v.string(),
    assignedTo: v.optional(v.id("users")),
    lastContactAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stage", ["stage"])
    .index("by_phone", ["phone"]),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  conversations: defineTable({
    leadId: v.optional(v.id("leads")),
    channel: v.string(),
    status: v.string(),
    department: v.string(),
    assignedTo: v.optional(v.id("users")),
    lastMessageAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_lead", ["leadId"])
    .index("by_status", ["status"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    sender: v.string(),
    content: v.string(),
    contentType: v.string(),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),
})
```

---

## INSTRUÇÕES FINAIS

1. **Tema escuro por padrão**: Adicionar `className="dark"` no `<html>` ou usar `next-themes`

2. **Responsividade**: Todas as telas devem funcionar em mobile (sidebar colapsável)

3. **Loading states**: Usar `<Skeleton />` do shadcn em todos os carregamentos

4. **Toasts**: Usar `sonner` para notificações

5. **Forms**: Sempre validar com Zod + react-hook-form

6. **Real-time**: Usar `useQuery` do Convex para dados em tempo real

7. **Acessibilidade**: Manter labels em todos os inputs, usar aria-labels

---

## CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Setup inicial (Vite + dependências)
- [ ] Configurar Tailwind + tema
- [ ] Instalar componentes shadcn
- [ ] Configurar TanStack Router
- [ ] Configurar Clerk auth
- [ ] Configurar Convex
- [ ] Layout com Sidebar
- [ ] Dashboard com métricas
- [ ] CRM Kanban (drag-and-drop)
- [ ] Chat inbox
- [ ] Lista de alunos
- [ ] Formulários de CRUD
- [ ] Responsividade mobile
- [ ] Dark mode

---

**Pronto para começar! Execute as instruções na ordem e consulte este documento sempre que precisar.**
