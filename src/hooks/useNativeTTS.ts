import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chunkSpeechText } from "@/lib/school/professor-tts";

export type NativeTTSState = "unsupported" | "idle" | "playing" | "paused";

type Options = {
  lang?: string;
  rate?: number;
  pitch?: number;
};

function getNativeSupport() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function useNativeTTS(options: Options = {}) {
  const { lang = "pt-BR", rate = 1, pitch = 1 } = options;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [state, setState] = useState<NativeTTSState>(() => (getNativeSupport() ? "idle" : "unsupported"));
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<string[]>([]);

  const refreshVoices = useCallback(() => {
    if (!getNativeSupport()) return;
    setVoices(window.speechSynthesis.getVoices());
  }, []);

  useEffect(() => {
    if (!getNativeSupport()) return;
    refreshVoices();
    const synthesis = window.speechSynthesis;
    synthesis.addEventListener("voiceschanged", refreshVoices);
    return () => synthesis.removeEventListener("voiceschanged", refreshVoices);
  }, [refreshVoices]);

  const ptBrVoices = useMemo(
    () => voices.filter((voice) => voice.lang.toLowerCase().startsWith(lang.toLowerCase().split("-")[0])),
    [lang, voices],
  );

  const preferredVoice = useMemo(
    () =>
      voices.find((voice) => voice.lang.toLowerCase() === lang.toLowerCase()) ??
      ptBrVoices[0] ??
      null,
    [lang, ptBrVoices, voices],
  );

  const stop = useCallback(() => {
    if (!getNativeSupport()) return;
    window.speechSynthesis.cancel();
    queueRef.current = [];
    utteranceRef.current = null;
    setState("idle");
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!getNativeSupport() || !text.trim()) return false;
      const synthesis = window.speechSynthesis;
      synthesis.cancel();
      queueRef.current = chunkSpeechText(text, 200);
      const next = queueRef.current.shift();
      if (!next) return false;

      const utterance = new SpeechSynthesisUtterance(next);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => setState("playing");
      utterance.onpause = () => setState("paused");
      utterance.onresume = () => setState("playing");
      utterance.onend = () => {
        const remaining = queueRef.current;
        const nextChunk = remaining.shift();
        if (nextChunk) {
          utteranceRef.current = null;
          void speak(nextChunk);
          return;
        }
        utteranceRef.current = null;
        setState("idle");
      };
      utterance.onerror = () => {
        utteranceRef.current = null;
        setState("idle");
      };

      utteranceRef.current = utterance;
      synthesis.speak(utterance);
      return true;
    },
    [lang, pitch, preferredVoice, rate],
  );

  const pause = useCallback(() => {
    if (!getNativeSupport()) return;
    window.speechSynthesis.pause();
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    if (!getNativeSupport()) return;
    window.speechSynthesis.resume();
    setState("playing");
  }, []);

  useEffect(() => {
    const handler = () => stop();
    window.addEventListener("ccc:stop-audio", handler);
    return () => window.removeEventListener("ccc:stop-audio", handler);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return {
    supported: getNativeSupport(),
    hasPreferredLanguage: ptBrVoices.length > 0,
    voices,
    preferredVoice,
    state,
    speak,
    pause,
    resume,
    stop,
  };
}
