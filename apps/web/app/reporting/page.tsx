"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";

/* ════════════════════════════════════════════════════════════════════════════
   Types & Interfaces
   ════════════════════════════════════════════════════════════════════════════ */

type UserRole = "director" | "manager" | "supervisor" | "rep";

interface MetricCard {
  label: string;
  value: string | number;
  change?: { value: number; direction: "up" | "down" };
  context?: string;
  icon?: string;
}

/* ════════════════════════════════════════════════════════════════════════════
   Mock Data for different user roles
   ════════════════════════════════════════════════════════════════════════════ */

// Director-level macro metrics
const DIRECTOR_MACRO = {
  header: "Reporte Ejecutivo — Dirección",
  period: "Q1 2026",
  metrics: [
    {
      label: "Ingresos Generados",
      value: "$2,845,000 MXN",
      change: { value: 23, direction: "up" as const },
      context: "+$530K vs Q1 2025",
      icon: "fa-solid fa-dollar-sign",
    },
    {
      label: "Tasa de Cierre",
      value: "38%",
      change: { value: 8, direction: "up" as const },
      context: "Fue 30% hace 3 meses",
      icon: "fa-solid fa-bullseye",
    },
    {
      label: "Reducción de SLA Breaches",
      value: "94%",
      change: { value: 94, direction: "up" as const },
      context: "Menos pérdida por falta de seguimiento",
      icon: "fa-solid fa-shield-check",
    },
    {
      label: "Valor Promedio de Deal",
      value: "$185K MXN",
      change: { value: 12, direction: "up" as const },
      context: "+$20K desde implementación",
      icon: "fa-solid fa-arrow-up-right",
    },
  ],
  pipeline: [
    { stage: "Prospect", count: 42, value: "$1,260K", color: "bg-muted" },
    { stage: "First Contact", count: 28, value: "$840K", color: "bg-blue-100" },
    { stage: "Discovery", count: 18, value: "$540K", color: "bg-sky-100" },
    { stage: "Quote Ready", count: 12, value: "$360K", color: "bg-cyan-100" },
    { stage: "Quote Sent", count: 9, value: "$315K", color: "bg-amber-100" },
    { stage: "Negotiation", count: 5, value: "$200K", color: "bg-orange-100" },
  ],
  teamMetrics: [
    { rep: "Miriam Reyes", deals: 8, value: "$580K", closedThisMonth: 3, followUpScore: "98%" },
    { rep: "Juan García", deals: 6, value: "$390K", closedThisMonth: 2, followUpScore: "92%" },
    { rep: "Laura Díaz", deals: 7, value: "$410K", closedThisMonth: 2, followUpScore: "95%" },
    { rep: "Carlos López", deals: 5, value: "$285K", closedThisMonth: 1, followUpScore: "88%" },
    { rep: "Ana Martínez", deals: 4, value: "$220K", closedThisMonth: 1, followUpScore: "85%" },
  ],
};

// Manager (Miriam) view - Mix macro and micro
const MANAGER_MACRO = {
  header: "Reporte de Operaciones — Miriam (Manager)",
  period: "Esta semana",
  metrics: [
    {
      label: "Pipeline Activo",
      value: "$3,515K MXN",
      change: { value: 15, direction: "up" as const },
      context: "116 oportunidades de venta",
      icon: "fa-solid fa-chart-area",
    },
    {
      label: "Tasa de Seguimiento",
      value: "97%",
      change: { value: 97, direction: "up" as const },
      context: "Seguimientos completados a tiempo",
      icon: "fa-solid fa-check-circle",
    },
    {
      label: "Forecast de Cierre (30d)",
      value: "$850K MXN",
      change: { value: 18, direction: "up" as const },
      context: "Deals en Negotiation + Sent",
      icon: "fa-solid fa-calendar-check",
    },
    {
      label: "Promedio de Ciclo",
      value: "21 días",
      change: { value: 9, direction: "down" as const },
      context: "Bajó de 30 días hace 2 meses",
      icon: "fa-solid fa-hourglass-end",
    },
  ],
  riskAlerts: [
    { client: "Cervecería Toluca", issue: "6 días sin seguimiento", stage: "Quote Sent", severity: "high" },
    { client: "Plásticos Industriales", issue: "SLA en riesgo", stage: "Negotiation", severity: "high" },
    { client: "Grupo Farmacéutico", issue: "47 días sin contacto", stage: "First Contact", severity: "medium" },
  ],
};

