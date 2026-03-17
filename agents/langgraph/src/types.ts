export type AgentIntent = "technical" | "sales" | "follow_up" | "dormant_client" | "reporting" | "supervisor" | "unknown";

export type InboxEntryPoint = "main_chat" | "agent_thread";

// ─── GDT Client Segments ──────────────────────────────────────────────────────

export type ClientSegment = "charales" | "truchas" | "atunes" | "tiburones" | "ballenas";

export type DealStage =
  | "prospect_identified"
  | "first_contact"
  | "discovery"
  | "quote_preparation"
  | "quote_sent"
  | "follow_up_negotiation"
  | "closed_won"
  | "closed_lost";

export const SEGMENT_SLA_DAYS: Record<ClientSegment, number> = {
  ballenas: 2,
  tiburones: 3,
  atunes: 5,
  truchas: 5,
  charales: 7,
};

export const STALE_DEAL_THRESHOLD_DAYS = 5;

export type WorkflowNodeType =
  | "start"
  | "detect_intent"
  | "dispatch_agent"
  | "apply_model_policy"
  | "emit_decision";

export type WorkflowNode = {
  id: string;
  type: WorkflowNodeType;
  config?: Record<string, unknown>;
};

export type WorkflowEdge = {
  from: string;
  to: string;
};

export type WorkflowDefinition = {
  id: string;
  name: string;
  description?: string;
  entryNode: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type IntentRoutingPolicy = {
  confidenceThreshold: number;
  routes: Array<{
    intent: AgentIntent;
    agent: string;
    task: string;
  }>;
  fallback: {
    intent: AgentIntent;
    agent: string;
    action: string;
  };
};

export type ModelRoutingPolicy = {
  global: {
    strategy: string;
    maxEstimatedCostUsdPerRequest: number;
    allowEscalation: boolean;
  };
  taskPolicies: Record<
    string,
    {
      preferred: string;
      fallback?: string;
      temperature: number;
      maxLatencyMs: number;
    }
  >;
  agentOverrides: Record<
    string,
    {
      preferred: string;
      fallback?: string;
      escalateOnLowConfidenceTo?: string;
    }
  >;
};

export type IntentResult = {
  intent: AgentIntent;
  confidence: number;
  rationale: string;
};

export type DispatchResult = {
  routedVia: "gdt-main" | "direct";
  agentName: string;
  task: string;
  requiresApproval: boolean;
  handoffMode: "redirect_to_agent_thread" | "stay_in_current_thread";
  targetThreadMode: "reuse_or_create" | "current_thread";
  handoffSummary: string;
};

export type ModelSelection = {
  selectedModel: string;
  fallbackModel?: string;
  maxLatencyMs: number;
  temperature: number;
  costCapUsd: number;
};

export type WorkflowInput = {
  message: string;
  entryPoint?: InboxEntryPoint;
  threadContext?: string;
  dealContext?: string;
  riskFlags?: string[];
};

export type WorkflowDecision = {
  intent: IntentResult;
  dispatch: DispatchResult;
  model: ModelSelection;
  trace: string[];
};
