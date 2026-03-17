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
  role: "primary" | "specialist";
}

interface ClientThread {
  id: string;
  clientName: string;
  company: string;
  initials: string;
  segment: Segment;
  stage: Stage;
  preview: string;
  time: string;
  unread: boolean;
  category: "sla-risk" | "hot-deal" | "new" | "active";
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

interface MainRouteCard {
  id: string;
  title: string;
  summary: string;
  agentId: string;
  agentLabel: string;
  threadId: string;
  status: string;
}

/* ════════════════════════════════════════════════════════════════════════════
   Mock Data
   ════════════════════════════════════════════════════════════════════════════ */

const AGENTS: Agent[] = [
  { id: "gdt-main", name: "GDT", icon: "fa-solid fa-sparkles", description: "Entrada principal. Entiende, decide y redirige.", unread: 3, role: "primary" },
  { id: "follow-up", name: "Seguimiento", icon: "fa-solid fa-bell", description: "Tratos estancados y seguimientos", unread: 2, role: "specialist" },
  { id: "sales-assistant", name: "Asistente Ventas", icon: "fa-solid fa-handshake", description: "Borradores y resúmenes", unread: 1, role: "specialist" },
  { id: "supervisor", name: "Supervisor", icon: "fa-solid fa-eye", description: "Pipeline y riesgos", unread: 0, role: "specialist" },
  { id: "reporting", name: "Reportes", icon: "fa-solid fa-chart-pie", description: "Reportes semanales", unread: 0, role: "specialist" },
];

const CLIENT_THREADS: ClientThread[] = [
  { id: "t1", clientName: "Cervecería Toluca", company: "Cervecería", initials: "CT", segment: "ballenas", stage: "cotización_enviada", preview: "Cotización $285K + seguimiento de audiometrías — 6 días sin actividad", time: "10:32", unread: true, category: "sla-risk" },
  { id: "t2", clientName: "Plásticos Industriales", company: "Manufactura", initials: "PI", segment: "tiburones", stage: "seguimiento", preview: "Campaña ocupacional $180K — Esperan auditoría interna", time: "09:15", unread: true, category: "sla-risk" },
  { id: "t3", clientName: "Metalúrgica del Valle", company: "Manufactura", initials: "MV", segment: "atunes", stage: "descubrimiento", preview: "45 exámenes nuevas contrataciones — Propuesta 3 opciones lista", time: "Hoy", unread: false, category: "hot-deal" },
  { id: "t4", clientName: "Grupo Farmacéutico GT", company: "Farmacéutica", initials: "GF", segment: "ballenas", stage: "primer_contacto", preview: "Reactivación oportunidad $420K — Asignado a Miriam", time: "08:00", unread: false, category: "hot-deal" },
  { id: "t5", clientName: "Tecnológica Avanzada", company: "IT", initials: "TA", segment: "truchas", stage: "prospecto", preview: "Nueva oportunidad en exploración — Primera reunión pendiente", time: "Ayer", unread: false, category: "new" },
];

// Unified client messages - all agents participate in one chat per client
const CLIENT_MESSAGES: Record<string, Message[]> = {
  t1: [
    {
      id: "t1-m1", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "08:16",
      text: "Contexto: Cervecería Toluca (Ballena) — 6 días sin actividad. Deal $285K en Cotización Audiometrías Enviada.",
      agentTag: "Seguimiento",
    },
    {
      id: "t1-m2", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "08:17",
      text: "Creé tarea de seguimiento para llamada mañana 10:00 AM. SLA en límite.",
      action: { label: "Tarea creada", body: "Seguimiento: Llamar a Carlos Mendoza. Cotización $285K en espera de aprobación presupuestaria.", status: "auto-applied" },
      agentTag: "Seguimiento",
    },
    {
      id: "t1-m3", sender: "Asistente Ventas", avatar: "AI", type: "agent", time: "10:22",
      text: "Cotización de audiometrías revisada: $42,000 MXN. Borrador de email preparado.",
      action: { label: "Borrador de correo listo", body: "Hola Carlos,\n\nAdjunto cotización para exámenes audiométricos. Vigencia: 30 días.\n\n¿Confirmamos?", status: "pending-approval", buttons: [{ label: "Enviar", variant: "primary" }] },
      agentTag: "Ventas",
    },
    {
      id: "t1-m4", sender: "Tú", avatar: "MR", type: "user", time: "10:25",
      text: "Bien. Hoy llamo a Carlos primero para saber status presupuesto.",
    },
  ],

  t2: [
    {
      id: "t2-m1", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "09:15",
      text: "Alerta: Plásticos Industriales (Tiburón) — 4 días esperando respuesta. SLA en riesgo.",
      agentTag: "Seguimiento",
    },
    {
      id: "t2-m2", sender: "Supervisor", avatar: "SV", type: "agent", time: "09:30",
      text: "Deal en riesgo flagged. Ana está trabajando auditoría interna. Recomiendo presión suave hoy.",
      agentTag: "Supervisor",
    },
    {
      id: "t2-m3", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "09:40",
      text: "Creé recordatorio urgente. Campaña ocupacional $180K. Si no responden hoy escalamos a directora.",
      action: { label: "Recordatorio urgente", body: "Ana Torres: ¿Status de auditoría? Necesitamos avanzar para cerrar este mes.", status: "auto-applied" },
      agentTag: "Seguimiento",
    },
    {
      id: "t2-m4", sender: "Tú", avatar: "MR", type: "user", time: "10:00",
      text: "Perfecto. Yo le envío un mensaje después de comer.",
    },
  ],

  t3: [
    {
      id: "t3-m1", sender: "Asistente Ventas", avatar: "AI", type: "agent", time: "Ayer 14:30",
      text: "Resumen de tu llamada con Roberto (Jefe de RH): 45 nuevas contrataciones, presupuesto confirmado.",
      agentTag: "Ventas",
      action: { label: "Resumen de llamada", body: "Empresa: Metalúrgica del Valle\nContacto: Roberto Juárez\nNecesidad: 45 exámenes entrada\nPresupuesto: Aprobado\nSiguiente: Propuesta 3 opciones", status: "auto-applied" },
    },
    {
      id: "t3-m2", sender: "Asistente Ventas", avatar: "AI", type: "agent", time: "15:00",
      text: "Preparé 3 propuestas: Básico $2K, Estándar $4K (recomendado), Premium $6K. Listas para revisar.",
      agentTag: "Ventas",
      reactions: [{ emoji: "⚡", count: 1, reacted: true }],
    },
    {
      id: "t3-m3", sender: "Tú", avatar: "MR", type: "user", time: "16:00",
      text: "Envía Estándar con opción de upgrade a Premium.",
    },
    {
      id: "t3-m4", sender: "Asistente Ventas", avatar: "AI", type: "agent", time: "16:05",
      text: "Propuesta Estándar enviada. ETA de respuesta: 2-3 días.",
      agentTag: "Ventas",
      reactions: [{ emoji: "✅", count: 1, reacted: true }],
    },
  ],

  t4: [
    {
      id: "t4-m1", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "08:30",
      text: "Oportunidad de reactivación detectada: Grupo Farmacéutico GT. Sin contacto 47 días. Historial: $380K.",
      agentTag: "Seguimiento",
    },
    {
      id: "t4-m2", sender: "Supervisor", avatar: "SV", type: "agent", time: "08:35",
      text: "Excelente find. Asigné a Miriam Reyes por su experiencia. Deal: $420K estimado.",
      agentTag: "Supervisor",
      action: { label: "Deal de reactivación creado", body: "Cliente: Grupo Farmacéutico GT (Ballena)\nValor: $420K MXN\nAsignado: Miriam Reyes\nEstatus: Primer contacto", status: "auto-applied" },
    },
    {
      id: "t4-m3", sender: "Tú", avatar: "MR", type: "user", time: "09:00",
      text: "Perfecto. Mañana temprano llamo para reactivar la relación.",
    },
  ],

  t5: [
    {
      id: "t5-m1", sender: "Supervisor", avatar: "SV", type: "agent", time: "Ayer 17:00",
      text: "Nueva oportunidad en prospección: Tecnológica Avanzada. Segmento Trucha. Primeros contactos en exploración.",
      agentTag: "Supervisor",
    },
    {
      id: "t5-m2", sender: "Asistente Ventas", avatar: "AI", type: "agent", time: "Mañana 09:00",
      text: "Propuesta inicial lista. Servicios de salud ocupacional para 80 empleados.",
      agentTag: "Ventas",
    },
  ],
};

// Fallback MESSAGES for main chat
const MESSAGES: Message[] = [];

const MAIN_CHAT_MESSAGES: Message[] = [
  {
    id: "gm1", sender: "GDT", avatar: "GT", type: "agent", time: "08:00",
    text: "Buenos días. Ya revisé el pipeline y dejé listos tres frentes prioritarios para hoy.",
    agentTag: "Entrada principal",
  },
  {
    id: "gm2", sender: "Tú", avatar: "MR", type: "user", time: "08:03",
    text: "¿Qué urge hoy con Cervecería Toluca, Plásticos Industriales y Grupo Farmacéutico GT?",
  },
  {
    id: "gm3", sender: "GDT", avatar: "GT", type: "agent", time: "08:03",
    text: "Abrí un hilo con Asistente de Ventas para Cervecería Toluca, otro con Seguimiento para Plásticos Industriales y mandé Grupo Farmacéutico GT con Supervisor para reactivación.",
    action: { label: "Redirección lista", body: "Cervecería Toluca -> Asistente Ventas. Plásticos Industriales -> Seguimiento. Grupo Farmacéutico GT -> Supervisor. Si el hilo ya existía, lo reutilicé.", status: "info" },
  },
  {
    id: "gm4", sender: "GDT", avatar: "GT", type: "agent", time: "08:04",
    text: "También preparé el contexto para cada hilo para que puedas entrar directo a ejecutar.",
    reactions: [{ emoji: "⚡", count: 1, reacted: true }],
  },
];

// Per-agent demo messages with multiple use cases
const AGENT_MESSAGES: Record<string, Message[]> = {
  "gdt-main": MAIN_CHAT_MESSAGES,
  
  "follow-up": [
    // Use case 1: Daily pipeline scan and SLA alerts
    {
      id: "fu-uc1-m1", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "08:00",
      text: "Buenos días. Completé el escaneo matutino del pipeline.",
      agentTag: "Escaneo diario",
      reactions: [{ emoji: "👍", count: 1, reacted: false }],
      threadCount: 2,
    },
    {
      id: "fu-uc1-m2", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "08:01",
      text: "Cervecería Toluca lleva 6 días sin actividad. Creé tarea de seguimiento y borrador de llamada para mañana 10:00 AM.",
      action: { label: "Tarea creada automáticamente", body: "Seguimiento: Llamar a Carlos Mendoza — Cervecería Toluca. Deal $285,000 MXN en etapa Cotización Enviada.", status: "auto-applied" },
      reactions: [{ emoji: "✅", count: 2, reacted: true }],
    },
    {
      id: "fu-uc1-m3", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "08:02",
      text: "Plásticos Industriales tiene 4 días sin actividad. SLA Tiburones en riesgo. Creé recordatorio urgente.",
      action: { label: "Tarea urgente creada", body: "Ana Torres — Plásticos Industriales. Pipeline $180,000 MXN. SLA en riesgo.", status: "auto-applied" },
    },
    {
      id: "fu-uc1-m4", sender: "Tú", avatar: "MR", type: "user", time: "08:15",
      text: "Perfecto, gracias. ¿Hay algo más pendiente?",
    },
    {
      id: "fu-uc1-m5", sender: "Agente de Seguimiento", avatar: "AI", type: "agent", time: "08:16",
      text: "Grupo Farmacéutico GT sin contacto en 47 días. Creé oportunidad de reactivación y lo pasé al Supervisor.",
      replyTo: { sender: "Tú", text: "Perfecto, gracias. ¿Hay algo más pendiente?" },
      action: { label: "Reactivación iniciada", body: "Deal de reactivación creado para Grupo Farmacéutico GT (Ballena). Borrador de llamada preparado.", status: "auto-applied" },
      threadCount: 4,
    },
  ],
  
  "sales-assistant": [
    // Use case 1: Draft and prepare quote for approval
    {
      id: "sa-uc1-m1", sender: "Asistente Ventas", avatar: "AI", type: "agent", time: "10:22",
      text: "Resumen del cliente: Cervecería Toluca — 200 empleados. Cotización audiometrías lista ($42,000 MXN).",
      agentTag: "Resumen",
    },
    {
      id: "sa-uc1-m2", sender: "Asistente Ventas", avatar: "AI", type: "agent", time: "10:24",
      text: "Borrador de correo preparado. Incluye cotización, vigencia y CTA para confirmar.",
      action: { label: "Borrador de mensaje listo", body: "Hola Carlos,\n\nCotización para audiometrías: $42,000 MXN.\nVigencia: 30 días.\n\n¿Confirmamos?", status: "pending-approval", buttons: [{ label: "Enviar", variant: "primary" }, { label: "Editar", variant: "outline" }] },
    },
    
    // Use case 2: Call summary and next steps
    {
      id: "sa-uc2-m1", sender: "Asistente Ventas", avatar: "AI", type: "agent", time: "15:00",
      text: "Resumen de tu llamada con Roberto (Metalúrgica) generado automáticamente.",
      agentTag: "Resumen de llamada",
    },
    {
      id: "sa-uc2-m2", sender: "Asistente Ventas", avatar: "AI", type: "agent", time: "15:01",
      text: "Roberto confirmó presupuesto para 45 exámenes. Preparé 3 propuestas: Básico, Estándar, Premium.",
      action: { label: "Propuestas generadas", body: "Básico: $2,000 MXN\nEstándar: $4,000 MXN (recomendado)\nPremium: $6,000 MXN\n\nListas en your email. Sugiero enviar Estándar como default.", status: "auto-applied" },
    },
    {
      id: "sa-uc2-m3", sender: "Tú", avatar: "MR", type: "user", time: "15:05",
      text: "Perfecto. Env ía el Estándar.",
    },
    
    // Use case 3: WhatsApp draft for verification
    {
      id: "sa-uc3-m1", sender: "Asistente Ventas", avatar: "AI", type: "agent", time: "18:30",
      text: "Borrador de WhatsApp para Patricia (Farmacéutico GT) — seguimiento de cotización.",
      agentTag: "Para verificar y enviar",
    },
    {
      id: "sa-uc3-m2", sender: "Asistente Ventas", avatar: "AI", type: "agent", time: "18:31",
      text: "Mensaje preparado con link a documento y emoticon para tono cálido.",
      action: { label: "Mensaje WhatsApp", body: "Hola Patricia 👋\n\nQuería recordarte la cotización que enviamos la semana pasada para el programa de salud ocupacional.\n\n¿Alguna pregunta? Estoy disponible para aclarar 😊", status: "pending-approval", buttons: [{ label: "Enviar", variant: "primary" }, { label: "Editar", variant: "outline" }, { label: "No enviar", variant: "outline" }] },
    },
  ],
  
  "supervisor": [
    // Use case 1: Daily pipeline summary
    {
      id: "sv-uc1-m1", sender: "Supervisor", avatar: "SV", type: "agent", time: "07:00",
      text: "Resumen diario del pipeline: 43 llamadas, 8 cotizaciones, 2 cierres. Top 3 reps: Miriam, Juan, Laura.",
      agentTag: "Pipeline diario",
    },
    {
      id: "sv-uc1-m2", sender: "Supervisor", avatar: "SV", type: "agent", time: "07:02",
      text: "Deals > $100K en estado 'Cotización Enviada': 5 deals. 3 de ellos pasan los 5 días — SLA en riesgo.",
      action: { label: "Alerta de SLA", body: "5 deals premium en cotización enviada.\n3 están > 5 días sin respuesta.\n\nRecomendación: Escalada de seguimiento hoy.", status: "info" },
    },
    {
      id: "sv-uc1-m3", sender: "Tú", avatar: "MR", type: "user", time: "07:15",
      text: "¿Quién está en cada uno?",
    },
    {
      id: "sv-uc1-m4", sender: "Supervisor", avatar: "SV", type: "agent", time: "07:16",
      text: "Miriam: 2. Juan: 1. Laura: 2. Todos tienen capacidad para un push hoy.",
      reactions: [{ emoji: "✅", count: 1, reacted: true }],
    },
    
    // Use case 2: Reactivation opportunity detection
    {
      id: "sv-uc2-m1", sender: "Supervisor", avatar: "SV", type: "agent", time: "08:30",
      text: "Detecté oportunidad de reactivación: Grupo Farmacéutico GT (Ballena) — sin contacto 47 días.",
      agentTag: "Oportunidad de reactivación",
    },
    {
      id: "sv-uc2-m2", sender: "Supervisor", avatar: "SV", type: "agent", time: "08:31",
      text: "Historial: $380K MXN el año pasado. Asignado automáticamente a Miriam Reyes.",
      action: { label: "Deal de reactivación creado", body: "Cliente: Grupo Farmacéutico GT\nValor estimado: $420,000 MXN\nAsignado a: Miriam Reyes\nPlan: Llamada amable + propuesta de valor actualizada.", status: "auto-applied" },
    },
  ],
  
  "reporting": [
    // Use case 1: Weekly sales report
    {
      id: "r-uc1-m1", sender: "Reportes", avatar: "AI", type: "agent", time: "17:00",
      text: "Reporte semanal listo.",
      agentTag: "Reporte",
    },
    {
      id: "r-uc1-m2", sender: "Reportes", avatar: "AI", type: "agent", time: "17:01",
      text: "Semana 11 (11-17 Mar): $2,450,000 MXN en ventas totales. +15% vs semana anterior.",
      action: { label: "Resumen semanal", body: "Ventas cerradas: $2,450,000 MXN ✓\nCotizaciones: 12\nTasa de conversión: 18%\n\nTop 3 vendedoras:\n1. Miriam Reyes — $1,200,000\n2. Laura Díaz — $800,000\n3. Juan García — $450,000", status: "auto-applied" },
    },
    {
      id: "r-uc1-m3", sender: "Tú", avatar: "MR", type: "user", time: "17:15",
      text: "Excelente. ¿Cuál es el outlook para la próxima semana?",
    },
    {
      id: "r-uc1-m4", sender: "Reportes", avatar: "AI", type: "agent", time: "17:16",
      text: "Deals en pipeline para próxima semana: $1,890,000 MXN. 7 están en cotización lista. Proyección: $2.1M si se cierran 2 Ballenas.",
      reactions: [{ emoji: "⚡", count: 1, reacted: true }],
    },
  ],
};

// Fallback for old thread messages (unused in new design)
const THREAD_MESSAGES: Message[] = [];

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
  { id: "gdt-main-m", name: "GDT", initials: "GT", role: "Chat principal" },
  { id: "follow-up-m", name: "Agente de Seguimiento", initials: "AI", role: "Agente AI" },
  { id: "supervisor-m", name: "Supervisor", initials: "AI", role: "Agente AI" },
  { id: "sales-assistant-m", name: "Asistente de Ventas", initials: "AI", role: "Agente AI" },
];

