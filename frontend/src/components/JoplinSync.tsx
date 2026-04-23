import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Image,
  Loader2,
  RefreshCw,
  Search,
  Tag,
  Volume2,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { joplinApi } from '../services/api';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { SelectNative } from './ui/select-native';

// ------------------------------------------------------------------ //
// Types                                                                //
// ------------------------------------------------------------------ //

interface JoplinNote {
  id: string;
  title: string;
  body?: string;
  parent_id?: string;
  updated_time?: number;
}

interface JoplinNotebook {
  id: string;
  title: string;
  parent_id?: string;
}

interface JoplinTag {
  id: string;
  title: string;
}

interface ExtractedItem {
  title: string;
  description?: string;
  priority?: string;
  task_type?: string;
}

interface ExtractedOpportunity {
  title: string;
  description?: string;
  organisation?: string;
  estimated_value?: number | null;
  probability?: number | null;
}

interface Extracted {
  action_items: ExtractedItem[];
  opportunities: ExtractedOpportunity[];
  participants: string[];
  follow_up_date: string | null;
}

interface SyncResult {
  skipped?: boolean;
  reason?: string;
  note_title?: string;
  tasks_created?: number;
  opportunities_created?: number;
  task_ids?: string[];
  opportunity_ids?: string[];
  extracted?: Extracted;
  last_synced_at?: string;
}

// ------------------------------------------------------------------ //
// STORAGE KEY for user preferences                                     //
// ------------------------------------------------------------------ //
const PREFS_KEY = 'joplin_sync_prefs';

function loadPrefs(): { notebookId: string; tagId: string; filterMode: string } {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch {
    return { notebookId: '', tagId: '', filterMode: 'all' };
  }
}

function savePrefs(p: { notebookId: string; tagId: string; filterMode: string }) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {}
}

// ------------------------------------------------------------------ //
// Component                                                            //
// ------------------------------------------------------------------ //

interface Props {
  /** The fundraising campaign to link synced Tasks/Opportunities to. */
  fundraisingId?: string;
  /** Optional contact to link synced records to. */
  contactId?: string;
  /** The specific meeting to link synced records to. */
  meetingId?: string;
}

