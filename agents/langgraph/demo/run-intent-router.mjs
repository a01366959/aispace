import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readJson(relativePath) {
  const fullPath = path.resolve(__dirname, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

const intentPolicy = readJson("../policies/intent-routing.json");
const modelPolicy = readJson("../policies/model-routing.json");

function detectIntent(message) {
  const input = message.toLowerCase();
  const keywordMap = {
    technical: ["bug", "error", "api", "schema", "deploy", "architecture"],
    sales: ["proposal", "quote", "client", "next step", "follow-up"],
    follow_up: ["pending", "sla", "reminder", "no response"],
    reporting: ["report", "dashboard", "kpi", "pipeline"],
    supervisor: ["prioritize", "assign", "risk", "escalate"]
  };

  let bestIntent = "unknown";
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(keywordMap)) {
    const score = keywords.reduce((acc, word) => (input.includes(word) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestIntent = intent;
      bestScore = score;
    }
  }

  if (bestScore === 0) {
    return { intent: "unknown", confidence: 0.45, rationale: "No high-signal keywords." };
  }

  return {
    intent: bestIntent,
    confidence: Math.min(0.55 + bestScore * 0.1, 0.95),
    rationale: `Matched ${bestScore} keywords for ${bestIntent}.`
  };
}

function requiresApproval(riskFlags = []) {
  const highRisk = ["external_outbound", "forecast_impact", "external_scheduling"];
  return riskFlags.some((flag) => highRisk.includes(flag));
}

function dispatch(intentResult, riskFlags = []) {
  const route = intentPolicy.routes.find((item) => item.intent === intentResult.intent);
  if (!route || intentResult.confidence < intentPolicy.confidenceThreshold) {
    return {
      agentName: intentPolicy.fallback.agent,
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

function selectModel(dispatchResult, confidence) {
  const taskPolicy = modelPolicy.taskPolicies[dispatchResult.task] ?? modelPolicy.taskPolicies.classify;
  const override = modelPolicy.agentOverrides[dispatchResult.agentName];

  const selected = override?.preferred ?? taskPolicy.preferred;
  const fallback = override?.fallback ?? taskPolicy.fallback;
  const escalated =
    confidence < 0.6 && modelPolicy.global.allowEscalation
      ? override?.escalateOnLowConfidenceTo ?? fallback
      : undefined;

  return {
    selectedModel: escalated ?? selected,
    fallbackModel: fallback,
    maxLatencyMs: taskPolicy.maxLatencyMs,
    temperature: taskPolicy.temperature,
    costCapUsd: modelPolicy.global.maxEstimatedCostUsdPerRequest
  };
}

function run(input) {
  const trace = ["start"];
  const intent = detectIntent(input.message);
  trace.push(`detect-intent:${intent.intent}:${intent.confidence.toFixed(2)}`);

  const dispatchResult = dispatch(intent, input.riskFlags || []);
  trace.push(`dispatch-agent:${dispatchResult.agentName}:${dispatchResult.task}`);

  const model = selectModel(dispatchResult, intent.confidence);
  trace.push(`apply-model-policy:${model.selectedModel}`);
  trace.push("emit-decision");

  return { intent, dispatch: dispatchResult, model, trace };
}

const output = run({
  message: "Client has not replied to proposal. Draft next follow-up and suggest action.",
  riskFlags: ["external_outbound"]
});

console.log(JSON.stringify(output, null, 2));
