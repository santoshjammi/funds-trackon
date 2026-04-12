import React, { useState, useEffect } from 'react';
import { documentsApi, DocumentMetadata, DocumentType, DocumentCategory } from '../services/api';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Download, Eye, Upload, FileText, Music, Image, Video, File, Table2, PresentationIcon } from 'lucide-react';

interface DocumentListProps {
  entityType?: 'fundraising' | 'organization' | 'contact' | 'task' | 'opportunity' | 'meeting';
  entityId?: string;
  documentType?: DocumentType;
  category?: DocumentCategory;
  onDocumentSelect?: (document: DocumentMetadata) => void;
  onDocumentUpload?: () => void;
}

const DocIcon = ({ type }: { type: DocumentType }) => {
  const cls = 'h-8 w-8 text-muted-foreground';
  switch (type) {
    case 'audio': return <Music className={cls} />;
    case 'image': return <Image className={cls} />;
    case 'video': return <Video className={cls} />;
    case 'presentation': return <File className={cls} />;
    case 'spreadsheet': return <Table2 className={cls} />;
    default: return <FileText className={cls} />;
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
};

const DocumentList: React.FC<DocumentListProps> = ({ entityType, entityId, documentType, category, onDocumentSelect, onDocumentUpload }) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadDocuments(); }, [entityType, entityId, documentType, category]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDocuments = async () => {
    setLoading(true); setError(null);
    try {
      const docs = entityType && entityId
        ? await documentsApi.getKnowledgeBase(entityType, entityId, documentType, category)
        : await documentsApi.getAll({ document_type: documentType, category });
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: DocumentMetadata) => {
    try {
      const blob = await documentsApi.download(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = doc.filename || `document_${doc.id}`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );

  if (error) return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  const title = entityType && entityId
    ? `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Knowledge Base`
    : 'Documents';

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-base font-semibold">{title}</h3>
        {onDocumentUpload && (
          <Button onClick={onDocumentUpload} size="sm">
            <Upload className="w-4 h-4 mr-2" />Upload
          </Button>
        )}
      </div>

      <div className="divide-y">
        {documents.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No documents found.{onDocumentUpload && ' Upload your first document to get started.'}
          </div>
        ) : documents.map((doc) => (
          <div key={doc.id} className="flex items-start gap-3 px-4 py-4 hover:bg-muted/30 transition-colors">
            <div className="shrink-0 mt-1"><DocIcon type={doc.document_type} /></div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium">{doc.title}</h4>
              {doc.description && <p className="text-sm text-muted-foreground mt-0.5 truncate">{doc.description}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="capitalize">{doc.category.replace('_', ' ')}</span>
                {doc.filename && <span>{doc.filename}</span>}
                {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
              </div>
              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {doc.tags.map((tag, i) => <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {doc.filename && (
                <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)} title="Download">
                  <Download className="w-4 h-4" />
                </Button>
              )}
              {onDocumentSelect && (
                <Button variant="ghost" size="icon" onClick={() => onDocumentSelect(doc)} title="View">
                  <Eye className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;

interface DocumentListProps {
  entityType?: 'fundraising' | 'organization' | 'contact' | 'task' | 'opportunity' | 'meeting';
  entityId?: string;
  documentType?: DocumentType;
  category?: DocumentCategory;
  onDocumentSelect?: (document: DocumentMetadata) => void;
  onDocumentUpload?: () => void;
}
