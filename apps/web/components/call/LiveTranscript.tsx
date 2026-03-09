"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface TranscriptEntry {
  id: string;
  speaker: "rep" | "client";
  text: string;
  timestamp: string;
  isFinal: boolean;
}

export interface LiveTranscriptProps {
  entries: TranscriptEntry[];
  isActive: boolean;
  contactName: string;
  repName?: string;
}

function LiveTranscript({ entries, isActive, contactName, repName = "Tú" }: LiveTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-closed-captioning text-xs text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Transcripción en vivo
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isActive && (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
              <span className="text-[10px] font-medium text-destructive uppercase">REC</span>
            </>
          )}
          <Badge variant="muted" className="text-[9px] ml-1.5 gap-1">
            <svg viewBox="0 0 60 20" className="h-2.5 w-auto" aria-label="Quo">
              <text x="0" y="15" className="fill-current" style={{ fontSize: "16px", fontWeight: 700, fontFamily: "Inter Tight, sans-serif" }}>Quo</text>
            </svg>
            API
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {entries.length === 0 && isActive && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <i className="fa-solid fa-waveform-lines text-2xl mb-2 opacity-50" />
            <p className="text-xs">Esperando audio...</p>
          </div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="flex gap-2.5">
            <div className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
              entry.speaker === "rep"
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground"
            )}>
              {entry.speaker === "rep" ? "T" : contactName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-semibold">
                  {entry.speaker === "rep" ? repName : contactName}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">{entry.timestamp}</span>
              </div>
              <p className={cn(
                "text-sm leading-relaxed",
                !entry.isFinal && "text-muted-foreground italic"
              )}>
                {entry.text}
                {!entry.isFinal && (
                  <span className="inline-flex ml-1">
                    <span className="animate-pulse">●</span>
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export { LiveTranscript };
