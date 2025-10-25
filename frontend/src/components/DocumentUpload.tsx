import React, { useState } from 'react';
import { documentsApi, DocumentType, DocumentCategory } from '../services/api';

interface DocumentUploadProps {
  entityType?: 'fundraising' | 'organization' | 'contact' | 'task' | 'opportunity' | 'meeting';
  entityId?: string;
  onUploadSuccess?: () => void;
  onCancel?: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  entityType,
  entityId,
  onUploadSuccess,
  onCancel
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('document');
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documentTypeOptions: { value: DocumentType; label: string }[] = [
    { value: 'text', label: 'Text Document' },
    { value: 'audio', label: 'Audio Recording' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'document', label: 'Document (PDF, DOC, etc.)' },
    { value: 'presentation', label: 'Presentation (PPT, etc.)' },
    { value: 'spreadsheet', label: 'Spreadsheet (XLS, etc.)' },
    { value: 'other', label: 'Other' }
  ];

  const categoryOptions: { value: DocumentCategory; label: string }[] = [
    { value: 'summary', label: 'Summary' },
    { value: 'notes', label: 'Notes' },
    { value: 'discussion', label: 'Discussion' },
    { value: 'meeting_minutes', label: 'Meeting Minutes' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'contract', label: 'Contract' },
    { value: 'research', label: 'Research' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'other', label: 'Other' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Auto-detect document type based on file extension
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension) {
        if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) {
          setDocumentType('document');
        } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
          setDocumentType('image');
        } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
          setDocumentType('audio');
        } else if (['mp4', 'webm', 'avi', 'mov'].includes(extension)) {
          setDocumentType('video');
        } else if (['ppt', 'pptx'].includes(extension)) {
          setDocumentType('presentation');
        } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
          setDocumentType('spreadsheet');
        }
      }

      // Auto-set title if empty
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError('Please select a file and provide a title');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadData = {
        file,
        title: title.trim(),
        description: description.trim() || undefined,
        document_type: documentType,
        category,
        tags: tags.trim() || undefined,
        is_public: isPublic,
        ...(entityType && entityId && { [`${entityType}_id`]: entityId })
      };

      await documentsApi.upload(uploadData);
      onUploadSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Upload Document
        {entityType && entityId && (
          <span className="text-sm text-gray-500 ml-2">
            for {entityType} {entityId}
          </span>
        )}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File *
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            accept="*/*"
            title="Select a file to upload"
          />
          {file && (
            <p className="mt-1 text-sm text-gray-500">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter document title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter document description (optional)"
          />
        </div>

        {/* Document Type and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Select document type"
            >
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Select document category"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter tags separated by commas (optional)"
          />
          <p className="mt-1 text-sm text-gray-500">
            Separate multiple tags with commas
          </p>
        </div>

        {/* Public Access */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
            Make this document publicly accessible
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={uploading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={uploading || !file || !title.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUpload;