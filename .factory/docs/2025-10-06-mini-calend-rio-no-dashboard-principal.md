# Spec Complementar: Mini Calendário no Dashboard

## Objetivo
Adicionar um mini calendário widget no dashboard principal (`/dashboard`) que mostre eventos financeiros próximos, seja interativo e sincronize com o calendário completo.

## 1. Componente MiniCalendar Widget

### 1.1 Criação do Componente
**Arquivo:** `src/components/calendar/mini-calendar-widget.tsx`

**Funcionalidades:**
- Exibe calendário mensal compacto
- Marca dias com eventos financeiros (bolinhas coloridas)
- Lista próximos 3-5 eventos abaixo do calendário
- Click em data navega para calendário completo naquela data
- Atualiza em tempo real com CalendarContext

**Visual:**
```
┌─────────────────────────┐
│  Janeiro 2025      [>]  │
├─────────────────────────┤
│ D  S  T  Q  Q  S  S    │
│          1• 2  3  4  5  │
│ 6  7  8  9• 10 11 12   │
│ 13 14•15 16 17 18 19   │
│ ...                    │
├─────────────────────────┤
│ Próximos Eventos       │
│ • 15 Jan - Conta ⚡    │
│   R$ 245,67            │
│ • 20 Jan - Salário 💰  │
│   R$ 3.500,00          │
│ • 25 Jan - Cartão 💳   │
│   R$ 1.250,45          │
├─────────────────────────┤
│ [Ver Calendário →]     │
└─────────────────────────┘
```

### 1.2 Estrutura do Componente
```tsx
export function MiniCalendarWidget() {
  const { events, currentDate } = useCalendarContext()
  const navigate = useNavigate()
  
  // Filtrar próximos eventos
  const upcomingEvents = events
    .filter(e => isFuture(e.start))
    .sort((a, b) => compareAsc(a.start, b.start))
    .slice(0, 5)
  
  // Dias com eventos no mês atual
  const eventsInMonth = getEventsForMonth(events, currentDate)
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>Calendário Financeiro</CardTitle>
          <Button variant="ghost" size="sm">
            <ChevronRight />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mini calendário visual */}
        <CompactCalendar 
          events={eventsInMonth}
          selectedDate={currentDate}
          onDateClick={(date) => navigate(`/calendario?date=${date}`)}
        />
        
        {/* Lista de próximos eventos */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold">Próximos</h4>
          {upcomingEvents.map(event => (
            <EventPreviewItem key={event.id} event={event} />
          ))}
        </div>
        
        {/* Link para calendário completo */}
        <Link to="/calendario">
          <Button variant="outline" className="w-full mt-4">
            Ver Calendário Completo
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
```

## 2. Subcomponentes

### 2.1 CompactCalendar
**Arquivo:** `src/components/calendar/compact-calendar.tsx`
- Calendário de um mês em formato compacto
- Usa `react-day-picker` ou componente próprio
- Indicadores visuais:
  - Bolinhas coloridas nos dias com eventos
  - Dia atual destacado
  - Hover mostra preview rápido

### 2.2 EventPreviewItem
**Arquivo:** `src/components/calendar/event-preview-item.tsx`
- Item de lista compacto para evento
- Mostra: data, ícone, título, valor
- Click abre detalhes ou navega para calendário

```tsx
<div className="flex items-center gap-2 p-2 rounded hover:bg-accent">
  <div className="text-2xl">{event.icon}</div>
  <div className="flex-1">
    <p className="text-sm font-medium">{event.title}</p>
    <p className="text-xs text-muted-foreground">
      {format(event.start, 'dd MMM')}
    </p>
  </div>
  <FinancialAmount amount={event.amount} size="sm" />
</div>
```

## 3. Integração no Dashboard

### 3.1 Modificação do Dashboard
**Arquivo:** `src/routes/dashboard.tsx`

**Novo Layout:**
```tsx
{/* Bento Grid - Insights (mantém) */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {bentoItems.map(item => <BentoCard key={item.id} item={item} />)}
</div>

{/* Nova seção com 3 colunas */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Coluna 1: Transações Recentes */}
  <Card>
    <CardHeader>
      <CardTitle>Transações Recentes</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Conteúdo existente */}
    </CardContent>
  </Card>
  
  {/* Coluna 2: NOVO - Mini Calendário */}
  <MiniCalendarWidget />
  
  {/* Coluna 3: Resumo Mensal */}
  <Card>
    <CardHeader>
      <CardTitle>Resumo Mensal</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Conteúdo existente */}
    </CardContent>
  </Card>
</div>
```

