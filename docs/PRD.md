# AI Sales OS — Product Requirements Document (PRD)

## Document Control

- Version: `1.0.0`
- Status: `implementation-ready`
- Last Updated: `2026-03-09`
- Owners: Product + Architecture

---

## 1. Product Goal

Build an AI-native operating system for GDT's sales team (5 reps + manager) where humans and specialized agents collaborate in one workspace to manage client follow-ups, deal rooms, tasks, and reporting — replacing fragmented workflows across WhatsApp, Excel, Zoho, and email.

**Primary outcome:** eliminate the 95% deal loss rate caused by poor follow-up discipline.

**Secondary outcome:** fully replace Zoho CRM by October 2026 so GDT cancels the Zoho subscription and operates entirely within AI Sales OS.

---

## 2. Target Users

| Role | Count | User | Primary Need |
|---|---|---|---|
| Sales Rep | 5 | GDT sales team | Follow-up reminders, conversation context, task management, call logging |
| Sales Manager | 1 | Miriam | Pipeline visibility, activity monitoring, quote approval, reporting |

---

## 3. MVP Scope

### In Scope

| Module | Description |
|---|---|
| Inbox | Agent conversations + auto-created client channels |
| CRM (read) | Zoho sync → Supabase (Accounts, Contacts, Deals, Quotes, Activities) |
| Tasks | Supabase-primary with dual-write to Zoho |
| Agents (4) | Follow Up, Supervisor, Sales Assistant, Reporting |
| Approvals | Miriam gates external sends, quotes, stage changes |
| Call Logging | Mic-listen mode (Web Speech API, $0/rep), post-call AI summary |
| Reporting | Weekly activity report, monthly pipeline report, dashboard |

### Out of Scope (MVP)

- Autonomous external outbound (always requires approval)
- Automated quote generation from expense plans
- WhatsApp Business API integration (personal accounts only)
- Multi-department support beyond sales
- Custom BI/forecasting models
- Automated medical results delivery
- Browser VoIP (Tier A/B/C — post-MVP)

---

## 4. Zoho Replacement Roadmap

**Hard deadline: October 2026 — Zoho subscription cancelled.**

| Phase | Dates | Zoho Role | AI Sales OS Role |
|---|---|---|---|
| 1 (MVP) | Mar – May 2026 | Source of truth for CRM | Primary UI for agents, tasks, inbox. Reads from Zoho. |
| 2 | Jun – Aug 2026 | Background sync only. Reps stop opening Zoho. | Full CRM managed natively. Writes back to Zoho for safety. |
| 3 | Sep 2026 | Read-only archive. Final export/validation. | Complete replacement. |
| 4 | Oct 2026 | **Cancelled.** | Sole platform. Zoho data archived. |

### Module Replacement Checklist

| Zoho Module | AI Sales OS Equivalent | Phase Gate |
|---|---|---|
| Accounts | `clients` (with segments) | Phase 1 |
| Contacts | `contacts` (FK → clients) | Phase 1 |
| Deals | `deals` (8-stage pipeline) | Phase 1 |
| Quotes | Quote builder + approval flow | Phase 2 |
| Activities | Tasks + agent-logged activities + call logs | Phase 1 |

### Transition Gates

**Phase 1 → 2:** All 5 Zoho modules readable · rep adoption > 50% · task dual-write reliable

**Phase 2 → 3:** Rep adoption > 80% · all CRM writes in AI Sales OS · Miriam confirms Zoho redundant

**Phase 3 → 4:** All Zoho data exported + verified · 2-week parallel run, zero data loss · Miriam sign-off

---

## 5. Non-Negotiable Constraints

1. **Miriam approves** all quotes before sending to clients
2. **Miriam approves** all external outbound communication
3. **Human approval** for deal stage → Closed Won / Closed Lost
4. **Human approval** for external meeting scheduling
5. **Human approval** for price negotiation or modification
6. All agent output in **Spanish (es-MX)**
7. Typed interfaces across app, agents, DB, integrations
8. Prompts isolated in `packages/prompts`
9. No raw SQL in agent prompts — agents use typed service interfaces
10. Supabase RLS on all tables (org-scoped)

