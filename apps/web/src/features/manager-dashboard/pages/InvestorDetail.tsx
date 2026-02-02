import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Mail,
  Edit,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '@altsui/shared';
import { investorsApi, Investment } from '@/lib/api/investors';
import { Button } from '@/components/ui/button';
import { InvestorStatusBadge } from '../components/InvestorStatusBadge';
import { LogCommunicationModal, LogCommunicationData } from '../components/LogPhoneCallModal';
import { EmailComposeModal } from '../components/EmailComposeModal';
import { EditInvestorModal } from '../components/EditInvestorModal';
import { DocuSignModal } from '../components/DocuSignModal';
import {
  DeleteConfirmDialog,
  OverviewTab,
  InvestmentsTab,
  DocumentsTab,
  CapitalCallsTab,
  CommunicationsTab,
  ActivityTab,
  mockDocuments,
  mockCapitalCalls,
  mockActivity,
  mockCommunications,
} from '../components/investor-detail';
import { useCommunications, useCreateCommunication } from '../hooks/useCommunications';
import { useInvestor } from '../hooks/useInvestors';
import { cn } from '@/lib/utils';
import type { InvestorStatus, AccreditationStatus } from '../components/InvestorStatusBadge';

type TabType = 'overview' | 'investments' | 'documents' | 'capital-calls' | 'communications' | 'activity';

export function InvestorDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDocuSignModal, setShowDocuSignModal] = useState(false);

  // Investments state
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(false);

  // Fetch real investor data from API
  const { data: investor, isLoading: investorLoading, error: investorError } = useInvestor(id);

  // Fetch investor's deal investments
  useEffect(() => {
    async function fetchInvestments(): Promise<void> {
      if (!id) return;

      setIsLoadingInvestments(true);
      try {
        const data = await investorsApi.getInvestorDeals(id);
        setInvestments(data);
      } catch (error) {
        console.error('Failed to fetch investments:', error);
      } finally {
        setIsLoadingInvestments(false);
      }
    }

    fetchInvestments();
  }, [id]);

  const investorId = id || '';

  // Communications - use API data if available, fallback to mock
  const { data: apiCommunications, isLoading: communicationsLoading } = useCommunications(investorId);
  const createCommunication = useCreateCommunication(investorId);
  const communications = apiCommunications || mockCommunications;

  function handleEditSuccess(): void {
    queryClient.invalidateQueries({ queryKey: ['investor', id] });
    queryClient.invalidateQueries({ queryKey: ['investors'] });
  }

  async function handleDelete(): Promise<void> {
    if (!id) return;
    setIsDeleting(true);
    try {
      await investorsApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      navigate('/manager/investors');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete investor';
      alert(message);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleLogCommunication(data: LogCommunicationData): Promise<void> {
    try {
      await createCommunication.mutateAsync(data);
      setShowCommunicationModal(false);
    } catch (error: unknown) {
      console.error('Failed to log communication:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to log communication: ${message}`);
    }
  }

  // Loading state
  if (investorLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading investor...</p>
        </div>
      </div>
    );
  }

  // Error state - investor not found
  if (investorError || !investor) {
    return (
      <div className="space-y-6">
        <Link to="/manager/investors">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Investors
          </Button>
        </Link>
        <InvestorNotFoundState />
      </div>
    );
  }

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'investments', label: 'Investments', count: investments.length },
    { id: 'documents', label: 'Documents', count: mockDocuments.length },
    { id: 'capital-calls', label: 'Capital Calls', count: mockCapitalCalls.length },
    { id: 'communications', label: 'Communications', count: communications.length },
    { id: 'activity', label: 'Activity' },
  ];

  const callRate = investor.commitmentAmount > 0
    ? (investor.totalCalled / investor.commitmentAmount) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/manager/investors">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Investors
        </Button>
      </Link>

      {/* Header */}
      <InvestorHeader
        investor={investor}
        onSendEmail={() => setShowEmailModal(true)}
        onSendDocument={() => setShowDocuSignModal(true)}
        onEdit={() => setShowEditModal(true)}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      {/* Stats */}
      <InvestorStats
        commitmentAmount={investor.commitmentAmount}
        totalCalled={investor.totalCalled}
        callRate={callRate}
      />

      {/* Tabs */}
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab investor={investor} />}
      {activeTab === 'investments' && (
        <InvestmentsTab investments={investments} isLoading={isLoadingInvestments} />
      )}
      {activeTab === 'documents' && <DocumentsTab documents={mockDocuments} />}
      {activeTab === 'capital-calls' && <CapitalCallsTab capitalCalls={mockCapitalCalls} />}
      {activeTab === 'communications' && (
        <CommunicationsTab
          communications={communications}
          isLoading={communicationsLoading}
          investorEmail={investor.email}
          onLogCommunication={() => setShowCommunicationModal(true)}
        />
      )}
      {activeTab === 'activity' && <ActivityTab activities={mockActivity} />}

      {/* Modals */}
      <LogCommunicationModal
        isOpen={showCommunicationModal}
        onClose={() => setShowCommunicationModal(false)}
        onSubmit={handleLogCommunication}
        isLoading={createCommunication.isPending}
        investorEmail={investor.email}
      />

      <EmailComposeModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        recipientEmail={investor.email}
        defaultSubject=""
        defaultBody=""
      />

      <EditInvestorModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        investor={investor}
        onSuccess={handleEditSuccess}
      />

      <DocuSignModal
        isOpen={showDocuSignModal}
        onClose={() => setShowDocuSignModal(false)}
        investorId={investor.id}
        investorName={`${investor.firstName} ${investor.lastName}`}
        investorEmail={investor.email}
      />

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          investorName={`${investor.firstName} ${investor.lastName}`}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

// ============================================
// Sub-components (kept in same file for locality)
// ============================================

function InvestorNotFoundState(): JSX.Element {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Investor Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The investor you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link to="/manager/investors">
          <Button className="mt-4">View All Investors</Button>
        </Link>
      </div>
    </div>
  );
}

interface InvestorHeaderProps {
  investor: {
    firstName: string;
    lastName: string;
    status: string;
    accreditationStatus: string;
  };
  onSendEmail: () => void;
  onSendDocument: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function InvestorHeader({
  investor,
  onSendEmail,
  onSendDocument,
  onEdit,
  onDelete,
}: InvestorHeaderProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {investor.firstName} {investor.lastName}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <InvestorStatusBadge status={investor.status as InvestorStatus} type="investor" />
            <InvestorStatusBadge
              status={investor.accreditationStatus as AccreditationStatus}
              type="accreditation"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSendEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Send Email
        </Button>
        <Button variant="outline" size="sm" onClick={onSendDocument}>
          <Send className="mr-2 h-4 w-4" />
          Send Document
        </Button>
        <Button size="sm" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface InvestorStatsProps {
  commitmentAmount: number;
  totalCalled: number;
  callRate: number;
}

function InvestorStats({ commitmentAmount, totalCalled, callRate }: InvestorStatsProps): JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Commitment</p>
        <p className="mt-1 text-2xl font-bold">{formatCurrency(commitmentAmount)}</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Total Called</p>
        <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(totalCalled)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{callRate.toFixed(0)}% of commitment</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Remaining</p>
        <p className="mt-1 text-2xl font-bold">{formatCurrency(commitmentAmount - totalCalled)}</p>
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
