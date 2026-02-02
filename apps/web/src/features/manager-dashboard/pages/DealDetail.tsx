import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Edit,
  DollarSign,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@altsui/shared';
import type { KpiDataType } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DealInvestorsModal } from '../components/DealInvestorsModal';
import { dealsApi, DealInvestor } from '@/lib/api/deals';
import { outliersApi } from '@/lib/api/kpis';
import { useDealKpiSummaryWithDimensions } from '../hooks/useDealKpis';
import { getDateRangeFromPreset } from '../components/kpi';
import type { KpiCategoryNavOption, TimePeriodPreset, DateRange } from '../components/kpi';
import { DealTimelineSection } from '../components/deal-timeline';
import {
  OverviewTab,
  InvestorsTab,
  DocumentsTab,
  FinancialsTab,
  KPIsEditor,
  mockDeal,
  mockInvestors,
  mockDocuments,
  getPropertyTypeConfig,
  statusStyles,
  createMockKpiSummary,
  type DealWithKpis,
} from '../components/deal-detail';

type TabType = 'overview' | 'milestones' | 'investors' | 'documents' | 'financials' | 'kpis';

export function DealDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [deal, setDeal] = useState<DealWithKpis>(mockDeal);
  const [isRealDeal, setIsRealDeal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dealInvestors, setDealInvestors] = useState<DealInvestor[]>([]);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(false);
  const [showInvestorsModal, setShowInvestorsModal] = useState(false);

  // Financials tab state
  const [selectedCategory, setSelectedCategory] = useState<KpiCategoryNavOption>('all');
  const [dataType, setDataType] = useState<KpiDataType>('actual');
  const [timePeriod, setTimePeriod] = useState<TimePeriodPreset>('30d');
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeFromPreset('30d', new Date())
  );

  // Fetch KPI summary for financials tab
  const { data: kpiSummary, isLoading: isKpiLoading } = useDealKpiSummaryWithDimensions(id, {
    dealName: deal?.name,
    enabled: activeTab === 'financials',
  });

  // Fetch outliers data (only when outliers category is selected)
  const { data: outliers, isLoading: isOutliersLoading } = useQuery({
    queryKey: ['deal-outliers', id, dateRange.startDate, dateRange.endDate],
    queryFn: () =>
      outliersApi.getOutliers(id!, {
        topCount: 5,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
    enabled: !!id && activeTab === 'financials' && selectedCategory === 'outliers',
  });

  // Check if we have real KPI data from the API
  const hasRealKpiData =
    kpiSummary?.featured?.length ||
    Object.values(kpiSummary?.byCategory || {}).some((arr) => arr.length > 0);

  // Use real data if available, otherwise fall back to mock for demo
  const displayKpiSummary = hasRealKpiData
    ? kpiSummary!
    : createMockKpiSummary(new Date().toISOString());

  // Fetch real deal from API
  useEffect(() => {
    async function fetchDeal(): Promise<void> {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const realDeal = await dealsApi.getById(id);
        setDeal({
          ...realDeal,
          kpis: realDeal.kpis || mockDeal.kpis,
          totalInvestment: mockDeal.totalInvestment,
        });
        setIsRealDeal(true);
      } catch (error) {
        console.log('Using mock data - deal not found in database');
        setIsRealDeal(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDeal();
  }, [id]);

  // Fetch deal investors
  async function fetchDealInvestors(): Promise<void> {
    if (!id || !isRealDeal) return;

    setIsLoadingInvestors(true);
    try {
      const investors = await dealsApi.getDealInvestors(id);
      setDealInvestors(investors);
    } catch (error) {
      console.error('Failed to fetch deal investors:', error);
    } finally {
      setIsLoadingInvestors(false);
    }
  }

  useEffect(() => {
    if (isRealDeal && id) {
      fetchDealInvestors();
    }
  }, [isRealDeal, id]);

  function handleTimePeriodChange(preset: TimePeriodPreset, range: DateRange): void {
    setTimePeriod(preset);
    setDateRange(range);
  }

  function handleCategoryChange(category: KpiCategoryNavOption): void {
    setSelectedCategory(category);
  }

  const config = getPropertyTypeConfig(deal.propertyType || 'other');

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'investors', label: 'Investors', count: isRealDeal ? dealInvestors.length : mockInvestors.length },
    { id: 'documents', label: 'Documents', count: mockDocuments.length },
    { id: 'financials', label: 'Financials' },
    { id: 'kpis', label: 'KPIs' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading deal...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/manager/deals">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Deals
        </Button>
      </Link>

      {/* Header */}
      <DealHeader deal={deal} config={config} dealId={id} />

      {/* Key Metrics */}
      <DealMetrics deal={deal} />

      {/* Tabs */}
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab deal={deal} dealId={id} />}

      {activeTab === 'milestones' && id && <DealTimelineSection dealId={id} />}

      {activeTab === 'investors' && (
        <InvestorsTab
          dealInvestors={dealInvestors}
          mockInvestors={mockInvestors}
          isRealDeal={isRealDeal}
          isLoading={isLoadingInvestors}
          onManageInvestors={() => setShowInvestorsModal(true)}
        />
      )}

      {/* Investors Modal */}
      {id && (
        <DealInvestorsModal
          isOpen={showInvestorsModal}
          onClose={() => {
            setShowInvestorsModal(false);
            fetchDealInvestors();
          }}
          dealId={id}
          dealName={deal.name}
        />
      )}

      {activeTab === 'documents' && <DocumentsTab documents={mockDocuments} />}

      {activeTab === 'financials' && id && (
        <FinancialsTab
          dealId={id}
          kpiSummary={kpiSummary}
          outliers={outliers}
          isKpiLoading={isKpiLoading}
          isOutliersLoading={isOutliersLoading}
          hasRealKpiData={!!hasRealKpiData}
          selectedCategory={selectedCategory}
          dataType={dataType}
          timePeriod={timePeriod}
          dateRange={dateRange}
          onCategoryChange={handleCategoryChange}
          onDataTypeChange={setDataType}
          onTimePeriodChange={handleTimePeriodChange}
          displayKpiSummary={displayKpiSummary}
        />
      )}

      {activeTab === 'kpis' && (
        <KPIsEditor deal={deal} isRealDeal={isRealDeal} onUpdate={setDeal} />
      )}
    </div>
  );
}

// ============================================
// Sub-components (kept in same file for locality)
// ============================================
interface DealHeaderProps {
  deal: DealWithKpis;
  config: { gradient: string; icon: React.ReactNode };
  dealId?: string;
}

function DealHeader({ deal, config, dealId }: DealHeaderProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-4">
        {/* Deal Image or Placeholder */}
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
          {deal.imageUrl ? (
            <img src={deal.imageUrl} alt={deal.name} className="h-full w-full object-cover" />
          ) : (
            <div
              className={cn(
                'flex h-full w-full items-center justify-center bg-gradient-to-br',
                config.gradient
              )}
            >
              {config.icon}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{deal.name}</h1>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                statusStyles[deal.status]
              )}
            >
              {deal.status.replace(/_/g, ' ')}
            </span>
          </div>
          {deal.address && (
            <div className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {deal.address.street}, {deal.address.city}, {deal.address.state} {deal.address.zip}
              </span>
            </div>
          )}
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="capitalize">{deal.propertyType}</span>
            {deal.unitCount && <span>{deal.unitCount} units</span>}
            {deal.squareFootage && <span>{deal.squareFootage.toLocaleString()} sq ft</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link to={`/manager/capital-calls/new?dealId=${dealId}`}>
          <Button variant="outline" size="sm">
            <DollarSign className="mr-2 h-4 w-4" />
            Create Capital Call
          </Button>
        </Link>
        <Link to={`/manager/deals/${dealId}/edit`}>
          <Button size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Deal
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface DealMetricsProps {
  deal: DealWithKpis;
}

function DealMetrics({ deal }: DealMetricsProps): JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Acquisition Price</p>
        <p className="mt-1 text-2xl font-bold">
          {deal.acquisitionPrice ? formatCurrency(deal.acquisitionPrice) : '—'}
        </p>
        {deal.acquisitionDate && (
          <p className="mt-1 text-sm text-muted-foreground">{formatDate(deal.acquisitionDate)}</p>
        )}
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">NOI</p>
        <p className="mt-1 text-2xl font-bold">
          {deal.kpis?.noi ? formatCurrency(deal.kpis.noi) : '—'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Annual</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Cap Rate</p>
        <p className="mt-1 text-2xl font-bold">
          {deal.kpis?.capRate ? `${(deal.kpis.capRate * 100).toFixed(2)}%` : '—'}
        </p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Occupancy</p>
        <p className="mt-1 text-2xl font-bold">
          {deal.kpis?.occupancyRate ? `${(deal.kpis.occupancyRate * 100).toFixed(0)}%` : '—'}
        </p>
      </div>
    </div>
  );
}

interface TabNavigationProps {
  tabs: { id: TabType; label: string; count?: number }[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps): JSX.Element {
  return (
    <div className="border-b">
      <div className="flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
