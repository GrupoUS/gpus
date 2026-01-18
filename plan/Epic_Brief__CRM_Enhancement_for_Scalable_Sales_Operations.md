# Epic Brief: CRM Enhancement for Scalable Sales Operations

## Summary

Grupo US operates a large-scale sales operation with 15+ vendedores managing health aesthetics education products (OTB 2025, NEON, TRINTAE3). The current CRM system, while functional, lacks critical capabilities needed to scale efficiently. Sales teams struggle with lead organization and prioritization, managers lack visibility into individual performance, and manual processes consume valuable selling time. This Epic addresses these systemic issues through eight strategic enhancements: a comprehensive tagging system for lead segmentation, structured objection tracking, individual vendor dashboards, product-specific pipeline views, referral and cashback management, active WhatsApp communication, intelligent automation, and customizable fields. These improvements will directly impact conversion rates, response times, team productivity, and management decision-making.

## Context & Problem

### Who's Affected

**Vendedores (15+ sales professionals)**
- Cannot efficiently organize or prioritize their growing lead portfolios
- Lack tools to segment leads by meaningful criteria (tags, objections, interests)
- Spend excessive time on manual follow-ups and communication
- Cannot track referrals or cashback incentives systematically
- Miss opportunities due to poor lead visibility across multiple products

**Gestores (Sales managers)**
- Have no visibility into individual vendor performance metrics
- Cannot identify coaching opportunities or performance bottlenecks
- Struggle to allocate resources effectively across products and vendors
- Lack data-driven insights for strategic decision-making
- Cannot monitor team activity or pipeline health in real-time

**Administradores (System administrators)**
- Cannot customize the CRM to match evolving business processes
- Lack flexibility to add fields or modify workflows without code changes
- Struggle to maintain system alignment with business needs
- Cannot configure automation rules for operational efficiency

### Where in the Product

The pain points span across multiple areas of the existing CRM platform:

- **Lead Management** (`file:src/components/crm/`, `file:convex/leads.ts`) - Lacks tagging, objection tracking, and advanced filtering
- **Dashboard** (`file:src/routes/_authenticated/dashboard.tsx`) - Shows only global metrics, no per-vendor views
- **Pipeline** (`file:src/components/crm/pipeline-kanban.tsx`) - Single unified view, no product-specific separation
- **Communication** (`file:convex/messages.ts`) - Passive message reception only, no active WhatsApp sending
- **Automation** (`file:convex/crons.ts`) - No lead reactivation or activity reminders
- **Data Model** (`file:convex/schema.ts`) - Missing referral tracking, custom fields, and structured objections

### Current Pain

**Lead Loss & Missed Opportunities**
- Leads fall through cracks due to poor organization and lack of follow-up reminders
- No systematic way to track why leads are lost (objections not structured)
- Referral opportunities not tracked, losing potential revenue and customer acquisition channels
- Leads stagnate in pipeline stages without automated reactivation

**Operational Inefficiency**
- Manual WhatsApp communication is time-consuming and inconsistent
- Vendors waste time searching for specific leads without proper filtering
- No automated reminders for scheduled activities or follow-ups
- Product-specific pipeline management requires manual filtering and mental overhead

**Visibility & Accountability Gaps**
- Managers cannot assess individual vendor performance or identify top performers
- No way to compare conversion rates, response times, or activity levels by vendor
- Team collaboration limited - cannot mention colleagues in activities or share context
- Cashback and referral programs not tracked, reducing incentive effectiveness

**Scalability Constraints**
- System cannot adapt to new business requirements without code changes
- Adding custom fields or modifying workflows requires developer intervention
- Growing team size (15+ vendors) amplifies all existing inefficiencies
- Complex operation needs flexible tooling that current rigid structure cannot provide

### Business Impact

The combination of these issues creates a compounding negative effect:
- **Revenue leakage** from lost leads and missed follow-ups
- **Reduced productivity** as vendors spend time on manual tasks instead of selling
- **Poor decision-making** due to lack of actionable insights
- **Scaling friction** as team growth amplifies existing inefficiencies
- **Competitive disadvantage** in a market where response time and personalization matter

## Success Metrics

The success of this Epic will be measured through a combination of metrics across different dimensions:

**Conversion & Revenue**
- Lead-to-customer conversion rate improvement
- Revenue per vendor increase
- Referral-generated revenue tracking
- Cashback program ROI

**Operational Efficiency**
- Average response time to new leads (target: reduction)
- Time spent on manual tasks (target: reduction)
- Leads managed per vendor per day (target: increase)
- Automated follow-ups executed vs. manual

**Visibility & Adoption**
- Manager dashboard usage frequency
- Per-vendor metric tracking accuracy
- Feature adoption rate by sales team (target: >80%)
- Custom field utilization by admins

**Lead Management Quality**
- Leads properly tagged and categorized (target: >90%)
- Objections documented per lead (target: increase)
- Pipeline stage accuracy and movement velocity
- Lead reactivation success rate

## Scope Boundaries

**In Scope**
- Eight core feature enhancements as defined in `file:plan/Plano de Execução Atualizado_ CEO Virtual Grupo US.md`
- Backend schema modifications and new Convex functions
- Frontend UI components and user interactions
- Integration with existing Evolution API for WhatsApp
- Automated workflows via cron jobs
- Role-based access and filtering

**Out of Scope**
- New third-party integrations beyond Evolution API
- Mobile app development (web-only)
- Advanced AI/ML features for lead scoring
- Complete CRM redesign or migration
- Changes to existing Clerk authentication or Asaas payment flows
- Production deployment and infrastructure changes

## Strategic Approach

Features will be implemented end-to-end (backend + frontend + integration) and grouped by complete functionality rather than technical layers. This ensures each feature delivers immediate value upon completion and allows for iterative validation with the sales team. The 1-month timeline accommodates a solo fullstack developer working systematically through all eight enhancements.