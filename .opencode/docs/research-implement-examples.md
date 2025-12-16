# Research → Implement: Practical Examples

This document provides practical examples of using the `/research` and `/implement` commands for various scenarios.

---

## Example 1: Simple Feature (L3)

### User Request
```markdown
/research como adicionar um novo campo de observações ao formulário de leads
```

### Research Output

```yaml
research_report:
  summary: "Add observations field to lead form with text area input"
  complexity: "L3"
  complexity_justification: "Single form field, one schema change, one component update"
  
  key_findings:
    - finding: "Lead form is in src/components/crm/lead-form.tsx"
      confidence: "high"
      source: "serena"
    - finding: "Leads schema in convex/schema.ts supports optional fields"
      confidence: "high"
      source: "serena"

atomic_tasks_proposal:
  - id: "AT-001"
    title: "Add observations field to leads schema"
    type: "setup"
    phase: 1
    priority: "high"
    files_affected: ["convex/schema.ts"]
    rollback_strategy: "git checkout convex/schema.ts"
    
  - id: "AT-002"
    title: "Add Textarea to lead form component"
    type: "core"
    phase: 3
    priority: "high"
    files_affected: ["src/components/crm/lead-form.tsx"]
    rollback_strategy: "git checkout src/components/crm/lead-form.tsx"
    
  - id: "AT-003"
    title: "Update lead mutation to accept observations"
    type: "core"
    phase: 3
    priority: "high"
    files_affected: ["convex/leads.ts"]
    rollback_strategy: "git checkout convex/leads.ts"
```

### Execution Flow
```
Phase 1: AT-001 (schema)
  ↓
Phase 3: AT-002, AT-003 (parallel - different files)
  ↓
Validation: bun run build && bun run lint:check && bun run test
```

---

## Example 2: Moderate Feature (L6)

### User Request
```markdown
/research implementar sistema de notificações push para alertar SDRs sobre novos leads
```

### Research Output

```yaml
research_report:
  summary: "Implement push notification system with Convex + Web Push API"
  complexity: "L6"
  complexity_justification: "Multiple components, schema changes, real-time integration"
  
  key_findings:
    - finding: "Convex supports real-time subscriptions via useQuery"
      confidence: "high"
      source: "context7"
    - finding: "Web Push API requires service worker registration"
      confidence: "high"
      source: "gh_grep"
    - finding: "NotificationBell pattern used in similar projects"
      confidence: "medium"
      source: "gh_grep"

atomic_tasks_proposal:
  - id: "AT-001"
    title: "Add notifications table to Convex schema"
    type: "setup"
    phase: 1
    priority: "high"
    files_affected: ["convex/schema.ts"]
    subtasks:
      - id: "AT-001-A"
        title: "Define notification fields (recipient, content, read, createdAt)"
      - id: "AT-001-B"
        title: "Add by_recipient and by_unread indexes"
    
  - id: "AT-002"
    title: "Create notification Convex functions"
    type: "core"
    phase: 3
    priority: "high"
    files_affected: ["convex/notifications.ts"]
    dependencies: ["AT-001"]
    subtasks:
      - id: "AT-002-A"
        title: "Create sendNotification mutation"
      - id: "AT-002-B"
        title: "Create getUnreadNotifications query"
      - id: "AT-002-C"
        title: "Create markAsRead mutation"
    
  - id: "AT-003"
    title: "Build NotificationBell component"
    type: "core"
    phase: 3
    priority: "medium"
    files_affected: ["src/components/notifications/notification-bell.tsx"]
    dependencies: ["AT-002"]
    subtasks:
      - id: "AT-003-A"
        title: "Create bell icon with unread count badge"
      - id: "AT-003-B"
        title: "Add dropdown with notification list"
      - id: "AT-003-C"
        title: "Implement mark as read on click"
    
  - id: "AT-004"
    title: "Integrate notifications with lead creation"
    type: "integration"
    phase: 4
    priority: "high"
    files_affected: ["convex/leads.ts"]
    dependencies: ["AT-002"]
    subtasks:
      - id: "AT-004-A"
        title: "Call sendNotification in createLead mutation"
      - id: "AT-004-B"
        title: "Filter by assigned SDR"
```

### Execution Flow
```
Phase 1: AT-001 (schema setup)
  ↓
Phase 3: AT-002 (Convex functions) → AT-003 (UI component)
  ↓
Phase 4: AT-004 (integration with leads)
  ↓
Validation: Full test suite
```

---

## Example 3: Complex Feature with LGPD (L8)

### User Request
```markdown
/research implementar sistema de exportação de dados de alunos para compliance LGPD
```

### Research Output

```yaml
research_report:
  summary: "LGPD-compliant student data export with audit logging and encryption"
  complexity: "L8"
  complexity_justification: "LGPD compliance, encryption, audit trail, multiple exports"
  
  scope:
    brazilian_compliance: true
    compliance_requirements: "LGPD"
    delegations_made:
      - subagent: "code-reviewer"
        purpose: "Security patterns for data export"
        key_findings: "Use encryption at rest, audit all exports, validate consent"
      - subagent: "database-specialist"
        purpose: "Schema for audit logging"
        key_findings: "Add exports table with user, timestamp, data hash"

  key_findings:
    - finding: "LGPD requires audit trail for all data access"
      confidence: "high"
      source: "code-reviewer"
    - finding: "Student CPF must be encrypted before export"
      confidence: "high"
      source: "code-reviewer"
    - finding: "Export formats: JSON, CSV, PDF supported"
      confidence: "medium"
      source: "gh_grep"

atomic_tasks_proposal:
  - id: "AT-001"
    title: "Add exports audit table to schema"
    type: "setup"
    phase: 1
    priority: "high"
    files_affected: ["convex/schema.ts"]
    acceptance_criteria:
      - "exports table with userId, timestamp, dataHash, purpose"
      - "by_user and by_timestamp indexes"
    subtasks:
      - id: "AT-001-A"
        title: "Define exports table schema"
      - id: "AT-001-B"
        title: "Add required indexes"
    
  - id: "AT-002"
    title: "Write unit tests for export functions"
    type: "test"
    phase: 2
    priority: "high"
    files_affected: ["convex/__tests__/exports.test.ts"]
    parallel_group: "A"
    test_strategy: "unit"
    subtasks:
      - id: "AT-002-A"
        title: "Test requestExport mutation with valid consent"
      - id: "AT-002-B"
        title: "Test requestExport fails without consent"
      - id: "AT-002-C"
        title: "Test audit log is created on export"
    
  - id: "AT-003"
    title: "Write integration tests for export flow"
    type: "test"
    phase: 2
    priority: "high"
    files_affected: ["tests/e2e/exports.spec.ts"]
    parallel_group: "A"
    test_strategy: "e2e"
    subtasks:
      - id: "AT-003-A"
        title: "Test complete export flow UI"
      - id: "AT-003-B"
        title: "Verify downloaded file is encrypted"
    
  - id: "AT-004"
    title: "Implement export mutation with encryption"
    type: "core"
    phase: 3
    priority: "high"
    files_affected: ["convex/exports.ts", "convex/lib/encryption.ts"]
    dependencies: ["AT-001"]
    subtasks:
      - id: "AT-004-A"
        title: "Create requestStudentDataExport mutation"
      - id: "AT-004-B"
        title: "Validate consent before export"
      - id: "AT-004-C"
        title: "Encrypt CPF and sensitive fields"
      - id: "AT-004-D"
        title: "Log export to audit table"
    
  - id: "AT-005"
    title: "Create export formats (JSON, CSV, PDF)"
    type: "core"
    phase: 3
    priority: "medium"
    files_affected: ["convex/lib/export-formats.ts"]
    dependencies: ["AT-004"]
    parallel_group: "B"
    subtasks:
      - id: "AT-005-A"
        title: "Implement JSON export"
      - id: "AT-005-B"
        title: "Implement CSV export"
      - id: "AT-005-C"
        title: "Implement PDF export"
    
  - id: "AT-006"
    title: "Build export UI with format selection"
    type: "core"
    phase: 3
    priority: "medium"
    files_affected: ["src/components/lgpd/export-data-dialog.tsx"]
    dependencies: ["AT-004"]
    parallel_group: "B"
    subtasks:
      - id: "AT-006-A"
        title: "Create ExportDataDialog component"
      - id: "AT-006-B"
        title: "Add format selection dropdown"
      - id: "AT-006-C"
        title: "Display consent confirmation"
    
  - id: "AT-007"
    title: "Add export button to student profile"
    type: "integration"
    phase: 4
    priority: "high"
    files_affected: ["src/routes/_authenticated/students/$studentId.tsx"]
    dependencies: ["AT-006"]
    acceptance_criteria:
      - "Export button visible to admin and student owner"
      - "Dialog opens on click"
      - "Download starts after confirmation"
    
  - id: "AT-008"
    title: "Security review by code-reviewer"
    type: "polish"
    phase: 5
    priority: "high"
    dependencies: ["AT-007"]

validation_tasks:
  - id: "VT-001"
    title: "Build validation"
    command: "bun run build"
  - id: "VT-002"
    title: "Lint check"
    command: "bun run lint:check"
  - id: "VT-003"
    title: "Test suite"
    command: "bun run test"
  - id: "VT-004"
    title: "Security review"
    command: "@code-reviewer validate implementation"
```

