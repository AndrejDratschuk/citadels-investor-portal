/**
 * ImportSuccessModal Component
 * Success modal with import statistics
 */

import { CheckCircle, FileSpreadsheet, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ImportResult } from '@altsui/shared';

interface ImportSuccessModalProps {
  result: ImportResult;
  connectionName: string;
  onClose: () => void;
  isOpen: boolean;
}

export function ImportSuccessModal({
  result,
  connectionName,
  onClose,
  isOpen,
}: ImportSuccessModalProps): JSX.Element | null {
  if (!isOpen) return null;

  const hasWarnings = result.errors.filter(e => e.severity === 'warning').length > 0;
  const errorCount = result.errors.filter(e => e.severity === 'error').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>

          {/* Success Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Import Successful!
            </h2>
            <p className="text-slate-600">
              Your data has been imported and is ready to view
            </p>
          </div>

          {/* Stats */}
          <div className="px-8 pb-6">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              {/* Connection Name */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <FileSpreadsheet className="h-4 w-4 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-500">Connection</p>
                  <p className="font-medium text-slate-900 truncate">{connectionName}</p>
                </div>
              </div>

              {/* Import Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Rows Imported</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {result.rowsImported.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Columns Mapped</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {result.columnsMapped}
                  </p>
                </div>
              </div>

              {/* Skipped/Errors */}
              {(result.rowsSkipped > 0 || errorCount > 0) && (
                <div className="pt-3 border-t border-slate-200">
                  {result.rowsSkipped > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Rows skipped</span>
                      <span className="text-slate-600">{result.rowsSkipped}</span>
                    </div>
                  )}
                  {errorCount > 0 && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-slate-500">Errors</span>
                      <span className="text-red-600">{errorCount}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Warnings */}
            {hasWarnings && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Some values could not be imported</p>
                  <p className="text-amber-600 mt-1">
                    {result.errors.filter(e => e.severity === 'warning').length} warnings
                  </p>
                </div>
              </div>
            )}

            {/* Mapping Saved */}
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <p>
                Mapping saved! We'll use this configuration for future uploads.
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="px-8 pb-8">
            <Button className="w-full" size="lg" onClick={onClose}>
              View Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}




