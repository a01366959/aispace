# AI Sales OS - Architecture Blueprint

## Mission

AI-native operating system for revenue teams where humans and AI agents collaborate in one workspace to manage clients, deals, communications, and daily work. Replace fragmented workflows across WhatsApp, Excel, CRM, and email with a single intelligent platform.



1. **AI First** — every workflow is AI-assisted or AI-driven.
2. **Agent Collaboration** — specialized agents coordinate through an orchestrator.
3. **Human-in-the-Loop** — humans approve sensitive or external actions.
4. **Central Inbox** — all communication in one interface.
5. **Client Context Memory** — persistent memory per client/deal.
6. **Modular Architecture** — easy to add or replace agents.

---

## GDT Operations Context

### Business Model

Grupo Diagnóstico Toluca (GDT) provides clinical laboratory diagnostic services, primarily occupational health testing for companies. Revenue mix: **90% B2B**, 10% individual.

Services:
- New employee medical examinations
- Annual employee health screenings
- Regulatory occupational health tests
- On-site testing via mobile lab units
- Corporate diagnostic campaigns

Revenue model: **recurring but informal** — no formal contracts, clients issue purchase orders. Services are naturally recurring (annual screenings, new-hire testing).

### Client Segments

| Segment | Monthly Revenue (MXN) |
|---|---|
| Charales | < $10,000 |
| Truchas | $12,000 – $20,000 |
| Atunes | $20,000 – $50,000 |
| Tiburones | $100,000+ |
| Ballenas | $400,000+ |

### Sales Cycle

| Company Size | Cycle Length |
|---|---|
| Small | 2–3 weeks |
| Medium | 3–6 weeks |
| Large (corporate) | 1–3 months |

Many deals depend on budget cycles or HR planning periods.

### Sales Pipeline Stages

| # | Stage | Trigger / Definition |
|---|---|---|
| 1 | **Prospect Identified** | Company discovered via prospecting, referral, or existing relationship. Created in Zoho. |
| 2 | **First Contact** | Rep calls the company, identifies correct contact (HR, Safety, Medical). |
| 3 | **Discovery** | Rep determines: # employees, test types, on-site vs lab, frequency. |
| 4 | **Quote Preparation** | Rep builds internal expense plan in Excel (travel, lodging, food, logistics, commissions). |
| 5 | **Quote Sent** | Quote entered into Zoho and delivered to client. **Requires Miriam's approval.** |
| 6 | **Follow-up / Negotiation** | Rep follows up via calls, messages, clarifications. Most deals require multiple follow-ups. |
| 7 | **Closed Won** | Client sends Purchase Order. Sampling logistics scheduled, operations prepares service. |
| 8 | **Closed Lost** | Reasons: poor follow-up (95%), client postponed, competitor selected, budget issues. |

**Stale deal threshold:** 5–7 days without activity.

**Critical insight:** 95% of lost deals are attributed to poor follow-up.

### Team

| Role | Person/Count | Responsibilities |
|---|---|---|
| Sales Reps | 5 | Prospecting, calls, quotes, follow-ups, Zoho updates |
| Sales Manager | Miriam | Supervises activity, assigns follow-ups, approves quotes, forecasts revenue, monitors Zoho |
| Operations / Logistics | Team | Mobile lab deployment, sampling coordination |
| Administration / Billing | Team | Invoicing, purchase order management |

### Communication

- **Primary channel:** Phone calls (best window: 10:00–11:30 AM)
- **Secondary:** In-person visits, email, WhatsApp (likely personal accounts)
- **Language:** Spanish only
- **Typical follow-up flow:** Call → send quote via email → follow up by phone/WhatsApp

### Documents & Quotes

- Quotes built in **Excel** (expense plan: travel, lodging, food, logistics, commissions) → recreated in **Zoho** → sent as **PDF**
- Pricing is **custom per company** (depends on employee count, logistics, mobile unit usage)
- This dual entry (Excel → Zoho) is the biggest time sink for reps

