import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export interface UseAudioRecorderOptions {
  mimeType?: string; // default 'audio/webm;codecs=opus'
  timeSliceMs?: number; // chunk interval
}

export interface UseAudioRecorderResult {
  status: RecorderStatus;
  isRecording: boolean;
  isPaused: boolean;
  error?: string;
  audioBlob?: Blob;
  audioUrl?: string;
  durationMs: number;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<void>;
  reset: () => void;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderResult {
  const { mimeType = 'audio/webm;codecs=opus', timeSliceMs = 1000 } = options;

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const pauseAccumulatedRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);

  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<string | undefined>();
  const [audioBlob, setAudioBlob] = useState<Blob | undefined>();
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [durationMs, setDurationMs] = useState<number>(0);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const computeDuration = useCallback(() => {
    if (!startTimeRef.current) return;
    const now = Date.now();
    const paused = pauseStartRef.current ? now - pauseStartRef.current : 0;
    const effectivePause = pauseAccumulatedRef.current + (pauseStartRef.current ? paused : 0);
    const dur = now - startTimeRef.current - effectivePause;
    setDurationMs(Math.max(0, dur));
  }, []);

  // Tick duration every second while recording
  useEffect(() => {
    if (status === 'recording' || status === 'paused') {
      const t = setInterval(computeDuration, 500);
      return () => clearInterval(t);
    }
  }, [status, computeDuration]);

  const start = useCallback(async () => {
    setError(undefined);
    setAudioBlob(undefined);
    setAudioUrl(undefined);
    chunksRef.current = [];
    pauseAccumulatedRef.current = 0;
    pauseStartRef.current = null;
    setDurationMs(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setStatus('stopped');
      };

      startTimeRef.current = Date.now();
      recorder.start(timeSliceMs);
      setStatus('recording');
    } catch (err: any) {
      setError(err?.message || 'Failed to start recorder');
      setStatus('error');
    }
  }, [mimeType, timeSliceMs]);

  const pause = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.pause();
      pauseStartRef.current = Date.now();
      setStatus('paused');
    }
  }, []);

  const resume = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'paused') {
      recorderRef.current.resume();
      if (pauseStartRef.current) {
        pauseAccumulatedRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }
      setStatus('recording');
    }
  }, []);

  const stop = useCallback(async () => {
    if (recorderRef.current && mediaStreamRef.current) {
      if (recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    chunksRef.current = [];
    setAudioBlob(undefined);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(undefined);
    setStatus('idle');
    setDurationMs(0);
    startTimeRef.current = null;
    pauseAccumulatedRef.current = 0;
    pauseStartRef.current = null;
  }, [audioUrl]);

  return {
    status,
    isRecording: status === 'recording',
    isPaused: status === 'paused',
    error,
    audioBlob,
    audioUrl,
    durationMs,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
