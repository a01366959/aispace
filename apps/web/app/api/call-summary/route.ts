import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/call-summary
 *
 * Takes a real transcript + call context and returns an AI-generated:
 *   - summary
 *   - suggested tasks (with due dates)
 *   - draft follow-up message
 *
 * Uses OpenAI-compatible API (works with OpenAI, Groq, Together, etc.)
 */

interface CallSummaryRequest {
  transcript: string;
  contact: { name: string; company: string; role: string; phone: string };
  deal: { name: string; stage: string; value: string };
  repNotes: string;
  repName: string;
}

interface SuggestedTask {
  id: string;
  label: string;
  dueDate: string;
  type: "task" | "follow_up" | "quote";
}

interface CallSummaryResponse {
  summary: string;
  tasks: SuggestedTask[];
  followUpMessage: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured. Add it to .env.local" },
      { status: 500 }
    );
  }

  const body = (await req.json()) as CallSummaryRequest;
  const { transcript, contact, deal, repNotes, repName } = body;

  if (!transcript || transcript.trim().length < 10) {
    return NextResponse.json(
      { error: "Transcript is too short to summarize" },
      { status: 400 }
    );
  }

  const systemPrompt = `Eres un asistente de ventas para GDT (Grupo Diagnóstico Toluca), un laboratorio de análisis clínicos y medicina ocupacional en Toluca, México.

Tu trabajo es analizar la transcripción de una llamada de ventas y generar:
1. Un resumen ejecutivo en español de la llamada (300 palabras máximo)
2. Una lista de tareas sugeridas con fechas de vencimiento
3. Un mensaje corto de seguimiento para enviar al cliente por WhatsApp/SMS

Contexto del deal:
- Cliente: ${contact.name} (${contact.role}) de ${contact.company}
- Teléfono: ${contact.phone}
- Deal: ${deal.name}
- Etapa actual: ${deal.stage}
- Valor: ${deal.value}
- Representante: ${repName}
${repNotes ? `- Notas del representante: ${repNotes}` : ""}

Responde SIEMPRE en formato JSON válido con esta estructura exacta:
{
  "summary": "Resumen ejecutivo de la llamada...",
  "tasks": [
    {"id": "t1", "label": "Descripción de la tarea", "dueDate": "Hoy|Mañana|Esta semana|Próxima semana", "type": "task|follow_up|quote"}
  ],
  "followUpMessage": "Mensaje de seguimiento corto para WhatsApp..."
}

Reglas:
- Genera entre 2 y 5 tareas basadas en lo que se discutió
- El mensaje de seguimiento debe ser profesional, corto (máximo 2 oraciones) y firmado por el representante
- Si la transcripción es pobre o incompleta, haz tu mejor esfuerzo con lo disponible
- SOLO JSON, sin texto adicional antes o después`;

  const userPrompt = `Transcripción de la llamada:\n\n${transcript}`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM API error:", response.status, errorText);
      return NextResponse.json(
        { error: `LLM API returned ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from LLM" },
        { status: 502 }
      );
    }

    const parsed: CallSummaryResponse = JSON.parse(content);

    // Ensure task IDs are unique
    parsed.tasks = parsed.tasks.map((t, i) => ({
      ...t,
      id: `t${i + 1}`,
    }));

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Call summary error:", err);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
