import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  X,
  Building2,
  Users,
  ChevronRight,
  ArrowLeft,
  FolderOpen,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@flowveda/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  documentsApi,
  Document,
  DocumentsByDeal,
  DocumentsByInvestor,
  typeLabels,
} from '@/lib/api/documents';
import { statusLabels } from '@/lib/api/deals';

type TabType = 'by-deal' | 'by-investor' | 'all';
type ViewMode = 'list' | 'detail';

const signingStatusStyles: Record<string, { bg: string; text: string }> = {
  not_sent: { bg: 'bg-gray-100', text: 'text-gray-700' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700' },
  viewed: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  signed: { bg: 'bg-green-100', text: 'text-green-700' },
  declined: { bg: 'bg-red-100', text: 'text-red-700' },
};

export function DocumentsManager() {
  const [activeTab, setActiveTab] = useState<TabType>('by-deal');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [selectedDealName, setSelectedDealName] = useState<string>('');
  const [selectedInvestorName, setSelectedInvestorName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch documents by deal
  const { data: dealsList = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['documents', 'by-deal'],
    queryFn: () => documentsApi.getByDeal(),
    enabled: activeTab === 'by-deal' && viewMode === 'list',
  });

  // Fetch documents by investor
  const { data: investorsList = [], isLoading: investorsLoading } = useQuery({
    queryKey: ['documents', 'by-investor'],
    queryFn: () => documentsApi.getByInvestor(),
    enabled: activeTab === 'by-investor' && viewMode === 'list',
  });

  // Fetch all documents
  const { data: allDocuments = [], isLoading: allDocsLoading } = useQuery({
    queryKey: ['documents', 'all', typeFilter],
    queryFn: () => documentsApi.getAll(typeFilter),
    enabled: activeTab === 'all',
  });

  // Fetch documents for selected deal
  const { data: dealDocuments = [], isLoading: dealDocsLoading } = useQuery({
    queryKey: ['documents', 'deal', selectedDealId],
    queryFn: () => documentsApi.getDocumentsForDeal(selectedDealId!),
    enabled: !!selectedDealId && viewMode === 'detail',
  });

  // Fetch documents for selected investor
  const { data: investorDocuments = [], isLoading: investorDocsLoading } = useQuery({
    queryKey: ['documents', 'investor', selectedInvestorId],
    queryFn: () => documentsApi.getDocumentsForInvestor(selectedInvestorId!),
    enabled: !!selectedInvestorId && viewMode === 'detail',
  });

  const handleDealClick = (deal: DocumentsByDeal) => {
    setSelectedDealId(deal.dealId);
    setSelectedDealName(deal.dealName);
    setViewMode('detail');
  };

  const handleInvestorClick = (investor: DocumentsByInvestor) => {
    setSelectedInvestorId(investor.investorId);
    setSelectedInvestorName(investor.investorName);
    setViewMode('detail');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedDealId(null);
    setSelectedInvestorId(null);
    setSelectedDealName('');
    setSelectedInvestorName('');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setViewMode('list');
    setSelectedDealId(null);
    setSelectedInvestorId(null);
    setSearchQuery('');
  };

  // Filter documents based on search
  const filterDocuments = (docs: Document[]) => {
    if (!searchQuery) return docs;
    const query = searchQuery.toLowerCase();
    return docs.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.dealName?.toLowerCase().includes(query) ||
        doc.investorName?.toLowerCase().includes(query)
    );
  };

  const currentDocuments =
    activeTab === 'by-deal'
      ? filterDocuments(dealDocuments)
      : activeTab === 'by-investor'
      ? filterDocuments(investorDocuments)
      : filterDocuments(allDocuments);

  const isLoading =
    activeTab === 'by-deal'
      ? viewMode === 'list'
        ? dealsLoading
        : dealDocsLoading
      : activeTab === 'by-investor'
      ? viewMode === 'list'
        ? investorsLoading
        : investorDocsLoading
      : allDocsLoading;

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

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => handleTabChange('by-deal')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'by-deal'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Building2 className="h-4 w-4" />
          By Deal
        </button>
        <button
          onClick={() => handleTabChange('by-investor')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'by-investor'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Users className="h-4 w-4" />
          By Investor
        </button>
        <button
          onClick={() => handleTabChange('all')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <FolderOpen className="h-4 w-4" />
          All Documents
        </button>
      </div>

      {/* Back Button for Detail View */}
      {viewMode === 'detail' && (
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to {activeTab === 'by-deal' ? 'Deals' : 'Investors'}
        </Button>
      )}

      {/* By Deal Tab - List View */}
      {activeTab === 'by-deal' && viewMode === 'list' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left text-sm font-medium">Deal Name</th>
                    <th className="p-4 text-left text-sm font-medium">Investors</th>
                    <th className="p-4 text-left text-sm font-medium">Close Date</th>
                    <th className="p-4 text-left text-sm font-medium">Total Equity</th>
                    <th className="p-4 text-left text-sm font-medium">Status</th>
                    <th className="p-4 text-left text-sm font-medium">Documents</th>
                    <th className="w-16 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Loading deals...
                      </td>
                    </tr>
                  ) : dealsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-4">No deals found</p>
                      </td>
                    </tr>
                  ) : (
                    dealsList
                      .filter(
                        (deal) =>
                          !searchQuery ||
                          deal.dealName.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((deal) => (
                        <tr
                          key={deal.dealId}
                          className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer"
                          onClick={() => handleDealClick(deal)}
                        >
                          <td className="p-4">
                            <span className="font-medium text-primary hover:underline">
                              {deal.dealName}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {deal.investorCount > 0 ? `${deal.investorCount} investors` : '—'}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {deal.closeDate ? formatDate(deal.closeDate) : '—'}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {deal.totalEquity > 0 ? formatCurrency(deal.totalEquity) : '—'}
                          </td>
                          <td className="p-4">
                            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 capitalize">
                              {statusLabels[deal.dealStatus] || deal.dealStatus}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {deal.documentCount} documents
                          </td>
                          <td className="p-4">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* By Investor Tab - List View */}
      {activeTab === 'by-investor' && viewMode === 'list' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search investors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left text-sm font-medium">Investor Name</th>
                    <th className="p-4 text-left text-sm font-medium">Email</th>
                    <th className="p-4 text-left text-sm font-medium">Documents</th>
                    <th className="w-16 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        Loading investors...
                      </td>
                    </tr>
                  ) : investorsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-4">No investors found</p>
                      </td>
                    </tr>
                  ) : (
                    investorsList
                      .filter(
                        (inv) =>
                          !searchQuery ||
                          inv.investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.email.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((investor) => (
                        <tr
                          key={investor.investorId}
                          className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer"
                          onClick={() => handleInvestorClick(investor)}
                        >
                          <td className="p-4">
                            <span className="font-medium text-primary hover:underline">
                              {investor.investorName}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">{investor.email}</td>
                          <td className="p-4 text-muted-foreground">
                            {investor.documentCount} documents
                          </td>
                          <td className="p-4">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detail View (documents for selected deal/investor) or All Documents Tab */}
      {(viewMode === 'detail' || activeTab === 'all') && (
        <div className="space-y-4">
          {viewMode === 'detail' && (
            <h2 className="text-xl font-semibold">
              Documents for {activeTab === 'by-deal' ? selectedDealName : selectedInvestorName}
            </h2>
          )}

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
            {activeTab === 'all' && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
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
            )}
          </div>

          {/* Documents Table */}
          <div className="rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left text-sm font-medium">Document</th>
                    <th className="p-4 text-left text-sm font-medium">Type</th>
                    <th className="p-4 text-left text-sm font-medium">
                      {activeTab === 'by-deal' ? 'Investor' : activeTab === 'by-investor' ? 'Deal' : 'Deal/Investor'}
                    </th>
                    <th className="p-4 text-left text-sm font-medium">Signature Status</th>
                    <th className="p-4 text-left text-sm font-medium">Created</th>
                    <th className="w-24 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Loading documents...
                      </td>
                    </tr>
                  ) : currentDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-4">No documents found</p>
                      </td>
                    </tr>
                  ) : (
                    currentDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b last:border-b-0 hover:bg-muted/30">
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
                          {activeTab === 'by-deal'
                            ? doc.investorName || '—'
                            : activeTab === 'by-investor'
                            ? doc.dealName || '—'
                            : doc.dealName || doc.investorName || '—'}
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
                            {doc.filePath && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => window.open(doc.filePath!, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
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
        </div>
      )}

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