export const JoplinSync: React.FC<Props> = ({ fundraisingId, contactId, meetingId }) => {
  // --- connection ---
  const [connected, setConnected] = useState<boolean | null>(null);
  const [statusLabel, setStatusLabel] = useState('');

  // --- source config ---
  const prefs = loadPrefs();
  const [filterMode, setFilterMode] = useState<'all' | 'notebook' | 'tag' | 'search'>(
    (prefs.filterMode as 'all' | 'notebook' | 'tag' | 'search') || 'all'
  );
  const [notebooks, setNotebooks] = useState<JoplinNotebook[]>([]);
  const [tags, setTags] = useState<JoplinTag[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState(prefs.notebookId || '');
  const [selectedTag, setSelectedTag] = useState(prefs.tagId || '');
  const [searchQuery, setSearchQuery] = useState('');

  // --- notes list ---
  const [notes, setNotes] = useState<JoplinNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  // --- per-note state ---
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  // note body cache: noteId → { title, body }
  const [noteBodies, setNoteBodies] = useState<Record<string, { title: string; body: string }>>({});
  const [loadingBody, setLoadingBody] = useState<string | null>(null);
  // extraction cache: noteId → Extracted
  const [previews, setPreviews] = useState<Record<string, Extracted>>({});
  const [extracting, setExtracting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({}); 

  // --- already-synced notes for this campaign/meeting ---
  const [linkedNotes, setLinkedNotes] = useState<Array<{
    note_id: string; note_title: string; last_synced_at: string;
    tasks_created: number; opportunities_created: number;
    task_ids: string[]; opportunity_ids: string[];
    audio_url: string | null; infographic_url: string | null; has_body: boolean;
  }>>([]);
  const [loadingLinked, setLoadingLinked] = useState(false); 

  // ---------------------------------------------------------------- //
  // Status check                                                       //
  // ---------------------------------------------------------------- //

  const checkStatus = useCallback(async () => {
    setConnected(null);
    setStatusLabel('Checking…');
    const res = await joplinApi.status();
    setConnected(res.connected);
    setStatusLabel(res.connected ? (res.joplin_response || 'Connected') : (res.error || 'Not connected'));
    if (res.connected) {
      const [nb, tg] = await Promise.all([
        joplinApi.listNotebooks(),
        joplinApi.listTags(),
      ]);
      setNotebooks(nb);
      setTags(tg);
    }
  }, []);

  const fetchLinkedNotes = useCallback(async () => {
    if (!fundraisingId && !meetingId && !contactId) return;
    setLoadingLinked(true);
    try {
      const records = await joplinApi.listSyncedNotes({ fundraisingId, meetingId, contactId });
      setLinkedNotes(records);
    } catch {
      // non-fatal — just leave empty
    } finally {
      setLoadingLinked(false);
    }
  }, [fundraisingId, meetingId, contactId]);

  useEffect(() => {
    checkStatus();
    fetchLinkedNotes();
  }, [checkStatus, fetchLinkedNotes]);

  // persist prefs
  useEffect(() => {
    savePrefs({ notebookId: selectedNotebook, tagId: selectedTag, filterMode });
  }, [selectedNotebook, selectedTag, filterMode]);

  // ---------------------------------------------------------------- //
  // Load notes                                                         //
  // ---------------------------------------------------------------- //

  const loadNotes = useCallback(
    async (reset = true) => {
      if (!connected) return;
      setLoadingNotes(true);
      setNotesError(null);
      try {
        const nextPage = reset ? 1 : page + 1;
        const res = await joplinApi.listNotes({
          notebookId: filterMode === 'notebook' ? selectedNotebook : undefined,
          tagId: filterMode === 'tag' ? selectedTag : undefined,
          search: filterMode === 'search' ? searchQuery : undefined,
          page: nextPage,
        });
        const items: JoplinNote[] = res.items || [];
        if (reset) {
          setNotes(items);
          setPage(1);
        } else {
          setNotes((prev) => [...prev, ...items]);
          setPage(nextPage);
        }
        setHasMore(res.has_more ?? false);
      } catch (err: any) {
        setNotesError(err?.message || 'Failed to load notes');
      } finally {
        setLoadingNotes(false);
      }
    },
    [connected, filterMode, selectedNotebook, selectedTag, searchQuery, page]
  );

  // ---------------------------------------------------------------- //
  // Preview + Sync                                                     //
  // ---------------------------------------------------------------- //

  const handleToggleNote = async (noteId: string) => {
    // Collapse if already open
    if (expandedNote === noteId) {
      setExpandedNote(null);
      return;
    }
    setExpandedNote(noteId);
    // Fetch body if not cached
    if (!noteBodies[noteId]) {
      setLoadingBody(noteId);
      try {
        const res = await joplinApi.getNote(noteId);
        setNoteBodies((p) => ({ ...p, [noteId]: { title: res.note.title, body: res.note.body } }));
      } catch (err: any) {
        setNotesError(err?.message || 'Failed to load note');
      } finally {
        setLoadingBody(null);
      }
    }
  };

  const handleExtract = async (noteId: string) => {
    setExtracting(noteId);
    try {
      const res = await joplinApi.extractNote(noteId);
      setPreviews((p) => ({ ...p, [noteId]: res.extracted }));
      // Also cache body if not already
      if (!noteBodies[noteId]) {
        setNoteBodies((p) => ({ ...p, [noteId]: { title: res.note.title, body: res.note.body } }));
      }
    } catch (err: any) {
      setNotesError(err?.message || 'Extraction failed');
    } finally {
      setExtracting(null);
    }
  };

  const handleSync = async (noteId: string) => {
    setSyncing(noteId);
    try {
      const res = await joplinApi.syncNote(noteId, { fundraisingId, contactId, meetingId });
      setSyncResults((p) => ({ ...p, [noteId]: res }));
      // Refresh the linked notes panel
      fetchLinkedNotes();
    } catch (err: any) {
      setSyncResults((p) => ({
        ...p,
        [noteId]: { skipped: false, reason: err?.message || 'Sync failed' },
      }));
    } finally {
      setSyncing(null);
    }
  };

  // ---------------------------------------------------------------- //
  // Render helpers                                                     //
  // ---------------------------------------------------------------- //

  const statusBadge = () => {
    if (connected === null) return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Checking</Badge>;
    if (connected) return <Badge className="bg-green-600 hover:bg-green-600 text-white"><Wifi className="h-3 w-3 mr-1" />Connected</Badge>;
    return <Badge variant="destructive"><WifiOff className="h-3 w-3 mr-1" />Not connected</Badge>;
  };

  // ---------------------------------------------------------------- //
  // Render                                                             //
  // ---------------------------------------------------------------- //

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Joplin Sync
          </CardTitle>
          <div className="flex items-center gap-2">
            {statusBadge()}
            <Button variant="ghost" size="icon" onClick={checkStatus} title="Refresh connection">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {statusLabel && (
          <p className="text-xs text-muted-foreground mt-1">{statusLabel}</p>
        )}
      </CardHeader>

      {connected && (
        <CardContent className="space-y-4">
          {/* ── Already-linked notes ── */}
          {(fundraisingId || meetingId || contactId) && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Linked Notes
                {loadingLinked && <Loader2 className="h-3 w-3 animate-spin" />}
              </p>
              {!loadingLinked && linkedNotes.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No notes synced yet for this {meetingId ? 'meeting' : fundraisingId ? 'campaign' : 'contact'}.</p>
              )}
              {linkedNotes.map((rec) => (
                <div key={rec.note_id} className="rounded border px-3 py-2 text-xs bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate flex-1">{rec.note_title || rec.note_id}</span>
                    <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                      {rec.tasks_created > 0 && (
                        <Badge variant="secondary" className="text-xs">{rec.tasks_created}T</Badge>
                      )}
                      {rec.opportunities_created > 0 && (
                        <Badge variant="secondary" className="text-xs">{rec.opportunities_created}O</Badge>
                      )}
                      <span className="text-xs">{new Date(rec.last_synced_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {/* Asset links */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {rec.has_body && (
                      <a
                        href={`/api/joplin/synced-notes/${rec.note_id}/text`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <FileText className="h-3 w-3" />Text
                      </a>
                    )}
                    {rec.audio_url && (
                      <a
                        href={rec.audio_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline"
                      >
                        <Volume2 className="h-3 w-3" />Audio
                      </a>
                    )}
                    {rec.infographic_url && (
                      <a
                        href={rec.infographic_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                      >
                        <Image className="h-3 w-3" />Infographic
                      </a>
                    )}
                    {!rec.has_body && !rec.audio_url && !rec.infographic_url && (
                      <span className="text-muted-foreground italic">No assets generated</span>
                    )}
                  </div>
                </div>
              ))}
              <Separator />
            </div>
          )}

          {/* ── Filter config ── */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Filter notes by</Label>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'notebook', 'tag', 'search'] as const).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={filterMode === m ? 'default' : 'outline'}
                  onClick={() => setFilterMode(m)}
                  className="capitalize"
                >
                  {m === 'all' && <Zap className="h-3 w-3 mr-1" />}
                  {m === 'notebook' && <BookOpen className="h-3 w-3 mr-1" />}
                  {m === 'tag' && <Tag className="h-3 w-3 mr-1" />}
                  {m === 'search' && <Search className="h-3 w-3 mr-1" />}
                  {m}
                </Button>
              ))}
            </div>

            {filterMode === 'notebook' && (
              <SelectNative
                value={selectedNotebook}
                onChange={(e) => setSelectedNotebook(e.target.value)}
              >
                <option value="">— pick a notebook —</option>
                {notebooks.map((nb) => (
                  <option key={nb.id} value={nb.id}>{nb.title}</option>
                ))}
              </SelectNative>
            )}

            {filterMode === 'tag' && (
              <SelectNative
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                <option value="">— pick a tag —</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </SelectNative>
            )}

            {filterMode === 'search' && (
              <div className="flex gap-2">
                <Input
                  placeholder="Search notes…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadNotes()}
                />
              </div>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => loadNotes(true)}
            disabled={loadingNotes}
          >
            {loadingNotes
              ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Loading…</>
              : <><Search className="h-4 w-4 mr-1" />Load Notes</>
            }
          </Button>

          {notesError && (
            <p className="text-sm text-destructive">{notesError}</p>
          )}

          {/* ── Note list ── */}
          {notes.length > 0 && (
            <div className="space-y-2">
              <Separator />
              <p className="text-xs text-muted-foreground">{notes.length} note{notes.length !== 1 ? 's' : ''} loaded</p>
              {notes.map((note) => {
                const result = syncResults[note.id];
                const preview = previews[note.id];
                const body = noteBodies[note.id];
                const isExpanded = expandedNote === note.id;
                const linkedRecord = linkedNotes.find((r) => r.note_id === note.id);

                return (
                  <div
                    key={note.id}
                    className={`border rounded-md overflow-hidden ${linkedRecord ? 'border-blue-300 dark:border-blue-700' : ''}`}
                  >
                    {/* Note header row */}
                    <div className={`flex items-center justify-between gap-2 px-3 py-2 ${linkedRecord ? 'bg-blue-50/60 dark:bg-blue-950/30' : 'bg-muted/30'}`}>
                      <button
                        className="flex items-center gap-1.5 text-sm font-medium flex-1 text-left hover:text-primary transition-colors"
                        onClick={() => handleToggleNote(note.id)}
                      >
                        {isExpanded
                          ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                          : <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        }
                        {note.title || '(Untitled)'}
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {linkedRecord && (
                          <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-xs" title={`Synced on ${new Date(linkedRecord.last_synced_at).toLocaleString()}`}>
                            <Check className="h-3 w-3 mr-1" />
                            Linked · {linkedRecord.tasks_created}T / {linkedRecord.opportunities_created}O
                          </Badge>
                        )}
                        {result?.skipped && !linkedRecord && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />Already synced
                          </Badge>
                        )}
                        {result && !result.skipped && !linkedRecord && (
                          <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            {result.tasks_created ?? 0}T / {result.opportunities_created ?? 0}O created
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExtract(note.id)}
                          disabled={extracting === note.id || syncing === note.id}
                          title="Run AI extraction to identify tasks and opportunities"
                        >
                          {extracting === note.id
                            ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Extracting…</>
                            : <><Search className="h-3.5 w-3.5 mr-1" />Extract</>
                          }
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSync(note.id)}
                          disabled={syncing === note.id || extracting === note.id}
                          title="Extract and save tasks/opportunities to CRM"
                        >
                          {syncing === note.id
                            ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Syncing…</>
                            : <><Zap className="h-3.5 w-3.5 mr-1" />Sync to CRM</>
                          }
                        </Button>
                      </div>
                    </div>

                    {/* Expanded panel: note body + extracted data */}
                    {isExpanded && (
                      <div className="border-t divide-y text-sm">
                        {/* Note body */}
                        <div className="px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Note Content</p>
                          {loadingBody === note.id && (
                            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />Loading…
                            </p>
                          )}
                          {body ? (
                            <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground max-h-64 overflow-y-auto">
                              {body.body || '(empty)'}
                            </pre>
                          ) : !loadingBody && (
                            <p className="text-xs text-muted-foreground italic">Click the title to load content.</p>
                          )}
                        </div>

                        {/* Extracted data (only shown after Extract is clicked) */}
                        {preview && (
                          <div className="px-4 py-3 space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Extraction Results</p>

                            {preview.participants.length > 0 && (
                              <div>
                                <p className="font-medium text-xs text-muted-foreground mb-1">Participants</p>
                                <p className="text-xs">{preview.participants.join(', ')}</p>
                              </div>
                            )}

                            {preview.action_items.length > 0 && (
                              <div>
                                <p className="font-medium text-xs text-muted-foreground mb-1">
                                  Action Items / Tasks ({preview.action_items.length})
                                </p>
                                <ul className="space-y-1">
                                  {preview.action_items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                      <Badge variant="outline" className="text-xs mt-0.5 shrink-0">{item.priority || 'medium'}</Badge>
                                      <span className="text-xs">{item.title}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {preview.opportunities.length > 0 && (
                              <div>
                                <p className="font-medium text-xs text-muted-foreground mb-1">
                                  Opportunities ({preview.opportunities.length})
                                </p>
                                <ul className="space-y-1">
                                  {preview.opportunities.map((opp, i) => (
                                    <li key={i} className="text-xs">
                                      <span className="font-medium">{opp.title}</span>
                                      {opp.organisation && <span className="text-muted-foreground"> — {opp.organisation}</span>}
                                      {opp.estimated_value != null && (
                                        <span className="text-muted-foreground"> • ₹{opp.estimated_value} Cr</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {preview.follow_up_date && (
                              <p className="text-xs text-muted-foreground">Follow-up: {preview.follow_up_date}</p>
                            )}

                            {preview.action_items.length === 0 && preview.opportunities.length === 0 && (
                              <p className="text-xs text-muted-foreground italic">No tasks or opportunities found in this note.</p>
                            )}

                            {(preview.action_items.length > 0 || preview.opportunities.length > 0) && !result && (
                              <Button
                                size="sm"
                                onClick={() => handleSync(note.id)}
                                disabled={syncing === note.id}
                                className="mt-1"
                              >
                                {syncing === note.id
                                  ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Creating…</>
                                  : <><Check className="h-3.5 w-3.5 mr-1" />Create {preview.action_items.length} task{preview.action_items.length !== 1 ? 's' : ''}{preview.opportunities.length > 0 ? ` + ${preview.opportunities.length} opportunit${preview.opportunities.length !== 1 ? 'ies' : 'y'}` : ''} in CRM</>
                                }
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadNotes(false)}
                  disabled={loadingNotes}
                >
                  {loadingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load more'}
                </Button>
              )}
            </div>
          )}

          {notes.length === 0 && !loadingNotes && !notesError && (
            <p className="text-sm text-muted-foreground">
              Click <strong>Load Notes</strong> to browse your Joplin notes.
            </p>
          )}
        </CardContent>
      )}

      {connected === false && (
        <CardContent>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-1.5">
            <p className="text-sm font-medium text-amber-800">Joplin not connected</p>
            <p className="text-xs text-amber-700">
              Configure your Joplin API URL and token in{' '}
              <strong>Account Settings → Joplin Connection</strong>, then come back here.
            </p>
            <p className="text-xs text-amber-600">
              Make sure Joplin Desktop is open and Web Clipper is enabled:{' '}
              <em>Tools → Options → Web Clipper</em>.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default JoplinSync;
