# ═══════════════════════════════════════════════════════════════════════════════
# ONE-SHOT PRP: CRM Enhancement for Scalable Sales Operations
# GPUS - Grupo US Educational Platform
# ═══════════════════════════════════════════════════════════════════════════════

```yaml
metadata:
  complexity: "L7 — Multi-feature system enhancement with 8 new tables, 35+ Convex functions, 2 cron jobs, and comprehensive UI components across CRM, Dashboard, and Settings"
  estimated_time: "4-5 days (solo fullstack developer)"
  parallel_safe: false
  version: "PRP-v5.0"
  project: "GrupoUS/gpus"
```

---

## SECTION 1: ROLE & OBJECTIVE

```yaml
role: "Senior Full-Stack TypeScript Developer"
expertise_areas:
  - "Convex reactive database architecture"
  - "React 19 with TanStack Router v1"
  - "shadcn/ui component patterns"
  - "Multi-tenant SaaS applications"
  - "LGPD compliance for Brazilian market"
  - "WhatsApp Business API integrations"

objective:
  task: "Implement 8 CRM enhancement features end-to-end (backend + frontend + integrations) to enable scalable sales operations for 15+ vendors managing health aesthetics education products"
  
  context: |
    Grupo US operates a large-scale sales operation with products including OTB 2025, NEON, and TRINTAE3.
    The current CRM system lacks critical capabilities: lead segmentation (tags), objection tracking,
    individual vendor dashboards, product-specific pipelines, referral management, active WhatsApp
    communication, automation, and customizable fields.
    
  why_this_matters: |
    - Revenue: R$500k/month pipeline depends on vendor efficiency
    - 15+ vendors struggle with lead organization and prioritization
    - Managers have zero visibility into individual performance
    - Manual processes consume valuable selling time
    - Lead loss from poor follow-up and no automated reactivation
```

---

## SECTION 2: TECHNICAL CONTEXT

```yaml
environment:
  runtime: "Bun 1.1.x"
  framework: "React 19, TanStack Router v1"
  database: "Convex (reactive, serverless)"
  auth: "Clerk (multi-tenant with organizationId)"
  ui: "shadcn/ui + Tailwind CSS"
  testing: "Vitest + Testing Library"
  external_api: "Evolution API (WhatsApp)"
  payments: "Asaas (already integrated)"

relevant_files:
  must_read:
    - path: "convex/schema.ts"
      relevance: "Current database schema - all 8 new tables must follow existing patterns"
    - path: "convex/leads.ts"
      relevance: "Existing lead CRUD - extend with tags, objections, referrals"
    - path: "convex/activities.ts"
      relevance: "Timeline system - integrate new activity types"
    - path: "convex/crons.ts"
      relevance: "Existing cron jobs - add lead reactivation and task reminders"
    - path: "convex/lib/auth.ts"
      relevance: "Authentication helpers - use requireAuth pattern"
    - path: "convex/integrations.ts"
      relevance: "Integrations config - Evolution API credentials storage"
    - path: "src/components/crm/pipeline-kanban.tsx"
      relevance: "Kanban component - add product tabs and tag filtering"
    - path: "src/components/crm/lead-detail.tsx"
      relevance: "Lead detail sheet - add Tags, Objections, Tasks tabs"
    - path: "src/components/crm/lead-filters.tsx"
      relevance: "Filter popover - add tag filter section"
    - path: "src/routes/_authenticated/dashboard.tsx"
      relevance: "Dashboard page - add vendor selector for managers"
    - path: "src/routes/_authenticated/crm.tsx"
      relevance: "CRM page - add product tabs"
      
  may_reference:
    - path: "convex/users.ts"
      relevance: "User queries for vendor selector and mentions"
    - path: "convex/metrics.ts"
      relevance: "Dashboard metrics - extend for per-vendor filtering"
    - path: "convex/messages.ts"
      relevance: "Message storage - extend for WhatsApp sending"
    - path: "src/components/ui/"
      relevance: "shadcn components available"

existing_patterns:
  naming_conventions: |
    - Functions: camelCase (createLead, updateLeadStage)
    - Components: PascalCase (LeadDetail, PipelineKanban)
    - DB fields: camelCase (organizationId, createdAt)
    - Indexes: by_[field] or by_[field1]_[field2]
    
  file_structure: |
    - convex/[entity].ts for queries/mutations
    - convex/lib/[util].ts for helpers
    - src/components/[feature]/[component].tsx
    - src/routes/_authenticated/[page].tsx
    
  error_handling: |
    - Backend: throw new Error() with descriptive messages
    - Frontend: toast notifications via sonner
    - ErrorBoundary for component crashes
    
  state_management: |
    - Convex reactive queries (useQuery, useMutation, useAction)
    - Local state via useState for forms
    - URL state for filters via TanStack Router
    
  multi_tenant_pattern: |
    All tables include organizationId field with by_organization index.
    Queries filter by organizationId from auth context.
    
  auth_pattern: |
    const identity = await requireAuth(ctx);
    const organizationId = identity.org_id;
    const userRole = identity.org_role;
    const userId = identity.subject;

constraints:
  non_negotiable:
    - "LGPD compliance: All new tables must include organizationId for data isolation"
    - "No breaking changes to existing Convex schema migrations"
    - "Maintain backward compatibility with existing API consumers"
    - "All queries must use indexes (no full table scans)"
    - "Role-based access: vendors see only their data, managers see all"
    - "Evolution API credentials stored encrypted in integrations table"
    
  preferences:
    - "Prefer Convex queries over custom fetch calls"
    - "Use existing shadcn components before creating new ones"
    - "Follow existing component patterns in src/components/crm/"
    - "Use toast notifications for user feedback"
    - "Implement optimistic updates where possible"
```

