import { FileText, Download, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InvestorDocument } from '@/lib/api/investors';
import { Button } from '@/components/ui/button';
import { formatDate } from '@flowveda/shared';

interface DocumentListProps {
  documents: InvestorDocument[];
  className?: string;
  limit?: number;
}

const typeLabels: Record<string, string> = {
  ppm: 'PPM',
  subscription: 'Subscription',
  k1: 'K-1',
  report: 'Report',
  capital_call: 'Capital Call',
  kyc: 'KYC Document',
  other: 'Document',
};

const signingStatusIcons: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  not_sent: { icon: Clock, color: 'text-gray-400' },
  sent: { icon: Clock, color: 'text-yellow-500' },
  viewed: { icon: Clock, color: 'text-blue-500' },
  signed: { icon: CheckCircle2, color: 'text-green-500' },
  declined: { icon: AlertCircle, color: 'text-red-500' },
};

export function DocumentList({ documents, className, limit }: DocumentListProps) {
  const displayedDocs = limit ? documents.slice(0, limit) : documents;

  if (documents.length === 0) {
    return (
      <div className={cn('rounded-lg border bg-card p-8 text-center', className)}>
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">No documents yet</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      <div className="divide-y">
        {displayedDocs.map((doc) => {
          const statusConfig = doc.signingStatus
            ? signingStatusIcons[doc.signingStatus]
            : null;
          const StatusIcon = statusConfig?.icon;

          return (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{doc.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{typeLabels[doc.type] || doc.type}</span>
                    <span>•</span>
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {doc.requiresSignature && StatusIcon && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-sm',
                      statusConfig.color
                    )}
                  >
                    <StatusIcon className="h-4 w-4" />
                    <span className="capitalize">
                      {doc.signingStatus?.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
                {doc.filePath && (
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


