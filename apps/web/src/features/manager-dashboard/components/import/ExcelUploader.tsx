/**
 * Excel Uploader Component
 * Handles Excel/CSV file upload and parsing
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================
interface ExcelUploaderProps {
  onDataParsed: (data: Array<Record<string, unknown>>, fileName: string) => void;
  isLoading?: boolean;
  className?: string;
}

interface ParsedFile {
  name: string;
  data: Array<Record<string, unknown>>;
  rowCount: number;
  columnCount: number;
}

// ============================================
// CSV Parser (simple implementation)
// ============================================
function parseCSV(text: string): Array<Record<string, unknown>> {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

  // Parse data rows
  const data: Array<Record<string, unknown>> = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      const value = values[index];
      // Try to parse as number
      const numValue = parseFloat(value);
      row[header] = isNaN(numValue) ? value : numValue;
    });
    data.push(row);
  }

  return data;
}

// ============================================
// Component
// ============================================
export function ExcelUploader({
  onDataParsed,
  isLoading = false,
  className,
}: ExcelUploaderProps): JSX.Element {
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setError(null);
      setIsParsing(true);

      try {
        const text = await file.text();
        let data: Array<Record<string, unknown>>;

        if (file.name.endsWith('.csv')) {
          data = parseCSV(text);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // For Excel files, we'd need a library like xlsx
          // For now, show an error suggesting CSV
          setError('Excel files (.xlsx) are not yet supported. Please export to CSV first.');
          setIsParsing(false);
          return;
        } else {
          setError('Unsupported file type. Please upload a CSV file.');
          setIsParsing(false);
          return;
        }

        if (data.length === 0) {
          setError('No data found in file');
          setIsParsing(false);
          return;
        }

        const columns = Object.keys(data[0]);
        setParsedFile({
          name: file.name,
          data,
          rowCount: data.length,
          columnCount: columns.length,
        });

        onDataParsed(data, file.name);
      } catch (err) {
        console.error('Error parsing file:', err);
        setError('Failed to parse file. Please check the format.');
      } finally {
        setIsParsing(false);
      }
    },
    [onDataParsed]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: isLoading || isParsing,
  });

  const handleClear = () => {
    setParsedFile(null);
    setError(null);
  };

  return (
    <div className={className}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
          isDragActive && 'border-primary bg-primary/5',
          !isDragActive && 'border-muted-foreground/25 hover:border-muted-foreground/50',
          (isLoading || isParsing) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        {isParsing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Parsing file...</p>
          </div>
        ) : parsedFile ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-emerald-100 px-4 py-2 text-emerald-700">
              <FileSpreadsheet className="h-5 w-5" />
              <span className="font-medium">{parsedFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="h-6 w-6 p-0 hover:bg-emerald-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {parsedFile.rowCount} rows × {parsedFile.columnCount} columns
            </p>
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Drop your spreadsheet here</p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse. Supports CSV files.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 mt-4 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview Table */}
      {parsedFile && parsedFile.data.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Data Preview (first 5 rows)</h4>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {Object.keys(parsedFile.data[0]).map((col) => (
                    <th key={col} className="px-3 py-2 text-left font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsedFile.data.slice(0, 5).map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-3 py-2">
                        {typeof val === 'number' ? val.toLocaleString() : String(val || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedFile.data.length > 5 && (
            <p className="text-xs text-muted-foreground mt-2">
              Showing 5 of {parsedFile.data.length} rows
            </p>
          )}
        </div>
      )}
    </div>
  );
}

