import { useState } from 'react';
import { FileText, Filter } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentList } from '../components/DocumentList';
import { Button } from '@/components/ui/button';

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
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredDocuments =
    typeFilter === 'all'
      ? documents
      : documents?.filter((doc) => doc.type === typeFilter);

  if (isLoading) {
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
    </div>
  );
}


