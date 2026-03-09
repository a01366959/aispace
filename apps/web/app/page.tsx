"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";

/* ════════════════════════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════════════════════════ */

type Segment = "ballenas" | "tiburones" | "atunes" | "truchas" | "charales";
type Stage =
  | "prospecto"
  | "primer_contacto"
  | "descubrimiento"
  | "cotización_preparación"
  | "cotización_enviada"
  | "seguimiento"
  | "cerrado_ganado"
  | "cerrado_perdido";

interface Agent {
  id: string;
  name: string;
  icon: string;
  description: string;
  unread: number;
}

interface ClientThread {
  id: string;
  agentId: string;
  clientName: string;
  company: string;
  initials: string;
  segment: Segment;
  stage: Stage;
  preview: string;
  time: string;
  unread: boolean;
}

interface Message {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  type: "user" | "agent" | "system";
  agentTag?: string;
  action?: {
    label: string;
    body: string;
    status: "auto-applied" | "pending-approval" | "info";
    buttons?: { label: string; variant: "primary" | "outline" | "success" | "danger" }[];
  };
}

interface Task {
  id: string;
  title: string;
  due: string;
  dueStatus: "overdue" | "upcoming" | "safe";
  done: boolean;
}

interface Activity {
  type: "call" | "email" | "task" | "agent";
  text: string;
  date: string;
}

/* ════════════════════════════════════════════════════════════════════════════
   Mock Data — GDT agents & threads
   ════════════════════════════════════════════════════════════════════════════ */

const AGENTS: Agent[] = [
  { id: "follow-up", name: "Agente de Seguimiento", icon: "fa-solid fa-bell", description: "Detecta tratos estancados y crea seguimientos", unread: 2 },
  { id: "sales-assistant", name: "Asistente de Ventas", icon: "fa-solid fa-handshake", description: "Borradores, resúmenes y próximos pasos", unread: 1 },
  { id: "supervisor", name: "Supervisor", icon: "fa-solid fa-eye", description: "Pipeline diario, riesgos y asignaciones", unread: 0 },
  { id: "reporting", name: "Reportes", icon: "fa-solid fa-chart-pie", description: "Reportes semanales y mensuales", unread: 0 },
];

const CLIENT_THREADS: ClientThread[] = [
  { id: "t1", agentId: "follow-up", clientName: "Carlos Mendoza", company: "Cervecería Toluca S.A.", initials: "CM", segment: "ballenas", stage: "cotización_enviada", preview: "Creé tarea de seguimiento — 6 días sin actividad", time: "10:32", unread: true },
  { id: "t2", agentId: "follow-up", clientName: "Ana Torres", company: "Plásticos Industriales MX", initials: "AT", segment: "tiburones", stage: "seguimiento", preview: "Seguimiento programado para mañana 10:30 AM", time: "09:15", unread: true },
  { id: "t3", agentId: "sales-assistant", clientName: "Carlos Mendoza", company: "Cervecería Toluca S.A.", initials: "CM", segment: "ballenas", stage: "cotización_enviada", preview: "Cotización de audiometrías lista — $42,000 MXN", time: "10:22", unread: true },
  { id: "t4", agentId: "sales-assistant", clientName: "Roberto Juárez", company: "Metalúrgica del Valle", initials: "RJ", segment: "atunes", stage: "descubrimiento", preview: "Resumen de llamada y próximos pasos generados", time: "Ayer", unread: false },
  { id: "t5", agentId: "supervisor", clientName: "Patricia Sánchez", company: "Grupo Farmacéutico GT", initials: "PS", segment: "ballenas", stage: "seguimiento", preview: "Cliente dormido — plan de reactivación listo", time: "08:00", unread: false },
];

