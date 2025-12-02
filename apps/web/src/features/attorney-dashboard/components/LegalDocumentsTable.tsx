import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Download, 
  Eye, 
  Upload,
  FileText,
  FileSignature,
  File,
  Trash2,
} from 'lucide-react';

export type DocumentType = 'ppm' | 'subscription' | 'k1' | 'report' | 'capital_call' | 'kyc' | 'other';
export type DocumentStatus = 'draft' | 'active' | 'archived';

export interface LegalDocument {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  investorName?: string;
  dealName?: string;
  createdAt: string;
  updatedAt: string;
  fileSize?: string;
}

interface LegalDocumentsTableProps {
  documents: LegalDocument[];
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: DocumentStatus) => void;
  onUpload?: () => void;
  className?: string;
}

const documentTypeLabels: Record<DocumentType, string> = {
  ppm: 'PPM',
  subscription: 'Subscription Agreement',
  k1: 'K-1',
  report: 'Report',
  capital_call: 'Capital Call',
  kyc: 'KYC Document',
  other: 'Other',
};

const documentTypeIcons: Record<DocumentType, typeof FileText> = {
  ppm: FileText,
  subscription: FileSignature,
  k1: FileText,
  report: FileText,
  capital_call: FileText,
  kyc: File,
  other: File,
};

const statusStyles: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  archived: 'bg-amber-100 text-amber-700',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function LegalDocumentsTable({
  documents,
  onView,
  onDownload,
  onDelete,
  onStatusChange,
  onUpload,
  className,
}: LegalDocumentsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.investorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.dealName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="ppm">PPM</option>
            <option value="subscription">Subscription</option>
            <option value="k1">K-1</option>
            <option value="report">Report</option>
            <option value="capital_call">Capital Call</option>
            <option value="kyc">KYC</option>
            <option value="other">Other</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredDocuments.length} documents
          </span>
          <Button size="sm" onClick={onUpload}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Document
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Related To
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map((doc) => {
              const TypeIcon = documentTypeIcons[doc.type];
              return (
                <tr
                  key={doc.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        {doc.fileSize && (
                          <p className="text-xs text-muted-foreground">{doc.fileSize}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {documentTypeLabels[doc.type]}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {doc.investorName || doc.dealName || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStatusId(editingStatusId === doc.id ? null : doc.id);
                        }}
                        className={cn(
                          'inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize cursor-pointer transition-all hover:ring-2 hover:ring-offset-1',
                          statusStyles[doc.status],
                          doc.status === 'draft' && 'hover:ring-gray-300',
                          doc.status === 'active' && 'hover:ring-green-300',
                          doc.status === 'archived' && 'hover:ring-amber-300'
                        )}
                        title="Click to change status"
                      >
                        {doc.status}
                      </button>
                      
                      {/* Status Dropdown */}
                      {editingStatusId === doc.id && (
                        <div className="absolute left-0 top-full z-10 mt-1 w-32 rounded-lg border bg-white py-1 shadow-lg">
                          {(['draft', 'active', 'archived'] as DocumentStatus[]).map((status) => (
                            <button
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange?.(doc.id, status);
                                setEditingStatusId(null);
                              }}
                              className={cn(
                                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50',
                                doc.status === status && 'bg-muted/30 font-medium'
                              )}
                            >
                              <span className={cn(
                                'h-2 w-2 rounded-full',
                                status === 'draft' && 'bg-gray-400',
                                status === 'active' && 'bg-green-500',
                                status === 'archived' && 'bg-amber-500'
                              )} />
                              <span className="capitalize">{status}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView?.(doc.id)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload?.(doc.id)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(doc.id)}
                        title="Delete"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredDocuments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No documents found</p>
        </div>
      )}
    </div>
  );
}

