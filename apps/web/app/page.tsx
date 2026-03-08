"use client";

import { useState } from "react";

/* ════════════════════════════════════════════════════════════════════════════
   Mock data — GDT (Grupo Diagnóstico Toluca) conversations
   ════════════════════════════════════════════════════════════════════════════ */

type Segment = "ballenas" | "tiburones" | "atunes" | "truchas" | "charales";
type Stage = "prospecto" | "descubrimiento" | "cotización_enviada" | "seguimiento" | "negociación" | "cerrado_ganado" | "cerrado_perdido" | "dormido";

interface Conversation {
  id: string;
  name: string;
  company: string;
  initials: string;
  color: "blue" | "orange" | "green" | "red" | "gray" | "purple";
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
  color: string;
  text: string;
  time: string;
  type: "inbound" | "outbound" | "agent";
  agentTag?: string;
  action?: {
    title: string;
    body: string;
    buttons: { label: string; variant: "primary" | "outline" | "success" | "danger" }[];
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

const CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "Carlos Mendoza",
    company: "Cervecería Toluca S.A.",
    initials: "CM",
    color: "blue",
    segment: "ballenas",
    stage: "cotización_enviada",
    preview: "Esperando aprobación de cotización anual...",
    time: "10:32",
    unread: true,
  },
  {
    id: "2",
    name: "Ana Torres",
    company: "Plásticos Industriales MX",
    initials: "AT",
    color: "orange",
    segment: "tiburones",
    stage: "seguimiento",
    preview: "Seguimiento pendiente — llamar mañana",
    time: "09:15",
    unread: true,
  },
  {
    id: "3",
    name: "Roberto Juárez",
    company: "Metalúrgica del Valle",
    initials: "RJ",
    color: "green",
    segment: "atunes",
    stage: "descubrimiento",
    preview: "Solicita info sobre exámenes ocupacionales",
    time: "Ayer",
    unread: false,
  },
  {
    id: "4",
    name: "Lupita Fernández",
    company: "TransLogística Central",
    initials: "LF",
    color: "purple",
    segment: "tiburones",
    stage: "negociación",
    preview: "Revisando términos del contrato de servicio",
    time: "Ayer",
    unread: false,
  },
  {
    id: "5",
    name: "Jorge Ramírez",
    company: "Alimentos del Bajío",
    initials: "JR",
    color: "gray",
    segment: "charales",
    stage: "prospecto",
    preview: "Primer contacto — referido por Cervecería",
    time: "Lun",
    unread: false,
  },
  {
    id: "6",
    name: "Patricia Sánchez",
    company: "Grupo Farmacéutico GT",
    initials: "PS",
    color: "red",
    segment: "ballenas",
    stage: "dormido",
    preview: "Sin actividad desde hace 45 días",
    time: "12 Jun",
    unread: false,
  },
];

const MESSAGES: Message[] = [
  {
    id: "m1",
    sender: "Carlos Mendoza",
    avatar: "CM",
    color: "blue",
    text: "Buenos días, ya recibí la cotización para los 350 exámenes anuales. Necesito validar con mi director de RH antes de firmar.",
    time: "10:02",
    type: "inbound",
  },
  {
    id: "m2",
    sender: "Tú",
    avatar: "MR",
    color: "blue",
    text: "Perfecto Carlos, quedo al pendiente. ¿Para cuándo crees tener la aprobación? Así agendamos la firma del contrato.",
    time: "10:08",
    type: "outbound",
  },
  {
    id: "m3",
    sender: "Carlos Mendoza",
    avatar: "CM",
    color: "blue",
    text: "Calculo que entre miércoles y jueves de esta semana. Te confirmo.",
    time: "10:15",
    type: "inbound",
  },
  {
    id: "m4",
    sender: "AI Sales Agent",
    avatar: "AI",
    color: "blue",
    text: "He analizado la conversación con Cervecería Toluca. El deal está en cotización enviada con alta probabilidad de cierre. Recomiendo programar un seguimiento para el miércoles.",
    time: "10:20",
    type: "agent",
    agentTag: "Follow-Up Agent",
    action: {
      title: "📋 Tarea sugerida",
      body: "Llamar a Carlos Mendoza el miércoles a las 10:30 AM para confirmar avance de aprobación interna. Deal value: $285,000 MXN.",
      buttons: [
        { label: "Aprobar tarea", variant: "success" },
        { label: "Editar", variant: "outline" },
        { label: "Rechazar", variant: "danger" },
      ],
    },
  },
  {
    id: "m5",
    sender: "AI Sales Agent",
    avatar: "AI",
    color: "blue",
    text: "También detecté que Cervecería Toluca no ha renovado el servicio de audiometrías. Puedo preparar un borrador de upsell.",
    time: "10:22",
    type: "agent",
    agentTag: "Sales Assistant",
    action: {
      title: "💡 Oportunidad de upsell",
      body: "Audiometrías para 350 empleados — estimado $42,000 MXN adicionales. ¿Preparo la cotización complementaria?",
      buttons: [
        { label: "Preparar cotización", variant: "primary" },
        { label: "Ignorar", variant: "outline" },
      ],
    },
  },
];

const TASKS: Task[] = [
  { id: "t1", title: "Seguimiento cotización anual", due: "Mié 10:30 AM", dueStatus: "upcoming", done: false },
  { id: "t2", title: "Enviar propuesta audiometrías", due: "Jue 12:00 PM", dueStatus: "safe", done: false },
  { id: "t3", title: "Confirmar datos de facturación", due: "Ayer", dueStatus: "overdue", done: false },
];

const ACTIVITIES: Activity[] = [
  { type: "agent", text: "AI detectó oportunidad de upsell en audiometrías", date: "Hoy 10:22" },
  { type: "agent",  text: "AI creó tarea de seguimiento para miércoles", date: "Hoy 10:20" },
  { type: "call", text: "Llamada con Carlos — 8 min", date: "Hoy 10:02" },
  { type: "email", text: "Cotización anual enviada por correo", date: "Ayer 16:45" },
  { type: "task", text: "Revisión de precios completada", date: "Lun 14:00" },
];

/* ════════════════════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════════════════════ */

const STAGE_LABELS: Record<Stage, string> = {
  prospecto: "Prospecto",
  descubrimiento: "Descubrimiento",
  cotización_enviada: "Cotización enviada",
  seguimiento: "Seguimiento",
  negociación: "Negociación",
  cerrado_ganado: "Cerrado ganado",
  cerrado_perdido: "Cerrado perdido",
  dormido: "Dormido",
};

const STAGE_CLASS: Record<Stage, string> = {
  prospecto: "prospect",
  descubrimiento: "discovery",
  cotización_enviada: "quote-sent",
  seguimiento: "follow-up",
  negociación: "follow-up",
  cerrado_ganado: "closed-won",
  cerrado_perdido: "closed-lost",
  dormido: "closed-lost",
};

const SEGMENT_LABELS: Record<Segment, string> = {
  ballenas: "Ballena",
  tiburones: "Tiburón",
  atunes: "Atún",
  truchas: "Trucha",
  charales: "Charal",
};

/* ════════════════════════════════════════════════════════════════════════════
   Icons (inline SVG)
   ════════════════════════════════════════════════════════════════════════════ */

function IconInbox() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function IconDeal() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconTask() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconMore() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function IconPaperclip() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════════════════ */