---

## SECTION 3: CHAIN OF THOUGHT PROCESS

```yaml
chain_of_thought:
  research:
    checklist:
      - "Codebase patterns: ✓ Reviewed convex/leads.ts, convex/activities.ts for CRUD patterns"
      - "Official docs: ✓ Convex indexes, Evolution API, Clerk roles"
      - "Security: ✓ LGPD requirements, multi-tenant isolation"
      - "Edge cases: ✓ Duplicate tags, race conditions in cashback, deleted referrers"
    
  analyze:
    requirements:
      - "8 features: Tags, Objections, Dashboard/Vendor, Pipeline/Product, Referrals, WhatsApp, Automation, Custom Fields"
      - "8 new tables + 3 modified tables (leads, integrations, settings)"
      - "~35 new Convex functions (queries, mutations, actions)"
      - "2 new cron jobs (lead reactivation, task reminders)"
      - "10+ new UI components"
      
    technical_constraints:
      - "Convex doesn't support SQL joins - must use multiple queries"
      - "Evolution API is shared - need rate limiting per organization"
      - "Custom fields use EAV pattern - v.any() requires backend validation"
      
  think:
    tree_of_thoughts:
      approach_a:
        description: "Implement features layer-by-layer (all backend, then all frontend)"
        pros: ["Easier to review", "Can parallelize UI work"]
        cons: ["No immediate value", "Hard to validate end-to-end"]
        viability_score: 2
        
      approach_b:
        description: "Implement features end-to-end (backend + frontend per feature)"
        pros: ["Immediate value per feature", "Easier validation", "Can ship incrementally"]
        cons: ["Context switching between layers"]
        viability_score: 5
        
      selected_approach: "approach_b"
      rationale: "Each feature delivers immediate value. Allows iterative validation with sales team. Aligns with Epic Brief strategy."
```

---

## SECTION 4: DATA MODEL (New Tables)

```yaml
new_tables:
  tags:
    description: "Organization-wide tag definitions"
    fields:
      name: "v.string()"
      color: "v.optional(v.string())"
      organizationId: "v.string()"
      createdBy: "v.string()"
      createdAt: "v.number()"
    indexes:
      - "by_organization: ['organizationId']"
      - "by_organization_name: ['organizationId', 'name']"
      
  leadTags:
    description: "Many-to-many junction table for lead-tag associations"
    fields:
      leadId: "v.id('leads')"
      tagId: "v.id('tags')"
      organizationId: "v.string()"
      addedBy: "v.string()"
      addedAt: "v.number()"
    indexes:
      - "by_lead: ['leadId']"
      - "by_tag: ['tagId']"
      - "by_organization: ['organizationId']"
      
  objections:
    description: "Structured objection records for analytics"
    fields:
      leadId: "v.id('leads')"
      objectionText: "v.string()"
      organizationId: "v.string()"
      recordedBy: "v.string()"
      recordedAt: "v.number()"
      resolved: "v.optional(v.boolean())"
      resolution: "v.optional(v.string())"
    indexes:
      - "by_lead: ['leadId']"
      - "by_organization: ['organizationId']"
      - "by_lead_recorded: ['leadId', 'recordedAt']"
      
  tasks:
    description: "Actionable tasks with due dates and mentions"
    fields:
      description: "v.string()"
      leadId: "v.optional(v.id('leads'))"
      studentId: "v.optional(v.id('students'))"
      dueDate: "v.optional(v.number())"
      completed: "v.boolean()"
      completedAt: "v.optional(v.number())"
      mentionedUserIds: "v.optional(v.array(v.string()))"
      organizationId: "v.string()"
      createdBy: "v.string()"
      assignedTo: "v.optional(v.string())"
      createdAt: "v.number()"
      updatedAt: "v.number()"
    indexes:
      - "by_lead: ['leadId']"
      - "by_organization: ['organizationId']"
      - "by_assigned_to: ['assignedTo']"
      - "by_due_date: ['dueDate']"
      - "by_organization_due_date: ['organizationId', 'dueDate']"
      
  customFields:
    description: "Field definitions (metadata)"
    fields:
      name: "v.string()"
      fieldType: "v.union(v.literal('text'), v.literal('number'), v.literal('date'), v.literal('select'), v.literal('multiselect'), v.literal('boolean'))"
      entityType: "v.union(v.literal('lead'), v.literal('student'))"
      required: "v.boolean()"
      options: "v.optional(v.array(v.string()))"
      organizationId: "v.string()"
      createdBy: "v.string()"
      createdAt: "v.number()"
      active: "v.boolean()"
    indexes:
      - "by_organization_entity: ['organizationId', 'entityType']"
      - "by_organization: ['organizationId']"
      
  customFieldValues:
    description: "Field values (data) - EAV pattern"
    fields:
      customFieldId: "v.id('customFields')"
      entityId: "v.string()"
      entityType: "v.union(v.literal('lead'), v.literal('student'))"
      value: "v.any()"
      organizationId: "v.string()"
      updatedBy: "v.string()"
      updatedAt: "v.number()"
    indexes:
      - "by_entity: ['entityId', 'entityType']"
      - "by_custom_field: ['customFieldId']"
      - "by_organization: ['organizationId']"
      
  organizationSettings:
    description: "Per-organization settings including cashback config"
    fields:
      organizationId: "v.string()"
      cashbackAmount: "v.number()"
      cashbackType: "v.union(v.literal('fixed'), v.literal('percentage'))"
      updatedAt: "v.number()"
    indexes:
      - "by_organization: ['organizationId']"
      
  apiRateLimits:
    description: "Rate limiting for Evolution API per organization"
    fields:
      organizationId: "v.string()"
      apiName: "v.string()"
      callsThisMinute: "v.number()"
      lastResetAt: "v.number()"
    indexes:
      - "by_organization_api: ['organizationId', 'apiName']"

modified_tables:
  leads:
    new_fields:
      referredById: "v.optional(v.id('leads'))"
      cashbackEarned: "v.optional(v.number())"
      cashbackPaidAt: "v.optional(v.number())"
    new_indexes:
      - "by_referred_by: ['referredById']"
      - "by_organization_assigned_to: ['organizationId', 'assignedTo']"
```

