"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  CallPanel,
  type CallContact,
  type CallDeal,
  type CallHistoryItem,
  type TalkingPoint,
  type QuickAction,
  type CallMode,
} from "@/components/call/CallPanel";

/* ════════════════════════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════════════════════════ */

type TaskType = "call" | "quote" | "meeting" | "task";
type Priority = "high" | "medium" | "low";
type AgentSource = "follow-up" | "sales-assistant" | "supervisor" | "reporting" | "manual";
type FilterKey = "all" | "call" | "quote" | "meeting" | "ai";
type DateGroup = "today" | "tomorrow" | "mar12" | "mar16" | "later";

interface TaskContact {
  name: string;
  initials: string;
  company: string;
  phone?: string;
  avatarColor: string;
}

interface Task {
  id: string;
  type: TaskType;
  title: string;
  contact?: TaskContact;
  dealValue?: string;
  dueTime?: string;
  dateGroup: DateGroup;
  priority: Priority;
  source: AgentSource;
  done: boolean;
}

/* ════════════════════════════════════════════════════════════════════════════
   Static data
   ════════════════════════════════════════════════════════════════════════════ */

const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: "Hoy · lunes 10 de marzo",
  tomorrow: "Mañana · martes 11 de marzo",
  mar12: "Miércoles 12 de marzo",
  mar16: "Lunes 16 de marzo",
  later: "Más adelante",
};

const TASK_TYPE_ICON: Record<TaskType, string> = {
  call: "fa-phone",
  quote: "fa-file-invoice-dollar",
  meeting: "fa-calendar-days",
  task: "fa-circle-check",
};

const TASK_TYPE_COLOR: Record<TaskType, string> = {
  call: "text-blue-600 bg-blue-50",
  quote: "text-amber-600 bg-amber-50",
  meeting: "text-violet-600 bg-violet-50",
  task: "text-emerald-600 bg-emerald-50",
};

const SOURCE_LABELS: Record<AgentSource, string | null> = {
  "follow-up": "Seguimiento",
  "sales-assistant": "Asistente",
  supervisor: "Supervisor",
  reporting: "Reportes",
  manual: null,
};

const PRIORITY_DOT: Record<Priority, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-muted-foreground/40",
};

const NAV_ITEMS = [
  { icon: "fa-solid fa-inbox", label: "Inbox", href: "/", badge: 3 },
  { icon: "fa-solid fa-dollar-sign", label: "Deals" },
  { icon: "fa-solid fa-circle-check", label: "Tareas", href: "/tasks", active: true },
  { icon: "fa-solid fa-calendar-days", label: "Calendario" },
  { icon: "fa-solid fa-chart-column", label: "Reportes" },
  { icon: "fa-solid fa-microphone", label: "Transcripción", href: "/transcribe" },
];

