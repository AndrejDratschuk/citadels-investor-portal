import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { documentsApi, DocumentDepartment, DocumentStatus } from '@/lib/api/documents';
import { dealsApi } from '@/lib/api/deals';
import { investorsApi } from '@/lib/api/investors';

import { DocumentsTabNavigation } from './DocumentsTabNavigation';
import { DocumentFilters } from './DocumentFilters';
import { DocumentsTable } from './DocumentsTable';
import { DealDocumentsListView } from './DealDocumentsListView';
import { InvestorDocumentsListView } from './InvestorDocumentsListView';
import { UploadDocumentModal } from './UploadDocumentModal';
import { ValidationDocumentsPanel } from './ValidationDocumentsPanel';
import {
  TabType,
  ViewMode,
  DocumentFiltersState,
  Document,
  DocumentsByDeal,
  DocumentsByInvestor,
} from './types';

const initialFilters: DocumentFiltersState = {
  typeFilter: 'all',
  dealFilter: null,
  investorFilter: null,
  departmentFilter: null,
  statusFilter: null,
  searchQuery: '',
};

export function DocumentsManager() {
  const queryClient = useQueryClient();

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DocumentFiltersState>(initialFilters);

  // Detail view state
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedDealName, setSelectedDealName] = useState<string>('');
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [selectedInvestorName, setSelectedInvestorName] = useState<string>('');

  // Data queries
  const { data: dealsList = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['documents', 'by-deal'],
    queryFn: () => documentsApi.getByDeal(),
    enabled: activeTab === 'by-deal' && viewMode === 'list',
  });

  const { data: investorsList = [], isLoading: investorsLoading } = useQuery({
    queryKey: ['documents', 'by-investor'],
    queryFn: () => documentsApi.getByInvestor(),
    enabled: activeTab === 'by-investor' && viewMode === 'list',
  });

  const { data: allDocuments = [], isLoading: allDocsLoading } = useQuery({
    queryKey: ['documents', 'all', filters.typeFilter, filters.dealFilter, filters.investorFilter, filters.departmentFilter, filters.statusFilter],
    queryFn: () => documentsApi.getAll({
      type: filters.typeFilter,
      dealId: filters.dealFilter || undefined,
      investorId: filters.investorFilter || undefined,
      department: filters.departmentFilter as DocumentDepartment || undefined,
      status: filters.statusFilter as DocumentStatus || undefined,
    }),
    enabled: activeTab === 'all',
  });

  const { data: fundDocuments = [], isLoading: fundDocsLoading } = useQuery({
    queryKey: ['documents', 'fund', filters.typeFilter, filters.departmentFilter, filters.statusFilter],
    queryFn: () => documentsApi.getAll({
      category: 'fund',
      type: filters.typeFilter,
      department: filters.departmentFilter as DocumentDepartment || undefined,
      status: filters.statusFilter as DocumentStatus || undefined,
    }),
    enabled: activeTab === 'fund',
  });

  const { data: dealDocuments = [], isLoading: dealDocsLoading } = useQuery({
    queryKey: ['documents', 'deal', selectedDealId],
    queryFn: () => documentsApi.getDocumentsForDeal(selectedDealId!),
    enabled: !!selectedDealId && viewMode === 'detail',
  });

  const { data: investorDocuments = [], isLoading: investorDocsLoading } = useQuery({
    queryKey: ['documents', 'investor', selectedInvestorId],
    queryFn: () => documentsApi.getDocumentsForInvestor(selectedInvestorId!),
    enabled: !!selectedInvestorId && viewMode === 'detail',
  });

  const { data: dealsForFilter = [] } = useQuery({
    queryKey: ['deals', 'list'],
    queryFn: () => dealsApi.getAll(),
  });

  const { data: investorsForFilter = [] } = useQuery({
    queryKey: ['investors', 'list'],
    queryFn: () => investorsApi.getAll(),
  });

  // Get validation documents for pending count badge
  const { data: validationDocuments = [] } = useQuery({
    queryKey: ['documents', 'validation'],
    queryFn: () => documentsApi.getValidationDocuments(),
  });

  const pendingValidationCount = validationDocuments.filter(
    (doc) => doc.status === 'review' || doc.status === 'draft' || !doc.status
  ).length;

  // Handlers
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setViewMode('list');
    setSelectedDealId(null);
    setSelectedInvestorId(null);
    setFilters((prev) => ({ ...prev, searchQuery: '' }));
  }, []);

  const handleDealClick = useCallback((deal: DocumentsByDeal) => {
    setSelectedDealId(deal.dealId);
    setSelectedDealName(deal.dealName);
    setViewMode('detail');
  }, []);

  const handleInvestorClick = useCallback((investor: DocumentsByInvestor) => {
    setSelectedInvestorId(investor.investorId);
    setSelectedInvestorName(investor.investorName);
    setViewMode('detail');
  }, []);

  const handleBack = useCallback(() => {
    setViewMode('list');
    setSelectedDealId(null);
    setSelectedInvestorId(null);
    setSelectedDealName('');
    setSelectedInvestorName('');
  }, []);

  const handleFilterChange = useCallback((key: keyof DocumentFiltersState, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    setShowUploadModal(false);
    queryClient.invalidateQueries({ queryKey: ['documents'] });
  }, [queryClient]);

  // Filter documents by search
  const filterBySearch = useCallback((docs: Document[]): Document[] => {
    if (!filters.searchQuery) return docs;
    const query = filters.searchQuery.toLowerCase();
    return docs.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.dealName?.toLowerCase().includes(query) ||
        doc.investorName?.toLowerCase().includes(query)
    );
  }, [filters.searchQuery]);

  // Compute current documents and loading state
  const currentDocuments = activeTab === 'by-deal'
    ? filterBySearch(dealDocuments)
    : activeTab === 'by-investor'
    ? filterBySearch(investorDocuments)
    : activeTab === 'fund'
    ? filterBySearch(fundDocuments)
    : filterBySearch(allDocuments);

  const isLoading = activeTab === 'by-deal'
    ? viewMode === 'list' ? dealsLoading : dealDocsLoading
    : activeTab === 'by-investor'
    ? viewMode === 'list' ? investorsLoading : investorDocsLoading
    : activeTab === 'fund'
    ? fundDocsLoading
    : allDocsLoading;

  const getColumnConfig = (): 'all' | 'fund' | 'deal-detail' | 'investor-detail' => {
    if (activeTab === 'fund') return 'fund';
    if (activeTab === 'by-deal' && viewMode === 'detail') return 'deal-detail';
    if (activeTab === 'by-investor' && viewMode === 'detail') return 'investor-detail';
    return 'all';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="mt-1 text-muted-foreground">Manage fund documents and track signatures</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Tabs */}
      <DocumentsTabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingValidationCount={pendingValidationCount}
      />

      {/* Back Button for Detail View */}
      {viewMode === 'detail' && (
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to {activeTab === 'by-deal' ? 'Deal Documents' : 'Investor Documents'}
        </Button>
      )}

      {/* Deal Documents - List View */}
      {activeTab === 'by-deal' && viewMode === 'list' && (
        <DealDocumentsListView
          deals={dealsList}
          isLoading={dealsLoading}
          searchQuery={filters.searchQuery}
          onSearchChange={(q) => handleFilterChange('searchQuery', q)}
          onDealClick={handleDealClick}
        />
      )}

      {/* Investor Documents - List View */}
      {activeTab === 'by-investor' && viewMode === 'list' && (
        <InvestorDocumentsListView
          investors={investorsList}
          isLoading={investorsLoading}
          searchQuery={filters.searchQuery}
          onSearchChange={(q) => handleFilterChange('searchQuery', q)}
          onInvestorClick={handleInvestorClick}
        />
      )}

      {/* Validation Documents */}
      {activeTab === 'validation' && <ValidationDocumentsPanel />}

      {/* Fund Documents / All Documents / Detail Views */}
      {(activeTab === 'fund' || activeTab === 'all' || viewMode === 'detail') && activeTab !== 'validation' && (
        <div className="space-y-4">
          {viewMode === 'detail' && (
            <h2 className="text-xl font-semibold">
              Documents for {activeTab === 'by-deal' ? selectedDealName : selectedInvestorName}
            </h2>
          )}

          <DocumentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            showAdvancedFilters={showFilters}
            onToggleAdvancedFilters={() => setShowFilters(!showFilters)}
            deals={dealsForFilter}
            investors={investorsForFilter}
            showDealInvestorFilters={activeTab === 'all'}
            searchPlaceholder={activeTab === 'fund' ? 'Search fund documents...' : 'Search documents...'}
          />

          <DocumentsTable
            documents={currentDocuments}
            isLoading={isLoading}
            columnConfig={getColumnConfig()}
            emptyMessage={activeTab === 'fund' ? 'No fund documents found' : 'No documents found'}
            emptySubMessage={activeTab === 'fund' ? 'Upload fund-level documents like PPMs, quarterly reports, or announcements.' : undefined}
          />
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadDocumentModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
          deals={dealsForFilter}
          investors={investorsForFilter}
        />
      )}
    </div>
  );
}

