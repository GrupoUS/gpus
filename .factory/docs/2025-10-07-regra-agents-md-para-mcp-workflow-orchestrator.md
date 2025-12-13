# Especificação: Regra AGENTS.md para MCP Workflow Orchestrator

## 📋 Análise Completada

Baseada na análise dos modelos existentes e estrutura do projeto, vou criar uma regra `AGENTS.md` que servirá como orchestrator principal para coordenar MCPs e sub-agents no AegisWallet.

## 🎯 Localização e Estrutura

### **Arquivo:** `C:\Users\Admin\aegiswallet\.factory\AGENTS.md`

### **Conceito:**
Uma regra mestre que define como os MCPs devem ser orquestrados para executar tasks de forma eficiente, seguindo os padrões do AegisWallet e servindo como camada de orquestração inteligente.

## 🏗️ Estrutura Detalhada do AGENTS.md

### **1. Header e Filosofia**
- Baseado em `AGENTS.md` do projeto (modelo AegisWallet)
- Integration com metodologia A.P.T.E
- MCP-first orchestration philosophy

### **2. MCP Workflow Orchestration Framework**
```yaml
MCP_ORCHESTRATION_STRATEGY:
  primary_mcps:
    desktop-commander: "System operations, file management"
    serena: "Code analysis, symbol resolution"  
    context7: "Documentation research, best practices"
    chrome-devtools: "UI testing, performance validation"
    shadcn: "Component library management"
    sequential-thinking: "Cognitive task analysis"
```

### **3. Task Execution Workflow**
- **Phase 1**: Task Analysis (sequential-thinking)
- **Phase 2**: MCP Selection & Planning
- **Phase 3**: Coordinated Execution
- **Phase 4**: Quality Validation
- **Phase 5**: Integration & Documentation

### **4. MCP Coordination Patterns**
- Como selecionar o MCP certo para cada task
- Padrões de execução paralela vs sequencial
- Handoff protocols entre MCPs
- Error handling e fallback strategies

### **5. Integration com AegisWallet Standards**
- Technology stack compliance
- Security and performance standards
- Development workflow alignment
- Quality gates e validation criteria

### **6. Command Templates**
- Templates para comandos MCP específicos
- Exemplos de uso em contextos do AegisWallet
- Best practices para cada MCP

### **7. Troubleshooting & Debugging**
- Common MCP coordination issues
- Resolution strategies
- Performance optimization tips

## 🎮 Benefícios

1. **Centralização**: Single source of truth para MCP orchestration
2. **Otimização**: Uso eficiente dos recursos MCP disponíveis
3. **Consistência**: Padrões reutilizáveis e documentados
4. **Escalabilidade**: Framework para adicionar novos MCPs
5. **Manutenibilidade**: Documentação centralizada e fácil atualização

## 🔍 Validação

A regra será estruturada para ser:
- **Lida e seguida** pelos agentes do sistema
- **Referenciada** em execuções de tasks complexas
- **Atualizável** conforme novos MCPs são adicionados
- **Compatível** com a estrutura existente do projeto

Esta regra servirá como o "cérebro" da orquestração MCP, garantindo que cada task use as ferramentas certas da maneira certa.