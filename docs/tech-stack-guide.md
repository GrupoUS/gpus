# Tech Stack Completa: Bun + Convex + TanStack Router + shadcn/ui + Clerk

Guia definitivo para criar SaaS e micro-SaaS com a stack mais eficiente de 2025.

---

## Visão Geral da Stack

| Camada | Tecnologia | Função |
|--------|------------|--------|
| Runtime | Bun | Package manager + runtime |
| Backend | Convex | Database + API + Real-time |
| Frontend | React + Vite | Interface |
| Routing | TanStack Router | Navegação type-safe |
| Styling | Tailwind CSS v4 | Utility classes |
| Componentes | shadcn/ui | UI components |
| Auth | Clerk | Autenticação |
| Deploy | Railway | Hosting |

---

## Pré-requisitos

```bash
# Instalar Bun (se ainda não tiver)
curl -fsSL https://bun.sh/install | bash

# Verificar instalação
bun --version  # Deve mostrar 1.1+
```

---

## Parte 1: Criar o Projeto Base

### 1.1 Inicializar com Vite + React + TypeScript

```bash
# Criar projeto
bun create vite meu-saas --template react-ts

# Entrar na pasta
cd meu-saas

# Instalar dependências
bun install
```

### 1.2 Estrutura inicial de pastas

```
meu-saas/
├── src/
│   ├── components/      # Componentes React
│   │   └── ui/          # shadcn components
│   ├── routes/          # TanStack Router pages
│   ├── lib/             # Utilitários
│   ├── hooks/           # Custom hooks
│   ├── main.tsx
│   └── App.tsx
├── convex/              # Backend Convex
│   ├── _generated/
│   ├── schema.ts
│   └── functions/
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## Parte 2: Configurar Tailwind CSS v4

### 2.1 Instalar Tailwind

```bash
bun add -D tailwindcss @tailwindcss/vite
```

### 2.2 Configurar Vite

Edite `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 2.3 Configurar CSS

Substitua o conteúdo de `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", sans-serif;
  --radius-lg: 0.5rem;
  --radius-md: calc(var(--radius-lg) - 2px);
  --radius-sm: calc(var(--radius-lg) - 4px);
}
```

### 2.4 Atualizar tsconfig.json

Adicione os paths:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

---

## Parte 3: Configurar shadcn/ui

### 3.1 Inicializar shadcn

```bash
bunx shadcn@latest init
```

Responda as perguntas:
- Style: **New York**
- Base color: **Zinc** (ou sua preferência)
- CSS variables: **yes**

### 3.2 Adicionar componentes essenciais

```bash
# Componentes base
bunx shadcn@latest add button
bunx shadcn@latest add input
bunx shadcn@latest add card
bunx shadcn@latest add form
bunx shadcn@latest add toast
bunx shadcn@latest add dropdown-menu
bunx shadcn@latest add dialog
bunx shadcn@latest add avatar
bunx shadcn@latest add skeleton
```

---

## Parte 4: Configurar TanStack Router

### 4.1 Instalar dependências

```bash
bun add @tanstack/react-router
bun add -D @tanstack/router-plugin @tanstack/router-devtools
```

### 4.2 Configurar Vite para TanStack Router

Atualize `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 4.3 Criar estrutura de rotas

Crie `src/routes/__root.tsx`:

```tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <header className="border-b">
        <nav className="container mx-auto flex items-center gap-4 p-4">
          <Link to="/" className="font-bold">
            Meu SaaS
          </Link>
          <Link to="/dashboard" className="text-sm">
            Dashboard
          </Link>
        </nav>
      </header>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
})
```

Crie `src/routes/index.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-4xl font-bold">Bem-vindo ao Meu SaaS</h1>
      <p className="text-muted-foreground">
        Stack moderna com Bun + Convex + TanStack Router
      </p>
      <Button size="lg">Começar Agora</Button>
    </div>
  )
}
```

Crie `src/routes/dashboard.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Área protegida (requer autenticação)</p>
    </div>
  )
}
```

### 4.4 Configurar Router no main.tsx

Substitua `src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'

// Criar router
const router = createRouter({ routeTree })