### Zoho CRM — Current State

Zoho is **mandatory** for all sales activity. Already contains existing data.

| Module | Usage |
|---|---|
| Accounts | Companies |
| Contacts | Client contacts (HR, Safety, Medical) |
| Deals | Sales opportunities |
| Quotes | Generated from deals |
| Activities | Calls, commitments, tasks |

**Data quality issue:** Reps update manually throughout the day but often forget to log calls/notes, creating data gaps.

### Reporting Cadence

| Report | Frequency | Metrics |
|---|---|---|
| Activity report | Weekly | Calls, follow-ups, quotes sent |
| Revenue report | Monthly | Pipeline value, conversions, deals per rep |

Most important success factor: **consistent follow-up with clients**.

### Pain Points (Priority Order)

1. **Poor follow-up discipline** — 95% of lost deals. No system enforces persistence.
2. **Dormant clients never reactivated** — no detection for companies that haven't purchased or been contacted recently.
3. **Quote preparation overhead** — duplicate entry from Excel to Zoho.
4. **Forgotten call logging** — reps forget what clients said, miss logging in Zoho.
5. **No stale deal alerts** — follow-up timing depends on rep judgment alone.

---

## Technology Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), React, TailwindCSS, ShadCN UI, Radix UI |
| Server State | React Query (TanStack Query) |
| Realtime | Supabase Realtime |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions, RLS) |
| Vector Store | pgvector (inside Supabase) |
| AI / Agents | LangGraph, OpenAI (GPT-4.1, GPT-4o, GPT-4o-mini) |
| Agent Tools | create_task, update_deal, send_followup, generate_report, schedule_meeting |
| File Storage | Supabase Storage |
| Charts | Recharts or Tremor |
| CRM | Zoho CRM (OAuth + REST API, scheduled sync) |
| Deployment | Vercel (frontend), Railway (agent runtime), Supabase (backend) |
| Monorepo | Turborepo + pnpm |

## Core Entities

Users, Organizations, Clients, Deals, Conversations, Messages, Threads, Channels, Tasks, Events, AgentActions, Embeddings, Documents.

## Conversation Threading & Channel Model

Every agent has a **main conversation** — an open chat where reps interact with that agent freely.

When an agent detects a specific client context inside a main conversation (by mention, CRM lookup, or deal reference), the system **auto-creates a client channel** (thread) dedicated to that client.

### Flow

1. Rep messages an agent in the main chat (e.g. "¿Qué pasa con Cervecería Toluca?").
2. Agent classifies the message → detects `client_id` via entity extraction or CRM lookup.
3. If no channel exists for that client under this agent, the system creates one.
4. The agent response is posted in the **new client channel**, and the rep is redirected there.
5. All subsequent messages about that client happen in the client channel.
6. The main chat remains a general-purpose interface.

### Data Model

```
conversations
  id          UUID PK
  type        'main' | 'client_channel'
  agent_id    FK → agents
  client_id   FK → clients (NULL for main conversations)
  deal_id     FK → deals (optional, set if channel is deal-specific)
  parent_id   FK → conversations (NULL for main, points to main for channels)
  title       text (auto-generated: "{client_name} — {agent_name}")
  created_at  timestamptz
  updated_at  timestamptz

messages
  id              UUID PK
  conversation_id FK → conversations
  sender_type     'user' | 'agent' | 'system'
  sender_id       UUID
  content         text
  metadata        jsonb (detected_client_id, intent, confidence, tool_calls)
  created_at      timestamptz
```

### Rules

- Each agent has exactly **one main conversation** per user.
- Client channels are children of the main conversation (`parent_id`).
- A client channel is scoped to one `client_id` (and optionally one `deal_id`).
- Channels persist — revisiting a client reuses the existing channel.
- Agents carry context from the main chat into the channel on creation.
- Channel list appears as a sidebar/thread panel under the agent's section.

