import { useState, useRef } from 'react';
import { RefreshCw, X, FileText, Download, Calendar, User, Building2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LegalDocumentsTable, LegalDocument, DocumentType, DocumentStatus } from '../components';
import { useLegalDocuments } from '../hooks';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocumentType(filename: string): DocumentType {
  const lower = filename.toLowerCase();
  if (lower.includes('subscription')) return 'subscription';
  if (lower.includes('ppm')) return 'ppm';
  if (lower.includes('k-1') || lower.includes('k1')) return 'k1';
  if (lower.includes('report')) return 'report';
  if (lower.includes('capital') || lower.includes('call')) return 'capital_call';
  if (lower.includes('kyc')) return 'kyc';
  return 'other';
}

interface PendingUpload {
  file: File;
  name: string;
  type: DocumentType;
  content: string;
}

export function LegalDocuments() {
  const { data: fetchedDocuments, isLoading } = useLegalDocuments();
  const [uploadedDocuments, setUploadedDocuments] = useState<LegalDocument[]>([]);
  const [deletedDocumentIds, setDeletedDocumentIds] = useState<Set<string>>(new Set());
  const [statusOverrides, setStatusOverrides] = useState<Map<string, DocumentStatus>>(new Map());
  const [viewingDocument, setViewingDocument] = useState<LegalDocument | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<LegalDocument | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [lastUploadedFiles, setLastUploadedFiles] = useState<string[]>([]);
  const [uploadedFileContents, setUploadedFileContents] = useState<Map<string, string>>(new Map());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState<DocumentType>('other');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combine fetched documents with uploaded documents, excluding deleted ones, and apply status overrides
  const allDocuments = [...(uploadedDocuments || []), ...(fetchedDocuments || [])]
    .filter((doc) => !deletedDocumentIds.has(doc.id))
    .map((doc) => ({
      ...doc,
      status: statusOverrides.get(doc.id) || doc.status,
    }));

  const handleView = (id: string) => {
    const doc = allDocuments.find((d) => d.id === id);
    if (doc) {
      setViewingDocument(doc);
    }
  };

  const handleDownload = (id: string) => {
    const doc = allDocuments.find((d) => d.id === id);
    if (doc) {
      // Check if we have stored content for this uploaded file
      const storedContent = uploadedFileContents.get(id);
      
      let blob: Blob;
      if (storedContent) {
        // Use the actual uploaded file content
        blob = new Blob([storedContent], { type: 'application/octet-stream' });
      } else {
        // Create sample content for mock documents
        const content = `
Document: ${doc.name}
Type: ${doc.type}
Status: ${doc.status}
Created: ${new Date(doc.createdAt).toLocaleDateString()}

This is a sample document content for demonstration purposes.
In a real application, this would download the actual document from storage.
        `;
        blob = new Blob([content], { type: 'text/plain' });
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name.includes('.') ? doc.name : `${doc.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleUpload = () => {
    setShowUploadModal(true);
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          // Set up pending upload with file content
          const suggestedName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
          const suggestedType = getDocumentType(file.name);
          
          setPendingUpload({
            file,
            name: suggestedName,
            type: suggestedType,
            content: event.target.result as string,
          });
          setUploadName(suggestedName);
          setUploadType(suggestedType);
        }
      };
      reader.readAsText(file);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmUpload = () => {
    if (!pendingUpload) return;
    
    const docId = `uploaded-${Date.now()}`;
    const fileExtension = pendingUpload.file.name.split('.').pop() || '';
    
    // Store file content
    const newContents = new Map(uploadedFileContents);
    newContents.set(docId, pendingUpload.content);
    setUploadedFileContents(newContents);
    
    // Create document entry with custom name and type
    const newDoc: LegalDocument = {
      id: docId,
      name: uploadName + (fileExtension ? `.${fileExtension}` : ''),
      type: uploadType,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileSize: formatFileSize(pendingUpload.file.size),
    };
    
    // Add to uploaded documents list
    setUploadedDocuments((prev) => [newDoc, ...prev]);
    setLastUploadedFiles([newDoc.name]);
    setShowUploadSuccess(true);
    
    // Reset upload modal state
    setShowUploadModal(false);
    setPendingUpload(null);
    setUploadName('');
    setUploadType('other');
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      setShowUploadSuccess(false);
    }, 5000);
  };

  const cancelUpload = () => {
    setShowUploadModal(false);
    setPendingUpload(null);
    setUploadName('');
    setUploadType('other');
  };

  const closeModal = () => {
    setViewingDocument(null);
  };

  const handleDelete = (id: string) => {
    const doc = allDocuments.find((d) => d.id === id);
    if (doc) {
      setDocumentToDelete(doc);
      setDeleteConfirmText('');
    }
  };

  const handleStatusChange = (id: string, status: DocumentStatus) => {
    setStatusOverrides((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, status);
      return newMap;
    });
    
    // Also update uploaded documents if it's an uploaded one
    setUploadedDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, status } : doc
      )
    );
  };

  const confirmDelete = () => {
    if (documentToDelete && deleteConfirmText === 'CONFIRM') {
      // Add to deleted set
      setDeletedDocumentIds((prev) => new Set([...prev, documentToDelete.id]));
      
      // Also remove from uploaded documents if it was uploaded
      setUploadedDocuments((prev) => prev.filter((d) => d.id !== documentToDelete.id));
      
      // Remove stored file content
      setUploadedFileContents((prev) => {
        const newMap = new Map(prev);
        newMap.delete(documentToDelete.id);
        return newMap;
      });
      
      // Close modal
      setDocumentToDelete(null);
      setDeleteConfirmText('');
    }
  };

  const cancelDelete = () => {
    setDocumentToDelete(null);
    setDeleteConfirmText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Legal Documents</h1>
        <p className="mt-1 text-muted-foreground">
          Manage and review legal documents
        </p>
      </div>

      {/* Upload Success Message */}
      {showUploadSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <FileText className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-800">
                {lastUploadedFiles.length} file{lastUploadedFiles.length > 1 ? 's' : ''} uploaded successfully
              </p>
              <p className="text-sm text-green-700">
                {lastUploadedFiles.join(', ')} - Now available in the documents list below
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUploadSuccess(false)}
              className="text-green-700 hover:text-green-900"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
        multiple
      />

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <LegalDocumentsTable
          documents={allDocuments}
          onView={handleView}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onUpload={handleUpload}
        />
      )}

      {/* Document Preview Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Document Preview</h2>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Document Info */}
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{viewingDocument.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {viewingDocument.fileSize || 'Unknown size'}
                  </p>
                  {viewingDocument.id.startsWith('uploaded-') && (
                    <span className="mt-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Recently Uploaded
                    </span>
                  )}
                </div>
              </div>

              {/* Document Details */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Document Type
                  </p>
                  <p className="mt-1 font-medium capitalize">
                    {viewingDocument.type.replace('_', ' ')}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-1 font-medium capitalize">{viewingDocument.status}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Created
                    </p>
                  </div>
                  <p className="mt-1 font-medium">
                    {new Date(viewingDocument.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    {viewingDocument.investorName ? (
                      <User className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Related To
                    </p>
                  </div>
                  <p className="mt-1 font-medium">
                    {viewingDocument.investorName || viewingDocument.dealName || 'General'}
                  </p>
                </div>
              </div>

              {/* Preview Area */}
              <div className="mt-6 rounded-lg border bg-muted/30 p-8 text-center">
                <FileText className="mx-auto h-16 w-16 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  Document preview would appear here
                </p>
                <p className="text-sm text-muted-foreground">
                  In production, this would show a PDF viewer or document content
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button onClick={() => handleDownload(viewingDocument.id)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-900">Delete Document</h2>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                You are about to permanently delete:
              </p>
              <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{documentToDelete.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {documentToDelete.fileSize || 'Unknown size'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm font-medium">
                  Type <span className="font-mono font-bold text-red-600">CONFIRM</span> to delete this document:
                </label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type CONFIRM"
                  className="mt-2"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteConfirmText !== 'CONFIRM'}
              >
                Delete Document
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Upload Document</h2>
              <Button variant="ghost" size="sm" onClick={cancelUpload}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {!pendingUpload ? (
                // File Selection
                <div
                  onClick={handleSelectFile}
                  className="cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:border-primary hover:bg-muted/50"
                >
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 font-medium">Click to select a file</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    PDF, DOC, DOCX, XLS, XLSX, TXT, PNG, JPG
                  </p>
                </div>
              ) : (
                // File Details Form
                <div className="space-y-4">
                  {/* Selected File Info */}
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{pendingUpload.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(pendingUpload.file.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPendingUpload(null);
                          setUploadName('');
                          setUploadType('other');
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Change
                      </Button>
                    </div>
                  </div>

                  {/* Document Name */}
                  <div>
                    <label className="text-sm font-medium">Document Name</label>
                    <Input
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="Enter document name"
                      className="mt-1.5"
                    />
                  </div>

                  {/* Document Type */}
                  <div>
                    <label className="text-sm font-medium">Document Type</label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value as DocumentType)}
                      className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="ppm">PPM (Private Placement Memorandum)</option>
                      <option value="subscription">Subscription Agreement</option>
                      <option value="k1">K-1 Tax Document</option>
                      <option value="report">Report</option>
                      <option value="capital_call">Capital Call Notice</option>
                      <option value="kyc">KYC Document</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={cancelUpload}>
                Cancel
              </Button>
              <Button
                onClick={confirmUpload}
                disabled={!pendingUpload || !uploadName.trim()}
              >
                Upload Document
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
