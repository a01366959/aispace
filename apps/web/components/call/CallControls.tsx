"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

export interface CallControlsProps {
  isMuted: boolean;
  isOnHold: boolean;
  isSpeaker: boolean;
  onToggleMute: () => void;
  onToggleHold: () => void;
  onToggleSpeaker: () => void;
  onHangup: () => void;
}

function CallControls({
  isMuted,
  isOnHold,
  isSpeaker,
  onToggleMute,
  onToggleHold,
  onToggleSpeaker,
  onHangup,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
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

      {/* Hangup — visually dominant */}
      <button
        onClick={onHangup}
        aria-label="Colgar llamada"
        className="flex items-center gap-2.5 h-14 px-6 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold shadow-lg shadow-red-600/30 transition-all"
      >
        <i className="fa-solid fa-phone-hangup text-lg" />
        <span className="text-sm">Colgar</span>
      </button>
    </div>
  );
}

export { CallControls };
