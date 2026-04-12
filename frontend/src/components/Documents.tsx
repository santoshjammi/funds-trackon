import React, { useState } from 'react';
import DocumentList from './DocumentList';
import DocumentUpload from './DocumentUpload';
import { DocumentMetadata } from '../services/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { List, Upload } from 'lucide-react';

const Documents: React.FC = () => {
  const [tab, setTab] = useState<'list' | 'upload'>('list');
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);

  const handleDocumentSelect = (document: DocumentMetadata) => {
    setSelectedDocument(document);
  };

  const handleUploadSuccess = () => {
    setTab('list');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage documents, notes, and media files for your fundraising campaigns.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'list' | 'upload')}>
        <TabsList>
          <TabsTrigger value="list">
            <List className="w-4 h-4 mr-2" />
            All Documents
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <DocumentList
            onDocumentSelect={handleDocumentSelect}
            onDocumentUpload={() => setTab('upload')}
          />
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <DocumentUpload
            onUploadSuccess={handleUploadSuccess}
            onCancel={() => setTab('list')}
          />
        </TabsContent>
      </Tabs>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={(open) => { if (!open) setSelectedDocument(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              {selectedDocument.description && (
                <p className="text-sm text-muted-foreground">{selectedDocument.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium">Type:</span> {selectedDocument.document_type}</div>
                <div><span className="font-medium">Category:</span> {selectedDocument.category}</div>
                {selectedDocument.filename && (
                  <div><span className="font-medium">File:</span> {selectedDocument.filename}</div>
                )}
                {selectedDocument.file_size && (
                  <div>
                    <span className="font-medium">Size:</span>{' '}
                    {(selectedDocument.file_size / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
              </div>
              {selectedDocument.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDocument.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;

