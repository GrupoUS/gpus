# Spec Simplificado: Calendário Semanal com Sidebar Existente

## 🎯 Objetivo Claro

Implementar APENAS a visualização semanal do calendário com grid de horas, usando a sidebar que JÁ EXISTE no projeto.

## ✅ O Que MANTER (Não Mexer)

- ✅ Sidebar existente em `__root.tsx` (com links Dashboard, Saldo, Calendário, etc.)
- ✅ Layout geral da aplicação
- ✅ CalendarProvider já integrado no root
- ✅ Link "Calendário" na sidebar já criado

## 🔧 O Que IMPLEMENTAR (Foco Total)

### 1. EventCalendar Component (UI Base)

**Criar:** `src/components/ui/event-calendar/`

**Arquivos mínimos necessários:**

```
src/components/ui/event-calendar/
├── index.tsx              # Componente principal exportado
├── event-calendar.tsx     # Implementação do calendário semanal
├── week-view.tsx          # Grid de 7 colunas (dias) + horas
├── time-grid.tsx          # Grid de horas (8AM-7PM)
├── event-card.tsx         # Card de evento drag-and-drop
└── types.ts               # Tipos (CalendarEvent, EventColor, etc.)
```

**Funcionalidades:**
- Visualização semanal (7 colunas para dias da semana)
- Grid de horas verticais (8 AM - 7 PM)
- Eventos posicionados por horário
- Drag-and-drop de eventos (usando @dnd-kit já instalado)
- Header com: data atual, botão "Today", botão "New Event"

### 2. Modificar FinancialCalendar

**Arquivo:** `src/components/calendar/financial-calendar.tsx`

**ANTES (atual - calendário mensal):**
```tsx
export function FinancialCalendar() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <Card>
        <Calendar mode="single" .../> {/* <- react-day-picker mensal */}
      </Card>
      <Card>Lista de eventos</Card>
    </div>
  )
}
```

**DEPOIS (calendário semanal):**
```tsx
import { EventCalendar } from '@/components/ui/event-calendar'

export function FinancialCalendar() {
  const { events, addEvent, updateEvent, deleteEvent } = useCalendar()
  
  return (
    <div className="h-full flex flex-col">
      <EventCalendar
        events={events}
        initialView="week"
        onEventAdd={addEvent}
        onEventUpdate={updateEvent}
        onEventDelete={deleteEvent}
      />
    </div>
  )
}
```

### 3. Ajustar Rota

**Arquivo:** `src/routes/calendario.tsx`

**Remover containers/padding:**
```tsx
function CalendarioPage() {
  return (
    <div className="h-full"> {/* <- Fullheight sem container */}
      <FinancialCalendar />
    </div>
  )
}
```

## 📦 Estrutura do EventCalendar

### Componente Principal
```tsx
// src/components/ui/event-calendar/event-calendar.tsx

interface EventCalendarProps {
  events: CalendarEvent[]
  initialView?: 'week' | 'month' | 'day'
  onEventAdd?: (event: CalendarEvent) => void
  onEventUpdate?: (event: CalendarEvent) => void
  onEventDelete?: (eventId: string) => void
}

export function EventCalendar({
  events,
  initialView = 'week',
  onEventAdd,
  onEventUpdate,
  onEventDelete
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState(initialView)
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <CalendarHeader 
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        view={view}
        onViewChange={setView}
        onNewEvent={() => {/* dialog */}}
      />
      
      {/* Week View */}
      {view === 'week' && (
        <WeekView
          events={events}
          weekStart={currentDate}
          onEventUpdate={onEventUpdate}
          onEventDelete={onEventDelete}
        />
      )}
    </div>
  )
}
```

### Week View com Grid
```tsx
// src/components/ui/event-calendar/week-view.tsx

export function WeekView({ events, weekStart, onEventUpdate }: WeekViewProps) {
  const weekDays = getWeekDays(weekStart) // [Sun, Mon, Tue, ..., Sat]
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19] // 8AM-7PM
  
  return (
    <div className="flex-1 overflow-auto">
      {/* Header com dias da semana */}
      <div className="grid grid-cols-8 border-b sticky top-0 bg-background">
        <div className="col-span-1 p-2">GMT-3</div>
        {weekDays.map(day => (
          <div key={day} className="col-span-1 p-2 text-center">
            {format(day, 'EEE dd')}
          </div>
        ))}
      </div>
      
      {/* Grid de horas */}
      <TimeGrid 
        hours={hours}
        weekDays={weekDays}
        events={events}
        onEventUpdate={onEventUpdate}
      />
    </div>
  )
}
```

### Time Grid
```tsx
// src/components/ui/event-calendar/time-grid.tsx

export function TimeGrid({ hours, weekDays, events }: TimeGridProps) {
  return (
    <div className="relative">
      {/* Grid de fundo */}
      {hours.map(hour => (
        <div key={hour} className="grid grid-cols-8 border-b" style={{ height: '60px' }}>
          {/* Coluna de hora */}
          <div className="col-span-1 p-2 text-sm text-muted-foreground">
            {hour}:00
          </div>
          
          {/* Colunas de dias */}
          {weekDays.map(day => (
            <div key={day.toString()} className="col-span-1 border-l" />
          ))}
        </div>
      ))}
      
      {/* Eventos posicionados absolutamente */}
      <div className="absolute inset-0 pointer-events-none">
        {events.map(event => (
          <EventCard
            key={event.id}
            event={event}
            style={calculateEventPosition(event)} // Calcula top, left, height
          />
        ))}
      </div>
    </div>
  )
}
```

### Event Card Drag-and-Drop
```tsx
// src/components/ui/event-calendar/event-card.tsx

import { useDraggable } from '@dnd-kit/core'

export function EventCard({ event, style }: EventCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
  })
  
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'absolute rounded-md p-2 text-sm cursor-move pointer-events-auto',
        `bg-${event.color}-500/20 border-${event.color}-500`
      )}
      style={{
        ...style,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
      }}
    >
      <div className="font-medium">{event.title}</div>
      <div className="text-xs">
        {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
      </div>
    </div>
  )
}
```

## 🎨 Layout Visual

```
┌─────────────────────────────────────────────────────────┐
│ SIDEBAR    │  CALENDÁRIO SEMANAL                        │
│ (existente)│  ┌─────────────────────────────────────┐   │
│            │  │ Oct 2025  [Today] [New Event] week │   │
│ Dashboard  │  ├─────────────────────────────────────┤   │
│ Saldo      │  │  GMT-3│ S5 │M6 │T7 │W8 │T9 │F10│S11│   │
│►Calendário │  ├───────┼───┼───┼───┼───┼───┼───┼───┤   │
│ Contas     │  │  8AM  │   │   │   │   │   │   │   │   │
│ PIX        │  │  9AM  │   │██ │   │   │   │   │   │   │
│ Transações │  │ 10AM  │   │   │   │██ │   │   │   │   │
│            │  │ 11AM  │   │   │   │   │   │   │   │   │
│ [User]     │  │  ...  │   │   │   │   │   │   │   │   │
└────────────┴──┴───────┴───┴───┴───┴───┴───┴───┴───┘
```

## 📝 Plano de Implementação (Simplificado)

### Phase 1: Estrutura Base (1-2h)
1. Criar pasta `src/components/ui/event-calendar/`
2. Criar `types.ts` com interfaces
3. Criar `event-calendar.tsx` (componente raiz)
4. Criar `calendar-header.tsx` (header com botões)

### Phase 2: Week View (2-3h)
5. Criar `week-view.tsx` (grid 7 dias)
6. Criar `time-grid.tsx` (grid de horas)
7. Implementar lógica de posicionamento de eventos

### Phase 3: Interatividade (1-2h)
8. Criar `event-card.tsx` com drag-and-drop
9. Integrar @dnd-kit para arrastar eventos
10. Callbacks onEventUpdate quando soltar

### Phase 4: Integração (30min)
11. Modificar `financial-calendar.tsx` para usar EventCalendar
12. Ajustar `calendario.tsx` para fullheight
13. Testar navegação

## ✅ Checklist de Validação

- [ ] Visualização semanal com 7 colunas (dias)
- [ ] Grid de horas 8 AM - 7 PM
- [ ] Eventos posicionados corretamente por horário
- [ ] Header com data formatada
- [ ] Botão "Today" funciona
- [ ] Eventos podem ser arrastados
- [ ] Design responsivo
- [ ] Cores dos eventos corretas (emerald, rose, orange, blue, violet)
- [ ] Sidebar existente continua funcionando
- [ ] Navegação entre páginas funciona

## 🚫 O Que NÃO Fazer

- ❌ NÃO criar nova sidebar
- ❌ NÃO copiar AppSidebar do experiment-06
- ❌ NÃO mexer em `__root.tsx`
- ❌ NÃO criar SidebarCalendar (mini calendário)
- ❌ NÃO criar filtros de categorias na sidebar
- ❌ NÃO modificar layout global

## 📦 Arquivos a Modificar/Criar

### CRIAR (Novo)
- `src/components/ui/event-calendar/index.tsx`
- `src/components/ui/event-calendar/event-calendar.tsx`
- `src/components/ui/event-calendar/week-view.tsx`
- `src/components/ui/event-calendar/time-grid.tsx`
- `src/components/ui/event-calendar/event-card.tsx`
- `src/components/ui/event-calendar/calendar-header.tsx`
- `src/components/ui/event-calendar/types.ts`

### MODIFICAR (Existente)
- `src/components/calendar/financial-calendar.tsx` (usar EventCalendar)
- `src/routes/calendario.tsx` (ajustar container)

### NÃO MEXER
- `src/routes/__root.tsx` (sidebar existente OK)
- `src/components/ui/sidebar.tsx` (componente base OK)
- `src/components/calendar/calendar-context.tsx` (já correto)

---

**Estimativa:** 4-5 horas
**Complexidade:** Média (foco em EventCalendar)
**Arquivos novos:** 7
**Arquivos modificados:** 2
**Prioridade:** Alta