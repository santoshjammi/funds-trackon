import React, { useEffect, useMemo, useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { deleteRecording, getRecording, saveRecording } from '../utils/indexedDb';
import { getAuthToken, getTokenExpiry, isTokenExpired, meetingsApi } from '../services/api';

type Props = {
  meetingId: string;
  autoFilename?: string;
  onUploaded?: (result: { meeting_id: string; audio_filename: string }) => void;
};

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export const MeetingRecorder: React.FC<Props> = ({ meetingId, autoFilename = 'meeting-recording.webm', onUploaded }) => {
  const rec = useAudioRecorder();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [localMeta, setLocalMeta] = useState<{ filename?: string; size?: number; createdAt?: number } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [preventedUnload, setPreventedUnload] = useState<boolean>(false);
  const [tokenExpAt, setTokenExpAt] = useState<number | null>(null);

  const canSubmit = useMemo(() => !!rec.audioBlob, [rec.audioBlob]);

  const handleSaveLocal = async () => {
    if (!rec.audioBlob) return;
    await saveRecording({ id: meetingId, blob: rec.audioBlob, createdAt: Date.now(), filename: autoFilename });
    setMessage('Recording saved locally. It will not be uploaded until you click Submit.');
    await refreshLocalMeta();
  };

  const handleLoadLocal = async () => {
    const entry = await getRecording(meetingId);
    if (!entry) {
      setMessage('No local recording found for this meeting.');
      return;
    }
    // Create a playable URL for preview
    const url = URL.createObjectURL(entry.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = entry.filename || 'recording.webm';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitUpload = async () => {
    setMessage(null);
    setLoading(true);
    try {
      // Prefer local stored recording if present
      const entry = await getRecording(meetingId);
      const blob = entry?.blob || rec.audioBlob;
      if (!blob) {
        setMessage('No recording available to upload.');
        return;
      }
      const file = new File([blob], entry?.filename || autoFilename, { type: blob.type || 'audio/webm' });
      const result = await meetingsApi.uploadAudio(meetingId, file);
      setMessage('Upload successful.');
      if (onUploaded) onUploaded(result);
      // Clean up local copy after successful upload
      await deleteRecording(meetingId);
      await refreshLocalMeta();
    } catch (e: any) {
      setMessage(e?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const refreshLocalMeta = async () => {
    try {
      const entry = await getRecording(meetingId);
      if (entry) {
        setLocalMeta({ filename: entry.filename, size: entry.blob?.size, createdAt: entry.createdAt });
      } else {
        setLocalMeta(null);
      }
    } catch {
      setLocalMeta(null);
    }
  };

  useEffect(() => {
    refreshLocalMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  // Check auth on mount and on visibility changes
  useEffect(() => {
    const check = () => {
      const tok = getAuthToken();
      setIsAuthenticated(!!tok);
      setTokenExpAt(getTokenExpiry(tok));
    };
    check();
    const vis = () => check();
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('focus', check);
    return () => {
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('focus', check);
    };
  }, []);

  // Warn if token is close to expiry while recording; we do not auto-logout mid-recording
  useEffect(() => {
    if (!tokenExpAt) return;
    if (rec.status !== 'recording' && rec.status !== 'paused') return;
    const now = Date.now();
    const msLeft = tokenExpAt - now;
    if (msLeft <= 0) {
      // Token expired during recording; we allow recording to continue locally
      setMessage('Session expired. Finish or stop recording to re-authenticate. Upload will require login.');
      return;
    }
    const warnAt = Math.min(msLeft - 10000, 0); // warn 10s before expiry
    const t = setTimeout(() => {
      setMessage('Session is about to expire. You can continue recording, but you may need to log in before uploading.');
    }, Math.max(0, warnAt));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenExpAt, rec.status]);

  // Prevent closing/signout navigation while recording
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (rec.status === 'recording' || rec.status === 'paused') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    const beforeLogout = (e: Event) => {
      if (rec.status === 'recording' || rec.status === 'paused') {
        // Cancel the event to prevent logout
        e.preventDefault();
      }
    };
    if (rec.status === 'recording' || rec.status === 'paused') {
      if (!preventedUnload) setPreventedUnload(true);
      window.addEventListener('beforeunload', beforeUnload);
      window.addEventListener('app:before-logout', beforeLogout as EventListener);
    }
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('app:before-logout', beforeLogout as EventListener);
      if (preventedUnload && rec.status === 'stopped') setPreventedUnload(false);
    };
  }, [rec.status, preventedUnload]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {rec.status === 'idle' && (
          <button
            onClick={() => {
              if (!isAuthenticated) {
                setMessage('Please log in to start recording.');
                return;
              }
              // If token already expired, allow recording but warn before upload
              if (isTokenExpired(getAuthToken())) {
                setMessage('Session expired. You can record locally, but you must log in before uploading.');
              }
              rec.start();
            }}
            className={`px-3 py-2 rounded ${isAuthenticated ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            disabled={!isAuthenticated}
          >
            Start
          </button>
        )}
        {rec.status === 'recording' && (
          <>
            <button onClick={rec.pause} className="px-3 py-2 bg-yellow-600 text-white rounded">Pause</button>
            <button onClick={rec.stop} className="px-3 py-2 bg-red-600 text-white rounded">Stop</button>
          </>
        )}
        {rec.status === 'paused' && (
          <>
            <button onClick={rec.resume} className="px-3 py-2 bg-blue-600 text-white rounded">Resume</button>
            <button onClick={rec.stop} className="px-3 py-2 bg-red-600 text-white rounded">Stop</button>
          </>
        )}
        {rec.status === 'stopped' && (
          <>
            <button onClick={rec.reset} className="px-3 py-2 bg-gray-600 text-white rounded">Reset</button>
            <button onClick={handleSaveLocal} className="px-3 py-2 bg-indigo-600 text-white rounded">Save Locally</button>
          </>
        )}
      </div>

  <div className="text-sm text-gray-700">Status: {rec.status} • Duration: {formatDuration(rec.durationMs)}{!isAuthenticated ? ' • Not authenticated' : ''}</div>
      {rec.error && <div className="text-sm text-red-600">Error: {rec.error}</div>}

      {rec.audioUrl && (
        <audio controls src={rec.audioUrl} className="w-full" />
      )}

      {/* File info */}
      <div className="text-xs text-gray-600 space-y-1">
        {rec.audioBlob && (
          <div>
            Current recording: <span className="font-medium">{autoFilename}</span>
            {` • ${rec.audioBlob.type || 'audio/webm'} • ${formatBytes(rec.audioBlob.size)}`}
          </div>
        )}
        {localMeta && (
          <div>
            Local saved copy: <span className="font-medium">{localMeta.filename || 'recording.webm'}</span>
            {` • ${formatBytes(localMeta.size || 0)}`}
            <span className="ml-2 inline-block px-2 py-0.5 text-[11px] bg-gray-100 text-gray-700 rounded">Will upload this copy</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button disabled={!canSubmit || loading} onClick={handleSubmitUpload} className="px-3 py-2 bg-primary-600 text-white rounded disabled:opacity-50">
          {loading ? 'Uploading…' : 'Submit (Upload)'}
        </button>
        <button onClick={handleLoadLocal} className="px-3 py-2 bg-gray-200 rounded">Preview Local Copy</button>
      </div>

      {message && <div className="text-sm text-gray-800">{message}</div>}
    </div>
  );
};

export default MeetingRecorder;