---

## SECTION 5: ATOMIC TASKS

```yaml
# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1: FOUNDATION (Schema + Core Queries)
# ═══════════════════════════════════════════════════════════════════════════════

atomic_tasks:
  - id: "AT-001"
    title: "Add new tables to Convex schema"
    phase: 1
    priority: "critical"
    dependencies: []
    parallel_safe: true
    estimated_time: "30 minutes"
    implementation:
      files_to_modify: ["convex/schema.ts"]
      steps:
        - "Add tags table with indexes"
        - "Add leadTags junction table"
        - "Add objections table"
        - "Add tasks table"
        - "Add customFields table"
        - "Add customFieldValues table"
        - "Add organizationSettings table"
        - "Add apiRateLimits table"
        - "Add referredById, cashbackEarned, cashbackPaidAt to leads table"
        - "Add by_organization_assigned_to index to leads table"
      validation: "npx convex dev --typecheck"
      rollback: "git checkout convex/schema.ts"
    acceptance_criteria:
      - "Schema passes typecheck"
      - "All indexes defined correctly"
      - "No breaking changes to existing tables"

  - id: "AT-002"
    title: "Create convex/tags.ts with CRUD operations"
    phase: 1
    priority: "critical"
    dependencies: ["AT-001"]
    parallel_safe: true
    estimated_time: "45 minutes"
    implementation:
      files_to_create: ["convex/tags.ts"]
      functions:
        - "listTags(organizationId) - query"
        - "getLeadTags(leadId) - query"
        - "searchTags(organizationId, query) - query"
        - "createTag(name, color) - mutation"
        - "addTagToLead(leadId, tagId) - mutation"
        - "removeTagFromLead(leadId, tagId) - mutation"
        - "deleteTag(tagId) - mutation (admin only)"
      validation: "bun run typecheck"
      rollback: "rm convex/tags.ts"
    acceptance_criteria:
      - "All functions use requireAuth"
      - "All queries filter by organizationId"
      - "Duplicate tag names prevented"
      - "Activities logged for tag operations"

  - id: "AT-003"
    title: "Create convex/objections.ts with CRUD operations"
    phase: 1
    priority: "critical"
    dependencies: ["AT-001"]
    parallel_safe: true
    estimated_time: "30 minutes"
    implementation:
      files_to_create: ["convex/objections.ts"]
      functions:
        - "listObjections(leadId) - query"
        - "getObjectionStats(organizationId, period) - query"
        - "addObjection(leadId, objectionText) - mutation"
        - "updateObjection(objectionId, updates) - mutation"
        - "deleteObjection(objectionId) - mutation"
        - "markObjectionResolved(objectionId, resolution) - mutation"
      validation: "bun run typecheck"
      rollback: "rm convex/objections.ts"
    acceptance_criteria:
      - "Objections ordered chronologically"
      - "Stats query supports period filtering"
      - "Activities logged for objection operations"

  - id: "AT-004"
    title: "Create convex/tasks.ts with CRUD and reminders"
    phase: 1
    priority: "critical"
    dependencies: ["AT-001"]
    parallel_safe: true
    estimated_time: "45 minutes"
    implementation:
      files_to_create: ["convex/tasks.ts"]
      functions:
        - "listTasks(leadId?, assignedTo?, dueDate?) - query"
        - "getTasksDueToday(organizationId) - query (internal)"
        - "getMyTasks(userId) - query"
        - "createTask(description, leadId?, dueDate?, mentionedUserIds?) - mutation"
        - "updateTask(taskId, updates) - mutation"
        - "completeTask(taskId) - mutation"
        - "deleteTask(taskId) - mutation"
      validation: "bun run typecheck"
      rollback: "rm convex/tasks.ts"
    acceptance_criteria:
      - "Tasks support lead/student association"
      - "Mentioned users stored correctly"
      - "Due date filtering works"

  - id: "AT-005"
    title: "Create convex/customFields.ts with EAV pattern"
    phase: 1
    priority: "high"
    dependencies: ["AT-001"]
    parallel_safe: true
    estimated_time: "1 hour"
    implementation:
      files_to_create: ["convex/customFields.ts"]
      functions:
        - "listCustomFields(entityType) - query"
        - "getCustomFieldValues(entityId, entityType) - query"
        - "createCustomField(name, fieldType, entityType, required, options?) - mutation (admin)"
        - "updateCustomField(fieldId, updates) - mutation (admin)"
        - "deleteCustomField(fieldId) - mutation (admin, soft delete)"
        - "setCustomFieldValue(entityId, entityType, customFieldId, value) - mutation"
        - "validateCustomFieldValue(customFieldId, value) - internal mutation"
      validation: "bun run typecheck"
      rollback: "rm convex/customFields.ts"
    acceptance_criteria:
      - "Type validation for each field type"
      - "Required field validation"
      - "Options validation for select types"
      - "Admin-only for field definitions"

  - id: "AT-006"
    title: "Extend convex/leads.ts with referral and dashboard support"
    phase: 1
    priority: "critical"
    dependencies: ["AT-001"]
    parallel_safe: true
    estimated_time: "1 hour"
    implementation:
      files_to_modify: ["convex/leads.ts"]
      changes:
        - "Add referredById to create/update mutations"
        - "Modify updateLeadStage to trigger cashback calculation"
        - "Add getReferralStats(leadId) query"
        - "Add getMyReferrals(userId) query"
        - "Modify listLeads to support tags filter"
        - "Add calculateCashback internal mutation"
      validation: "bun run typecheck"
      rollback: "git checkout convex/leads.ts"
    acceptance_criteria:
      - "Cashback calculated atomically on stage change"
      - "Null check for deleted referrers"
      - "Tags filter uses junction table"

  - id: "AT-007"
    title: "Extend convex/metrics.ts with per-vendor filtering"
    phase: 1
    priority: "high"
    dependencies: ["AT-001"]
    parallel_safe: true
    estimated_time: "45 minutes"
    implementation:
      files_to_modify: ["convex/metrics.ts"]
      changes:
        - "Add userId parameter to getDashboard"
        - "Implement role-based filtering (vendor sees own, manager sees selected/all)"
        - "Add listVendors query for selector"
      validation: "bun run typecheck"
      rollback: "git checkout convex/metrics.ts"
    acceptance_criteria:
      - "Vendors auto-filtered to their data"
      - "Managers can select any vendor or all"
      - "Uses by_organization_assigned_to index"

  - id: "AT-008"
    title: "Create convex/whatsapp.ts action for Evolution API"
    phase: 1
    priority: "high"
    dependencies: ["AT-001"]
    parallel_safe: true
    estimated_time: "1 hour"
    implementation:
      files_to_create: ["convex/whatsapp.ts"]
      functions:
        - "sendWhatsAppMessage(leadId, message) - action"
        - "createMessageWithActivity(leadId, content, direction, status) - internal mutation"
        - "checkRateLimit(organizationId) - internal query"
        - "incrementRateLimit(organizationId) - internal mutation"
      validation: "bun run typecheck"
      rollback: "rm convex/whatsapp.ts"
    acceptance_criteria:
      - "Uses action for external API call"
      - "Rate limiting per organization"
      - "Atomic write to messages + activities"
      - "Proper error handling with retry info"

  - id: "AT-009"
    title: "Add cron jobs for automation"
    phase: 1
    priority: "high"
    dependencies: ["AT-004"]
    parallel_safe: true
    estimated_time: "45 minutes"
    implementation:
      files_to_modify: ["convex/crons.ts"]
      changes:
        - "Add reactivateIdleLeads cron (daily 8 AM)"
        - "Add sendTaskReminders cron (daily 8 AM)"
      logic:
        reactivateIdleLeads: |
          Query leads in 'primeiro_contato' or 'qualificado' stages
          Filter by updatedAt > 7 days ago
          Update stage to 'novo'
          Log activity for each reactivated lead
        sendTaskReminders: |
          Query tasks with dueDate = today
          Create notifications for assignedTo and mentionedUserIds
          Mark tasks as reminded
      validation: "bun run typecheck"
      rollback: "git checkout convex/crons.ts"
    acceptance_criteria:
      - "Cron jobs are idempotent"
      - "Batch processing to avoid timeouts"
      - "Notifications created correctly"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2: FRONTEND COMPONENTS
# ═══════════════════════════════════════════════════════════════════════════════

  - id: "AT-010"
    title: "Create TagAutocomplete and TagBadge components"
    phase: 2
    priority: "critical"
    dependencies: ["AT-002"]
    parallel_safe: true
    estimated_time: "1 hour"
    implementation:
      files_to_create:
        - "src/components/crm/tags/tag-autocomplete.tsx"
        - "src/components/crm/tags/tag-badge.tsx"
        - "src/components/crm/tags/index.ts"
      patterns:
        - "Use shadcn Command component for autocomplete"
        - "Support creating new tags inline"
        - "Color picker for new tags"
        - "TagBadge shows color and remove button"
      validation: "bun run build"
      rollback: "rm -rf src/components/crm/tags/"
    acceptance_criteria:
      - "Autocomplete searches existing tags"
      - "Create new tag option appears when no match"
      - "Tags display with correct colors"
      - "Remove button on hover"

  - id: "AT-011"
    title: "Add Tags section to lead-detail.tsx"
    phase: 2
    priority: "critical"
    dependencies: ["AT-010"]
    parallel_safe: false
    estimated_time: "45 minutes"
    implementation:
      files_to_modify: ["src/components/crm/lead-detail.tsx"]
      changes:
        - "Import TagAutocomplete and TagBadge"
        - "Add Tags section below existing sections in Overview tab"
        - "Query lead tags using getLeadTags"
        - "Handle add/remove tag mutations"
      validation: "bun run build"
      rollback: "git checkout src/components/crm/lead-detail.tsx"
    acceptance_criteria:
      - "Tags section visible in lead detail"
      - "Can add tags via autocomplete"
      - "Can remove tags via badge X button"
      - "Empty state shows helpful message"

  - id: "AT-012"
    title: "Add Tags filter to lead-filters.tsx"
    phase: 2
    priority: "critical"
    dependencies: ["AT-010"]
    parallel_safe: false
    estimated_time: "30 minutes"
    implementation:
      files_to_modify: ["src/components/crm/lead-filters.tsx"]
      changes:
        - "Add Tags section with checkboxes"
        - "Query all organization tags"
        - "Update filter state with selected tags"
        - "Pass tags to listLeads query"
      validation: "bun run build"
      rollback: "git checkout src/components/crm/lead-filters.tsx"
    acceptance_criteria:
      - "Tags section appears in filter popover"
      - "Checkboxes for each tag"
      - "Filter badge shows active tag count"
      - "Pipeline updates when tags selected"

  - id: "AT-013"
    title: "Create ObjectionsList component and add to lead-detail"
    phase: 2
    priority: "critical"
    dependencies: ["AT-003"]
    parallel_safe: true
    estimated_time: "1 hour"
    implementation:
      files_to_create: ["src/components/crm/objections-list.tsx"]
      files_to_modify: ["src/components/crm/lead-detail.tsx"]
      features:
        - "New Objections tab in lead detail"
        - "List objections chronologically"
        - "Add objection form with text input"
        - "Delete objection with confirmation"
        - "Resolve objection with resolution text"
      validation: "bun run build"
      rollback: "rm src/components/crm/objections-list.tsx && git checkout src/components/crm/lead-detail.tsx"
    acceptance_criteria:
      - "Objections tab visible in lead detail"
      - "Add objection inline"
      - "Objections show timestamp and user"
      - "Resolved objections visually distinct"

  - id: "AT-014"
    title: "Create TaskList and TaskForm components"
    phase: 2
    priority: "high"
    dependencies: ["AT-004"]
    parallel_safe: true
    estimated_time: "1.5 hours"
    implementation:
      files_to_create:
        - "src/components/crm/tasks/task-list.tsx"
        - "src/components/crm/tasks/task-form.tsx"
        - "src/components/crm/tasks/index.ts"
      files_to_modify: ["src/components/crm/lead-detail.tsx"]
      features:
        - "New Tasks tab in lead detail"
        - "Task form with description, due date, mentions"
        - "User autocomplete for mentions"
        - "Task list with status indicators (overdue/today/future)"
        - "Complete/delete task actions"
      validation: "bun run build"
      rollback: "rm -rf src/components/crm/tasks/ && git checkout src/components/crm/lead-detail.tsx"
    acceptance_criteria:
      - "Tasks tab visible in lead detail"
      - "Can create task with due date"
      - "Can mention other users"
      - "Overdue tasks highlighted in red"
      - "Today tasks highlighted in yellow"

  - id: "AT-015"
    title: "Add vendor selector to Dashboard"
    phase: 2
    priority: "high"
    dependencies: ["AT-007"]
    parallel_safe: false
    estimated_time: "45 minutes"
    implementation:
      files_to_modify: ["src/routes/_authenticated/dashboard.tsx"]
      changes:
        - "Add vendor selector (visible to managers/admins only)"
        - "Query listVendors for dropdown options"
        - "Pass selected userId to getDashboard"
        - "Update title to show selected vendor name"
        - "Auto-filter for vendors (their own data only)"
      validation: "bun run build"
      rollback: "git checkout src/routes/_authenticated/dashboard.tsx"
    acceptance_criteria:
      - "Managers see vendor selector"
      - "Vendors don't see selector (auto-filtered)"
      - "Dashboard updates when vendor selected"
      - "Title reflects selected vendor"

  - id: "AT-016"
    title: "Add product tabs to CRM page"
    phase: 2
    priority: "high"
    dependencies: []
    parallel_safe: true
    estimated_time: "1 hour"
    implementation:
      files_to_modify:
        - "src/routes/_authenticated/crm.tsx"
        - "src/components/crm/pipeline-kanban.tsx"
      changes:
        - "Add Tabs component above Kanban"
        - "Tabs: Todos | OTB 2025 | NEON | TRINTAE3"
        - "Pass selected product to listLeads query"
        - "Update URL params for product filter"
        - "Show lead count per product tab"
      validation: "bun run build"
      rollback: "git checkout src/routes/_authenticated/crm.tsx src/components/crm/pipeline-kanban.tsx"
    acceptance_criteria:
      - "Product tabs visible above Kanban"
      - "Tab counts show leads per product"
      - "Kanban filters by selected product"
      - "URL reflects selected product"

  - id: "AT-017"
    title: "Add referral section to lead form and detail"
    phase: 2
    priority: "high"
    dependencies: ["AT-006"]
    parallel_safe: false
    estimated_time: "1 hour"
    implementation:
      files_to_modify:
        - "src/components/crm/lead-form.tsx"
        - "src/components/crm/lead-detail.tsx"
      changes:
        - "Add 'Indicado por' field to lead form"
        - "Lead autocomplete for referrer selection"
        - "Add Referral section to lead detail (if referredById exists)"
        - "Show cashback earned/pending status"
        - "Link to view all referrals"
      validation: "bun run build"
      rollback: "git checkout src/components/crm/lead-form.tsx src/components/crm/lead-detail.tsx"
    acceptance_criteria:
      - "Can select referrer when creating lead"
      - "Referral section shows in lead detail"
      - "Cashback status displayed correctly"
      - "Confetti animation on first cashback view (nice-to-have)"

  - id: "AT-018"
    title: "Create WhatsApp send dialog"
    phase: 2
    priority: "high"
    dependencies: ["AT-008"]
    parallel_safe: true
    estimated_time: "1 hour"
    implementation:
      files_to_create: ["src/components/crm/whatsapp-dialog.tsx"]
      files_to_modify: ["src/components/crm/lead-detail.tsx"]
      features:
        - "Dialog with message textarea"
        - "Template quick buttons"
        - "Character counter"
        - "Recipient info display"
        - "Send button with loading state"
        - "Success/error toast feedback"
      validation: "bun run build"
      rollback: "rm src/components/crm/whatsapp-dialog.tsx && git checkout src/components/crm/lead-detail.tsx"
    acceptance_criteria:
      - "Dialog opens from lead detail header"
      - "Templates fill textarea on click"
      - "Send calls action correctly"
      - "Toast shows delivery status"

  - id: "AT-019"
    title: "Create Custom Fields admin page"
    phase: 2
    priority: "medium"
    dependencies: ["AT-005"]
    parallel_safe: true
    estimated_time: "1.5 hours"
    implementation:
      files_to_create:
        - "src/routes/_authenticated/settings/custom-fields.tsx"
        - "src/components/settings/custom-field-form.tsx"
        - "src/components/settings/custom-field-list.tsx"
      features:
        - "Table listing all custom fields"
        - "Form to create/edit field definitions"
        - "Field type selector"
        - "Options editor for select types"
        - "Active/inactive toggle"
        - "Delete with confirmation"
      validation: "bun run build"
      rollback: "rm -rf src/routes/_authenticated/settings/custom-fields.tsx src/components/settings/custom-field-*.tsx"
    acceptance_criteria:
      - "Admin-only access"
      - "Can create fields of all types"
      - "Can define options for select fields"
      - "Soft delete preserves data"

  - id: "AT-020"
    title: "Render custom fields in lead form"
    phase: 2
    priority: "medium"
    dependencies: ["AT-019"]
    parallel_safe: false
    estimated_time: "1 hour"
    implementation:
      files_to_create: ["src/components/crm/custom-field-renderer.tsx"]
      files_to_modify: ["src/components/crm/lead-form.tsx"]
      features:
        - "Query custom fields for entity type 'lead'"
        - "Dynamic form field rendering based on fieldType"
        - "Validation for required fields"
        - "Save values on form submit"
      validation: "bun run build"
      rollback: "rm src/components/crm/custom-field-renderer.tsx && git checkout src/components/crm/lead-form.tsx"
    acceptance_criteria:
      - "Custom fields appear in lead form"
      - "Correct input type per field"
      - "Required validation works"
      - "Values save correctly"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 3: INTEGRATION & POLISH
# ═══════════════════════════════════════════════════════════════════════════════

  - id: "AT-021"
    title: "Integration testing for all features"
    phase: 3
    priority: "critical"
    dependencies: ["AT-010", "AT-011", "AT-012", "AT-013", "AT-014", "AT-015", "AT-016", "AT-017", "AT-018", "AT-019", "AT-020"]
    parallel_safe: true
    estimated_time: "2 hours"
    implementation:
      files_to_create:
        - "convex/tags.test.ts"
        - "convex/objections.test.ts"
        - "convex/tasks.test.ts"
        - "convex/customFields.test.ts"
      tests:
        - "Tag CRUD operations"
        - "Tag filtering in lead list"
        - "Objection CRUD operations"
        - "Task creation with mentions"
        - "Dashboard per-vendor filtering"
        - "Cashback calculation on stage change"
        - "WhatsApp send action (mocked)"
        - "Custom field validation"
      validation: "bun run test"
      rollback: "rm convex/*.test.ts"
    acceptance_criteria:
      - "All tests pass"
      - "No regressions in existing tests"
      - "Edge cases covered"

  - id: "AT-022"
    title: "Final validation and documentation"
    phase: 3
    priority: "high"
    dependencies: ["AT-021"]
    parallel_safe: true
    estimated_time: "1 hour"
    implementation:
      files_to_modify: ["docs/crm-features.md"]
      validation_checklist:
        - "bun run build (zero errors)"
        - "bun run lint (zero warnings)"
        - "bun run test (all passing)"
        - "Manual testing of all 8 features"
        - "Role-based access verified"
        - "Multi-tenant isolation verified"
      documentation:
        - "Feature overview"
        - "API reference for new functions"
        - "Admin guide for custom fields"
        - "Troubleshooting common issues"
      rollback: "N/A - documentation only"
    acceptance_criteria:
      - "All quality gates pass"
      - "Documentation complete"
      - "Ready for production"
```

---

## SECTION 6: VALIDATION GATES

```yaml
validation:
  automated:
    - id: "VT-001"
      command: "bun run build"
      expected: "Exit code 0"
      run_after: ["each phase"]
      
    - id: "VT-002"
      command: "bun run lint"
      expected: "No errors or warnings"
      run_after: ["each phase"]
      
    - id: "VT-003"
      command: "npx convex dev --typecheck"
      expected: "Exit code 0"
      run_after: ["AT-001", "schema changes"]
      
    - id: "VT-004"
      command: "bun run test"
      expected: "All tests pass"
      run_after: ["AT-021"]
      
  manual_review:
    - id: "VT-005"
      focus: "Role-based access control"
      checklist:
        - "Vendor sees only their leads"
        - "Manager can see all vendors"
        - "Admin-only functions protected"
      required_if: "Dashboard or permission changes"
      
    - id: "VT-006"
      focus: "LGPD compliance"
      checklist:
        - "All tables have organizationId"
        - "No cross-tenant data leakage"
        - "Activities logged for data changes"
      required_if: "Schema changes"
      
    - id: "VT-007"
      focus: "WhatsApp integration"
      checklist:
        - "Messages sent correctly"
        - "Rate limiting works"
        - "Errors handled gracefully"
      required_if: "WhatsApp feature"
```

