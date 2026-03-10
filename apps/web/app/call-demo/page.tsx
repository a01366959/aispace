"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CallButton } from "@/components/call/CallButton";
import { CallPanel, type CallContact, type CallDeal, type CallHistoryItem, type TalkingPoint, type QuickAction } from "@/components/call/CallPanel";

/* ═══════════════════════════════════════════════════ */
/*  Mock data — GDT real-world scenario               */
/* ═══════════════════════════════════════════════════ */

const contacts: CallContact[] = [
  {
    id: "c1",
    name: "Ana López García",
    initials: "AL",
    role: "Directora de RH",
    company: "Cervecería Toluca S.A.",
    phone: "722-555-1234",
    email: "ana.lopez@cerveceriatoluca.mx",
    segment: "atunes",
  },
  {
    id: "c2",
    name: "Roberto Mendoza",
    initials: "RM",
    role: "Gerente de Seguridad Industrial",
    company: "Grupo Bimbo — Planta Toluca",
    phone: "722-555-5678",
    email: "r.mendoza@bimbo.com",
    segment: "ballenas",
  },
  {
    id: "c3",
    name: "Patricia Hernández",
    initials: "PH",
    role: "Coordinadora de Salud Ocupacional",
    company: "Transportes del Valle",
    phone: "722-555-9012",
    segment: "truchas",
  },
];

const deals: Record<string, CallDeal> = {
  c1: {
    id: "d1",
    name: "Exámenes anuales — Cervecería Toluca",
    stage: "Seguimiento",
    stageNumber: 6,
    value: "$85,000 MXN",
    daysSinceActivity: 6,
    probability: 65,
  },
  c2: {
    id: "d2",
    name: "Campaña ocupacional — Bimbo Toluca",
    stage: "Cotización enviada",
    stageNumber: 5,
    value: "$420,000 MXN",
    daysSinceActivity: 2,
    probability: 80,
  },
  c3: {
    id: "d3",
    name: "Exámenes nuevo ingreso — Transportes del Valle",
    stage: "Descubrimiento",
    stageNumber: 3,
    value: "$18,000 MXN",
    daysSinceActivity: 10,
    probability: 40,
  },
};

const historyItems: Record<string, CallHistoryItem[]> = {
  c1: [
    { date: "3 Mar", type: "quote", summary: "Cotización enviada — $85,000 MXN" },
    { date: "28 Feb", type: "call", summary: "Llamada: esperan aprobación de presupuesto" },
    { date: "22 Feb", type: "call", summary: "Descubrimiento: 120 empleados, exámenes anuales" },
    { date: "15 Feb", type: "email", summary: "Primer contacto por email" },
  ],
  c2: [
    { date: "7 Mar", type: "quote", summary: "Cotización enviada — $420,000 MXN" },
    { date: "5 Mar", type: "meeting", summary: "Reunión presencial en planta" },
    { date: "1 Mar", type: "call", summary: "Llamada: 350 empleados, unidad móvil requerida" },
    { date: "25 Feb", type: "call", summary: "Primer contacto — referido por Planta Lerma" },
  ],
  c3: [
    { date: "27 Feb", type: "call", summary: "Llamada: 15 choferes nuevo ingreso" },
    { date: "20 Feb", type: "note", summary: "Contacto detectado vía prospección" },
  ],
};

const talkingPointsData: Record<string, TalkingPoint[]> = {
  c1: [
    { priority: "high", text: "Cotización enviada el 3 de marzo — sin respuesta en 6 días" },
    { priority: "high", text: "Mencionó que esperan aprobación de presupuesto de RH corporativo" },
    { priority: "medium", text: "Exámenes anuales vencen en abril — urgencia natural" },
    { priority: "low", text: "Competencia: Laboratorio Azteca cotizó también" },
  ],
  c2: [
    { priority: "high", text: "Cotización por $420K enviada — deal más grande del trimestre" },
    { priority: "medium", text: "Requieren unidad móvil — confirmar disponibilidad de fechas" },
    { priority: "medium", text: "Referido por Planta Lerma — aprovechar relación existente" },
    { priority: "low", text: "Posible expansión a otras plantas si sale bien" },
  ],
  c3: [
    { priority: "high", text: "10 días sin actividad — deal en riesgo de perderse" },
    { priority: "medium", text: "Solo 15 choferes — deal chico pero puede ser recurrente" },
    { priority: "low", text: "Preguntar si tienen más sedes o sucursales" },
  ],
};

const quickActions: QuickAction[] = [
  { id: "schedule", label: "Agendar seguimiento", icon: "fa-calendar-plus" },
  { id: "quote", label: "Preparar cotización", icon: "fa-file-invoice-dollar" },
  { id: "update_stage", label: "Actualizar etapa del deal", icon: "fa-arrow-right" },
  { id: "create_task", label: "Crear tarea", icon: "fa-circle-plus" },
  { id: "send_email", label: "Enviar correo", icon: "fa-envelope", variant: "outline" as const },
  { id: "view_deal", label: "Ver deal room", icon: "fa-door-open", variant: "outline" as const },
];

