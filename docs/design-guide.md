# Frontend Design Skill Usage Guide

Este guia detalha como utilizar o comando `/design` e as skills integradas para criar interfaces de alta qualidade, seguindo os princípios de design do Portal Grupo US.

## Comando Central: `/design`

O comando `/design` é a porta de entrada para todas as tarefas de UI/UX. Ele orquestra o agente `@apex-ui-ux-designer` para utilizar uma suite de skills especializadas.

### Fluxo de Orquestração

1.  **Aesthetic Definition (Phase 1)**: Inicia com `@frontend-design` para estabelecer uma direção estética ousada (ex: Brutalista, Minimalista, Dark Gold).
2.  **Theming (Phase 2)**: Utiliza `@theme-factory` para criar ou aplicar um sistema de cores e tipografia profissional baseado na estética definida.
3.  **Asset Generation (Phase 3 - Paralelo)**:
    -   `@canvas-design`: Gera assets visuais estáticos (posters, logos, infográficos).
    -   `@algorithmic-art`: Gera fundos dinâmicos, padrões interativos ou visualizações de dados com p5.js.
4.  **Implementation (Phase 4)**:
    -   `@artifacts-builder`: Para protótipos complexos e interativos em um único arquivo HTML.
    -   Implementação Direta: Componentes React 19 + Tailwind v4 + shadcn/ui integrados ao projeto.

---

## Detalhamento das Skills

| Skill | Quando usar? | O que entrega? |
| :--- | :--- | :--- |
| **@frontend-design** | Ao definir o tom visual, princípios de UI e escolhas estéticas ousadas. | Direção conceitual, padrões CSS. |
| **@theme-factory** | Ao definir paletas de cores, sistemas de tipografia e consistência visual. | Variáveis CSS, pares de fontes. |
| **@algorithmic-art** | Para backgrounds generativos, data viz interativa ou animações de partículas. | HTML interativo p5.js. |
| **@canvas-design** | Para posters, logos, infográficos estáticos e branding. | PDF, PNG. |
| **@artifacts-builder** | Dashboards complexos, protótipos multi-página, demos independentes. | HTML React bundle. |

---

## Princípios de Design (Anti-AI Slop)

*   **Evite o Genérico**: Não use fontes padrão (Inter/Arial) ou gradientes roxos genéricos.
*   **Contraste e Hierarquia**: Use o tema Navy/Gold para criar interfaces elegantes e funcionais.
*   **Acessibilidade**: WCAG 2.1 AA é obrigatório. Touch targets de 44px+.
*   **Português**: Toda a interface deve estar em Português do Brasil.

## Exemplos de Uso

*   `/design "Crie uma dashboard brutalista para métricas de vendas"`
*   `/design "Identidade visual minimalista para clínica de estética"`
*   `/design "Background generativo de partículas para a landing page"`