---

## 6. Feature Specifications

### 6.1 — Authentication & Authorization

**Provider:** Supabase Auth (email + password for MVP; Google SSO post-MVP).

| Concept | Detail |
|---|---|
| Users | 6 total (5 reps + Miriam). Seeded on project creation. Self-registration disabled. |
| Roles | `rep`, `manager`. Stored in `users.role`. |
| Org isolation | All tables scoped by `organization_id`. RLS enforces. |
| Session | Supabase JWT, httpOnly cookie via Next.js middleware. Token refresh handled by `@supabase/ssr`. |
| Route protection | Next.js middleware checks auth on all routes except `/login`. |

**Screens:**
- `/login` — email + password form. Redirect to `/` on success.
- No signup page. Users are created by seed script or Miriam via admin.

### 6.2 — Inbox & Conversation Threading

The inbox is the primary workspace. It replaces WhatsApp + Zoho as the single place reps work.

**Layout:**

```
┌──────┬────────────────┬──────────────────────┬──────────────────┐
│ Nav  │   Sidebar      │    Conversation       │  Thread / Detail │
│ Rail │   (agents +    │    (messages)          │  Panel           │
│      │   channels)    │                        │                  │
└──────┴────────────────┴──────────────────────┴──────────────────┘
```

- **Nav rail**: Agent icons, quick nav to Dashboard, Tasks, Settings. Call mode selector.
- **Sidebar**: Agent list (each with main conversation) + nested client channels. Unread badges. Search.
- **Conversation**: Message list (user/agent/system types), rich message composer, slash commands.
- **Thread panel**: Client channel detail, deal info, contact card.

**Conversation model:**
- Each agent has exactly 1 main conversation per user.
- When a client is detected in a message (entity extraction), a client channel is auto-created under that agent.
- Client channels persist and reuse. They carry context from main conversation on first creation.
- Messages have types: `user`, `agent`, `system`.
- Agent messages can contain inline actions (tasks created, quotes prepared, approval cards).

**Slash commands (MVP):**
- `/resumen [cliente]` — client context summary
- `/pipeline` — current pipeline overview
- `/reporte` — trigger activity report
- `/tarea [título]` — create task manually

**Composer:**
- Text input with send button
- `@mention` for client/contact names (triggers entity extraction)
- Slash command autocomplete
- Supports rich agent action cards inline

### 6.3 — CRM: Clients, Contacts & Deals

**Client segments** (based on annual revenue MXN):

| Segment | Revenue Range | SLA (days) | Follow-up Priority |
|---|---|---|---|
| Charales | < $10,000 | 7 | Low |
| Truchas | $12,000 – $20,000 | 5 | Medium |
| Atunes | $20,000 – $50,000 | 5 | Medium |
| Tiburones | $100,000 – $400,000 | 3 | High |
| Ballenas | $400,000+ | 2 | Critical |

**Pipeline stages** (8):

```
Prospecto Identificado → Primer Contacto → Descubrimiento →
Cotización en Preparación → Cotización Enviada → Seguimiento/Negociación →
Cerrado Ganado → Cerrado Perdido
```

**Deal room view** (route: `/deals/[id]`):
- Header: client name, segment badge, deal value, stage, assigned rep
- Tabs: Conversations, Tasks, Timeline, Quotes
- Conversations tab: all threads related to this deal across agents
- Tasks tab: tasks linked to this deal
- Timeline tab: chronological agent actions + user actions + call logs
- Quotes tab: prepared quotes with approval status

**Client detail view** (route: `/clients/[id]`):
- Contact list, deal history, segment info, last activity, call history
- Quick actions: call, create task, create deal

**Contact roles:** RH, Seguridad e Higiene, Médico, Compras, Director

### 6.4 — Task System

**Source of truth:** Supabase. Zoho is synced for backward compatibility.

