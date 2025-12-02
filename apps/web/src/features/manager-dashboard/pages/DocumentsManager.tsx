import { useState } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Send,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { formatDate } from '@flowveda/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  type: 'ppm' | 'subscription' | 'k1' | 'report' | 'capital_call' | 'kyc' | 'other';
  dealName: string | null;
  investorName: string | null;
  requiresSignature: boolean;
  signingStatus: 'not_sent' | 'sent' | 'viewed' | 'signed' | 'declined' | null;
  signedAt: string | null;
  createdAt: string;
}

// Mock data
const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Private Placement Memorandum',
    type: 'ppm',
    dealName: null,
    investorName: null,
    requiresSignature: true,
    signingStatus: 'signed',
    signedAt: '2023-06-10',
    createdAt: '2023-06-01',
  },
  {
    id: '2',
    name: 'Subscription Agreement - John Smith',
    type: 'subscription',
    dealName: null,
    investorName: 'John Smith',
    requiresSignature: true,
    signingStatus: 'signed',
    signedAt: '2023-06-15',
    createdAt: '2023-06-10',
  },
  {
    id: '3',
    name: 'K-1 Tax Document 2023',
    type: 'k1',
    dealName: null,
    investorName: 'Sarah Johnson',
    requiresSignature: false,
    signingStatus: null,
    signedAt: null,
    createdAt: '2024-01-15',
  },
  {
    id: '4',
    name: 'Q4 2023 Quarterly Report',
    type: 'report',
    dealName: null,
    investorName: null,
    requiresSignature: false,
    signingStatus: null,
    signedAt: null,
    createdAt: '2024-01-10',
  },
  {
    id: '5',
    name: 'Riverside Apartments - Due Diligence',
    type: 'other',
    dealName: 'Riverside Apartments',
    investorName: null,
    requiresSignature: false,
    signingStatus: null,
    signedAt: null,
    createdAt: '2023-05-20',
  },
  {
    id: '6',
    name: 'Capital Call Notice - Downtown Office',
    type: 'capital_call',
    dealName: 'Downtown Office Tower',
    investorName: 'Michael Chen',
    requiresSignature: true,
    signingStatus: 'sent',
    signedAt: null,
    createdAt: '2024-02-15',
  },
];

const typeLabels: Record<string, string> = {
  ppm: 'PPM',
  subscription: 'Subscription',
  k1: 'K-1',
  report: 'Report',
  capital_call: 'Capital Call',
  kyc: 'KYC',
  other: 'Other',
};

const signingStatusStyles: Record<string, { bg: string; text: string }> = {
  not_sent: { bg: 'bg-gray-100', text: 'text-gray-700' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700' },
  viewed: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  signed: { bg: 'bg-green-100', text: 'text-green-700' },
  declined: { bg: 'bg-red-100', text: 'text-red-700' },
};

type TypeFilter = 'all' | Document['type'];

export function DocumentsManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const filteredDocuments = mockDocuments.filter((doc) => {
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.name.toLowerCase().includes(query) ||
        doc.dealName?.toLowerCase().includes(query) ||
        doc.investorName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const toggleDocSelection = (id: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDocs(newSelected);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="mt-1 text-muted-foreground">
            Manage fund documents and track signatures
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {selectedDocs.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedDocs.size} selected
            </span>
            <Button variant="outline" size="sm">
              <Send className="mr-2 h-4 w-4" />
              Send for Signature
            </Button>
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-12 p-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
                <th className="p-4 text-left text-sm font-medium">Document</th>
                <th className="p-4 text-left text-sm font-medium">Type</th>
                <th className="p-4 text-left text-sm font-medium">Deal/Investor</th>
                <th className="p-4 text-left text-sm font-medium">Signature Status</th>
                <th className="p-4 text-left text-sm font-medium">Created</th>
                <th className="w-16 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4">No documents found</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedDocs.has(doc.id)}
                        onChange={() => toggleDocSelection(doc.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        {typeLabels[doc.type]}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {doc.dealName || doc.investorName || '—'}
                    </td>
                    <td className="p-4">
                      {doc.requiresSignature && doc.signingStatus ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                            signingStatusStyles[doc.signingStatus].bg,
                            signingStatusStyles[doc.signingStatus].text
                          )}
                        >
                          {doc.signingStatus === 'signed' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {doc.signingStatus.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upload Document</h2>
              <button onClick={() => setShowUploadModal(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Document Name</Label>
                <Input placeholder="Enter document name" />
              </div>
              <div className="space-y-2">
                <Label>Document Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>File</Label>
                <div className="rounded-lg border-2 border-dashed p-8 text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag & drop or click to upload
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="requiresSignature" className="rounded" />
                <Label htmlFor="requiresSignature">Requires signature</Label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button>Upload</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


