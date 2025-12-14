# GPU Project - Portal Grupo US

## Project Purpose
Portal de gerenciamento para o ecossistema educacional de Saúde Estética do Grupo US, incluindo:
- CRM com pipeline visual para SDRs
- Gestão de alunos com histórico e indicadores de churn
- Chat integrado com WhatsApp e IA (Dify)
- Dashboard de métricas em tempo real
- Autenticação e controle de acesso por roles (admin, sdr, cs, support)

## Tech Stack
- **Runtime**: Bun (package manager e runtime)
- **Frontend**: React 19 + Vite
- **Routing**: TanStack Router (type-safe routing)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Authentication**: Clerk (RBAC com roles)
- **Backend**: Convex (Database + API + Real-time)
- **Forms**: react-hook-form + zod
- **Icons**: lucide-react
- **Charts**: recharts
- **Drag & Drop**: @dnd-kit/core
- **Testing**: Vitest
- **Linting/Formatting**: Biome

## Key Products
- TRINTAE3 (curso principal)
- Black NEON
- OTB MBA
- Comunidade US
- Aurículo
- Na Mesa Certa

## Business Context
- Transformação de "Profissional Abandonado" em "Empresário da Saúde Estética"
- Faturamento mensal ~R$ 250.000
- Ticket médio TRINTAE3 ~R$ 18.000 (12x)
- Modelo de vendas perpétuo (não usa lançamentos)
- Foco em diagnóstico (dor + desejo) antes de apresentar solução