## Task Dual-Write Strategy (Supabase + Zoho)

### Current State

Zoho CRM is the mandatory system of record for GDT sales operations. Reps and Miriam use it daily. AI Sales OS must coexist with Zoho until it can fully replace it.

### Strategy: Supabase-Primary, Zoho-Synced

1. **Tasks are created in Supabase first** — this is the source of truth for AI Sales OS.
2. **A sync worker writes tasks to Zoho Activities** — so reps who still check Zoho see them.
3. **Zoho → Supabase sync** runs on a schedule to pull tasks/activities created directly in Zoho.
4. **Conflict resolution:** Last-write-wins with `updated_at` comparison. Supabase record includes `zoho_task_id` for deduplication.

### Data Model Extension

```
tasks
  id              UUID PK
  title           text
  description     text
  status          'pending' | 'in_progress' | 'done' | 'dismissed'
  priority        'low' | 'medium' | 'high' | 'urgent'
  due_date        timestamptz
  assigned_to     FK → users
  client_id       FK → clients (optional)
  deal_id         FK → deals (optional)
  conversation_id FK → conversations (optional, links task to thread)
  created_by      'agent' | 'user'
  agent_name      text (which agent created it, if agent-created)
  zoho_task_id    text (NULL until synced to Zoho)
  zoho_synced_at  timestamptz
  created_at      timestamptz
  updated_at      timestamptz
```

### Sync Behavior

| Event | Supabase | Zoho |
|---|---|---|
| Agent creates task | ✅ Immediate | ⏳ Sync worker pushes within 5 min |
| User creates task in app | ✅ Immediate | ⏳ Sync worker pushes within 5 min |
| User creates task in Zoho | ⏳ Pulled on next sync cycle | ✅ Already there |
| Task updated in app | ✅ Immediate | ⏳ Sync worker pushes update |
| Task completed in Zoho | ⏳ Pulled on next sync cycle | ✅ Already there |

### Zoho Replacement Path

Phase 1 (MVP): Dual-write. Both systems have tasks. Reps can use either.
Phase 2: AI Sales OS becomes primary UI. Zoho is background sync only.
Phase 3: Zoho sync disabled. All task management in AI Sales OS. Zoho kept as read-only archive.

The `zoho_task_id` and `zoho_synced_at` fields make this transition seamless — when sync is turned off, the data stays intact.

## Development Principles

1. Do not rewrite architecture without clear reason.
2. Keep modules decoupled and composable.
3. Use typed interfaces.
4. Document every new module.
5. Keep prompts in `packages/prompts`.
6. Route model access through typed gateway interfaces.
7. Update `docs/PRD.md` for every material architecture/scope/workflow change.
8. Use Turborepo + pnpm for monorepo management.

## Repository Layout

```text
apps/
  web/                 # Next.js 14 (App Router)
  agents/              # Agent runtime (Next.js API routes or separate worker)
packages/
  ui/                  # ShadCN + Radix components, Tailwind tokens
  database/            # DB schema, typed queries, migrations
  integrations/        # Zoho, email, WhatsApp adapters
  prompts/             # Agent system prompts and policies
  agent-tools/         # Typed tool implementations (create_task, update_deal, etc.)
agents/
  langgraph/           # Multi-agent graph orchestration (n8n/Flowise-style)
```

Monorepo: Turborepo + pnpm

## Runtime Architecture

1. `apps/web` (Vercel) handles inbox UI, deal rooms, tasks, calendar, and reporting views.
2. `apps/agents` (Railway) runs the LangGraph agent runtime — long-running orchestration, cron jobs, scheduled syncs.
3. Supabase acts as system of record for transactional data.
4. Realtime subscriptions propagate agent results and data updates to clients.
5. `agents/langgraph` orchestrates specialized agents through a supervisor graph.
6. Agents read/write through typed service interfaces (not direct ad hoc SQL from prompts).
7. Human approvals gate high-risk actions (external messages, status changes, scheduling).