// Supervisor/Gerente view - Team focused
const SUPERVISOR_METRICS = {
  header: "Reporte de Desempeño de Equipo",
  period: "Mes actual",
  metrics: [
    {
      label: "Actividad de Seguimiento",
      value: "342 llamadas",
      change: { value: 24, direction: "up" as const },
      context: "vs 276 el mes pasado",
      icon: "fa-solid fa-phone",
    },
    {
      label: "Tasa de Conversión",
      value: "34%",
      change: { value: 12, direction: "up" as const },
      context: "De propuesta a cierre",
      icon: "fa-solid fa-percent",
    },
    {
      label: "Propuestas Enviadas",
      value: "23",
      change: { value: 35, direction: "up" as const },
      context: "+8 vs mes pasado",
      icon: "fa-solid fa-envelope",
    },
    {
      label: "Tiempo en Sistema",
      value: "3.2 hrs/día",
      change: { value: 40, direction: "down" as const },
      context: "Menos admin, más venta",
      icon: "fa-solid fa-clock",
    },
  ],
  teamPerformance: [
    { rep: "Miriam", calls: 78, closes: 3, proposalsCreated: 6, accuracy: "98%" },
    { rep: "Juan", calls: 65, closes: 2, proposalsCreated: 5, accuracy: "92%" },
    { rep: "Laura", calls: 71, closes: 2, proposalsCreated: 5, accuracy: "95%" },
    { rep: "Carlos", calls: 52, closes: 1, proposalsCreated: 4, accuracy: "88%" },
    { rep: "Ana", calls: 42, closes: 1, proposalsCreated: 3, accuracy: "85%" },
  ],
};

// Individual Rep view - Micro metrics
const REP_MICRO = {
  header: "Mi Dashboard — Miriam Reyes",
  period: "Hoy",
  metrics: [
    {
      label: "Mis Deals Activos",
      value: "8",
      change: { value: 2, direction: "up" as const },
      context: "Hasta cierre del mes",
      icon: "fa-solid fa-briefcase",
    },
    {
      label: "Valor de Pipeline Personal",
      value: "$640K MXN",
      change: { value: 8, direction: "up" as const },
      context: "Deals en mis manos",
      icon: "fa-solid fa-trending-up",
    },
    {
      label: "Tareas Pendientes",
      value: "5",
      change: undefined,
      context: "Hoy",
      icon: "fa-solid fa-list-check",
    },
    {
      label: "Contactos This Week",
      value: "23",
      change: { value: 5, direction: "up" as const },
      context: "Llamadas y mensajes",
      icon: "fa-solid fa-people-group",
    },
  ],
  topDeals: [
    { client: "Metalúrgica del Valle", stage: "Quote Sent", value: "$210K", daysOpen: 4, status: "En negociación" },
    { client: "Brewpub Central", stage: "Discovery", value: "$145K", daysOpen: 8, status: "Calificando" },
    { client: "Grupo Farmacéutico", stage: "First Contact", value: "$420K", daysOpen: 47, status: "Reactivar" },
  ],
};

/* ════════════════════════════════════════════════════════════════════════════
   Utility Messages (ROI & Value Justification)
   ════════════════════════════════════════════════════════════════════════════ */

const VALUE_PROPS = {
  director: [
    "✅ Reducción de deal loss rate: 95% → 6%",
    "✅ Incremento de ingresos: +23% YoY",
    "✅ Ciclo de venta -30%: De 30 a 21 días promedio",
    "✅ ROI proyectado: 340% en año 1",
  ],
  manager: [
    "✅ 97% tasa de seguimiento (vs 60% manual antes)",
    "✅ Visibilidad en tiempo real de pipeline",
    "✅ Alertas automáticas de SLA en riesgo",
    "✅ Menos tiempo en Excel/Zoho, más en ventas",
  ],
  supervisor: [
    "✅ Actividad de seguimiento +24%",
    "✅ Propuestas automatizadas en 2 minutos (antes 20)",
    "✅ Tasa de conversión mejorada 8%",
    "✅ Mejor asignación de recursos",
  ],
  rep: [
    "✅ Recordatorios inteligentes de seguimiento",
    "✅ Contexto completo del cliente en un click",
    "✅ Tareas priorizadas automáticamente",
    "✅ No más buscar info en 3 sistemas",
  ],
};