const MAIN_CHAT_MESSAGES: Message[] = [
  { id: "m1", sender: "Agente de Seguimiento", avatar: "AI", text: "Buenos días. Completé el escaneo matutino del pipeline.", time: "08:00", type: "agent", agentTag: "Escaneo diario" },
  { id: "m2", sender: "Agente de Seguimiento", avatar: "AI", text: "Cervecería Toluca lleva 6 días sin actividad. Creé tarea de seguimiento para hoy y un borrador de llamada para mañana a las 10:00 AM.", time: "08:01", type: "agent",
    action: { label: "Tarea creada automáticamente", body: "Seguimiento: Llamar a Carlos Mendoza — Cervecería Toluca. Deal $285,000 MXN en etapa Cotización Enviada.", status: "auto-applied" },
  },
  { id: "m3", sender: "Agente de Seguimiento", avatar: "AI", text: "Plásticos Industriales tiene 4 días sin actividad. Se acerca al umbral de SLA para Tiburones (3 días). Creé recordatorio urgente.", time: "08:02", type: "agent",
    action: { label: "Tarea urgente creada", body: "Seguimiento urgente: Ana Torres — Plásticos Industriales MX. Pipeline $180,000 MXN. SLA Tiburones en riesgo.", status: "auto-applied" },
  },
  { id: "m4", sender: "Tú", avatar: "MR", text: "Perfecto, gracias. ¿Hay algo más pendiente?", time: "08:15", type: "user" },
  { id: "m5", sender: "Agente de Seguimiento", avatar: "AI", text: "Sí. Detecté que Grupo Farmacéutico GT no ha comprado ni sido contactado en 47 días. Creé oportunidad de reactivación y borrador de contacto. Lo pasé al Supervisor para revisión.", time: "08:16", type: "agent",
    action: { label: "Reactivación iniciada", body: "Nuevo deal de reactivación creado para Grupo Farmacéutico GT (Ballena). Borrador de llamada preparado. Pendiente asignación de vendedor.", status: "auto-applied" },
  },
];

const THREAD_MESSAGES: Message[] = [
  { id: "tm1", sender: "Agente de Seguimiento", avatar: "AI", text: "Canal abierto para Cervecería Toluca S.A. con contexto del chat principal.", time: "08:01", type: "system" },
  { id: "tm2", sender: "Agente de Seguimiento", avatar: "AI", text: "Cervecería Toluca lleva 6 días sin actividad en etapa Cotización Enviada. Deal value: $285,000 MXN (Ballena).", time: "08:01", type: "agent",
    action: { label: "Tarea de seguimiento creada", body: "Llamar a Carlos Mendoza hoy. Última interacción: recibió cotización anual para 350 exámenes. Pendiente: aprobación del director de RH.", status: "auto-applied" },
  },
  { id: "tm3", sender: "Agente de Seguimiento", avatar: "AI", text: "Borrador de mensaje de seguimiento preparado:", time: "08:02", type: "agent",
    action: { label: "Borrador para aprobación", body: "\"Buenos días Carlos, ¿cómo va la revisión con su director de RH? Quedo al pendiente para resolver cualquier duda sobre la cotización. Saludos.\"", status: "pending-approval", buttons: [{ label: "Aprobar y enviar", variant: "success" }, { label: "Editar", variant: "outline" }, { label: "Rechazar", variant: "danger" }] },
  },
  { id: "tm4", sender: "Tú", avatar: "MR", text: "Buen borrador. Lo apruebo, pero agrega que podemos agendar una llamada para resolver dudas.", time: "10:30", type: "user" },
  { id: "tm5", sender: "Agente de Seguimiento", avatar: "AI", text: "Mensaje actualizado y enviado a la cola de aprobación de Miriam:", time: "10:31", type: "agent",
    action: { label: "Pendiente aprobación de Miriam", body: "\"Buenos días Carlos, ¿cómo va la revisión con su director de RH? Si hay dudas, con gusto agendamos una llamada para resolverlas juntos. Quedo al pendiente. Saludos.\"", status: "pending-approval", buttons: [{ label: "Aprobar (Miriam)", variant: "success" }, { label: "Rechazar", variant: "danger" }] },
  },
];

const TASKS: Task[] = [
  { id: "t1", title: "Seguimiento cotización anual", due: "Hoy 10:30 AM", dueStatus: "upcoming", done: false },
  { id: "t2", title: "Enviar propuesta audiometrías", due: "Jue 12:00 PM", dueStatus: "safe", done: false },
  { id: "t3", title: "Confirmar datos de facturación", due: "Ayer", dueStatus: "overdue", done: false },
];