**Task properties:**
- `title`, `description`, `status` (pending | in_progress | done | dismissed)
- `priority` (low | medium | high | urgent)
- `due_date`, `assigned_to` (user), `client_id`, `deal_id`, `conversation_id`
- `created_by` (agent | user), `agent_name`
- `zoho_task_id`, `zoho_synced_at` (for dual-write)

**Dual-write behavior:**
| Event | Supabase | Zoho |
|---|---|---|
| Agent creates task | Immediate | Sync within 5 min |
| User creates task in app | Immediate | Sync within 5 min |
| Task created in Zoho | Pulled on next sync | Already there |
| Task updated in app | Immediate | Sync pushes update |
| Task completed in Zoho | Pulled on next sync | Already there |

**Conflict resolution:** last-write-wins by `updated_at`.

**Task list view** (route: `/tasks`):
- Filters: by assignee, status, priority, due date, client, deal
- Grouped by: today, overdue, upcoming, completed
- Quick mark done / dismiss from list

### 6.5 — Agent System

Four specialized agents, orchestrated by a supervisor pattern via LangGraph.

**Execution model:** Proactive, execute-first. Agents detect signals → do the full work → present completed artifacts. No "¿Quieres que haga X?" messages. The human gate is on the output, not the intent.

**Action classification:**
| Class | Examples | Gate |
|---|---|---|
| Auto-applied | Tasks, internal notes, summaries, risk flags, call logs, reports | Persist + notify |
| Approval-required | External sends, quotes, stage changes (Won/Lost), meeting scheduling, price mods | Store as pending → approval UI |
| Blocked | Outside agent scope or violating org policy | Discard + log |

#### 6.5.1 — Follow Up Agent

- **Trigger:** Cron every 4 hours scans active deals.
- **Signal:** Deal with no activity in 5+ days (adjusted by segment SLA).
- **Action:** Creates follow-up task with due date = today. Drafts follow-up message. Posts proactively in agent conversation.
- **Model:** GPT-4o-mini (lightweight automation).

#### 6.5.2 — Supervisor Agent

- **Trigger:** Daily cron at 7:00 AM CST. Weekly cron for dormant clients.
- **Signals:** Stale deals, high-value deals at risk, unassigned leads, overdue tasks, clients with no activity in 90+ days.
- **Action:** Posts daily pipeline summary. Creates reactivation deals for dormant clients. Flags risks. Monitors rep activity (alerts on 0-activity days).
- **Model:** GPT-4o-mini for routing/classification, escalate to GPT-4o on low confidence.

#### 6.5.3 — Sales Assistant Agent

- **Trigger:** User messages ("¿Qué ha pasado con [cliente]?"), deal context requests, upsell signals.
- **Action:** Generates client context summaries as structured cards. Suggests 1–3 next actions. Detects upsell/renewal opportunities and auto-prepares quotes.
- **Model:** GPT-4o for drafting, GPT-4o-mini for summaries.

#### 6.5.4 — Reporting Agent

- **Trigger:** Weekly cron (Friday 5 PM), monthly cron (1st of month), on-demand via `/reporte`.
- **Action:** Generates weekly activity report (calls, follow-ups, quotes, deals per rep). Generates monthly pipeline report (value, conversion, cycle time). Posts to conversation.
- **Model:** GPT-4.1 for deep analysis, GPT-4o-mini for quick summaries.

**Intent routing:**

```
User message → IntentClassifier (GPT-4o-mini)
  → { intent, confidence, rationale, selectedAgent }
  → if confidence < 0.7: escalate to Supervisor
  → Dispatch to specialized agent with model policy
```

Route table:
| Intent | Agent |
|---|---|
| `technical` | Technical Agent |
| `sales` | Sales Assistant |
| `follow_up` | Follow Up Agent |
| `reporting` | Reporting Agent |
| `supervisor` | Supervisor Agent |
| `unknown` | Supervisor (clarify + re-route) |

### 6.6 — Approval Workflows

**Approval queue** (accessible to `manager` role, badge count in nav).

**Approval item:**
- What the agent did (action summary)
- Why (rationale, confidence score)
- The artifact (quote content, message draft, stage change details)
- Approve / Reject / Edit buttons
- Approved → immediate execution. Rejected → feedback to agent.