const INITIAL_TASKS: Task[] = [
  /* ── Hoy ─────────────────────────────────────────────────────────────── */
  {
    id: "tk1",
    type: "call",
    title: "Llamar a Carlos Mendoza — cotización sin respuesta 6 días",
    contact: { name: "Carlos Mendoza", initials: "CM", company: "Cervecería Toluca", phone: "722-555-1234", avatarColor: "bg-blue-100 text-blue-700" },
    dealValue: "$285,000 MXN",
    dueTime: "10:00",
    dateGroup: "today",
    priority: "high",
    source: "follow-up",
    done: false,
  },
  {
    id: "tk2",
    type: "call",
    title: "Contactar a Ana Torres — SLA Tiburones en riesgo",
    contact: { name: "Ana Torres", initials: "AT", company: "Plásticos Industriales", phone: "722-555-5678", avatarColor: "bg-amber-100 text-amber-700" },
    dealValue: "$180,000 MXN",
    dueTime: "11:30",
    dateGroup: "today",
    priority: "high",
    source: "follow-up",
    done: false,
  },
  {
    id: "tk3",
    type: "quote",
    title: "Revisar y ajustar cotización audiometrías 2026",
    contact: { name: "Carlos Mendoza", initials: "CM", company: "Cervecería Toluca", avatarColor: "bg-blue-100 text-blue-700" },
    dealValue: "$42,000 MXN",
    dateGroup: "today",
    priority: "medium",
    source: "sales-assistant",
    done: false,
  },
  {
    id: "tk4",
    type: "task",
    title: "Actualizar etapa pipeline: Descubrimiento → Cotización",
    contact: { name: "Roberto Juárez", initials: "RJ", company: "Metalúrgica del Valle", avatarColor: "bg-emerald-100 text-emerald-700" },
    dealValue: "$65,000 MXN",
    dateGroup: "today",
    priority: "medium",
    source: "supervisor",
    done: true,
  },
  {
    id: "tk5",
    type: "meeting",
    title: "Preparar propuesta servicio en sitio para presentar",
    dateGroup: "today",
    priority: "low",
    source: "manual",
    done: false,
  },

  /* ── Mañana ───────────────────────────────────────────────────────────── */
  {
    id: "tk6",
    type: "call",
    title: "Reactivar a Patricia Sánchez — 47 días sin contacto",
    contact: { name: "Patricia Sánchez", initials: "PS", company: "Grupo Farmacéutico GT", phone: "722-555-7890", avatarColor: "bg-violet-100 text-violet-700" },
    dealValue: "$420,000 MXN",
    dueTime: "09:00",
    dateGroup: "tomorrow",
    priority: "high",
    source: "supervisor",
    done: false,
  },
  {
    id: "tk7",
    type: "quote",
    title: "Enviar cotización actualizada — unidad móvil en sitio",
    contact: { name: "Ana Torres", initials: "AT", company: "Plásticos Industriales", avatarColor: "bg-amber-100 text-amber-700" },
    dealValue: "$180,000 MXN",
    dueTime: "12:00",
    dateGroup: "tomorrow",
    priority: "medium",
    source: "sales-assistant",
    done: false,
  },

  /* ── Miércoles 12 ─────────────────────────────────────────────────────── */
  {
    id: "tk8",
    type: "meeting",
    title: "Reunión de seguimiento trimestral — Cervecería Toluca",
    contact: { name: "Carlos Mendoza", initials: "CM", company: "Cervecería Toluca", avatarColor: "bg-blue-100 text-blue-700" },
    dealValue: "$285,000 MXN",
    dueTime: "10:00",
    dateGroup: "mar12",
    priority: "high",
    source: "follow-up",
    done: false,
  },
  {
    id: "tk9",
    type: "task",
    title: "Revisar reporte de pipeline semanal",
    dateGroup: "mar12",
    priority: "low",
    source: "reporting",
    done: false,
  },

  /* ── Lunes 16 ─────────────────────────────────────────────────────────── */
  {
    id: "tk10",
    type: "call",
    title: "Llamar a Roberto Juárez — exámenes nuevo ingreso",
    contact: { name: "Roberto Juárez", initials: "RJ", company: "Metalúrgica del Valle", phone: "722-555-3456", avatarColor: "bg-emerald-100 text-emerald-700" },
    dealValue: "$65,000 MXN",
    dueTime: "16:00",
    dateGroup: "mar16",
    priority: "medium",
    source: "manual",
    done: false,
  },
  {
    id: "tk11",
    type: "meeting",
    title: "Demo solución unidad móvil — nueva expansión",
    contact: { name: "Patricia Sánchez", initials: "PS", company: "Grupo Farmacéutico GT", avatarColor: "bg-violet-100 text-violet-700" },
    dealValue: "$420,000 MXN",
    dateGroup: "mar16",
    priority: "medium",
    source: "supervisor",
    done: false,
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   Call data — mapped to callable tasks
   ════════════════════════════════════════════════════════════════════════════ */

const CALL_CONTACTS: Record<string, CallContact> = {
  tk1: { id: "tk1", name: "Carlos Mendoza", initials: "CM", role: "Gerente de Compras", company: "Cervecería Toluca", phone: "722-555-1234", email: "c.mendoza@cervtoluca.mx", segment: "ballenas" },
  tk2: { id: "tk2", name: "Ana Torres", initials: "AT", role: "Directora de Seguridad", company: "Plásticos Industriales", phone: "722-555-5678", email: "a.torres@plasticos.mx", segment: "tiburones" },
  tk6: { id: "tk6", name: "Patricia Sánchez", initials: "PS", role: "Directora Médica", company: "Grupo Farmacéutico GT", phone: "722-555-7890", email: "p.sanchez@gfgt.mx", segment: "ballenas" },
  tk10: { id: "tk10", name: "Roberto Juárez", initials: "RJ", role: "Jefe de RH", company: "Metalúrgica del Valle", phone: "722-555-3456", segment: "atunes" },
};

const CALL_DEALS: Record<string, CallDeal> = {
  tk1: { id: "d1", name: "Exámenes anuales — Cervecería Toluca", stage: "Cotización enviada", stageNumber: 5, value: "$285,000 MXN", daysSinceActivity: 6 },
  tk2: { id: "d2", name: "Campaña ocupacional — Plásticos Industriales", stage: "Seguimiento", stageNumber: 6, value: "$180,000 MXN", daysSinceActivity: 4 },
  tk6: { id: "d5", name: "Reactivación — Grupo Farmacéutico GT", stage: "Primer contacto", stageNumber: 2, value: "$420,000 MXN", daysSinceActivity: 47 },
  tk10: { id: "d4", name: "Exámenes nuevo ingreso — Metalúrgica", stage: "Descubrimiento", stageNumber: 3, value: "$65,000 MXN", daysSinceActivity: 1 },
};

const CALL_HISTORY: Record<string, CallHistoryItem[]> = {
  tk1: [
    { date: "3 Mar", type: "quote", summary: "Cotización enviada — $285,000 MXN" },
    { date: "28 Feb", type: "call", summary: "Esperan aprobación de presupuesto" },
  ],
  tk2: [
    { date: "5 Mar", type: "call", summary: "Seguimiento — esperan resultado de auditoría" },
    { date: "1 Mar", type: "quote", summary: "Cotización enviada — $180,000 MXN" },
  ],
  tk6: [
    { date: "20 Ene", type: "call", summary: "Última llamada — 47 días sin contacto" },
  ],
  tk10: [
    { date: "8 Mar", type: "call", summary: "Primer contacto — interés en paquete completo" },
  ],
};

const CALL_TALKING_POINTS: Record<string, TalkingPoint[]> = {
  tk1: [
    { priority: "high", text: "6 días sin actividad — cotización $285K en riesgo" },
    { priority: "high", text: "Decisión de RH pendiente por presupuesto" },
    { priority: "medium", text: "200 empleados, exámenes vencen en abril" },
  ],
  tk2: [
    { priority: "high", text: "SLA Tiburones en riesgo — 4 días sin actividad" },
    { priority: "medium", text: "Pendiente resultado de auditoría interna" },
  ],
  tk6: [
    { priority: "high", text: "47 días sin contacto — reactivación urgente" },
    { priority: "medium", text: "Historial: $380K comprado el año pasado" },
    { priority: "low", text: "Posible expansión a 3 sedes adicionales" },
  ],
  tk10: [
    { priority: "medium", text: "Nuevo ingreso de 80 empleados en abril" },
    { priority: "low", text: "Precio competitivo clave para decisión" },
  ],
};

const CALL_QUICK_ACTIONS: QuickAction[] = [
  { id: "schedule", label: "Agendar seguimiento", icon: "fa-calendar-plus" },
  { id: "quote", label: "Preparar cotización", icon: "fa-file-invoice-dollar" },
  { id: "update_stage", label: "Actualizar etapa", icon: "fa-arrow-right" },
  { id: "create_task", label: "Crear tarea", icon: "fa-circle-plus" },
];

/* ════════════════════════════════════════════════════════════════════════════
   Task row component
   ════════════════════════════════════════════════════════════════════════════ */

interface TaskRowProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCall: (taskId: string) => void;
}

function TaskRow({ task, onToggle, onDelete, onCall }: TaskRowProps) {
  const [hovered, setHovered] = useState(false);
  const canCall = task.type === "call" && !!CALL_CONTACTS[task.id];
  const sourceLabel = SOURCE_LABELS[task.source];

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors cursor-default",
        hovered ? "bg-muted/50" : "bg-transparent",
        task.done && "opacity-50",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? "Marcar pendiente" : "Marcar completada"}
        className="shrink-0 flex items-center justify-center h-4 w-4 rounded border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          borderColor: task.done ? "var(--primary)" : "hsl(var(--border))",
          background: task.done ? "hsl(var(--primary))" : "transparent",
        }}
      >
        {task.done && <i className="fa-solid fa-check text-white" style={{ fontSize: 8 }} />}
      </button>

      {/* Type icon */}
      <span
        className={cn(
          "shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-[11px]",
          TASK_TYPE_COLOR[task.type],
        )}
      >
        <i className={cn("fa-solid", TASK_TYPE_ICON[task.type])} />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        {/* Title */}
        <span
          className={cn(
            "text-sm text-foreground truncate",
            task.done && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </span>

        {/* Contact chip */}
        {task.contact && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <Avatar
              size="sm"
              className={cn("h-5 w-5 text-[9px]", task.contact.avatarColor)}
              initials={task.contact.initials}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {task.contact.name}
              <span className="text-muted-foreground/50 mx-1">·</span>
              {task.contact.company}
            </span>
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Deal value */}
        {task.dealValue && !task.done && (
          <span className="hidden lg:block text-xs text-muted-foreground font-mono tabular-nums">
            {task.dealValue}
          </span>
        )}

        {/* Agent source badge */}
        {sourceLabel && (
          <Badge variant="muted" className="hidden md:inline-flex text-[10px] py-0 shrink-0">
            {sourceLabel}
          </Badge>
        )}

        {/* Priority dot */}
        <Tooltip content={task.priority === "high" ? "Alta prioridad" : task.priority === "medium" ? "Media" : "Baja"} side="top">
          <span className={cn("h-2 w-2 rounded-full shrink-0", PRIORITY_DOT[task.priority])} />
        </Tooltip>

        {/* Due time */}
        {task.dueTime && (
          <span className="text-[11px] text-muted-foreground font-mono tabular-nums w-[38px] text-right">
            {task.dueTime}
          </span>
        )}

        {/* Action button */}
        <div className={cn("transition-opacity", hovered || canCall ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
          {canCall ? (
            <Button
              size="sm"
              className="h-7 px-3 text-xs font-medium gap-1.5"
              onClick={() => onCall(task.id)}
            >
              <i className="fa-solid fa-phone text-[10px]" />
              Llamar
            </Button>
          ) : task.type === "quote" ? (
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
              Cotización
            </Button>
          ) : task.type === "meeting" ? (
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <i className="fa-solid fa-calendar-plus text-[10px]" />
              Agendar
            </Button>
          ) : (
            <div className="w-[60px]" />
          )}
        </div>

        {/* Delete (appears on hover) */}
        <Tooltip content="Eliminar" side="top">
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-6 w-6 flex items-center justify-center rounded"
            onClick={() => onDelete(task.id)}
          >
            <i className="fa-solid fa-xmark text-[11px]" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Add task row
   ════════════════════════════════════════════════════════════════════════════ */

interface AddTaskRowProps {
  dateGroup: DateGroup;
  onAdd: (title: string, group: DateGroup) => void;
}

function AddTaskRow({ dateGroup, onAdd }: AddTaskRowProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    if (value.trim()) {
      onAdd(value.trim(), dateGroup);
      setValue("");
    }
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors w-full"
      >
        <i className="fa-solid fa-plus text-[10px]" />
        Agregar tarea
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="h-4 w-4 rounded border border-border shrink-0" />
      <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-[11px] text-emerald-600 bg-emerald-50">
        <i className="fa-solid fa-circle-check" />
      </span>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Nombre de la tarea..."
        className="flex-1 h-7 text-sm border-none shadow-none focus-visible:ring-0 px-0 bg-transparent"
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setOpen(false); setValue(""); }
        }}
        onBlur={commit}
      />
      <span className="text-[10px] text-muted-foreground/50">↵ para guardar</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Date group
   ════════════════════════════════════════════════════════════════════════════ */

interface DateGroupProps {
  group: DateGroup;
  tasks: Task[];
  showAdd: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCall: (taskId: string) => void;
  onAdd: (title: string, group: DateGroup) => void;
}

function DateGroupSection({ group, tasks, showAdd, onToggle, onDelete, onCall, onAdd }: DateGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="mb-1">
      {/* Group header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2 group/header"
      >
        <i
          className={cn(
            "fa-solid fa-chevron-right text-[9px] text-muted-foreground transition-transform",
            !collapsed && "rotate-90",
          )}
        />
        <span className="text-[12px] font-semibold text-muted-foreground">{DATE_GROUP_LABELS[group]}</span>
        <span className="text-[11px] text-muted-foreground/50 ml-1">
          {tasks.length > 0 && `${done}/${tasks.length}`}
        </span>
      </button>

      {/* Tasks */}
      {!collapsed && (
        <>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onCall={onCall}
            />
          ))}
          {showAdd && <AddTaskRow dateGroup={group} onAdd={onAdd} />}
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Page
   ════════════════════════════════════════════════════════════════════════════ */

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "call", label: "Llamadas" },
  { key: "quote", label: "Cotizaciones" },
  { key: "meeting", label: "Reuniones" },
  { key: "ai", label: "Creadas por IA" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callMode] = useState<CallMode>("mic-listen");
  const [showDone, setShowDone] = useState(false);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addTask = useCallback((title: string, group: DateGroup) => {
    const newTask: Task = {
      id: `tk-${Date.now()}`,
      type: "task",
      title,
      dateGroup: group,
      priority: "medium",
      source: "manual",
      done: false,
    };
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const openCall = useCallback((taskId: string) => {
    setActiveCallId(taskId);
  }, []);

  /* ── Filter & group ─────────────────────────────────────────────────── */
  const filtered = tasks.filter((t) => {
    if (!showDone && t.done) return false;
    if (filter === "all") return true;
    if (filter === "ai") return t.source !== "manual";
    return t.type === filter;
  });

  const groups: DateGroup[] = ["today", "tomorrow", "mar12", "mar16", "later"];
  const grouped = groups.reduce<Record<DateGroup, Task[]>>((acc, g) => {
    acc[g] = filtered.filter((t) => t.dateGroup === g);
    return acc;
  }, { today: [], tomorrow: [], mar12: [], mar16: [], later: [] });

  const totalToday = tasks.filter((t) => t.dateGroup === "today").length;
  const doneToday = tasks.filter((t) => t.dateGroup === "today" && t.done).length;
  const totalAll = tasks.filter((t) => !t.done).length;

  /* ── Call data ──────────────────────────────────────────────────────── */
  const callContact = activeCallId ? CALL_CONTACTS[activeCallId] : null;
  const callDeal = activeCallId ? CALL_DEALS[activeCallId] : null;
  const callHistory = activeCallId ? (CALL_HISTORY[activeCallId] ?? []) : [];
  const callTalkingPoints = activeCallId ? (CALL_TALKING_POINTS[activeCallId] ?? []) : [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Nav rail ───────────────────────────────────────────────── */}
      <nav
        className="flex w-[52px] min-w-[52px] flex-col items-center gap-0.5 bg-sidebar py-3"
        aria-label="Navegación principal"
      >
        <div className="mb-4 grid h-8 w-8 place-content-center rounded-lg bg-primary text-xs font-bold text-white select-none">
          AI
        </div>
        {NAV_ITEMS.map((item) => (
          <Tooltip key={item.label} content={item.label} side="right">
            {item.href ? (
              <a
                href={item.href}
                className={cn(
                  "relative inline-flex items-center justify-center h-9 w-9 rounded-md transition-colors",
                  item.active
                    ? "bg-white/10 text-white"
                    : "text-sidebar-foreground hover:bg-white/[.06]",
                )}
              >
                <i className={cn(item.icon, "text-sm")} />
                {item.badge && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                )}
              </a>
            ) : (
              <button
                className={cn(
                  "relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                  "text-sidebar-foreground hover:bg-white/[.06]",
                )}
              >
                <i className={cn(item.icon, "text-sm")} />
              </button>
            )}
          </Tooltip>
        ))}
        <div className="flex-1" />
        <Tooltip content="Miriam Reyes" side="right">
          <Avatar size="sm" className="bg-white/10 text-white text-[10px]" initials="MR" />
        </Tooltip>
      </nav>

      {/* ── Main content ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top bar ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-card shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Tareas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {doneToday}/{totalToday} completadas hoy
              <span className="mx-2 text-border">·</span>
              {totalAll} pendientes en total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDone((v) => !v)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-md border transition-colors",
                showDone
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {showDone ? "Ocultar completadas" : "Mostrar completadas"}
            </button>
            <Button
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => {
                const title = window.prompt("Nombre de la tarea:");
                if (title?.trim()) addTask(title.trim(), "today");
              }}
            >
              <i className="fa-solid fa-plus text-xs" />
              Nueva tarea
            </Button>
          </div>
        </div>

        {/* ── Filters ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-8 py-3 border-b border-border bg-card shrink-0">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {f.label}
              {f.key !== "all" && (
                <span className={cn(
                  "text-[10px] ml-0.5",
                  filter === f.key ? "text-background/60" : "text-muted-foreground/50",
                )}>
                  {f.key === "ai"
                    ? tasks.filter((t) => t.source !== "manual" && !t.done).length
                    : tasks.filter((t) => t.type === f.key && !t.done).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Task list ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-4 px-4">
            {groups.map((group) => {
              const groupTasks = grouped[group];
              if (groupTasks.length === 0 && group !== "today") return null;
              return (
                <DateGroupSection
                  key={group}
                  group={group}
                  tasks={groupTasks}
                  showAdd={group === "today" || group === "tomorrow"}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onCall={openCall}
                  onAdd={addTask}
                />
              );
            })}

            {/* Empty state */}
            {Object.values(grouped).every((g) => g.length === 0) && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <i className="fa-solid fa-circle-check text-muted-foreground text-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Sin tareas</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {filter === "all" ? "Estás al día. Los agentes crearán nuevas tareas automáticamente." : `No hay tareas del tipo seleccionado.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Call panel overlay ─────────────────────────────────────── */}
      {activeCallId && callContact && callDeal && (
        <CallPanel
          contact={callContact}
          deal={callDeal}
          history={callHistory}
          talkingPoints={callTalkingPoints}
          quickActions={CALL_QUICK_ACTIONS}
          callMode={callMode}
          onClose={() => setActiveCallId(null)}
          onQuickAction={(actionId) => {
            if (actionId === "create_task") {
              const title = window.prompt("Nombre de la tarea:");
              if (title?.trim()) addTask(title.trim(), "today");
            }
          }}
        />
      )}
    </div>
  );
}