---

## SECTION 7: OUTPUT CONTRACT

```yaml
output:
  format: "Production-ready CRM enhancement with all 8 features"
  
  files_created:
    - path: "convex/tags.ts"
      purpose: "Tag CRUD operations"
    - path: "convex/objections.ts"
      purpose: "Objection CRUD operations"
    - path: "convex/tasks.ts"
      purpose: "Task CRUD and reminders"
    - path: "convex/customFields.ts"
      purpose: "Custom field definitions and values"
    - path: "convex/whatsapp.ts"
      purpose: "WhatsApp send action via Evolution API"
    - path: "src/components/crm/tags/"
      purpose: "Tag UI components"
    - path: "src/components/crm/objections-list.tsx"
      purpose: "Objections tab component"
    - path: "src/components/crm/tasks/"
      purpose: "Task UI components"
    - path: "src/components/crm/whatsapp-dialog.tsx"
      purpose: "WhatsApp send dialog"
    - path: "src/components/crm/custom-field-renderer.tsx"
      purpose: "Dynamic custom field rendering"
    - path: "src/routes/_authenticated/settings/custom-fields.tsx"
      purpose: "Custom fields admin page"
      
  files_modified:
    - path: "convex/schema.ts"
      changes: "8 new tables + 3 fields + 2 indexes on leads"
    - path: "convex/leads.ts"
      changes: "Referral support, tag filtering, cashback calculation"
    - path: "convex/metrics.ts"
      changes: "Per-vendor dashboard filtering"
    - path: "convex/crons.ts"
      changes: "Lead reactivation + task reminders cron jobs"
    - path: "src/components/crm/lead-detail.tsx"
      changes: "Tags, Objections, Tasks tabs + referral section"
    - path: "src/components/crm/lead-form.tsx"
      changes: "Referrer field + custom fields"
    - path: "src/components/crm/lead-filters.tsx"
      changes: "Tag filter section"
    - path: "src/components/crm/pipeline-kanban.tsx"
      changes: "Product tab integration"
    - path: "src/routes/_authenticated/crm.tsx"
      changes: "Product tabs"
    - path: "src/routes/_authenticated/dashboard.tsx"
      changes: "Vendor selector"
      
  success_definition: |
    All 8 features implemented and functional:
    1. ✅ Sistema de Tags - Create, assign, filter by tags
    2. ✅ Sistema de Objeções - Record, track, resolve objections
    3. ✅ Dashboard Individual - Per-vendor metrics view
    4. ✅ Pipeline por Produto - Product-specific pipeline views
    5. ✅ Indicações e Cashback - Referral tracking with automatic cashback
    6. ✅ WhatsApp Ativo - Send messages via Evolution API
    7. ✅ Automação - Lead reactivation + task reminders
    8. ✅ Campos Customizáveis - Admin-defined custom fields
    
    Quality Gates:
    - Build passes (zero errors)
    - Lint passes (zero warnings)
    - All tests pass
    - No regressions
    - LGPD compliant
    - Role-based access enforced
    
  failure_handling: |
    If schema migration fails:
    1. Run: git checkout convex/schema.ts
    2. Re-deploy: npx convex deploy
    3. Verify no data loss
    
    If Evolution API fails:
    1. Check rate limits in apiRateLimits table
    2. Verify credentials in integrations table
    3. Retry with exponential backoff
    
    If tests fail:
    1. Check test output for specific failure
    2. Fix the failing code
    3. Re-run affected tests only
```

