import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
} from 'lucide-react';
import { formatCurrency, formatDate, Communication } from '@flowveda/shared';
import { Button } from '@/components/ui/button';
import { InvestorStatusBadge } from '../components/InvestorStatusBadge';
import { CommunicationsList } from '../components/CommunicationsList';
import { LogPhoneCallModal } from '../components/LogPhoneCallModal';
import { useCommunications, useCreatePhoneCall } from '../hooks/useCommunications';
import { cn } from '@/lib/utils';

// Mock data - will be replaced with API calls
const mockInvestor = {
  id: '1',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@example.com',
  phone: '+1 (555) 123-4567',
  address: {
    street: '123 Main Street',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    country: 'USA',
  },
  status: 'active' as const,
  accreditationStatus: 'approved' as const,
  accreditationType: 'net_worth',
  accreditationDate: '2023-06-01',
  entityType: 'individual',
  entityName: null,
  commitmentAmount: 500000,
  totalCalled: 375000,
  totalInvested: 375000,
  onboardingStep: 5,
  onboardedAt: '2023-06-15',
  createdAt: '2023-06-01',
};

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
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showPhoneCallModal, setShowPhoneCallModal] = useState(false);

  // In real app, fetch investor data using id
  const investor = mockInvestor;
  const investorId = id || '1';

  // Communications - use API data if available, fallback to mock
  const { data: apiCommunications, isLoading: communicationsLoading } = useCommunications(investorId);
  const createPhoneCall = useCreatePhoneCall(investorId);
  const communications = apiCommunications || mockCommunications;

  const handleLogPhoneCall = async (data: {
    title: string;
    content?: string;
    occurredAt: string;
    callDirection: 'inbound' | 'outbound';
    callDurationMinutes?: number;
  }) => {
    try {
      await createPhoneCall.mutateAsync(data);
      setShowPhoneCallModal(false);
    } catch (error) {
      console.error('Failed to log phone call:', error);
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
              <InvestorStatusBadge status={investor.status} type="investor" />
              <InvestorStatusBadge
                status={investor.accreditationStatus}
                type="accreditation"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline" size="sm">
            <Send className="mr-2 h-4 w-4" />
            Send Document
          </Button>
          <Button size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
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
            <Button onClick={() => setShowPhoneCallModal(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Log Phone Call
            </Button>
          </div>
          <CommunicationsList
            communications={communications}
            isLoading={communicationsLoading}
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

      {/* Log Phone Call Modal */}
      <LogPhoneCallModal
        isOpen={showPhoneCallModal}
        onClose={() => setShowPhoneCallModal(false)}
        onSubmit={handleLogPhoneCall}
        isLoading={createPhoneCall.isPending}
      />
    </div>
  );
}


