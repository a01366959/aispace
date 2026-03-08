import { detectIntent } from "./intentClassifier";
import type {
  DispatchResult,
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

function dispatchAgent(intent: IntentResult, policy: IntentRoutingPolicy, riskFlags?: string[]): DispatchResult {
  const route = policy.routes.find((item) => item.intent === intent.intent);

  if (!route || intent.confidence < policy.confidenceThreshold) {
    return {
      agentName: policy.fallback.agent,
      task: "classify",
      requiresApproval: requiresApproval(riskFlags)
    };
  }

  return {
    agentName: route.agent,
    task: route.task,
    requiresApproval: requiresApproval(riskFlags)
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

  trace.push("start");
  const intent = detectIntent(input.message);
  trace.push(`detect-intent:${intent.intent}:${intent.confidence.toFixed(2)}`);

  const dispatch = dispatchAgent(intent, intentPolicy, input.riskFlags);
  trace.push(`dispatch-agent:${dispatch.agentName}:${dispatch.task}`);

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
