"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";
import { CallPanel, type CallContact, type CallDeal, type CallMode } from "@/components/call/CallPanel";
import type { CallHistoryItem, TalkingPoint, QuickAction } from "@/components/call/CallPanel";

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

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface Message {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  type: "user" | "agent" | "system";
  agentTag?: string;
  replyTo?: { sender: string; text: string };
  reactions?: Reaction[];
  threadCount?: number;
  action?: {
    label: string;
    body: string;
    status: "auto-applied" | "pending-approval" | "info";
    buttons?: { label: string; variant: "primary" | "outline" | "success" | "danger" }[];
  };
}

interface SlashCommand {
  command: string;
  label: string;
  icon: string;
  description: string;
}

interface Mention {
  id: string;
  name: string;
  initials: string;
  role: string;
}

/* ════════════════════════════════════════════════════════════════════════════
   Mock Data
   ════════════════════════════════════════════════════════════════════════════ */

const AGENTS: Agent[] = [
  { id: "follow-up", name: "Seguimiento", icon: "fa-solid fa-bell", description: "Tratos estancados y seguimientos", unread: 2 },
  { id: "sales-assistant", name: "Asistente Ventas", icon: "fa-solid fa-handshake", description: "Borradores y resúmenes", unread: 1 },
  { id: "supervisor", name: "Supervisor", icon: "fa-solid fa-eye", description: "Pipeline y riesgos", unread: 0 },
  { id: "reporting", name: "Reportes", icon: "fa-solid fa-chart-pie", description: "Reportes semanales", unread: 0 },
];

const CLIENT_THREADS: ClientThread[] = [
  { id: "t1", agentId: "follow-up", clientName: "Carlos Mendoza", company: "Cervecería Toluca", initials: "CM", segment: "ballenas", stage: "cotización_enviada", preview: "Tarea de seguimiento creada — 6 días sin actividad", time: "10:32", unread: true },
  { id: "t2", agentId: "follow-up", clientName: "Ana Torres", company: "Plásticos Industriales", initials: "AT", segment: "tiburones", stage: "seguimiento", preview: "Seguimiento programado para mañana", time: "09:15", unread: true },
  { id: "t3", agentId: "sales-assistant", clientName: "Carlos Mendoza", company: "Cervecería Toluca", initials: "CM", segment: "ballenas", stage: "cotización_enviada", preview: "Cotización audiometrías — $42,000 MXN", time: "10:22", unread: true },
  { id: "t4", agentId: "sales-assistant", clientName: "Roberto Juárez", company: "Metalúrgica del Valle", initials: "RJ", segment: "atunes", stage: "descubrimiento", preview: "Resumen de llamada generado", time: "Ayer", unread: false },
  { id: "t5", agentId: "supervisor", clientName: "Patricia Sánchez", company: "Grupo Farmacéutico GT", initials: "PS", segment: "ballenas", stage: "seguimiento", preview: "Plan de reactivación listo", time: "08:00", unread: false },
];

const MESSAGES: Message[] = [
  {
    id: "m1", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "08:00",
    text: "Buenos días. Completé el escaneo matutino del pipeline.",
    agentTag: "Escaneo diario",
    reactions: [{ emoji: "👍", count: 1, reacted: false }],
    threadCount: 2,
  },
  {
    id: "m2", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "08:01",
    text: "Cervecería Toluca lleva 6 días sin actividad. Creé tarea de seguimiento y borrador de llamada para mañana 10:00 AM.",
    action: { label: "Tarea creada automáticamente", body: "Seguimiento: Llamar a Carlos Mendoza — Cervecería Toluca. Deal $285,000 MXN en etapa Cotización Enviada.", status: "auto-applied" },
    reactions: [{ emoji: "✅", count: 2, reacted: true }],
  },
  {
    id: "m3", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "08:02",
    text: "Plásticos Industriales tiene 4 días sin actividad. SLA Tiburones en riesgo. Creé recordatorio urgente.",
    action: { label: "Tarea urgente creada", body: "Ana Torres — Plásticos Industriales. Pipeline $180,000 MXN. SLA en riesgo.", status: "auto-applied" },
  },
  {
    id: "m4", sender: "Tú", avatar: "MR", type: "user", time: "08:15",
    text: "Perfecto, gracias. ¿Hay algo más pendiente?",
  },
  {
    id: "m5", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "08:16",
    text: "Grupo Farmacéutico GT sin contacto en 47 días. Creé oportunidad de reactivación y lo pasé al Supervisor.",
    replyTo: { sender: "Tú", text: "Perfecto, gracias. ¿Hay algo más pendiente?" },
    action: { label: "Reactivación iniciada", body: "Deal de reactivación creado para Grupo Farmacéutico GT (Ballena). Borrador de llamada preparado.", status: "auto-applied" },
    threadCount: 4,
  },
];

