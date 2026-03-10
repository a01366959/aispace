"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TranscriptEntry } from "./LiveTranscript";

/**
 * Real-time speech-to-text using the browser's built-in Web Speech API.
 * - Cost: $0 (runs locally in Chrome/Edge)
 * - Language: es-MX (Mexican Spanish)
 * - Captures both sides of a phone call via speakerphone/mic
 *
 * Fallback plan: if Web Speech API is unavailable, transcript entries
 * must be added manually or via a server-side Whisper pipeline.
 */

interface UseSpeechTranscriptionOptions {
  /** BCP-47 language tag. Default: "es-MX" */
  lang?: string;
  /** Whether transcription is currently active */
  isActive: boolean;
  /** Called with new interim/final results */
  onEntry?: (entry: TranscriptEntry) => void;
}

interface UseSpeechTranscriptionReturn {
  /** All accumulated transcript entries */
  entries: TranscriptEntry[];
  /** Whether the browser supports Web Speech API */
  isSupported: boolean;
  /** Whether the mic is currently listening */
  isListening: boolean;
  /** Current audio input level (0–1), for UI meters */
  audioLevel: number;
  /** Error message if something went wrong */
  error: string | null;
  /** Manually start listening */
  start: () => void;
  /** Manually stop listening */
  stop: () => void;
  /** Clear all entries */
  clear: () => void;
}

export function useSpeechTranscription({
  lang = "es-MX",
  isActive,
  onEntry,
}: UseSpeechTranscriptionOptions): UseSpeechTranscriptionReturn {
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const entryCountRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const onEntryRef = useRef(onEntry);
  onEntryRef.current = onEntry;

  // Check browser support
  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const formatTimestamp = useCallback((ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  // Audio level metering
  const startAudioMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
        setAudioLevel(Math.min(avg / 128, 1));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Mic access denied or not available — non-fatal, transcription still works
    }
  }, []);

  const stopAudioMeter = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const start = useCallback(() => {
    if (!isSupported || recognitionRef.current) return;

    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setError("Web Speech API no disponible en este navegador");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    startTimeRef.current = Date.now();

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!;
        const transcript = result[0]!.transcript.trim();
        if (!transcript) continue;

        const isFinal = result.isFinal;
        const elapsed = Date.now() - startTimeRef.current;
        const entryId = isFinal
          ? `speech-${entryCountRef.current++}`
          : `speech-interim`;

        const entry: TranscriptEntry = {
          id: entryId,
          speaker: "rep", // Mic captures both sides — marked as "rep" since it's the local mic
          text: transcript,
          timestamp: formatTimestamp(elapsed),
          isFinal,
        };

        if (isFinal) {
          setEntries((prev) => {
            // Replace any interim entry + append final
            const filtered = prev.filter((e) => e.id !== "speech-interim");
            return [...filtered, entry];
          });
          onEntryRef.current?.(entry);
        } else {
          setEntries((prev) => {
            const filtered = prev.filter((e) => e.id !== "speech-interim");
            return [...filtered, entry];
          });
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") return; // Normal pause
      if (event.error === "aborted") return; // User stopped
      setError(`Error de reconocimiento: ${event.error}`);
    };

    recognition.onend = () => {
      // Auto-restart if still active (Chrome stops after ~60s of silence)
      if (recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      startAudioMeter();
    } catch {
      setError("No se pudo iniciar el reconocimiento de voz");
    }
  }, [isSupported, lang, formatTimestamp, startAudioMeter]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null; // Prevent auto-restart in onend
      ref.stop();
      setIsListening(false);
      stopAudioMeter();
    }
  }, [stopAudioMeter]);

  const clear = useCallback(() => {
    setEntries([]);
    entryCountRef.current = 0;
  }, []);

  // Start/stop based on isActive prop
  useEffect(() => {
    if (isActive) {
      start();
    } else {
      stop();
    }
    return () => stop();
  }, [isActive, start, stop]);

  return { entries, isSupported, isListening, audioLevel, error, start, stop, clear };
}