const ACTIVITIES: Activity[] = [
  { type: "agent", text: "AI creó cotización audiometrías ($42,000)", date: "Hoy 10:22" },
  { type: "agent", text: "AI creó tarea seguimiento Cervecería", date: "Hoy 08:01" },
  { type: "call", text: "Llamada con Carlos — 8 min", date: "Ayer 10:02" },
  { type: "email", text: "Cotización anual enviada por correo", date: "Ayer 16:45" },
  { type: "task", text: "Revisión de precios completada", date: "Lun 14:00" },
];

/* ════════════════════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════════════════════ */

const STAGE_LABELS: Record<Stage, string> = {
  prospecto: "Prospecto",
  primer_contacto: "Primer contacto",
  descubrimiento: "Descubrimiento",
  cotización_preparación: "Preparando cotización",
  cotización_enviada: "Cotización enviada",
  seguimiento: "Seguimiento",
  cerrado_ganado: "Cerrado ganado",
  cerrado_perdido: "Cerrado perdido",
};

const SEGMENT_LABELS: Record<Segment, string> = {
  ballenas: "Ballena",
  tiburones: "Tiburón",
  atunes: "Atún",
  truchas: "Trucha",
  charales: "Charal",
};

const SEGMENT_BADGE_VARIANTS: Record<Segment, "blue" | "warning" | "success" | "muted"> = {
  ballenas: "blue",
  tiburones: "warning",
  atunes: "success",
  truchas: "muted",
  charales: "muted",
};

const STAGE_BADGE_VARIANTS: Record<string, "blue" | "warning" | "success" | "muted" | "destructive"> = {
  cotización_enviada: "blue",
  seguimiento: "warning",
  descubrimiento: "success",
  prospecto: "muted",
  cerrado_ganado: "success",
  cerrado_perdido: "destructive",
};

const AVATAR_COLORS: Record<string, string> = {
  CM: "bg-[var(--blue-600)]",
  AT: "bg-[var(--orange-600)]",
  RJ: "bg-success",
  PS: "bg-destructive",
};

const BUTTON_VARIANT_MAP: Record<string, "default" | "outline" | "success" | "destructive"> = {
  primary: "default",
  outline: "outline",
  success: "success",
  danger: "destructive",
};

/* Navigation items */
const NAV_ITEMS = [
  { icon: "fa-solid fa-inbox", label: "Inbox", active: true, badge: 3 },
  { icon: "fa-solid fa-dollar-sign", label: "Deals" },
  { icon: "fa-solid fa-circle-check", label: "Tareas" },
  { icon: "fa-solid fa-calendar-days", label: "Calendario" },
  { icon: "fa-solid fa-chart-column", label: "Reportes" },
];

/* ════════════════════════════════════════════════════════════════════════════
   Page Component
   ════════════════════════════════════════════════════════════════════════════ */

type ActiveView =
  | { type: "main"; agentId: string }
  | { type: "thread"; threadId: string };

