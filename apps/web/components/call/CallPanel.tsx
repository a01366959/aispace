"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import { CallControls } from "./CallControls";
import { CallNotes } from "./CallNotes";
import { PostCallSummary, type SuggestedTask } from "./PostCallSummary";

/* ═══════════════════════════════════════════════════ */
/*  Types                                              */
/* ═══════════════════════════════════════════════════ */

type Segment = "ballenas" | "tiburones" | "atunes" | "truchas" | "charales";

export interface CallContact {
  id: string;
  name: string;
  initials: string;
  role: string;
  company: string;
  phone: string;
  email?: string;
  segment: Segment;
}

export interface CallDeal {
  id: string;
  name: string;
  stage: string;
  stageNumber: number;
  value: string;
  daysSinceActivity: number;
  probability?: number;
}

export interface CallHistoryItem {
  date: string;
  type: "call" | "email" | "quote" | "meeting" | "note";
  summary: string;
}

export interface TalkingPoint {
  priority: "high" | "medium" | "low";
  text: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  variant?: "default" | "outline";
}

export interface CallPanelProps {
  contact: CallContact;
  deal: CallDeal;
  history: CallHistoryItem[];
  talkingPoints: TalkingPoint[];
  quickActions: QuickAction[];
  onClose: () => void;
  onQuickAction?: (actionId: string) => void;
}

/* ═══════════════════════════════════════════════════ */
/*  Helpers                                            */
/* ═══════════════════════════════════════════════════ */

const segmentConfig: Record<Segment, { label: string; emoji: string; variant: "blue" | "warning" | "success" | "secondary" | "muted" }> = {
  ballenas: { label: "Ballena", emoji: "🐋", variant: "blue" },
  tiburones: { label: "Tiburón", emoji: "🦈", variant: "warning" },
  atunes: { label: "Atún", emoji: "🐟", variant: "success" },
  truchas: { label: "Trucha", emoji: "🐟", variant: "secondary" },
  charales: { label: "Charal", emoji: "🐟", variant: "muted" },
};

const historyIcons: Record<string, string> = {
  call: "fa-phone",
  email: "fa-envelope",
  quote: "fa-file-invoice-dollar",
  meeting: "fa-calendar",
  note: "fa-note-sticky",
};

const priorityColors: Record<string, string> = {
  high: "bg-[var(--danger-100)] text-[var(--danger-600)]",
  medium: "bg-[var(--orange-100)] text-[var(--orange-600)]",
  low: "bg-muted text-muted-foreground",
};

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════════════ */
/*  Component                                          */
/* ═══════════════════════════════════════════════════ */

type CallPhase = "ringing" | "active" | "summary";

