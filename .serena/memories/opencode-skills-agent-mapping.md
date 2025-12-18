# OpenCode Skills → Subagents (GPUS)

## Objetivo
Reduzir “context pollution” desabilitando skills globalmente e habilitando apenas as skills necessárias por subagent.

## Princípios adotados
- `skills*` desabilitado no `opencode.json` e liberado apenas por agente.
- Cada agente recebe **somente** skills do seu domínio.
- Skills com nome em kebab-case viram tools em snake_case (`frontend-design` → `skills_frontend_design`).
- Preferência do plugin: `.opencode/skills/` (projeto) sobrescreve `~/.opencode/skills/` e `~/.config/opencode/skills/`.

## Skills presentes no projeto (via `.opencode/skills/`)
- `skills_ai_data_analyst`
- `skills_artifacts_builder`
- `skills_canvas_design`
- `skills_education_crm_compliance`
- `skills_frontend_design`
- `skills_product_management`
- `skills_theme_factory`
- `skills_vibe_coding`
- `skills_web_artifacts_builder`
- `skills_webapp_testing`
- `skills_xlsx`

## Mapeamento final (recomendado)

### `apex-dev` (implementação)
- Habilitar: `skills_vibe_coding`, `skills_education_crm_compliance`
- Por quê: construção rápida + guardrails LGPD/educação durante implementação.

### `apex-researcher` (pesquisa)
- Habilitar: `skills_ai_data_analyst`, `skills_xlsx`, `skills_education_crm_compliance`
- Por quê: análise/planejamento com suporte a dados e validação LGPD/educação.

### `apex-ui-ux-designer` (UI/UX)
- Habilitar: `skills_frontend_design`, `skills_canvas_design`, `skills_theme_factory`, `skills_web_artifacts_builder`, `skills_artifacts_builder`
- Por quê: UI/UX, estética, acessibilidade e construção de artifacts.

### `code-reviewer` (segurança/compliance)
- Habilitar: `skills_education_crm_compliance`
- Por quê: revisão LGPD/OWASP e padrões de proteção de dados.

### `database-specialist` (Convex)
- Habilitar: `skills_ai_data_analyst`, `skills_xlsx`, `skills_education_crm_compliance`
- Por quê: análise de dados + conformidade LGPD ao modelar/alterar schema e funções.

### `product-architect` (PRD/doc)
- Habilitar: `skills_product_management`
- Por quê: PRDs e documentação orientada a produto.

## Notas operacionais
- A skill `skill-creator` foi **intencionalmente não habilitada** para evitar que agentes gerem/alterem skills sem pedido explícito.
- Após mudanças em `opencode.json` / skills, é necessário **reiniciar o OpenCode** (o plugin não tem hot reload).

## Troubleshooting (ambiente Windows)
- Validadores Python em `.factory/skills/scripts/` podem falhar por:
  - `ModuleNotFoundError: No module named 'yaml'` (dep opcional).
  - `UnicodeEncodeError` no console cp1252 (uso de símbolos como ✅/❌). Use `PYTHONUTF8=1` ou rode em terminal UTF-8.
