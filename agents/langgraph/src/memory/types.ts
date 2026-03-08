/**
 * Agent Memory Architecture
 *
 * Three-layer memory model:
 * 1. Working Memory  — ephemeral, per-invocation scratchpad
 * 2. Short-Term Memory — per-thread/session window (recent messages + agent outputs)
 * 3. Long-Term Memory — per-client/deal persistent store (pgvector via Supabase)
 */

// ─── Working Memory (per-invocation) ───────────────────────────────────────────

export type WorkingMemoryEntry = {
  key: string;
  value: unknown;
  createdAt: string; // ISO 8601
};

export type WorkingMemory = {
  entries: Map<string, WorkingMemoryEntry>;
};

// ─── Short-Term Memory (per-thread / session) ─────────────────────────────────

export type ShortTermEntry = {
  id: string;
  threadId: string;
  role: "user" | "agent" | "system";
  agentName?: string;
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: string; // ISO 8601
};

export type ShortTermMemory = {
  threadId: string;
  entries: ShortTermEntry[];
  windowSize: number; // max entries kept in context
};

// ─── Long-Term Memory (pgvector / Supabase) ───────────────────────────────────

export type LongTermEntry = {
  id: string;
  entityType: "client" | "deal" | "contact" | "conversation";
  entityId: string;
  content: string;
  embedding?: number[]; // pgvector representation
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type LongTermSearchResult = {
  entry: LongTermEntry;
  similarity: number; // cosine similarity 0-1
};

// ─── Unified Memory Scope ──────────────────────────────────────────────────────

export type MemoryScope = "working" | "short_term" | "long_term";

export type MemoryQuery = {
  scope: MemoryScope;
  threadId?: string;       // required for short_term
  entityType?: string;     // for long_term filtering
  entityId?: string;       // for long_term filtering
  searchText?: string;     // semantic search (long_term only)
  limit?: number;
};

export type MemoryWriteRequest = {
  scope: MemoryScope;
  threadId?: string;
  entityType?: "client" | "deal" | "contact" | "conversation";
  entityId?: string;
  content: string;
  role?: "user" | "agent" | "system";
  agentName?: string;
  metadata?: Record<string, unknown>;
};

// ─── Memory Manager Interface ──────────────────────────────────────────────────

export interface IMemoryManager {
  /** Read entries from a memory scope */
  read(query: MemoryQuery): Promise<ShortTermEntry[] | LongTermSearchResult[]>;

  /** Write a new entry to a memory scope */
  write(request: MemoryWriteRequest): Promise<string>; // returns entry id

  /** Clear working memory (called at end of invocation) */
  clearWorking(): void;

  /** Get thread context window for prompt injection */
  getThreadContext(threadId: string, windowSize?: number): Promise<ShortTermEntry[]>;

  /** Semantic search across long-term memory */
  searchSimilar(text: string, entityType?: string, limit?: number): Promise<LongTermSearchResult[]>;
}