function CallPanel({
  contact,
  deal,
  history,
  talkingPoints,
  quickActions,
  onClose,
  onQuickAction,
}: CallPanelProps) {
  const [phase, setPhase] = useState<CallPhase>("ringing");
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [showDialpad, setShowDialpad] = useState(false);
  const [notes, setNotes] = useState("");

  // Post-call
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summary, setSummary] = useState("");
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // Timer
  useEffect(() => {
    if (phase !== "active") return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Simulate ringing → connected
  useEffect(() => {
    if (phase === "ringing") {
      const timeout = setTimeout(() => setPhase("active"), 2500);
      return () => clearTimeout(timeout);
    }
  }, [phase]);

  const handleHangup = useCallback(() => {
    setPhase("summary");
    setIsGeneratingSummary(true);
    // Simulate AI generation
    setTimeout(() => {
      setSummary(
        `Llamada con ${contact.name} de ${contact.company}.\n\n` +
        `Se discutió el estado del deal "${deal.name}" (etapa ${deal.stageNumber}: ${deal.stage}).\n\n` +
        (notes
          ? `Notas del representante:\n${notes}\n\n`
          : "") +
        `El cliente mostró interés en continuar. Se acordó dar seguimiento la próxima semana con una cotización actualizada.`
      );
      setSuggestedTasks([
        {
          id: "t1",
          label: `Seguimiento con ${contact.name} — llamada`,
          dueDate: "En 3 días",
          type: "follow_up",
        },
        {
          id: "t2",
          label: `Enviar cotización actualizada a ${contact.company}`,
          dueDate: "Mañana",
          type: "quote",
        },
        {
          id: "t3",
          label: `Agendar reunión presencial con ${contact.name}`,
          dueDate: "Próxima semana",
          type: "meeting",
        },
      ]);
      setSelectedTaskIds(new Set(["t1", "t2"]));
      setIsGeneratingSummary(false);
    }, 2500);
  }, [contact, deal, notes]);

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const seg = segmentConfig[contact.segment];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              initials={contact.initials}
              size="md"
              className="bg-primary"
            />
            {phase === "active" && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success border-2 border-card" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{contact.name}</span>
              <Badge variant={seg.variant} className="text-[10px]">
                {seg.emoji} {seg.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{contact.role}</span>
              <span>·</span>
              <span>{contact.company}</span>
              <span>·</span>
              <span className="font-mono">{contact.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {phase === "active" && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
              </span>
              <span className="font-mono text-sm font-semibold text-foreground">
                {formatTimer(elapsed)}
              </span>
              {isOnHold && (
                <Badge variant="warning" className="text-[10px]">
                  <i className="fa-solid fa-pause mr-1" />
                  En espera
                </Badge>
              )}
              {isMuted && (
                <Badge variant="destructive" className="text-[10px]">
                  <i className="fa-solid fa-microphone-slash mr-1" />
                  Silenciado
                </Badge>
              )}
            </div>
          )}
          {phase === "ringing" && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-warning" />
              </span>
              <span className="text-sm font-medium text-warning">Llamando...</span>
            </div>
          )}
          {phase !== "summary" && (
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Minimizar">
              <i className="fa-solid fa-compress text-sm" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      {phase === "summary" ? (
        <div className="flex-1 max-w-2xl mx-auto w-full">
          <PostCallSummary
            contactName={contact.name}
            company={contact.company}
            duration={formatTimer(elapsed)}
            summary={summary}
            suggestedTasks={suggestedTasks}
            onEditSummary={setSummary}
            onConfirm={onClose}
            onDiscard={onClose}
            onToggleTask={handleToggleTask}
            selectedTaskIds={selectedTaskIds}
            isGenerating={isGeneratingSummary}
          />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
          {/* ── Left panel: Context ─────────────────────────── */}
          <div className="col-span-4 border-r overflow-y-auto p-5 flex flex-col gap-5">
            {/* Deal info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-handshake text-primary text-xs" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Deal activo
                </span>
              </div>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{deal.name}</span>
                    <Badge variant={deal.daysSinceActivity > 5 ? "destructive" : "success"} className="text-[10px]">
                      {deal.daysSinceActivity > 5 ? (
                        <>
                          <i className="fa-solid fa-triangle-exclamation mr-1" />
                          {deal.daysSinceActivity}d sin actividad
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-check mr-1" />
                          Activo
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Stage progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Etapa {deal.stageNumber}: {deal.stage}</span>
                      <span>{deal.value}</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1.5 flex-1 rounded-full",
                            i < deal.stageNumber ? "bg-primary" : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Talking points */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-sparkles text-primary text-xs" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Puntos a tratar
                </span>
                <Badge variant="blue" className="text-[10px] ml-auto">IA</Badge>
              </div>
              <div className="flex flex-col gap-2">
                {talkingPoints.map((tp, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg border p-3 text-sm"
                  >
                    <span className={cn("inline-flex items-center justify-center h-5 min-w-[20px] rounded-full text-[10px] font-bold", priorityColors[tp.priority])}>
                      {tp.priority === "high" ? "!" : tp.priority === "medium" ? "·" : "–"}
                    </span>
                    <span>{tp.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* History */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-clock-rotate-left text-muted-foreground text-xs" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Historial reciente
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm py-1.5">
                    <i className={cn("fa-solid text-xs text-muted-foreground w-4 text-center", historyIcons[h.type] ?? "fa-circle")} />
                    <span className="text-muted-foreground text-xs whitespace-nowrap">{h.date}</span>
                    <span className="truncate">{h.summary}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Center: Call area ───────────────────────────── */}
          <div className="col-span-5 flex flex-col">
            {/* Ringing state */}
            {phase === "ringing" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <Avatar
                    initials={contact.initials}
                    size="lg"
                    className="bg-primary h-24 w-24 text-3xl"
                  />
                  <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold">{contact.name}</p>
                  <p className="text-muted-foreground">{contact.phone}</p>
                  <p className="text-sm text-warning mt-2 font-medium">
                    <i className="fa-solid fa-phone fa-shake mr-2" />
                    Llamando...
                  </p>
                </div>
                <Button variant="destructive" size="lg" className="rounded-full px-8" onClick={onClose}>
                  <i className="fa-solid fa-phone-hangup mr-2" />
                  Cancelar
                </Button>
              </div>
            )}

            {/* Active call */}
            {phase === "active" && (
              <div className="flex-1 flex flex-col">
                {/* Notes area */}
                <div className="flex-1 p-5">
                  <CallNotes value={notes} onChange={setNotes} />
                </div>
                {/* Dialpad */}
                {showDialpad && (
                  <div className="px-5 pb-3">
                    <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((key) => (
                        <Button key={key} variant="outline" size="sm" className="h-10 text-base font-mono">
                          {key}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Controls */}
                <div className="p-5 border-t bg-card">
                  <CallControls
                    isMuted={isMuted}
                    isOnHold={isOnHold}
                    isSpeaker={isSpeaker}
                    showDialpad={showDialpad}
                    onToggleMute={() => setIsMuted(!isMuted)}
                    onToggleHold={() => setIsOnHold(!isOnHold)}
                    onToggleSpeaker={() => setIsSpeaker(!isSpeaker)}
                    onToggleDialpad={() => setShowDialpad(!showDialpad)}
                    onHangup={handleHangup}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Right panel: Quick actions ─────────────────── */}
          <div className="col-span-3 border-l overflow-y-auto p-5 flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-bolt text-primary text-xs" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Acciones rápidas
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant={(action.variant as "default" | "outline") ?? "outline"}
                    className="justify-start h-auto py-3 px-4"
                    onClick={() => onQuickAction?.(action.id)}
                  >
                    <i className={cn("fa-solid text-sm w-5", action.icon)} />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Contact details */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-address-card text-muted-foreground text-xs" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Contacto
                </span>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-user text-muted-foreground w-4 text-xs text-center" />
                  <span>{contact.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-building text-muted-foreground w-4 text-xs text-center" />
                  <span>{contact.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-phone text-muted-foreground w-4 text-xs text-center" />
                  <span className="font-mono">{contact.phone}</span>
                </div>
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-envelope text-muted-foreground w-4 text-xs text-center" />
                    <span>{contact.email}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Stats mini */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-chart-simple text-muted-foreground text-xs" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Métricas del cliente
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-lg font-bold text-foreground">12</p>
                  <p className="text-[11px] text-muted-foreground">Llamadas</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-lg font-bold text-foreground">3</p>
                  <p className="text-[11px] text-muted-foreground">Cotizaciones</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-lg font-bold text-foreground">2</p>
                  <p className="text-[11px] text-muted-foreground">Años cliente</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-lg font-bold text-foreground">85%</p>
                  <p className="text-[11px] text-muted-foreground">Prob. cierre</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { CallPanel };
