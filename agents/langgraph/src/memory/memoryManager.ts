import type {
  IMemoryManager,
  LongTermEntry,
  LongTermSearchResult,
  MemoryQuery,
  MemoryWriteRequest,
  ShortTermEntry,
  ShortTermMemory,
  WorkingMemory,
  WorkingMemoryEntry,
} from "./types";

const DEFAULT_WINDOW_SIZE = 20;

/**
 * MemoryManager — unified read/write across all three memory layers.
 *
 * Working memory: in-process Map, cleared per invocation.
 * Short-term memory: backed by Supabase `thread_messages` table.
 * Long-term memory: backed by Supabase `memory_embeddings` table with pgvector.
 *
 * This implementation exposes the typed interface.
 * Actual Supabase calls are injected via the adapter so the module
 * stays testable without a live database.
 */

// ─── Adapter interface (injected at runtime) ──────────────────────────────────

export interface SupabaseMemoryAdapter {
  /** Fetch recent messages for a thread, ordered newest-first */
  fetchThreadMessages(threadId: string, limit: number): Promise<ShortTermEntry[]>;

  /** Insert a message into the thread_messages table */
  insertThreadMessage(entry: Omit<ShortTermEntry, "id">): Promise<string>;

  /** Insert a long-term memory entry with embedding */
  insertLongTermEntry(entry: Omit<LongTermEntry, "id" | "createdAt" | "updatedAt">): Promise<string>;

  /** Vector similarity search via pgvector */
  searchByEmbedding(embedding: number[], entityType?: string, limit?: number): Promise<LongTermSearchResult[]>;

  /** Fetch long-term entries by entity */
  fetchByEntity(entityType: string, entityId: string, limit: number): Promise<LongTermEntry[]>;
}

export interface EmbeddingProvider {
  /** Turn text into an embedding vector */
  embed(text: string): Promise<number[]>;
}

// ─── Implementation ────────────────────────────────────────────────────────────

export class MemoryManager implements IMemoryManager {
  private working: WorkingMemory = { entries: new Map() };

  constructor(
    private adapter: SupabaseMemoryAdapter,
    private embedder: EmbeddingProvider
  ) {}

  // ── Read ──────────────────────────────────────────────────────────────────

  async read(query: MemoryQuery): Promise<ShortTermEntry[] | LongTermSearchResult[]> {
    const limit = query.limit ?? DEFAULT_WINDOW_SIZE;

    switch (query.scope) {
      case "working":
        return Array.from(this.working.entries.values()).map((e) => ({
          id: e.key,
          threadId: "__working__",
          role: "system" as const,
          content: typeof e.value === "string" ? e.value : JSON.stringify(e.value),
          timestamp: e.createdAt,
        }));

      case "short_term": {
        if (!query.threadId) throw new Error("threadId required for short_term read");
        return this.adapter.fetchThreadMessages(query.threadId, limit);
      }

      case "long_term": {
        if (query.searchText) {
          return this.searchSimilar(query.searchText, query.entityType, limit);
        }
        if (query.entityType && query.entityId) {
          const entries = await this.adapter.fetchByEntity(query.entityType, query.entityId, limit);
          return entries.map((entry) => ({ entry, similarity: 1 }));
        }
        return [];
      }
    }
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  async write(request: MemoryWriteRequest): Promise<string> {
    switch (request.scope) {
      case "working": {
        const key = `working_${Date.now()}`;
        const entry: WorkingMemoryEntry = {
          key,
          value: request.content,
          createdAt: new Date().toISOString(),
        };
        this.working.entries.set(key, entry);
        return key;
      }

      case "short_term": {
        if (!request.threadId) throw new Error("threadId required for short_term write");
        return this.adapter.insertThreadMessage({
          threadId: request.threadId,
          role: request.role ?? "system",
          agentName: request.agentName,
          content: request.content,
          metadata: request.metadata,
          timestamp: new Date().toISOString(),
        });
      }

      case "long_term": {
        if (!request.entityType || !request.entityId) {
          throw new Error("entityType and entityId required for long_term write");
        }
        const embedding = await this.embedder.embed(request.content);
        return this.adapter.insertLongTermEntry({
          entityType: request.entityType,
          entityId: request.entityId,
          content: request.content,
          embedding,
          metadata: request.metadata,
        });
      }
    }
  }

  // ── Working memory lifecycle ──────────────────────────────────────────────

  clearWorking(): void {
    this.working.entries.clear();
  }

  setWorkingValue(key: string, value: unknown): void {
    this.working.entries.set(key, {
      key,
      value,
      createdAt: new Date().toISOString(),
    });
  }

  getWorkingValue<T = unknown>(key: string): T | undefined {
    return this.working.entries.get(key)?.value as T | undefined;
  }

  // ── Thread context window ─────────────────────────────────────────────────

  async getThreadContext(threadId: string, windowSize?: number): Promise<ShortTermEntry[]> {
    const size = windowSize ?? DEFAULT_WINDOW_SIZE;
    return this.adapter.fetchThreadMessages(threadId, size);
  }

  // ── Semantic search ───────────────────────────────────────────────────────

  async searchSimilar(
    text: string,
    entityType?: string,
    limit?: number
  ): Promise<LongTermSearchResult[]> {
    const embedding = await this.embedder.embed(text);
    return this.adapter.searchByEmbedding(embedding, entityType, limit ?? 5);
  }
}