const THREAD_MESSAGES: Message[] = [
  { id: "th1", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "08:16", text: "Contexto: Grupo Farmacéutico GT (Ballena) — sin compras ni contacto en 47 días." },
  { id: "th2", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "08:17", text: "Creé deal de reactivación y borrador de contacto. Lo pasé al Supervisor para asignación.", action: { label: "Deal creado", body: "Reactivación — Grupo Farmacéutico GT. Valor estimado: $420,000 MXN. Pendiente asignación de vendedor.", status: "auto-applied" } },
  { id: "th3", sender: "Supervisor", avatar: "SV", type: "agent", time: "08:30", text: "Asigné a Miriam Reyes. Buen candidato para reactivación dado su historial de compra.", agentTag: "Auto-asignación", reactions: [{ emoji: "👍", count: 1, reacted: false }] },
  { id: "th4", sender: "Tú", avatar: "MR", type: "user", time: "09:00", text: "Yo me encargo. Llamaré mañana temprano." },
];

const SLASH_COMMANDS: SlashCommand[] = [
  { command: "/tarea", label: "Crear tarea", icon: "fa-solid fa-circle-check", description: "Nueva tarea para ti o tu equipo" },
  { command: "/cotización", label: "Crear cotización", icon: "fa-solid fa-file-invoice-dollar", description: "Generar cotización con precios actuales" },
  { command: "/llamada", label: "Programar llamada", icon: "fa-solid fa-phone", description: "Agendar llamada con cliente" },
  { command: "/resumen", label: "Resumen del deal", icon: "fa-solid fa-list-check", description: "Contexto completo y próximos pasos" },
  { command: "/nota", label: "Agregar nota", icon: "fa-solid fa-note-sticky", description: "Nota interna al hilo del cliente" },
  { command: "/asignar", label: "Asignar deal", icon: "fa-solid fa-user-plus", description: "Reasignar deal a otro vendedor" },
];

const MENTIONS: Mention[] = [
  { id: "miriam", name: "Miriam Reyes", initials: "MR", role: "Vendedora Sr." },
  { id: "juan", name: "Juan García", initials: "JG", role: "Vendedor" },
  { id: "laura", name: "Laura Díaz", initials: "LD", role: "Gerente Comercial" },
  { id: "follow-up-m", name: "Agente de Seguimiento", initials: "AI", role: "Agente AI" },
  { id: "supervisor-m", name: "Supervisor", initials: "AI", role: "Agente AI" },
  { id: "sales-assistant-m", name: "Asistente de Ventas", initials: "AI", role: "Agente AI" },
];

const EMOJI_PICKER = ["👍", "✅", "🔥", "👀", "❤️", "😂", "🎉", "⚡"];

/* ════════════════════════════════════════════════════════════════════════════
   Call Data — mapped to client threads
   ════════════════════════════════════════════════════════════════════════════ */

const CALL_CONTACTS: Record<string, CallContact> = {
  t1: { id: "t1", name: "Carlos Mendoza", initials: "CM", role: "Gerente de Compras", company: "Cervecería Toluca", phone: "722-555-1234", email: "c.mendoza@cervtoluca.mx", segment: "ballenas" },
  t2: { id: "t2", name: "Ana Torres", initials: "AT", role: "Directora de Seguridad", company: "Plásticos Industriales", phone: "722-555-5678", email: "a.torres@plasticos.mx", segment: "tiburones" },
  t3: { id: "t3", name: "Carlos Mendoza", initials: "CM", role: "Gerente de Compras", company: "Cervecería Toluca", phone: "722-555-1234", email: "c.mendoza@cervtoluca.mx", segment: "ballenas" },
  t4: { id: "t4", name: "Roberto Juárez", initials: "RJ", role: "Jefe de RH", company: "Metalúrgica del Valle", phone: "722-555-3456", segment: "atunes" },
  t5: { id: "t5", name: "Patricia Sánchez", initials: "PS", role: "Directora Médica", company: "Grupo Farmacéutico GT", phone: "722-555-7890", email: "p.sanchez@gfgt.mx", segment: "ballenas" },
};