**Approval-required actions:**
- Sending quotes to clients
- Any external outbound communication
- Deal stage → Closed Won or Closed Lost
- Meeting scheduling with external attendees
- Price negotiation or modification

### 6.7 — Call Logging (Mic-Listen Mode)

**MVP tier: Mic-Listen ($0/rep)**

Rep places their phone on speakerphone near their laptop mic. The browser captures audio via Web Speech API and generates a live Spanish transcript. No recording — transcript only.

**Flow:**
1. Rep clicks phone icon next to a contact → CallPanel opens as full-screen overlay
2. CallPanel shows: contact info, deal context, call history, talking points
3. Rep dials client on their phone (manual or `tel:` link)
4. Web Speech API captures and transcribes in real-time (es-MX)
5. Rep types notes during the call
6. Rep clicks "Colgar" → transcript + notes sent to `/api/call-summary`
7. LLM generates structured summary, follow-up tasks, and suggested WhatsApp message
8. Rep can send follow-up via WhatsApp Web deep link (pre-filled)
9. Call log saved to `call_logs` table

**CallPanel modes** (future tiers have adapted UI):
| Mode | Source | Cost |
|---|---|---|
| `mic-listen` | Web Speech API | $0 |
| `hybrid-quo` | Quo webhooks → Realtime | ~$23/rep |
| `hybrid-device` | Web Audio → Whisper | $80-150 once |
| `voip` | Quo real-time | ~$23/rep |

### 6.8 — Reporting Dashboard

**Route:** `/dashboard`

**Charts:**
- Pipeline funnel (deals by stage)
- Activity trend (calls, follow-ups over time — Recharts line chart)
- Revenue by segment (Recharts bar chart)
- Rep activity comparison (calls, tasks, deals per rep)

**Filters:** by rep, date range, segment.

**Data source:** Supabase queries. Near-real-time via Realtime subscription on aggregation triggers.

---

## 7. Database Schema

All tables in Supabase PostgreSQL with RLS. `organization_id` scopes every row.

### 7.1 — Organizations & Users

```sql
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('rep', 'manager')),
  avatar_url      TEXT,
  phone           TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 7.2 — CRM (Clients, Contacts, Deals)

```sql
CREATE TYPE client_segment AS ENUM ('charales', 'truchas', 'atunes', 'tiburones', 'ballenas');
CREATE TYPE deal_stage AS ENUM (
  'prospecto_identificado', 'primer_contacto', 'descubrimiento',
  'cotizacion_preparacion', 'cotizacion_enviada', 'seguimiento_negociacion',
  'cerrado_ganado', 'cerrado_perdido'
);

CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name            TEXT NOT NULL,
  segment         client_segment NOT NULL,
  industry        TEXT,
  phone           TEXT,
  website         TEXT,
  city            TEXT,
  state           TEXT,
  employee_count  INT,
  service_type    TEXT,
  notes           TEXT,
  zoho_account_id TEXT,
  zoho_created_at TIMESTAMPTZ,
  zoho_updated_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id       UUID NOT NULL REFERENCES clients(id),
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  mobile          TEXT,
  department      TEXT,
  title           TEXT,
  contact_role    TEXT CHECK (contact_role IN ('rh', 'seguridad_higiene', 'medico', 'compras', 'director')),
  zoho_contact_id TEXT,
  zoho_created_at TIMESTAMPTZ,
  zoho_updated_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id       UUID NOT NULL REFERENCES clients(id),
  assigned_to     UUID REFERENCES users(id),
  title           TEXT NOT NULL,
  stage           deal_stage NOT NULL DEFAULT 'prospecto_identificado',
  value           NUMERIC(12,2),
  currency        TEXT DEFAULT 'MXN',
  expected_close  DATE,
  probability     INT CHECK (probability BETWEEN 0 AND 100),
  lost_reason     TEXT,
  notes           TEXT,
  zoho_deal_id    TEXT,
  zoho_created_at TIMESTAMPTZ,
  zoho_updated_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 7.3 — Tasks

