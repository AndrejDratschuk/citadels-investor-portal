import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, ShieldCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentList } from '../components/DocumentList';
import { Button } from '@/components/ui/button';
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

  // Fetch validation documents
  const { data: validationDocuments = [], isLoading: validationLoading } = useQuery({
    queryKey: ['investor', 'validation-documents'],
    queryFn: investorsApi.getMyValidationDocuments,
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
                    Please review the rejection reasons and upload new documents during onboarding.
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
    </div>
  );
}


