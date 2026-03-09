# AI Sales OS - Product Requirements Document (PRD)

## Document Control

- Version: `0.2.0`
- Status: `draft`
- Last Updated: `2026-03-08`
- Owners: Product + Architecture

## Product Goal

Build an AI-native operating system for GDT's sales team (5 reps + manager) where humans and specialized agents collaborate in one workspace to manage client follow-ups, deal rooms, tasks, and reporting — replacing fragmented workflows across WhatsApp, Excel, Zoho, and email.

Primary outcome: **eliminate the 95% deal loss rate caused by poor follow-up discipline.**

Secondary outcome: **fully replace Zoho CRM by October 2026** so GDT cancels the Zoho subscription and operates entirely within AI Sales OS.

## Target Users

| Role | User | Primary Need |
|---|---|---|
| Sales Rep (5) | GDT sales team | Follow-up reminders, conversation context, task management |
| Sales Manager | Miriam | Pipeline visibility, activity monitoring, quote approval |

## MVP Scope (Current)

In scope:
- Zoho CRM read sync (Accounts, Contacts, Deals, Quotes, Activities)
- Inbox with deal rooms per client/deal
- Conversation threading: each agent has a main chat; client-specific channels auto-created on client detection
- Follow Up Agent — stale deal detection (5-7 days), automated reminder tasks
- Supervisor Agent — daily pipeline scan, risk flagging, dormant client detection
- Sales Assistant Agent — conversation summaries, next-action suggestions (Spanish)
- Reporting Agent — weekly activity report, monthly pipeline report
- Task system with dual-write (Supabase primary + Zoho sync)
- Task generation + approval workflow (Miriam approves quotes/outbound)
- Basic reporting dashboard (calls, follow-ups, quotes, conversions)

Out of scope:
- Autonomous external outbound messaging (always requires approval)
- Automated quote generation from expense plans
- WhatsApp integration (personal accounts, not Business API)
- Multi-department support beyond sales
- Custom BI or forecasting models
- Automated medical results delivery

## Zoho Replacement Roadmap

**Hard deadline: October 2026 — Zoho subscription cancelled. GDT operates 100% on AI Sales OS.**

| Phase | Target Date | Zoho Role | AI Sales OS Role |
|---|---|---|---|
| Phase 1 (MVP) | March – May 2026 | Source of truth for CRM data. Tasks synced both ways. | Primary UI for agents, tasks, inbox. Reads from Zoho. |
| Phase 2 | June – August 2026 | Background sync only. Reps stop opening Zoho. | Full CRM: accounts, contacts, deals, quotes, activities managed natively. Writes back to Zoho for data safety only. |
| Phase 3 | September 2026 | Read-only archive. Final data export/validation. | Complete replacement. All operations in AI Sales OS. |
| Phase 4 | October 2026 | **Cancelled.** Subscription terminated. | Sole platform. Zoho data archived in Supabase. |

### Zoho Module Replacement Checklist

Every Zoho module GDT uses must have a functional equivalent in AI Sales OS before Phase 4.

| Zoho Module | AI Sales OS Equivalent | Status |
|---|---|---|
| Accounts | Clients (with segments) | [ ] |
| Contacts | Contacts (FK → clients) | [ ] |
| Deals | Deals (8-stage pipeline) | [ ] |
| Quotes | Quote builder + approval flow | [ ] |
| Activities (Calls/Tasks) | Tasks + agent-logged activities | [ ] |

### Transition Gates

Phase 1 → 2:
- All 5 Zoho modules readable in AI Sales OS
- Rep adoption rate > 50% (daily active use)
- Task dual-write working reliably

Phase 2 → 3:
- Rep adoption rate > 80%
- Reps no longer open Zoho for daily work
- All CRM writes happen in AI Sales OS and sync back
- Miriam confirms Zoho is redundant for her workflows

Phase 3 → 4:
- All Zoho data exported and verified in Supabase
- No data gaps between Zoho and AI Sales OS
- 2-week parallel run with zero data-loss incidents
- Miriam signs off on Zoho cancellation

## Non-Negotiable Constraints

- **Miriam approves** all quotes before sending to clients
- **Miriam approves** all external outbound communication
- **Human approval** for deal stage changes to Closed Won or Closed Lost
- **Human approval** for meeting scheduling with external attendees
- **Human approval** for price negotiation or modification
- All agent outputs in **Spanish**
- Typed interfaces across app, agents, DB, and integrations
- Prompts isolated in `packages/prompts`

## Design and UX Source of Truth

- Figma is canonical for UI specs and component behavior.
- Design tokens must be implemented in `packages/ui` before page-level scaling.
- Deviations from Figma require explicit PRD change-log entries.

