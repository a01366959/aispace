# LangGraph Agent Runtime (Prototype)

This package hosts the orchestrated multi-agent runtime.

The runtime assumes `GDT` is the primary inbox entry point and can redirect work into specialist agent threads.

## Planned Modules

- `graph/` supervisor graph definition
- `graph/intent-router/` intention detection and dispatch nodes
- `agents/` specialized agent implementations
- `tools/` action tools (CRM fetch, message draft, task create, report compile)
- `memory/` retrieval wrappers over pgvector + deal/client context
- `policies/` approval and guardrail checks
- `policies/model-routing.json` task/agent model policy with budget caps
- `policies/intent-routing.json` intent to agent dispatch policy

## Implemented Runtime (Current)

- `workflows/intent-router.workflow.json`: declarative workflow graph (n8n/Flowise-style)
- `src/intentClassifier.ts`: intent detection node logic
- `src/workflowEngine.ts`: dispatch + model selection execution engine
- `src/index.ts`: example invocation entrypoint
- `src/types.ts`: typed contracts for workflow I/O
- `demo/run-intent-router.mjs`: plain Node.js runnable demo

## Quick Run (No TS Setup)

From repository root:

```bash
node agents/langgraph/demo/run-intent-router.mjs
```

## Execution Pattern

1. Ingest event from DB/realtime/integration adapter.
2. Build normalized `WorkflowInput`.
3. Run `DetectUserIntention` node.
4. Dispatch to selected specialized agent.
5. Apply model policy (cost-first, quality-threshold).
6. Return structured decision payload (ready for persistence/execution layers).

## Output Contract

Each run should return:
- `actions`: list of proposed or executed actions
- `summary`: human-readable summary for inbox thread
- `requiresApproval`: boolean
- `audit`: decision trace and retrieval references
- `intent`: detected intent and confidence
- `model`: provider, model id, latency, estimated cost