```sql
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'dismissed')),
  priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date        TIMESTAMPTZ,
  assigned_to     UUID REFERENCES users(id),
  client_id       UUID REFERENCES clients(id),
  deal_id         UUID REFERENCES deals(id),
  conversation_id UUID REFERENCES conversations(id),
  created_by      TEXT NOT NULL CHECK (created_by IN ('agent', 'user')),
  agent_name      TEXT,
  zoho_task_id    TEXT,
  zoho_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 7.4 — Conversations & Messages

```sql
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  type            TEXT NOT NULL CHECK (type IN ('main', 'client_channel')),
  agent_id        TEXT NOT NULL,
  user_id         UUID REFERENCES users(id),
  client_id       UUID REFERENCES clients(id),
  deal_id         UUID REFERENCES deals(id),
  parent_id       UUID REFERENCES conversations(id),
  title           TEXT,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_type     TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'system')),
  sender_id       UUID REFERENCES users(id),
  agent_name      TEXT,
  content         TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}',
  parent_id       UUID REFERENCES messages(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### 7.5 — Agent Actions

```sql
CREATE TABLE agent_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  agent_name      TEXT NOT NULL,
  action_type     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending_approval', 'approved', 'rejected', 'blocked')),
  input           JSONB,
  output          JSONB,
  rationale       TEXT,
  confidence      NUMERIC(3,2),
  model_used      TEXT,
  token_usage     JSONB,
  estimated_cost  NUMERIC(8,6),
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMPTZ,
  client_id       UUID REFERENCES clients(id),
  deal_id         UUID REFERENCES deals(id),
  conversation_id UUID REFERENCES conversations(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agent_actions_agent_date ON agent_actions(agent_name, created_at);
CREATE INDEX idx_agent_actions_status ON agent_actions(status) WHERE status = 'pending_approval';
```

### 7.6 — Call Logs

```sql
CREATE TABLE call_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id),
  user_id           UUID NOT NULL REFERENCES users(id),
  contact_id        UUID REFERENCES contacts(id),
  deal_id           UUID REFERENCES deals(id),
  call_mode         TEXT NOT NULL CHECK (call_mode IN ('mic-listen', 'voip', 'hybrid-quo', 'hybrid-device')),
  direction         TEXT DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
  started_at        TIMESTAMPTZ NOT NULL,
  ended_at          TIMESTAMPTZ,
  duration_seconds  INT,
  recording_url     TEXT,
  transcript        JSONB,
  ai_summary        TEXT,
  suggested_tasks   JSONB,
  follow_up_message TEXT,
  transcript_source TEXT CHECK (transcript_source IN ('web_speech_api', 'quo_ai', 'whisper')),
  quo_call_id       TEXT,
  audio_device      TEXT,
  cost_usd          NUMERIC(8,4) DEFAULT 0,
  synced_to_zoho    BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

### 7.7 — Embeddings (RAG Memory)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  content     TEXT NOT NULL,
  embedding   vector(1536),
  source_type TEXT NOT NULL CHECK (source_type IN ('message', 'call_log', 'task', 'deal_note')),
  source_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT,
  org_id UUID
) RETURNS TABLE (id UUID, content TEXT, source_type TEXT, source_id UUID, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.content, e.source_type, e.source_id,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  WHERE e.organization_id = org_id
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 7.8 — Documents & Quotes

```sql
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  type            TEXT NOT NULL CHECK (type IN ('quote', 'contract', 'report', 'other')),
  title           TEXT NOT NULL,
  client_id       UUID REFERENCES clients(id),
  deal_id         UUID REFERENCES deals(id),
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'accepted', 'rejected')),
  content         JSONB,
  file_url        TEXT,
  total_amount    NUMERIC(12,2),
  currency        TEXT DEFAULT 'MXN',
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  zoho_quote_id   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 7.9 — Calendar Events

