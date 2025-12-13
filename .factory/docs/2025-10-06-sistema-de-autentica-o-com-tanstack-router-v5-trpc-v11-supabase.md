# 🔐 Spec: Sistema de Autenticação Completo AegisWallet

## 📊 Análise de Problemas Identificados

### ❌ Erros Críticos Atuais:
1. **Login.tsx** - usa `react-router-dom` (não instalado, incompatível)
2. **AuthContext.tsx** - usa `react-router-dom` (não instalado, incompatível)
3. **ProtectedRoute.tsx** - usa `react-router-dom` (não instalado, incompatível)
4. **router.tsx** - sem rota `/login`, sem proteção de rotas
5. **App.tsx** - sem AuthProvider (auth não funciona)

### ✅ Componentes Corretos Existentes:
- **tRPC procedures** - auth procedures funcionais (`signIn`, `signUp`, `signOut`, `getSession`)
- **tRPC context** - Supabase auth integrado no server context
- **protectedProcedure** - middleware tRPC para rotas autenticadas
- **TRPCProvider** - já integrado no App.tsx

---

## 🎯 Solução Arquitetural (Baseada em Docs Oficiais)

### Arquitetura Correta:
```
App.tsx
└── AuthProvider (React Context - Supabase Auth)
    └── TRPCProvider (tRPC + React Query)
        └── RouterProvider (TanStack Router)
            ├── Root Route (context injection)
            ├── Login Route (redirect se autenticado)
            └── _authenticated Layout Route (beforeLoad guard)
                ├── Dashboard (protegido)
                └── Transactions (protegido)
```

---

## 🛠️ Plano de Implementação

### **Fase 1: AuthProvider com Supabase Auth**
**Arquivo**: `src/contexts/AuthContext.tsx` (reescrever)

**Funcionalidades**:
- Estado global: `{ user, session, isLoading, isAuthenticated }`
- Métodos: `login()`, `logout()`, `signUp()`, `signInWithGoogle()`
- Persistência: localStorage via Supabase Auth
- Restauração: `useEffect` para restaurar sessão no mount
- **SEM react-router-dom** - apenas estado, sem navegação

**Mudanças**:
- ❌ Remover: `useNavigate()` do react-router-dom
- ❌ Remover: `navigate()` dentro de `onAuthStateChange`
- ✅ Adicionar: `supabase.auth.onAuthStateChange` listener
- ✅ Adicionar: Loading state durante restauração

---

### **Fase 2: Router com Context Injection**
**Arquivo**: `src/router.tsx` (modificar)

**Mudanças**:
1. **Root Route**: Usar `createRootRouteWithContext` para injetar auth
   ```typescript
   interface RouterContext {
     auth: AuthState
   }
   const rootRoute = createRootRouteWithContext<RouterContext>()({...})
   ```

2. **Adicionar Rota de Login**: `/login`
   ```typescript
   const loginRoute = createRoute({
     path: '/login',
     component: LoginPage,
     beforeLoad: ({ context, search }) => {
       if (context.auth.isAuthenticated) {
         throw redirect({ to: search.redirect || '/dashboard' })
       }
     }
   })
   ```

3. **Layout Protegido**: `/_authenticated` (pathless layout)
   ```typescript
   const authenticatedRoute = createRoute({
     id: '_authenticated',
     beforeLoad: ({ context, location }) => {
       if (!context.auth.isAuthenticated) {
         throw redirect({
           to: '/login',
           search: { redirect: location.href }
         })
       }
     },
     component: Outlet
   })
   ```

4. **Mover Rotas Existentes**: Dashboard e Transactions dentro de `_authenticated`
   ```typescript
   const dashboardRoute = createRoute({
     getParentRoute: () => authenticatedRoute,
     path: '/dashboard',
     component: Dashboard
   })
   ```

---

### **Fase 3: App.tsx - Integração Completa**
**Arquivo**: `src/App.tsx` (modificar)

**Estrutura Final**:
```typescript
function InnerApp() {
  const auth = useAuth() // hook do AuthContext
  return <RouterProvider router={router} context={{ auth }} />
}

function App() {
  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <AuthProvider> {/* NOVO */}
          <TRPCProvider>
            <InnerApp /> {/* NOVO */}
          </TRPCProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  )
}
```

**Mudanças**:
- ✅ Adicionar: `AuthProvider` wrapper
- ✅ Adicionar: `InnerApp` para acessar `useAuth()`
- ✅ Passar: `context={{ auth }}` para RouterProvider

---

### **Fase 4: Login Page (TanStack Router)**
**Arquivo**: `src/pages/Login.tsx` (reescrever)

**Mudanças**:
- ❌ Remover: `import { useNavigate } from 'react-router-dom'`
- ❌ Remover: `navigate('/dashboard')`
- ✅ Usar: `useAuth()` do contexto
- ✅ Usar: `Route.useNavigate()` do TanStack Router
- ✅ Usar: `Route.useSearch()` para pegar redirect param
- ✅ Lógica: Após login bem-sucedido, navegar para `search.redirect || '/dashboard'`

**beforeLoad**:
```typescript
export const Route = createFileRoute('/login')({
  validateSearch: (search) => ({
    redirect: (search.redirect as string) || '/dashboard'
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect })
    }
  },
  component: LoginComponent
})
```

---

### **Fase 5: Deletar Arquivos Obsoletos**
- ❌ **Deletar**: `src/components/ProtectedRoute.tsx` (substituído por router `beforeLoad`)
- ❌ **Não instalar**: `react-router-dom` (não é necessário)

---

## 📁 Estrutura de Arquivos Final

```
src/
├── contexts/
│   └── AuthContext.tsx          ✏️ REESCREVER (remover react-router-dom)
├── pages/
│   ├── Login.tsx                ✏️ REESCREVER (usar TanStack Router)
│   ├── Dashboard.tsx            ✅ OK (já existe)
│   └── Transactions.tsx         ✅ OK (já existe)
├── router.tsx                   ✏️ MODIFICAR (adicionar /login, _authenticated)
├── App.tsx                      ✏️ MODIFICAR (adicionar AuthProvider + InnerApp)
├── server/
│   ├── context.ts               ✅ OK (já tem Supabase)
│   ├── trpc.ts                  ✅ OK (já tem protectedProcedure)
│   └── procedures/auth.ts       ✅ OK (já tem signIn/signUp/signOut)
└── components/
    └── ProtectedRoute.tsx       ❌ DELETAR (obsoleto)
```

---

## 🔄 Flow de Autenticação

### **1. Usuário não autenticado acessa `/dashboard`**:
1. Router `beforeLoad` de `_authenticated` detecta `!context.auth.isAuthenticated`
2. `throw redirect({ to: '/login', search: { redirect: '/dashboard' } })`
3. Usuário é redirecionado para `/login?redirect=/dashboard`

### **2. Usuário faz login em `/login`**:
1. `handleSubmit()` chama `auth.login(email, password)`
2. `auth.login()` chama `supabase.auth.signInWithPassword()`
3. Supabase listener atualiza estado: `setUser()`, `setIsAuthenticated(true)`
4. Login page usa `navigate({ to: search.redirect })` → redireciona para `/dashboard`
5. Router `beforeLoad` de `_authenticated` detecta `context.auth.isAuthenticated` → permite acesso

### **3. Usuário autenticado tenta acessar `/login`**:
1. Router `beforeLoad` de `/login` detecta `context.auth.isAuthenticated`
2. `throw redirect({ to: '/dashboard' })`
3. Usuário é redirecionado automaticamente

### **4. Refresh da página (persistência)**:
1. App monta → `AuthProvider` executa `useEffect`
2. `supabase.auth.getSession()` recupera sessão do localStorage
3. Se válida: `setUser()`, `setIsAuthenticated(true)`
4. Router permite acesso às rotas protegidas

---

## ✅ Validação e Testes

### **Checklist de Validação**:
- [ ] `bun run build` - build sem erros
- [ ] `bun run lint` - OxLint zero errors
- [ ] Login redireciona para dashboard após sucesso
- [ ] Dashboard redireciona para login se não autenticado
- [ ] Refresh mantém sessão (persistência)
- [ ] Logout redireciona para home
- [ ] Login com redirect preserva URL destino
- [ ] Google OAuth funciona corretamente

### **Testes Manuais**:
1. Acessar `/dashboard` sem login → redireciona para `/login?redirect=/dashboard`
2. Fazer login → redireciona para `/dashboard`
3. Refresh em `/dashboard` → mantém autenticação
4. Logout → redireciona para `/`
5. Acessar `/login` já autenticado → redireciona para `/dashboard`

---

## 🎓 Referências das Documentações Oficiais

### **TanStack Router v5**:
- ✅ `beforeLoad` para route guards
- ✅ `createRootRouteWithContext` para auth context
- ✅ `throw redirect()` para redirecionamentos
- ✅ Pathless layout routes (`_authenticated`)
- ✅ `Route.useNavigate()` para navegação programática
- ✅ `validateSearch` para query params typesafe

### **tRPC v11**:
- ✅ `protectedProcedure.use()` para auth middleware
- ✅ Context com Supabase session
- ✅ `TRPCError` com código `UNAUTHORIZED`

### **Supabase Auth**:
- ✅ `auth.onAuthStateChange()` listener
- ✅ `auth.getSession()` para restauração
- ✅ Persistência automática via localStorage

---

## 🚀 Próximos Passos

Após aprovação do spec:
1. Implementar AuthContext.tsx (sem react-router-dom)
2. Modificar router.tsx (adicionar /login e _authenticated)
3. Reescrever Login.tsx (TanStack Router)
4. Modificar App.tsx (AuthProvider + InnerApp)
5. Deletar ProtectedRoute.tsx
6. Executar validações
7. Commit: `feat: implement TanStack Router authentication with Supabase Auth`