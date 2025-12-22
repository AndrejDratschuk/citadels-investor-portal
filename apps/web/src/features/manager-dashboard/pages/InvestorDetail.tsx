import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  Edit,
  Send,
  MoreHorizontal,
  Building2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Plus,
  Loader2,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatDate, Communication } from '@flowveda/shared';
import { investorsApi } from '@/lib/api/investors';
import { Button } from '@/components/ui/button';
import { InvestorStatusBadge } from '../components/InvestorStatusBadge';
import { CommunicationsList } from '../components/CommunicationsList';
import { LogCommunicationModal, LogCommunicationData } from '../components/LogPhoneCallModal';
import { EmailComposeModal } from '../components/EmailComposeModal';
import { EditInvestorModal } from '../components/EditInvestorModal';
import { DocuSignModal } from '../components/DocuSignModal';
import { useCommunications, useCreateCommunication } from '../hooks/useCommunications';
import { useInvestor } from '../hooks/useInvestors';
import { cn } from '@/lib/utils';
import type { InvestorStatus, AccreditationStatus } from '../components/InvestorStatusBadge';

const mockDocuments = [
  {
    id: '1',
    name: 'Subscription Agreement',
    type: 'subscription',
    signingStatus: 'signed',
    signedAt: '2023-06-10',
    createdAt: '2023-06-05',
  },
  {
    id: '2',
    name: 'Private Placement Memorandum',
    type: 'ppm',
    signingStatus: 'signed',
    signedAt: '2023-06-08',
    createdAt: '2023-06-05',
  },
  {
    id: '3',
    name: 'K-1 Tax Document 2023',
    type: 'k1',
    signingStatus: null,
    signedAt: null,
    createdAt: '2024-01-15',
  },
];

const mockCapitalCalls = [
  {
    id: '1',
    dealName: 'Riverside Apartments',
    amountDue: 96000,
    amountReceived: 96000,
    status: 'complete',
    deadline: '2023-07-15',
  },
  {
    id: '2',
    dealName: 'Downtown Office Tower',
    amountDue: 43000,
    amountReceived: 43000,
    status: 'complete',
    deadline: '2024-02-01',
  },
  {
    id: '3',
    dealName: 'Eastside Industrial',
    amountDue: 62000,
    amountReceived: 31000,
    status: 'partial',
    deadline: '2024-03-15',
  },
];

const mockActivity = [
  {
    id: '1',
    type: 'wire_received',
    description: 'Wire received for Eastside Industrial - $31,000',
    timestamp: '2024-02-28T14:30:00Z',
  },
  {
    id: '2',
    type: 'document_signed',
    description: 'Signed K-1 Tax Document 2023',
    timestamp: '2024-01-20T10:15:00Z',
  },
  {
    id: '3',
    type: 'capital_call',
    description: 'Capital call sent for Eastside Industrial',
    timestamp: '2024-02-15T09:00:00Z',
  },
];

// Mock communications data - will be replaced with API calls
const mockCommunications: Communication[] = [
  {
    id: '1',
    investorId: '1',
    fundId: '1',
    type: 'email',
    title: 'Q4 Distribution Notice',
    content: 'Please find attached the Q4 distribution details for your investment...',
    occurredAt: '2024-02-15T10:30:00Z',
    emailFrom: 'distributions@fund.com',
    emailTo: 'john.smith@example.com',
    meetingAttendees: null,
    meetingDurationMinutes: null,
    callDirection: null,
    callDurationMinutes: null,
    source: 'email_sync',
    externalId: null,
    createdBy: null,
    createdAt: '2024-02-15T10:30:00Z',
  },
  {
    id: '2',
    investorId: '1',
    fundId: '1',
    type: 'meeting',
    title: 'Portfolio Review Meeting',
    content: 'Discussed current portfolio performance, upcoming capital calls, and investment strategy for 2024. John expressed interest in increasing commitment.',
    occurredAt: '2024-02-10T14:00:00Z',
    emailFrom: null,
    emailTo: null,
    meetingAttendees: ['John Smith', 'Sarah Manager'],
    meetingDurationMinutes: 45,
    callDirection: null,
    callDurationMinutes: null,
    source: 'ai_notetaker',
    externalId: null,
    createdBy: null,
    createdAt: '2024-02-10T15:00:00Z',
  },
  {
    id: '3',
    investorId: '1',
    fundId: '1',
    type: 'phone_call',
    title: 'Follow-up on wire transfer',
    content: 'Called to confirm wire instructions for upcoming capital call. John confirmed he will send by Friday.',
    occurredAt: '2024-02-08T11:15:00Z',
    emailFrom: null,
    emailTo: null,
    meetingAttendees: null,
    meetingDurationMinutes: null,
    callDirection: 'outbound',
    callDurationMinutes: 12,
    source: 'manual',
    externalId: null,
    createdBy: 'user-1',
    createdAt: '2024-02-08T11:30:00Z',
  },
  {
    id: '4',
    investorId: '1',
    fundId: '1',
    type: 'phone_call',
    title: 'Question about K-1 documents',
    content: 'John called with questions about his K-1 tax documents. Directed him to our accountant for detailed tax guidance.',
    occurredAt: '2024-01-25T09:45:00Z',
    emailFrom: null,
    emailTo: null,
    meetingAttendees: null,
    meetingDurationMinutes: null,
    callDirection: 'inbound',
    callDurationMinutes: 8,
    source: 'manual',
    externalId: null,
    createdBy: 'user-1',
    createdAt: '2024-01-25T10:00:00Z',
  },
];

type TabType = 'overview' | 'documents' | 'capital-calls' | 'communications' | 'activity';

export function InvestorDetail() {
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

  // Fetch real investor data from API
  const { data: investor, isLoading: investorLoading, error: investorError } = useInvestor(id);

  const handleEditSuccess = () => {
    // Refresh investor data
    queryClient.invalidateQueries({ queryKey: ['investor', id] });
    queryClient.invalidateQueries({ queryKey: ['investors'] });
  };

  const handleDelete = async () => {
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
  };
  const investorId = id || '';

  // Communications - use API data if available, fallback to mock
  const { data: apiCommunications, isLoading: communicationsLoading } = useCommunications(investorId);
  const createCommunication = useCreateCommunication(investorId);
  const communications = apiCommunications || mockCommunications;

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
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Investor Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              The investor you're looking for doesn't exist or you don't have access.
            </p>
            <Link to="/manager/investors">
              <Button className="mt-4">View All Investors</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleLogCommunication = async (data: LogCommunicationData) => {
    try {
      await createCommunication.mutateAsync(data);
      setShowCommunicationModal(false);
    } catch (error: any) {
      console.error('Failed to log communication:', error);
      alert(`Failed to log communication: ${error?.message || 'Unknown error'}`);
    }
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
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
          <Button variant="outline" size="sm" onClick={() => setShowEmailModal(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDocuSignModal(true)}>
            <Send className="mr-2 h-4 w-4" />
            Send Document
          </Button>
          <Button size="sm" onClick={() => setShowEditModal(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Commitment</p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(investor.commitmentAmount)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Called</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatCurrency(investor.totalCalled)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {callRate.toFixed(0)}% of commitment
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(investor.commitmentAmount - investor.totalCalled)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact Info */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">Contact Information</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{investor.email}</span>
              </div>
              {investor.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{investor.phone}</span>
                </div>
              )}
              {investor.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{investor.address.street}</p>
                    <p>
                      {investor.address.city}, {investor.address.state}{' '}
                      {investor.address.zip}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Entity & Accreditation */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">Entity & Accreditation</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entity Type</span>
                <span className="capitalize">{investor.entityType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Accreditation Type</span>
                <span className="capitalize">
                  {investor.accreditationType?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Accredited Since</span>
                <span>{formatDate(investor.accreditationDate!)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span>{formatDate(investor.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="rounded-xl border bg-card">
          <div className="divide-y">
            {mockDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {doc.signingStatus === 'signed' ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Signed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Not required
                    </span>
                  )}
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'capital-calls' && (
        <div className="rounded-xl border bg-card">
          <div className="divide-y">
            {mockCapitalCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-4 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{call.dealName}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {formatDate(call.deadline)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(call.amountReceived)} / {formatCurrency(call.amountDue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {((call.amountReceived / call.amountDue) * 100).toFixed(0)}% received
                    </p>
                  </div>
                  {call.status === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'communications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Track all communications with this investor
              </span>
            </div>
            <Button onClick={() => setShowCommunicationModal(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Log Communication
            </Button>
          </div>
          <CommunicationsList
            communications={communications}
            isLoading={communicationsLoading}
            investorEmail={investor?.email}
          />
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="rounded-xl border bg-card p-6">
          <div className="space-y-4">
            {mockActivity.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-start gap-4',
                  index !== mockActivity.length - 1 && 'pb-4 border-b'
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Communication Modal */}
      <LogCommunicationModal
        isOpen={showCommunicationModal}
        onClose={() => setShowCommunicationModal(false)}
        onSubmit={handleLogCommunication}
        isLoading={createCommunication.isPending}
        investorEmail={investor.email}
      />

      {/* Email Compose Modal */}
      <EmailComposeModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        recipientEmail={investor.email}
        defaultSubject=""
        defaultBody=""
      />

      {/* Edit Investor Modal */}
      <EditInvestorModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        investor={investor}
        onSuccess={handleEditSuccess}
      />

      {/* DocuSign Modal */}
      <DocuSignModal
        isOpen={showDocuSignModal}
        onClose={() => setShowDocuSignModal(false)}
        investorId={investor.id}
        investorName={`${investor.firstName} ${investor.lastName}`}
        investorEmail={investor.email}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Delete Investor</h3>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">
                {investor.firstName} {investor.lastName}
              </span>
              ? All associated data including communications and capital call records will be permanently removed.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Investor'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


