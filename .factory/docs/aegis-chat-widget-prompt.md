# 🤖 Frontend Developer: AI Chat Widget Refactoring & Enhancement

## 🎯 Missão

**Objetivo Principal**: Refatorar e aprimorar o frontend do widget de chat AI do AegisWallet, corrigindo problemas de scroll, instalando componentes oficiais do AI SDK Elements e KokonutUI, e implementando modo fullscreen com navegação pela sidebar.

**Contexto de Negócio**: O widget de chat AI é uma feature core do AegisWallet que permite aos usuários interagir com um assistente financeiro. Atualmente o widget apresenta problemas de UX como scroll não funcionando e componentes customizados que podem ser substituídos por implementações oficiais mais robustas. A melhoria visa oferecer uma experiência de chat profissional comparável a produtos como Claude.ai e ChatGPT.

**Métricas de Sucesso**:
- Scroll funcional em todas as resoluções (mobile/tablet/desktop)
- Todos os 12 componentes AI oficiais instalados e funcionando
- Modo fullscreen acessível via sidebar e via widget
- Transição suave entre widget minimizado e fullscreen
- Zero regressões nos testes existentes

---

## 🧠 Extended Thinking Configuration

```yaml
thinking_strategy:
  budget: "16000"
  approach: "general_first"
  
  initial_prompt: |
    Analise profundamente a arquitetura atual do chat widget.
    Considere múltiplas abordagens para a integração dos componentes.
    Identifique todos os pontos de integração necessários.
    Priorize soluções que mantenham compatibilidade retroativa.

reflection_after_tools:
  enabled: true
  prompt: |
    Após cada modificação, verifique:
    - Compatibilidade com a estrutura existente
    - Acessibilidade (ARIA labels, keyboard navigation)
    - Performance (lazy loading, code splitting)
    - Consistência visual com o design system
```

---

## 📊 Fase 1: ANALYZE

### 🌐 Contexto Técnico

```yaml
project_type: "Fintech Web Application"
stack:
  language: "TypeScript 5.x"
  framework: "React 18 + Vite"
  ui_library: "shadcn/ui + Tailwind CSS"
  state: "TanStack Query + React Context"
  routing: "TanStack Router"
  key_dependencies:
    - "@ai-sdk/react"
    - "lucide-react"
    - "date-fns"
    - "sonner" (toasts)
    - "tailwindcss-animate"

existing_patterns:
  - "Feature-based folder structure (src/features/ai-chat/)"
  - "Compound component pattern (ChatLayout → ChatContainer → subcomponents)"
  - "Backend abstraction layer (backends/GeminiBackend.ts)"
  - "Custom hooks for business logic (useChatController.ts)"
  - "Index barrel exports por módulo"

constraints:
  - "DEVE manter compatibilidade com o hook useChatController existente"
  - "DEVE preservar integração com sistema de billing/paywall"
  - "DEVE suportar tema claro/escuro automaticamente"
  - "DEVE funcionar em mobile (responsivo)"
  - "NÃO DEVE quebrar testes existentes em src/test/ai-chat/"
```

### 🐛 Problemas Identificados

