// Document/Knowledge Base Types
export type DocumentType = 'text' | 'audio' | 'image' | 'video' | 'document' | 'presentation' | 'spreadsheet' | 'other';

export type DocumentCategory = 'summary' | 'notes' | 'discussion' | 'meeting_minutes' | 'presentation' | 'contract' | 'research' | 'correspondence' | 'other';

export type DocumentStatus = 'active' | 'archived' | 'deleted';

export interface DocumentMetadata {
  id: string;
  title: string;
  description?: string;
  document_type: DocumentType;
  category: DocumentCategory;
  filename?: string;
  file_size?: number;
  mime_type?: string;
  fundraising_id?: string;
  organization_id?: string;
  contact_id?: string;
  task_id?: string;
  opportunity_id?: string;
  meeting_id?: string;
  tags: string[];
  status: DocumentStatus;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreateRequest {
  title: string;
  description?: string;
  document_type: DocumentType;
  category?: DocumentCategory;
  content?: string;
  fundraising_id?: string;
  organization_id?: string;
  contact_id?: string;
  task_id?: string;
  opportunity_id?: string;
  meeting_id?: string;
  tags?: string[];
  is_public?: boolean;
}

export interface DocumentUpdateRequest {
  title?: string;
  description?: string;
  category?: DocumentCategory;
  content?: string;
  tags?: string[];
  is_public?: boolean;
}

export interface DocumentUploadRequest {
  title: string;
  description?: string;
  document_type: DocumentType;
  category?: DocumentCategory;
  fundraising_id?: string;
  organization_id?: string;
  contact_id?: string;
  task_id?: string;
  opportunity_id?: string;
  meeting_id?: string;
  tags?: string;
  is_public?: boolean;
}