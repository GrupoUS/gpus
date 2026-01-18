<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# pesquise e entenda como funciona e quais as principais funcionalidades do slack e do linear para implementar essas funcionalidades no meu projeto gpus. depois crie um prompt detalhado para que seja feito o planejamento e implementaçao

Agora vou criar o prompt detalhado para implementação das funcionalidades do Slack e Linear no projeto GPUS.

```markdown
# 🚀 IMPLEMENTATION PROMPT: Slack & Linear Features for GPUS CRM

## 🎯 OBJECTIVE

Implement **Slack-like team communication** and **Linear-like issue tracking** features into the GPUS CRM platform to create a unified workspace for team collaboration, task management, and project execution within the existing React + Vite + Convex + Clerk architecture.

**Target Outcome**: Seamlessly integrate real-time team messaging, channels, and structured issue tracking with cycles/sprints into the current GPUS CRM without disrupting existing functionality.

---

## 🌐 CONTEXT

```yaml
project: "GPUS CRM - Grupo US Platform"
stack:
  frontend: "React 18 + Vite + TanStack Router + shadcn/ui + Tailwind"
  backend: "Convex (Real-time Database + Functions)"
  auth: "Clerk (RBAC: Admin, SDR, CS, Support)"
  state: "React Query + Convex Subscriptions"
  ui: "Glass-morphism design + Framer Motion"
  
existing_modules:
  - "Dashboard with real-time analytics"
  - "CRM/Sales Pipeline (Kanban)"
  - "Student Management"
  - "Multi-channel Chat (WhatsApp, Instagram, Email, Portal)"
  - "AI Assistant Widget (trained on Grupo US narrative)"
  - "Reports & Analytics"
  - "Message Templates"
  - "Activity Logging"

current_architecture:
  convex_schema:
    - users (with roles)
    - leads
    - students
    - enrollments
    - conversations
    - messages
    - templates
    - activities
    - settings
```


---

## 📋 REQUIREMENTS

### 🔵 SLACK-INSPIRED FEATURES

#### **1. Channels \& Workspace**

**Functional Requirements:**

- Create public/private channels organized by:
    - **Teams** (Vendas, CS, Suporte, Marketing, Financeiro)
    - **Projects** (Campaign Q1, Product Launch, etc.)
    - **Topics** (random, anuncios, geral)
- Channel naming: `#vendas`, `#cs-suporte`, `#projeto-black-neon`
- Auto-join default channels for new users based on role
- Channel descriptions and member lists
- Archive/unarchive channels (admin only)

**UI/UX Requirements:**

- Sidebar navigation with collapsible channel sections
- Channel search with fuzzy matching
- Unread message badges
- Channel settings modal (rename, description, members)
- Emoji reactions to messages
- Thread replies (nested conversations)

**Technical Requirements:**

```typescript
// Convex Schema Extension
channels: defineTable({
  name: v.string(), // #vendas
  type: v.union(v.literal("public"), v.literal("private")),
  description: v.optional(v.string()),
  createdBy: v.id("users"),
  memberIds: v.array(v.id("users")),
  isArchived: v.boolean(),
  teamId: v.optional(v.id("teams")), // Link to department
  projectId: v.optional(v.id("projects")), // Link to project
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_type", ["type"])
.index("by_team", ["teamId"])
.index("by_archived", ["isArchived"])

channelMessages: defineTable({
  channelId: v.id("channels"),
  userId: v.id("users"),
  content: v.string(),
  threadParentId: v.optional(v.id("channelMessages")),
  reactions: v.array(v.object({
    emoji: v.string(),
    userIds: v.array(v.id("users"))
  })),
  mentions: v.array(v.id("users")),
  attachments: v.optional(v.array(v.object({
    type: v.string(),
    url: v.string(),
    name: v.string()
  }))),
  isEdited: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_channel", ["channelId"])
.index("by_thread", ["threadParentId"])
.index("by_user", ["userId"])
```


#### **2. Direct Messages (DMs)**

**Functional Requirements:**

- 1-on-1 direct messaging between team members
- Group DMs (up to 8 people)
- Online/offline status indicators
- Typing indicators
- Message read receipts

**UI/UX Requirements:**

- Separate "Direct Messages" section in sidebar
- User search with autocomplete
- Presence badges (green=online, gray=offline)
- Notification dots for unread DMs

**Technical Requirements:**

```typescript
directConversations: defineTable({
  participantIds: v.array(v.id("users")),
  type: v.union(v.literal("dm"), v.literal("group")),
  name: v.optional(v.string()), // For group DMs
  lastMessageAt: v.number(),
  createdAt: v.number(),
})
.index("by_participants", ["participantIds"])

directMessages: defineTable({
  conversationId: v.id("directConversations"),
  senderId: v.id("users"),
  content: v.string(),
  readBy: v.array(v.id("users")),
  reactions: v.array(v.object({
    emoji: v.string(),
    userId: v.id("users")
  })),
  createdAt: v.number(),
})
.index("by_conversation", ["conversationId"])
```


#### **3. Rich Text Editor \& Formatting**

**Functional Requirements:**

- Markdown support: **bold**, *italic*, ~~strikethrough~~, `code`, ```code blocks```
- Emoji picker integration
- @mentions with autocomplete (e.g., @mauricio)
- File/image attachments (drag \& drop)
- Link previews (unfurl URLs)

**UI/UX Requirements:**

- Floating toolbar with formatting buttons
- Emoji reactions panel below messages
- Attachment previews (images inline, files as cards)


#### **4. Notifications \& Search**

**Functional Requirements:**

- Real-time push notifications for:
    - @mentions
    - DMs
    - Channel messages (with mute option)
- Global search across channels, DMs, and files
- Search filters: from:user, in:channel, date ranges

**UI/UX Requirements:**

- Notification center icon with badge count
- Keyboard shortcut: `Cmd/Ctrl + K` for quick search
- Search results grouped by type (Messages, Channels, Files)

---

### 🟢 LINEAR-INSPIRED FEATURES

#### **1. Issues (Tasks/Bugs/Features)**

**Functional Requirements:**

- Create issues with:
    - Title \& description (Markdown)
    - Status (Backlog, Todo, In Progress, In Review, Done, Canceled)
    - Priority (No Priority, Urgent, High, Medium, Low)
    - Assignee (single user)
    - Labels/Tags (bug, feature, improvement, documentation)
    - Due date
    - Estimate (story points: 1, 2, 3, 5, 8, 13)
    - Parent/child relationships (sub-issues)
- Auto-generate issue IDs: `GPUS-1`, `GPUS-2`, etc.
- Issue templates (Bug Report, Feature Request, Task)
- Bulk operations (edit, delete, move)

**UI/UX Requirements:**

- Issue list view with customizable columns
- Kanban board grouped by status
- Issue detail modal (full-screen option)
- Quick actions: `C` = Create issue, `Cmd/Ctrl + K` = Command palette
- Filter panel: status, assignee, priority, labels, date

**Technical Requirements:**

```typescript
issues: defineTable({
  identifier: v.string(), // GPUS-123
  title: v.string(),
  description: v.string(),
  status: v.union(
    v.literal("backlog"),
    v.literal("todo"),
    v.literal("in_progress"),
    v.literal("in_review"),
    v.literal("done"),
    v.literal("canceled")
  ),
  priority: v.union(
    v.literal("no_priority"),
    v.literal("urgent"),
    v.literal("high"),
    v.literal("medium"),
    v.literal("low")
  ),
  assigneeId: v.optional(v.id("users")),
  creatorId: v.id("users"),
  projectId: v.optional(v.id("projects")),
  cycleId: v.optional(v.id("cycles")),
  teamId: v.id("teams"),
  labels: v.array(v.string()),
  estimate: v.optional(v.number()), // Story points
  dueDate: v.optional(v.number()),
  parentIssueId: v.optional(v.id("issues")),
  completedAt: v.optional(v.number()),
  canceledAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_project", ["projectId"])
.index("by_assignee", ["assigneeId"])
.index("by_status", ["status"])
.index("by_team", ["teamId"])
.index("by_cycle", ["cycleId"])
.index("by_identifier", ["identifier"])

issueComments: defineTable({
  issueId: v.id("issues"),
  userId: v.id("users"),
  content: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_issue", ["issueId"])

issueActivity: defineTable({
  issueId: v.id("issues"),
  userId: v.id("users"),
  action: v.string(), // "created", "status_changed", "assigned", etc.
  changes: v.object({
    field: v.string(),
    from: v.optional(v.string()),
    to: v.string(),
  }),
  createdAt: v.number(),
})
.index("by_issue", ["issueId"])
```


#### **2. Projects \& Roadmaps**

**Functional Requirements:**

- Create projects with:
    - Name \& description
    - Start/end dates
    - Target date
    - Status (Planned, In Progress, Completed, Paused)
    - Lead owner
    - Team assignment
- Link issues to projects
- Project progress tracking (% completed issues)
- Roadmap view (timeline/Gantt chart)

**UI/UX Requirements:**

- Project cards with progress bars
- Roadmap timeline with drag-to-adjust dates
- Project detail view with linked issues
- Milestone markers

**Technical Requirements:**

```typescript
projects: defineTable({
  name: v.string(),
  description: v.string(),
  status: v.union(
    v.literal("planned"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("paused")
  ),
  leadId: v.id("users"),
  teamId: v.id("teams"),
  startDate: v.optional(v.number()),
  targetDate: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_team", ["teamId"])
.index("by_status", ["status"])
```


#### **3. Cycles (Sprints)**

**Functional Requirements:**

- Create cycles with:
    - Name (e.g., "Sprint 1 - Janeiro 2026")
    - Duration (1, 2, 3, or 4 weeks)
    - Start/end dates (auto-calculated)
    - Auto-rollover incomplete issues to next cycle
- Assign issues to current/future cycles
- Cycle planning view (capacity vs. assigned points)
- Cycle analytics (velocity, completion rate)

**UI/UX Requirements:**

- Cycle selector dropdown in issue views
- Active cycle banner in dashboard
- Burndown chart for current cycle
- Cycle history with metrics

**Technical Requirements:**

```typescript
cycles: defineTable({
  name: v.string(),
  teamId: v.id("teams"),
  startDate: v.number(),
  endDate: v.number(),
  isActive: v.boolean(),
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
})
.index("by_team", ["teamId"])
.index("by_active", ["isActive"])
```


#### **4. Command Palette \& Keyboard Shortcuts**

**Functional Requirements:**

- Command palette (`Cmd/Ctrl + K`) for:
    - Quick issue creation
    - Navigation (jump to project, cycle, team)
    - Issue assignment
    - Status changes
    - Search
- Keyboard shortcuts:
    - `C`: Create issue
    - `Q`: Quick search
    - `Esc`: Close modals
    - `Tab`: Cycle through form fields

**UI/UX Requirements:**

- Modal with fuzzy search
- Recent items at top
- Action icons next to commands
- Shortcut hints in tooltips

---

## 🎨 DESIGN INTEGRATION

**Style Consistency:**

- Maintain existing glass-morphism aesthetic
- Use Tailwind CSS variables for theme consistency
- Framer Motion for smooth transitions
- shadcn/ui components for forms, modals, dialogs

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ Header (Existing)                               │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │ Main Content Area                    │
│          │                                       │
│ Home     │ [Dynamic View: Channels/Issues/etc.] │
│ CRM      │                                       │
│ Alunos   │                                       │
│ Chat     │                                       │
│ ┌──────┐│                                       │
│ │Canais││                                       │
│ ├──────┤│                                       │
│ │Issues││                                       │
│ └──────┘│                                       │
└──────────┴──────────────────────────────────────┘
```


---

## 🔄 WORKFLOW: A.P.T.E (Analyze → Research → Think → Elaborate)

### **Phase 1: Analyze**

```yaml
checklist:
  - "Map existing Convex schema conflicts"
  - "Identify shared components (messages, users, teams)"
  - "Review authentication flow with Clerk RBAC"
  - "Assess impact on current chat module"
  - "Define database migration strategy"
```


### **Phase 2: Research**

```yaml
checklist:
  - "Study Convex indexing best practices for real-time queries"
  - "Review TanStack Router nested route patterns"
  - "Research React Query optimistic updates for Slack-like UX"
  - "Investigate WebSocket patterns in Convex"
  - "Examine Markdown editor libraries (Lexical, TipTap, Slate)"
```


### **Phase 3: Think**

```yaml
step_by_step:
  - "First: Extend Convex schema with new tables (channels, issues, projects, cycles)"
  - "Then: Create Convex queries/mutations for CRUD operations"
  - "Next: Build UI components (ChannelList, IssueBoard, CommandPalette)"
  - "Then: Implement real-time subscriptions for messages/issues"
  - "Next: Add routing for new views (/channels/:id, /issues/:id)"
  - "Finally: Integrate with existing modules (link issues to leads, projects to clients)"
```


### **Phase 4: Elaborate**

```yaml
implementation_plan:
  week_1:
    - "Schema design & Convex table creation"
    - "CRUD functions for channels, messages, issues"
    - "Basic UI components (ChannelSidebar, IssueList)"
  
  week_2:
    - "Real-time messaging with threads & reactions"
    - "Direct messages & presence tracking"
    - "Issue Kanban board with drag-and-drop"
  
  week_3:
    - "Projects & Cycles implementation"
    - "Roadmap timeline view"
    - "Command palette & keyboard shortcuts"
  
  week_4:
    - "Search & notifications"
    - "Integration with existing modules"
    - "Testing & bug fixes"
```


---

## ✅ ACCEPTANCE CRITERIA

### **Slack Features:**

- [ ] Create/join/leave public/private channels
- [ ] Send messages with Markdown, emojis, @mentions
- [ ] Reply in threads
- [ ] Add emoji reactions
- [ ] Search messages across channels
- [ ] Receive real-time notifications
- [ ] Send direct messages (1-on-1 and group)
- [ ] Upload/share files in channels


### **Linear Features:**

- [ ] Create issues with title, description, status, priority, assignee
- [ ] Auto-generate issue IDs (GPUS-XXX)
- [ ] Filter/sort issues by status, assignee, priority, labels
- [ ] Drag issues between status columns (Kanban)
- [ ] Comment on issues
- [ ] Create projects with start/end dates
- [ ] Assign issues to projects
- [ ] Create cycles (sprints) with auto-calculated dates
- [ ] View roadmap timeline
- [ ] Use command palette (Cmd/Ctrl + K)


### **Integration:**

- [ ] Link issues to CRM leads (e.g., "Create issue from lead objection")
- [ ] Notify channels when project milestones are reached
- [ ] Search across channels, DMs, issues, and leads
- [ ] Dashboard widgets show active issues and recent channel activity

---

## 🚨 CONSTRAINTS \& NON-NEGOTIABLES

1. **NO breaking changes to existing functionality** (CRM, Chat, Dashboard must work as-is)
2. **Real-time updates required** (use Convex subscriptions, not polling)
3. **Mobile-responsive** (all new views must work on tablets/phones)
4. **RBAC enforcement** (Admin, SDR, CS, Support roles respected in channels/issues)
5. **Type-safe** (all Convex functions and React components fully typed in TypeScript)
6. **Accessibility** (keyboard navigation, screen reader support)
7. **Performance** (lazy load channel messages, virtualize long issue lists)

---

## 🛠️ TECHNICAL STACK \& DEPENDENCIES

**New Dependencies:**

```json
{
  "@dnd-kit/core": "^6.0.8",
  "@dnd-kit/sortable": "^8.0.0",
  "@lexical/react": "^0.12.0",
  "date-fns": "^3.0.0",
  "emoji-picker-react": "^4.5.16",
  "react-markdown": "^9.0.0",
  "react-mentions": "^4.4.10",
  "recharts": "^2.10.0"
}
```

**Convex Functions to Create:**

```
convex/
├── channels/
│   ├── create.ts
│   ├── list.ts
│   ├── getById.ts
│   ├── addMember.ts
│   ├── sendMessage.ts
│   └── getMessages.ts
├── issues/
│   ├── create.ts
│   ├── list.ts
│   ├── update.ts
│   ├── addComment.ts
│   └── getActivity.ts
├── projects/
│   ├── create.ts
│   ├── list.ts
│   └── getIssues.ts
└── cycles/
    ├── create.ts
    ├── getCurrent.ts
    └── getIssues.ts
