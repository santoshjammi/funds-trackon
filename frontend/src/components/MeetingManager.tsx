import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  meetingsApi,
  MeetingCreateRequest,
  MeetingListItem,
  MeetingDetails,
} from '../services/api';
import MeetingRecorder from './MeetingRecorder';

type Props = {
  fundraisingId?: string;
};

const defaultTypes: MeetingCreateRequest['meeting_type'][] = [
  'Initial Meeting',
  'Follow-up',
  'Due Diligence',
  'Closing',
  'General Discussion',
];

const MeetingManager: React.FC<Props> = ({ fundraisingId: fundraisingIdProp }) => {
  const [fundraisingId, setFundraisingId] = useState(fundraisingIdProp || '');
  const isEmbedded = Boolean(fundraisingIdProp);
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(null);
  const [processing, setProcessing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [promptResult, setPromptResult] = useState<string | null>(null);
  const [promptScope, setPromptScope] = useState<'meeting' | 'campaign'>('meeting');
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [infographicDesc, setInfographicDesc] = useState<string>('Key points visual summary of this meeting');
  const [infographicLoading, setInfographicLoading] = useState<boolean>(false);
  const [dubLoading, setDubLoading] = useState<boolean>(false);
  const [dubVoice, setDubVoice] = useState<string>('alloy');
  // OpenAI API key handling (stored locally)
  const [openaiKey, setOpenaiKey] = useState<string>(() => {
    try { return localStorage.getItem('openai_api_key') || ''; } catch { return ''; }
  });
  const [showKey, setShowKey] = useState<boolean>(false);

  // Create meeting form state
  const [title, setTitle] = useState('Initial Discussion');
  const [meetingType, setMeetingType] = useState<MeetingCreateRequest['meeting_type']>('Initial Meeting');
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = new Date();
    const tzOffsetMs = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  });
  const [location, setLocation] = useState<string>('');
  const [isVirtual, setIsVirtual] = useState<boolean>(false);
  const [agenda, setAgenda] = useState<string>('');
  const createFormRef = useRef<HTMLDivElement | null>(null);
  const recorderRef = useRef<HTMLDivElement | null>(null);

  const canCreate = useMemo(() => fundraisingId && title && meetingType && scheduledDate, [fundraisingId, title, meetingType, scheduledDate]);

  const loadMeetings = async () => {
    if (!fundraisingId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await meetingsApi.listByFundraising(fundraisingId);
      setMeetings(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };
  const loadMeetingDetails = async (id: string) => {
    try {
      const details = await meetingsApi.details(id);
      // Normalize if backend returns { meeting: {...} }
      const anyDetails: any = details as any;
      if (anyDetails && anyDetails.meeting) {
        const m = anyDetails.meeting;
        const normalized: MeetingDetails = {
          id: m.id || id,
          title: m.title,
          meeting_type: m.meeting_type,
          status: m.status,
          scheduled_date: m.scheduled_date,
          actual_date: m.actual_date,
          duration_minutes: m.duration_minutes,
          location: m.location,
          is_virtual: m.is_virtual,
          agenda: m.agenda,
          notes: m.notes ?? null,
          attendees: m.attendees,
          tnifmc_representatives: m.tnifmc_representatives,
          has_audio: Boolean(m.audio_recording),
          audio_filename: m.audio_recording?.filename,
          audio_processing_status: m.audio_recording?.processing_status ?? null,
          transcript: m.audio_recording?.transcript ?? null,
          ai_summary: m.ai_summary ?? null,
          ai_action_items: m.ai_action_items ?? null,
          ai_risks: (m.ai_insights?.risks_concerns) || null,
          ai_next_steps: (m.ai_insights?.follow_up_needed) || null,
          created_at: m.created_at,
          updated_at: m.updated_at,
        };
        setMeetingDetails(normalized);
        setNotesDraft(normalized.notes || '');
      } else {
        setMeetingDetails(details);
        setNotesDraft((details as any).notes || '');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load meeting details');
    }
  };


  // Auto-load when prop is provided or fundraisingId changes
  useEffect(() => {
    if (fundraisingIdProp && fundraisingIdProp !== fundraisingId) {
      setFundraisingId(fundraisingIdProp);
    }
  }, [fundraisingIdProp]);

  useEffect(() => {
    if (fundraisingId) {
      loadMeetings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundraisingId]);

  const createMeeting = async () => {
    if (!canCreate) return;
    setLoading(true);
    setError(null);
    try {
      const req: MeetingCreateRequest = {
        title,
        meeting_type: meetingType,
        fundraising_id: fundraisingId,
        scheduled_date: new Date(scheduledDate).toISOString(),
        location: location || undefined,
        is_virtual: isVirtual,
        agenda: agenda || undefined,
      };
      const res = await meetingsApi.create(req);
      setSelectedMeetingId(res.meeting_id);
      await loadMeetings();
      await loadMeetingDetails(res.meeting_id);
      // Bring the recorder panel into view
      setTimeout(() => {
        recorderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      setSuccessMsg('Meeting created. You can add notes and record audio below.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessAudio = async () => {
    if (!selectedMeetingId) return;
    setProcessing(true);
    setError(null);
    try {
      await meetingsApi.processAudio(selectedMeetingId);
      await loadMeetingDetails(selectedMeetingId);
    } catch (e: any) {
      setError(e?.message || 'Failed to process audio');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryProcessing = async () => {
    if (!selectedMeetingId) return;
    setProcessing(true);
    setError(null);
    try {
      await meetingsApi.processAudio(selectedMeetingId, true);
      await loadMeetingDetails(selectedMeetingId);
    } catch (e: any) {
      setError(e?.message || 'Retry failed');
    } finally {
      setProcessing(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudio = async () => {
    if (!selectedMeetingId) return;
    try {
      const { blob, filename } = await meetingsApi.downloadAudio(selectedMeetingId);
      downloadBlob(blob, filename);
    } catch (e: any) {
      setError(e?.message || 'Audio download failed');
    }
  };

  const handleDownloadTranscript = async () => {
    if (!selectedMeetingId) return;
    try {
      const { blob, filename } = await meetingsApi.downloadTranscript(selectedMeetingId);
      downloadBlob(blob, filename);
    } catch (e: any) {
      setError(e?.message || 'Transcript download failed');
    }
  };

  const handleGenerateInfographic = async () => {
    if (!selectedMeetingId) return;
    setInfographicLoading(true);
    setError(null);
    try {
      await meetingsApi.generateInfographic(selectedMeetingId, infographicDesc || 'Visual summary of the meeting');
      await loadMeetingDetails(selectedMeetingId);
      setSuccessMsg('Infographic generated');
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate infographic');
    } finally {
      setInfographicLoading(false);
    }
  };

  const handleGenerateDub = async () => {
    if (!selectedMeetingId) return;
    setDubLoading(true);
    setError(null);
    try {
      await meetingsApi.generateDub(selectedMeetingId, dubVoice, 'mp3');
      await loadMeetingDetails(selectedMeetingId);
      setSuccessMsg('Autodub generated');
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate autodub');
    } finally {
      setDubLoading(false);
    }
  };

  const handleRunPrompt = async () => {
    if (!prompt.trim()) return;
    setProcessing(true);
    setError(null);
    setPromptResult(null);
    try {
      let res: { result?: string };
      if (promptScope === 'campaign') {
        if (!fundraisingId) throw new Error('Missing fundraising ID');
        res = await meetingsApi.runCampaignPrompt(fundraisingId, prompt.trim());
      } else {
        if (!selectedMeetingId) throw new Error('Select a meeting');
        res = await meetingsApi.runPrompt(selectedMeetingId, prompt.trim());
      }
      setPromptResult(res.result || '');
    } catch (e: any) {
      setError(e?.message || 'Prompt failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* API Key configuration */}
      <div className="bg-white shadow rounded p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <label className="block text-sm text-gray-600 mb-1">OpenAI API key (audio processing)</label>
            <input
              type={showKey ? 'text' : 'password'}
              className="w-80 max-w-full border rounded px-3 py-2"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-gray-500">Stored in this browser only; sent only for processing operations.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border rounded" onClick={() => setShowKey((s) => !s)}>
              {showKey ? 'Hide' : 'Show'}
            </button>
            <button
              className="px-3 py-2 bg-gray-800 text-white rounded"
              onClick={() => {
                try {
                  if (openaiKey) localStorage.setItem('openai_api_key', openaiKey);
                  else localStorage.removeItem('openai_api_key');
                  setSuccessMsg(openaiKey ? 'API key saved for this browser.' : 'API key cleared.');
                  setTimeout(() => setSuccessMsg(null), 2000);
                } catch {
                  setError('Failed to store API key.');
                }
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
      {!isEmbedded && (
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-3">Meetings for a Fundraising Campaign</h2>
          <div className="flex gap-2 items-end flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <label htmlFor="fundraisingId" className="block text-sm text-gray-600 mb-1">Fundraising ID</label>
              <input
                id="fundraisingId"
                className="w-full border rounded px-3 py-2"
                placeholder="Enter fundraising campaign ID"
                value={fundraisingId}
                onChange={(e) => setFundraisingId(e.target.value)}
              />
            </div>
            <button
              onClick={loadMeetings}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              disabled={!fundraisingId || loading}
            >
              {loading ? 'Loading…' : 'Load Meetings'}
            </button>
          </div>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        </div>
      )}

      <div className="bg-white shadow rounded p-4" ref={createFormRef}>
        <h3 className="text-md font-semibold mb-3">Create a Meeting</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="meetingTitle" className="block text-sm text-gray-600 mb-1">Title</label>
            <input id="meetingTitle" className="w-full border rounded px-3 py-2" placeholder="Enter meeting title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label htmlFor="meetingType" className="block text-sm text-gray-600 mb-1">Type</label>
            <select id="meetingType" className="w-full border rounded px-3 py-2" value={meetingType} onChange={(e) => setMeetingType(e.target.value as any)}>
              {defaultTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="scheduledDate" className="block text-sm text-gray-600 mb-1">Scheduled Date/Time</label>
            <input id="scheduledDate" type="datetime-local" className="w-full border rounded px-3 py-2" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="meetingLocation" className="block text-sm text-gray-600 mb-1">Location</label>
            <input id="meetingLocation" className="w-full border rounded px-3 py-2" placeholder="Enter location (or leave blank)" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={isVirtual} onChange={(e) => setIsVirtual(e.target.checked)} />
              <span>Virtual Meeting</span>
            </label>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="meetingAgenda" className="block text-sm text-gray-600 mb-1">Agenda</label>
            <textarea id="meetingAgenda" className="w-full border rounded px-3 py-2" rows={3} placeholder="List key points to discuss" value={agenda} onChange={(e) => setAgenda(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <button onClick={createMeeting} disabled={!canCreate || loading} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Meeting'}
          </button>
          {!canCreate && (
            <div className="text-xs text-gray-600 mt-2">Title, Type, and Date/Time are required.</div>
          )}
          {error && (
            <div className="text-sm text-red-600 mt-2">{error}</div>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded p-4">
        <h3 className="text-md font-semibold mb-3">Existing Meetings</h3>
        {meetings.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded p-6 bg-gray-50">
            <div className="text-gray-800 font-medium mb-1">No meetings yet</div>
            <div className="text-gray-600 text-sm mb-3">Create your first meeting to start recording notes and audio.</div>
            <button
              className="px-3 py-2 bg-green-600 text-white rounded"
              onClick={() => createFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Create your first meeting
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audio</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {meetings.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{m.title}</td>
                    <td className="px-4 py-2">{m.meeting_type}</td>
                    <td className="px-4 py-2">{new Date(m.scheduled_date).toLocaleString()}</td>
                    <td className="px-4 py-2">{m.has_audio ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        className={`px-3 py-1 rounded ${selectedMeetingId === m.id ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}
                        onClick={() => {
                          setSelectedMeetingId(m.id);
                          loadMeetingDetails(m.id);
                        }}
                      >
                        {selectedMeetingId === m.id ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedMeetingId && (
        <div className="bg-white shadow rounded p-4" ref={recorderRef}>
          <h3 className="text-md font-semibold mb-3">Record & Submit for Meeting</h3>
          {successMsg && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{successMsg}</div>}
          <MeetingRecorder meetingId={selectedMeetingId} onUploaded={() => { loadMeetings(); if (selectedMeetingId) loadMeetingDetails(selectedMeetingId); }} />
          <div className="mt-4 flex items-center gap-2">
            <button
              className="px-3 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
              disabled={processing || !meetingDetails?.has_audio}
              onClick={handleProcessAudio}
            >
              {processing ? 'Processing…' : 'Process Audio (Transcribe + Analyze)'}
            </button>
            <button
              className="px-3 py-2 bg-purple-100 text-purple-800 rounded disabled:opacity-50"
              disabled={processing || !meetingDetails?.has_audio}
              onClick={handleRetryProcessing}
            >
              Retry Processing
            </button>
            {!meetingDetails?.has_audio && (
              <span className="text-sm text-gray-600">Upload audio first to enable processing.</span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              className="px-3 py-2 bg-gray-100 text-gray-800 rounded disabled:opacity-50"
              disabled={!meetingDetails?.has_audio}
              onClick={handleDownloadAudio}
            >
              Download Audio
            </button>
            <button
              className="px-3 py-2 bg-gray-100 text-gray-800 rounded disabled:opacity-50"
              disabled={!meetingDetails?.transcript}
              onClick={handleDownloadTranscript}
            >
              Download Transcript
            </button>
            <div className="ml-2 flex items-center gap-2">
              <select
                className="border rounded px-2 py-1 text-sm"
                value={dubVoice}
                onChange={(e) => setDubVoice(e.target.value)}
                aria-label="Autodub voice"
              >
                <option value="alloy">Alloy</option>
                <option value="verse">Verse</option>
                <option value="aria">Aria</option>
              </select>
              <button
                className="px-3 py-2 bg-teal-600 text-white rounded disabled:opacity-50"
                disabled={dubLoading || !meetingDetails?.transcript}
                onClick={handleGenerateDub}
                title={!meetingDetails?.transcript ? 'Process audio to generate transcript first' : 'Generate English dub'}
              >
                {dubLoading ? 'Autodubbing…' : 'Autodub to English'}
              </button>
            </div>
          </div>
          {meetingDetails && (
            <div className="mt-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Notes</h4>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  placeholder="Type your notes here..."
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                />
                <div className="mt-2">
                  <button
                    className="px-3 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
                    onClick={async () => {
                      if (!selectedMeetingId) return;
                      try {
                        await meetingsApi.update(selectedMeetingId, { notes: notesDraft });
                        setMeetingDetails({ ...(meetingDetails as any), notes: notesDraft });
                        setSuccessMsg('Notes saved');
                        setTimeout(() => setSuccessMsg(null), 2000);
                      } catch (e: any) {
                        setError(e?.message || 'Failed to save notes');
                      }
                    }}
                  >
                    Save Notes
                  </button>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Processing Status</h4>
                <div className="text-sm text-gray-700">
                  {meetingDetails.audio_processing_status || (meetingDetails.has_audio ? 'Audio uploaded' : 'No audio')}
                </div>
              </div>
              {meetingDetails.transcript && (
                <div>
                  <h4 className="font-semibold text-gray-800">Transcript</h4>
                  <pre className="whitespace-pre-wrap text-sm p-3 bg-gray-50 rounded border border-gray-200">{meetingDetails.transcript}</pre>
                </div>
              )}
              {(meetingDetails.ai_summary || meetingDetails.ai_action_items || meetingDetails.ai_risks || meetingDetails.ai_next_steps) && (
                <div>
                  <h4 className="font-semibold text-gray-800">AI Insights</h4>
                  {meetingDetails.ai_summary && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Summary</div>
                      <div className="text-sm text-gray-800">{meetingDetails.ai_summary}</div>
                    </div>
                  )}
                  {meetingDetails.ai_action_items && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Action Items</div>
                      <ul className="list-disc list-inside text-sm text-gray-800">
                        {(Array.isArray(meetingDetails.ai_action_items) ? meetingDetails.ai_action_items : String(meetingDetails.ai_action_items).split('\n')).map((it, idx) => (
                          <li key={idx}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {meetingDetails.ai_risks && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Risks</div>
                      <ul className="list-disc list-inside text-sm text-gray-800">
                        {(Array.isArray(meetingDetails.ai_risks) ? meetingDetails.ai_risks : String(meetingDetails.ai_risks).split('\n')).map((it, idx) => (
                          <li key={idx}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {meetingDetails.ai_next_steps && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Next Steps</div>
                      <ul className="list-disc list-inside text-sm text-gray-800">
                        {(Array.isArray(meetingDetails.ai_next_steps) ? meetingDetails.ai_next_steps : String(meetingDetails.ai_next_steps).split('\n')).map((it, idx) => (
                          <li key={idx}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Ask a custom question</h4>
                <div className="grid gap-2">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-700">Scope:</label>
                    <label className="inline-flex items-center gap-1 text-sm">
                      <input
                        type="radio"
                        name="promptScope"
                        checked={promptScope === 'meeting'}
                        onChange={() => setPromptScope('meeting')}
                      />
                      This meeting only
                    </label>
                    <label className="inline-flex items-center gap-1 text-sm">
                      <input
                        type="radio"
                        name="promptScope"
                        checked={promptScope === 'campaign'}
                        onChange={() => setPromptScope('campaign')}
                      />
                      All meetings in this campaign
                    </label>
                  </div>
                  <textarea
                    id="customPrompt"
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    placeholder="Ask questions like: Summarize stakeholders' concerns; List follow-ups for next week; Extract key metrics discussed."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                      onClick={handleRunPrompt}
                      disabled={
                        processing ||
                        !prompt.trim() ||
                        (promptScope === 'meeting' && !meetingDetails?.transcript)
                      }
                    >
                      {processing ? 'Running…' : 'Run Prompt'}
                    </button>
                    {promptScope === 'meeting' && !meetingDetails?.transcript && (
                      <span className="text-sm text-gray-600">Process audio first to generate transcript.</span>
                    )}
                    {promptScope === 'campaign' && meetings.length === 0 && (
                      <span className="text-sm text-gray-600">No meetings found in this campaign.</span>
                    )}
                  </div>
                  {promptResult && (
                    <div className="text-sm text-gray-800 p-3 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap">
                      {promptResult}
                    </div>
                  )}
                </div>
              </div>
              {meetingDetails?.dub_url && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">English Dub</h4>
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                    <span>Voice: {meetingDetails.dub_voice || 'n/a'}</span>
                    {meetingDetails.dub_generated_at && (
                      <span>· Generated: {new Date(meetingDetails.dub_generated_at).toLocaleString()}</span>
                    )}
                  </div>
                  <audio controls src={meetingDetails.dub_url} className="w-full" />
                  <div className="mt-2">
                    <button
                      className="px-3 py-2 bg-gray-100 text-gray-800 rounded"
                      onClick={async () => {
                        if (!selectedMeetingId) return;
                        try {
                          const { blob, filename } = await meetingsApi.downloadDub(selectedMeetingId);
                          downloadBlob(blob, filename);
                        } catch (e: any) {
                          setError(e?.message || 'Dub download failed');
                        }
                      }}
                    >
                      Download Dub
                    </button>
                  </div>
                </div>
              )}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Infographic</h4>
                <div className="grid gap-2">
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Describe the infographic to generate (optional)"
                    value={infographicDesc}
                    onChange={(e) => setInfographicDesc(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-2 bg-teal-600 text-white rounded disabled:opacity-50"
                      onClick={handleGenerateInfographic}
                      disabled={infographicLoading}
                    >
                      {infographicLoading ? 'Generating…' : 'Generate Infographic'}
                    </button>
                    {meetingDetails?.infographic_generated_at && (
                      <span className="text-xs text-gray-600">Last generated: {new Date(meetingDetails.infographic_generated_at).toLocaleString()}</span>
                    )}
                  </div>
                  {meetingDetails?.infographic_url && (
                    <div className="mt-2">
                      <img
                        src={meetingDetails.infographic_url}
                        alt={meetingDetails.infographic_description || 'Meeting infographic'}
                        className="max-h-96 border rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MeetingManager;