---

## SECTION 8: BEHAVIOR CONFIGURATION

```yaml
behavior_mode: "PROACTIVE"

proactive_behavior: |
  By default, implement changes instead of suggesting them.
  If user intent is unclear, infer the most useful action and proceed,
  using tools to discover missing details instead of guessing.
  Trust existing references and execute changes directly.

parallel_execution: |
  If you intend to call multiple tools and there are no dependencies between calls,
  make all independent calls in parallel.
  
  Example: AT-002, AT-003, AT-004, AT-005 are parallel-safe after AT-001 completes.
  Execute them simultaneously to maximize efficiency.

reflection_protocol: |
  After receiving tool results, reflect carefully on their quality
  and determine optimal next steps before proceeding.
  
  Use thinking to:
  1. Assess if implementation is complete and correct
  2. Identify any gaps or type errors
  3. Plan the best next action
  4. Consider rollback if something breaks

thinking_budget: "16000-32000 tokens (L7 complexity)"

anti_hardcoding_rule: |
  Write high-quality, general-purpose solutions.
  Implement logic that works for ALL valid inputs, not just test cases.
  Never hard-code organizationIds, userIds, or other dynamic values.
```

---

## EXECUTION ORDER

```yaml
execution_phases:
  phase_1_foundation:
    tasks: ["AT-001"]
    description: "Schema setup - MUST complete first"
    estimated_time: "30 minutes"
    
  phase_1_backend:
    tasks: ["AT-002", "AT-003", "AT-004", "AT-005", "AT-006", "AT-007", "AT-008", "AT-009"]
    description: "All backend functions - can run in parallel after AT-001"
    estimated_time: "6 hours"
    parallel_groups:
      - ["AT-002", "AT-003", "AT-004", "AT-005"]  # Independent new files
      - ["AT-006", "AT-007"]  # Modifications to existing files
      - ["AT-008"]  # Depends on integrations pattern understanding
      - ["AT-009"]  # Depends on AT-004 for tasks
    
  phase_2_frontend:
    tasks: ["AT-010", "AT-011", "AT-012", "AT-013", "AT-014", "AT-015", "AT-016", "AT-017", "AT-018", "AT-019", "AT-020"]
    description: "All UI components"
    estimated_time: "12 hours"
    dependency_order:
      1: ["AT-010", "AT-016", "AT-019"]  # Independent new components
      2: ["AT-011", "AT-012", "AT-013", "AT-014", "AT-015", "AT-017", "AT-018"]  # Depend on phase 1
      3: ["AT-020"]  # Depends on AT-019
    
  phase_3_validation:
    tasks: ["AT-021", "AT-022"]
    description: "Testing and documentation"
    estimated_time: "3 hours"
    
total_estimated_time: "4-5 days"
```

---

## PRE-SUBMISSION CHECKLIST

```yaml
research_check:
  - [x] Codebase searched for existing patterns
  - [x] Official Convex documentation consulted
  - [x] LGPD requirements identified
  - [x] Evolution API integration understood

context_check:
  - [x] All relevant files listed in must_read
  - [x] Constraints clearly specified
  - [x] Motivation/WHY included for key decisions
  - [x] Examples aligned with existing codebase patterns

task_check:
  - [x] Tasks are atomic (single responsibility)
  - [x] Each task has validation command
  - [x] Dependencies correctly mapped
  - [x] Rollback procedures defined
  - [x] Parallel-safe tasks identified

behavior_check:
  - [x] Proactive action specified
  - [x] Output format explicitly described
  - [x] Instructions state WHAT TO DO

validation_check:
  - [x] Acceptance criteria measurable
  - [x] Quality gates defined
  - [x] Success definition explicit
  - [x] Failure handling specified
```
