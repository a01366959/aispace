import { detectIntent } from "./intentClassifier";
import type {
  DispatchResult,
  InboxEntryPoint,
  IntentResult,
  IntentRoutingPolicy,
  ModelRoutingPolicy,
  ModelSelection,
  WorkflowDecision,
  WorkflowInput
} from "./types";

function requiresApproval(riskFlags: string[] | undefined): boolean {
  if (!riskFlags || riskFlags.length === 0) {
    return false;
  }

  const highRisk = ["external_outbound", "forecast_impact", "external_scheduling"];
  return riskFlags.some((flag) => highRisk.includes(flag));
}

function buildHandoffSummary(agentName: string, task: string, entryPoint: InboxEntryPoint): string {
  if (entryPoint === "main_chat") {
    return `GDT redirige la solicitud a '${agentName}' y reutiliza o crea el hilo especialista para '${task}'.`;
  }

  return `La solicitud permanece en el hilo actual con '${agentName}' para '${task}'.`;
}

function dispatchAgent(
  intent: IntentResult,
  policy: IntentRoutingPolicy,
  entryPoint: InboxEntryPoint,
  riskFlags?: string[]
): DispatchResult {
  const route = policy.routes.find((item) => item.intent === intent.intent);

  if (!route || intent.confidence < policy.confidenceThreshold) {
    return {
      routedVia: entryPoint === "main_chat" ? "gdt-main" : "direct",
      agentName: policy.fallback.agent,
      task: "classify",
      requiresApproval: requiresApproval(riskFlags),
      handoffMode: entryPoint === "main_chat" ? "redirect_to_agent_thread" : "stay_in_current_thread",
      targetThreadMode: entryPoint === "main_chat" ? "reuse_or_create" : "current_thread",
      handoffSummary: buildHandoffSummary(policy.fallback.agent, "classify", entryPoint)
    };
  }

  return {
    routedVia: entryPoint === "main_chat" ? "gdt-main" : "direct",
    agentName: route.agent,
    task: route.task,
    requiresApproval: requiresApproval(riskFlags),
    handoffMode: entryPoint === "main_chat" ? "redirect_to_agent_thread" : "stay_in_current_thread",
    targetThreadMode: entryPoint === "main_chat" ? "reuse_or_create" : "current_thread",
    handoffSummary: buildHandoffSummary(route.agent, route.task, entryPoint)
  };
}

function pickModel(dispatch: DispatchResult, modelPolicy: ModelRoutingPolicy, confidence: number): ModelSelection {
  const taskPolicy = modelPolicy.taskPolicies[dispatch.task] ?? modelPolicy.taskPolicies.classify;
  const agentOverride = modelPolicy.agentOverrides[dispatch.agentName];

  const selectedModel = agentOverride?.preferred ?? taskPolicy.preferred;
  const fallbackModel = agentOverride?.fallback ?? taskPolicy.fallback;

  const escalatedModel =
    confidence < 0.6 && modelPolicy.global.allowEscalation
      ? agentOverride?.escalateOnLowConfidenceTo ?? fallbackModel
      : undefined;

  return {
    selectedModel: escalatedModel ?? selectedModel,
    fallbackModel,
    maxLatencyMs: taskPolicy.maxLatencyMs,
    temperature: taskPolicy.temperature,
    costCapUsd: modelPolicy.global.maxEstimatedCostUsdPerRequest
  };
}

export function runIntentRouter(
  input: WorkflowInput,
  intentPolicy: IntentRoutingPolicy,
  modelPolicy: ModelRoutingPolicy
): WorkflowDecision {
  const trace: string[] = [];
  const entryPoint = input.entryPoint ?? "main_chat";

  trace.push(`start:${entryPoint}`);
  const intent = detectIntent(input.message);
  trace.push(`detect-intent:${intent.intent}:${intent.confidence.toFixed(2)}`);

  const dispatch = dispatchAgent(intent, intentPolicy, entryPoint, input.riskFlags);
  trace.push(`dispatch-agent:${dispatch.routedVia}:${dispatch.agentName}:${dispatch.task}:${dispatch.targetThreadMode}`);

  const model = pickModel(dispatch, modelPolicy, intent.confidence);
  trace.push(`apply-model-policy:${model.selectedModel}`);

  trace.push("emit-decision");

  return {
    intent,
    dispatch,
    model,
    trace
  };
}
