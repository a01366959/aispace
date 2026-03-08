/**
 * Agent Tool Contracts
 *
 * Every tool that an agent can invoke must conform to the AgentTool interface.
 * Tools are registered in the ToolRegistry and resolved at dispatch time.
 */

// ─── Permission and Approval ───────────────────────────────────────────────────

export type ToolPermissionLevel = "auto" | "approval_required" | "blocked";

export type ToolCategory = "crm" | "communication" | "task" | "reporting" | "scheduling" | "internal";

// ─── GDT-Specific Tool Names ───────────────────────────────────────────────────

export type GDTToolName =
  | "create_followup_task"     // Create follow-up reminder for a rep
  | "flag_stale_deal"          // Flag a deal that exceeded SLA threshold
  | "detect_dormant_clients"   // Scan for clients with no contact in 30+ days
  | "draft_followup_message"   // Draft a follow-up message in Spanish
  | "create_activity_report"   // Generate weekly/monthly activity report
  | "create_pipeline_report"   // Generate pipeline value report
  | "get_deal_context"         // Fetch deal + client + contact context from DB
  | "get_client_history"       // Fetch full interaction history for a client
  | "log_agent_action"         // Persist agent action with rationale/cost
  | "request_quote_approval"   // Request Miriam's approval for a quote
  | "sync_zoho_accounts"       // Trigger Zoho sync for accounts/deals/activities
  | "escalate_to_manager";     // Escalate to Miriam with risk context

// ─── Tool I/O Schemas ──────────────────────────────────────────────────────────

export type ToolParamSchema = {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  required: boolean;
  description: string;
};

export type ToolResultStatus = "success" | "error" | "approval_pending";

export type ToolResult<T = unknown> = {
  status: ToolResultStatus;
  data?: T;
  error?: string;
  metadata?: {
    durationMs: number;
    agentName: string;
    toolName: string;
    timestamp: string;
  };
};

// ─── Core Tool Interface ───────────────────────────────────────────────────────

export interface AgentTool<TInput = unknown, TOutput = unknown> {
  /** Unique tool identifier */
  name: string;

  /** Human-readable description for prompt injection */
  description: string;

  /** Category for policy grouping */
  category: ToolCategory;

  /** Default permission level — can be overridden by policy */
  permissionLevel: ToolPermissionLevel;

  /** Input parameter schema */
  inputSchema: ToolParamSchema[];

  /** Execute the tool */
  execute(input: TInput, context: ToolExecutionContext): Promise<ToolResult<TOutput>>;
}

// ─── Execution Context (injected by runtime) ──────────────────────────────────

export type ToolExecutionContext = {
  agentName: string;
  threadId?: string;
  dealId?: string;
  userId?: string;
  riskFlags: string[];
  /** Override permission level for this specific invocation */
  permissionOverride?: ToolPermissionLevel;
};

// ─── Registry Interface ────────────────────────────────────────────────────────

export interface IToolRegistry {
  /** Register a tool */
  register(tool: AgentTool): void;

  /** Resolve a tool by name */
  resolve(name: string): AgentTool | undefined;

  /** List all tools, optionally filtered by category */
  list(category?: ToolCategory): AgentTool[];

  /** Check if an agent is allowed to use a specific tool */
  isAllowed(toolName: string, agentName: string): boolean;

  /** Get tool description manifest for prompt injection */
  getManifest(agentName: string): ToolManifestEntry[];
}

export type ToolManifestEntry = {
  name: string;
  description: string;
  category: ToolCategory;
  params: ToolParamSchema[];
  permissionLevel: ToolPermissionLevel;
};

// ─── Agent-to-Tool Access Policy ───────────────────────────────────────────────

export type AgentToolPolicy = {
  agentName: string;
  /** Tools this agent is allowed to invoke */
  allowedTools: string[];
  /** Tools explicitly blocked for this agent */
  blockedTools: string[];
};
