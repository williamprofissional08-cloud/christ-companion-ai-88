import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SpeechUnit, StudyPlaybackRate } from "@/lib/study-reader";

export type SyncedTTSState = "unsupported" | "idle" | "playing" | "paused" | "error";

type Options = {
  units: SpeechUnit[];
  initialUnit?: number;
  initialRate?: StudyPlaybackRate;
  onUnitChange?: (unitIndex: number, sectionIndex: number) => void;
  onRateChange?: (rate: StudyPlaybackRate) => void;
};

function supportsSpeech() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function useSyncedTTS({
  units,
  initialUnit = 0,
  initialRate = 1,
  onUnitChange,
  onRateChange,
}: Options) {
  const [state, setState] = useState<SyncedTTSState>("idle");
  const [unitIndex, setUnitIndex] = useState(Math.max(0, initialUnit));
  const [rate, setRateState] = useState<StudyPlaybackRate>(initialRate);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const runRef = useRef(0);
  const indexRef = useRef(Math.max(0, initialUnit));
  const rateRef = useRef<StudyPlaybackRate>(initialRate);
  const stateRef = useRef<SyncedTTSState>("idle");
  const unitChangeRef = useRef(onUnitChange);

  useEffect(() => {
    unitChangeRef.current = onUnitChange;
  }, [onUnitChange]);

  const preferredVoice = useMemo(
    () =>
      voices.find((voice) => voice.lang.toLowerCase() === "pt-br") ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith("pt")) ??
      voices.find((voice) => voice.default) ??
      voices[0] ??
      null,
    [voices],
  );

  const updateState = useCallback((next: SyncedTTSState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    if (!supportsSpeech()) {
      updateState("unsupported");
      return;
    }
    const synth = window.speechSynthesis;
    const refresh = () => setVoices(synth.getVoices());
    refresh();
    synth.addEventListener("voiceschanged", refresh);
    return () => synth.removeEventListener("voiceschanged", refresh);
  }, [updateState]);

  const stop = useCallback((reset = true) => {
    if (!supportsSpeech()) return;
    runRef.current += 1;
    window.speechSynthesis.cancel();
    if (reset) {
      indexRef.current = 0;
      setUnitIndex(0);
    }
    setError(null);
    updateState("idle");
  }, [updateState]);

  const speakAt = useCallback(
    (requestedIndex: number) => {
      if (!supportsSpeech() || !units.length) return false;
      const synth = window.speechSynthesis;
      const safeIndex = Math.max(0, Math.min(units.length - 1, requestedIndex));
      window.dispatchEvent(new Event("ccc:stop-audio"));
      synth.cancel();
      const run = ++runRef.current;
      const speakNext = (nextIndex: number) => {
        if (run !== runRef.current) return;
        const unit = units[nextIndex];
        if (!unit) {
          updateState("idle");
          return;
        }
        indexRef.current = nextIndex;
        setUnitIndex(nextIndex);
        unitChangeRef.current?.(nextIndex, unit.sectionIndex);
        const utterance = new SpeechSynthesisUtterance(unit.text);
        utterance.lang = preferredVoice?.lang ?? "pt-BR";
        utterance.rate = rateRef.current;
        utterance.pitch = 1;
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.onstart = () => {
          if (run === runRef.current) updateState("playing");
        };
        utterance.onend = () => {
          if (run === runRef.current) speakNext(nextIndex + 1);
        };
        utterance.onerror = (event) => {
          if (run !== runRef.current || event.error === "canceled" || event.error === "interrupted") return;
          setError("A voz do dispositivo interrompeu a leitura. Toque em continuar.");
          updateState("error");
        };
        synth.speak(utterance);
      };
      setError(null);
      speakNext(safeIndex);
      return true;
    },
    [preferredVoice, units, updateState],
  );

  const play = useCallback(() => speakAt(indexRef.current), [speakAt]);
  const pause = useCallback(() => {
    if (!supportsSpeech()) return;
    window.speechSynthesis.pause();
    updateState("paused");
  }, [updateState]);
  const resume = useCallback(() => {
    if (!supportsSpeech()) return;
    const synth = window.speechSynthesis;
    if (synth.paused) {
      synth.resume();
      updateState("playing");
    } else {
      speakAt(indexRef.current);
    }
  }, [speakAt, updateState]);
  const seek = useCallback((nextIndex: number) => speakAt(nextIndex), [speakAt]);
  const setRate = useCallback(
    (nextRate: StudyPlaybackRate) => {
      rateRef.current = nextRate;
      setRateState(nextRate);
      onRateChange?.(nextRate);
      if (stateRef.current === "playing") speakAt(indexRef.current);
      if (stateRef.current === "paused") {
        runRef.current += 1;
        window.speechSynthesis.cancel();
        updateState("paused");
      }
    },
    [onRateChange, speakAt, updateState],
  );

  useEffect(() => {
    const stopForOtherAudio = () => {
      runRef.current += 1;
      if (supportsSpeech()) window.speechSynthesis.cancel();
      updateState("idle");
    };
    window.addEventListener("ccc:stop-audio", stopForOtherAudio);
    return () => {
      window.removeEventListener("ccc:stop-audio", stopForOtherAudio);
      runRef.current += 1;
      if (supportsSpeech()) window.speechSynthesis.cancel();
    };
  }, [updateState]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && stateRef.current === "playing") {
        runRef.current += 1;
        window.speechSynthesis.cancel();
        updateState("paused");
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [updateState]);

  return {
    supported: state !== "unsupported",
    state,
    unitIndex,
    rate,
    voiceName: preferredVoice?.name ?? "Voz padrão do dispositivo",
    error,
    play,
    pause,
    resume,
    stop,
    seek,
    setRate,
  };
}