export default function InboxPage() {
  const [activeConv, setActiveConv] = useState("1");
  const [activeFilter, setActiveFilter] = useState("todos");

  const selected = CONVERSATIONS.find((c) => c.id === activeConv) ?? CONVERSATIONS[0];

  return (
    <div className="app-shell">
      {/* ── Nav Sidebar ──────────────────────────────────────────── */}
      <nav className="nav-sidebar" aria-label="Navegación principal">
        <div className="nav-logo">AI</div>

        <button className="nav-item active" title="Inbox" aria-current="page">
          <IconInbox />
          <span className="badge">3</span>
        </button>
        <button className="nav-item" title="Deals">
          <IconDeal />
        </button>
        <button className="nav-item" title="Tareas">
          <IconTask />
        </button>
        <button className="nav-item" title="Calendario">
          <IconCalendar />
        </button>
        <button className="nav-item" title="Reportes">
          <IconChart />
        </button>

        <div className="nav-spacer" />
        <div className="nav-avatar" title="Miriam Reyes">MR</div>
      </nav>

      {/* ── Conversation List ────────────────────────────────────── */}
      <aside className="conv-panel" aria-label="Conversaciones">
        <div className="conv-header">
          <div className="conv-header-top">
            <h2>Inbox</h2>
            <div className="conv-header-actions">
              <button className="icon-btn" title="Filtrar"><IconFilter /></button>
              <button className="icon-btn" title="Más opciones"><IconMore /></button>
            </div>
          </div>
          <div className="conv-search">
            <IconSearch />
            <input type="text" placeholder="Buscar conversación..." />
          </div>
        </div>

        <div className="conv-filters">
          {["todos", "sin leer", "activos", "agente"].map((f) => (
            <button
              key={f}
              className={`filter-tab ${activeFilter === f ? "active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="conv-list">
          {CONVERSATIONS.map((conv) => (
            <div
              key={conv.id}
              className={`conv-item ${conv.id === activeConv ? "active" : ""} ${conv.unread ? "unread" : ""}`}
              onClick={() => setActiveConv(conv.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") setActiveConv(conv.id); }}
            >
              <div className={`conv-avatar ${conv.color}`}>{conv.initials}</div>
              <div className="conv-content">
                <div className="conv-top-row">
                  <span className="conv-name">{conv.name}</span>
                  <span className="conv-time">{conv.time}</span>
                </div>
                <div className="conv-bottom-row">
                  <span className="conv-preview">{conv.preview}</span>
                  {conv.unread && <span className="conv-unread-dot" />}
                </div>
                <div className="conv-bottom-row" style={{ marginTop: 4 }}>
                  <span className="conv-preview" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{conv.company}</span>
                  <span className={`conv-segment ${conv.segment}`}>{SEGMENT_LABELS[conv.segment]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Chat Panel ───────────────────────────────────────────── */}
      <main className="chat-panel">
        <header className="chat-header">
          <div className="chat-header-left">
            <div className={`conv-avatar ${selected.color}`}>{selected.initials}</div>
            <div className="chat-header-info">
              <div className="chat-header-name">{selected.name}</div>
              <div className="chat-header-meta">
                <span>{selected.company}</span>
                <span className={`stage-badge ${STAGE_CLASS[selected.stage]}`}>
                  {STAGE_LABELS[selected.stage]}
                </span>
              </div>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="icon-btn" title="Llamar"><IconPhone /></button>
            <button className="icon-btn" title="Más opciones"><IconMore /></button>
          </div>
        </header>

        <div className="chat-messages">
          <div className="chat-date-divider"><span>Hoy</span></div>

          {MESSAGES.map((msg) => (
            <div key={msg.id} className={`message ${msg.type}`}>
              <div className={`message-avatar ${msg.type === "agent" ? "" : ""}`} style={{ background: msg.type === "outbound" ? "var(--blue-600)" : msg.type === "agent" ? "linear-gradient(135deg, var(--blue-600), #2E90FA)" : `var(--${msg.color}-600)` }}>
                {msg.avatar}
              </div>
              <div className="message-body">
                <span className="message-sender">
                  {msg.type === "agent" && msg.agentTag && <span className="agent-tag">🤖 {msg.agentTag}</span>}
                  {msg.type !== "agent" && msg.sender}
                </span>
                <div className="message-bubble">{msg.text}</div>
                {msg.action && (
                  <div className="agent-action-card">
                    <div className="agent-action-header">{msg.action.title}</div>
                    <div className="agent-action-body">{msg.action.body}</div>
                    <div className="agent-action-buttons">
                      {msg.action.buttons.map((btn) => (
                        <button key={btn.label} className={`btn btn-${btn.variant}`}>{btn.label}</button>
                      ))}
                    </div>
                  </div>
                )}
                <span className="message-time">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input-area">
          <div className="chat-input-box">
            <button className="icon-btn" title="Adjuntar"><IconPaperclip /></button>
            <textarea rows={1} placeholder="Escribe un mensaje..." />
            <div className="chat-input-actions">
              <button className="send-btn" title="Enviar">
                <IconSend />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Detail Panel ─────────────────────────────────────────── */}
      <aside className="detail-panel" aria-label="Detalles del contacto">
        <div className="detail-header">
          <div className={`detail-avatar`} style={{ background: `var(--${selected.color}-600)` }}>
            {selected.initials}
          </div>
          <div className="detail-name">{selected.name}</div>
          <div className="detail-company">{selected.company}</div>
        </div>

        {/* Deal info */}
        <div className="detail-section">
          <div className="detail-section-title">Información del deal</div>
          <div className="detail-field">
            <span className="detail-field-label">Etapa</span>
            <span className={`stage-badge ${STAGE_CLASS[selected.stage]}`}>{STAGE_LABELS[selected.stage]}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Valor</span>
            <span className="detail-field-value">$285,000 MXN</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Segmento</span>
            <span className={`conv-segment ${selected.segment}`}>{SEGMENT_LABELS[selected.segment]}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Vendedor</span>
            <span className="detail-field-value">Miriam Reyes</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Creado</span>
            <span className="detail-field-value">15 May 2025</span>
          </div>
        </div>

        {/* Risk */}
        <div className="detail-section">
          <div className="detail-section-title">Riesgo</div>
          <div className="risk-indicator medium">
            <IconWarning /> Seguimiento pendiente — 3 días
          </div>
        </div>

        {/* Tasks */}
        <div className="detail-section">
          <div className="detail-section-title">Tareas ({TASKS.length})</div>
          {TASKS.map((task) => (
            <div key={task.id} className="task-card">
              <div className={`task-checkbox ${task.done ? "done" : ""}`} />
              <div className="task-info">
                <div className="task-title">{task.title}</div>
                <div className="task-meta">
                  <span className={`task-due ${task.dueStatus}`}>{task.due}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Activity */}
        <div className="detail-section">
          <div className="detail-section-title">Actividad reciente</div>
          {ACTIVITIES.map((act, i) => (
            <div key={i} className="activity-item">
              <div className={`activity-dot ${act.type}`} />
              <div>
                <div className="activity-text">{act.text}</div>
                <div className="activity-date">{act.date}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