const MAIN_ROUTE_CARDS: MainRouteCard[] = [
  {
    id: "route-1",
    title: "Cervecería Toluca",
    summary: "Cotización de audiometrías y siguiente mensaje listos en el hilo de Asistente de Ventas.",
    agentId: "sales-assistant",
    agentLabel: "Asistente Ventas",
    threadId: "t3",
    status: "Hilo reutilizado",
  },
  {
    id: "route-2",
    title: "Plásticos Industriales",
    summary: "Seguimiento urgente creado por riesgo de SLA. Tarea y llamada sugerida ya están listas.",
    agentId: "follow-up",
    agentLabel: "Seguimiento",
    threadId: "t2",
    status: "Hilo activo",
  },
  {
    id: "route-3",
    title: "Grupo Farmacéutico GT",
    summary: "Reactivación enviada al Supervisor con asignación y plan de rescate preparados.",
    agentId: "supervisor",
    agentLabel: "Supervisor",
    threadId: "t5",
    status: "Hilo creado",
  },
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
const SEGMENT_BADGE: Record<Segment, "blue" | "warning" | "success" | "muted" | "outline"> = { ballenas: "outline", tiburones: "outline", atunes: "outline", truchas: "muted", charales: "muted" };
const STAGE_BADGE: Record<string, "blue" | "warning" | "success" | "muted" | "destructive" | "outline" | "secondary"> = { cotización_enviada: "secondary", seguimiento: "secondary", descubrimiento: "secondary", prospecto: "muted", cerrado_ganado: "success", cerrado_perdido: "destructive" };
const AVATAR_BG: Record<string, string> = { CM: "bg-blue-100 text-blue-700", AT: "bg-amber-100 text-amber-700", RJ: "bg-emerald-100 text-emerald-700", PS: "bg-violet-100 text-violet-700", AI: "bg-muted text-muted-foreground", SV: "bg-muted text-muted-foreground", GT: "bg-primary text-primary-foreground", MR: "bg-primary text-primary-foreground" };
const BTN_MAP: Record<string, "default" | "outline" | "success" | "destructive"> = { primary: "default", outline: "outline", success: "success", danger: "destructive" };

const NAV_ITEMS = [
  { icon: "fa-solid fa-inbox", label: "Inbox", active: true, badge: 3 },
  { icon: "fa-solid fa-dollar-sign", label: "Deals" },
  { icon: "fa-solid fa-circle-check", label: "Tareas" },
  { icon: "fa-solid fa-calendar-days", label: "Calendario" },
  { icon: "fa-solid fa-chart-column", label: "Reportes" },
  { icon: "fa-solid fa-microphone", label: "Transcripción", href: "/transcribe" },
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

  const isUser = msg.type === "user";
  const bubbleClass = isUser ? "bg-primary/5 text-foreground rounded-lg px-3 py-2 inline-block" : "";

  return (
    <div
      className={cn(
        "group relative flex gap-2.5 px-4 py-1.5 transition-colors",
        hovering && "bg-muted/40",
        isUser && "justify-end"
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setShowEmojiPicker(false); }}
    >
      {!isUser && (
        <Avatar size="sm" className={cn("mt-0.5 shrink-0", AVATAR_BG[msg.avatar] ?? "bg-muted-foreground")} initials={msg.avatar} />
      )}

      <div className={cn("flex-1 min-w-0", isUser ? "max-w-[70%] text-right" : "") }>
        <div className={cn("flex items-baseline gap-2", isUser ? "justify-end" : "") }>
          <span className="text-[13px] font-semibold text-foreground">{msg.sender}</span>
          {msg.agentTag && <span className="text-[10px] text-muted-foreground">· {msg.agentTag}</span>}
          <span className="text-[11px] text-muted-foreground">{msg.time}</span>
        </div>

        {msg.replyTo && (
          <div className="mt-1 flex items-center gap-2 rounded border-l-2 border-primary/30 bg-muted/60 px-2.5 py-1">
            <span className="text-xs font-medium text-muted-foreground">{msg.replyTo.sender}:</span>
            <span className="text-xs text-muted-foreground truncate">{msg.replyTo.text}</span>
          </div>
        )}

        <div className={cn("mt-0.5 text-sm leading-relaxed", bubbleClass)}>
          <p className="m-0">{msg.text}</p>
        </div>

        {msg.action && (
          <Card className="mt-2">
            <CardContent className="p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                {msg.action.status === "auto-applied" && <i className="fa-solid fa-circle-check text-muted-foreground text-[11px]" />}
                {msg.action.status === "pending-approval" && <i className="fa-solid fa-clock text-muted-foreground text-[11px]" />}
                {msg.action.status === "info" && <i className="fa-solid fa-circle-info text-muted-foreground text-[11px]" />}
                <span className="truncate">{msg.action.label}</span>
                {msg.action.status === "auto-applied" && <span className="text-[10px] text-muted-foreground shrink-0">Aplicado</span>}
                {msg.action.status === "pending-approval" && <span className="text-[10px] text-muted-foreground shrink-0">Pendiente</span>}
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
          <div className="mt-1.5 flex flex-wrap gap-1 justify-end">
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
          <div className={cn("mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground", isUser ? "justify-end" : "") }>
            <button onClick={() => onOpenThread(msg.id)}>
              <i className="fa-solid fa-message text-[10px]" />
              <span className="ml-1">{msg.threadCount} {msg.threadCount === 1 ? "respuesta" : "respuestas"}</span>
            </button>
          </div>
        )}
      </div>

      {hovering && !isUser && (
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
        <div className="absolute -top-11 right-3 flex items-center gap-0.5 rounded-lg border border-border bg-card p-1 shadow-lg z-20">
          {EMOJI_PICKER.map((emoji) => (
            <button key={emoji} onClick={() => addReaction(emoji)} className="h-7 w-7 rounded text-sm hover:bg-muted transition-colors">{emoji}</button>
          ))}
        </div>
      )}

      {isUser && (
        <Avatar size="sm" className={cn("mt-0.5 shrink-0 ml-3", AVATAR_BG[msg.avatar] ?? "bg-muted-foreground")} initials={msg.avatar} />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Page Component
   ════════════════════════════════════════════════════════════════════════════ */

export default function InboxPage() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [threadOpen, setThreadOpen] = useState<string | null>(null);

  // Call state
  const [activeCallThreadId, setActiveCallThreadId] = useState<string | null>(null);
  const [callMode, setCallMode] = useState<CallMode>("mic-listen");

  const startCallFromThread = (threadId: string) => {
    if (CALL_CONTACTS[threadId] && CALL_DEALS[threadId]) {
      setActiveCallThreadId(threadId);
    }
  };

  const activeChannel = selectedChannel ? CLIENT_THREADS.find((t) => t.id === selectedChannel) : null;
  
  // Group threads by category
  const categorizedThreads = {
    "sla-risk": CLIENT_THREADS.filter((t) => t.category === "sla-risk"),
    "hot-deal": CLIENT_THREADS.filter((t) => t.category === "hot-deal"),
    "new": CLIENT_THREADS.filter((t) => t.category === "new"),
    "active": CLIENT_THREADS.filter((t) => t.category === "active"),
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Nav Rail ─────────────────────────────────────────────── */}
      <nav className="flex w-[52px] min-w-[52px] flex-col items-center gap-0.5 bg-sidebar py-3" aria-label="Navegación principal">
        <div className="mb-4 grid h-8 w-8 place-content-center rounded-lg bg-primary text-[10px] font-bold text-white">GDT</div>
        {NAV_ITEMS.map((item) => (
          <Tooltip key={item.label} content={item.label} side="right">
            {item.href ? (
              <a href={item.href} className={cn("relative inline-flex items-center justify-center h-9 w-9 rounded-md text-sidebar-foreground hover:bg-white/[.06] transition-colors")}>
                <i className={cn(item.icon, "text-sm")} />
              </a>
            ) : (
              <Button variant="ghost" size="icon-sm" className={cn("relative h-9 w-9 text-sidebar-foreground", item.active ? "bg-white/10 text-white" : "hover:bg-white/[.06]")}>
                <i className={cn(item.icon, "text-sm")} />
                {item.badge && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />}
              </Button>
            )}
          </Tooltip>
        ))}
        <div className="flex-1" />
        <Tooltip content={callMode === "mic-listen" ? "Modo: Micrófono ($0)" : callMode === "hybrid-quo" ? "Modo: Quo → Teléfono" : callMode === "hybrid-device" ? "Modo: Dispositivo BT" : "Modo: VoIP"} side="right">
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-9 w-9 text-sidebar-foreground"
            onClick={() => setCallMode((m) => m === "mic-listen" ? "voip" : m === "voip" ? "hybrid-quo" : m === "hybrid-quo" ? "hybrid-device" : "mic-listen")}
          >
            <i className={cn("text-sm", callMode === "mic-listen" ? "fa-solid fa-microphone" : callMode === "hybrid-device" ? "fa-solid fa-headset" : callMode === "hybrid-quo" ? "fa-solid fa-mobile-screen" : "fa-solid fa-phone")} />
          </Button>
        </Tooltip>
        <Tooltip content="Miriam Reyes" side="right">
          <Avatar size="sm" className="bg-white/10 text-white text-[10px]" initials="MR" />
        </Tooltip>
      </nav>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="flex w-[280px] min-w-[280px] flex-col border-r border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h1 className="text-sm font-semibold text-foreground">Clientes</h1>
          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <i className="fa-solid fa-filter text-xs" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 rounded-md border border-transparent bg-muted px-2.5 py-1.5 text-sm transition-colors focus-within:border-ring focus-within:bg-background">
            <i className="fa-solid fa-magnifying-glass text-[11px] text-muted-foreground" />
            <input type="text" placeholder="Buscar clientes..." className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
        </div>

        {/* Conversations grouped by category */}
        <div className="flex-1 overflow-y-auto">
          {/* SLA Risk */}
          {categorizedThreads["sla-risk"].length > 0 && (
            <div className="px-3 py-2">
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-destructive/80 flex items-center gap-1.5">
                <i className="fa-solid fa-exclamation-circle text-[9px]" /> En riesgo ({categorizedThreads["sla-risk"].length})
              </div>
              {categorizedThreads["sla-risk"].map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedChannel(thread.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors mb-1",
                    selectedChannel === thread.id ? "bg-destructive/10 border border-destructive/20" : "hover:bg-muted/50"
                  )}
                >
                  <Avatar size="sm" className={cn("h-7 w-7 text-[11px] shrink-0", AVATAR_BG[thread.initials] ?? "bg-muted-foreground")} initials={thread.initials} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-foreground truncate">{thread.clientName}</span>
                      {thread.unread && <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />}
                    </div>
                    <span className="block truncate text-[11px] text-muted-foreground mt-0.5">{thread.preview}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">{thread.time}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Hot Deals */}
          {categorizedThreads["hot-deal"].length > 0 && (
            <div className="px-3 py-2">
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <i className="fa-solid fa-fire text-[9px]" /> Oportunidades ({categorizedThreads["hot-deal"].length})
              </div>
              {categorizedThreads["hot-deal"].map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedChannel(thread.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors mb-1",
                    selectedChannel === thread.id ? "bg-amber-50 border border-amber-200/50" : "hover:bg-muted/50"
                  )}
                >
                  <Avatar size="sm" className={cn("h-7 w-7 text-[11px] shrink-0", AVATAR_BG[thread.initials] ?? "bg-muted-foreground")} initials={thread.initials} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-foreground truncate block">{thread.clientName}</span>
                    <span className="block truncate text-[11px] text-muted-foreground mt-0.5">{thread.preview}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">{thread.time}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* New */}
          {categorizedThreads["new"].length > 0 && (
            <div className="px-3 py-2">
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <i className="fa-solid fa-star text-[9px]" /> Nuevos ({categorizedThreads["new"].length})
              </div>
              {categorizedThreads["new"].map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedChannel(thread.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors mb-1",
                    selectedChannel === thread.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                  )}
                >
                  <Avatar size="sm" className={cn("h-7 w-7 text-[11px] shrink-0", AVATAR_BG[thread.initials] ?? "bg-muted-foreground")} initials={thread.initials} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-foreground truncate block">{thread.clientName}</span>
                    <span className="block truncate text-[11px] text-muted-foreground mt-0.5">{thread.preview}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">{thread.time}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Active / Others */}
          {categorizedThreads["active"].length > 0 && (
            <div className="px-3 py-2">
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <i className="fa-solid fa-circle-check text-[9px]" /> Activos ({categorizedThreads["active"].length})
              </div>
              {categorizedThreads["active"].map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedChannel(thread.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors mb-1",
                    selectedChannel === thread.id ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  <Avatar size="sm" className={cn("h-7 w-7 text-[11px] shrink-0", AVATAR_BG[thread.initials] ?? "bg-muted-foreground")} initials={thread.initials} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-foreground truncate block">{thread.clientName}</span>
                    <span className="block truncate text-[11px] text-muted-foreground mt-0.5">{thread.preview}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">{thread.time}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Chat ────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          {activeChannel ? (
            <div className="flex items-center gap-3">
              <Avatar size="sm" className={AVATAR_BG[activeChannel.initials] ?? "bg-muted-foreground"} initials={activeChannel.initials} />
              <div>
                <div className="text-sm font-semibold text-foreground">{activeChannel.clientName}</div>
                <div className="text-xs text-muted-foreground">
                  {activeChannel.company} · {STAGE_LABELS[activeChannel.stage]} · {SEGMENT_LABELS[activeChannel.segment]}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm font-semibold text-muted-foreground">Selecciona un cliente para comenzar</div>
          )}
          <div className="flex items-center gap-1">
            {activeChannel && (
              <Tooltip content="Llamar" side="bottom">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => activeChannel && startCallFromThread(activeChannel.id)}
                >
                  <i className="fa-solid fa-phone text-xs" />
                </Button>
              </Tooltip>
            )}
            <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground">
              <i className="fa-solid fa-ellipsis-vertical text-xs" />
            </Button>
          </div>
        </header>

        {activeChannel ? (
          <div className="flex-1 overflow-y-auto py-4">
            <div className="flex items-center gap-3 px-4 mb-3">
              <Separator className="flex-1" />
              <span className="text-[11px] font-medium text-muted-foreground px-2">Conversación</span>
              <Separator className="flex-1" />
            </div>
            <div className="flex flex-col gap-px px-4">
              {(() => {
                const messages = CLIENT_MESSAGES[activeChannel.id] ?? [];
                return messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} onOpenThread={(id) => setThreadOpen(id === threadOpen ? null : id)} onReply={() => {}} />
                ));
              })()}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <i className="fa-solid fa-comments text-6xl text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground">Selecciona un cliente del sidebar para ver la conversación</p>
            </div>
          </div>
        )}

        <Composer placeholder={activeChannel ? `Mensaje sobre ${activeChannel.clientName}...` : "Selecciona un cliente primero..."} />
      </main>

      {/* ── Thread Panel (Slack-style) ───────────────────────────── */}
      {threadOpen && activeChannel && (
        <aside className="flex w-[360px] min-w-[360px] flex-col border-l border-border bg-card">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Hilo interno</h3>
              <p className="text-xs text-muted-foreground">Discusión dentro de {activeChannel.clientName}</p>
            </div>
            <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground" onClick={() => setThreadOpen(null)}>
              <i className="fa-solid fa-xmark text-xs" />
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto py-3 px-1">
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Los hilos agrupan discusiones específicas sobre este cliente. Perfecto para coordinación entre agentes.
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