## 4. Context Compartilhado

### 4.1 CalendarProvider no Root
**Arquivo:** Atualizar `src/routes/__root.tsx`

```tsx
import { CalendarProvider } from '@/components/calendar/calendar-context'

function RootComponent() {
  return (
    <TRPCProvider>
      <CalendarProvider>
        {/* Layout existente */}
      </CalendarProvider>
    </TRPCProvider>
  )
}
```

Isso permite que:
- Dashboard acesse eventos do calendário
- Calendário completo compartilhe estado
- Mudanças em um refletem no outro

## 5. Funcionalidades Interativas

### 5.1 Atualização em Tempo Real
- Hook `useCalendarContext()` em ambos componentes
- Quando evento é adicionado/modificado no calendário completo, dashboard atualiza
- Quando data é selecionada no mini widget, calendário completo muda

### 5.2 Navegação Integrada
```tsx
// No mini calendário widget
const handleDateClick = (date: Date) => {
  navigate({
    to: '/calendario',
    search: { date: format(date, 'yyyy-MM-dd') }
  })
}

// Na página do calendário
const searchParams = Route.useSearch()
useEffect(() => {
  if (searchParams.date) {
    setCurrentDate(new Date(searchParams.date))
  }
}, [searchParams.date])
```

### 5.3 Indicadores Visuais
- Dias com eventos: bolinhas coloridas por tipo
  - 🔴 Vermelho: contas a pagar
  - 🟢 Verde: receitas
  - 🟡 Amarelo: agendamentos
- Dia atual: borda destacada
- Hover: tooltip com resumo rápido

## 6. Dados Mockados para Dashboard

```typescript
// Adicionar no CalendarContext
const mockFinancialEvents: FinancialEvent[] = [
  {
    id: '1',
    title: 'Energia Elétrica',
    start: addDays(new Date(), 3),
    end: addDays(new Date(), 3),
    type: 'bill',
    amount: -245.67,
    color: 'rose',
    icon: '⚡',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Salário',
    start: addDays(new Date(), 8),
    end: addDays(new Date(), 8),
    type: 'income',
    amount: 3500.00,
    color: 'emerald',
    icon: '💰',
    status: 'scheduled',
  },
  // ... mais eventos
]
```

## 7. Responsividade

### Mobile (< 768px)
- Mini calendário ocupa largura total
- Mostra apenas 3 próximos eventos
- Calendário compacto com fonte menor

### Tablet (768px - 1024px)
- Grid de 2 colunas
- Mini calendário na 2ª linha

### Desktop (> 1024px)
- Grid de 3 colunas como especificado
- Todos elementos visíveis

## 8. Estilos e Tema

**Seguir padrão existente:**
- Usar `Card` do shadcn/ui
- Cores do tema para indicadores
- Gradientes do AegisWallet (primary → accent)
- Dark mode compatível

## 9. Fluxo de Implementação

1. **Criar CalendarContext** global (do spec anterior)
2. **Implementar CompactCalendar** component
3. **Criar EventPreviewItem** component
4. **Montar MiniCalendarWidget** integrando os subcomponentes
5. **Atualizar Dashboard** com novo layout de 3 colunas
6. **Adicionar CalendarProvider** no root
7. **Implementar navegação** entre mini e calendário completo
8. **Testar sincronização** de estado
9. **Ajustar responsividade**

## 10. Melhorias Futuras

- Arrastar eventos do mini calendário para reagendar
- Notificações de eventos próximos
- Filtros rápidos no mini widget
- Animações de transição
- Badge com contador de eventos do dia

## 11. Validação de Sucesso

- ✅ Mini calendário renderiza no dashboard
- ✅ Mostra eventos do mês atual com indicadores
- ✅ Lista próximos 3-5 eventos
- ✅ Click em data navega para calendário completo
- ✅ Estado sincronizado entre dashboard e calendário
- ✅ Atualização em tempo real funciona
- ✅ Responsivo em todos breakpoints
- ✅ Dark mode funciona corretamente

---

**Estimativa:** ~1-2 horas (adicional ao calendário principal)
**Prioridade:** Alta
**Dependência:** Requer implementação do calendário completo primeiro