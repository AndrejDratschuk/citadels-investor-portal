import { useState } from 'react';
import { FileText, RefreshCw, Download, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaxYearSelector, K1Table } from '../components';
import { useK1Documents, useGenerateK1s, useSendK1s } from '../hooks';

export function K1Management() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear - 1);
  const { data: k1Records, isLoading, refetch } = useK1Documents(selectedYear);
  const generateK1s = useGenerateK1s();
  const sendK1s = useSendK1s();

  const handleGenerate = async (ids: string[]) => {
    try {
      await generateK1s.mutateAsync(ids);
      // Show success toast
    } catch {
      // Show error toast
    }
  };

  const handleSend = async (ids: string[]) => {
    try {
      await sendK1s.mutateAsync(ids);
      // Show success toast
    } catch {
      // Show error toast
    }
  };

  const handleGenerateAll = async () => {
    const pendingIds = k1Records?.filter((r) => r.k1Status === 'pending').map((r) => r.id) ?? [];
    if (pendingIds.length > 0) {
      await handleGenerate(pendingIds);
    }
  };

  const handleSendAll = async () => {
    const generatedIds = k1Records?.filter((r) => r.k1Status === 'generated').map((r) => r.id) ?? [];
    if (generatedIds.length > 0) {
      await handleSend(generatedIds);
    }
  };

  const handlePreview = (id: string) => {
    // TODO: Open preview modal or navigate to preview page
    console.log('Preview K-1:', id);
  };

  const handleDownload = (id: string) => {
    // TODO: Download K-1 PDF
    console.log('Download K-1:', id);
  };

  // Stats
  const totalRecords = k1Records?.length ?? 0;
  const pendingCount = k1Records?.filter((r) => r.k1Status === 'pending').length ?? 0;
  const generatedCount = k1Records?.filter((r) => r.k1Status === 'generated').length ?? 0;
  const sentCount = k1Records?.filter((r) => r.k1Status === 'sent').length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">K-1 Management</h1>
          <p className="mt-1 text-muted-foreground">
            Generate and distribute K-1 tax documents
          </p>
        </div>
        <TaxYearSelector
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm">
            <strong>{totalRecords}</strong> Total
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gray-400" />
          <span className="text-sm">
            <strong>{pendingCount}</strong> Pending
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-sm">
            <strong>{generatedCount}</strong> Generated
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-sm">
            <strong>{sentCount}</strong> Sent
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateAll}
            disabled={pendingCount === 0 || generateK1s.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            Generate All ({pendingCount})
          </Button>
          <Button
            size="sm"
            onClick={handleSendAll}
            disabled={generatedCount === 0 || sendK1s.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            Send All ({generatedCount})
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalRecords > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">K-1 Completion Progress</span>
            <span className="font-medium">
              {Math.round(((generatedCount + sentCount) / totalRecords) * 100)}%
            </span>
          </div>
          <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="bg-blue-500 transition-all"
              style={{ width: `${(sentCount / totalRecords) * 100}%` }}
            />
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${(generatedCount / totalRecords) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Sent ({sentCount})
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Generated ({generatedCount})
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              Pending ({pendingCount})
            </div>
          </div>
        </div>
      )}

      {/* K-1 Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <K1Table
          records={k1Records ?? []}
          onGenerate={handleGenerate}
          onSend={handleSend}
          onPreview={handlePreview}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}









