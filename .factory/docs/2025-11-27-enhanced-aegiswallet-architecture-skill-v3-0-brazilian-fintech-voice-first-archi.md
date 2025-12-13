# Enhanced AegisWallet Architecture Skill Specification v3.0 - Brazilian Fintech Voice-First Assistant

## Purpose

Especializar a skill AegisWallet architecture skill para resolver problemas técnicos, implementar melhorias de performance, e manter conformidade com compliance brasileira, usando documentação atual, MCP tools, e padrões otimizados para cada área específica.

## Enhanced Capabilities

### 🎯 Core Architecture Expertise (mantém)
- **Voice-First Design**: Interfaces conversacionais brasileiras com 95%+ precisão de reconhecimento
- **Performance Optimization**: Estratégias para sub-200ms tempo de resposta
- **Database Architecture**: Supabase com PostgreSQL + RLS para tenant isolation
- **API Architecture**: Hono RPC com tRPC type-safe procedures
- **Real-time Sync**: Supabase Realtime subscriptions + TanStack Query
- **Component Architecture**: React 19 + TypeScript strict mode com validação Zod

### 🇧🇧 Brazilian Financial Systems (novo foco)
- **PIX Integration**: Implementar fluxos PIX com BCB Circular No 4.015
- **Boleto Processing**: Geração e pagamento de boletos com clareza automática
- **Open Banking**: APIs do Open Banking Brasil (API Spec 3.1, circular 4.842)
- **LGPD Compliance**: Implementar Art. 9 do LGPD para dados financeiros brasileiros
- **PIX Security**: Implementar verificação de fraude PIX com padrões BCB
- **Currency**: Formatação BRL com padrões brasileiros

### 🔒 Security & Compliance
- **LGPD Compliance**: Implementar Art. 9 do LGPD para dados financeiros
- **Data Masking**: Mascaramento de CPF, telefone, email
- **Audit Trails**: Logs completos para auditoria financeira
- **Encryption**: AES-256 + TLS 1.3 para dados em trânsito
- **RLS Policies**: Políticas de acesso por usuário para dados financeiros

### 📊 Performance Optimization (Hono RPC Focus)
- **Sub-200ms**: Resposta de voz em ≤200ms (reduzido de 1 segundo)
- **Bundle Size**: Otimizar tamanho do bundle para <200KB
- **Lazy Loading**: Carregar componentes não críticos sob demanda
- **Edge Deployment**: Aprove via Cloudflare Workers para latência <50ms

### 🌊️ Enhanced NLU System
- **Regional Variations**: Suporte a 6 variações de português brasileiro
- **Learning Loop**: Ajuste modelos com feedback do usuário
- **Error Recovery**: Multi-estratégia de recuperação de erros
- **Analytics**: Análise hit/miss por região e tipo de comando
- **Confidence Scoring**: Mantém confiança ≥ 80-95%

### 🔧 Development Best Practices
- **TDD Methodology**: Usar testes unidade before implementar novas features
- **Type Safety**: TypeScript strict mode com 100% validação
- **Review**: Code review obrigatório para mudanças estruturais
- **Documentation**: Manter documentação em docs/ para referência
- **Security**: Considerar implicações de segurança de pagamento antes de mover para produção

## 🚀 MCP Integration

### MCP Servers para Consulta
- **context7**: Para documentação oficial do Framework
- **tavily**: Para pesquisa de melhores práticas
- **serena**: Para análise semântica do código fonte
- **tavily**: Para dados de mercado e tendências

### Expert MCP Services Disponíveis
- **apex-researcher**: Brazilian regulations, fintech market analysis
- **product-architect**: Complex architecture design and review
- **code-reviewer**: Security and LGPD validation
- **test-auditor**: Quality assurance with Brazilian compliance
- **stuck**: Human escalation para problemas não resolvidos

## ⚠️ Progressive Enhancement Plan

### Phase 1: Current Documentation Gap Analysis
**Gap Identified**: A skill atual tem foco principal em arquitetura geral, precisando aprofundamento em documentação específica para resolver problemas reais.

