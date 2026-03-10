"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { CallControls } from "./CallControls";
import { CallNotes } from "./CallNotes";
import { LiveTranscript, type TranscriptEntry } from "./LiveTranscript";
import { PostCallSummary, type SuggestedTask } from "./PostCallSummary";
import { useSpeechTranscription } from "./useSpeechTranscription";

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

export type CallMode = "voip" | "hybrid-quo" | "hybrid-device" | "mic-listen";

export interface CallPanelProps {
  contact: CallContact;
  deal: CallDeal;
  history: CallHistoryItem[];
  talkingPoints: TalkingPoint[];
  quickActions: QuickAction[];
  onClose: () => void;
  onQuickAction?: (actionId: string) => void;
  callMode?: CallMode;
  audioDevice?: string;
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
/*  Simulated Quo transcript data                      */
/* ═══════════════════════════════════════════════════ */

function getSimulatedTranscript(contactFirstName: string): { text: string; speaker: "rep" | "client"; delay: number }[] {
  return [
    { speaker: "rep", text: `Buenos días, ¿hablo con ${contactFirstName}?`, delay: 3000 },
    { speaker: "client", text: "Sí, buenos días. ¿Quién habla?", delay: 6000 },
    { speaker: "rep", text: "Le habla Carlos de GDT, Grupo Diagnóstico Toluca. Le llamo respecto a la cotización que le enviamos para los exámenes de su empresa.", delay: 10000 },
    { speaker: "client", text: "Ah sí, la recibí. Estamos revisándola internamente con el área de finanzas.", delay: 15000 },
    { speaker: "rep", text: "Perfecto. ¿Hay algo que pueda aclarar o ajustar en la propuesta?", delay: 19000 },
    { speaker: "client", text: "De hecho sí, nos gustaría saber si pueden hacer los exámenes en nuestras instalaciones. Tenemos dificultad para mover a todo el personal.", delay: 25000 },
    { speaker: "rep", text: "Claro que sí, contamos con unidad móvil. Podemos ir directamente a sus instalaciones. Solo necesitaría confirmar cuántos empleados serían y las fechas que les convienen.", delay: 32000 },
    { speaker: "client", text: "Serían aproximadamente 120 personas. Nos gustaría en la segunda semana de abril si es posible.", delay: 38000 },
    { speaker: "rep", text: "Déjeme verificar la disponibilidad de la unidad móvil para esas fechas. Le envío la actualización de la cotización con el servicio en sitio hoy mismo.", delay: 44000 },
    { speaker: "client", text: "Muy bien, se lo agradezco. Quedo pendiente.", delay: 48000 },
    { speaker: "rep", text: "Excelente. Le mando la cotización actualizada y le llamo mañana para confirmar. Que tenga buen día.", delay: 53000 },
    { speaker: "client", text: "Igualmente, gracias. Hasta luego.", delay: 57000 },
  ];
}

/* ═══════════════════════════════════════════════════ */
/*  Component                                          */
/* ═══════════════════════════════════════════════════ */

type CallPhase = "ringing" | "active" | "summary";
type CenterTab = "transcript" | "notes";

function CallPanel({
  contact,
  deal,
  history,
  talkingPoints,
  quickActions,
  onClose,
  onQuickAction,
  callMode = "voip",
  audioDevice,
}: CallPanelProps) {
  const isMicMode = callMode === "mic-listen";
  const isHybrid = callMode !== "voip" && !isMicMode;
  const [phase, setPhase] = useState<CallPhase>(isMicMode ? "active" : "ringing");
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [showDialpad, setShowDialpad] = useState(false);
  const [notes, setNotes] = useState("");
  const [centerTab, setCenterTab] = useState<CenterTab>("transcript");

  // Call state
  const [quoCallId, setQuoCallId] = useState<string | null>(isMicMode ? null : null);
  const [quoStatus, setQuoStatus] = useState<"connecting" | "connected" | "disconnected">(isMicMode ? "connected" : "connecting");
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);

  // Mic-listen: real browser speech recognition (FREE)
  const speech = useSpeechTranscription({
    lang: "es-MX",
    isActive: isMicMode && phase === "active",
  });