```sql
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title           TEXT NOT NULL,
  description     TEXT,
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  location        TEXT,
  event_type      TEXT CHECK (event_type IN ('call', 'meeting', 'follow_up', 'internal')),
  user_id         UUID REFERENCES users(id),
  client_id       UUID REFERENCES clients(id),
  deal_id         UUID REFERENCES deals(id),
  is_external     BOOLEAN DEFAULT false,
  zoho_event_id   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. API Endpoints

### 8.1 — Agent Runtime (`apps/agents` on Railway)

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/api/agent/invoke` | Send message to agent, get response | Bearer (Supabase JWT) |
| POST | `/api/agent/webhook/quo` | Receive Quo call webhooks | Quo signature |
| GET | `/api/agent/health` | Health check | None |

**`POST /api/agent/invoke`**

```typescript
// Request
{
  message: string;
  conversationId: string;
  agentName?: string;       // optional — auto-detected via intent
  metadata?: {
    clientId?: string;
    dealId?: string;
  };
}

// Response
{
  message: string;
  actions: Array<{
    type: 'task_created' | 'deal_updated' | 'quote_prepared' | 'report_generated';
    data: Record<string, unknown>;
    status: 'auto-applied' | 'pending_approval';
  }>;
  metadata: {
    agentName: string;
    intent: string;
    confidence: number;
    modelUsed: string;
    tokenUsage: { prompt: number; completion: number };
    estimatedCost: number;
    latencyMs: number;
  };
}
```

### 8.2 — Web App API Routes (`apps/web` on Vercel)

| Method | Path | Description |
|---|---|---|
| POST | `/api/call-summary` | Generate AI call summary from transcript |
| GET | `/api/clients` | List clients (paginated, filterable) |
| GET | `/api/clients/[id]` | Get client detail with contacts + deals |
| GET | `/api/deals` | List deals (paginated, filterable) |
| GET | `/api/deals/[id]` | Get deal detail with tasks + timeline |
| GET | `/api/tasks` | List tasks (filterable by assignee, status) |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/[id]` | Update task status/details |
| GET | `/api/conversations` | List conversations for current user |
| GET | `/api/conversations/[id]/messages` | Get messages for conversation |
| POST | `/api/conversations/[id]/messages` | Send message (triggers agent invoke) |
| GET | `/api/approvals` | List pending approvals (manager only) |
| POST | `/api/approvals/[id]/approve` | Approve an agent action |
| POST | `/api/approvals/[id]/reject` | Reject an agent action |
| GET | `/api/dashboard/pipeline` | Pipeline funnel data |
| GET | `/api/dashboard/activity` | Activity trend data |
| GET | `/api/dashboard/revenue` | Revenue by segment data |

### 8.3 — Cron Jobs (Railway Scheduled Tasks)

| Schedule | Job | Description |
|---|---|---|
| Every 15 min | `zoho-sync` | Incremental Zoho → Supabase sync |
| Every 5 min | `task-sync` | Supabase tasks → Zoho Activities push |
| Every 4 hours | `stale-deal-scan` | Follow Up Agent: flag deals with no activity > SLA |
| Daily 7:00 AM CST | `daily-pipeline-scan` | Supervisor: pipeline summary, risk flags, overdue tasks |
| Weekly Monday | `dormant-client-scan` | Supervisor: clients with no activity > 90 days |
| Friday 5:00 PM CST | `weekly-report` | Reporting Agent: weekly activity report |
| 1st of month | `monthly-report` | Reporting Agent: monthly pipeline report |

---

## 9. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, CSS custom properties (HSL tokens) |
| Components | ShadCN UI + Radix UI primitives |
| Icons | Font Awesome 7 (Solid) |
| Font | Inter Tight |
| State / Fetch | React Query (TanStack Query v5) |
| Charts | Recharts |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Database | Supabase PostgreSQL + pgvector |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage (recordings, documents) |
| LLM | OpenAI (GPT-4.1, GPT-4o, GPT-4o-mini) |
| Agent orchestration | LangGraph (TypeScript) |
| Monorepo | Turborepo + pnpm |
| Frontend deploy | Vercel |
| Agent deploy | Railway |
| Transcription | Web Speech API (MVP), Whisper (post-MVP) |

---

## 10. Repository Structure

```
apps/
  web/                    # Next.js 14 — deployed on Vercel
    app/
      (auth)/login/       # Login page
      (app)/              # Authenticated routes (inbox, deals, tasks, dashboard)
      api/                # API routes (call-summary, CRUD)
    components/
      ui/                 # ShadCN base components
      call/               # CallPanel, CallControls, etc.
      inbox/              # MessageList, Composer, ThreadPanel
      crm/                # ClientCard, DealRoom, ContactList
      dashboard/          # Charts, filters, KPI cards
      approvals/          # ApprovalQueue, ApprovalCard
    lib/
      supabase/           # Supabase client (browser + server)
      utils.ts
    types/
      speech.d.ts         # Web Speech API type declarations
  agents/                 # Agent runtime — deployed on Railway
    src/
      invoke.ts           # POST /api/agent/invoke handler
      cron/               # Scheduled jobs (zoho-sync, stale-deal, reports)
      gateway/            # ModelGateway (typed LLM interface)
