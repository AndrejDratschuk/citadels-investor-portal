import { FileText, Download, Clock, CheckCircle2, AlertCircle, XCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InvestorDocument } from '@/lib/api/investors';
import { Button } from '@/components/ui/button';
import { formatDate } from '@flowveda/shared';

interface DocumentListProps {
  documents: InvestorDocument[];
  className?: string;
  limit?: number;
  showValidationStatus?: boolean;
}

const typeLabels: Record<string, string> = {
  ppm: 'PPM',
  subscription: 'Subscription',
  k1: 'K-1',
  report: 'Report',
  capital_call: 'Capital Call',
  kyc: 'KYC Document',
  tax_filing: 'Tax Filing',
  proof_of_identity: 'Proof of Identity',
  net_worth_statement: 'Net Worth Statement',
  other: 'Document',
};

const signingStatusIcons: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  not_sent: { icon: Clock, color: 'text-gray-400' },
  sent: { icon: Clock, color: 'text-yellow-500' },
  viewed: { icon: Clock, color: 'text-blue-500' },
  signed: { icon: CheckCircle2, color: 'text-green-500' },
  declined: { icon: AlertCircle, color: 'text-red-500' },
};

const validationStatusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending Review' },
  approved: { icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-100', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
};

export function DocumentList({ documents, className, limit, showValidationStatus = false }: DocumentListProps) {
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
          const signingConfig = doc.signingStatus
            ? signingStatusIcons[doc.signingStatus]
            : null;
          const SigningStatusIcon = signingConfig?.icon;
          
          // Validation status for validation documents
          const validationConfig = doc.validationStatus
            ? validationStatusConfig[doc.validationStatus]
            : null;
          const ValidationStatusIcon = validationConfig?.icon;

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
                    {doc.uploadedBy === 'investor' && (
                      <>
                        <span>•</span>
                        <span className="text-xs text-muted-foreground">Uploaded by you</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Validation Status Badge */}
                {showValidationStatus && validationConfig && ValidationStatusIcon && (
                  <div
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                      validationConfig.bg,
                      validationConfig.color
                    )}
                  >
                    <ValidationStatusIcon className="h-3.5 w-3.5" />
                    <span>{validationConfig.label}</span>
                  </div>
                )}
                
                {/* Signing Status (for DocuSign documents) */}
                {doc.requiresSignature && SigningStatusIcon && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-sm',
                      signingConfig.color
                    )}
                  >
                    <SigningStatusIcon className="h-4 w-4" />
                    <span className="capitalize">
                      {doc.signingStatus?.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
                
                {/* Rejection reason tooltip for rejected documents */}
                {doc.validationStatus === 'rejected' && doc.rejectionReason && (
                  <div className="group relative">
                    <AlertCircle className="h-4 w-4 cursor-help text-red-500" />
                    <div className="absolute right-0 top-6 z-10 hidden w-64 rounded-lg border bg-card p-3 shadow-lg group-hover:block">
                      <p className="text-xs font-medium text-red-600">Rejection Reason:</p>
                      <p className="mt-1 text-xs text-muted-foreground">{doc.rejectionReason}</p>
                    </div>
                  </div>
                )}
                
                {doc.filePath && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.filePath!, '_blank')}
                  >
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


