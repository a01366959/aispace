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
type TimePeriod = "week" | "month" | "bimester" | "quarter" | "year" | "custom";
type FilterType = "segment" | "stage" | "rep" | "status";

interface MetricCard {
  label: string;
  value: string | number;
  change?: { value: number; direction: "up" | "down" };
  context?: string;
  icon?: string;
}

interface RepInsight {
  rep: string;
  insight: string;
  severity: "positive" | "warning" | "neutral";
  metric: string;
}

interface AgentActivity {
  timestamp: string;
  agent: string;
  action: string;
  status: "completed" | "in-progress" | "pending";
}

/* ════════════════════════════════════════════════════════════════════════════
   Enhanced Mock Data with Insights
   ════════════════════════════════════════════════════════════════════════════ */

const DIRECTOR_MACRO = {
  header: "Reporte Ejecutivo — Dirección",
  metrics: [
    {
      label: "Ingresos Generados",
      value: "$2,845,000 MXN",
      change: { value: 23, direction: "up" as const },
      context: "+$530K vs período anterior",
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
};

const SUPERVISOR_METRICS = {
  header: "Reporte de Equipo — Supervisor",
  metrics: [
    {
      label: "Actividad de Seguimiento",
      value: "342 llamadas",
      change: { value: 24, direction: "up" as const },
      context: "vs 276 el período anterior",
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
      context: "+8 vs período anterior",
      icon: "fa-solid fa-envelope",
    },
    {
      label: "Tiempo Promedio en Sistema",
      value: "3.2 hrs/día",
      change: { value: 40, direction: "down" as const },
      context: "Menos admin, más venta",
      icon: "fa-solid fa-clock",
    },
  ],
  teamPerformance: [
    { rep: "Miriam", calls: 78, closes: 3, proposalsCreated: 6, accuracy: "98%", trend: "up" },
    { rep: "Juan", calls: 65, closes: 2, proposalsCreated: 5, accuracy: "92%", trend: "up" },
    { rep: "Laura", calls: 71, closes: 2, proposalsCreated: 5, accuracy: "95%", trend: "up" },
    { rep: "Carlos", calls: 52, closes: 1, proposalsCreated: 4, accuracy: "88%", trend: "down" },
    { rep: "Ana", calls: 42, closes: 1, proposalsCreated: 3, accuracy: "85%", trend: "neutral" },
  ],
};

// Detailed metrics per rep for visualization
const REP_DETAILED_METRICS = {
  calls: [
    { rep: "Miriam", value: 78, color: "text-emerald-600" },
    { rep: "Juan", value: 65, color: "text-blue-600" },
    { rep: "Laura", value: 71, color: "text-purple-600" },
    { rep: "Carlos", value: 52, color: "text-orange-600" },
    { rep: "Ana", value: 42, color: "text-pink-600" },
  ],
  conversions: [
    { rep: "Miriam", value: 38, color: "text-emerald-600" },
    { rep: "Juan", value: 31, color: "text-blue-600" },
    { rep: "Laura", value: 35, color: "text-purple-600" },
    { rep: "Carlos", value: 19, color: "text-orange-600" },
    { rep: "Ana", value: 24, color: "text-pink-600" },
  ],
  proposals: [
    { rep: "Miriam", value: 6, color: "text-emerald-600" },
    { rep: "Juan", value: 5, color: "text-blue-600" },
    { rep: "Laura", value: 5, color: "text-purple-600" },
    { rep: "Carlos", value: 4, color: "text-orange-600" },
    { rep: "Ana", value: 3, color: "text-pink-600" },
  ],
  systemTime: [
    { rep: "Miriam", value: 2.8, color: "text-emerald-600" },
    { rep: "Juan", value: 3.1, color: "text-blue-600" },
    { rep: "Laura", value: 3.4, color: "text-purple-600" },
    { rep: "Carlos", value: 3.6, color: "text-orange-600" },
    { rep: "Ana", value: 3.9, color: "text-pink-600" },
  ],
};

const REP_INSIGHTS: RepInsight[] = [
  { rep: "Miriam", insight: "Top performer — 3 cierres en período, tasa más alta", severity: "positive", metric: "3 cierres" },
  { rep: "Juan", insight: "Conversión sólida pero revisar propuestas rechazadas", severity: "neutral", metric: "2 cierres" },
  { rep: "Laura", insight: "Excelente precisión (95%) pero volumen bajo vs capacidad", severity: "warning", metric: "94% de precisión" },
  { rep: "Carlos", insight: "Tendencia de cierre decreciente, necesita coaching", severity: "warning", metric: "↓ 1 cierre" },
  { rep: "Ana", insight: "Nueva en equipo pero buen engagement, en rampa", severity: "neutral", metric: "↑ 42 llamadas" },
];

const AGENT_ACTIVITIES: AgentActivity[] = [
  { timestamp: "09:45", agent: "Reporting Agent", action: "Sincronizó 342 llamadas desde Zoho y sistema de tareas", status: "completed" },
  { timestamp: "09:46", agent: "Reporting Agent", action: "Calculó métricas de conversión y eficiencia por rep", status: "completed" },
  { timestamp: "09:47", agent: "Reporting Agent", action: "Generó insights automáticos basados en patrones", status: "completed" },
  { timestamp: "09:48", agent: "Reporting Agent", action: "Identificó flags: Carlos ↓ cierre, Laura volumen bajo", status: "completed" },
  { timestamp: "09:49", agent: "Reporting Agent", action: "Compiló pipeline y proyecciones de forecast", status: "completed" },
  { timestamp: "09:50", agent: "Reporting Agent", action: "Reporte listo para Director/Supervisor", status: "completed" },
];

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

function TeamPerformanceTable({ data }: { data: any[] }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Rep</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Llamadas</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Cierres</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Propuestas</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Precisión</th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground">Tendencia</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-foreground font-medium">{row.rep}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{row.calls}</td>
              <td className="px-4 py-3 text-right text-foreground font-semibold">{row.closes}</td>
              <td className="px-4 py-3 text-right text-foreground">{row.proposalsCreated}</td>
              <td className="px-4 py-3 text-right text-foreground font-medium">{row.accuracy}</td>
              <td className="px-4 py-3 text-center">
                <i className={cn("text-xs", row.trend === "up" ? "fa-solid fa-arrow-up text-emerald-600" : row.trend === "down" ? "fa-solid fa-arrow-down text-destructive" : "fa-solid fa-minus text-muted-foreground")} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RepInsightCard({ insight }: { insight: RepInsight }) {
  const bgColor = insight.severity === "positive" ? "bg-emerald-50 border-emerald-200" : insight.severity === "warning" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200";
  const iconColor = insight.severity === "positive" ? "text-emerald-600" : insight.severity === "warning" ? "text-amber-600" : "text-blue-600";

  return (
    <div className={cn("rounded-lg border p-3 flex items-start gap-3", bgColor)}>
      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", insight.severity === "positive" ? "bg-emerald-100" : insight.severity === "warning" ? "bg-amber-100" : "bg-blue-100")}>
        <i className={cn("text-xs", insight.severity === "positive" ? "fa-solid fa-check" : insight.severity === "warning" ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-info", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-foreground">{insight.rep}</span>
          <Badge variant={insight.severity === "positive" ? "success" : insight.severity === "warning" ? "secondary" : "outline"} className="text-[10px]">
            {insight.metric}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{insight.insight}</p>
      </div>
    </div>
  );
}

function AgentActivityLog({ activities }: { activities: AgentActivity[] }) {
  return (
    <div className="space-y-2">
      {activities.map((activity, idx) => (
        <div key={idx} className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 p-2.5 text-xs">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 shrink-0 mt-0.5">
            <i className="fa-solid fa-robot text-[10px] text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{activity.agent}</span>
              <span className="text-muted-foreground">@{activity.timestamp}</span>
            </div>
            <p className="text-muted-foreground mt-0.5">{activity.action}</p>
          </div>
          <div className={cn("h-2 w-2 rounded-full shrink-0 mt-1", activity.status === "completed" ? "bg-emerald-500" : activity.status === "in-progress" ? "bg-amber-500" : "bg-muted-foreground")} />
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Strategic Metric Chart Component
   ════════════════════════════════════════════════════════════════════════════ */

interface MetricChartData {
  rep: string;
  value: number;
  color: string;
}

function MetricChart({ data, label, unit, median }: { data: MetricChartData[]; label: string; unit: string; median: number }) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const medianPercent = (median / maxValue) * 100;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h4 className="text-sm font-semibold text-foreground mb-4">{label}</h4>
      
      <div className="space-y-3">
        {data.map((item, idx) => {
          const percentage = (item.value / maxValue) * 100;
          const isAboveMedian = item.value > median;
          
          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{item.rep}</span>
                <span className={cn("text-xs font-semibold", item.color)}>
                  {item.value}{unit} {isAboveMedian ? "↑" : item.value < median ? "↓" : "→"}
                </span>
              </div>
              <div className="relative h-6 bg-muted rounded-md overflow-hidden flex items-center">
                <div
                  className={cn("h-full rounded-md transition-all", item.color.replace("text-", "bg-").replace("-600", "-200"))}
                  style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-[10px] font-semibold text-muted-foreground">{item.value}{unit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Median line reference */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <i className="fa-solid fa-minus text-primary" />
            Mediana
          </span>
          <span className="font-semibold text-foreground">{median}{unit}</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          {data.filter((d) => d.value > median).length} encima • {data.filter((d) => d.value < median).length} debajo
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Filter Component
   ════════════════════════════════════════════════════════════════════════════ */

function FilterPanel({ onFilterChange }: { onFilterChange?: () => void }) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [expanded, setExpanded] = useState(false);

  const timePeriods: { label: string; value: TimePeriod }[] = [
    { label: "Esta semana", value: "week" },
    { label: "Este mes", value: "month" },
    { label: "Bimestre", value: "bimester" },
    { label: "Trimestre", value: "quarter" },
    { label: "Año", value: "year" },
    { label: "Personalizado", value: "custom" },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <i className="fa-solid fa-filter text-muted-foreground" />
          Filtros Avanzados
        </h3>
        <Button variant="ghost" size="icon-sm" onClick={() => setExpanded(!expanded)} className="h-6 w-6">
          <i className={cn("text-xs fa-solid", expanded ? "fa-chevron-up" : "fa-chevron-down")} />
        </Button>
      </div>

      {expanded && (
        <>
          <Separator className="mb-4" />

          {/* Time Period */}
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Período de Tiempo</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {timePeriods.map((period) => (
                <Button
                  key={period.value}
                  size="sm"
                  variant={timePeriod === period.value ? "default" : "outline"}
                  onClick={() => {
                    setTimePeriod(period.value);
                    onFilterChange?.();
                  }}
                  className="h-8 text-xs"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Segment Filter */}
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Segmento de Cliente</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {["Ballenas", "Tiburones", "Atunes", "Truchas", "Charales"].map((segment) => (
                <Button key={segment} size="sm" variant="outline" className="h-8 text-xs">
                  {segment}
                </Button>
              ))}
            </div>
          </div>

          {/* Stage Filter */}
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Etapa del Deal</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {["Prospect", "First Contact", "Discovery", "Quote Ready", "Quote Sent", "Negotiation"].map((stage) => (
                <Button key={stage} size="sm" variant="outline" className="h-8 text-xs">
                  {stage}
                </Button>
              ))}
            </div>
          </div>

          {/* Rep Filter */}
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Vendedor</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {["Miriam", "Juan", "Laura", "Carlos", "Ana"].map((rep) => (
                <Button key={rep} size="sm" variant="outline" className="h-8 text-xs">
                  {rep}
                </Button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Estado</label>
            <div className="grid grid-cols-3 gap-2">
              {["Activo", "En Riesgo", "Completado"].map((status) => (
                <Button key={status} size="sm" variant="outline" className="h-8 text-xs">
                  {status}
                </Button>
              ))}
            </div>
          </div>

          <Separator className="my-4" />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">
              Aplicar Filtros
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              Limpiar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Main Page Component
   ════════════════════════════════════════════════════════════════════════════ */

export default function ReportingPage() {
  const [userRole, setUserRole] = useState<UserRole>("director");
  const [selectedRep, setSelectedRep] = useState<string | null>(null);

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case "director":
        return { label: "Dirección", icon: "fa-solid fa-crown" };
      case "manager":
        return { label: "Manager", icon: "fa-solid fa-person-chalkboard" };
      case "supervisor":
        return { label: "Supervisor", icon: "fa-solid fa-people-group" };
      case "rep":
        return { label: "Rep", icon: "fa-solid fa-user" };
    }
  };

  const isDirector = userRole === "director";
  const isSupervisor = userRole === "supervisor";

  // Calculate medians for metrics
  const callsMedian = 65;
  const conversionsMedian = 32;
  const proposalsMedian = 5;
  const systemTimeMedian = 3.4;

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{isDirector ? "Reporte Ejecutivo — Dirección" : isSupervisor ? "Reporte de Equipo — Supervisor" : "Reporte de Reportes"}</h1>
              <p className="text-sm text-muted-foreground mt-1">Datos en tiempo real • Actualizado hace 10 minutos</p>
            </div>

            {/* Role Selector */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-1">
              {(["director", "supervisor"] as const).map((role) => (
                <Tooltip key={role} content={getRoleConfig(role).label} side="bottom">
                  <Button
                    size="sm"
                    variant={userRole === role ? "default" : "ghost"}
                    onClick={() => setUserRole(role)}
                    className="h-8 gap-1.5"
                  >
                    <i className={getRoleConfig(role).icon} />
                    <span className="hidden sm:inline text-xs">{role === "director" ? "Dirección" : "Supervisor"}</span>
                  </Button>
                </Tooltip>
              ))}
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Filter Panel */}
          <FilterPanel />

          {/* Key Metrics Grid */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Métricas Clave</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(isDirector ? DIRECTOR_MACRO.metrics : SUPERVISOR_METRICS.metrics).map((metric, idx) => (
                <MetricCard key={idx} item={metric} />
              ))}
            </div>
          </div>

          {/* Director View: Pipeline & Insights */}
          {isDirector && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <PipelineVisual stages={DIRECTOR_MACRO.pipeline} />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">📊 Análisis de Pipeline</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total de Deals</span>
                        <span className="font-medium text-foreground">114</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor Total</span>
                        <span className="font-medium text-foreground">$3.515M</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Forecast (30 días)</span>
                        <span className="font-medium text-emerald-600">$515K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Win Rate Proyectado</span>
                        <span className="font-medium text-foreground">38%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Supervisor View: Team Performance & Insights */}
          {isSupervisor && (
            <>
              {/* Rep Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">Vista:</span>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-1">
                  <Button
                    size="sm"
                    variant={selectedRep === null ? "default" : "ghost"}
                    onClick={() => setSelectedRep(null)}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <i className="fa-solid fa-users" />
                    Equipo Completo
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <select
                    value={selectedRep || ""}
                    onChange={(e) => setSelectedRep(e.target.value || null)}
                    className="h-8 px-2 rounded bg-background border border-border text-xs font-medium text-foreground cursor-pointer"
                  >
                    <option value="">Seleccionar Rep...</option>
                    {SUPERVISOR_METRICS.teamPerformance.map((rep) => (
                      <option key={rep.rep} value={rep.rep}>
                        {rep.rep}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Metric Charts with Agent Comparison - Team View */}
              {selectedRep === null && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">📊 Métricas Detalladas por Agente</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MetricChart 
                      data={REP_DETAILED_METRICS.calls}
                      label="Actividad de Seguimiento (Llamadas)"
                      unit=""
                      median={callsMedian}
                    />
                    <MetricChart 
                      data={REP_DETAILED_METRICS.conversions}
                      label="Tasa de Conversión (%)"
                      unit="%"
                      median={conversionsMedian}
                    />
                    <MetricChart 
                      data={REP_DETAILED_METRICS.proposals}
                      label="Propuestas Enviadas"
                      unit=""
                      median={proposalsMedian}
                    />
                    <MetricChart 
                      data={REP_DETAILED_METRICS.systemTime}
                      label="Tiempo Promedio en Sistema (hrs)"
                      unit=""
                      median={systemTimeMedian}
                    />
                  </div>

                  {/* Team Performance Table */}
                  <div className="mt-6">
                    <Card>
                      <CardContent className="p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Desempeño Detallado del Equipo</h2>
                        <TeamPerformanceTable data={SUPERVISOR_METRICS.teamPerformance} />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Insights & Flags */}
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Insights & Flags por Rep</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {REP_INSIGHTS.map((insight, idx) => (
                        <RepInsightCard key={idx} insight={insight} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Rep Detail View */}
              {selectedRep && (
                <div>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <h2 className="text-lg font-semibold text-foreground mb-2">Detalle: {selectedRep}</h2>
                      <p className="text-sm text-muted-foreground">Comparación con equipo y análisis individual</p>
                    </div>

                    {/* Show median comparison for selected rep */}
                    {(() => {
                      const repData = SUPERVISOR_METRICS.teamPerformance.find((r) => r.rep === selectedRep);
                      const repCalls = REP_DETAILED_METRICS.calls.find((d) => d.rep === selectedRep)?.value || 0;
                      const repConversions = REP_DETAILED_METRICS.conversions.find((d) => d.rep === selectedRep)?.value || 0;
                      const repProposals = REP_DETAILED_METRICS.proposals.find((d) => d.rep === selectedRep)?.value || 0;
                      const repSystemTime = REP_DETAILED_METRICS.systemTime.find((d) => d.rep === selectedRep)?.value || 0;

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <h3 className="text-sm font-semibold text-foreground mb-3">Comparación vs Mediana</h3>
                              <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                                  <span className="text-muted-foreground">Llamadas</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{repCalls}</span>
                                    {repCalls > callsMedian ? (
                                      <Badge variant="success" className="text-[10px]">
                                        +{repCalls - callsMedian} vs mediana
                                      </Badge>
                                    ) : repCalls < callsMedian ? (
                                      <Badge variant="secondary" className="text-[10px]">
                                        {repCalls - callsMedian} vs mediana
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px]">En mediana</Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                                  <span className="text-muted-foreground">Conversión</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{repConversions}%</span>
                                    {repConversions > conversionsMedian ? (
                                      <Badge variant="success" className="text-[10px]">
                                        +{repConversions - conversionsMedian}% vs mediana
                                      </Badge>
                                    ) : repConversions < conversionsMedian ? (
                                      <Badge variant="secondary" className="text-[10px]">
                                        {repConversions - conversionsMedian}% vs mediana
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px]">En mediana</Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                                  <span className="text-muted-foreground">Propuestas</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{repProposals}</span>
                                    {repProposals > proposalsMedian ? (
                                      <Badge variant="success" className="text-[10px]">
                                        +{Math.round((repProposals - proposalsMedian) * 10) / 10} vs mediana
                                      </Badge>
                                    ) : repProposals < proposalsMedian ? (
                                      <Badge variant="secondary" className="text-[10px]">
                                        {Math.round((repProposals - proposalsMedian) * 10) / 10} vs mediana
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px]">En mediana</Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                                  <span className="text-muted-foreground">Tiempo Sistema</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{repSystemTime} hrs</span>
                                    {repSystemTime < systemTimeMedian ? (
                                      <Badge variant="success" className="text-[10px]">
                                        -{Math.round((systemTimeMedian - repSystemTime) * 10) / 10} hrs vs mediana
                                      </Badge>
                                    ) : repSystemTime > systemTimeMedian ? (
                                      <Badge variant="secondary" className="text-[10px]">
                                        +{Math.round((repSystemTime - systemTimeMedian) * 10) / 10} hrs vs mediana
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px]">En mediana</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <h3 className="text-sm font-semibold text-foreground mb-3">Información del Rep</h3>
                              <div className="space-y-2 text-xs">
                                {repData && (
                                  <>
                                    <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                                      <span className="text-muted-foreground">Cierres</span>
                                      <span className="font-semibold">{repData.closes}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                                      <span className="text-muted-foreground">Precisión</span>
                                      <span className="font-semibold text-emerald-600">{repData.accuracy}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                                      <span className="text-muted-foreground">Tendencia</span>
                                      <span className="font-semibold">
                                        <i className={cn("text-xs", repData.trend === "up" ? "fa-solid fa-arrow-up text-emerald-600" : repData.trend === "down" ? "fa-solid fa-arrow-down text-destructive" : "fa-solid fa-minus text-muted-foreground")} />
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Reporting Agent Activity - Visible to both */}
          <div>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-robot text-primary" />
                  ¿Cómo se generó este reporte?
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  El agente de Reporting sincronizó datos de múltiples fuentes, procesó actividades, calculó métricas y generó insights automáticamente. Todo en tiempo real.
                </p>
                <AgentActivityLog activities={AGENT_ACTIVITIES} />
              </CardContent>
            </Card>
          </div>

          {/* Export & Share */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm">
              <i className="fa-solid fa-download mr-2" />
              Descargar PDF
            </Button>
            <Button variant="outline" size="sm">
              <i className="fa-solid fa-share-nodes mr-2" />
              Compartir
            </Button>
            <Button size="sm">
              <i className="fa-solid fa-refresh mr-2" />
              Actualizar Ahora
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