## AI Model Policy

- OpenAI is the sole LLM provider for MVP.
- Models: GPT-4.1 (reasoning), GPT-4o (balanced), GPT-4o-mini (cheap automation).
- Model access goes through a typed gateway.
- Routing policy is task-based (`classify`, `summarize`, `draft`, `analyze`, `report`).
- Cost control: heavy tasks on GPT-4o, automation on GPT-4o-mini.

## Change Log

### 2026-03-08 - Initial Governance Baseline
- Change: Added model routing policy (OpenAI default, OpenRouter optional) and PRD governance requirement.
- Why: Ensure model flexibility without prompt/provider coupling and enforce product-document consistency.
- User Impact: More stable agent quality/cost tuning and fewer undocumented behavior shifts.
- MVP Impact: Low implementation risk, medium operational clarity gain.
- Owner: Architecture

### 2026-03-08 - Intent Router and Cost-First Agent Model Mapping
- Change: Added intent-detection dispatch architecture and concrete runtime policy files for intent routing and model routing.
- Why: Implement specialized-agent flow (intent -> agent) while minimizing model spend.
- User Impact: Faster and cheaper handling for simple requests, stronger quality on sales-critical drafting/reporting.
- MVP Impact: Medium complexity increase, high control/observability gain.
- Owner: Architecture

### 2026-03-08 - Intent Router UI Prototype Scaffold
- Change: Added `apps/web` prototype files for flow visualization (`Start -> Detect User Intention -> agent lanes`) and policy panel.
- Why: Materialize routing/model policy into a concrete UI artifact before full app integration.
- User Impact: Clearer transparency on routing decisions, model choice, and cost posture.
- MVP Impact: Low risk, accelerates UX validation.
- Owner: Architecture

### 2026-03-08 - High-Fidelity Graph UI Pass
- Change: Reworked the intent-router screen into a high-fidelity graph-style layout (grid canvas, curved wires, status badges, and model chips) in `apps/web/app/page.tsx` and `apps/web/app/globals.css`.
- Why: Align UI implementation closer to provided design direction and improve stakeholder validation quality.
- User Impact: Better readability of routing flow and selected model per agent.
- MVP Impact: Low risk visual improvement, no architecture impact.
- Owner: Architecture

### 2026-03-08 - Runtime-First Orchestration Correction
- Change: Implemented executable intent-router workflow artifacts under `agents/langgraph` (workflow graph JSON + TypeScript execution engine) to match orchestration intent (n8n/Flowise-style), not just UI representation.
- Why: User requirement is agent runtime behavior and cost-aware model dispatch, not frontend-only flow visualization.
- User Impact: The flow can now be executed as code (`detect_intent -> dispatch_agent -> apply_model_policy`) and integrated with real agent actions.
- MVP Impact: Medium implementation gain, directly advances backend orchestration readiness.
- Owner: Architecture

### 2026-03-08 - Finalized Tech Stack Lock-In
- Change: Locked tech stack to OpenAI-only models (GPT-4.1/4o/4o-mini), added React Query, Radix UI, Supabase Storage, Recharts/Tremor, Turborepo+pnpm, `packages/agent-tools`, and cost efficiency strategy. Removed multi-provider (OpenRouter/Anthropic/Google) references.
- Why: User provided definitive stack spec covering all 16 layers. Single provider simplifies billing, debugging, and integration.
- User Impact: Cleaner dependency surface, faster onboarding, lower operational complexity.
- MVP Impact: Reduces integration risk, locks architectural decisions, enables immediate scaffolding.
- Owner: Architecture

### 2026-03-08 - Railway for Agent Runtime
- Change: Added Railway as deployment target for `apps/agents` (LangGraph runtime, cron jobs, Zoho sync). Vercel remains frontend-only. Updated deployment topology in ARCHITECTURE.md.
- Why: Vercel serverless has timeout limits (10-60s) incompatible with multi-step agent orchestration, long-running LLM chains, and cron jobs. Railway supports persistent workers and scheduled tasks.
- User Impact: Agents run reliably without timeout failures. Cron-driven pipeline scans and Zoho sync work natively.
- MVP Impact: Low risk, ~$5/mo added cost. Cleaner separation of frontend and agent concerns.
- Owner: Architecture

### 2026-03-08 - TASKS.md Scoped to Human-Only Actions
- Change: Rewrote TASKS.md to contain only tasks requiring manual human action (account creation, credentials, deploys, manual testing). All code/scaffold/schema/test tasks removed — those are handled by the AI architect in-repo.
- Why: Avoid duplication between what the AI builds and what appears as a user checklist.
- User Impact: Cleaner task list focused on what the user actually needs to do.
- MVP Impact: No technical impact, improves project clarity.
- Owner: Architecture

