"use client";

import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

/* ─── Block types ─────────────────────────────────────────────────────────── */
type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "numbered"
  | "checklist"
  | "quote"
  | "divider";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}

/* ─── Slash command registry ─────────────────────────────────────────────── */
interface SlashCmd {
  label: string;
  description: string;
  icon: string;
  type: BlockType;
  keywords: string[];
}

const SLASH_CMDS: SlashCmd[] = [
  { label: "Texto", description: "Párrafo normal", icon: "fa-paragraph", type: "paragraph", keywords: ["texto", "parrafo", "normal"] },
  { label: "Título 1", description: "Encabezado grande", icon: "fa-heading", type: "h1", keywords: ["titulo", "h1", "grande", "heading"] },
  { label: "Título 2", description: "Encabezado mediano", icon: "fa-heading", type: "h2", keywords: ["titulo", "h2", "mediano"] },
  { label: "Título 3", description: "Encabezado pequeño", icon: "fa-heading", type: "h3", keywords: ["titulo", "h3", "pequeno"] },
  { label: "Lista", description: "Viñetas", icon: "fa-list-ul", type: "bullet", keywords: ["lista", "bullet", "viñeta", "bullets"] },
  { label: "Lista numerada", description: "Lista ordenada", icon: "fa-list-ol", type: "numbered", keywords: ["numerada", "ordenada", "numeros"] },
  { label: "Checklist", description: "Lista de tareas", icon: "fa-square-check", type: "checklist", keywords: ["check", "tarea", "todo", "checkbox"] },
  { label: "Cita", description: "Contexto o cita", icon: "fa-quote-left", type: "quote", keywords: ["cita", "quote", "bloque", "contexto"] },
  { label: "Divisor", description: "Línea separadora", icon: "fa-minus", type: "divider", keywords: ["divisor", "separator", "linea", "hr"] },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function newBlock(type: BlockType = "paragraph"): Block {
  return { id: uid(), type, content: "", checked: false };
}

function serializeBlocks(blocks: Block[]): string {
  let numIdx = 0;
  return blocks
    .map((b) => {
      if (b.type === "numbered") numIdx++;
      else numIdx = 0;
      switch (b.type) {
        case "h1":        return `# ${b.content}`;
        case "h2":        return `## ${b.content}`;
        case "h3":        return `### ${b.content}`;
        case "bullet":    return `- ${b.content}`;
        case "numbered":  return `${numIdx}. ${b.content}`;
        case "checklist": return `- [${b.checked ? "x" : " "}] ${b.content}`;
        case "quote":     return `> ${b.content}`;
        case "divider":   return `---`;
        default:          return b.content;
      }
    })
    .join("\n");
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export interface CallNotesProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function CallNotes({ onChange, disabled }: CallNotesProps) {
  const [blocks, setBlocks] = useState<Block[]>([newBlock()]);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashBlockId, setSlashBlockId] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const notify = useCallback(
    (updated: Block[]) => onChange(serializeBlocks(updated)),
    [onChange],
  );

  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const updateContent = useCallback(
    (id: string, content: string) => {
      setBlocks((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, content } : b));
        notify(next);
        return next;
      });
    },
    [notify],
  );

  const changeType = useCallback(
    (id: string, type: BlockType) => {
      setBlocks((prev) => {
        const next = prev.map((b) =>
          b.id === id ? { ...b, type, content: "" } : b,
        );
        notify(next);
        return next;
      });
      setSlashOpen(false);
      setSlashFilter("");
      setSlashBlockId(null);
      setTimeout(() => {
        const el = refs.current[id];
        if (el) { el.focus(); autoResize(el); }
      }, 0);
    },
    [notify],
  );

  const insertAfter = useCallback(
    (id: string) => {
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === id);
        const src = prev[idx];
        const inheritType =
          src && ["bullet", "numbered", "checklist"].includes(src.type)
            ? src.type
            : "paragraph";
        const nb = newBlock(inheritType as BlockType);
        const next = [
          ...prev.slice(0, idx + 1),
          nb,
          ...prev.slice(idx + 1),
        ];
        notify(next);
        setTimeout(() => refs.current[nb.id]?.focus(), 0);
        return next;
      });
    },
    [notify],
  );

  const removeBlock = useCallback(
    (id: string) => {
      setBlocks((prev) => {
        if (prev.length <= 1) {
          const fresh = [newBlock()];
          notify(fresh);
          return fresh;
        }
        const idx = prev.findIndex((b) => b.id === id);
        const next = prev.filter((b) => b.id !== id);
        notify(next);
        const prevId = next[Math.max(0, idx - 1)]?.id;
        if (prevId) setTimeout(() => refs.current[prevId]?.focus(), 0);
        return next;
      });
    },
    [notify],
  );

  const toggleCheck = useCallback(
    (id: string) => {
      setBlocks((prev) => {
        const next = prev.map((b) =>
          b.id === id ? { ...b, checked: !b.checked } : b,
        );
        notify(next);
        return next;
      });
    },
    [notify],
  );

  const filteredCmds = SLASH_CMDS.filter((c) => {
    if (!slashFilter) return true;
    const q = slashFilter.toLowerCase();
    return (
      c.label.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.includes(q))
    );
  });

  let numCounter = 0;

  return (
    <div className="flex flex-col h-full gap-2 relative">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <i className="fa-solid fa-pen-to-square text-muted-foreground text-xs" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Notas
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/50 select-none">
          / para formato · ↵ nueva línea
        </span>
      </div>

      {/* Editor surface */}
      <div
        className="flex-1 overflow-y-auto rounded-xl border border-border bg-background px-5 py-4 cursor-text"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            const last = blocks[blocks.length - 1];
            if (last) refs.current[last.id]?.focus();
          }
        }}
      >
        <div className="flex flex-col gap-0.5">
          {blocks.map((block) => {
            if (block.type === "numbered") numCounter++;
            else numCounter = 0;
            const numDisplay = numCounter;

            /* ── Divider block ── */
            if (block.type === "divider") {
              return (
                <div key={block.id} className="group flex items-center gap-2 my-2 py-1">
                  <hr className="flex-1 border-border" />
                  <button
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs transition-opacity"
                    onMouseDown={(e) => { e.preventDefault(); removeBlock(block.id); }}
                    tabIndex={-1}
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              );
            }

            const isH1       = block.type === "h1";
            const isH2       = block.type === "h2";
            const isH3       = block.type === "h3";
            const isBullet   = block.type === "bullet";
            const isNumbered = block.type === "numbered";
            const isChecklist = block.type === "checklist";
            const isQuote    = block.type === "quote";

            const placeholder = isH1
              ? "Título..."
              : isH2
              ? "Subtítulo..."
              : isH3
              ? "Encabezado..."
              : isQuote
              ? "Cita o contexto..."
              : isBullet || isChecklist
              ? "Elemento..."
              : isNumbered
              ? "Paso..."
              : "Escribe algo, o usa / para formato...";

            return (
              <div
                key={block.id}
                className={cn(
                  "flex items-start gap-1.5 group",
                  isQuote &&
                    "pl-3 border-l-2 border-primary/40 ml-1 my-0.5 py-0.5",
                )}
              >
                {/* Prefix decorations */}
                {isBullet && (
                  <span className="pt-[7px] text-muted-foreground text-xs shrink-0 select-none leading-none">
                    •
                  </span>
                )}
                {isNumbered && (
                  <span className="pt-[6px] text-muted-foreground text-xs shrink-0 select-none leading-none font-mono min-w-[18px]">
                    {numDisplay}.
                  </span>
                )}
                {isChecklist && (
                  <button
                    className="pt-[5px] shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggleCheck(block.id);
                    }}
                    tabIndex={-1}
                  >
                    <i
                      className={cn(
                        "fa-solid text-[14px]",
                        block.checked
                          ? "fa-square-check text-primary"
                          : "fa-square",
                      )}
                    />
                  </button>
                )}

                {/* Text input */}
                <textarea
                  ref={(el) => {
                    refs.current[block.id] = el;
                  }}
                  value={block.content}
                  rows={1}
                  disabled={disabled}
                  placeholder={placeholder}
                  className={cn(
                    "flex-1 resize-none bg-transparent outline-none",
                    "placeholder:text-muted-foreground/35 leading-relaxed",
                    "overflow-hidden min-h-[1.6em]",
                    isH1 && "text-[22px] font-bold text-foreground",
                    isH2 && "text-[17px] font-bold text-foreground",
                    isH3 && "text-sm font-semibold text-foreground",
                    isQuote && "text-sm italic text-muted-foreground",
                    isChecklist && block.checked && "line-through text-muted-foreground",
                    !isH1 && !isH2 && !isH3 && !isQuote && "text-sm text-foreground",
                  )}
                  onChange={(e) => {
                    const v = e.target.value;
                    autoResize(e.target);

                    // Slash command trigger: starts with "/" and no space yet
                    if (v.startsWith("/") && !v.slice(1).includes(" ")) {
                      setSlashOpen(true);
                      setSlashFilter(v.slice(1));
                      setSlashBlockId(block.id);
                    } else if (slashBlockId === block.id) {
                      setSlashOpen(false);
                      setSlashFilter("");
                      setSlashBlockId(null);
                    }

                    updateContent(block.id, v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      // If slash menu open, apply first result
                      if (slashOpen && slashBlockId === block.id) {
                        const first = filteredCmds[0];
                        if (first) changeType(block.id, first.type);
                        return;
                      }
                      insertAfter(block.id);
                    }
                    if (e.key === "Backspace" && !block.content) {
                      e.preventDefault();
                      removeBlock(block.id);
                    }
                    if (e.key === "Escape") {
                      setSlashOpen(false);
                      setSlashFilter("");
                      setSlashBlockId(null);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Slash command palette ──────────────────────────────────── */}
      {slashOpen && filteredCmds.length > 0 && (
        <div className="absolute bottom-[calc(100%-3rem)] left-0 right-0 rounded-xl border border-border bg-card shadow-2xl overflow-hidden z-50">
          <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b bg-muted/30">
            Tipo de bloque
          </div>
          <div className="max-h-[260px] overflow-y-auto p-1.5 grid grid-cols-2 gap-1">
            {filteredCmds.map((cmd) => (
              <button
                key={cmd.type}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-muted transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (slashBlockId) changeType(slashBlockId, cmd.type);
                }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                  <i className={cn("fa-solid text-sm", cmd.icon)} />
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-[12px] text-foreground truncate">
                    {cmd.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {cmd.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground shrink-0">
        Estas notas se usarán para el resumen automático al colgar.
      </p>
    </div>
  );
}

export { CallNotes };
