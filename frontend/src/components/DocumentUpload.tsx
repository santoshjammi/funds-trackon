import React, { useState } from 'react';
import { documentsApi, DocumentType, DocumentCategory } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { SelectNative } from './ui/select-native';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Upload, Loader2 } from 'lucide-react';

interface DocumentUploadProps {
  entityType?: 'fundraising' | 'organization' | 'contact' | 'task' | 'opportunity' | 'meeting';
  entityId?: string;
  onUploadSuccess?: () => void;
  onCancel?: () => void;
}

const documentTypeOptions: { value: DocumentType; label: string }[] = [
  { value: 'text', label: 'Text Document' }, { value: 'audio', label: 'Audio Recording' },
  { value: 'image', label: 'Image' }, { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document (PDF, DOC, etc.)' }, { value: 'presentation', label: 'Presentation' },
  { value: 'spreadsheet', label: 'Spreadsheet' }, { value: 'other', label: 'Other' }
];

const categoryOptions: { value: DocumentCategory; label: string }[] = [
  { value: 'summary', label: 'Summary' }, { value: 'notes', label: 'Notes' },
  { value: 'discussion', label: 'Discussion' }, { value: 'meeting_minutes', label: 'Meeting Minutes' },
  { value: 'presentation', label: 'Presentation' }, { value: 'contract', label: 'Contract' },
  { value: 'research', label: 'Research' }, { value: 'correspondence', label: 'Correspondence' },
  { value: 'other', label: 'Other' }
];

const DocumentUpload: React.FC<DocumentUploadProps> = ({ entityType, entityId, onUploadSuccess, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('document');
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext) {
      if (['pdf','doc','docx','txt'].includes(ext)) setDocumentType('document');
      else if (['jpg','jpeg','png','gif','webp'].includes(ext)) setDocumentType('image');
      else if (['mp3','wav','ogg','m4a'].includes(ext)) setDocumentType('audio');
      else if (['mp4','webm','avi','mov'].includes(ext)) setDocumentType('video');
      else if (['ppt','pptx'].includes(ext)) setDocumentType('presentation');
      else if (['xls','xlsx','csv'].includes(ext)) setDocumentType('spreadsheet');
    }
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) { setError('Please select a file and provide a title'); return; }
    setUploading(true); setError(null);
    try {
      await documentsApi.upload({
        file, title: title.trim(),
        description: description.trim() || undefined,
        document_type: documentType, category,
        tags: tags.trim() || undefined, is_public: isPublic,
        ...(entityType && entityId && { [`${entityType}_id`]: entityId })
      });
      onUploadSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-md border p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Upload Document</h2>
        {entityType && entityId && (
          <p className="text-sm text-muted-foreground mt-0.5">for {entityType} {entityId}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="doc-file">File <span className="text-destructive">*</span></Label>
          <input
            id="doc-file"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:text-sm file:font-medium file:bg-background hover:file:bg-muted cursor-pointer"
            accept="*/*"
            title="Select a file to upload"
          />
          {file && <p className="text-xs text-muted-foreground">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="doc-title">Title <span className="text-destructive">*</span></Label>
          <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter document title" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="doc-desc">Description</Label>
          <Textarea id="doc-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Enter document description (optional)" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Document Type</Label>
            <SelectNative value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentType)}>
              {documentTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </SelectNative>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <SelectNative value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
              {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </SelectNative>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="doc-tags">Tags</Label>
          <Input id="doc-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Enter tags separated by commas (optional)" />
          <p className="text-xs text-muted-foreground">Separate multiple tags with commas</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox" id="isPublic" checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
            aria-label="Make this document publicly accessible"
          />
          <Label htmlFor="isPublic" className="font-normal cursor-pointer">Make this document publicly accessible</Label>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={uploading}>Cancel</Button>
          )}
          <Button type="submit" disabled={uploading || !file || !title.trim()}>
            {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</> : <><Upload className="mr-2 h-4 w-4" />Upload Document</>}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUpload;

interface DocumentUploadProps {
  entityType?: 'fundraising' | 'organization' | 'contact' | 'task' | 'opportunity' | 'meeting';
  entityId?: string;
  onUploadSuccess?: () => void;
  onCancel?: () => void;
}
