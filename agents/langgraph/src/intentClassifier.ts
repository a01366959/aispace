import type { AgentIntent, IntentResult } from "./types";

const intentKeywords: Record<Exclude<AgentIntent, "unknown">, string[]> = {
  technical: ["bug", "error", "stack", "api", "schema", "deploy", "typescript", "architecture", "falla", "rompio", "backend", "frontend"],
  sales: ["proposal", "quote", "discount", "follow-up message", "client response", "next step", "cotizacion", "cotización", "cliente", "mensaje", "whatsapp", "siguiente paso", "resumen"],
  follow_up: ["reply", "pending", "sla", "reminder", "stalled", "no response", "seguimiento", "sin respuesta", "recordatorio", "pendiente", "llamar", "contactar"],
  dormant_client: ["dormant", "reactivate", "reactivacion", "reactivación", "sin actividad", "perdido", "lleva meses", "cliente dormido"],
  reporting: ["report", "dashboard", "kpi", "pipeline", "conversion", "forecast", "reporte", "metricas", "métricas", "actividad"],
  supervisor: ["prioritize", "assign", "coordinate", "risk", "escalate", "prioriza", "asigna", "coordina", "riesgo", "urgente"]
};

export function detectIntent(message: string): IntentResult {
  const input = message.toLowerCase();

  let bestIntent: AgentIntent = "unknown";
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(intentKeywords) as Array<[AgentIntent, string[]]>) {
    const score = keywords.reduce((acc, keyword) => (input.includes(keyword) ? acc + 1 : acc), 0);

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  if (bestScore === 0) {
    return {
      intent: "unknown",
      confidence: 0.45,
      rationale: "No high-signal keywords found; route to supervisor fallback."
    };
  }

  const confidence = Math.min(0.55 + bestScore * 0.1, 0.95);

  return {
    intent: bestIntent,
    confidence,
    rationale: `Matched ${bestScore} intent keywords for '${bestIntent}'.`
  };
}
