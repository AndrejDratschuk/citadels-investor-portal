import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Briefcase,
  Check,
  ChevronDown,
  Tag,
  Plus,
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
  DocumentCategory,
  DocumentDepartment,
  DocumentStatus,
  typeLabels,
  categoryLabels,
  departmentLabels,
  documentStatusLabels,
} from '@/lib/api/documents';
import { statusLabels } from '@/lib/api/deals';
import { dealsApi } from '@/lib/api/deals';
import { investorsApi } from '@/lib/api/investors';

type TabType = 'all' | 'fund' | 'by-deal' | 'by-investor';
type ViewMode = 'list' | 'detail';

const signingStatusStyles: Record<string, { bg: string; text: string }> = {
  not_sent: { bg: 'bg-gray-100', text: 'text-gray-700' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700' },
  viewed: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  signed: { bg: 'bg-green-100', text: 'text-green-700' },
  declined: { bg: 'bg-red-100', text: 'text-red-700' },
};

export function DocumentsManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [selectedDealName, setSelectedDealName] = useState<string>('');
  const [selectedInvestorName, setSelectedInvestorName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Advanced filters (dropdown style)
  const [dealFilter, setDealFilter] = useState<string | null>(null);
  const [investorFilter, setInvestorFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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
    queryKey: ['documents', 'all', typeFilter, dealFilter, investorFilter, departmentFilter, statusFilter],
    queryFn: () => documentsApi.getAll({
      type: typeFilter,
      dealId: dealFilter || undefined,
      investorId: investorFilter || undefined,
      department: departmentFilter as DocumentDepartment || undefined,
      status: statusFilter as DocumentStatus || undefined,
    }),
    enabled: activeTab === 'all',
  });

  // Fetch fund-level documents
  const { data: fundDocuments = [], isLoading: fundDocsLoading } = useQuery({
    queryKey: ['documents', 'fund', typeFilter, departmentFilter, statusFilter],
    queryFn: () => documentsApi.getAll({
      category: 'fund',
      type: typeFilter,
      department: departmentFilter as DocumentDepartment || undefined,
      status: statusFilter as DocumentStatus || undefined,
    }),
    enabled: activeTab === 'fund',
  });

  // Fetch deals list for filter dropdown
  const { data: dealsForFilter = [] } = useQuery({
    queryKey: ['deals', 'list'],
    queryFn: () => dealsApi.getAll(),
  });

  // Fetch investors list for filter dropdown
  const { data: investorsForFilter = [] } = useQuery({
    queryKey: ['investors', 'list'],
    queryFn: () => investorsApi.getAll(),
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
      : activeTab === 'fund'
      ? filterDocuments(fundDocuments)
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
      : activeTab === 'fund'
      ? fundDocsLoading
      : allDocsLoading;

  // Clear all filters
  const clearFilters = () => {
    setDealFilter(null);
    setInvestorFilter(null);
    setDepartmentFilter(null);
    setStatusFilter(null);
    setTypeFilter('all');
  };

  const hasActiveFilters = dealFilter || investorFilter || departmentFilter || statusFilter || typeFilter !== 'all';

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
        <button
          onClick={() => handleTabChange('fund')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'fund'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Briefcase className="h-4 w-4" />
          Fund Documents
        </button>
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
          Deal Documents
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
          Investor Documents
        </button>
      </div>

      {/* Back Button for Detail View */}
      {viewMode === 'detail' && (
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to {activeTab === 'by-deal' ? 'Deal Documents' : 'Investor Documents'}
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

      {/* Fund Documents Tab */}
      {activeTab === 'fund' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search fund documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select
                value={departmentFilter || ''}
                onChange={(e) => setDepartmentFilter(e.target.value || null)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">All Departments</option>
                {Object.entries(departmentLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select
                value={statusFilter || ''}
                onChange={(e) => setStatusFilter(e.target.value || null)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                {Object.entries(documentStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fund Documents Table */}
          <div className="rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left text-sm font-medium">Document</th>
                    <th className="p-4 text-left text-sm font-medium">Type</th>
                    <th className="p-4 text-left text-sm font-medium">Department</th>
                    <th className="p-4 text-left text-sm font-medium">Status</th>
                    <th className="p-4 text-left text-sm font-medium">Created</th>
                    <th className="w-24 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {fundDocsLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Loading fund documents...
                      </td>
                    </tr>
                  ) : currentDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-4">No fund documents found</p>
                        <p className="text-sm">Upload fund-level documents like PPMs, quarterly reports, or announcements.</p>
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
                            <div>
                              <span className="font-medium">{doc.name}</span>
                              {doc.tags && doc.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {doc.tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                  {doc.tags.length > 3 && (
                                    <span className="text-xs text-muted-foreground">+{doc.tags.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                            {typeLabels[doc.type]}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground text-sm">
                          {doc.department ? departmentLabels[doc.department] : '—'}
                        </td>
                        <td className="p-4">
                          {doc.status && (
                            <span className={cn(
                              'rounded-full px-2.5 py-0.5 text-xs font-medium',
                              doc.status === 'final' && 'bg-green-100 text-green-700',
                              doc.status === 'review' && 'bg-yellow-100 text-yellow-700',
                              doc.status === 'draft' && 'bg-gray-100 text-gray-700',
                            )}>
                              {documentStatusLabels[doc.status]}
                            </span>
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

      {/* Detail View (documents for selected deal/investor) or All Documents Tab */}
      {(viewMode === 'detail' || activeTab === 'all') && (
        <div className="space-y-4">
          {viewMode === 'detail' && (
            <h2 className="text-xl font-semibold">
              Documents for {activeTab === 'by-deal' ? selectedDealName : selectedInvestorName}
            </h2>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(hasActiveFilters && 'border-primary text-primary')}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1.5 rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs flex items-center justify-center">
                    {[dealFilter, investorFilter, departmentFilter, statusFilter, typeFilter !== 'all' ? typeFilter : null].filter(Boolean).length}
                  </span>
                )}
                <ChevronDown className={cn('h-4 w-4 ml-1 transition-transform', showFilters && 'rotate-180')} />
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Expanded Filters */}
          {activeTab === 'all' && showFilters && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Type</Label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                  >
                    <option value="all">All Types</option>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Deal</Label>
                  <select
                    value={dealFilter || ''}
                    onChange={(e) => setDealFilter(e.target.value || null)}
                    className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                  >
                    <option value="">All Deals</option>
                    {dealsForFilter.map((deal) => (
                      <option key={deal.id} value={deal.id}>{deal.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Investor</Label>
                  <select
                    value={investorFilter || ''}
                    onChange={(e) => setInvestorFilter(e.target.value || null)}
                    className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                  >
                    <option value="">All Investors</option>
                    {investorsForFilter.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.firstName} {inv.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Department</Label>
                  <select
                    value={departmentFilter || ''}
                    onChange={(e) => setDepartmentFilter(e.target.value || null)}
                    className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                  >
                    <option value="">All Departments</option>
                    {Object.entries(departmentLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Status</Label>
                  <select
                    value={statusFilter || ''}
                    onChange={(e) => setStatusFilter(e.target.value || null)}
                    className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                  >
                    <option value="">All Statuses</option>
                    {Object.entries(documentStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

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
        <UploadDocumentModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            queryClient.invalidateQueries({ queryKey: ['documents'] });
          }}
          deals={dealsForFilter}
          investors={investorsForFilter}
        />
      )}
    </div>
  );
}

// Separated Upload Modal Component for cleaner code
interface UploadDocumentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  deals: Array<{ id: string; name: string }>;
  investors: Array<{ id: string; firstName: string; lastName: string }>;
}

function UploadDocumentModal({ onClose, onSuccess, deals, investors }: UploadDocumentModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Document['type']>('other');
  const [category, setCategory] = useState<DocumentCategory>('fund');
  const [department, setDepartment] = useState<DocumentDepartment | ''>('');
  const [status, setStatus] = useState<DocumentStatus>('final');
  const [selectedDeal, setSelectedDeal] = useState<string>('');
  const [selectedInvestor, setSelectedInvestor] = useState<string>('');
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!name || !file) return;

    setIsUploading(true);
    try {
      // First upload the file
      const { fileUrl } = await documentsApi.uploadFile(file);

      // Then create the document record
      await documentsApi.create({
        name,
        type,
        category,
        department: department || undefined,
        status,
        tags: tags.length > 0 ? tags : undefined,
        dealId: category === 'deal' ? selectedDeal || undefined : undefined,
        investorId: category === 'investor' ? selectedInvestor || undefined : undefined,
        filePath: fileUrl,
        requiresSignature,
      });

      onSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="mt-6 space-y-5">
          {/* Document Name */}
          <div className="space-y-2">
            <Label>Document Name *</Label>
            <Input 
              placeholder="Enter document name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(categoryLabels) as [DocumentCategory, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium transition-colors',
                    category === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted hover:bg-muted/50'
                  )}
                >
                  {value === 'fund' && <Briefcase className="h-4 w-4" />}
                  {value === 'deal' && <Building2 className="h-4 w-4" />}
                  {value === 'investor' && <Users className="h-4 w-4" />}
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {category === 'fund' && 'Fund-level documents like PPMs, quarterly reports, and announcements.'}
              {category === 'deal' && 'Documents specific to a deal or property.'}
              {category === 'investor' && 'Documents specific to an individual investor.'}
            </p>
          </div>

          {/* Deal/Investor Selection based on category */}
          {category === 'deal' && (
            <div className="space-y-2">
              <Label>Associated Deal</Label>
              <select
                value={selectedDeal}
                onChange={(e) => setSelectedDeal(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a deal...</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>{deal.name}</option>
                ))}
              </select>
            </div>
          )}

          {category === 'investor' && (
            <div className="space-y-2">
              <Label>Associated Investor</Label>
              <select
                value={selectedInvestor}
                onChange={(e) => setSelectedInvestor(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select an investor...</option>
                {investors.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.firstName} {inv.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Document Type *</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Document['type'])}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label>Department</Label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as DocumentDepartment | '')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {Object.entries(departmentLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Status - affects visibility */}
          <div className="space-y-2">
            <Label>Status *</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(documentStatusLabels) as [DocumentStatus, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-md border p-2.5 text-sm font-medium transition-colors',
                    status === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted hover:bg-muted/50'
                  )}
                >
                  {status === value && <Check className="h-3.5 w-3.5" />}
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {status === 'draft' && 'Draft documents are only visible to fund managers.'}
              {status === 'review' && 'Under Review documents are only visible to fund managers.'}
              {status === 'final' && 'Final documents are visible to investors.'}
            </p>
          </div>

          {/* Custom Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>File *</Label>
            <div 
              className={cn(
                "rounded-lg border-2 border-dashed p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors",
                file && "border-primary bg-primary/5"
              )}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input
                id="fileInput"
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="font-medium">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="ml-2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag & drop or click to upload
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Requires Signature */}
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="requiresSignature" 
              checked={requiresSignature}
              onChange={(e) => setRequiresSignature(e.target.checked)}
              className="rounded" 
            />
            <Label htmlFor="requiresSignature">Requires signature</Label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!name || !file || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
}