export default function InboxPage() {
  const [activeView, setActiveView] = useState<ActiveView>({ type: "main", agentId: "follow-up" });
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set(["follow-up", "sales-assistant"]));

  const toggleAgent = (agentId: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  };

  const activeAgent = activeView.type === "main"
    ? AGENTS.find((a) => a.id === activeView.agentId)
    : AGENTS.find((a) => a.id === CLIENT_THREADS.find((t) => t.id === activeView.threadId)?.agentId);

  const activeThread = activeView.type === "thread"
    ? CLIENT_THREADS.find((t) => t.id === activeView.threadId)
    : null;

  const messages = activeView.type === "main" ? MAIN_CHAT_MESSAGES : THREAD_MESSAGES;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Nav Rail ─────────────────────────────────────────────── */}
      <nav className="flex w-16 min-w-[64px] flex-col items-center gap-1 bg-sidebar py-4" aria-label="Navegación principal">
        <div className="mb-5 grid h-9 w-9 place-content-center rounded-md bg-primary text-[15px] font-bold tracking-tight text-white">
          AI
        </div>
        {NAV_ITEMS.map((item) => (
          <Tooltip key={item.label} content={item.label} side="right">
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "relative text-sidebar-foreground",
                item.active
                  ? "bg-white/[.12] text-sidebar-active"
                  : "hover:bg-white/[.08] hover:text-[var(--gray-200)]"
              )}
            >
              <i className={item.icon} />
              {item.badge && (
                <Badge variant="destructive" className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] px-1 text-[10px]">
                  {item.badge}
                </Badge>
              )}
            </Button>
          </Tooltip>
        ))}
        <div className="flex-1" />
        <Tooltip content="Miriam Reyes" side="right">
          <Avatar size="sm" className="bg-[var(--blue-400)] text-[13px]" initials="MR" />
        </Tooltip>
      </nav>

      {/* ── Agent / Thread Sidebar ───────────────────────────────── */}
      <aside className="flex w-80 min-w-[320px] flex-col overflow-hidden border-r border-border bg-card">
        {/* Header */}
        <div className="border-b border-border px-4 pb-3 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Inbox</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" title="Filtrar">
                <i className="fa-solid fa-filter" />
              </Button>
              <Button variant="ghost" size="icon-sm" title="Más">
                <i className="fa-solid fa-ellipsis" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
            <Input
              type="text"
              placeholder="Buscar conversación..."
              className="pl-9 bg-muted border-transparent text-[13px] focus-visible:bg-card focus-visible:border-ring"
            />
          </div>
        </div>

        {/* Agent list with threads */}
        <ScrollArea className="flex-1">
          {AGENTS.map((agent) => {
            const threads = CLIENT_THREADS.filter((t) => t.agentId === agent.id);
            const isExpanded = expandedAgents.has(agent.id);
            const isActiveMain = activeView.type === "main" && activeView.agentId === agent.id;

            return (
              <div key={agent.id}>
                {/* Agent row */}
                <button
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors",
                    isActiveMain ? "bg-accent" : "hover:bg-muted"
                  )}
                  onClick={() => setActiveView({ type: "main", agentId: agent.id })}
                >
                  <Avatar size="default" className="rounded-lg bg-primary/10 text-primary">
                    <i className={agent.icon} />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-foreground">{agent.name}</span>
                      {agent.unread > 0 && (
                        <Badge className="h-[18px] min-w-[18px] px-1.5 text-[10px]">
                          {agent.unread}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{agent.description}</span>
                  </div>
                  {threads.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); toggleAgent(agent.id); }}
                      aria-label={isExpanded ? "Colapsar hilos" : "Expandir hilos"}
                    >
                      <i className={cn("fa-solid fa-chevron-down text-[10px] transition-transform", !isExpanded && "-rotate-90")} />
                    </Button>
                  )}
                </button>

                {/* Client threads */}
                {isExpanded && threads.map((thread) => {
                  const isActiveThread = activeView.type === "thread" && activeView.threadId === thread.id;
                  return (
                    <button
                      key={thread.id}
                      className={cn(
                        "flex w-full items-center gap-3 border-b border-border py-2.5 pl-14 pr-4 text-left transition-colors",
                        isActiveThread ? "bg-accent" : "hover:bg-muted"
                      )}
                      onClick={() => setActiveView({ type: "thread", threadId: thread.id })}
                    >
                      <Avatar size="sm" className={AVATAR_COLORS[thread.initials] ?? "bg-[var(--gray-500)]"} initials={thread.initials} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("truncate text-[12px] text-foreground", thread.unread ? "font-bold" : "font-medium")}>
                            {thread.clientName}
                          </span>
                          <span className="flex-shrink-0 text-[10px] text-muted-foreground">{thread.time}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("truncate text-[11px]", thread.unread ? "font-medium text-foreground" : "text-muted-foreground")}>
                            {thread.preview}
                          </span>
                          {thread.unread && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="truncate text-[10px] text-muted-foreground">{thread.company}</span>
                          <Badge variant={SEGMENT_BADGE_VARIANTS[thread.segment]} className="h-auto px-1.5 py-px text-[9px]">
                            {SEGMENT_LABELS[thread.segment]}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </ScrollArea>
      </aside>

      {/* ── Chat Panel ───────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col bg-background min-w-0">
        {/* Chat header */}
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {activeThread ? (
              <Avatar size="md" className={AVATAR_COLORS[activeThread.initials] ?? "bg-[var(--gray-500)]"} initials={activeThread.initials} />
            ) : (
              <Avatar size="md" className="rounded-lg bg-primary/10 text-primary text-lg">
                <i className={activeAgent?.icon ?? "fa-solid fa-robot"} />
              </Avatar>
            )}
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-foreground">
                {activeThread ? activeThread.clientName : activeAgent?.name}
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                {activeThread ? (
                  <>
                    <span>{activeThread.company}</span>
                    <Badge variant={STAGE_BADGE_VARIANTS[activeThread.stage] ?? "muted"} className="text-[11px]">
                      {STAGE_LABELS[activeThread.stage]}
                    </Badge>
                  </>
                ) : (
                  <span>{activeAgent?.description}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-1">
            {activeThread && (
              <Button variant="ghost" size="icon-sm" title="Llamar">
                <i className="fa-solid fa-phone" />
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" title="Más">
              <i className="fa-solid fa-ellipsis" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex flex-1 flex-col gap-4 p-5">
          {/* Date divider */}
          <div className="flex items-center gap-3 my-2">
            <Separator className="flex-1" />
            <span className="text-[11px] font-medium text-muted-foreground">Hoy</span>
            <Separator className="flex-1" />
          </div>

          <div className="flex flex-col gap-4 mt-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-2.5 max-w-[720px]", msg.type === "user" && "flex-row-reverse self-end")}>
                {/* Avatar */}
                <Avatar
                  size="sm"
                  className={cn(
                    "mt-0.5",
                    msg.type === "agent" && "bg-gradient-to-br from-[var(--blue-600)] to-[#2E90FA]",
                    msg.type === "user" && "bg-[var(--blue-600)]",
                    msg.type === "system" && "bg-[var(--gray-400)]"
                  )}
                >
                  {msg.type === "system" ? <i className="fa-solid fa-link text-[10px]" /> : msg.avatar}
                </Avatar>
                {/* Body */}
                <div className="flex flex-col gap-1">
                  {msg.type === "agent" && msg.agentTag && (
                    <Badge variant="blue" className="w-fit gap-1 text-[10px]">
                      <i className="fa-solid fa-robot text-[8px]" /> {msg.agentTag}
                    </Badge>
                  )}
                  {msg.type !== "agent" && (
                    <span className={cn("text-[12px] font-semibold text-muted-foreground", msg.type === "user" && "text-right")}>{msg.sender}</span>
                  )}
                  <div
                    className={cn(
                      "rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed border",
                      msg.type === "user" && "bg-primary text-white border-primary",
                      msg.type === "agent" && "bg-gradient-to-br from-[#F0F7FF] to-[#E8F4FD] border-[var(--blue-100)] text-foreground",
                      msg.type === "system" && "bg-muted border-border text-muted-foreground text-[12px] italic"
                    )}
                  >
                    {msg.text}
                  </div>
                  {/* Action card */}
                  {msg.action && (
                    <Card className="mt-1.5">
                      <CardContent className="p-3 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                          {msg.action.status === "auto-applied" && <i className="fa-solid fa-circle-check text-success" />}
                          {msg.action.status === "pending-approval" && <i className="fa-solid fa-clock text-warning" />}
                          {msg.action.status === "info" && <i className="fa-solid fa-circle-info text-primary" />}
                          {msg.action.label}
                          {msg.action.status === "auto-applied" && (
                            <Badge variant="success" className="text-[9px]">Auto-aplicado</Badge>
                          )}
                          {msg.action.status === "pending-approval" && (
                            <Badge variant="warning" className="text-[9px]">Pendiente</Badge>
                          )}
                        </div>
                        <p className="text-[12px] leading-relaxed text-muted-foreground">{msg.action.body}</p>
                        {msg.action.buttons && (
                          <div className="mt-1 flex gap-2">
                            {msg.action.buttons.map((btn) => (
                              <Button
                                key={btn.label}
                                variant={BUTTON_VARIANT_MAP[btn.variant]}
                                size="sm"
                                className="text-[12px]"
                              >
                                {btn.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  <span className={cn("text-[10px] text-muted-foreground", msg.type === "user" && "text-right")}>{msg.time}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border bg-card px-5 pb-4 pt-3">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-muted px-3.5 py-2.5 transition-all focus-within:border-ring focus-within:bg-card focus-within:shadow-[0_0_0_3px_rgba(83,177,253,0.12)]">
            <Button variant="ghost" size="icon-sm" title="Adjuntar">
              <i className="fa-solid fa-paperclip" />
            </Button>
            <Textarea
              rows={1}
              placeholder="Escribe un mensaje..."
              className="flex-1 min-h-0 resize-none border-0 bg-transparent p-0 text-[13px] leading-relaxed shadow-none focus-visible:ring-0 placeholder:text-[var(--gray-400)]"
            />
            <Button size="icon-sm" title="Enviar">
              <i className="fa-solid fa-paper-plane" />
            </Button>
          </div>
        </div>
      </main>

      {/* ── Detail Panel ─────────────────────────────────────────── */}
      {activeThread && (
        <aside className="hidden w-[300px] min-w-[300px] flex-col overflow-y-auto border-l border-border bg-card xl:flex">
          {/* Header */}
          <div className="border-b border-border p-4 text-center">
            <Avatar size="lg" className={cn("mx-auto mb-2", AVATAR_COLORS[activeThread.initials] ?? "bg-[var(--gray-500)]")} initials={activeThread.initials} />
            <div className="text-[15px] font-bold text-foreground">{activeThread.clientName}</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">{activeThread.company}</div>
          </div>

          {/* Deal info */}
          <div className="border-b border-border p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Información del deal</div>
            {[
              { label: "Etapa", value: <Badge variant={STAGE_BADGE_VARIANTS[activeThread.stage]} className="text-[11px]">{STAGE_LABELS[activeThread.stage]}</Badge> },
              { label: "Valor", value: "$285,000 MXN" },
              { label: "Segmento", value: <Badge variant={SEGMENT_BADGE_VARIANTS[activeThread.segment]} className="text-[10px]">{SEGMENT_LABELS[activeThread.segment]}</Badge> },
              { label: "Vendedor", value: "Miriam Reyes" },
              { label: "Creado", value: "15 May 2025" },
            ].map((field) => (
              <div key={field.label} className="flex items-start justify-between py-1.5">
                <span className="text-[12px] text-muted-foreground">{field.label}</span>
                <span className="max-w-[60%] text-right text-[12px] font-medium text-foreground">{field.value}</span>
              </div>
            ))}
          </div>

          {/* Risk */}
          <div className="border-b border-border p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Riesgo</div>
            <Card className="border-warning/30 bg-[var(--orange-100)]">
              <CardContent className="flex items-center gap-2 p-3 text-[12px] font-medium text-warning">
                <i className="fa-solid fa-triangle-exclamation" /> Seguimiento pendiente — 6 días
              </CardContent>
            </Card>
          </div>

          {/* Tasks */}
          <div className="border-b border-border p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tareas ({TASKS.length})</div>
            {TASKS.map((task) => (
              <Card key={task.id} className="mb-2">
                <CardContent className="flex items-start gap-2.5 p-2.5">
                  <div className={cn("mt-0.5 h-4 w-4 min-w-[16px] cursor-pointer rounded border-[1.5px]", task.done ? "border-success bg-success" : "border-input hover:border-ring")} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-foreground">{task.title}</div>
                    <div className={cn("mt-0.5 text-[11px] font-medium", task.dueStatus === "overdue" && "text-destructive", task.dueStatus === "upcoming" && "text-warning", task.dueStatus === "safe" && "text-muted-foreground")}>
                      {task.due}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Activity */}
          <div className="p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actividad reciente</div>
            {ACTIVITIES.map((act, i) => (
              <div key={i} className="flex gap-2.5 py-2">
                <div className={cn("mt-1.5 h-2 w-2 min-w-[8px] rounded-full", act.type === "call" && "bg-[var(--blue-400)]", act.type === "email" && "bg-[var(--orange-400)]", act.type === "task" && "bg-success", act.type === "agent" && "bg-primary")} />
                <div>
                  <div className="text-[12px] leading-snug text-muted-foreground">{act.text}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground/70">{act.date}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
