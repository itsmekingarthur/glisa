import { useEffect, useRef } from "react";
import { useServerStore } from "../store/useServerStore";

export function useVoiceDetector(active: boolean) {
  const isMuted = useServerStore((s) => s.isMuted);
  const setSpeaking = useServerStore((s) => s.setSpeaking);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      audioContextRef.current = null;
      intervalRef.current = null;
      setSpeaking(false);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 512;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        intervalRef.current = setInterval(() => {
          if (isMutedRef.current) {
            setSpeaking(false);
            return;
          }
          analyser.getByteFrequencyData(dataArray);
          const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setSpeaking(volume > 10);
        }, 100);
      })
      .catch(() => {
        setSpeaking(false);
      });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      audioContextRef.current = null;
      intervalRef.current = null;
      setSpeaking(false);
    };
  }, [active, setSpeaking]);
}