### Deployment Topology

```text
┌─────────────┐     REST/webhook     ┌──────────────┐
│  apps/web   │ ──────────────────▶  │ apps/agents  │
│  (Vercel)   │                      │  (Railway)   │
└──────┬──────┘                      └──────┬───────┘
       │                                    │
       │  Supabase client                   │  Supabase client
       │  + Realtime sub                    │  + OpenAI API
       │                                    │
       └──────────┐    ┌────────────────────┘
                  ▼    ▼
           ┌──────────────┐
           │   Supabase   │
           │  (Postgres,  │
           │  Auth, RT,   │
           │  Storage)    │
           └──────────────┘
```

- **Frontend → Agents:** REST calls (e.g. `POST /api/agent/invoke`) or Supabase Edge Function triggers.
- **Agents → Frontend:** Writes to Supabase; frontend receives via Realtime subscriptions.
- **Cron jobs** (Zoho sync, SLA checks, pipeline scans) run as scheduled tasks on Railway.

## Intent Detection and Agent Dispatch

Target flow:
1. `Start`
2. `DetectUserIntention` node classifies request intent.
3. Route to specialized agent node by intent.
4. Execute agent with task-specific model policy.
5. Return structured output + cost/latency telemetry.

Route table (MVP):
- `technical`: Technical Agent
- `sales`: Sales Assistant Agent
- `follow_up`: Follow Up Agent
- `reporting`: Reporting Agent
- `supervisor`: Supervisor Agent
- `unknown`: Supervisor Agent (clarify + re-route)

Node contract:
- `DetectUserIntention.input = { message, threadContext, dealContext }`
- `DetectUserIntention.output = { intent, confidence, rationale, selectedAgent }`
- `Dispatch.output = { agentName, modelPolicy, requiresApproval }`

Implemented runtime artifacts:
- `agents/langgraph/workflows/intent-router.workflow.json`
- `agents/langgraph/src/intentClassifier.ts`
- `agents/langgraph/src/workflowEngine.ts`

## Model Routing Strategy

Decision:
- Use OpenAI as the sole LLM provider for MVP.
- Route through a typed model gateway in `apps/agents`.

Why:
- OpenAI has the most reliable tool calling and stable APIs.
- Keeping one provider simplifies integration, billing, and debugging.
- Different tasks still use different models for cost control.

Contract:
- `ModelTask = "classify" | "summarize" | "draft" | "analyze" | "report"`
- `ModelPolicy = { preferredModel, fallbackModel, maxLatencyMs, maxCostPer1k, temperature }`
- `ModelGateway.run(task, input, policy) -> { output, modelUsed, latencyMs, tokenUsage, estimatedCost }`

MVP model mapping:
- `classify` and `summarize`: `gpt-4o-mini` (cheapest, fast)
- `draft`: `gpt-4o` (balanced quality)
- `analyze` and `report`: `gpt-4.1` (strongest reasoning)

Agent-level model baseline (cost-first):
- Supervisor Agent: `gpt-4o-mini` for routing/classification, escalate to `gpt-4o` on low confidence
- Sales Assistant Agent: `gpt-4o` for drafting, `gpt-4o-mini` for summaries
- Follow Up Agent: `gpt-4o-mini` (lightweight automation)
- Reporting Agent: `gpt-4.1` for deep analysis, `gpt-4o-mini` for quick summaries

Budget policy:
- Default to cheapest model that satisfies quality threshold for the task.
- Promote to higher-cost model only on low confidence, high-value deal, or failed first attempt.
- Enforce per-request cost cap and return partial-safe output if cap is reached.

Guardrails:
- No direct provider calls inside agent prompts.
- Log provider/model in `AgentAction.metadata` for observability.
- Add per-task fallback policy for availability incidents.

## Agent Orchestration Contract