```

**React Components to Build:**

```
src/components/
├── channels/
│   ├── ChannelSidebar.tsx
│   ├── ChannelView.tsx
│   ├── MessageInput.tsx
│   ├── MessageThread.tsx
│   └── CreateChannelModal.tsx
├── issues/
│   ├── IssueList.tsx
│   ├── IssueBoard.tsx (Kanban)
│   ├── IssueDetail.tsx
│   ├── CreateIssueModal.tsx
│   └── IssueCommentSection.tsx
├── projects/
│   ├── ProjectCard.tsx
│   ├── ProjectRoadmap.tsx
│   └── CreateProjectModal.tsx
├── cycles/
│   ├── CycleSelector.tsx
│   ├── CycleBurndown.tsx
│   └── CreateCycleModal.tsx
└── shared/
    ├── CommandPalette.tsx
    ├── RichTextEditor.tsx
    ├── EmojiPicker.tsx
    └── UserMentions.tsx
```


---

## 🧪 TESTING STRATEGY

**Unit Tests (Vitest):**

- Convex query/mutation functions
- React component logic (form validation, state management)

**Integration Tests (Playwright):**

- End-to-end flows:
    - Create channel → send message → add reaction
    - Create issue → assign → update status → complete
    - Create project → link issues → track progress

**Manual Testing Checklist:**

- [ ] Channel message delivery < 100ms latency
- [ ] Issue updates reflect immediately in Kanban
- [ ] Command palette responds to keyboard shortcuts
- [ ] Notifications fire correctly
- [ ] Mobile layout adapts properly

---

## 📊 SUCCESS METRICS

**Performance:**

- Message send latency: < 100ms
- Issue list render time: < 200ms (1000 issues)
- Search results: < 300ms
- Real-time sync lag: < 50ms

**User Experience:**

- 0 breaking bugs in existing features
- 90%+ feature parity with Slack/Linear core functions
- Keyboard-navigable interface
- Mobile usability score: 8/10+

---

## 🎯 DELIVERABLES

1. **Convex Schema Update** (schema.ts)
2. **Convex Functions** (20+ queries/mutations)
3. **React Components** (30+ UI components)
4. **Routes** (4 new routes: /channels, /issues, /projects, /cycles)
5. **Documentation** (API reference, user guide)
6. **Tests** (80%+ code coverage)
7. **Migration Script** (seed default channels/teams)

---

## 🔗 INTEGRATION POINTS WITH EXISTING MODULES

| Existing Module | Integration |
| :-- | :-- |
| **Dashboard** | Widget: Active issues count, recent channel activity |
| **CRM Leads** | Button: "Create issue from lead" (for blockers) |
| **Students** | Link issues to student support tickets |
| **Chat** | Share conversations in channels |
| **AI Widget** | Query issues: "What tasks are due this week?" |
| **Reports** | Team productivity (issues completed per cycle) |


---

## 🚀 NEXT STEPS AFTER IMPLEMENTATION

1. **User Training**: Create video tutorials for channels/issues
2. **Slack Migration**: Import existing Slack channels (if any)
3. **API Integration**: Connect issues to GitHub/Jira (if needed)
4. **Mobile App**: Extend to React Native companion app
5. **Advanced Features**:
    - Slack Connect (external partner channels)
    - Linear Insights (predictive analytics)
    - Workflow automation (Zapier-like)

---

## 📚 REFERENCES \& RESOURCES

**Slack API Docs**: https://api.slack.com/messaging
**Linear API Docs**: https://developers.linear.app/docs
**Convex Real-time Docs**: https://docs.convex.dev/database/reading-data
**TanStack Router**: https://tanstack.com/router/latest
**shadcn/ui Components**: https://ui.shadcn.com

**Example Implementations**:

- [web:6] Slack Features Overview
- [web:8] Linear Issue Tracking Guide
- [web:11] Linear Project Management Setup

---

## 🎉 CONCLUSION

This implementation will transform GPUS CRM into a **unified workspace** where teams can:

- **Communicate** seamlessly (Slack-style channels \& DMs)
- **Track work** efficiently (Linear-style issues \& projects)
- **Collaborate** in real-time (chat + task management)
- **Stay organized** with sprints, roadmaps, and priorities

The result: **Higher team productivity, better visibility, and faster execution** — all within a single, beautiful, glass-morphic interface. 🚀

---

*Generated using A.P.T.E Methodology (Analyze → Research → Think → Elaborate)*
*Framework: PRP (Product Requirement Prompt) + ACE (Acceptance Criteria Engine)*
*Version: 1.0 | Date: January 18, 2026*

```

