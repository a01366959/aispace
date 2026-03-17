# GDT

Workspace operativo con agentes especializados para el equipo comercial de GDT.

## What This Repo Contains

- Product and architecture context for GDT
- Initial multi-agent prompt package
- LangGraph runtime structure notes for prototype implementation

## Core Docs

- `docs/ARCHITECTURE.md`: system blueprint, tech stack, orchestration contract, MVP sequence
- `docs/PRD.md`: product requirements and mandatory change log
- `docs/TASKS.md`: project setup and execution checklist
- `agents/langgraph/README.md`: runtime module plan and execution pattern

## Prompt System

All prompt artifacts live in `packages/prompts`:

- `orchestrator-policy.md`
- `supervisor-agent.system.md`
- `sales-assistant-agent.system.md`
- `follow-up-agent.system.md`
- `reporting-agent.system.md`
- `technical-agent.system.md`

Runtime policy artifacts:

- `agents/langgraph/policies/intent-routing.json`
- `agents/langgraph/policies/model-routing.json`

## Target Monorepo Shape

Managed with Turborepo + pnpm.

```text
apps/
	web/            # Next.js 14 (App Router)
	agents/         # Agent runtime (API routes or worker)
packages/
	ui/             # ShadCN + Radix + Tailwind tokens
	database/       # Schema, queries, migrations
	integrations/   # Zoho, email, WhatsApp
	prompts/        # Agent system prompts
	agent-tools/    # Typed tool implementations
agents/
	langgraph/      # Multi-agent orchestration (n8n/Flowise-style)
```

## Current Phase

Architecture and prototype validation:

1. Define architecture
2. Build functional prototype
3. Validate workflows
4. Prepare MVP
