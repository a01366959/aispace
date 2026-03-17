"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSpeechTranscription } from "@/components/call/useSpeechTranscription";
import type { TranscriptEntry } from "@/components/call/LiveTranscript";

/* ═══════════════════════════════════════════════════ */
/*  Types                                              */
/* ═══════════════════════════════════════════════════ */

interface SuggestedTask {
  id: string;
  label: string;
  dueDate: string;
  type: "task" | "follow_up" | "quote";
}

interface AISummary {
  summary: string;
  tasks: SuggestedTask[];
  followUpMessage: string;
}

/* ═══════════════════════════════════════════════════ */
/*  Page                                               */
/* ═══════════════════════════════════════════════════ */

export default function TranscribePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [aiResult, setAiResult] = useState<AISummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const allEntriesRef = useRef<TranscriptEntry[]>([]);

  const onEntry = useCallback((entry: TranscriptEntry) => {
    allEntriesRef.current = [...allEntriesRef.current.filter(e => e.id !== "speech-interim"), entry];
  }, []);

  const speech = useSpeechTranscription({
    lang: "es-MX",
    isActive: isRecording,
    onEntry,
  });

  // Keep allEntriesRef in sync
  useEffect(() => {
    allEntriesRef.current = speech.entries;
  }, [speech.entries]);

  // Timer
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [speech.entries]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleToggle = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setAiResult(null);
      setGenerateError(null);
      setElapsed(0);
      speech.clear();
      allEntriesRef.current = [];
      setIsRecording(true);
    }
  };

  const handleGenerateSummary = async () => {
    const finalEntries = speech.entries.filter(e => e.isFinal);
    if (finalEntries.length === 0) return;

    const transcriptText = finalEntries.map(e => e.text).join("\n");
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const res = await fetch("/api/call-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptText,
          contact: { name: "Demo Contact", company: "Demo Company", role: "Contacto", phone: "N/A" },
          deal: { name: "Demo", stage: "Descubrimiento", value: "N/A" },
          repNotes: "",
          repName: "Demo User",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `API returned ${res.status}`);
      }

      const data = await res.json();
      setAiResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setGenerateError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const finalEntries = speech.entries.filter(e => e.isFinal);
  const interimEntry = speech.entries.find(e => !e.isFinal);
  const hasTranscript = finalEntries.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ──────────────────────────────────── */}
      <header className="border-b bg-card px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Transcripción en Vivo</h1>
              <p className="text-sm text-muted-foreground">
                Micrófono del navegador · Web Speech API · Gratis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="text-sm font-mono font-semibold text-red-700">{formatTimer(elapsed)}</span>
              </div>
            )}
            <span className="text-xs px-2 py-1 rounded bg-green-50 border border-green-200 text-green-700 font-medium">
              $0.00
            </span>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────── */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        {/* Browser support warning */}
        {!speech.isSupported && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Navegador no compatible.</strong> Web Speech API requiere Chrome, Edge, o Safari.
            Abre esta página en <strong>Google Chrome</strong> para transcripción gratuita.
          </div>
        )}

        {/* Error */}
        {speech.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {speech.error}
          </div>
        )}

        {/* ── Mic button ──────────────────────────── */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleToggle}
            disabled={!speech.isSupported}
            className={cn(
              "relative h-28 w-28 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4",
              isRecording
                ? "bg-red-500 hover:bg-red-600 focus:ring-red-200 shadow-lg shadow-red-200"
                : "bg-primary hover:bg-primary/90 focus:ring-blue-200 shadow-lg shadow-blue-200",
              !speech.isSupported && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Pulse rings when recording */}
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full border-4 border-red-400/40 animate-ping" />
                <span
                  className="absolute inset-0 rounded-full border-2 border-red-300/30 transition-transform duration-150"
                  style={{ transform: `scale(${1 + speech.audioLevel * 0.3})` }}
                />
              </>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 relative z-10">
              {isRecording ? (
                <rect x="6" y="6" width="12" height="12" rx="2" />
              ) : (
                <>
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </>
              )}
            </svg>
          </button>
          <p className="text-sm text-muted-foreground text-center">
            {isRecording
              ? "Grabando... habla con claridad. Haz clic para detener."
              : hasTranscript
              ? "Grabación detenida. Puedes reiniciar o generar resumen."
              : "Haz clic para empezar a transcribir con tu micrófono."}
          </p>

          {/* Audio level bar */}
          {isRecording && (
            <div className="flex items-center gap-1 h-6">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 rounded-full transition-all duration-100",
                    speech.audioLevel * 20 > i ? "bg-primary" : "bg-muted"
                  )}
                  style={{
                    height: `${Math.max(4, Math.min(24, speech.audioLevel * 40 * (0.6 + Math.sin(i * 0.7) * 0.4)))}px`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Live transcript ─────────────────────── */}
        <div className="rounded-xl border bg-card shadow-sm flex-1 min-h-[200px] flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Transcripción en vivo
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasTranscript && (
                <span className="text-xs text-muted-foreground">
                  {finalEntries.length} segmento{finalEntries.length !== 1 ? "s" : ""}
                </span>
              )}
              {isRecording && speech.isListening && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  Escuchando
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[400px]">
            {!hasTranscript && !interimEntry && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 mb-3 opacity-30">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
                <p className="text-sm">Esperando audio...</p>
                <p className="text-xs mt-1">Habla para ver la transcripción aquí</p>
              </div>
            )}

            {finalEntries.map((entry) => (
              <div key={entry.id} className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  🎙
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground">Micrófono</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{entry.timestamp}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{entry.text}</p>
                </div>
              </div>
            ))}

            {/* Interim (in-progress) text */}
            {interimEntry && (
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  🎙
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    {interimEntry.text}
                    <span className="inline-flex ml-1 animate-pulse">●</span>
                  </p>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Actions ─────────────────────────────── */}
        {!isRecording && hasTranscript && !aiResult && (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className={cn(
                "px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center gap-2",
                isGenerating
                  ? "bg-muted text-muted-foreground cursor-wait"
                  : "bg-primary hover:bg-primary/90 shadow-lg shadow-blue-200"
              )}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generando resumen con IA...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Generar Resumen y Acciones con IA
                </>
              )}
            </button>
            {generateError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 max-w-md text-center">
                {generateError}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Requiere OPENAI_API_KEY (o Groq/Together) configurado en .env.local
            </p>
          </div>
        )}

        {/* ── AI Summary result ───────────────────── */}
        {aiResult && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-xl border bg-card shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Resumen generado por IA
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiResult.summary}</p>
            </div>

            {/* Tasks */}
            {aiResult.tasks.length > 0 && (
              <div className="rounded-xl border bg-card shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tareas sugeridas
                  </span>
                </div>
                <div className="space-y-2">
                  {aiResult.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        task.type === "follow_up" && "bg-blue-100 text-blue-700",
                        task.type === "quote" && "bg-amber-100 text-amber-700",
                        task.type === "task" && "bg-green-100 text-green-700",
                      )}>
                        {task.type === "follow_up" ? "Seguimiento" : task.type === "quote" ? "Cotización" : "Tarea"}
                      </span>
                      <span className="text-sm flex-1">{task.label}</span>
                      <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up message */}
            {aiResult.followUpMessage && (
              <div className="rounded-xl border bg-card shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Mensaje de seguimiento
                  </span>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-sm">{aiResult.followUpMessage}</div>
              </div>
            )}

            {/* Reset */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  setAiResult(null);
                  speech.clear();
                  setElapsed(0);
                }}
                className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
              >
                Nueva transcripción
              </button>
            </div>
          </div>
        )}

        {/* ── How it works ────────────────────────── */}
        {!isRecording && !hasTranscript && !aiResult && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="rounded-xl border bg-card p-5 text-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-primary flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
              <h3 className="font-semibold text-sm mb-1">Graba la llamada</h3>
              <p className="text-xs text-muted-foreground">
                Haz clic en el micrófono y pon la llamada en altavoz. El navegador transcribe todo gratis.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 text-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-primary flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
              <h3 className="font-semibold text-sm mb-1">Transcripción en vivo</h3>
              <p className="text-xs text-muted-foreground">
                Web Speech API convierte tu voz a texto en tiempo real. Sin costos, sin APIs externas.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 text-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-primary flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
              <h3 className="font-semibold text-sm mb-1">IA extrae acciones</h3>
              <p className="text-xs text-muted-foreground">
                Al terminar, un LLM genera resumen, tareas y mensaje de seguimiento automáticamente.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>GDT — Transcripción gratuita</span>
          <div className="flex items-center gap-3">
            <span>Web Speech API</span>
            <span>·</span>
            <span>Chrome / Edge</span>
            <span>·</span>
            <span className="text-green-600 font-medium">Costo: $0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
