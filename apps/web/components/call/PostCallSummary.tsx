"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export interface SuggestedTask {
  id: string;
  label: string;
  dueDate: string;
  type: "follow_up" | "quote" | "meeting" | "task";
}

export interface PostCallSummaryProps {
  contactName: string;
  company: string;
  duration: string;
  summary: string;
  suggestedTasks: SuggestedTask[];
  onEditSummary: (summary: string) => void;
  onConfirm: () => void;
  onDiscard: () => void;
  onToggleTask: (taskId: string) => void;
  selectedTaskIds: Set<string>;
  isGenerating: boolean;
}

const taskIcons: Record<string, string> = {
  follow_up: "fa-phone-arrow-up-right",
  quote: "fa-file-invoice-dollar",
  meeting: "fa-calendar-check",
  task: "fa-circle-check",
};

function PostCallSummary({
  contactName,
  company,
  duration,
  summary,
  suggestedTasks,
  onEditSummary,
  onConfirm,
  onDiscard,
  onToggleTask,
  selectedTaskIds,
  isGenerating,
}: PostCallSummaryProps) {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-muted border-t-primary animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">Generando resumen...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Analizando notas de la llamada con {contactName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Resumen de llamada</h2>
          <p className="text-sm text-muted-foreground">
            {contactName} · {company} · {duration}
          </p>
        </div>
        <Badge variant="success">
          <i className="fa-solid fa-check mr-1" />
          Llamada completada
        </Badge>
      </div>

      <Separator />

      {/* Editable summary */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-sparkles text-primary text-xs" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Resumen generado por IA
          </span>
        </div>
        <Textarea
          value={summary}
          onChange={(e) => onEditSummary(e.target.value)}
          className="min-h-[100px] text-sm"
        />
      </div>

      {/* Suggested tasks */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-list-check text-primary text-xs" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Tareas sugeridas
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {suggestedTasks.map((task) => (
            <Card
              key={task.id}
              className={`cursor-pointer transition-colors ${
                selectedTaskIds.has(task.id) ? "border-primary bg-accent/50" : "hover:bg-muted/50"
              }`}
              onClick={() => onToggleTask(task.id)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div
                  className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedTaskIds.has(task.id)
                      ? "border-primary bg-primary text-white"
                      : "border-input"
                  }`}
                >
                  {selectedTaskIds.has(task.id) && <i className="fa-solid fa-check text-[10px]" />}
                </div>
                <i className={`fa-solid ${taskIcons[task.type] ?? "fa-circle-check"} text-muted-foreground text-sm`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.label}</p>
                  <p className="text-xs text-muted-foreground">Vence: {task.dueDate}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button variant="ghost" onClick={onDiscard}>
          Descartar
        </Button>
        <Button onClick={onConfirm}>
          <i className="fa-solid fa-check mr-1" />
          Guardar y registrar actividad
        </Button>
      </div>
    </div>
  );
}

export { PostCallSummary };
