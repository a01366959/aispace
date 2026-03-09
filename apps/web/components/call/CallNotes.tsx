"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";

export interface CallNotesProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function CallNotes({ value, onChange, disabled }: CallNotesProps) {
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-pen-to-square text-muted-foreground text-xs" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Notas de la llamada
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escribe notas durante la llamada..."
        disabled={disabled}
        className="flex-1 resize-none text-sm min-h-[120px] bg-muted/50 border-dashed focus:border-solid"
      />
      <p className="text-[11px] text-muted-foreground">
        Estas notas se usarán para generar el resumen automático al terminar la llamada.
      </p>
    </div>
  );
}

export { CallNotes };