### Execution Flow
```
Phase 1: AT-001 (schema)
  ↓
Phase 2: AT-002 + AT-003 (parallel tests)
  ↓
Phase 3: AT-004 → AT-005 + AT-006 (parallel core)
  ↓
Phase 4: AT-007 (integration)
  ↓
Phase 5: AT-008 (security review)
  ↓
Validation: Full suite + security review
```

---

## Example 4: UI Component (L4)

### User Request
```markdown
/research criar componente de avatar com status online/offline
```

### Research Output

```yaml
research_report:
  summary: "Create Avatar component with online status indicator using shadcn/ui"
  complexity: "L4"
  
  key_findings:
    - finding: "shadcn/ui Avatar component exists at src/components/ui/avatar.tsx"
      confidence: "high"
      source: "serena"
    - finding: "Status indicator typically uses absolute positioning"
      confidence: "high"
      source: "gh_grep"

atomic_tasks_proposal:
  - id: "AT-001"
    title: "Create UserAvatar component with status"
    type: "core"
    phase: 3
    priority: "high"
    files_affected: ["src/components/user/user-avatar.tsx"]
    acceptance_criteria:
      - "Wraps shadcn Avatar component"
      - "Shows green dot for online, gray for offline"
      - "Accepts size prop (sm, md, lg)"
      - "Accessible with ARIA label"
    
  - id: "AT-002"
    title: "Add UserAvatar to header profile"
    type: "integration"
    phase: 4
    priority: "medium"
    files_affected: ["src/components/layout/header.tsx"]
    dependencies: ["AT-001"]
```

---

## Example 5: Database Query Optimization (L5)

### User Request
```markdown
/research otimizar queries de listagem de leads que estão lentas
```

### Research Output

```yaml
research_report:
  summary: "Optimize leads listing with compound indexes and pagination"
  complexity: "L5"
  
  delegations_made:
    - subagent: "database-specialist"
      purpose: "Analyze current query patterns"
      key_findings: "Missing compound index for stage+assignedTo, no pagination"

  key_findings:
    - finding: "getLeadsByStage query does full table scan"
      confidence: "high"
      source: "database-specialist"
    - finding: "Compound index by_stage_and_assigned would help"
      confidence: "high"
      source: "database-specialist"
    - finding: "Pagination with .paginate() recommended for >100 items"
      confidence: "high"
      source: "context7"

atomic_tasks_proposal:
  - id: "AT-001"
    title: "Add compound indexes to leads table"
    type: "setup"
    phase: 1
    priority: "high"
    files_affected: ["convex/schema.ts"]
    subtasks:
      - id: "AT-001-A"
        title: "Add by_stage_and_assigned index"
      - id: "AT-001-B"
        title: "Add by_created_desc index for sorting"
    
  - id: "AT-002"
    title: "Update leads queries to use indexes"
    type: "core"
    phase: 3
    priority: "high"
    files_affected: ["convex/leads.ts"]
    dependencies: ["AT-001"]
    subtasks:
      - id: "AT-002-A"
        title: "Update getLeadsByStage to use compound index"
      - id: "AT-002-B"
        title: "Add pagination with .paginate()"
    
  - id: "AT-003"
    title: "Update frontend to handle pagination"
    type: "integration"
    phase: 4
    priority: "medium"
    files_affected: ["src/components/crm/leads-table.tsx"]
    dependencies: ["AT-002"]
    subtasks:
      - id: "AT-003-A"
        title: "Add usePaginatedQuery hook"
      - id: "AT-003-B"
        title: "Add 'Load More' button"
```

---

## Quick Reference

### Complexity Indicators

| Complexity | Keywords | Subtasks |
|------------|----------|----------|
| L1-L4 | "simple", "add field", "quick fix" | None |
| L5-L7 | "feature", "system", "integrate" | 2-4 each |
| L8-L10 | "LGPD", "migration", "audit" | 3-5 each |

### Phase Mapping

| Phase | Type | Example Tasks |
|-------|------|---------------|
| 1 | setup | Schema, dependencies, config |
| 2 | test | Unit, integration, e2e tests |
| 3 | core | Mutations, components, hooks |
| 4 | integration | Routes, wiring, auth |
| 5 | polish | Optimization, docs, review |

### Parallel Groups

- Tasks with same `parallel_group` (A, B, C) run together
- Tasks with `null` group run sequentially
- Same parallel group = different files only

---

*Last updated: 2024*
