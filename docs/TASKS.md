# GDT — Your Task Checklist

> These are **only** the tasks that require your manual action (accounts, credentials, config, testing, deploys). Everything else (code, schemas, scaffolds, tests, tooling) is handled in-repo.
>
> Mark tasks `[x]` when completed.

---

## Phase 0 — Accounts & Infrastructure

- [ ] Create Supabase project (org: GDT)
- [ ] Enable pgvector extension (`CREATE EXTENSION vector;` in Supabase SQL editor)
- [ ] Create Vercel project → link to `a01366959/aispace` repo
- [ ] Create Railway project → link to `a01366959/aispace` repo (for `apps/agents` service)
- [ ] Generate OpenAI API key → add to Railway env vars (`OPENAI_API_KEY`)
- [ ] Copy Supabase URL + anon key + service role key → add to Vercel + Railway env vars
- [ ] Create Zoho CRM developer account → register OAuth app → save client ID/secret
- [ ] Set up custom domain on Vercel (if applicable)
- [ ] Create GitHub environments (`preview`, `production`) with secrets
- [ ] Set up Figma personal access token for MCP (optional, for design token sync)

## Phase 1 — Verify Scaffold

- [ ] Run `pnpm install` at repo root and confirm no errors
- [ ] Run `turbo build` and confirm all packages build
- [ ] Run `turbo dev` and confirm web app starts locally

## Phase 2 — Apply Database

- [ ] Run migrations against your Supabase project (SQL files provided in `packages/database/migrations`)
- [ ] Verify tables exist in Supabase dashboard
- [ ] Test RLS by querying as anon vs authenticated user

## Phase 3 — Connect Services

- [ ] Verify Railway deploys `apps/agents` on push
- [ ] Verify Vercel deploys `apps/web` on push
- [ ] Test agent invoke endpoint from frontend (health check)
- [ ] Connect Zoho OAuth — complete the OAuth flow in the app
- [ ] Verify Zoho sync pulls data into Supabase

## Phase 4 — Validate & Test

- [ ] Send a test message in inbox → confirm agent responds with task suggestion
- [ ] Approve an agent-generated task → confirm it persists
- [ ] Check reporting dashboard shows pipeline data
- [ ] Confirm Realtime updates appear without refresh
- [ ] Review agent cost logs in `agent_actions` table

## Phase 5 — Launch Prep

- [ ] Security review: RLS policies, API key rotation, input validation
- [ ] Performance check: page load, API latency, Realtime stability
- [ ] User acceptance testing with pilot customer (Grupo Diagnostico Toluca)
- [ ] Deploy to production Supabase project (separate from dev)
- [ ] Point production env vars in Vercel + Railway to production Supabase
- [ ] Monitor first week of live usage

---

## Notes

- All code, schemas, migrations, tests, and scaffolding are handled by the AI architect — not listed here.
- If a task here is blocked, flag it and we'll unblock in the next session.
- Keep `docs/PRD.md` changelog updated for any scope changes.