const CALL_DEALS: Record<string, CallDeal> = {
  t1: { id: "d1", name: "Exámenes anuales — Cervecería Toluca", stage: "Cotización enviada", stageNumber: 5, value: "$285,000 MXN", daysSinceActivity: 6 },
  t2: { id: "d2", name: "Campaña ocupacional — Plásticos Industriales", stage: "Seguimiento", stageNumber: 6, value: "$180,000 MXN", daysSinceActivity: 4 },
  t3: { id: "d3", name: "Audiometrías — Cervecería Toluca", stage: "Cotización enviada", stageNumber: 5, value: "$42,000 MXN", daysSinceActivity: 2 },
  t4: { id: "d4", name: "Exámenes nuevo ingreso — Metalúrgica", stage: "Descubrimiento", stageNumber: 3, value: "$65,000 MXN", daysSinceActivity: 1 },
  t5: { id: "d5", name: "Reactivación — Grupo Farmacéutico GT", stage: "Primer contacto", stageNumber: 2, value: "$420,000 MXN", daysSinceActivity: 47 },
};

const CALL_HISTORY: Record<string, CallHistoryItem[]> = {
  t1: [
    { date: "3 Mar", type: "quote", summary: "Cotización enviada — $285,000 MXN" },
    { date: "28 Feb", type: "call", summary: "Esperan aprobación de presupuesto" },
    { date: "22 Feb", type: "call", summary: "Descubrimiento: 200 empleados" },
  ],
  t2: [
    { date: "5 Mar", type: "call", summary: "Seguimiento — esperan resultado de auditoría" },
    { date: "1 Mar", type: "quote", summary: "Cotización enviada — $180,000 MXN" },
  ],
  t5: [
    { date: "20 Ene", type: "call", summary: "Última llamada — 47 días sin contacto" },
    { date: "15 Dic", type: "quote", summary: "Cotización previa — $380,000 MXN" },
  ],
};

const CALL_TALKING_POINTS: Record<string, TalkingPoint[]> = {
  t1: [
    { priority: "high", text: "6 días sin actividad — SLA Ballena en riesgo" },
    { priority: "high", text: "Esperan aprobación de presupuesto de RH" },
    { priority: "medium", text: "200 empleados, exámenes anuales vencen en abril" },
  ],
  t2: [
    { priority: "high", text: "4 días sin actividad — SLA Tiburones en riesgo" },
    { priority: "medium", text: "Pendiente resultado de auditoría interna" },
  ],
  t5: [
    { priority: "high", text: "47 días sin contacto — oportunidad de reactivación" },
    { priority: "medium", text: "Historial de compra: $380K MXN el año pasado" },
    { priority: "low", text: "Posible expansión a 3 sedes adicionales" },
  ],
};

const CALL_QUICK_ACTIONS: QuickAction[] = [
  { id: "schedule", label: "Agendar seguimiento", icon: "fa-calendar-plus" },
  { id: "quote", label: "Preparar cotización", icon: "fa-file-invoice-dollar" },
  { id: "update_stage", label: "Actualizar etapa", icon: "fa-arrow-right" },
  { id: "create_task", label: "Crear tarea", icon: "fa-circle-plus" },
  { id: "send_email", label: "Enviar correo", icon: "fa-envelope", variant: "outline" as const },
];

/* ════════════════════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════════════════════ */

