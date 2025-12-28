import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, ShieldCheck, Clock, CheckCircle2, XCircle, Upload, Loader2, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentList } from '../components/DocumentList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { investorsApi } from '@/lib/api/investors';
import { cn } from '@/lib/utils';

type TabType = 'all' | 'validation';

const documentTypes = [
  { value: 'all', label: 'All Documents' },
  { value: 'ppm', label: 'PPM' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'k1', label: 'K-1' },
  { value: 'report', label: 'Reports' },
  { value: 'capital_call', label: 'Capital Calls' },
  { value: 'kyc', label: 'KYC' },
];

export function InvestorDocuments() {
  const { data: documents, isLoading, error } = useDocuments();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const queryClient = useQueryClient();

  // Fetch validation documents
  const { data: validationDocuments = [], isLoading: validationLoading } = useQuery({
    queryKey: ['investor', 'validation-documents'],
    queryFn: investorsApi.getMyValidationDocuments,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error('No file selected');
      const name = documentName || uploadFile.name;
      return investorsApi.uploadValidationDocument(uploadFile, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor', 'validation-documents'] });
      setShowUploadModal(false);
      setUploadFile(null);
      setDocumentName('');
    },
  });

  // Dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadFile(acceptedFiles[0]);
      if (!documentName) {
        setDocumentName(acceptedFiles[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [documentName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Count validation documents by status
  const pendingCount = validationDocuments.filter(d => d.validationStatus === 'pending').length;
  const approvedCount = validationDocuments.filter(d => d.validationStatus === 'approved').length;
  const rejectedCount = validationDocuments.filter(d => d.validationStatus === 'rejected').length;

  const filteredDocuments =
    typeFilter === 'all'
      ? documents
      : documents?.filter((doc) => doc.type === typeFilter);

  const isLoadingAny = isLoading || validationLoading;

  if (isLoadingAny) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-800">Failed to load documents</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="mt-1 text-muted-foreground">
            View and download your investment documents
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <FileText className="h-4 w-4" />
          Fund Documents
        </button>
        <button
          onClick={() => setActiveTab('validation')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'validation'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          My Validation Documents
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-yellow-500 px-1.5 py-0.5 text-xs font-semibold text-white">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Fund Documents Tab */}
      {activeTab === 'all' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {documentTypes.map((type) => (
              <Button
                key={type.value}
                variant={typeFilter === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>

          {/* Document Count */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>
              {filteredDocuments?.length || 0} document
              {filteredDocuments?.length !== 1 ? 's' : ''}
              {typeFilter !== 'all' && ` in ${documentTypes.find(t => t.value === typeFilter)?.label}`}
            </span>
          </div>

          {/* Documents List */}
          <DocumentList documents={filteredDocuments || []} />
        </>
      )}

      {/* Validation Documents Tab */}
      {activeTab === 'validation' && (
        <>
          {/* Upload Button */}
          <div className="flex justify-end">
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>

          {/* Status Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-100 p-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{rejectedCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          {rejectedCount > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-800">
                    {rejectedCount} document{rejectedCount !== 1 ? 's' : ''} rejected
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    Please review the rejection reasons and upload new documents using the button above.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Document Count */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>
              {validationDocuments.length} validation document
              {validationDocuments.length !== 1 ? 's' : ''} uploaded
            </span>
          </div>

          {/* Validation Documents List */}
          <DocumentList 
            documents={validationDocuments} 
            showValidationStatus 
          />
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Upload Document</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setDocumentName('');
                }}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={cn(
                  'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                )}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                {uploadFile ? (
                  <p className="mt-2 text-sm font-medium">{uploadFile.name}</p>
                ) : isDragActive ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drop the file here...
                  </p>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Drag & drop a file here, or click to select
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF, Images, Word documents (max 10MB)
                    </p>
                  </>
                )}
              </div>

              {/* Document Name */}
              <div className="space-y-2">
                <Label htmlFor="documentName">Document Name</Label>
                <Input
                  id="documentName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Enter document name"
                />
              </div>

              {/* Error Message */}
              {uploadMutation.isError && (
                <p className="text-sm text-red-500">
                  {uploadMutation.error?.message || 'Failed to upload document'}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setDocumentName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => uploadMutation.mutate()}
                  disabled={!uploadFile || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