packages/
  database/               # Schema, migrations, typed queries
    migrations/           # SQL migration files (numbered)
    types.ts              # Generated TypeScript types from schema
    queries/              # Typed query functions
  integrations/
    zoho/                 # OAuth, sync worker, field mapping
    quo/                  # Call API (post-MVP)
  prompts/                # Agent system prompts (.md files)
  agent-tools/            # Typed tool implementations
    types.ts              # Tool registry types
  ui/                     # Shared design tokens + components
agents/
  langgraph/              # LangGraph orchestration
    src/                  # IntentClassifier, WorkflowEngine, MemoryManager
    policies/             # intent-routing.json, model-routing.json
    workflows/            # Workflow graph definitions
docs/
  ARCHITECTURE.md
  PRD.md
  EPICS.md
  TASKS.md
```

---

## 11. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-side only (Railway + API routes)

# OpenAI
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1   # or compatible endpoint
OPENAI_MODEL=gpt-4o-mini                     # default model

# Zoho CRM
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
ZOHO_API_BASE_URL=https://www.zohoapis.com

# Railway (agent runtime)
RAILWAY_AGENT_URL=                  # Used by web app to invoke agents

# Optional
QUO_API_KEY=                        # Post-MVP calling
QUO_WEBHOOK_SECRET=
```

---

## 12. Implementation Phases

### Phase 1A — Foundation (Week 1-2)

1. Supabase project + run all migrations
2. Auth: login page, middleware, session management
3. Seed data: organization, 6 users, sample clients/contacts/deals from Zoho
4. Supabase client setup (`@supabase/ssr` for Next.js)
5. Basic layout shell (nav rail, sidebar, conversation area)

### Phase 1B — Data Layer (Week 2-3)

1. Zoho OAuth flow in `packages/integrations/zoho`
2. Zoho → Supabase read sync worker (15-min cron on Railway)
3. CRUD API routes for clients, contacts, deals, tasks
4. React Query hooks for all data fetching
5. Real data rendering in inbox sidebar (agents + client channels)

### Phase 1C — Conversations & Agents (Week 3-5)

1. Conversation + message tables wired to inbox UI
2. Real message sending: composer → API route → Supabase → Realtime subscription
3. Agent invoke endpoint on Railway (receives message, runs LangGraph)
4. ModelGateway implementation (task-based model selection, cost logging)
5. Intent classifier integrated with invoke endpoint
6. Follow Up Agent: stale deal scanner + task creation
7. Supervisor Agent: daily pipeline scan + risk flags
8. Sales Assistant Agent: client summary + next actions
9. Reporting Agent: weekly/monthly reports
10. Proactive agent messages (auto-post to conversations)

### Phase 1D — Tasks & Approvals (Week 5-6)

1. Task list view with filters
2. Task creation from UI + from agents
3. Task dual-write sync (Supabase → Zoho)
4. Approval queue UI (manager only)
5. Approval flow: approve → execute, reject → feedback

### Phase 1E — Call Logging & Dashboard (Week 6-7)

