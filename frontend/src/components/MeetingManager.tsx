import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Download, Loader2, Mic, RefreshCw, Trash2 } from 'lucide-react';
import {
  meetingsApi,
  MeetingCreateRequest,
  MeetingListItem,
  MeetingDetails,
} from '../services/api';
import MeetingRecorder from './MeetingRecorder';
import { JoplinSync } from './JoplinSync';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { SelectNative } from './ui/select-native';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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
  const { hasAnyRole } = useAuth();
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

  const deleteMeeting = async (meetingId: string) => {
    console.log('Delete meeting clicked for ID:', meetingId);
    
    if (!window.confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      console.log('User cancelled deletion');
      return;
    }
    
    console.log('Attempting to delete meeting...');
    setLoading(true);
    setError(null);
    try {
      console.log('Calling meetingsApi.delete...');
      const result = await meetingsApi.delete(meetingId);
      console.log('Delete API response:', result);
      
      // If the deleted meeting was selected, clear selection
      if (selectedMeetingId === meetingId) {
        setSelectedMeetingId(null);
        setMeetingDetails(null);
      }
      // Reload the meetings list
      console.log('Reloading meetings list...');
      await loadMeetings();
      setSuccessMsg('Meeting deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      console.error('Error deleting meeting:', e);
      setError(e?.message || 'Failed to delete meeting');
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
      {!isEmbedded && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Meetings for a Fundraising Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[260px] space-y-1.5">
                <Label htmlFor="fundraisingId">Fundraising ID</Label>
                <Input
                  id="fundraisingId"
                  placeholder="Enter fundraising campaign ID"
                  value={fundraisingId}
                  onChange={(e) => setFundraisingId(e.target.value)}
                />
              </div>
              <Button onClick={loadMeetings} disabled={!fundraisingId || loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Loading…</> : 'Load Meetings'}
              </Button>
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      <Card ref={createFormRef}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Create a Meeting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="meetingTitle">Title</Label>
              <Input id="meetingTitle" placeholder="Enter meeting title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meetingType">Type</Label>
              <SelectNative id="meetingType" value={meetingType} onChange={(e) => setMeetingType(e.target.value as any)}>
                {defaultTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </SelectNative>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scheduledDate">Scheduled Date/Time</Label>
              <Input id="scheduledDate" type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meetingLocation">Location</Label>
              <Input id="meetingLocation" placeholder="Enter location (or leave blank)" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isVirtual} onChange={(e) => setIsVirtual(e.target.checked)} className="rounded border-input" />
                <span className="text-sm">Virtual Meeting</span>
              </label>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="meetingAgenda">Agenda</Label>
              <Textarea id="meetingAgenda" rows={3} placeholder="List key points to discuss" value={agenda} onChange={(e) => setAgenda(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={createMeeting} disabled={!canCreate || loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Creating…</> : 'Create Meeting'}
            </Button>
            {!canCreate && <p className="text-xs text-muted-foreground">Title, Type, and Date/Time are required.</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Existing Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <div className="border border-dashed rounded-md p-6 bg-muted/40 text-center">
              <p className="font-medium mb-1">No meetings yet</p>
              <p className="text-sm text-muted-foreground mb-3">Create your first meeting to start recording notes and audio.</p>
              <Button size="sm" onClick={() => createFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                Create your first meeting
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Audio</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.title}</TableCell>
                      <TableCell><Badge variant="secondary">{m.meeting_type}</Badge></TableCell>
                      <TableCell className="text-sm">{new Date(m.scheduled_date).toLocaleString()}</TableCell>
                      <TableCell>{m.has_audio ? <Badge variant="success">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant={selectedMeetingId === m.id ? 'default' : 'outline'}
                            onClick={() => { setSelectedMeetingId(m.id); loadMeetingDetails(m.id); }}
                          >
                            {selectedMeetingId === m.id ? 'Selected' : 'Select'}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteMeeting(m.id)} disabled={loading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedMeetingId && (
        <Card ref={recorderRef}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mic className="h-4 w-4" />Meeting Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {successMsg && <p className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{successMsg}</p>}
            <Tabs defaultValue="recording">
              <TabsList className="mb-4">
                <TabsTrigger value="recording"><Mic className="h-3.5 w-3.5 mr-1.5" />Recording &amp; Audio</TabsTrigger>
                <TabsTrigger value="notes"><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Notes &amp; AI</TabsTrigger>
                <TabsTrigger value="joplin"><BookOpen className="h-3.5 w-3.5 mr-1.5" />Joplin Sync</TabsTrigger>
              </TabsList>

              {/* ── Tab 1: Recording & Audio ── */}
              <TabsContent value="recording" className="space-y-4">
                <MeetingRecorder meetingId={selectedMeetingId} onUploaded={() => { loadMeetings(); if (selectedMeetingId) loadMeetingDetails(selectedMeetingId); }} />
                <Separator />
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" disabled={processing || !meetingDetails?.has_audio} onClick={handleProcessAudio}>
                    {processing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Processing…</> : 'Process Audio (Transcribe + Analyze)'}
                  </Button>
                  <Button size="sm" variant="outline" disabled={processing || !meetingDetails?.has_audio} onClick={handleRetryProcessing}>
                    <RefreshCw className="h-4 w-4 mr-1" />Retry Processing
                  </Button>
                  {!meetingDetails?.has_audio && <span className="text-sm text-muted-foreground">Upload audio first to enable processing.</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" disabled={!meetingDetails?.has_audio} onClick={handleDownloadAudio}>
                    <Download className="h-4 w-4 mr-1" />Download Audio
                  </Button>
                  <Button size="sm" variant="outline" disabled={!meetingDetails?.transcript} onClick={handleDownloadTranscript}>
                    <Download className="h-4 w-4 mr-1" />Download Transcript
                  </Button>
                  <div className="flex items-center gap-2">
                    <SelectNative value={dubVoice} onChange={(e) => setDubVoice(e.target.value)} aria-label="Autodub voice" className="w-28">
                      <option value="alloy">Alloy</option>
                      <option value="verse">Verse</option>
                      <option value="aria">Aria</option>
                    </SelectNative>
                    <Button size="sm" disabled={dubLoading || !meetingDetails?.transcript} onClick={handleGenerateDub} title={!meetingDetails?.transcript ? 'Process audio to generate transcript first' : 'Generate English dub'}>
                      {dubLoading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Autodubbing…</> : 'Autodub to English'}
                    </Button>
                  </div>
                </div>

                {meetingDetails?.dub_url && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">English Dub</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Voice: {meetingDetails.dub_voice || 'n/a'}</span>
                      {meetingDetails.dub_generated_at && <span>· Generated: {new Date(meetingDetails.dub_generated_at).toLocaleString()}</span>}
                    </div>
                    <audio controls src={meetingDetails.dub_url} className="w-full" />
                    <Button size="sm" variant="outline" onClick={async () => {
                      if (!selectedMeetingId) return;
                      try {
                        const { blob, filename } = await meetingsApi.downloadDub(selectedMeetingId);
                        downloadBlob(blob, filename);
                      } catch (e: any) {
                        setError(e?.message || 'Dub download failed');
                      }
                    }}>
                      <Download className="h-4 w-4 mr-1" />Download Dub
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* ── Tab 2: Notes & AI ── */}
              <TabsContent value="notes" className="space-y-4">
                {meetingDetails && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="meeting-notes">Notes</Label>
                      <Textarea
                        id="meeting-notes"
                        rows={4}
                        placeholder="Type your notes here..."
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                      />
                      <Button size="sm" onClick={async () => {
                        if (!selectedMeetingId) return;
                        try {
                          await meetingsApi.update(selectedMeetingId, { notes: notesDraft });
                          setMeetingDetails({ ...(meetingDetails as any), notes: notesDraft });
                          setSuccessMsg('Notes saved');
                          setTimeout(() => setSuccessMsg(null), 2000);
                        } catch (e: any) {
                          setError(e?.message || 'Failed to save notes');
                        }
                      }}>Save Notes</Button>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Processing Status</p>
                      <p className="text-sm text-muted-foreground">
                        {meetingDetails.audio_processing_status || (meetingDetails.has_audio ? 'Audio uploaded' : 'No audio')}
                      </p>
                    </div>

                    {meetingDetails.transcript && (
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold">Transcript</p>
                        <pre className="whitespace-pre-wrap text-sm p-3 bg-muted/40 rounded-md border">{meetingDetails.transcript}</pre>
                      </div>
                    )}

                    {(meetingDetails.ai_summary || meetingDetails.ai_action_items || meetingDetails.ai_risks || meetingDetails.ai_next_steps) && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold">AI Insights</p>
                        {meetingDetails.ai_summary && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
                            <p className="text-sm">{meetingDetails.ai_summary}</p>
                          </div>
                        )}
                        {meetingDetails.ai_action_items && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Action Items</p>
                            <ul className="list-disc list-inside text-sm space-y-0.5">
                              {(Array.isArray(meetingDetails.ai_action_items) ? meetingDetails.ai_action_items : String(meetingDetails.ai_action_items).split('\n')).map((it, idx) => (
                                <li key={idx}>{it}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {meetingDetails.ai_risks && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Risks</p>
                            <ul className="list-disc list-inside text-sm space-y-0.5">
                              {(Array.isArray(meetingDetails.ai_risks) ? meetingDetails.ai_risks : String(meetingDetails.ai_risks).split('\n')).map((it, idx) => (
                                <li key={idx}>{it}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {meetingDetails.ai_next_steps && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Next Steps</p>
                            <ul className="list-disc list-inside text-sm space-y-0.5">
                              {(Array.isArray(meetingDetails.ai_next_steps) ? meetingDetails.ai_next_steps : String(meetingDetails.ai_next_steps).split('\n')).map((it, idx) => (
                                <li key={idx}>{it}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-3">
                      <p className="text-sm font-semibold">Ask a custom question</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">Scope:</span>
                        <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                          <input type="radio" name="promptScope" checked={promptScope === 'meeting'} onChange={() => setPromptScope('meeting')} />
                          This meeting only
                        </label>
                        <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                          <input type="radio" name="promptScope" checked={promptScope === 'campaign'} onChange={() => setPromptScope('campaign')} />
                          All meetings in this campaign
                        </label>
                      </div>
                      <Textarea
                        id="customPrompt"
                        rows={3}
                        placeholder="Ask questions like: Summarize stakeholders' concerns; List follow-ups for next week; Extract key metrics discussed."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={handleRunPrompt}
                          disabled={processing || !prompt.trim() || (promptScope === 'meeting' && !meetingDetails?.transcript)}
                        >
                          {processing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Running…</> : 'Run Prompt'}
                        </Button>
                        {promptScope === 'meeting' && !meetingDetails?.transcript && <span className="text-sm text-muted-foreground">Process audio first to generate transcript.</span>}
                        {promptScope === 'campaign' && meetings.length === 0 && <span className="text-sm text-muted-foreground">No meetings found in this campaign.</span>}
                      </div>
                      {promptResult && (
                        <pre className="text-sm p-3 bg-muted/40 rounded-md border whitespace-pre-wrap">{promptResult}</pre>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <p className="text-sm font-semibold">Infographic</p>
                      <Input
                        placeholder="Describe the infographic to generate (optional)"
                        value={infographicDesc}
                        onChange={(e) => setInfographicDesc(e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleGenerateInfographic} disabled={infographicLoading}>
                          {infographicLoading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Generating…</> : 'Generate Infographic'}
                        </Button>
                        {meetingDetails?.infographic_generated_at && (
                          <span className="text-xs text-muted-foreground">Last generated: {new Date(meetingDetails.infographic_generated_at).toLocaleString()}</span>
                        )}
                      </div>
                      {meetingDetails?.infographic_url && (
                        <img
                          src={meetingDetails.infographic_url}
                          alt={meetingDetails.infographic_description || 'Meeting infographic'}
                          className="max-h-96 border rounded-md"
                        />
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* ── Tab 3: Joplin Sync ── */}
              <TabsContent value="joplin">
                <JoplinSync
                  fundraisingId={fundraisingId || undefined}
                  meetingId={selectedMeetingId || undefined}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MeetingManager;