const STAGE_LABELS: Record<Stage, string> = {
  prospecto: "Prospecto", primer_contacto: "Primer contacto", descubrimiento: "Descubrimiento",
  cotización_preparación: "Preparando cotización", cotización_enviada: "Cotización enviada",
  seguimiento: "Seguimiento", cerrado_ganado: "Cerrado ganado", cerrado_perdido: "Cerrado perdido",
};
const SEGMENT_LABELS: Record<Segment, string> = { ballenas: "Ballena", tiburones: "Tiburón", atunes: "Atún", truchas: "Trucha", charales: "Charal" };
const SEGMENT_BADGE: Record<Segment, "blue" | "warning" | "success" | "muted"> = { ballenas: "blue", tiburones: "warning", atunes: "success", truchas: "muted", charales: "muted" };
const STAGE_BADGE: Record<string, "blue" | "warning" | "success" | "muted" | "destructive"> = { cotización_enviada: "blue", seguimiento: "warning", descubrimiento: "success", prospecto: "muted", cerrado_ganado: "success", cerrado_perdido: "destructive" };
const AVATAR_BG: Record<string, string> = { CM: "bg-[var(--blue-600)]", AT: "bg-[var(--orange-600)]", RJ: "bg-success", PS: "bg-destructive", AI: "bg-foreground", SV: "bg-foreground", MR: "bg-primary" };
const BTN_MAP: Record<string, "default" | "outline" | "success" | "destructive"> = { primary: "default", outline: "outline", success: "success", danger: "destructive" };

const NAV_ITEMS = [
  { icon: "fa-solid fa-inbox", label: "Inbox", active: true, badge: 3 },
  { icon: "fa-solid fa-dollar-sign", label: "Deals" },
  { icon: "fa-solid fa-circle-check", label: "Tareas" },
  { icon: "fa-solid fa-calendar-days", label: "Calendario" },
  { icon: "fa-solid fa-chart-column", label: "Reportes" },
];

/* ════════════════════════════════════════════════════════════════════════════
   Composer — with / commands and @ mentions
   ════════════════════════════════════════════════════════════════════════════ */

