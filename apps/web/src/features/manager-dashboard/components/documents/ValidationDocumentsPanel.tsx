import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  FileCheck,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  documentsApi,
  typeLabels,
  validationStatusLabels,
  validationStatusStyles,
} from '@/lib/api/documents';
import { cn } from '@/lib/utils';
import { Document } from './types';

interface RejectModalProps {
  document: Document;
  onClose: () => void;
  onReject: (reason: string) => void;
  isLoading: boolean;
}

function RejectModal({ document, onClose, onReject, isLoading }: RejectModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold">Reject Document</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You are rejecting <span className="font-medium">{document.name}</span>. The investor will
          be notified and asked to upload new documents.
        </p>
        <div className="mt-4">
          <label className="block text-sm font-medium">Rejection Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Please provide a reason for rejection..."
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onReject(reason)}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              'Reject Document'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ValidationDocumentsPanel() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectingDocument, setRejectingDocument] = useState<Document | null>(null);

  // Fetch validation documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', 'validation'],
    queryFn: () => documentsApi.getValidationDocuments(),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (documentId: string) => documentsApi.approveValidationDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ documentId, reason }: { documentId: string; reason: string }) =>
      documentsApi.rejectValidationDocument(documentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setRejectingDocument(null);
    },
  });

  // Memoize status counts to avoid recalculating on every render
  // Use validationStatus field for validation documents
  const { pendingCount, approvedCount, rejectedCount } = useMemo(() => ({
    pendingCount: documents.filter((d) => d.validationStatus === 'pending' || !d.validationStatus).length,
    approvedCount: documents.filter((d) => d.validationStatus === 'approved').length,
    rejectedCount: documents.filter((d) => d.validationStatus === 'rejected').length,
  }), [documents]);

  // Memoize filtered documents to avoid recalculating on every render
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        !searchQuery ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.investorName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Use validationStatus for filtering
      const docValidationStatus = doc.validationStatus || 'pending';
      const matchesStatus =
        statusFilter === 'all' ||
        docValidationStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [documents, searchQuery, statusFilter]);

  const getStatusBadge = (status?: string) => {
    let displayStatus = status || 'pending';
    // Map document statuses to validation statuses
    if (displayStatus === 'review' || displayStatus === 'draft') displayStatus = 'pending';
    if (displayStatus === 'final') displayStatus = 'approved';
    
    const style = validationStatusStyles[displayStatus] || validationStatusStyles.pending;
    const label = validationStatusLabels[displayStatus] || 'Pending';
    
    return (
      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', style.bg, style.text)}>
        {label}
      </span>
    );
  };

  const handleApprove = (documentId: string) => {
    approveMutation.mutate(documentId);
  };

  const handleReject = (reason: string) => {
    if (rejectingDocument) {
      rejectMutation.mutate({ documentId: rejectingDocument.id, reason });
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
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

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by document or investor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left text-sm font-medium">Document Name</th>
                <th className="p-4 text-left text-sm font-medium">Type</th>
                <th className="p-4 text-left text-sm font-medium">Investor</th>
                <th className="p-4 text-left text-sm font-medium">Status</th>
                <th className="p-4 text-left text-sm font-medium">Uploaded</th>
                <th className="p-4 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    <p className="mt-2">Loading validation documents...</p>
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <FileCheck className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 font-medium">No validation documents found</p>
                    <p className="mt-1 text-sm">
                      {statusFilter === 'pending'
                        ? 'No documents pending review'
                        : 'Documents uploaded by investors during onboarding will appear here'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  // Use validationStatus for validation documents
                  const docValidationStatus = doc.validationStatus || 'pending';
                  const isPending = docValidationStatus === 'pending';
                  const isApproving = approveMutation.isPending && approveMutation.variables === doc.id;
                  
                  return (
                    <tr key={doc.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {typeLabels[doc.type] || doc.type}
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-primary">
                          {doc.investorName || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-4">{getStatusBadge(docValidationStatus)}</td>
                      <td className="p-4 text-muted-foreground">{formatDate(doc.createdAt)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {doc.filePath && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(doc.filePath!, '_blank')}
                                title="View document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = doc.filePath!;
                                  link.download = doc.name;
                                  link.click();
                                }}
                                title="Download document"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {isPending && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:bg-green-50 hover:text-green-700"
                                onClick={() => handleApprove(doc.id)}
                                disabled={isApproving}
                              >
                                {isApproving ? (
                                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-1 h-4 w-4" />
                                )}
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setRejectingDocument(doc)}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}
                          {docValidationStatus === 'approved' && (
                            <span className="flex items-center gap-1 text-sm text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              Validated
                            </span>
                          )}
                          {docValidationStatus === 'rejected' && (
                            <span className="flex items-center gap-1 text-sm text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              Rejected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingDocument && (
        <RejectModal
          document={rejectingDocument}
          onClose={() => setRejectingDocument(null)}
          onReject={handleReject}
          isLoading={rejectMutation.isPending}
        />
      )}
    </div>
  );
}
