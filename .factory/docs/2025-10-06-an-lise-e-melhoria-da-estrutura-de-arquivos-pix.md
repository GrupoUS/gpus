# Análise da Estrutura Atual vs Documentação

## ✅ A Estrutura Atual está CORRETA!

A implementação atual segue **perfeitamente** o padrão do TanStack Router v5:

### Estrutura Implementada (CORRETA):
```
src/
├── routes/                    # ✅ File-based routing (TanStack Router v5)
│   └── pix/
│       ├── index.tsx          # Rota /pix/
│       ├── transferir.tsx     # Rota /pix/transferir
│       ├── receber.tsx        # Rota /pix/receber
│       └── historico.tsx      # Rota /pix/historico
│
├── components/                # ✅ Componentes reutilizáveis
│   └── pix/
│       ├── PixSidebar.tsx
│       ├── PixConverter.tsx
│       ├── PixChart.tsx
│       └── PixTransactionsTable.tsx
│
├── hooks/                     # ✅ Custom hooks
│   └── usePix.tsx
│
├── server/                    # ✅ Backend tRPC
│   └── routers/
│       └── pix.ts
│
└── types/                     # ✅ TypeScript types
    └── pix.ts
```

### Por que está correto:
- **`src/routes/`**: TanStack Router usa file-based routing, cada arquivo = 1 rota
- **`src/components/`**: Componentes reutilizáveis importados pelas rotas
- **`src/hooks/`**: Lógica de negócio separada
- **`src/server/`**: Backend procedures

## ⚠️ Problema Identificado

### `src/pages/` é LEGADO e duplicado:
```
src/pages/
├── Dashboard.tsx          # ❌ Duplicado com src/routes/dashboard.tsx
├── Login.tsx              # ❌ Duplicado com src/routes/login.tsx
└── Transactions.tsx       # ❌ Duplicado com src/routes/transactions.tsx
```

O TanStack Router não usa `src/pages/`, usa `src/routes/`. A pasta `pages/` é legado de outra estrutura.

## 📋 Plano de Ação

### 1. **Limpeza de Código Legado** (Prioridade: ALTA)
- Remover `src/pages/` após verificar que todas as rotas estão em `src/routes/`
- Atualizar imports que referenciem `src/pages/`
- Evitar confusão futura

### 2. **Atualizar Documentação** (Prioridade: MÉDIA)
- Atualizar `source-tree.md` para documentar `src/routes/` ao invés de `src/pages/`
- Adicionar exemplos do TanStack Router v5
- Documentar convenções de file-based routing

### 3. **Melhorias Visuais nos Componentes PIX** (Prioridade: ALTA)
Baseado na análise do experiment-04, aplicar:

#### PixSidebar.tsx:
- Adicionar efeitos de glow: `before:bg-green-500/48 before:blur-[10px]`
- Sombras complexas para profundidade
- Estados ativos com indicadores visuais
- Transições suaves com CSS variables

#### PixConverter.tsx:
- Usar Tabs do shadcn/ui (Transferir/Receber)
- Integrar react-aria-components NumberField para formatação BRL
- Máscaras de gradiente radial para efeitos visuais
- Botões com efeitos de hover/press

#### PixChart.tsx:
- RadioGroup animado para seleção de período
- Cursor customizado para interação
- Animações CSS variables
- Cores gradientes para gráficos

#### PixTransactionsTable.tsx:
- Hover states com elevação
- Status badges com cores semânticas
- Skeleton loading states
- Scroll infinito otimizado

### 4. **Integração com Backend Real** (Prioridade: ALTA)
- Substituir mock data por hooks do `usePix.tsx`
- Conectar ao tRPC router
- Implementar Realtime subscriptions
- Adicionar toast notifications

## 🎯 Resumo da Decisão

**A estrutura atual NÃO precisa ser movida!**

✅ Mantém `src/routes/pix/*.tsx` (páginas/rotas)  
✅ Mantém `src/components/pix/*.tsx` (componentes)  
✅ Mantém `src/hooks/usePix.tsx` (lógica)  
✅ Mantém `src/server/routers/pix.ts` (backend)  

❌ Remove `src/pages/` (legado duplicado)  
✏️ Atualiza `source-tree.md` (documentação)  
✨ Melhora componentes com effects do experiment-04

## 📚 Referências
- TanStack Router v5: File-based routing em `src/routes/`
- experiment-04: Efeitos visuais e animações
- CLAUDE.md: KISS principle - estrutura simples e funcional