1. CallPanel wired to real data (contacts, deals from Supabase)
2. Call logs saved to `call_logs` table on hangup
3. Post-call summary generates real tasks + updates `last_activity_at`
4. Reporting dashboard with pipeline, activity, revenue charts
5. Dashboard data API routes

### Phase 1F — Polish & Launch (Week 7-8)

1. RLS audit on all tables
2. Error handling + loading states across all views
3. Mobile responsive pass
4. Zoho sync validation with real data
5. UAT with Miriam and 1-2 reps

---

## 13. Performance Requirements

| Metric | Target |
|---|---|
| Page load (LCP) | < 2s |
| Agent response (simple) | < 3s |
| Agent response (complex) | < 10s |
| Realtime message delivery | < 500ms |
| Zoho sync cycle | < 60s per run |
| Dashboard data load | < 2s |
| Supabase query (indexed) | < 100ms |

---

## 14. Security Requirements

1. **RLS on all tables** — every query scoped by `organization_id` from JWT
2. **No raw SQL in agent prompts** — agents use typed service interfaces only
3. **API key rotation** — secrets in Vercel/Railway env vars, never in code
4. **Input validation** — Zod schemas on all API route inputs
5. **CORS** — Vercel only allows requests from app domain
6. **Rate limiting** — agent invoke endpoint rate-limited per user (10 req/min)
7. **Audit trail** — all agent actions logged in `agent_actions` with cost + model
8. **Encrypted storage** — Supabase Storage for recordings (encrypted at rest)
9. **No credential logging** — API keys, tokens never appear in logs or responses

---

## 15. Risks and Tradeoffs

| Risk | Mitigation |
|---|---|
| Zoho API rate limits during sync | Incremental sync with `Modified_Time` filter. Backoff on 429. |
| Agent hallucination on client data | RAG retrieval from verified Supabase data, not free generation. Confidence thresholds. |
| Web Speech API accuracy (es-MX) | Mic-listen is for logging context, not legal transcripts. Notes supplement transcript. |
| LLM cost overrun | Per-request cost cap, cheapest model by default, promote only on low confidence. |
| Zoho Oct 2026 deadline pressure | Phase gates enforce incremental delivery. Each phase is independently useful. |
| Single LLM provider dependency | OpenAI has highest uptime. ModelGateway abstraction allows future provider swap. |

---

## 16. Success Metrics (Phase 1)

| Metric | Current | Target |
|---|---|---|
| Deal follow-up rate | ~5% (manual) | > 80% (agent-prompted) |
| Avg deal response time | 5-7 days | < 2 days |
| Calls logged in CRM | ~10% | > 90% (auto-logged) |
| Weekly report generation | 3-4 hours manual | < 1 min (automated) |
| Rep daily active usage | 0 (system doesn't exist) | > 80% of reps daily |

---

## Change Log

### 2026-03-09 — v1.0.0: Implementation-Ready PRD
- Change: Complete rewrite from governance-focused v0.2.0 to implementation-ready v1.0.0. Added: full database schema (10 tables), API endpoint specifications (20+ endpoints), feature specs per module (auth, inbox, CRM, tasks, agents, approvals, calling, dashboard), implementation phases (6 phases over 8 weeks), environment variables, performance requirements, security requirements, success metrics.
- Why: Moving from UI prototyping to real implementation requires concrete schemas, contracts, and phase plans — not just governance rules this was before.
- User Impact: Engineers can start building directly from this document. Every table, endpoint, and feature is specified with enough detail to implement without ambiguity.
- MVP Impact: High clarity gain. Unblocks all implementation workstreams in parallel.
- Owner: Product + Architecture

### 2026-03-08 — v0.2.0: Initial Governance + Operational Lock-In
- Change: Original PRD covering product goal, target users, MVP scope, Zoho roadmap, constraints, model policy, and operational context integration.
- Owner: Architecture

---

## PRD Update Protocol (Mandatory)

For every material change, append one change-log entry with:
1. Change summary
2. Rationale
3. User impact
4. MVP impact (scope, timeline, risk)
5. Owner and date