### 2026-03-08 - GDT Operations Lock-In
- Change: Integrated complete GDT operational context into ARCHITECTURE.md, PRD.md, all agent prompts, intent routing policy, Zoho field mapping, and tool contracts. All agent prompts rewritten for GDT-specific operations in Spanish. Added client segments (Charales through Ballenas), 8-stage pipeline, SLA thresholds per segment, dormant client detection, and Miriam approval gates.
- Why: User provided comprehensive operational answers covering business model, pipeline stages, team structure, communication patterns, Zoho state, daily workflows, documents, reporting, and pain points. Architecture must be built against real operations, not generic patterns.
- User Impact: Every agent, report, and automation is now calibrated to how GDT actually works. Follow-up discipline (95% of lost deals) is the #1 priority. Spanish output everywhere.
- MVP Impact: High clarity gain. Pipeline stages, SLAs, tool names, and Zoho mappings are now concrete — enabling direct implementation.
- Owner: Architecture

### 2026-03-08 - Conversation Threading & Client Channels
- Change: Added auto-channel creation model. Each agent has a main conversation; when a client is detected in chat, a dedicated client channel is spawned. Channels persist and reuse on revisit.
- Why: Prevents context mixing across clients in a single agent chat. Gives reps and Miriam a clean per-client thread view.
- User Impact: Reps get organized client-specific conversation history per agent. No manual channel creation needed.
- MVP Impact: Medium complexity (needs entity extraction + channel routing). High UX clarity gain.
- Owner: Architecture

### 2026-03-08 - Task Dual-Write & Zoho Replacement Roadmap
- Change: Tasks are now Supabase-primary with async sync to Zoho Activities. Added 3-phase Zoho replacement plan (dual-write → background sync → full replacement).
- Why: Client (GDT) needs to keep using Zoho during transition. AI Sales OS must coexist without data loss, then progressively replace.
- User Impact: Reps see tasks in both systems during Phase 1. Eventually only need AI Sales OS.
- MVP Impact: Adds sync worker complexity. Reduces long-term Zoho dependency risk.
- Owner: Architecture

### 2026-03-08 - Proactive Agent Execution Model
- Change: Agents now follow an execute-first, approve-output paradigm. Instead of asking permission ("¿Preparo la cotización?"), agents do the work immediately and present the completed artifact for review. HITL gates moved from intent approval to output approval.
- Why: Permission-seeking UX creates friction and delays. Reps want results, not confirmation dialogs. Proactive execution matches the "AI-first" principle — the agent is a skilled coworker who does the work and presents it, not a butler asking what to do.
- User Impact: Dramatically faster workflows. Reps see completed drafts, quotes, and tasks instead of proposals. Miriam still approves all external sends and quotes, but reviews finished artifacts, not intentions.
- MVP Impact: No added scope — same approval gates, same actions. Changes agent prompt tone and action pipeline ordering. Medium prompt engineering effort.
- Owner: Architecture

### 2026-03-08 - Epics, User Stories & Tasks Document
- Change: Created `docs/EPICS.md` with 11 epics, 25+ user stories, detailed acceptance criteria, and implementation tasks. Aligned to MVP Build Sequence from ARCHITECTURE.md.
- Why: Need a trackable artifact to validate progress as we build. Stories with acceptance criteria ensure nothing is shipped without verification.
- User Impact: Clear visibility into what's done, what's in progress, and what's next. Each completed story has verifiable criteria.
- MVP Impact: No scope change — documents existing planned scope with acceptance criteria. Enables parallel workstream visibility.
- Owner: Architecture

### 2026-03-09 - Zoho Cancellation Deadline: October 2026
- Change: Set hard deadline of October 2026 for full Zoho replacement and subscription cancellation. Replaced vague "transition triggers" with 4-phase roadmap (March–October) with explicit dates, module replacement checklist, and transition gates per phase.
- Why: GDT pays for Zoho monthly. Every month AI Sales OS doesn't replace Zoho is wasted spend. A hard deadline forces prioritization of Zoho-equivalent features and prevents indefinite dual-system operation.
- User Impact: Reps and Miriam will fully transition off Zoho by October. No more dual data entry. Cost savings from cancelled Zoho subscription.
- MVP Impact: Raises priority of Zoho write-back features (Phases 2-3) and quote builder (must replace Zoho Quotes). Timeline is aggressive but achievable given current scope.
- Owner: Product + Architecture

## PRD Update Protocol (Mandatory)

For every material change, append one change-log entry with:
1. Change summary
2. Rationale
3. User impact
4. MVP impact (scope, timeline, risk)
5. Owner and date
