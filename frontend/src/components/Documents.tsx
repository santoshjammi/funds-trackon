import React, { useState } from 'react';
import DocumentList from './DocumentList';
import DocumentUpload from './DocumentUpload';
import { DocumentMetadata } from '../services/api';

const Documents: React.FC = () => {
  const [view, setView] = useState<'list' | 'upload'>('list');
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);

  const handleDocumentSelect = (document: DocumentMetadata) => {
    setSelectedDocument(document);
    // Here you could open a modal or navigate to a detail view
    console.log('Selected document:', document);
  };

  const handleUploadSuccess = () => {
    setView('list');
    // Optionally refresh the document list
    window.location.reload(); // Simple refresh for now
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
        <p className="mt-2 text-gray-600">
          Manage documents, notes, and media files for your fundraising campaigns and business relationships.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setView('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              view === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setView('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              view === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upload Document
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {view === 'list' && (
          <DocumentList
            onDocumentSelect={handleDocumentSelect}
            onDocumentUpload={() => setView('upload')}
          />
        )}

        {view === 'upload' && (
          <DocumentUpload
            onUploadSuccess={handleUploadSuccess}
            onCancel={() => setView('list')}
          />
        )}
      </div>

      {/* Document Detail Modal (placeholder for future implementation) */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedDocument.title}
              </h3>
              <div className="space-y-3">
                {selectedDocument.description && (
                  <p className="text-gray-600">{selectedDocument.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {selectedDocument.document_type}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> {selectedDocument.category}
                  </div>
                  {selectedDocument.filename && (
                    <div>
                      <span className="font-medium">File:</span> {selectedDocument.filename}
                    </div>
                  )}
                  {selectedDocument.file_size && (
                    <div>
                      <span className="font-medium">Size:</span> {(selectedDocument.file_size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  )}
                </div>
                {selectedDocument.tags.length > 0 && (
                  <div>
                    <span className="font-medium">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedDocument.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;