***

## 📋 RESUMO EXECUTIVO

Criei um **prompt de implementação completo** seguindo a metodologia **A.P.T.E** que integra as funcionalidades do [Slack](https://slack.com/features) e [Linear](https://linear.app/features) no seu projeto GPUS.[^1][^2][^3][^4]

### ✨ Principais Recursos a Implementar

**Do Slack:**
- Canais públicos/privados organizados por equipes e projetos
- Mensagens diretas (1-on-1 e em grupo)
- Editor de texto rico com Markdown, emojis e @menções
- Threads de conversa e reações com emoji
- Busca global e notificações em tempo real[^5][^6]

**Do Linear:**
- Sistema de issues com IDs automáticos (GPUS-123)
- Board Kanban com drag-and-drop
- Projetos e roadmaps com timeline
- Cycles (sprints) com planejamento automático
- Command palette com atalhos de teclado[^3][^4]

### 🏗️ Arquitetura Técnica

O prompt detalha:
- **Extensões do schema Convex** com 10+ novas tabelas
- **30+ componentes React** a serem criados
- **20+ funções Convex** (queries/mutations)
- **Rotas TanStack Router** para novos módulos
- **Integrações** com CRM, Dashboard e Chat existentes

### 🎯 Benefícios

- **Comunicação unificada**: Time todo em um só lugar
- **Rastreamento de tarefas**: Issues vinculados a leads e projetos
- **Produtividade**: Sprints, roadmaps e métricas integradas
- **Real-time**: Tudo sincronizado instantaneamente via Convex

O prompt está pronto para ser usado por qualquer desenvolvedor ou AI agent para implementar essas funcionalidades de forma incremental e sem quebrar o código existente! 🚀
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: prompt.md
[^2]: https://slack.com/features
[^3]: https://everhour.com/blog/linear-issue-tracking/
[^4]: https://www.morgen.so/blog-posts/linear-project-management
[^5]: https://foxspace.net/5-key-slack-features/
[^6]: https://cloudmasonry.com/key-features-slack/
[^7]: mastgerplanner.md
[^8]: https://slack.com/team-collaboration-tool
[^9]: https://www.zams.com/blog/slack-the-ultimate-guide-to-team-communication-and-collaboration
[^10]: https://dev.to/robbiecahill/how-to-use-slack-webhooks-a-developers-guide-3dcj
[^11]: https://www.webdew.com/blog/features-of-slack
[^12]: https://inventivehq.com/blog/slack-webhooks-guide
[^13]: https://clickup.com/blog/slack-use-cases/
[^14]: https://linear.app
[^15]: https://api.slack.com/messaging/webhooks%20
[^16]: https://www.glowbl.com/blog/en/slack-the-communication-and-collaboration-platform/
[^17]: https://linear.app/features```