/* ════════════════════════════════════════════════════════════════════════════
   Components
   ════════════════════════════════════════════════════════════════════════════ */

function MetricCard({ item }: { item: MetricCard }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</span>
        {item.icon && <i className={cn(item.icon, "text-muted-foreground text-sm")} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{item.value}</span>
        {item.change && (
          <Badge variant={item.change.direction === "up" ? "success" : "secondary"} className="text-[10px]">
            <i className={cn("text-xs mr-1", item.change.direction === "up" ? "fa-solid fa-arrow-up" : "fa-solid fa-arrow-down")} />
            {item.change.value}%
          </Badge>
        )}
      </div>
      {item.context && <span className="text-xs text-muted-foreground">{item.context}</span>}
    </div>
  );
}

function PipelineVisual({ stages }: { stages: any[] }) {
  const totalValue = stages.reduce((sum, s) => {
    const value = parseInt(s.value.replace("$", "").replace("K", "000"));
    return sum + value;
  }, 0);

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-4">Pipeline por Etapa</h3>
      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const value = parseInt(stage.value.replace("$", "").replace("K", "000"));
          const percentage = (value / totalValue) * 100;
          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{stage.stage}</span>
                <span className="text-xs text-muted-foreground">{stage.value} ({stage.count} deals)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full", stage.color)} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamTable({ data }: { data: any[] }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Rep</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Deals</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Valor</th>
            {data[0]?.closedThisMonth !== undefined && (
              <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Cerrados</th>
            )}
            {data[0]?.followUpScore !== undefined && (
              <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Score</th>
            )}
            {data[0]?.accuracy !== undefined && (
              <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Precisión</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-foreground font-medium">{row.rep}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{row.deals || row.calls}</td>
              <td className="px-4 py-3 text-right text-foreground font-semibold">{row.value}</td>
              {row.closedThisMonth !== undefined && <td className="px-4 py-3 text-right text-foreground">{row.closedThisMonth}</td>}
              {row.followUpScore !== undefined && <td className="px-4 py-3 text-right text-foreground font-medium text-emerald-600">{row.followUpScore}</td>}
              {row.accuracy !== undefined && <td className="px-4 py-3 text-right text-foreground font-medium">{row.accuracy}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RiskAlertCard({ alert }: { alert: any }) {
  return (
    <div className={cn("rounded-lg border p-3 flex items-start gap-3", alert.severity === "high" ? "border-destructive/20 bg-destructive/5" : "border-amber-200/50 bg-amber-50/30")}>
      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", alert.severity === "high" ? "bg-destructive/20 text-destructive" : "bg-amber-100 text-amber-700")}>
        <i className={cn("text-xs", alert.severity === "high" ? "fa-solid fa-exclamation" : "fa-solid fa-info")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">{alert.client}</span>
          <Badge variant={alert.severity === "high" ? "destructive" : "secondary"} className="text-[10px]">
            {alert.stage}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{alert.issue}</p>
      </div>
    </div>
  );
}

function TopDealsCard({ deal }: { deal: any }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-sm text-foreground">{deal.client}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{deal.status}</div>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {deal.stage}
        </Badge>
      </div>
      <Separator className="my-2" />
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Valor</span>
        <span className="font-semibold text-foreground">{deal.value}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Abierto</span>
        <span className="text-muted-foreground">{deal.daysOpen} días</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Main Page Component
   ════════════════════════════════════════════════════════════════════════════ */

export default function ReportingPage() {
  const [userRole, setUserRole] = useState<UserRole>("director");

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case "director":
        return { data: DIRECTOR_MACRO, label: "Dirección", icon: "fa-solid fa-crown" };
      case "manager":
        return { data: MANAGER_MACRO, label: "Manager (Miriam)", icon: "fa-solid fa-person-chalkboard" };
      case "supervisor":
        return { data: SUPERVISOR_METRICS, label: "Supervisor", icon: "fa-solid fa-people-group" };
      case "rep":
        return { data: REP_MICRO, label: "Rep (Mi Dashboard)", icon: "fa-solid fa-user" };
    }
  };

  const config = getRoleConfig(userRole);
  const isDirector = userRole === "director";
  const isManager = userRole === "manager";
  const isSupervisor = userRole === "supervisor";
  const isRep = userRole === "rep";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Nav Rail ─────────────────────────────────────────────── */}
      <nav className="flex w-[52px] min-w-[52px] flex-col items-center gap-0.5 bg-sidebar py-3">
        <div className="mb-4 grid h-8 w-8 place-content-center rounded-lg bg-primary text-[10px] font-bold text-white">GDT</div>
        <Tooltip content="Inbox" side="right">
          <a href="/" className="relative inline-flex items-center justify-center h-9 w-9 rounded-md text-sidebar-foreground hover:bg-white/[.06] transition-colors">
            <i className="fa-solid fa-inbox text-sm" />
          </a>
        </Tooltip>
        <Tooltip content="Reportes" side="right">
          <Button variant="ghost" size="icon-sm" className="h-9 w-9 text-sidebar-foreground bg-white/10 text-white">
            <i className="fa-solid fa-chart-column text-sm" />
          </Button>
        </Tooltip>
        <Tooltip content="Tareas" side="right">
          <a href="/tasks" className="relative inline-flex items-center justify-center h-9 w-9 rounded-md text-sidebar-foreground hover:bg-white/[.06] transition-colors">
            <i className="fa-solid fa-circle-check text-sm" />
          </a>
        </Tooltip>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{config.data.header}</h1>
              <p className="text-sm text-muted-foreground mt-1">Período: {config.data.period}</p>
            </div>

            {/* Role Selector */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-1">
              {(["director", "manager", "supervisor", "rep"] as const).map((role) => (
                <Tooltip key={role} content={getRoleConfig(role).label} side="bottom">
                  <Button
                    size="sm"
                    variant={userRole === role ? "default" : "ghost"}
                    onClick={() => setUserRole(role)}
                    className="h-8 gap-1.5"
                  >
                    <i className={getRoleConfig(role).icon} />
                    <span className="hidden sm:inline text-xs">{role === "director" ? "Dirección" : role === "manager" ? "Manager" : role === "supervisor" ? "Gerente" : "Rep"}</span>
                  </Button>
                </Tooltip>
              ))}
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Value Propositions */}
          <div className="rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Valor demostrado</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {VALUE_PROPS[userRole].map((prop, idx) => (
                <div key={idx} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">{prop.split(" ")[0]}</span>
                  <span>{prop.replace("✅ ", "")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Métricas Clave</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {config.data.metrics.map((metric, idx) => (
                <MetricCard key={idx} item={metric} />
              ))}
            </div>
          </div>

          {/* Director View: Pipeline & Team */}
          {isDirector && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <PipelineVisual stages={DIRECTOR_MACRO.pipeline} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Desempeño de Equipo</h3>
                  <TeamTable data={DIRECTOR_MACRO.teamMetrics} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Manager View: Risk Alerts */}
          {isManager && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                <h2 className="text-lg font-semibold text-foreground mb-4">🚨 Alertas de Riesgo</h2>
                <div className="space-y-3">
                  {MANAGER_MACRO.riskAlerts.map((alert, idx) => (
                    <RiskAlertCard key={idx} alert={alert} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Supervisor View: Team Performance Table */}
          {isSupervisor && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Desempeño Detallado del Equipo</h2>
                <TeamTable data={SUPERVISOR_METRICS.teamPerformance} />
              </CardContent>
            </Card>
          )}

          {/* Rep View: Top Deals */}
          {isRep && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Mis Principales Deals</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {REP_MICRO.topDeals.map((deal, idx) => (
                  <TopDealsCard key={idx} deal={deal} />
                ))}
              </div>
            </div>
          )}

          {/* ROI & Justification Summary */}
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/50">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <i className="fa-solid fa-chart-line text-emerald-600" />
                Retorno de Inversión
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Costo Mensual</span>
                  <div className="text-lg font-bold text-foreground">$2,500</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Ingresos Adicionales</span>
                  <div className="text-lg font-bold text-emerald-600">+$85,000</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Eficiencia Ganada</span>
                  <div className="text-lg font-bold text-foreground">15 hrs/sem</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">ROI Año 1</span>
                  <div className="text-lg font-bold text-emerald-600">340%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
