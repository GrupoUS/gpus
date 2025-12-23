# Coordination Prompt Improvement - 2025-12-17

## Summary
Melhorado o @.opencode\prompts\build.txt para coordenação efetiva de agentes sem exceder janela de contexto.

## Problemas Identificados

### 1. Build.txt Original (59 linhas)
- Muito simplificado, sem lógica de coordenação
- Não cobria todos os 6 agentes do projeto
- Faltava matriz de decisão clara
- Sem protocolo de contexto

### 2. Factory AGENTS.md (625 linhas)
- Extremamente detalhado mas verboso
- Workflows complexos demais
- Risco de exceder janela de contexto
- Dificil de usar na prática

## Solução Implementada

### Novo Build.txt (150 linhas)
- Redução de 75% no tamanho (625 → 150 linhas)
- Mantém inteligência do factory AGENTS.md
- Estrutura clara e acionável
- Matriz de decisão YAML
- Protocolo de contexto completo

## Melhorias Principais

### 1. Estrutura Simplificada
- Seções claras com cabeçalhos emoji
- Tabelas para referência rápida
- YAML para configurações

### 2. Matriz de Decisão Clara
```yaml
roteamento_imediato:
  comandos_pesquisa:
    triggers: ["/research", "/pesquisar"]
    action: "IMEDIATO apex-researcher"
```

### 3. Protocolo de Contexto
- **Antes**: Checklist de 3-5 itens
- **Durante**: Template markdown
- **Após**: Atualização de estado

### 4. Níveis de Escalação (1-5)
- Definições claras por nível
- Tempos estimados
- Fluxo de decisão

### 5. Comandos Rápidos
- Templates prontos para copiar/colar
- Exemplos específicos
- Nomenclatura consistente

## Agentes Cobertos

1. ✅ apex-dev - Implementação
2. ✅ apex-researcher - Pesquisa
3. ✅ database-specialist - Convex
4. ✅ apex-ui-ux-designer - UI/UX
5. ✅ code-reviewer - Segurança
6. ✅ product-architect - Docs

## Validação

### Critérios de Sucesso
- [x] <200 linhas
- [x] Todos os 6 agentes cobertos
- [x] Matriz de decisão clara
- [x] Protocolo de contexto definido
- [x] Compatível OpenCode

### Teste de Coordenação
- [ ] Simular handoff entre agentes
- [ ] Verificar preservação de contexto
- [ ] Validar roteamento automático

## Trade-offs

### Reduzido
- Workflows teóricos detalhados
- Exemplos complexos
- Documentação extensa de casos de borda

### Mantido
- Inteligência de orquestração
- Capacidade de escalarão
- Integração MCP
- Compliance brasileira

## Recomendações

1. **Usar o novo build.txt** para todas as coordenações
2. **Monitorar contexto** entre transições de agente
3. **Ajustar conforme feedback** do uso prático
4. **Documentar casos de uso** em memory files

## Arquivos Criados

- `build-original.txt` - Backup do original
- `build.txt` - Versão melhorada (ativa)
- `coordination-prompt-improvement-2025-12-17.md` - Este documento

---

**Status**: Implementação completa
**Próximo**: Testar coordenação prática com cenário real