/**
 * FileUploadStep Component
 * File upload with drag-and-drop, deal selection, and sample data option
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  AlertCircle, 
  Database,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DealSelector } from '@/components/common/DealSelector';
import { cn } from '@/lib/utils';
import type { Deal } from '@/lib/api/deals';

interface FileUploadStepProps {
  connectionName: string;
  onConnectionNameChange: (name: string) => void;
  selectedDealId: string | null;
  onDealChange: (dealId: string | null, deal: Deal | null) => void;
  onFileSelect: (file: File) => void;
  onUseSampleData: () => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
  selectedFile?: File | null;
  showDealSelector?: boolean;
}

const ACCEPTED_FILE_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUploadStep({
  connectionName,
  onConnectionNameChange,
  selectedDealId,
  onDealChange,
  onFileSelect,
  onUseSampleData,
  onBack,
  isLoading = false,
  error = null,
  selectedFile = null,
  showDealSelector = true,
}: FileUploadStepProps): JSX.Element {
  const [fileError, setFileError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setFileError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setFileError('File is too large. Maximum size is 10MB.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setFileError('Invalid file type. Please upload CSV, XLSX, or XLS file.');
      } else {
        setFileError('Could not upload file. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isLoading,
  });

  const clearFile = (): void => {
    onFileSelect(null as any);
    setFileError(null);
  };

  const displayError = error || fileError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-600 mb-3">
          Step 1 of 2
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Upload Your Data</h2>
        <p className="mt-2 text-slate-600">
          Import your financial data from a spreadsheet file
        </p>
      </div>

      {/* Deal Selection */}
      {showDealSelector && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Select Deal <span className="text-red-500">*</span>
          </label>
          <DealSelector
            value={selectedDealId}
            onChange={onDealChange}
            placeholder="Select a deal for this data..."
            allowNull={false}
          />
          <p className="text-xs text-slate-500">
            The data you import will be linked to this property
          </p>
        </div>
      )}

      {/* Connection Name */}
      <div className="space-y-2">
        <label htmlFor="connectionName" className="text-sm font-medium text-slate-700">
          Connection Name
        </label>
        <input
          id="connectionName"
          type="text"
          value={connectionName}
          onChange={(e) => onConnectionNameChange(e.target.value)}
          placeholder="e.g., Q4 2024 Financial Data"
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
        />
        <p className="text-xs text-slate-500">
          This name helps you identify the data source later
        </p>
      </div>

      {/* File Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          isDragReject && 'border-red-500 bg-red-50',
          !isDragActive && !selectedFile && 'border-slate-200 hover:border-slate-300 bg-slate-50',
          selectedFile && 'border-emerald-500 bg-emerald-50',
          isLoading && 'opacity-50 pointer-events-none'
        )}
      >
        <input {...getInputProps()} />

        {isLoading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
            <p className="font-medium text-slate-900">Processing file...</p>
            <p className="text-sm text-slate-500 mt-1">This may take a moment</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="font-medium text-slate-900">{selectedFile.name}</p>
            <p className="text-sm text-slate-500 mt-1">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="mt-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
              Remove file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <Upload className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900">
              {isDragActive ? 'Drop your file here' : 'Drag and drop your file here'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              or <span className="text-primary font-medium">browse</span> to select
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
              <FileSpreadsheet className="h-4 w-4" />
              <span>CSV, XLSX, XLS • Max 10MB</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {displayError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{displayError}</p>
        </div>
      )}

      {/* Sample Data Option */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Database className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-slate-900">Don't have your data ready?</p>
          <p className="text-sm text-slate-600">
            Use our sample data to explore the platform
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onUseSampleData}
          className="border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          Use Sample Data
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Back
        </button>
        
        <Button
          onClick={() => {/* Continue handled by parent via file selection */}}
          disabled={!selectedFile || isLoading || (showDealSelector && !selectedDealId)}
        >
          Continue to Mapping
        </Button>
      </div>
    </div>
  );
}