// Type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
```

---

## Parte 5: Configurar Convex

### 5.1 Instalar Convex

```bash
bun add convex
```

### 5.2 Inicializar projeto Convex

```bash
bunx convex dev
```

Isso vai:
1. Criar conta/login no Convex
2. Criar projeto
3. Gerar pasta `convex/`
4. Iniciar dev server

### 5.3 Criar Schema do banco

Crie `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_clerk_id', ['clerkId']),

  projects: defineTable({
    userId: v.id('users'),
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),
})
```

### 5.4 Criar queries e mutations

Crie `convex/users.ts`:

```typescript
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first()
  },
})

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first()

    if (existingUser) return existingUser._id

    return await ctx.db.insert('users', {
      ...args,
      createdAt: Date.now(),
    })
  },
})
```

Crie `convex/projects.ts`:

```typescript
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getProjects = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('projects')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect()
  },
})

export const createProject = mutation({
  args: {
    userId: v.id('users'),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert('projects', {
      ...args,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updateProject = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args
    await ctx.db.patch(projectId, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const deleteProject = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.projectId)
  },
})
```

---

## Parte 6: Configurar Clerk

### 6.1 Criar conta e projeto no Clerk

1. Acesse https://clerk.com
2. Crie uma conta
3. Crie um novo projeto
4. Copie as chaves: `VITE_CLERK_PUBLISHABLE_KEY`

### 6.2 Instalar Clerk

```bash
bun add @clerk/clerk-react
```

### 6.3 Configurar variáveis de ambiente

Crie `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
VITE_CONVEX_URL=sua_url_convex_aqui
```

### 6.4 Configurar Clerk + Convex no app

Atualize `src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { routeTree } from './routeTree.gen'
import './index.css'

// Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

// Router
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Clerk publishable key
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <RouterProvider router={router} />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 6.5 Configurar Clerk no Convex

No dashboard do Clerk:
1. Vá em **JWT Templates**
2. Clique **New Template**
3. Selecione **Convex**
4. Copie o **Issuer URL**

Crie `convex/auth.config.ts`:

```typescript
export default {
  providers: [
    {
      domain: 'https://seu-issuer.clerk.accounts.dev', // Cole seu Issuer URL
      applicationID: 'convex',
    },
  ],
}
```

### 6.6 Criar componentes de autenticação

Crie `src/routes/sign-in.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/clerk-react'

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <SignIn routing="path" path="/sign-in" />
    </div>
  )
}
```

Crie `src/routes/sign-up.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '@clerk/clerk-react'

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <SignUp routing="path" path="/sign-up" />
    </div>
  )
}
```

### 6.7 Proteger rotas

Atualize `src/routes/__root.tsx`:

```tsx
import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import {
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <header className="border-b">
        <nav className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-bold text-xl">
              Meu SaaS
            </Link>
            <SignedIn>
              <Link
                to="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
            </SignedIn>
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <Link to="/sign-in">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button size="sm">Criar Conta</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </nav>
      </header>

      <main className="container mx-auto p-4">
        <Outlet />
      </main>

      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  )
}
```

---

## Parte 7: Dashboard com Convex

Atualize `src/routes/dashboard.tsx`:

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = useUser()
  const [newProjectName, setNewProjectName] = useState('')

  // Buscar usuário no Convex
  const convexUser = useQuery(api.users.getUser, {
    clerkId: user?.id ?? '',
  })

  // Buscar projetos
  const projects = useQuery(
    api.projects.getProjects,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  )

  // Mutations
  const createProject = useMutation(api.projects.createProject)
  const deleteProject = useMutation(api.projects.deleteProject)

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !convexUser?._id) return

    await createProject({
      userId: convexUser._id,
      name: newProjectName,
    })
    setNewProjectName('')
  }

  if (!user) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {user.firstName || user.emailAddresses[0].emailAddress}
        </p>
      </div>

      {/* Criar novo projeto */}
      <Card>
        <CardHeader>
          <CardTitle>Novo Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Nome do projeto"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
            />
            <Button onClick={handleCreateProject}>Criar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de projetos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Card key={project._id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteProject({ projectId: project._id })}
              >
                Excluir
              </Button>
            </CardHeader>
            {project.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>
              </CardContent>
            )}
          </Card>
        ))}

        {projects?.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">
            Nenhum projeto ainda. Crie o primeiro acima!
          </p>
        )}
      </div>
    </div>
  )
}
```

---

## Parte 8: Sincronizar usuário Clerk → Convex

Crie `src/hooks/use-store-user.ts`:

```typescript
import { useUser } from '@clerk/clerk-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useEffect } from 'react'

export function useStoreUser() {
  const { user, isLoaded } = useUser()
  const createUser = useMutation(api.users.createUser)
  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : 'skip'
  )

  useEffect(() => {
    if (!isLoaded || !user) return

    // Criar usuário no Convex se não existir
    createUser({
      clerkId: user.id,
      email: user.emailAddresses[0].emailAddress,
      name: user.fullName ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
    })
  }, [isLoaded, user, createUser])

  return { user: convexUser, isLoading: !isLoaded }
}
```

Use no dashboard:

```tsx
// No início do DashboardPage
const { user: convexUser, isLoading } = useStoreUser()

if (isLoading) {
  return <div>Carregando...</div>
}
```

---

## Parte 9: Deploy no Railway

### 9.1 Preparar para produção

Crie `Dockerfile` na raiz:

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Instalar dependências
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Servir com serve
RUN bun add serve

EXPOSE 3000

CMD ["bunx", "serve", "-s", "dist", "-l", "3000"]
```

### 9.2 Configurar scripts

Atualize `package.json`:

```json
{
  "scripts": {
    "dev": "bunx convex dev & vite",
    "build": "vite build",
    "preview": "vite preview",
    "convex:dev": "bunx convex dev",
    "convex:deploy": "bunx convex deploy"
  }
}
```

### 9.3 Deploy do Convex

```bash
# Deploy do backend Convex para produção
bunx convex deploy
```

Copie a URL de produção gerada.

### 9.4 Deploy no Railway

1. **Criar conta**: https://railway.app
2. **Novo projeto**: Clique "New Project"
3. **Conectar GitHub**: Selecione seu repositório
4. **Configurar variáveis**:
   - `VITE_CLERK_PUBLISHABLE_KEY` = sua chave Clerk
   - `VITE_CONVEX_URL` = URL de produção do Convex

5. **Deploy**: Railway detecta automaticamente o Dockerfile e faz deploy

### 9.5 Configurar domínio (opcional)

No Railway:
1. Vá em **Settings** do serviço
2. **Domains** → **Generate Domain** ou **Custom Domain**

---

## Parte 10: Comandos do dia a dia

```bash
# Desenvolvimento (roda Convex + Vite)
bun run dev

# Adicionar componente shadcn
bunx shadcn@latest add [component-name]

# Deploy Convex para produção
bunx convex deploy

# Build local
bun run build

# Push para Railway (deploy automático)
git add .
git commit -m "feat: nova feature"
git push origin main
```

---

## Checklist Final

- [ ] Bun instalado
- [ ] Projeto Vite criado
- [ ] Tailwind CSS configurado
- [ ] shadcn/ui inicializado
- [ ] TanStack Router configurado
- [ ] Convex conectado
- [ ] Clerk configurado
- [ ] JWT Template do Clerk → Convex
- [ ] Variáveis de ambiente definidas
- [ ] Deploy Convex feito
- [ ] Deploy Railway feito

---

## Recursos Adicionais

- [Documentação Convex](https://docs.convex.dev)
- [TanStack Router Docs](https://tanstack.com/router/latest)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Clerk Docs](https://clerk.com/docs)
- [Railway Docs](https://docs.railway.app)

---

## Troubleshooting

### Erro: "convex not found"
```bash
bun add convex
bunx convex dev
```

### Erro: Clerk + Convex auth
Verifique se o JWT Template no Clerk está configurado para "Convex" e o Issuer URL está correto em `convex/auth.config.ts`.

### Erro: TanStack Router routes
Execute `bun run dev` — o plugin gera automaticamente `routeTree.gen.ts`.

### Deploy Railway falhando
Verifique se todas as variáveis de ambiente estão configuradas no Railway dashboard.