/* ═══════════════════════════════════════════════════ */
/*  Segment config                                     */
/* ═══════════════════════════════════════════════════ */

const segmentConfig = {
  ballenas: { label: "Ballena", emoji: "🐋", variant: "blue" as const },
  tiburones: { label: "Tiburón", emoji: "🦈", variant: "warning" as const },
  atunes: { label: "Atún", emoji: "🐟", variant: "success" as const },
  truchas: { label: "Trucha", emoji: "🐟", variant: "secondary" as const },
  charales: { label: "Charal", emoji: "🐟", variant: "muted" as const },
};

/* ═══════════════════════════════════════════════════ */
/*  Page                                               */
/* ═══════════════════════════════════════════════════ */

export default function CallDemoPage() {
  const [activeCallContact, setActiveCallContact] = useState<CallContact | null>(null);

  const startCall = (contact: CallContact) => {
    setActiveCallContact(contact);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <i className="fa-solid fa-phone text-white text-sm" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Llamadas — AI Sales OS</h1>
              <p className="text-sm text-muted-foreground">
                Haz clic en el teléfono de cualquier contacto para iniciar una llamada con contexto completo
              </p>
            </div>
            <Badge variant="warning" className="ml-auto">
              <i className="fa-solid fa-flask mr-1" />
              Prototipo
            </Badge>
          </div>
        </div>
      </div>

      {/* Contact list */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex flex-col gap-4">
          {contacts.map((contact) => {
            const deal = deals[contact.id];
            const seg = segmentConfig[contact.segment];
            const history = historyItems[contact.id] ?? [];

            return (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar
                      initials={contact.initials}
                      size="lg"
                      className={cn(
                        contact.segment === "ballenas" && "bg-blue-100 text-blue-700",
                        contact.segment === "atunes" && "bg-success",
                        contact.segment === "truchas" && "bg-secondary",
                      )}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{contact.name}</span>
                        <Badge variant={seg.variant} className="text-[10px]">
                          {seg.emoji} {seg.label}
                        </Badge>
                        {deal && deal.daysSinceActivity > 5 && (
                          <Badge variant="destructive" className="text-[10px]">
                            <i className="fa-solid fa-triangle-exclamation mr-1" />
                            {deal.daysSinceActivity}d sin actividad
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {contact.role} · {contact.company}
                      </p>

                      {deal && (
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            <i className="fa-solid fa-handshake mr-1.5 text-xs" />
                            {deal.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            Etapa {deal.stageNumber}
                          </Badge>
                          <span className="font-semibold">{deal.value}</span>
                        </div>
                      )}

                      {/* Last activity */}
                      {history[0] && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          <i className="fa-solid fa-clock mr-1" />
                          Último: {history[0].date} — {history[0].summary}
                        </p>
                      )}
                    </div>

                    {/* Call button */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-muted-foreground">{contact.phone}</span>
                        <CallButton
                          phoneNumber={contact.phone}
                          contactName={contact.name}
                          onStartCall={() => startCall(contact)}
                        />
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        onClick={() => startCall(contact)}
                      >
                        <i className="fa-solid fa-phone text-xs" />
                        Llamar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Explanation */}
        <Separator className="my-8" />
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <i className="fa-solid fa-1 text-primary text-xs h-5 w-5 rounded-full bg-accent flex items-center justify-center" />
              Inicia la llamada
            </div>
            <p className="text-muted-foreground">
              Clic en "Llamar" para abrir el panel de llamada. Simula marcando y conectando en 2.5 segundos.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <i className="fa-solid fa-2 text-primary text-xs h-5 w-5 rounded-full bg-accent flex items-center justify-center" />
              Usa el contexto
            </div>
            <p className="text-muted-foreground">
              Ve puntos a tratar (IA), historial, deal activo y métricas. Toma notas en vivo. Usa silenciar, espera, altavoz.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <i className="fa-solid fa-3 text-primary text-xs h-5 w-5 rounded-full bg-accent flex items-center justify-center" />
              Resumen automático
            </div>
            <p className="text-muted-foreground">
              Al colgar, la IA genera un resumen y sugiere tareas. Edita, selecciona tareas y guarda. Todo se registra automáticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Call Panel overlay */}
      {activeCallContact && (
        <CallPanel
          contact={activeCallContact}
          deal={deals[activeCallContact.id]!}
          history={historyItems[activeCallContact.id] ?? []}
          talkingPoints={talkingPointsData[activeCallContact.id] ?? []}
          quickActions={quickActions}
          onClose={() => setActiveCallContact(null)}
          onQuickAction={(id) => console.log("Quick action:", id)}
        />
      )}
    </div>
  );
}