function Composer({ placeholder = "Mensaje... usa / para comandos, @ para mencionar" }: { placeholder?: string }) {
  const [value, setValue] = useState("");
  const [showSlash, setShowSlash] = useState(false);
  const [showMention, setShowMention] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [mentionFilter, setMentionFilter] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const filteredCommands = SLASH_COMMANDS.filter((c) =>
    c.command.includes(slashFilter.toLowerCase()) || c.label.toLowerCase().includes(slashFilter.toLowerCase())
  );
  const filteredMentions = MENTIONS.filter((m) =>
    m.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setValue(v);
    const lastSlash = v.lastIndexOf("/");
    if (lastSlash >= 0 && (lastSlash === 0 || v[lastSlash - 1] === " " || v[lastSlash - 1] === "\n")) {
      const after = v.slice(lastSlash + 1);
      if (!after.includes(" ")) { setShowSlash(true); setSlashFilter(after); setShowMention(false); return; }
    }
    setShowSlash(false);
    const lastAt = v.lastIndexOf("@");
    if (lastAt >= 0 && (lastAt === 0 || v[lastAt - 1] === " " || v[lastAt - 1] === "\n")) {
      const after = v.slice(lastAt + 1);
      if (!after.includes(" ")) { setShowMention(true); setMentionFilter(after); setShowSlash(false); return; }
    }
    setShowMention(false);
  }, []);

  const insertCommand = (cmd: SlashCommand) => {
    const lastSlash = value.lastIndexOf("/");
    setValue(value.slice(0, lastSlash) + cmd.command + " ");
    setShowSlash(false);
    ref.current?.focus();
  };

  const insertMention = (m: Mention) => {
    const lastAt = value.lastIndexOf("@");
    setValue(value.slice(0, lastAt) + "@" + m.name + " ");
    setShowMention(false);
    ref.current?.focus();
  };

  return (
    <div className="relative border-t border-border bg-card px-4 pb-3 pt-2">
      {/* Slash command dropdown */}
      {showSlash && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-1 rounded-lg border border-border bg-card shadow-lg z-10 overflow-hidden">
          <div className="px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Comandos</div>
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.command}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
              onMouseDown={(e) => { e.preventDefault(); insertCommand(cmd); }}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <i className={cn(cmd.icon, "text-xs")} />
              </span>
              <div>
                <span className="font-medium text-foreground text-sm">{cmd.command}</span>
                <span className="ml-2 text-xs text-muted-foreground">{cmd.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mention dropdown */}
      {showMention && filteredMentions.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-1 rounded-lg border border-border bg-card shadow-lg z-10 overflow-hidden">
          <div className="px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Personas y agentes</div>
          {filteredMentions.map((m) => (
            <button
              key={m.id}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
              onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
            >
              <Avatar size="sm" className={cn("h-6 w-6 text-[10px]", m.initials === "AI" ? "bg-foreground" : "bg-primary")} initials={m.initials} />
              <div>
                <span className="font-medium text-foreground">{m.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{m.role}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-1.5 rounded-lg border border-border bg-background px-3 py-2 transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20">
        <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground shrink-0">
          <i className="fa-solid fa-plus text-xs" />
        </Button>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground min-h-[24px] max-h-[120px]"
          onKeyDown={(e) => { if (e.key === "Escape") { setShowSlash(false); setShowMention(false); } }}
        />
        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground">
            <i className="fa-solid fa-at text-xs" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground">
            <i className="fa-solid fa-paperclip text-xs" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground">
            <i className="fa-solid fa-face-smile text-xs" />
          </Button>
          <Button size="icon-sm" className="h-7 w-7 ml-1" disabled={!value.trim()}>
            <i className="fa-solid fa-arrow-up text-xs" />
          </Button>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-3 px-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">/</kbd> comandos</span>
        <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">@</kbd> mencionar</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MessageBubble — Slack-style flat message with hover toolbar
   ════════════════════════════════════════════════════════════════════════════ */

function MessageBubble({
  msg, onOpenThread, onReply,
}: {
  msg: Message;
  onOpenThread?: (msgId: string) => void;
  onReply?: (msg: Message) => void;
}) {
  const [hovering, setHovering] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>(msg.reactions ?? []);

  const addReaction = (emoji: string) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        return existing.reacted
          ? prev.map((r) => r.emoji === emoji ? { ...r, count: r.count - 1, reacted: false } : r).filter((r) => r.count > 0)
          : prev.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r);
      }
      return [...prev, { emoji, count: 1, reacted: true }];
    });
    setShowEmojiPicker(false);
  };

  if (msg.type === "system") {
    return (
      <div className="flex items-center gap-3 py-2">
        <Separator className="flex-1" />
        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 shrink-0">
          <i className="fa-solid fa-link text-[9px]" /> {msg.text}
        </span>
        <Separator className="flex-1" />
      </div>
    );
  }

  return (
    <div
      className={cn("group relative flex gap-2.5 px-5 py-1.5 -mx-5 transition-colors", hovering && "bg-muted/40")}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setShowEmojiPicker(false); }}
    >
      <Avatar size="sm" className={cn("mt-0.5 shrink-0", AVATAR_BG[msg.avatar] ?? "bg-muted-foreground")} initials={msg.avatar} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-foreground">{msg.sender}</span>
          {msg.agentTag && <Badge variant="muted" className="text-[10px] gap-1 py-0 border-0"><i className="fa-solid fa-robot text-[8px]" /> {msg.agentTag}</Badge>}
          <span className="text-[11px] text-muted-foreground">{msg.time}</span>
        </div>

        {msg.replyTo && (
          <div className="mt-1 flex items-center gap-2 rounded border-l-2 border-primary/30 bg-muted/60 px-2.5 py-1">
            <span className="text-xs font-medium text-muted-foreground">{msg.replyTo.sender}:</span>
            <span className="text-xs text-muted-foreground truncate">{msg.replyTo.text}</span>
          </div>
        )}

        <p className="mt-0.5 text-sm leading-relaxed text-foreground">{msg.text}</p>

        {msg.action && (
          <Card className="mt-2 shadow-none">
            <CardContent className="p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                {msg.action.status === "auto-applied" && <i className="fa-solid fa-circle-check text-success text-[11px]" />}
                {msg.action.status === "pending-approval" && <i className="fa-solid fa-clock text-warning text-[11px]" />}
                {msg.action.status === "info" && <i className="fa-solid fa-circle-info text-primary text-[11px]" />}
                {msg.action.label}
                {msg.action.status === "auto-applied" && <Badge variant="success" className="text-[9px] py-0">Aplicado</Badge>}
                {msg.action.status === "pending-approval" && <Badge variant="warning" className="text-[9px] py-0">Pendiente</Badge>}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{msg.action.body}</p>
              {msg.action.buttons && (
                <div className="flex gap-1.5 mt-1">
                  {msg.action.buttons.map((btn) => (
                    <Button key={btn.label} variant={BTN_MAP[btn.variant]} size="sm" className="h-7 text-xs">{btn.label}</Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {reactions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {reactions.map((r) => (
              <button key={r.emoji} onClick={() => addReaction(r.emoji)} className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors", r.reacted ? "border-primary/30 bg-primary/5 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted")}>
                {r.emoji} <span className="font-medium">{r.count}</span>
              </button>
            ))}
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="inline-flex items-center justify-center rounded-full border border-dashed border-border px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <i className="fa-solid fa-plus text-[9px]" />
            </button>
          </div>
        )}

        {msg.threadCount && msg.threadCount > 0 && onOpenThread && (
          <button onClick={() => onOpenThread(msg.id)} className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <i className="fa-solid fa-message text-[10px]" />
            {msg.threadCount} {msg.threadCount === 1 ? "respuesta" : "respuestas"}
          </button>
        )}
      </div>

      {/* Hover toolbar */}
      {hovering && (
        <div className="absolute -top-3 right-4 flex items-center rounded-md border border-border bg-card shadow-sm z-10">
          <Tooltip content="Reaccionar" side="top">
            <Button variant="ghost" size="icon-sm" className="h-7 w-7 rounded-none rounded-l-md" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <i className="fa-solid fa-face-smile text-xs text-muted-foreground" />
            </Button>
          </Tooltip>
          {onOpenThread && (
            <Tooltip content="Hilo" side="top">
              <Button variant="ghost" size="icon-sm" className="h-7 w-7 rounded-none" onClick={() => onOpenThread(msg.id)}>
                <i className="fa-solid fa-message text-xs text-muted-foreground" />
              </Button>
            </Tooltip>
          )}
          {onReply && (
            <Tooltip content="Responder" side="top">
              <Button variant="ghost" size="icon-sm" className="h-7 w-7 rounded-none" onClick={() => onReply(msg)}>
                <i className="fa-solid fa-reply text-xs text-muted-foreground" />
              </Button>
            </Tooltip>
          )}
          <Tooltip content="Más" side="top">
            <Button variant="ghost" size="icon-sm" className="h-7 w-7 rounded-none rounded-r-md">
              <i className="fa-solid fa-ellipsis text-xs text-muted-foreground" />
            </Button>
          </Tooltip>
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute -top-11 right-4 flex items-center gap-0.5 rounded-lg border border-border bg-card p-1 shadow-lg z-20">
          {EMOJI_PICKER.map((emoji) => (
            <button key={emoji} onClick={() => addReaction(emoji)} className="h-7 w-7 rounded text-sm hover:bg-muted transition-colors">{emoji}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Page Component
   ════════════════════════════════════════════════════════════════════════════ */

export default function InboxPage() {
  const [selectedAgent, setSelectedAgent] = useState("follow-up");
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set(["follow-up", "sales-assistant"]));
  const [threadOpen, setThreadOpen] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  // Call state
  const [activeCallThreadId, setActiveCallThreadId] = useState<string | null>(null);
  const [callMode, setCallMode] = useState<CallMode>("hybrid-quo");

  const startCallFromThread = (threadId: string) => {
    if (CALL_CONTACTS[threadId] && CALL_DEALS[threadId]) {
      setActiveCallThreadId(threadId);
    }
  };

  const toggleAgent = (agentId: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      next.has(agentId) ? next.delete(agentId) : next.add(agentId);
      return next;
    });
  };

  const activeAgent = AGENTS.find((a) => a.id === selectedAgent);
  const activeChannel = selectedChannel ? CLIENT_THREADS.find((t) => t.id === selectedChannel) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Nav Rail ─────────────────────────────────────────────── */}
      <nav className="flex w-[52px] min-w-[52px] flex-col items-center gap-0.5 bg-sidebar py-3" aria-label="Navegación principal">
        <div className="mb-4 grid h-8 w-8 place-content-center rounded-lg bg-primary text-xs font-bold text-white">AI</div>
        {NAV_ITEMS.map((item) => (
          <Tooltip key={item.label} content={item.label} side="right">
            <Button variant="ghost" size="icon-sm" className={cn("relative h-9 w-9 text-sidebar-foreground", item.active ? "bg-white/10 text-white" : "hover:bg-white/[.06]")}>
              <i className={cn(item.icon, "text-sm")} />
              {item.badge && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">{item.badge}</span>}
            </Button>
          </Tooltip>
        ))}
        <div className="flex-1" />
        <Tooltip content={callMode === "hybrid-quo" ? "Modo: Quo → Teléfono" : callMode === "hybrid-device" ? "Modo: Dispositivo BT" : "Modo: VoIP"} side="right">
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn("h-9 w-9 text-sidebar-foreground", callMode !== "voip" ? "text-success" : "")}
            onClick={() => setCallMode((m) => m === "voip" ? "hybrid-quo" : m === "hybrid-quo" ? "hybrid-device" : "voip")}
          >
            <i className={cn("text-sm", callMode === "hybrid-device" ? "fa-solid fa-headset" : callMode === "hybrid-quo" ? "fa-solid fa-mobile-screen" : "fa-solid fa-phone")} />
          </Button>
        </Tooltip>
        <Tooltip content="Miriam Reyes" side="right">
          <Avatar size="sm" className="bg-primary/80 text-[11px]" initials="MR" />
        </Tooltip>
      </nav>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="flex w-[260px] min-w-[260px] flex-col border-r border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-sm font-semibold text-foreground">AI Sales OS</h1>
          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground">
            <i className="fa-solid fa-pen-to-square text-xs" />
          </Button>
        </div>
        <Separator />
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 rounded-md border border-transparent bg-muted px-2.5 py-1.5 text-sm transition-colors focus-within:border-ring focus-within:bg-background">
            <i className="fa-solid fa-magnifying-glass text-[11px] text-muted-foreground" />
            <input type="text" placeholder="Buscar..." className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {AGENTS.map((agent) => {
            const threads = CLIENT_THREADS.filter((t) => t.agentId === agent.id);
            const isExpanded = expandedAgents.has(agent.id);
            const isSelected = selectedAgent === agent.id && !selectedChannel;

            return (
              <div key={agent.id}>
                <div className="flex items-center px-3 py-0.5">
                  {threads.length > 0 && (
                    <button onClick={() => toggleAgent(agent.id)} className="mr-1 flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground">
                      <i className={cn("fa-solid fa-chevron-right text-[9px] transition-transform", isExpanded && "rotate-90")} />
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedAgent(agent.id); setSelectedChannel(null); setThreadOpen(null); }}
                    className={cn("flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors", isSelected ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}
                  >
                    <i className={cn(agent.icon, "text-xs w-4 text-center")} />
                    <span className="truncate">{agent.name}</span>
                    {agent.unread > 0 && <Badge className="ml-auto h-5 min-w-[20px] px-1.5 text-[10px]">{agent.unread}</Badge>}
                  </button>
                </div>

                {isExpanded && threads.map((thread) => {
                  const isActive = selectedChannel === thread.id;
                  const hasContact = !!CALL_CONTACTS[thread.id];
                  return (
                    <div key={thread.id} className="flex items-center group">
                      <button
                        onClick={() => { setSelectedChannel(thread.id); setSelectedAgent(thread.agentId); setThreadOpen(null); }}
                        className={cn("flex flex-1 items-center gap-2 py-1 pl-12 pr-1 text-left transition-colors min-w-0", isActive ? "bg-muted" : "hover:bg-muted/40")}
                      >
                        <Avatar size="sm" className={cn("h-6 w-6 text-[10px] shrink-0", AVATAR_BG[thread.initials] ?? "bg-muted-foreground")} initials={thread.initials} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("truncate text-[13px]", thread.unread ? "font-semibold text-foreground" : "text-muted-foreground")}>{thread.clientName}</span>
                            {thread.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                          </div>
                          <span className="block truncate text-[11px] text-muted-foreground">{thread.preview}</span>
                        </div>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{thread.time}</span>
                      </button>
                      {hasContact && (
                        <Tooltip content="Llamar" side="right">
                          <button
                            onClick={(e) => { e.stopPropagation(); startCallFromThread(thread.id); }}
                            className="shrink-0 h-6 w-6 mr-2 rounded flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-success hover:bg-[var(--success-100)] transition-all"
                          >
                            <i className="fa-solid fa-phone text-[10px]" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Main Chat ────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-border bg-card px-5 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeChannel ? (
              <>
                <Avatar size="sm" className={AVATAR_BG[activeChannel.initials] ?? "bg-muted-foreground"} initials={activeChannel.initials} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{activeChannel.clientName}</span>
                    <Badge variant={STAGE_BADGE[activeChannel.stage] ?? "muted"} className="text-[10px] py-0">{STAGE_LABELS[activeChannel.stage]}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{activeChannel.company}</span>
                    <span>·</span>
                    <Badge variant={SEGMENT_BADGE[activeChannel.segment]} className="text-[9px] py-0">{SEGMENT_LABELS[activeChannel.segment]}</Badge>
                    {CALL_CONTACTS[activeChannel.id] && (
                      <>
                        <span>·</span>
                        <span className="font-mono">{CALL_CONTACTS[activeChannel.id]!.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <i className={cn(activeAgent?.icon ?? "fa-solid fa-robot", "text-sm")} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">{activeAgent?.name}</span>
                  <p className="text-xs text-muted-foreground">{activeAgent?.description}</p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {activeChannel && (
              <Tooltip content={callMode === "hybrid-quo" ? "Llamar (Quo → tu teléfono)" : callMode === "hybrid-device" ? "Llamar (dispositivo BT)" : "Llamar (VoIP)"} side="bottom">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-success hover:bg-[var(--success-100)]"
                  onClick={() => startCallFromThread(activeChannel.id)}
                >
                  <i className="fa-solid fa-phone text-xs" />
                </Button>
              </Tooltip>
            )}
            <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground"><i className="fa-solid fa-thumbtack text-xs" /></Button>
            <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground"><i className="fa-solid fa-ellipsis-vertical text-xs" /></Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="flex items-center gap-3 px-5 mb-3">
            <Separator className="flex-1" />
            <span className="text-[11px] font-medium text-muted-foreground px-2">Hoy</span>
            <Separator className="flex-1" />
          </div>
          <div className="flex flex-col gap-px">
            {MESSAGES.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} onOpenThread={(id) => setThreadOpen(id === threadOpen ? null : id)} onReply={() => {}} />
            ))}
          </div>
        </div>

        <Composer />
      </main>

      {/* ── Thread Panel (Slack-style) ───────────────────────────── */}
      {threadOpen && (
        <aside className="flex w-[380px] min-w-[380px] flex-col border-l border-border bg-card">
          <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Hilo</h3>
              <p className="text-xs text-muted-foreground">{THREAD_MESSAGES.length} respuestas</p>
            </div>
            <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground" onClick={() => setThreadOpen(null)}>
              <i className="fa-solid fa-xmark text-xs" />
            </Button>
          </header>

          <div className="border-b border-border px-1 py-3">
            {(() => {
              const parent = MESSAGES.find((m) => m.id === threadOpen);
              if (!parent) return null;
              return <MessageBubble msg={parent} />;
            })()}
          </div>

          <div className="flex-1 overflow-y-auto py-3">
            <div className="flex items-center gap-3 px-4 mb-3">
              <Separator className="flex-1" />
              <span className="text-[11px] text-muted-foreground">{THREAD_MESSAGES.length} respuestas</span>
              <Separator className="flex-1" />
            </div>
            <div className="flex flex-col gap-px">
              {THREAD_MESSAGES.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} onReply={() => {}} />
              ))}
            </div>
          </div>

          <Composer placeholder="Responder en hilo..." />
        </aside>
      )}

      {/* ── Call Panel Overlay ───────────────────────────────────── */}
      {activeCallThreadId && CALL_CONTACTS[activeCallThreadId] && CALL_DEALS[activeCallThreadId] && (
        <CallPanel
          contact={CALL_CONTACTS[activeCallThreadId]!}
          deal={CALL_DEALS[activeCallThreadId]!}
          history={CALL_HISTORY[activeCallThreadId] ?? []}
          talkingPoints={CALL_TALKING_POINTS[activeCallThreadId] ?? []}
          quickActions={CALL_QUICK_ACTIONS}
          callMode={callMode}
          audioDevice={callMode === "hybrid-device" ? "Jabra Speak 750" : undefined}
          onClose={() => setActiveCallThreadId(null)}
          onQuickAction={(id) => console.log("Quick action:", id)}
        />
      )}
    </div>
  );
}
