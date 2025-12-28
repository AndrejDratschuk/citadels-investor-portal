import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Image,
  FileIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  validationDocumentTypeLabels,
  allowedFileExtensions,
  MAX_FILE_SIZE,
  type ValidationDocumentType,
} from '@altsui/shared';

export interface PendingDocument {
  id: string;
  file: File;
  documentType: ValidationDocumentType;
  customName: string;
  error?: string;
}

interface ValidationDocumentsStepProps {
  documents: PendingDocument[];
  onDocumentsChange: (documents: PendingDocument[]) => void;
  onNext?: () => void;
  onBack?: () => void;
  errors?: string[];
}

const documentTypeOptions: { value: ValidationDocumentType; label: string }[] = [
  { value: 'tax_filing', label: validationDocumentTypeLabels.tax_filing },
  { value: 'proof_of_identity', label: validationDocumentTypeLabels.proof_of_identity },
  { value: 'net_worth_statement', label: validationDocumentTypeLabels.net_worth_statement },
  { value: 'bank_statement', label: validationDocumentTypeLabels.bank_statement },
  { value: 'other', label: validationDocumentTypeLabels.other },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string): JSX.Element {
  if (mimeType.startsWith('image/')) {
    return <Image className="h-6 w-6 text-blue-500" />;
  }
  if (mimeType === 'application/pdf') {
    return <FileText className="h-6 w-6 text-red-500" />;
  }
  return <FileIcon className="h-6 w-6 text-gray-500" />;
}

function validateFile(file: File): string | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }

  // Check file type
  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (!allowedFileExtensions.includes(extension)) {
    return `Invalid file type. Allowed: ${allowedFileExtensions.join(', ')}`;
  }

  return null;
}

export function ValidationDocumentsStep({
  documents,
  onDocumentsChange,
  onNext,
  onBack,
  errors = [],
}: ValidationDocumentsStepProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newDocuments: PendingDocument[] = acceptedFiles.map((file) => {
        const error = validateFile(file);
        return {
          id: generateId(),
          file,
          documentType: 'other' as ValidationDocumentType,
          customName: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          error: error || undefined,
        };
      });

      onDocumentsChange([...documents, ...newDocuments]);
    },
    [documents, onDocumentsChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: MAX_FILE_SIZE,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const handleRemoveDocument = (id: string): void => {
    onDocumentsChange(documents.filter((doc) => doc.id !== id));
  };

  const handleUpdateDocument = (id: string, updates: Partial<PendingDocument>): void => {
    onDocumentsChange(
      documents.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc))
    );
  };

  const validDocuments = documents.filter((doc) => !doc.error);
  const hasErrors = documents.some((doc) => doc.error);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Upload Validation Documents
        </h3>
        <p className="mt-2 text-sm text-blue-800">
          Please upload documents that verify your accredited investor status. This may include:
        </p>
        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>Tax returns (W-2, 1040, K-1)</li>
          <li>Proof of net worth (bank or brokerage statements)</li>
          <li>Letter from attorney, CPA, or financial advisor</li>
          <li>Government-issued ID</li>
        </ul>
        <p className="mt-3 text-xs text-blue-600">
          Accepted formats: PDF, JPG, PNG, DOCX • Maximum file size: 10MB per file •{' '}
          <strong>At least 1 document required</strong>
        </p>
      </div>

      {/* Global Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-700">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          isDragActive || dragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
        )}
      >
        <input {...getInputProps()} />
        <Upload
          className={cn(
            'mx-auto h-12 w-12 transition-colors',
            isDragActive ? 'text-primary' : 'text-gray-400'
          )}
        />
        <p className="mt-4 text-lg font-medium text-gray-700">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
        </p>
        <p className="mt-1 text-sm text-gray-500">or click to browse from your computer</p>
        <Button type="button" variant="outline" className="mt-4">
          Browse Files
        </Button>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Uploaded Documents ({validDocuments.length})
            </h4>
            {validDocuments.length > 0 && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {validDocuments.length} ready to submit
              </span>
            )}
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  'border rounded-lg p-4',
                  doc.error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* File Icon */}
                  <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                    {getFileIcon(doc.file.type)}
                  </div>

                  {/* File Details */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 truncate">{doc.file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(doc.file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Error Message */}
                    {doc.error && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p className="text-sm">{doc.error}</p>
                      </div>
                    )}

                    {/* Metadata Fields */}
                    {!doc.error && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Document Type *</Label>
                          <select
                            value={doc.documentType}
                            onChange={(e) =>
                              handleUpdateDocument(doc.id, {
                                documentType: e.target.value as ValidationDocumentType,
                              })
                            }
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                          >
                            {documentTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Custom Name (optional)</Label>
                          <Input
                            value={doc.customName}
                            onChange={(e) =>
                              handleUpdateDocument(doc.id, { customName: e.target.value })
                            }
                            placeholder="e.g., 2023 Tax Return"
                            className="h-9"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3">No documents uploaded yet</p>
          <p className="text-sm">Upload at least one document to continue</p>
        </div>
      )}

      {/* Summary */}
      {documents.length > 0 && (
        <div
          className={cn(
            'rounded-lg p-4 text-sm',
            hasErrors ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'
          )}
        >
          {hasErrors ? (
            <p className="text-amber-800">
              <strong>Warning:</strong> Some files have errors and won't be uploaded. Please fix or
              remove them before proceeding.
            </p>
          ) : (
            <p className="text-green-800">
              <strong>Ready to proceed!</strong> {validDocuments.length} document
              {validDocuments.length !== 1 ? 's' : ''} will be uploaded when you submit your
              application.
            </p>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      {(onNext || onBack) && (
        <div className="flex items-center justify-between pt-6 border-t">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          {onNext && (
            <Button
              type="button"
              onClick={onNext}
              disabled={validDocuments.length === 0}
              className={onBack ? 'ml-auto' : ''}
            >
              Continue
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

