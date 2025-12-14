# Common Development Patterns

## Adding New CRM Features

### Lead Management
```typescript
// 1. Add to schema (convex/schema.ts)
leads: defineTable({
  // ...existing fields
  newField: v.string(),
}).index('by_newField', ['newField'])

// 2. Create mutation (convex/leads.ts)
export const updateLeadField = mutation({
  args: { leadId: v.id('leads'), value: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.leadId, { newField: args.value })
  }
})

// 3. Use in component
const updateField = useMutation(api.leads.updateLeadField)
```

### Pipeline Stages
Always update both:
1. `convex/schema.ts` - union literal for stage
2. Component using stages (e.g., `PipelineKanban.tsx`)

## Adding Chat Features

### New Message Type
```typescript
// 1. Update schema
messages: defineTable({
  // ...existing
  contentType: v.union(
    v.literal('text'),
    v.literal('image'),
    v.literal('audio'),
    v.literal('document'),
    v.literal('template'),
    v.literal('new_type')  // Add here
  )
})

// 2. Update component (MessageBubble.tsx)
{message.contentType === 'new_type' && (
  <NewTypeComponent content={message.content} />
)}
```

### Template Messages
```typescript
// 1. Create in convex/messageTemplates.ts
export const createTemplate = mutation({
  args: { 
    name: v.string(),
    category: v.string(),
    content: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('messageTemplates', args)
  }
})

// 2. Use in TemplatePicker component
const templates = useQuery(api.messageTemplates.getByCategory)
```

## Student Management

### Enrollment Tracking
```typescript
// 1. Schema
enrollments: defineTable({
  studentId: v.id('students'),
  product: v.string(),
  status: v.union(
    v.literal('ativo'),
    v.literal('concluido'),
    v.literal('cancelado')
  ),
  progress: v.optional(v.number()), // 0-100
})

// 2. Component pattern
const enrollments = useQuery(api.enrollments.getByStudent, { studentId })
```

### Risk Indicators
```typescript
// Update student with churn risk
const updateChurnRisk = useMutation(api.students.updateChurnRisk)

// Trigger based on:
// - Payment delays
// - Low engagement
// - Support tickets
```

## Dashboard Metrics

### Adding New Metric Card
```typescript
// 1. Create StatsCard component if needed
<StatsCard
  title="New Metric"
  value={metricValue}
  icon={NewIcon}
  trend={{ value: 12, isPositive: true }}
/>

// 2. Calculate in convex/stats.ts
export const getNewMetric = query({
  handler: async (ctx) => {
    // Calculate metric
    return result
  }
})
```

### Chart Data
```typescript
// Use recharts for visualizations
import { AreaChart, Area } from 'recharts'

// Data format
const chartData = [
  { name: 'Jan', value1: 40, value2: 24 },
  // ...more data
]
```

## Authentication Patterns

### Role-Based Access
```typescript
// Use Clerk hooks
import { useAuth } from '@clerk/clerk-react'

function Component() {
  const { has } = useAuth()
  
  if (!has('role:admin')) {
    return <AccessDenied />
  }
  
  return <AdminContent />
}
```

### Protected Routes
```typescript
// Use TanStack Router's beforeLoad
export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context }) => {
    if (!context.userId) {
      throw redirect({ to: '/sign-in' })
    }
  },
  component: AdminPage,
})
```

## Form Patterns

### with react-hook-form + zod
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: '', email: '' }
})

// Submit
const onSubmit = useMutation(api.leads.create)

<form onSubmit={form.handleSubmit(onSubmit)}>
  <Input {...form.register('name')} />
  <Button type="submit">Save</Button>
</form>
```

## UI Patterns

### shadcn Component Customization
```typescript
// Extend with className
<Button className="bg-us-purple hover:bg-us-purple-dark">
  Custom Button
</Button>

// Use cn() utility for conditional classes
const buttonClass = cn(
  'base-class',
  isActive && 'active-class',
  variant === 'danger' && 'danger-class'
)
```

### Loading States
```typescript
// Use Skeleton components
{isLoading ? (
  <Skeleton className="h-20 w-full" />
) : (
  <RealContent />
)}
```

## Testing Patterns

### Vitest with React
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MyComponent } from '@/components/my-component'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Mock Convex
```typescript
import { convexTest } from 'convex/test'
import { api } from '../convex/_generated/api'

test('convex function', async () => {
  const { ctx } = convexTest()
  const result = await api.my.function(ctx, { arg: 'value' })
  expect(result).toBe(expected)
})
```

## Deployment Patterns

### Railway (Frontend)
1. Push to `main` branch
2. Automatic deployment triggered
3. Check logs in Railway dashboard

### Convex (Backend)
```bash
# Deploy changes
bun run deploy:convex

# Check deployment status
bunx convex dashboard
```

### Environment Variables
Required in `.env.local`:
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_CONVEX_URL`

## Common Gotchas

1. **Always use `bun`** not npm
2. **Check Biome errors** before committing
3. **Run `bun run build`** to verify types
4. **Use proper imports** (`@/` alias)
5. **Handle loading states** for async operations
6. **Test on mobile** (responsive design)
7. **Add indexes** to Convex schema for performance