**Priority Gaps**:
1. **Voice Interface Integration**: Falta de integração com hooks de voz existentes
2. **Database Performance**: Verificação de otimização de queries e indexes
3. **API Error Patterns**: Verificação de patterns de tratamento de erro
4. **Real-time Optimization**: Verificação de problemas de sincronização
5. **Mobile Performance**: Verificação de otimização mobile
6. **Accessibility**: Verificação de padrões WCAG

### Phase 2: References & Examples Enhancement
1. **References Rich Repository**: Mover referências de documentação existentes em `docs/architecture/` com conteúdo específico
2. **Example Gallery**: Criar exemplos práticos de código para problemas comuns
3. **Template Expansion**: Expandir templates existentes em `assets/templates/` para cobrir gaps
4. **Script Enhancement**: Ajustar scripts de validação para detectar problemas específicos
5. **Component Examples**: Criar exemplos funcionais de componentes voice-first

### Phase 3: Enhanced Validation Scripts
1. **Performance Monitoring**: Scripts de verificação contínua de performance
2. **Pattern Detection**: Scripts que identificam padrões problemáticos
3. **Alert Generation**: Alertas automatizados para problemas críticos
4. **Health Checks**: Scripts que verificam integridade do sistema

### Phase 4: Documentation Sync
1. **Create Update**: Sincronizar SKILL.md com referências existentes
2. **Add Examples**: Expandir example gallery com exemplos específicos
3. **Update Templates**: Melhorar templates de código para novas funcionalidades
4. **Cross-Reference**: Referenciar docs/ sempre que documentação esteja atualizada

## 🎯 Enhancement Implementation Plan

### Phase 1: Documentation Sync
1. **Update SKILL.md**: Referenciar a documentação existente
2. **Quick Start**: Explicar指南 rápido para problemas específicos
3. **Reference Links**: Adicionar links para docs/architecture/ relevant files
4. **Update Examples**: Criar exemplos específicos para problemas de implementação

### Phase 2: Templates & Examples
1. **Code Templates**: Criar templates padrão para problemas comuns
2. **Component Examples**: Criar exemplos de componentes funcionais para problemas específicos
3. **Examples Gallery**: Criar exemplos de workflows completos
4. **Integration Examples**: Criar exemplos de integração complexa

### Phase 3: Enhanced Scripts
1. **Enhanced Validation**: Melhorar scripts para detectar problemas específicos
2. **Pattern Detection**: Identificar padrões de código ruins
3. **Auto-Remediation**: Corrigir problemas automaticamente quando detectados

### Phase 4: Knowledge Base Integration
1. **Research**: Usar Context7 MCP para pesquisa
2. **Research**: Usar Tavily para informações brasileiras
3. **Incorporate**: Integrar informações de mercado brasileiro na skill

## 📊 Usage Examples

### Voice First Assistente Troubleshooting
```
Quando: "Como melhoro o desempenho do meu balanço?"

Resposta: Use "services/voiceRecognition.ts" para treinar performance de voz.\n\nVerificar "scripts/performance_audit.py --directory ." para verificar otimização de voz."
```

### Performance Diagnosis
```
Quando: "A autentia está demorando 2+ segundos para responder comandos de voz"

Resposta: Use "services/performance_audit.py --directory ." e "services/voiceRecognition.ts" para diagnóstico:\n  \n
\nVerifique se VITE_ENABLE_VOICE_REASONING está desabilitado (as the reasoning will be omitted)\nVerifique se o microfone está em modo silencioso ou "não operacional"
\nVerificar se há sobrecarga de processamento ou problemas de reconhecimento"
```

### Error Recovery Commands
```
Quando: "Sistema não está respondendo ou deu erro"

Resposta: Use \n{\n    scripts/emergency-recovery.sh\n} para diagnóstico completo do sistema:
    \n- Verifique se a API está ativa (curl http://localhost:3000/health)\n    \n- Verifique se o Hono server está rodando (node_modules/node_modules/start.sh restart)\n    \n- Verifique se o Supabase service está ativo (via status)\n    \n- Use scripts/emergency-recovery.sh --help for help específico\n"
```