  // Post-call
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summary, setSummary] = useState("");
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [smsMessage, setSmsMessage] = useState("");
  const [smsSent, setSmsSent] = useState(false);

  // Timer
  useEffect(() => {
    if (phase !== "active") return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Simulate Quo API: POST /v1/calls → ringing → connected (non-mic modes)
  useEffect(() => {
    if (isMicMode || phase !== "ringing") return;
    const timeout = setTimeout(() => {
      setQuoCallId("quo_call_" + Math.random().toString(36).slice(2, 10));
      setQuoStatus("connected");
      setPhase("active");
    }, 2500);
    return () => clearTimeout(timeout);
  }, [phase, isMicMode]);

  // Simulate Quo live transcription via webhook (non-mic modes only)
  useEffect(() => {
    if (isMicMode || phase !== "active") return;
    const contactFirstName = contact.name.split(" ")[0]!;
    const simulated = getSimulatedTranscript(contactFirstName);
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    simulated.forEach((line, i) => {
      const t = setTimeout(() => {
        setTranscriptEntries((prev) => [
          ...prev,
          {
            id: `t-${i}`,
            speaker: line.speaker,
            text: line.text,
            timestamp: formatTimer(Math.floor(line.delay / 1000)),
            isFinal: true,
          },
        ]);
      }, line.delay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [phase, contact.name, isMicMode]);

  // In mic mode, use real speech entries
  const activeTranscript = isMicMode ? speech.entries : transcriptEntries;

  const handleHangup = useCallback(() => {
    setQuoStatus("disconnected");
    if (isMicMode) speech.stop();
    setPhase("summary");
    setIsGeneratingSummary(true);

    const transcriptText = (isMicMode ? speech.entries : transcriptEntries)
      .filter((e) => e.isFinal)
      .map((e) => e.text)
      .join("\n");

    // Simulate AI summary generation from transcript
    setTimeout(() => {
      setSummary(
        (isMicMode
          ? `Resumen generado por IA (transcripción vía micrófono):\n\n`
          : `Resumen generado por Quo AI + contexto del deal:\n\n`) +
        `Llamada de seguimiento con ${contact.name} (${contact.company}) sobre "${deal.name}".\n\n` +
        `Puntos clave:\n` +
        `• El cliente confirmó haber recibido la cotización y está en revisión con finanzas\n` +
        `• Solicitan servicio en sitio (unidad móvil) — no pueden mover al personal\n` +
        `• Aproximadamente 120 empleados\n` +
        `• Fecha deseada: segunda semana de abril\n` +
        `• Se comprometió enviar cotización actualizada con servicio en sitio hoy\n\n` +
        (notes ? `Notas adicionales del representante:\n${notes}\n\n` : "") +
        `Próximos pasos: Enviar cotización actualizada, confirmar disponibilidad de unidad móvil, llamar mañana.`
      );
      setSuggestedTasks([
        { id: "t1", label: `Enviar cotización actualizada con servicio en sitio a ${contact.company}`, dueDate: "Hoy", type: "quote" },
        { id: "t2", label: `Verificar disponibilidad unidad móvil — 2da semana de abril`, dueDate: "Hoy", type: "task" },
        { id: "t3", label: `Llamada de confirmación con ${contact.name}`, dueDate: "Mañana", type: "follow_up" },
        { id: "t4", label: `Actualizar deal a etapa "Negociación"`, dueDate: "Hoy", type: "task" },
      ]);
      const contactFirstName = contact.name.split(" ")[0];
      setSmsMessage(
        `Hola ${contactFirstName}, gracias por su tiempo. ` +
        `Le enviaré la cotización actualizada con el servicio en sitio el día de hoy. ` +
        `Quedo a sus órdenes. — Carlos, GDT`
      );
      setSelectedTaskIds(new Set(["t1", "t2", "t3"]));
      setIsGeneratingSummary(false);
    }, 3000);
  }, [contact, deal, notes, isMicMode, speech, transcriptEntries]);

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleSendSms = () => {
    setSmsSent(true);
  };

  const seg = segmentConfig[contact.segment];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar initials={contact.initials} size="md" className="bg-primary" />
            {phase === "active" && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success border-2 border-card" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{contact.name}</span>
              <Badge variant={seg.variant} className="text-[10px]">{seg.emoji} {seg.label}</Badge>
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
          {/* Quo API status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border">
            <div className={cn(
              "h-2 w-2 rounded-full",
              quoStatus === "connected" && "bg-success",
              quoStatus === "connecting" && "bg-warning animate-pulse",
              quoStatus === "disconnected" && "bg-muted-foreground",
            )} />
            <span className="text-[11px] font-medium text-muted-foreground">
              {quoStatus === "connected" && (isMicMode ? "Micrófono activo" : isHybrid ? "Llamada en tu teléfono" : "Quo conectado")}
              {quoStatus === "connecting" && "Conectando..."}
              {quoStatus === "disconnected" && "Llamada terminada"}
            </span>
            {isMicMode && speech.isListening && (
              <div className="flex items-center gap-0.5 ml-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 rounded-full bg-success transition-all duration-150"
                    style={{ height: `${Math.max(4, speech.audioLevel * 16 * (1 + Math.sin(i)))}px` }}
                  />
                ))}
              </div>
            )}
            {!isMicMode && quoCallId && (
              <span className="text-[10px] font-mono text-muted-foreground/60">{quoCallId.slice(0, 14)}</span>
            )}
          </div>

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
                  <i className="fa-solid fa-pause mr-1" />En espera
                </Badge>
              )}
              {isMuted && (
                <Badge variant="destructive" className="text-[10px]">
                  <i className="fa-solid fa-microphone-slash mr-1" />Silenciado
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
              <span className="text-sm font-medium text-warning">
                {isMicMode ? "Activando micrófono..." : isHybrid ? "Conectando con tu teléfono..." : "Llamando vía Quo..."}
              </span>
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
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full grid grid-cols-5 gap-0 h-full">
            {/* Left: Summary + Tasks */}
            <div className="col-span-3 border-r">
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

            {/* Right: Transcript + SMS + Quo metadata */}
            <div className="col-span-2 flex flex-col p-4 gap-4 overflow-y-auto">
              {/* Full transcript from Quo */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <i className="fa-solid fa-file-lines text-muted-foreground text-xs" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Transcripción completa
                  </span>
                  <Badge variant="muted" className="text-[9px] ml-auto gap-1">
                    {isMicMode ? "Web Speech API" : "vía Quo API"}
                  </Badge>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 max-h-[280px] overflow-y-auto">
                  {activeTranscript.filter((e) => e.isFinal).length > 0 ? (
                    <div className="space-y-2.5">
                      {activeTranscript.filter((e) => e.isFinal).map((entry) => (
                        <div key={entry.id} className="text-sm">
                          <span className={cn(
                            "font-semibold text-xs",
                            entry.speaker === "rep" ? "text-primary" : "text-foreground"
                          )}>
                            {entry.speaker === "rep" ? (isMicMode ? "Mic" : "Rep") : contact.name.split(" ")[0]}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono ml-2">{entry.timestamp}</span>
                          <p className="text-sm text-foreground mt-0.5">{entry.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Sin transcripción disponible</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* SMS follow-up via Quo Messages API */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <i className="fa-solid fa-message text-primary text-xs" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Seguimiento SMS
                  </span>
                  <Badge variant="blue" className="text-[9px] ml-auto gap-1">
                    {isMicMode ? "WhatsApp / SMS" : "Quo Messages API"}
                  </Badge>
                </div>
                {smsSent ? (
                  <div className="rounded-lg border border-success/30 bg-[var(--success-100)] p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--success-600)]">
                      <i className="fa-solid fa-check-circle" />
                      SMS enviado a {contact.phone}
                    </div>
                    <p className="text-xs text-[var(--success-600)]/80 mt-1">{smsMessage}</p>
                  </div>
                ) : (
                  <>
                    <Textarea
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      placeholder="Escribir mensaje de seguimiento..."
                      className="min-h-[80px] text-sm mb-2"
                      disabled={isGeneratingSummary}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        <i className="fa-solid fa-phone mr-1" />A: {contact.phone}
                      </span>
                      <Button size="sm" onClick={handleSendSms} disabled={!smsMessage.trim() || isGeneratingSummary}>
                        <i className="fa-solid fa-paper-plane mr-1 text-xs" />
                        {isMicMode ? "Enviar seguimiento" : "Enviar SMS vía Quo"}
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <Separator />

              {/* Quo API call metadata */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-server text-muted-foreground text-xs" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {isMicMode ? "Datos de sesión" : "Datos de Quo API"}
                  </span>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 font-mono text-[11px] text-muted-foreground space-y-1">
                  {!isMicMode && <div className="flex justify-between"><span>call_id</span><span>{quoCallId ?? "—"}</span></div>}
                  <div className="flex justify-between"><span>duration</span><span>{elapsed}s</span></div>
                  <div className="flex justify-between"><span>direction</span><span>outbound</span></div>
                  <div className="flex justify-between"><span>transcript_segments</span><span>{activeTranscript.filter((e) => e.isFinal).length}</span></div>
                  <div className="flex justify-between"><span>transcript_source</span><span className="text-success">{isMicMode ? "web_speech_api" : "quo_ai"}</span></div>
                  <div className="flex justify-between"><span>ai_summary</span><span className="text-success">available</span></div>
                  {!isMicMode && <div className="flex justify-between"><span>recording</span><span className="text-success">saved</span></div>}
                  <div className="flex justify-between"><span>synced_to_crm</span><span className="text-success">supabase + zoho</span></div>
                  {isMicMode && <div className="flex justify-between"><span>cost</span><span className="text-success">$0.00</span></div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
          {/* ── Left panel: Context ─────────────────────────── */}
          <div className="col-span-3 border-r overflow-y-auto p-5 flex flex-col gap-5">
            {/* Deal info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-handshake text-primary text-xs" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal activo</span>
              </div>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{deal.name}</span>
                    <Badge variant={deal.daysSinceActivity > 5 ? "destructive" : "success"} className="text-[10px]">
                      {deal.daysSinceActivity > 5 ? (
                        <><i className="fa-solid fa-triangle-exclamation mr-1" />{deal.daysSinceActivity}d sin actividad</>
                      ) : (
                        <><i className="fa-solid fa-check mr-1" />Activo</>
                      )}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Etapa {deal.stageNumber}: {deal.stage}</span>
                      <span>{deal.value}</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < deal.stageNumber ? "bg-primary" : "bg-muted")} />
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Puntos a tratar</span>
                <Badge variant="blue" className="text-[10px] ml-auto">IA</Badge>
              </div>
              <div className="flex flex-col gap-2">
                {talkingPoints.map((tp, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg border p-3 text-sm">
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Historial reciente</span>
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

          {/* ── Center: Transcript + Notes tabs ────────────── */}
          <div className="col-span-6 flex flex-col">
            {/* Ringing state */}
            {phase === "ringing" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <Avatar initials={contact.initials} size="lg" className="bg-primary h-24 w-24 text-3xl" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold">{contact.name}</p>
                  <p className="text-muted-foreground">{contact.phone}</p>
                  <p className="text-sm text-warning mt-2 font-medium">
                    <i className={cn("fa-solid mr-2", isHybrid ? "fa-mobile-screen fa-bounce" : "fa-phone fa-shake")} />
                    {isHybrid
                      ? "Contesta en tu teléfono para iniciar..."
                      : "Conectando vía Quo API..."}
                  </p>
                  {isHybrid && (
                    <p className="text-xs text-muted-foreground mt-1">
                      La llamada se hará desde tu teléfono. El escritorio captura audio para transcripción.
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-warning animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-warning animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-warning animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 rounded-full bg-muted/50 border">
                  <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                  {callMode === "hybrid-quo" && "POST /v1/calls · Quo Bridge"}
                  {callMode === "hybrid-device" && (audioDevice ?? "Dispositivo BT detectado")}
                  {callMode === "voip" && "POST /v1/calls · Quo API"}
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
                {/* Tab switcher */}
                <div className="flex items-center border-b px-5 pt-3">
                  <button
                    onClick={() => setCenterTab("transcript")}
                    className={cn(
                      "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                      centerTab === "transcript" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <i className="fa-solid fa-closed-captioning mr-2 text-xs" />
                    Transcripción en vivo
                    {activeTranscript.length > 0 && (
                      <Badge variant="muted" className="text-[10px] ml-2">{activeTranscript.length}</Badge>
                    )}
                  </button>
                  <button
                    onClick={() => setCenterTab("notes")}
                    className={cn(
                      "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                      centerTab === "notes" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <i className="fa-solid fa-pen-to-square mr-2 text-xs" />
                    Notas
                  </button>
                </div>

                {/* Tab content */}
                <div className="flex-1 p-5 overflow-hidden">
                  {centerTab === "transcript" ? (
                    <>
                      {isMicMode && !speech.isSupported && (
                        <div className="mb-3 rounded-lg border border-warning/30 bg-[var(--orange-100)] p-3 text-sm text-[var(--orange-600)]">
                          <i className="fa-solid fa-triangle-exclamation mr-2" />
                          Tu navegador no soporta Web Speech API. Usa Chrome o Edge para transcripción gratuita.
                        </div>
                      )}
                      {isMicMode && speech.error && (
                        <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                          <i className="fa-solid fa-circle-exclamation mr-2" />
                          {speech.error}
                        </div>
                      )}
                      {isMicMode && speech.isListening && (
                        <div className="mb-3 flex items-center gap-2 text-xs text-success">
                          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                          Escuchando vía micrófono · Web Speech API · $0
                          <div className="flex items-center gap-0.5 ml-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div
                                key={i}
                                className="w-1 rounded-full bg-success/60 transition-all duration-100"
                                style={{ height: `${Math.max(3, speech.audioLevel * 20 * (0.5 + Math.random()))}px` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <LiveTranscript
                        entries={activeTranscript}
                        isActive={phase === "active"}
                        contactName={contact.name.split(" ")[0]!}
                      />
                    </>
                  ) : (
                    <CallNotes value={notes} onChange={setNotes} />
                  )}
                </div>

                {/* Dialpad */}
                {showDialpad && (
                  <div className="px-5 pb-3">
                    <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((key) => (
                        <Button key={key} variant="outline" size="sm" className="h-10 text-base font-mono">{key}</Button>
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
                  <p className="text-center text-[10px] text-muted-foreground mt-3">
                    {callMode === "voip" && `Llamada VoIP vía Quo API · Cifrado SRTP · ${contact.phone}`}
                    {callMode === "hybrid-quo" && `Llamada telefónica vía Quo Bridge · ${contact.phone}`}
                    {callMode === "hybrid-device" && `Audio capturado desde ${audioDevice ?? "dispositivo"} · ${contact.phone}`}
                    {callMode === "mic-listen" && `Micrófono capturando audio · Web Speech API (gratis) · ${contact.phone}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right panel: Quick actions + integrations ──── */}
          <div className="col-span-3 border-l overflow-y-auto p-5 flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-bolt text-primary text-xs" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acciones rápidas</span>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contacto</span>
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

            {/* Metrics */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-chart-simple text-muted-foreground text-xs" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Métricas del cliente</span>
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

            <Separator />

            {/* Active integrations */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-plug text-muted-foreground text-xs" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Integraciones activas</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className={cn("h-2 w-2 rounded-full", callMode !== "hybrid-device" && !isMicMode ? "bg-success" : "bg-muted-foreground")} />
                  <span className="font-medium">Quo</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {callMode === "voip" && "VoIP + SMS + Transcripción"}
                    {callMode === "hybrid-quo" && "Bridge + SMS + Transcripción"}
                    {callMode === "hybrid-device" && "Inactivo (modo dispositivo)"}
                    {callMode === "mic-listen" && "No utilizado"}
                  </span>
                </div>
                {isMicMode && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className={cn("h-2 w-2 rounded-full", speech.isListening ? "bg-success animate-pulse" : "bg-muted-foreground")} />
                    <span className="font-medium">Micrófono</span>
                    <span className="text-xs text-muted-foreground ml-auto">Web Speech API ($0)</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="font-medium">Supabase</span>
                  <span className="text-xs text-muted-foreground ml-auto">CRM + Tareas</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <span className="font-medium">Zoho</span>
                  <span className="text-xs text-muted-foreground ml-auto">Sync (dual-write)</span>
                </div>
                {callMode === "hybrid-device" && audioDevice && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="font-medium">{audioDevice}</span>
                    <span className="text-xs text-muted-foreground ml-auto">Audio bridge</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { CallPanel };
