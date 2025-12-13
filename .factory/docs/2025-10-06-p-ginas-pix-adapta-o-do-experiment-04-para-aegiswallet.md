# 📱 Spec: Páginas PIX - Adaptação do Experiment-04 (Crypto Wallet)

## 🎯 Objetivo
Criar páginas PIX modernas para AegisWallet adaptando a estrutura visual do [experiment-04](https://ui-experiment-04.vercel.app) (crypto wallet) para transações PIX brasileiras, seguindo princípios do APEX UI/UX Designer.

---

## 📊 Análise Estratégica

### De Crypto Wallet → PIX Wallet
| Componente Crypto | Adaptação PIX | Justificativa |
|-------------------|---------------|---------------|
| Sidebar com moedas crypto | Sidebar com chaves PIX favoritas | PIX usa chaves (email, CPF, telefone) ao invés de moedas |
| Conversor de criptomoedas | Calculadora de valores PIX | Sem cotação, apenas formatação R$ e preview |
| Gráfico de preços ($) | Gráfico de transações (volume) | PIX foca em histórico de transações, não preço |
| Tabela de transações crypto | Tabela de transações PIX | Mesmo conceito, adaptado para PIX keys |

---

## 🗂️ Estrutura de Páginas

### 1. `/pix/index.tsx` - Dashboard PIX Principal
**Layout:** Sidebar + Main Content (inspirado no experiment-04)

**Componentes:**
```typescript
<SidebarProvider>
  <PixSidebar>               // Chaves PIX favoritas/recentes
  <SidebarInset>
    <Header>                 // Search + User + Theme
    <MainContent>
      <PixConverter />       // Widget lateral: calculadora R$
      <PixChart />           // Gráfico de transações (recharts)
      <PixTransactionsTable /> // Lista de transações
    </MainContent>
  </SidebarInset>
</SidebarProvider>
```

**Funcionalidades:**
- Visão geral de transações PIX (últimas 24h/7d/30d)
- Quick actions: transferir, receber, copiar chave
- Filtros por tipo: enviadas, recebidas, agendadas
- Real-time updates via Supabase

---

### 2. `/pix/transferir.tsx` - Enviar PIX
**Componente Base:** `PixTransfer.tsx` (já existe em `src/components/financial/`)

**Melhorias:**
- Integração com sidebar para favoritos
- Suporte para QR Code scanning
- Validação brasileira: CPF (XXX.XXX.XXX-XX), telefone (+55)
- Limites por horário (noturno: menor limite)
- Voice command: "transferir via PIX para [contato] valor [valor]"

---

### 3. `/pix/receber.tsx` - Receber PIX
**Novos Componentes:**
- `PixReceiver.tsx`: QR Code dinâmico + lista de chaves
- `PixKeyDisplay.tsx`: Exibição com copy button

**Funcionalidades:**
- QR Code gerado dinamicamente (valor fixo ou aberto)
- Lista de chaves PIX cadastradas (email, CPF, telefone)
- Copiar chave com um clique + toast feedback
- Histórico de PIX recebidos (últimos 30 dias)
- Notificações em tempo real (Supabase Realtime)

---

### 4. `/pix/historico.tsx` - Histórico Completo
**Componente Base:** Adaptação do `TransactionsTable` do experiment-04

**Features Avançadas:**
- Filtros: data, valor (min/max), tipo (enviado/recebido), chave PIX
- Busca full-text por descrição
- Exportação de extrato (PDF/CSV) - LGPD compliant
- Comprovantes de transações
- Análise por categoria (com gráfico)

---

## 🧩 Componentes Necessários

### Atomic Design Structure

#### 1️⃣ Atoms (src/components/ui/)
**Já existentes:** button, card, input, avatar, badge, separator, tabs, tooltip

**A instalar via shadcn:**
```bash
bunx shadcn@latest add collapsible
bunx shadcn@latest add scroll-area
```

#### 2️⃣ Molecules (src/components/financial/)
- ✅ `PixTransfer.tsx` (já existe - reutilizar)
- 🆕 `PixReceiver.tsx` - QR Code + chaves PIX
- 🆕 `PixQuickAction.tsx` - Ações rápidas (transferir, receber)
- 🆕 `PixKeySelector.tsx` - Seletor de chaves cadastradas

#### 3️⃣ Organisms (src/components/pix/)
- 🆕 `PixSidebar.tsx` - Adaptado de `app-sidebar.tsx` do exp-04
- 🆕 `PixConverter.tsx` - Adaptado de `converter.tsx` do exp-04
- 🆕 `PixChart.tsx` - Adaptado de `coin-chart.tsx` do exp-04
- 🆕 `PixTransactionsTable.tsx` - Adaptado de `transactions-table.tsx` do exp-04

---

## 🔌 Dependências e Integrações

### NPM Dependencies (adicionar)
```bash
bun add react-aria-components  # Acessibilidade avançada
bun add -D tw-animate-css      # Animações CSS
```

### shadcn Registry (usar comandos)
```bash
# Buscar e visualizar componentes
bunx shadcn@latest view @shadcn
bunx shadcn@latest view @originui

# Instalar componentes específicos
bunx shadcn@latest add collapsible
bunx shadcn@latest add scroll-area
```

### tRPC Procedures (criar)
```typescript
// src/server/routers/pix.ts
export const pixRouter = router({
  transfer: protectedProcedure.input(z.object({...})).mutation(async ({ctx, input}) => {...}),
  getHistory: protectedProcedure.input(z.object({...})).query(async ({ctx, input}) => {...}),
  generateQRCode: protectedProcedure.input(z.object({...})).mutation(async ({ctx, input}) => {...}),
})
```

### Supabase Table (verificar/criar)
```sql
-- Verificar se existe tabela pix_transactions
-- Criar se necessário com RLS policies
```

---

## 🇧🇷 Adaptações Brasileiras Específicas

### 1. PIX Key Types Support
- **Email:** validação RFC
- **CPF:** formatação `XXX.XXX.XXX-XX` + validação dígito verificador
- **CNPJ:** formatação `XX.XXX.XXX/XXXX-XX`
- **Telefone:** `+55 (XX) XXXXX-XXXX`
- **Chave aleatória:** UUID v4

### 2. UX Brasileiro
- Teclado numérico otimizado para R$
- Formatação automática de CPF/CNPJ
- Horário fuso Brasil (America/Sao_Paulo)
- Mensagens em português BR natural
- Limites por horário (noturno: reduzido)

### 3. LGPD Compliance
- Mascaramento de chaves PIX por padrão
- Consentimento para salvar favoritos
- Histórico com retenção configurável
- Exportação de dados pessoais
- Audit trail completo

### 4. Features PIX Avançadas
- PIX Agendado (scheduled)
- PIX Saque (cash withdrawal at merchants)
- PIX Troco (cashback)
- PIX Cobrança (billing/invoices)
- Limites dinâmicos

---

## 🎨 Design System (APEX UI/UX Guidelines)

### Core Principles
- **Mobile-First:** 95% dos usuários PIX usam mobile
- **Accessibility:** WCAG 2.1 AA mínimo (target: 95%+)
- **Performance:** LCP ≤2.5s, INP ≤200ms, CLS ≤0.1
- **Brazilian Colors:** Verde PIX (#00C853), tons neutros

### Color Palette
```css
--pix-primary: #00C853;        /* PIX Green */
--pix-success: #4CAF50;        /* Success transactions */
--pix-error: #F44336;          /* Failed transactions */
--pix-pending: #FF9800;        /* Processing */
--background: hsl(var(--background));
--foreground: hsl(var(--foreground));
```

### Typography
```typescript
// Seguir fonte do projeto: Geist Sans
font-family: var(--font-sans);
```

---

## ⚡ Plano de Implementação (13-18h total)

### Fase 1: Setup e Base (2-3h)
- [ ] Instalar dependências: `collapsible`, `scroll-area`, `react-aria-components`
- [ ] Criar estrutura `/src/components/pix/`
- [ ] Configurar rotas PIX no TanStack Router (`/pix`, `/pix/transferir`, `/pix/receber`, `/pix/historico`)
- [ ] Criar tipos TypeScript para PIX (`PixTransaction`, `PixKey`, etc.)

### Fase 2: Componentes Reutilizáveis (3-4h)
- [ ] `PixSidebar.tsx` - Adaptar de experiment-04 `app-sidebar.tsx`
- [ ] `PixConverter.tsx` - Calculadora de valores R$
- [ ] `PixChart.tsx` - Gráfico recharts para transações
- [ ] `PixTransactionsTable.tsx` - Tabela com filtros

### Fase 3: Páginas Principais (4-5h)
- [ ] `/pix/index.tsx` - Dashboard completo
- [ ] `/pix/transferir.tsx` - Integrar `PixTransfer` existente
- [ ] `/pix/receber.tsx` - QR Code + chaves
- [ ] `/pix/historico.tsx` - Tabela avançada

### Fase 4: Integrações (2-3h)
- [ ] tRPC procedures: `pix.transfer`, `pix.getHistory`, `pix.generateQRCode`
- [ ] Supabase real-time subscriptions
- [ ] Voice commands: "transferir via PIX", "gerar QR Code"
- [ ] LGPD features: mascaramento, consentimento, exportação

### Fase 5: Testes e Refinamento (2-3h)
- [ ] Testes de acessibilidade: WCAG 2.1 AA
- [ ] Performance: Core Web Vitals (LCP, INP, CLS)
- [ ] Responsive design: mobile (375px) → desktop (1920px)
- [ ] Validações e error handling
- [ ] TypeScript strict mode: zero errors

---

## ✅ Critérios de Sucesso (Definition of Done)

### Funcional
- ✅ Todas as 4 páginas criadas e navegáveis
- ✅ Transferências PIX funcionando com validação brasileira
- ✅ QR Code gerado dinamicamente
- ✅ Histórico de transações com filtros avançados
- ✅ Real-time updates via Supabase

### Qualidade
- ✅ 95%+ acessibilidade score (WCAG 2.1 AA)
- ✅ Zero TypeScript errors (strict mode)
- ✅ LCP ≤2.5s, INP ≤200ms, CLS ≤0.1
- ✅ Mobile-first responsive (375px+)
- ✅ LGPD compliant (mascaramento, consentimento)

### Integração
- ✅ Voice commands funcionando
- ✅ tRPC procedures testadas
- ✅ Supabase RLS policies configuradas
- ✅ Componentes seguindo Atomic Design
- ✅ Import hierarchy: `@/components/ui` → `@/components/financial` → `@/components/pix`

---

## 📚 Referências

1. **Experiment-04 Source:** https://github.com/origin-space/ui-experiments/tree/main/apps/experiment-04
2. **Experiment-04 Registry:** https://ui-experiment-04.vercel.app/r/experiment-04.json
3. **APEX UI/UX Designer:** `.factory/droids/apex-ui-ux-designer.md`
4. **PIX UX Best Practices:** WDIR Agency, PagBrasil, Segpay
5. **AegisWallet CLAUDE.md:** Projeto guidelines e tech stack

---

## 🚀 Comando de Início

Após aprovação, executar:
```bash
# 1. Instalar dependências
bunx shadcn@latest add collapsible scroll-area
bun add react-aria-components
bun add -D tw-animate-css

# 2. Criar estrutura de pastas
mkdir -p src/components/pix
mkdir -p src/routes/pix

# 3. Gerar tipos Supabase
bun run types:generate

# 4. Iniciar desenvolvimento
bun dev
```

**Tempo estimado:** 13-18 horas
**Complexidade:** Média-Alta
**Dependências críticas:** shadcn registry, Supabase, tRPC, recharts