### Architecture Consulting
```
Quando: "Preciso implementar PIX com Hono RPC"

Resposta: "Consulte docs/architecture/hono-rpc-patterns.md para padrões detalhados:\n- Endpoint structure: `/api/v1/pix/transfer`\n- Validation: zValidator + authMiddleware\n- Error handling com formato JSON padronizado\n- Rate limiting implementado para PIX por segurança\n\n- Segurança: duas autenticações (senha + biometria)
```

## 📚� Quality Assurance Checklist

### Before Each Implementation
- [ ] **Testes unitários**: Todos os testes passam em CodeMock API
- [ ] **Type Safety**: TypeScript strict mode sem erros significativos
- [ ] **Performance**: Benchmarks passados em ambiente local
- [ ] **Security**: Análise de vulnerabilidades de segurança
- [ ] **Testes E2E**: Fluxos completos em Playwright
- [ ] **Auditoria**: Validação de qualidade e compliance

### After Each Implementation
- [ ] **Code Review**: Verificar código quality e compliance
- [ ] **Validation**: Verificar com scripts de validação
- [ ] **Testing**: Executar testes de qualidade
- [ ] **Documentation**: Atualizar documentação se necessário

---

## 💡 Data Source of Truth

### Primary Sources
- **docs/****: Referências técnicas existentes em docs/architecture/
  - architecture.md (visão)
  - tech-stack.md (especificações de tecnologia)
  - hono-rpc-patterns.md (padrões Hono RPC)
  - voice-interface-patterns.md (padrões de voz)
  - ai-chat-architecture.md (arquitetura conversacional)
  - frontend-spec.md (especificações de frontend)
  - LGPD_COMPLIANCE_TESTING_PENDING.md (compliance status)
  - VERCEL_DEPLOYMENT_GUIDE.md (implantação Vercel)

### MCP Tools
- **Context7**: Pesquisa de documentação oficial
- **Tavily**: Análise tendências de mercado e regulatórias brasileiras
- **Serena**: Análise código-fonte para arquitetura semântica

### External References
- **Factory AI Docs**: Best practices para criação e manutenção de skills
- **Google AI**: Documentação do VertexAI para modelos
- **Web Standards**: WCAG 2.1 AA compliance

## 📊 Execute Implementation Plan

### Phase 1: Sync Documentation (1-2 dias)
1. Análise a skill atual vs. documentação docs
2. Identificar gaps específicos e áreas para melhoria
3. Criar referências para docs específicas que faltam

### Phase 2: Enrich References (2-3 dias)
1. Mover conteúdo de docs/architecture/* para referência
2. Criear referências específicas sobre Hono RPC e PIX
3. Criar referências sobre LGPD compliance

### Phase 3: Create Enhanced Scripts (1-3 dias)
1. Aprimorar scripts de validação para detectar problemas específicos
2. Adicionar validação de compliance brasileira
3. Criar exemplos específicos de problemas financeiros brasileiros
4. Implementar auditoria de performance contínua

### Phase 4: Create Examples (3-4 dias)
1. Criar exemplos práticos de problemas financeiros brasileiros
2. Criar exemplos de otimização de performance
3. Criar exemplos de integração Open Banking
4. Criar exemplos de LGPD data handling

## 🔍 Validation Criteria

### Success Indicators
- **Score Final**: 95+ pontos de validação total
- **All Checklists**: 100% das verificações obrigatórias passam
- **Coverage**: Todos os exemplos funcionam em ambiente local
- **Performance**: Scripts detectam todos os problemas específicos corretamente
- **Documentation**: SKILL.md com referências completas e atualizadas

### Maintenance Requirements
- **Monthly**: Atualizar documentação com evolução do projeto
- **Quarterly**: Reavaliar scripts com novos problemas detectados
- **User Feedback**: Incorporar sugestões de melhorias continuas

---

**Status**: Pronto para implementação  
**Estimated Time**: 10-14 dias  
**Impact**: Transformar skill de arquitetura genérica para especialista em resolução de problemas brasileiros

---

**MCP Connection**: Use MCP tools (serena, context7) para pesquisa de informações atualizadas quando necessário para resolver problemas específicos que exigem conhecimento de mercado brasileiro.