"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

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

const SEGMENT_COLORS: Record<Segment, string> = {
  ballenas: "bg-[var(--blue-100)] text-[var(--blue-600)]",
  tiburones: "bg-[var(--orange-100)] text-[var(--orange-600)]",
  atunes: "bg-[var(--success-100)] text-[var(--success-600)]",
  truchas: "bg-[var(--gray-100)] text-[var(--gray-600)]",
  charales: "bg-[var(--gray-100)] text-[var(--gray-500)]",
};

const STAGE_COLORS: Record<string, string> = {
  cotización_enviada: "bg-[var(--blue-100)] text-[var(--blue-600)]",
  seguimiento: "bg-[var(--orange-100)] text-[var(--orange-600)]",
  descubrimiento: "bg-[var(--success-100)] text-[var(--success-600)]",
  prospecto: "bg-[var(--gray-100)] text-[var(--gray-600)]",
  cerrado_ganado: "bg-[var(--success-100)] text-[var(--success-600)]",
  cerrado_perdido: "bg-[var(--danger-100)] text-[var(--danger-600)]",
};

const AVATAR_COLORS: Record<string, string> = {
  CM: "bg-[var(--blue-600)]",
  AT: "bg-[var(--orange-600)]",
  RJ: "bg-[var(--success-600)]",
  PS: "bg-[var(--danger-600)]",
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
      <nav className="flex w-16 min-w-[64px] flex-col items-center gap-1 bg-[var(--gray-900)] py-4" aria-label="Navegación principal">
        <div className="mb-5 grid h-9 w-9 place-content-center rounded-md bg-primary text-[15px] font-bold tracking-tight text-white">
          AI
        </div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={cn(
              "relative grid h-10 w-10 place-content-center rounded-md text-[var(--gray-400)] transition-all",
              item.active ? "bg-white/[.12] text-white" : "hover:bg-white/[.08] hover:text-[var(--gray-200)]"
            )}
            title={item.label}
          >
            <i className={item.icon} />
            {item.badge && (
              <span className="absolute right-1 top-1 grid min-w-[16px] place-content-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {item.badge}
              </span>
            )}
          </button>
        ))}
        <div className="flex-1" />
        <div className="grid h-8 w-8 place-content-center rounded-full bg-[var(--blue-400)] text-[13px] font-semibold text-white" title="Miriam Reyes">
          MR
        </div>
      </nav>

      {/* ── Agent / Thread Sidebar ───────────────────────────────── */}
      <aside className="flex w-80 min-w-[320px] flex-col overflow-hidden border-r border-border bg-card">
        {/* Header */}
        <div className="border-b border-border px-4 pb-3 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Inbox</h2>
            <div className="flex gap-1">
              <button className="grid h-8 w-8 place-content-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Filtrar">
                <i className="fa-solid fa-filter" />
              </button>
              <button className="grid h-8 w-8 place-content-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Más">
                <i className="fa-solid fa-ellipsis" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-transparent bg-muted px-3 py-2 transition-all focus-within:border-ring focus-within:bg-card focus-within:shadow-[0_0_0_3px_rgba(83,177,253,0.15)]">
            <i className="fa-solid fa-magnifying-glass text-muted-foreground" />
            <input type="text" placeholder="Buscar conversación..." className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--gray-400)]" />
          </div>
        </div>

        {/* Agent list with threads */}
        <div className="flex-1 overflow-y-auto">
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
                  <div className="grid h-9 w-9 min-w-[36px] place-content-center rounded-lg bg-primary/10 text-primary">
                    <i className={agent.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-foreground">{agent.name}</span>
                      {agent.unread > 0 && (
                        <span className="grid min-w-[18px] place-content-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                          {agent.unread}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{agent.description}</span>
                  </div>
                  {threads.length > 0 && (
                    <button
                      className="grid h-6 w-6 place-content-center rounded text-muted-foreground transition-transform hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); toggleAgent(agent.id); }}
                      aria-label={isExpanded ? "Colapsar hilos" : "Expandir hilos"}
                    >
                      <i className={cn("fa-solid fa-chevron-down text-[10px] transition-transform", !isExpanded && "-rotate-90")} />
                    </button>
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
                      <div className={cn("grid h-8 w-8 min-w-[32px] place-content-center rounded-full text-[12px] font-semibold text-white", AVATAR_COLORS[thread.initials] ?? "bg-[var(--gray-500)]")}>
                        {thread.initials}
                      </div>
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
                          <span className={cn("flex-shrink-0 rounded-full px-1.5 py-px text-[9px] font-semibold", SEGMENT_COLORS[thread.segment])}>
                            {SEGMENT_LABELS[thread.segment]}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Chat Panel ───────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col bg-background min-w-0">
        {/* Chat header */}
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {activeThread ? (
              <div className={cn("grid h-10 w-10 min-w-[40px] place-content-center rounded-full text-sm font-semibold text-white", AVATAR_COLORS[activeThread.initials] ?? "bg-[var(--gray-500)]")}>
                {activeThread.initials}
              </div>
            ) : (
              <div className="grid h-10 w-10 min-w-[40px] place-content-center rounded-lg bg-primary/10 text-primary text-lg">
                <i className={activeAgent?.icon ?? "fa-solid fa-robot"} />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-foreground">
                {activeThread ? activeThread.clientName : activeAgent?.name}
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                {activeThread ? (
                  <>
                    <span>{activeThread.company}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STAGE_COLORS[activeThread.stage] ?? "bg-muted text-muted-foreground")}>
                      {STAGE_LABELS[activeThread.stage]}
                    </span>
                  </>
                ) : (
                  <span>{activeAgent?.description}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-1">
            {activeThread && (
              <button className="grid h-8 w-8 place-content-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Llamar">
                <i className="fa-solid fa-phone" />
              </button>
            )}
            <button className="grid h-8 w-8 place-content-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Más">
              <i className="fa-solid fa-ellipsis" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {/* Date divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-medium text-muted-foreground">Hoy</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2.5 max-w-[720px]", msg.type === "user" && "flex-row-reverse self-end")}>
              {/* Avatar */}
              <div
                className={cn(
                  "mt-0.5 grid h-8 w-8 min-w-[32px] place-content-center rounded-full text-[12px] font-semibold text-white",
                  msg.type === "agent" && "bg-gradient-to-br from-[var(--blue-600)] to-[#2E90FA]",
                  msg.type === "user" && "bg-[var(--blue-600)]",
                  msg.type === "system" && "bg-[var(--gray-400)]"
                )}
              >
                {msg.type === "system" ? <i className="fa-solid fa-link text-[10px]" /> : msg.avatar}
              </div>
              {/* Body */}
              <div className="flex flex-col gap-1">
                {msg.type === "agent" && msg.agentTag && (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <i className="fa-solid fa-robot text-[8px]" /> {msg.agentTag}
                  </span>
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
                  <div className="mt-1.5 rounded-lg border border-border bg-card p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                      {msg.action.status === "auto-applied" && <i className="fa-solid fa-circle-check text-[var(--success-600)]" />}
                      {msg.action.status === "pending-approval" && <i className="fa-solid fa-clock text-[var(--orange-600)]" />}
                      {msg.action.status === "info" && <i className="fa-solid fa-circle-info text-primary" />}
                      {msg.action.label}
                      {msg.action.status === "auto-applied" && (
                        <span className="rounded-full bg-[var(--success-100)] px-2 py-0.5 text-[9px] font-bold text-[var(--success-600)]">Auto-aplicado</span>
                      )}
                      {msg.action.status === "pending-approval" && (
                        <span className="rounded-full bg-[var(--orange-100)] px-2 py-0.5 text-[9px] font-bold text-[var(--orange-600)]">Pendiente</span>
                      )}
                    </div>
                    <div className="text-[12px] leading-relaxed text-muted-foreground">{msg.action.body}</div>
                    {msg.action.buttons && (
                      <div className="mt-1 flex gap-2">
                        {msg.action.buttons.map((btn) => (
                          <button
                            key={btn.label}
                            className={cn(
                              "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                              btn.variant === "primary" && "bg-primary text-white hover:bg-primary/90",
                              btn.variant === "success" && "bg-[var(--success-600)] text-white hover:bg-[var(--success-600)]/90",
                              btn.variant === "outline" && "border border-input bg-card text-muted-foreground hover:bg-muted",
                              btn.variant === "danger" && "border border-[var(--danger-100)] text-destructive hover:bg-[var(--danger-100)]"
                            )}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <span className={cn("text-[10px] text-muted-foreground", msg.type === "user" && "text-right")}>{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card px-5 pb-4 pt-3">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-muted px-3.5 py-2.5 transition-all focus-within:border-ring focus-within:bg-card focus-within:shadow-[0_0_0_3px_rgba(83,177,253,0.12)]">
            <button className="grid h-8 w-8 place-content-center rounded-md text-muted-foreground transition-colors hover:text-foreground" title="Adjuntar">
              <i className="fa-solid fa-paperclip" />
            </button>
            <textarea rows={1} placeholder="Escribe un mensaje..." className="flex-1 resize-none bg-transparent text-[13px] leading-relaxed outline-none placeholder:text-[var(--gray-400)]" />
            <button className="grid h-8 w-8 place-content-center rounded-md bg-primary text-white transition-colors hover:bg-primary/90" title="Enviar">
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>
        </div>
      </main>

      {/* ── Detail Panel ─────────────────────────────────────────── */}
      {activeThread && (
        <aside className="hidden w-[300px] min-w-[300px] flex-col overflow-y-auto border-l border-border bg-card xl:flex">
          {/* Header */}
          <div className="border-b border-border p-4 text-center">
            <div className={cn("mx-auto mb-2 grid h-14 w-14 place-content-center rounded-full text-xl font-bold text-white", AVATAR_COLORS[activeThread.initials] ?? "bg-[var(--gray-500)]")}>
              {activeThread.initials}
            </div>
            <div className="text-[15px] font-bold text-foreground">{activeThread.clientName}</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">{activeThread.company}</div>
          </div>

          {/* Deal info */}
          <div className="border-b border-border p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Información del deal</div>
            {[
              { label: "Etapa", value: <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STAGE_COLORS[activeThread.stage])}>{STAGE_LABELS[activeThread.stage]}</span> },
              { label: "Valor", value: "$285,000 MXN" },
              { label: "Segmento", value: <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", SEGMENT_COLORS[activeThread.segment])}>{SEGMENT_LABELS[activeThread.segment]}</span> },
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
            <div className="flex items-center gap-2 rounded-md bg-[var(--orange-100)] px-3 py-2 text-[12px] font-medium text-[var(--orange-600)]">
              <i className="fa-solid fa-triangle-exclamation" /> Seguimiento pendiente — 6 días
            </div>
          </div>

          {/* Tasks */}
          <div className="border-b border-border p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tareas ({TASKS.length})</div>
            {TASKS.map((task) => (
              <div key={task.id} className="mb-2 flex items-start gap-2.5 rounded-md border border-border p-2.5">
                <div className={cn("mt-0.5 h-4 w-4 min-w-[16px] cursor-pointer rounded border-[1.5px]", task.done ? "border-[var(--success-600)] bg-[var(--success-600)]" : "border-input hover:border-ring")} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-foreground">{task.title}</div>
                  <div className={cn("mt-0.5 text-[11px] font-medium", task.dueStatus === "overdue" && "text-destructive", task.dueStatus === "upcoming" && "text-[var(--orange-600)]", task.dueStatus === "safe" && "text-muted-foreground")}>
                    {task.due}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity */}
          <div className="p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actividad reciente</div>
            {ACTIVITIES.map((act, i) => (
              <div key={i} className="flex gap-2.5 py-2">
                <div className={cn("mt-1.5 h-2 w-2 min-w-[8px] rounded-full", act.type === "call" && "bg-[var(--blue-400)]", act.type === "email" && "bg-[var(--orange-400)]", act.type === "task" && "bg-[var(--success-600)]", act.type === "agent" && "bg-primary")} />
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