Each agent must expose:
- `name`
- `systemPrompt`
- `tools`
- `memoryScope`
- `inputSchema`
- `outputSchema`

Supervisor responsibilities:
- Prioritize pending events
- Delegate work to specialized agents
- Resolve conflicts between agent suggestions
- Emit `AgentAction` records with rationale and confidence

## Data Flow

1. Event enters system (new CRM update, inbound message, stale deal signal).
2. Supervisor classifies event and selects one or more agents.
3. Agent retrieves context from:
- operational DB rows
- RAG memory (pgvector)
- thread/deal history
4. Agent proposes actions (`draft_message`, `create_task`, `escalate`, `summarize`).
5. Policy layer determines whether action is:
- auto-executable
- approval-required
- blocked
6. Approved actions are persisted and published to realtime channels.

## Human-in-the-Loop Policy

Always require **Miriam's approval** for:
- Sending quotes to clients (Quote Sent stage)
- Any external outbound communication (email, WhatsApp)
- Deal stage changes to Closed Won or Closed Lost
- Meeting scheduling with external attendees
- Negotiating or modifying pricing
- Sending medical results

Allow **auto-execution** for:
- Internal summaries and conversation notes
- Follow-up reminder tasks assigned to reps
- Dormant client detection alerts
- Internal daily/weekly activity reports
- Deal risk flagging
- Task creation for reps (rep can dismiss)

## Design Source of Truth (Figma -> Code)

1. Figma is the canonical source for colors, typography, spacing, radius, and component variants.
2. Sync tokens into `packages/ui` before page implementation.
3. Build UI from tokenized primitives; avoid hard-coded one-off values.
4. If MCP Figma context is available, implementation must reference it for component behavior/states.
5. Any deviation from Figma requires a documented decision in PRD change log.

Current implementation note:
- This repository stores the flow implementation contract from your provided design (intention node -> specialized agents).
- Direct Figma API export is not available from this environment without authenticated MCP/Figma API access.
- Once MCP access is provided, map node variants/states into `packages/ui/tokens/*` and `packages/ui/components/*` without changing the routing contract.

Implementation artifacts:
- `packages/ui/tokens/*` for design tokens
- `packages/ui/components/*` for shared building blocks
- `docs/PRD.md` change log entry for any design-level scope change

## PRD Change Governance

Rule:
- Every architecture, workflow, policy, or scope change must update `docs/PRD.md` in the same change set.

Minimum PRD update payload:
- What changed
- Why it changed
- User impact
- MVP impact (scope/time/risk)
- Owner and date

## MVP Build Sequence

1. Zoho read integration — sync Accounts, Contacts, Deals, Quotes, Activities
2. Database schema mapping Zoho entities to local tables + conversations/channels/tasks schema
3. Inbox + deal room UI shell with Zoho-synced data + conversation threading
4. Task system with dual-write to Supabase + Zoho sync worker
5. Follow Up Agent — stale deal detection (5-7 days), automated reminder tasks for reps
6. Supervisor Agent — daily pipeline scan, risk flagging, dormant client detection
7. Sales Assistant Agent — conversation summaries, suggested next actions, follow-up draft suggestions (Spanish)
8. Reporting Agent — weekly activity report, monthly pipeline report
9. Task generation + approval workflow (Miriam approves quotes/outbound)
10. Basic reporting dashboard (calls, follow-ups, quotes, conversions)
11. Phase 2 planning: Zoho write-back for deals/quotes, progressive Zoho replacement

Priority rationale: Follow-up discipline is the #1 pain point (95% of lost deals). Zoho sync must come first because all existing data lives there.

## Non-Goals for MVP

- Autonomous outbound messaging (always requires approval)
- Automated quote generation from expense plans (future)
- WhatsApp integration (future — personal accounts, not Business API yet)
- Multi-department support beyond sales
- Custom BI or forecasting models
- Automated medical results delivery