| ID | Problema | Severidade | Componente Afetado |
|----|----------|------------|-------------------|
| P1 | Barra de rolagem não aparece no widget | Alta | ChatConversation.tsx |
| P2 | ScrollArea não recebe altura correta | Alta | ChatConversation.tsx |
| P3 | Componentes ai-elements são stubs básicos | Média | src/components/ai-elements/* |
| P4 | Falta modo fullscreen dedicado | Média | ChatWidget.tsx |
| P5 | Sem link na sidebar para chat | Baixa | Sidebar/Navigation |
| P6 | Auto-scroll pode falhar em mensagens longas | Média | ChatConversation.tsx |

### 📁 Estrutura Atual Relevante

```
src/
├── components/
│   ├── ai-elements/           # ⚠️ Stubs básicos - substituir
│   │   ├── conversation.tsx   
│   │   ├── prompt-input.tsx   
│   │   ├── reasoning.tsx
│   │   ├── response.tsx
│   │   ├── suggestion.tsx
│   │   ├── task.tsx
│   │   └── index.ts
│   └── kokonutui/             # ✓ Implementações customizadas
│       ├── ai-prompt.tsx
│       ├── ai-loading.tsx
│       └── ai-input-search.tsx
├── features/ai-chat/
│   ├── components/
│   │   ├── ChatWidget.tsx     # ⚠️ Widget flutuante - adicionar fullscreen
│   │   ├── ChatContainer.tsx  # Orchestrador principal
│   │   ├── ChatConversation.tsx # ⚠️ Scroll quebrado
│   │   ├── ChatLayout.tsx     # Layout com header
│   │   └── ChatPromptInput.tsx
│   ├── hooks/
│   │   └── useChatController.ts
│   └── pages/
│       └── AiChatPage.tsx     # ⚠️ Layout diferente do ChatContainer
└── routes/
    └── ai-chat.lazy.tsx       # Rota existente
```

---

## 🔍 Fase 2: RESEARCH

### 📦 Componentes a Instalar

#### AI SDK Elements (ai-sdk.dev)

| Componente | Comando | Propósito |
|------------|---------|-----------|
| context | `npx ai-elements@latest add context` | Token usage, cost display |
| conversation | `npx ai-elements@latest add conversation` | Auto-scroll wrapper |
| image | `npx ai-elements@latest add image` | AI-generated images |
| open-in-chat | `npx ai-elements@latest add open-in-chat` | Multi-platform sharing |
| prompt-input | `npx ai-elements@latest add prompt-input` | Full-featured input |
| reasoning | `npx ai-elements@latest add reasoning` | Collapsible reasoning |
| response | `npx ai-elements@latest add response` | Markdown rendering |
| suggestion | `npx ai-elements@latest add suggestion` | Clickable prompts |
| task | `npx ai-elements@latest add task` | Task progress display |

#### KokonutUI Components

| Componente | Comando | Propósito |
|------------|---------|-----------|
| ai-prompt | `bunx --bun shadcn@latest add @kokonutui/ai-prompt` | Styled input selector |
| ai-input-search | `bunx --bun shadcn@latest add @kokonutui/ai-input-search` | Search-focused input |
| ai-loading | `bunx --bun shadcn@latest add @kokonutui/ai-loading` | Multi-step loading states |

### 🔧 Soluções para Scroll

```yaml
scroll_fix_approach:
  problem: "ScrollArea não calcula altura correta dentro de flex container"
  
  solution_1_css_fix:
    description: "Garantir cadeia de flex com min-h-0"
    code: |
      // Parent deve ter: flex flex-col min-h-0 h-full
      // ScrollArea deve ter: flex-1 min-h-0 overflow-auto
    
  solution_2_use_conversation_component:
    description: "Usar Conversation oficial do ai-sdk.dev"
    benefits:
      - "Auto-scroll to bottom nativo"
      - "ConversationScrollButton integrado"
      - "Testado em produção pela Vercel"
    
  recommended: "solution_2_use_conversation_component"
```

### 📐 Arquitetura Fullscreen

```yaml
fullscreen_approach:
  strategy: "Dual-mode component com shared state"
  
  modes:
    widget:
      trigger: "FAB button no canto inferior direito"
      size: "w-[90vw] sm:w-[400px] h-[80vh] sm:h-[600px]"
      position: "fixed bottom-4 right-4"
      
    fullscreen:
      trigger: "Link na sidebar + botão expand no widget"
      size: "w-full h-[calc(100vh-header)]"
      position: "main content area"
      
  state_sharing:
    - "Messages persistem entre modos via React Context"
    - "Scroll position preservado"
    - "Streaming continua sem interrupção"
```

---

## 🧠 Fase 3: THINK

### 🏗️ Arquitetura da Solução

```
┌────────────────────────────────────────────────────────────────────┐
│                        App Shell                                    │
├────────────┬───────────────────────────────────────────────────────┤
│            │                                                        │
│  Sidebar   │              Main Content                              │
│            │                                                        │
│ ┌────────┐ │  ┌────────────────────────────────────────────────┐   │
│ │ Link:  │ │  │            ChatPage (Fullscreen)               │   │
│ │ AI Chat│◀┼─▶│  ┌──────────────────────────────────────────┐  │   │
│ └────────┘ │  │  │         ChatContainer                     │  │   │
│            │  │  │  ┌────────────────────────────────────┐   │  │   │
│            │  │  │  │    Conversation (ai-sdk)           │   │  │   │
│            │  │  │  │  ┌──────────────────────────────┐  │   │  │   │
│            │  │  │  │  │   ConversationContent        │  │   │  │   │
│            │  │  │  │  │   - Response (markdown)      │  │   │  │   │
│            │  │  │  │  │   - Reasoning (collapsible)  │  │   │  │   │
│            │  │  │  │  │   - Task (progress)          │  │   │  │   │
│            │  │  │  │  └──────────────────────────────┘  │   │  │   │
│            │  │  │  │  ┌──────────────────────────────┐  │   │  │   │
│            │  │  │  │  │   ConversationScrollButton   │  │   │  │   │
│            │  │  │  │  └──────────────────────────────┘  │   │  │   │
│            │  │  │  └────────────────────────────────────┘   │  │   │
│            │  │  │  ┌────────────────────────────────────┐   │  │   │
│            │  │  │  │   Suggestions (chips)              │   │  │   │
│            │  │  │  └────────────────────────────────────┘   │  │   │
│            │  │  │  ┌────────────────────────────────────┐   │  │   │
│            │  │  │  │   PromptInput (ai-sdk + kokonut)   │   │  │   │
│            │  │  │  └────────────────────────────────────┘   │  │   │
│            │  │  └──────────────────────────────────────────┘  │   │
│            │  └────────────────────────────────────────────────┘   │
└────────────┴───────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                     ChatWidget (Floating)                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Same ChatContainer                         │  │
│  │                    (shared logic, different layout)           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────┐  ┌────────┐                                              │
│  │ FAB  │  │ Expand │ → Navigates to /ai-chat fullscreen          │
│  └──────┘  └────────┘                                              │
└────────────────────────────────────────────────────────────────────┘
```

### 📋 Registros de Decisão (ADRs)

```yaml
ADR_001_use_official_conversation:
  context: "Componente Conversation atual é stub que não faz auto-scroll"
  options_considered:
    - "Manter stub e corrigir scroll manualmente"
    - "Usar Conversation oficial do ai-sdk.dev"
  decision: "Usar componente oficial"
  rationale: |
    - Auto-scroll nativo e testado
    - ConversationScrollButton incluso
    - Menos código para manter
    - Alinhado com roadmap do AI SDK
  consequences: "Requer instalação via npx ai-elements"

ADR_002_preserve_kokonutui_prompt:
  context: "KokonutUI AiPrompt já está customizado para voice input"
  options_considered:
    - "Substituir por PromptInput oficial"
    - "Combinar ambos (wrapper pattern)"
  decision: "Manter KokonutUI como implementação visual, usar PromptInput como wrapper semântico"
  rationale: |
    - Voice input já funciona
    - Visual alinhado com design system
    - PromptInput adiciona acessibilidade
  consequences: "Dois níveis de componentes, mas separação clara de responsabilidades"

ADR_003_fullscreen_as_route:
  context: "Fullscreen pode ser modal ou rota dedicada"
  options_considered:
    - "Modal overlay sobre content atual"
    - "Rota dedicada /ai-chat"
  decision: "Rota dedicada com preservação de estado"
  rationale: |
    - URL compartilhável
    - Back button funciona naturalmente
    - Sidebar link faz sentido
    - Pode usar lazy loading
  consequences: "Precisa de ChatContext para compartilhar estado entre widget e page"
```

---

## 📝 Fase 4: ELABORATE

### 🗺️ Roadmap de Implementação

```yaml
phase_1_install_components:
  duration: "30 min"
  deliverables:
    - "Instalar 9 componentes AI SDK Elements"
    - "Instalar/atualizar 3 componentes KokonutUI"
    - "Verificar conflitos de tipos"
  commands:
    - "npx ai-elements@latest add context conversation image open-in-chat prompt-input reasoning response suggestion task"
    - "bunx --bun shadcn@latest add @kokonutui/ai-prompt @kokonutui/ai-input-search @kokonutui/ai-loading"

phase_2_fix_scroll:
  duration: "1h"
  deliverables:
    - "Refatorar ChatConversation para usar Conversation oficial"
    - "Garantir CSS flex chain correto"
    - "Adicionar ConversationScrollButton"
    - "Testar em mobile/tablet/desktop"
  dependencies: ["phase_1_install_components"]

phase_3_enhance_widget:
  duration: "1.5h"
  deliverables:
    - "Adicionar botão expand no ChatWidget"
    - "Implementar ChatContext para estado compartilhado"
    - "Preservar mensagens na transição widget→fullscreen"
  dependencies: ["phase_2_fix_scroll"]

phase_4_fullscreen_page:
  duration: "1h"
  deliverables:
    - "Unificar AiChatPage com ChatContainer"
    - "Adicionar header actions (close, minimize)"
    - "Configurar rota lazy loading"
  dependencies: ["phase_3_enhance_widget"]

phase_5_sidebar_link:
  duration: "30 min"
  deliverables:
    - "Adicionar link AI Chat na sidebar"
    - "Ícone com indicator de chat ativo"
    - "Tooltip com atalho de teclado"
  dependencies: ["phase_4_fullscreen_page"]

phase_6_polish:
  duration: "1h"
  deliverables:
    - "Animações de transição suaves"
    - "Keyboard shortcuts (Cmd+K para abrir)"
    - "Testes de integração"
    - "Documentação de uso"
  dependencies: ["phase_5_sidebar_link"]
```

### 📁 Estrutura Final Esperada

```
src/
├── components/
│   ├── ai-elements/           # ✓ Componentes oficiais instalados
│   │   ├── context.tsx        # Token usage display
│   │   ├── conversation.tsx   # Auto-scroll wrapper
│   │   ├── image.tsx          # AI image display
│   │   ├── open-in-chat.tsx   # Share to platforms
│   │   ├── prompt-input.tsx   # Full-featured input
│   │   ├── reasoning.tsx      # Collapsible reasoning
│   │   ├── response.tsx       # Markdown renderer
│   │   ├── suggestion.tsx     # Clickable prompts
│   │   ├── task.tsx           # Task progress
│   │   └── index.ts
│   └── kokonutui/             # ✓ Mantidos/atualizados
│       ├── ai-prompt.tsx      # Custom styled input
│       ├── ai-loading.tsx     # Multi-step loading
│       ├── ai-input-search.tsx # Search mode input
│       └── index.ts
├── features/ai-chat/
│   ├── components/
│   │   ├── ChatWidget.tsx     # ✓ Com botão expand
│   │   ├── ChatContainer.tsx  # ✓ Orchestrador unificado
│   │   ├── ChatConversation.tsx # ✓ Usando Conversation oficial
│   │   ├── ChatFullscreen.tsx # ✨ NOVO: Wrapper fullscreen
│   │   ├── ChatHeader.tsx     # ✨ NOVO: Header extraído
│   │   └── ...
│   ├── context/
│   │   └── ChatContext.tsx    # ✨ NOVO: Estado compartilhado
│   └── pages/
│       └── AiChatPage.tsx     # ✓ Usando ChatFullscreen
├── routes/
│   ├── ai-chat.tsx            # Route config
│   └── ai-chat.lazy.tsx       # Lazy component
└── layouts/
    └── DashboardLayout.tsx    # ✓ Sidebar com link AI Chat
```

### ✅ Critérios de Aceitação Detalhados

```yaml
scroll_functionality:
  - "[ ] Mensagens longas podem ser scrolladas"
  - "[ ] Auto-scroll ao receber nova mensagem"
  - "[ ] ConversationScrollButton aparece quando não está no bottom"
  - "[ ] Scroll suave (smooth behavior)"
  - "[ ] Funciona em mobile (touch scroll)"
  - "[ ] Funciona em desktop (mouse wheel + scrollbar visível)"

component_installation:
  - "[ ] Todos os 9 componentes AI SDK instalados sem erros"
  - "[ ] Tipos TypeScript corretos"
  - "[ ] Componentes exportados via index barrel"
  - "[ ] KokonutUI atualizado para versões compatíveis"

fullscreen_mode:
  - "[ ] Widget tem botão para expandir"
  - "[ ] Navega para /ai-chat mantendo mensagens"
  - "[ ] Fullscreen tem botão para minimizar (volta ao widget)"
  - "[ ] Estado persiste durante navegação"
  - "[ ] URL /ai-chat é bookmarkable"

sidebar_integration:
  - "[ ] Link 'AI Chat' visível na sidebar"
  - "[ ] Ícone apropriado (MessageSquare ou Sparkles)"
  - "[ ] Highlight quando na rota /ai-chat"
  - "[ ] Badge ou dot quando há chat ativo"

visual_quality:
  - "[ ] Tema claro/escuro funciona"
  - "[ ] Consistência visual com resto do app"
  - "[ ] Animações suaves (não abruptas)"
  - "[ ] Loading states claros"
```

---

## 🔧 Instruções de Comportamento

```yaml
acao_vs_sugestao:
  mode: "proativo"
  instruction: |
    Implemente as mudanças diretamente ao invés de apenas sugerir.
    Comece instalando os componentes via comandos CLI.
    Refatore os arquivos existentes preservando a lógica de negócio.
    Crie novos arquivos quando necessário (ChatContext, ChatFullscreen).

tool_usage:
  parallel: true
  instruction: |
    Execute múltiplas leituras de arquivo em paralelo.
    Após instalar componentes, verifique os arquivos gerados.
    Use git para criar checkpoints após cada fase.

format_output:
  style: "minimal"
  instruction: |
    Código TypeScript com tipos explícitos.
    Comentários apenas onde necessário para clareza.
    Nomes de variáveis em inglês, textos de UI em português.
```

---

## 📚 Referências de Documentação

### AI SDK Elements

```yaml
conversation:
  url: "https://ai-sdk.dev/elements/components/conversation"
  key_features:
    - "ConversationContent: wrapper para mensagens"
    - "ConversationScrollButton: auto-aparece quando não no bottom"
    - "ConversationEmptyState: placeholder inicial"
  example_usage: |
    <Conversation>
      <ConversationContent>
        {messages.map(m => <Message key={m.id} from={m.role}>...</Message>)}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>

prompt_input:
  url: "https://ai-sdk.dev/elements/components/prompt-input"
  key_features:
    - "PromptInputBody: container principal"
    - "PromptInputTextarea: auto-resize"
    - "PromptInputAttachments: file upload"
    - "PromptInputToolbar: botões de ação"
    - "PromptInputSubmit: status-aware button"
    - "PromptInputModelSelect: model picker"

response:
  url: "https://ai-sdk.dev/elements/components/response"
  key_features:
    - "Markdown rendering via Streamdown"
    - "GFM support (tables, task lists)"
    - "Math equations via KaTeX"
    - "parseIncompleteMarkdown para streaming"

reasoning:
  url: "https://ai-sdk.dev/elements/components/reasoning"
  key_features:
    - "Auto-open durante streaming"
    - "Auto-close quando termina"
    - "Visual indicator de streaming"
```

### KokonutUI

```yaml
ai_prompt:
  url: "https://kokonutui.com/docs/components/ai-prompt"
  install: "bunx --bun shadcn@latest add @kokonutui/ai-prompt"
  features: "Input estilizado com model selector integrado"

ai_loading:
  url: "https://kokonutui.com/docs/components/ai-loading"
  install: "bunx --bun shadcn@latest add @kokonutui/ai-loading"
  features: "Loading com steps visuais progressivos"

ai_input_search:
  url: "https://kokonutui.com/docs/components/ai-input-search"
  install: "bunx --bun shadcn@latest add @kokonutui/ai-input-search"
  features: "Input com modo de busca"
```

---

## ⚡ Comandos de Execução

```bash
# Fase 1: Instalação de componentes
cd D:\Coders\aegiswallet

# AI SDK Elements (executar um por vez se houver conflitos)
npx ai-elements@latest add context
npx ai-elements@latest add conversation
npx ai-elements@latest add image
npx ai-elements@latest add open-in-chat
npx ai-elements@latest add prompt-input
npx ai-elements@latest add reasoning
npx ai-elements@latest add response
npx ai-elements@latest add suggestion
npx ai-elements@latest add task

# KokonutUI (usar bun se disponível)
bunx --bun shadcn@latest add @kokonutui/ai-prompt
bunx --bun shadcn@latest add @kokonutui/ai-input-search
bunx --bun shadcn@latest add @kokonutui/ai-loading

# Verificar instalação
ls src/components/ai-elements/
ls src/components/kokonutui/

# Rodar testes após cada fase
pnpm test src/test/ai-chat/
```

---

## 🎯 Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHAT WIDGET REFACTORING                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PROBLEMA PRINCIPAL: Scroll não funciona no widget               │
│                                                                  │
│  SOLUÇÃO: Usar componente Conversation oficial do AI SDK         │
│                                                                  │
│  COMPONENTES A INSTALAR:                                         │
│  ┌─────────────────┬────────────────────────────────────────┐   │
│  │ AI SDK Elements │ context, conversation, image,          │   │
│  │                 │ open-in-chat, prompt-input, reasoning, │   │
│  │                 │ response, suggestion, task             │   │
│  ├─────────────────┼────────────────────────────────────────┤   │
│  │ KokonutUI       │ ai-prompt, ai-input-search, ai-loading │   │
│  └─────────────────┴────────────────────────────────────────┘   │
│                                                                  │
│  NOVAS FEATURES:                                                 │
│  ✓ Modo fullscreen via rota /ai-chat                            │
│  ✓ Link na sidebar                                               │
│  ✓ Botão expand no widget                                        │
│  ✓ Estado compartilhado via ChatContext                          │
│                                                                  │
│  ARQUIVOS PRINCIPAIS A MODIFICAR:                                │
│  - src/features/ai-chat/components/ChatConversation.tsx          │
│  - src/features/ai-chat/components/ChatWidget.tsx                │
│  - src/features/ai-chat/components/ChatContainer.tsx             │
│  - src/layouts/DashboardLayout.tsx (sidebar)                     │
│                                                                  │
│  NOVOS ARQUIVOS A CRIAR:                                         │
│  - src/features/ai-chat/context/ChatContext.tsx                  │
│  - src/features/ai-chat/components/ChatFullscreen.tsx            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Lembre-se**: Execute fase por fase, verificando funcionamento após cada uma. O scroll é a prioridade #1, pois afeta diretamente a usabilidade atual do widget.
