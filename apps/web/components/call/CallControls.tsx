"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

export interface CallControlsProps {
  isMuted: boolean;
  isOnHold: boolean;
  isSpeaker: boolean;
  showDialpad: boolean;
  onToggleMute: () => void;
  onToggleHold: () => void;
  onToggleSpeaker: () => void;
  onToggleDialpad: () => void;
  onHangup: () => void;
}

function CallControls({
  isMuted,
  isOnHold,
  isSpeaker,
  showDialpad,
  onToggleMute,
  onToggleHold,
  onToggleSpeaker,
  onToggleDialpad,
  onHangup,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Tooltip content={isMuted ? "Activar micrófono" : "Silenciar"} side="top">
        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="icon"
          onClick={onToggleMute}
          className="h-12 w-12 rounded-full"
          aria-label={isMuted ? "Activar micrófono" : "Silenciar"}
        >
          <i className={cn("fa-solid text-base", isMuted ? "fa-microphone-slash" : "fa-microphone")} />
        </Button>
      </Tooltip>

      <Tooltip content={isOnHold ? "Reanudar" : "En espera"} side="top">
        <Button
          variant={isOnHold ? "warning" : "outline"}
          size="icon"
          onClick={onToggleHold}
          className="h-12 w-12 rounded-full"
          aria-label={isOnHold ? "Reanudar llamada" : "Poner en espera"}
        >
          <i className={cn("fa-solid text-base", isOnHold ? "fa-play" : "fa-pause")} />
        </Button>
      </Tooltip>

      <Tooltip content={isSpeaker ? "Desactivar altavoz" : "Altavoz"} side="top">
        <Button
          variant={isSpeaker ? "default" : "outline"}
          size="icon"
          onClick={onToggleSpeaker}
          className="h-12 w-12 rounded-full"
          aria-label={isSpeaker ? "Desactivar altavoz" : "Activar altavoz"}
        >
          <i className={cn("fa-solid text-base", isSpeaker ? "fa-volume-high" : "fa-volume-low")} />
        </Button>
      </Tooltip>

      <Tooltip content={showDialpad ? "Ocultar teclado" : "Teclado numérico"} side="top">
        <Button
          variant={showDialpad ? "default" : "outline"}
          size="icon"
          onClick={onToggleDialpad}
          className="h-12 w-12 rounded-full"
          aria-label="Teclado numérico"
        >
          <i className="fa-solid fa-grid-2 text-base" />
        </Button>
      </Tooltip>

      <Tooltip content="Colgar" side="top">
        <Button
          variant="destructive"
          size="icon"
          onClick={onHangup}
          className="h-14 w-14 rounded-full shadow-lg"
          aria-label="Colgar llamada"
        >
          <i className="fa-solid fa-phone-hangup text-lg" />
        </Button>
      </Tooltip>
    </div>
  );
}

export { CallControls };
