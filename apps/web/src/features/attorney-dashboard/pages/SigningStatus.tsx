import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SigningStatusTable } from '../components';
import { useSigningStatus, useSendForSignature, useSendReminder } from '../hooks';

export function SigningStatus() {
  const { data: records, isLoading, refetch } = useSigningStatus();
  const sendForSignature = useSendForSignature();
  const sendReminder = useSendReminder();

  const handleView = (id: string) => {
    // TODO: Open document preview modal
    console.log('View document:', id);
  };

  const handleResend = async (id: string) => {
    try {
      await sendForSignature.mutateAsync(id);
      // Show success toast
    } catch {
      // Show error toast
    }
  };

  const handleRemind = async (id: string) => {
    try {
      await sendReminder.mutateAsync(id);
      // Show success toast
    } catch {
      // Show error toast
    }
  };

  // Stats
  const notSentCount = records?.filter((r) => r.status === 'not_sent').length ?? 0;
  const sentCount = records?.filter((r) => r.status === 'sent').length ?? 0;
  const viewedCount = records?.filter((r) => r.status === 'viewed').length ?? 0;
  const signedCount = records?.filter((r) => r.status === 'signed').length ?? 0;
  const declinedCount = records?.filter((r) => r.status === 'declined').length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Signing Status</h1>
          <p className="mt-1 text-muted-foreground">
            Track document signing progress
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gray-400" />
          <span className="text-sm">
            <strong>{notSentCount}</strong> Not Sent
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-sm">
            <strong>{sentCount}</strong> Sent
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-purple-500" />
          <span className="text-sm">
            <strong>{viewedCount}</strong> Viewed
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-sm">
            <strong>{signedCount}</strong> Signed
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-sm">
            <strong>{declinedCount}</strong> Declined
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {records && records.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Signature Completion Progress</span>
            <span className="font-medium">
              {Math.round((signedCount / records.length) * 100)}%
            </span>
          </div>
          <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${(signedCount / records.length) * 100}%` }}
            />
            <div
              className="bg-purple-500 transition-all"
              style={{ width: `${(viewedCount / records.length) * 100}%` }}
            />
            <div
              className="bg-blue-500 transition-all"
              style={{ width: `${(sentCount / records.length) * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${(declinedCount / records.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <SigningStatusTable
          records={records ?? []}
          onView={handleView}
          onResend={handleResend}
          onRemind={handleRemind}
        />
      )}
    </div>
  );
}




















