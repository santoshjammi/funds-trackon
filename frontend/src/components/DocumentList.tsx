import React, { useState, useEffect } from 'react';
import { documentsApi, DocumentMetadata, DocumentType, DocumentCategory } from '../services/api';

interface DocumentListProps {
  entityType?: 'fundraising' | 'organization' | 'contact' | 'task' | 'opportunity' | 'meeting';
  entityId?: string;
  documentType?: DocumentType;
  category?: DocumentCategory;
  onDocumentSelect?: (document: DocumentMetadata) => void;
  onDocumentUpload?: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  entityType,
  entityId,
  documentType,
  category,
  onDocumentSelect,
  onDocumentUpload
}) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [entityType, entityId, documentType, category]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      let docs: DocumentMetadata[];
      if (entityType && entityId) {
        docs = await documentsApi.getKnowledgeBase(entityType, entityId, documentType, category);
      } else {
        docs = await documentsApi.getAll({
          document_type: documentType,
          category: category
        });
      }
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
      a.href = url;
      a.download = doc.filename || `document_${doc.id}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download document: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentTypeIcon = (type: DocumentType): string => {
    const icons: Record<DocumentType, string> = {
      text: '📄',
      audio: '🎵',
      image: '🖼️',
      video: '🎥',
      document: '📋',
      presentation: '📊',
      spreadsheet: '📈',
      other: '📁'
    };
    return icons[type] || '📁';
  };

  if (loading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }

  if (error) {
    return <div className="text-red-600 py-4">Error: {error}</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          {entityType && entityId ? `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Knowledge Base` : 'Documents'}
        </h3>
        {onDocumentUpload && (
          <button
            onClick={onDocumentUpload}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Upload Document
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {documents.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No documents found. {onDocumentUpload && 'Upload your first document to get started.'}
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="px-4 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getDocumentTypeIcon(doc.document_type)}</span>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{doc.title}</h4>
                    {doc.description && (
                      <p className="text-sm text-gray-500">{doc.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                      <span>{doc.category.replace('_', ' ')}</span>
                      {doc.filename && <span>{doc.filename}</span>}
                      {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                    {doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {doc.filename && (
                    <button
                      onClick={() => handleDownload(doc)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Download
                    </button>
                  )}
                  {onDocumentSelect && (
                    <button
                      onClick={() => onDocumentSelect(doc)}
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentList;