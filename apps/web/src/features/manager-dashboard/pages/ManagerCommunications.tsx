import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Mail,
  Video,
  Phone,
  Filter,
  Search,
  ArrowLeft,
  Clock,
  User,
  Tag,
  Building2,
  ChevronRight,
  Calendar,
  Users,
  Plus,
  Send,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Inbox,
} from 'lucide-react';
import { formatDate } from '@flowveda/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { investorsApi } from '@/lib/api/investors';
import { emailApi } from '@/lib/api/email';
import { communicationsApi } from '@/lib/api/communications';

type CommunicationType = 'email' | 'meeting' | 'phone_call';
type FilterType = 'all' | CommunicationType;
type DirectionFilter = 'all' | 'sent' | 'received';

const directionOptions: { id: DirectionFilter; label: string; icon: typeof Send }[] = [
  { id: 'all', label: 'All', icon: MessageSquare },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'received', label: 'Received', icon: Inbox },
];

interface Communication {
  id: string;
  type: CommunicationType;
  title: string;
  content: string | null;
  occurredAt: string;
  emailFrom: string | null;
  emailTo: string | null;
  meetingAttendees: string[] | null;
  meetingDurationMinutes: number | null;
  callDirection: 'inbound' | 'outbound' | null;
  callDurationMinutes: number | null;
  source: string;
  createdAt: string;
  tags: string[];
  investor: {
    id: string;
    name: string;
    email: string;
  };
  deal: {
    id: string;
    name: string;
  } | null;
}

// Mock data for manager view
const mockCommunications: Communication[] = [
  {
    id: 'comm-1',
    type: 'email',
    title: 'Q4 2024 Fund Performance Update',
    content: 'Dear Investor, we are pleased to share our Q4 2024 performance results. The fund achieved a 12.3% return this quarter...',
    occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    emailFrom: 'fund.manager@citadel.com',
    emailTo: 'john.smith@email.com',
    meetingAttendees: null,
    meetingDurationMinutes: null,
    callDirection: null,
    callDurationMinutes: null,
    source: 'email_sync',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['quarterly-report', 'performance', 'bulk-send'],
    investor: { id: '1', name: 'John Smith', email: 'john.smith@email.com' },
    deal: null,
  },
  {
    id: 'comm-2',
    type: 'email',
    title: 'Capital Call Notice - Downtown Office Tower',
    content: 'This notice is to inform you of an upcoming capital call for the Downtown Office Tower acquisition...',
    occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    emailFrom: 'capital.calls@citadel.com',
    emailTo: 'sarah.johnson@email.com',
    meetingAttendees: null,
    meetingDurationMinutes: null,
    callDirection: null,
    callDurationMinutes: null,
    source: 'email_sync',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['capital-call'],
    investor: { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@email.com' },
    deal: { id: '1', name: 'Downtown Office Tower' },
  },
  {
    id: 'comm-3',
    type: 'meeting',
    title: 'Annual Investor Meeting',
    content: 'Annual investor meeting to discuss fund performance and strategy for the upcoming year.',
    occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    emailFrom: null,
    emailTo: null,
    meetingAttendees: ['John Smith', 'Sarah Johnson', 'Michael Chen'],
    meetingDurationMinutes: 90,
    callDirection: null,
    callDurationMinutes: null,
    source: 'manual',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['meeting', 'annual', 'all-investors'],
    investor: { id: '1', name: 'John Smith', email: 'john.smith@email.com' },
    deal: null,
  },
  {
    id: 'comm-4',
    type: 'email',
    title: 'Distribution Notice - Riverside Apartments',
    content: 'We are pleased to announce a distribution from the Riverside Apartments investment...',
    occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    emailFrom: 'distributions@citadel.com',
    emailTo: 'michael.chen@email.com',
    meetingAttendees: null,
    meetingDurationMinutes: null,
    callDirection: null,
    callDurationMinutes: null,
    source: 'email_sync',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['distribution'],
    investor: { id: '3', name: 'Michael Chen', email: 'michael.chen@email.com' },
    deal: { id: '3', name: 'Riverside Apartments' },
  },
  {
    id: 'comm-5',
    type: 'phone_call',
    title: 'Follow-up call - Investment questions',
    content: 'Discussed the outstanding subscription agreement and answered questions about the fund structure.',
    occurredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    emailFrom: null,
    emailTo: null,
    meetingAttendees: null,
    meetingDurationMinutes: null,
    callDirection: 'outbound',
    callDurationMinutes: 15,
    source: 'manual',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['follow-up'],
    investor: { id: '4', name: 'Emily Davis', email: 'emily.davis@email.com' },
    deal: null,
  },
  {
    id: 'comm-6',
    type: 'email',
    title: 'Tax Documents Available - K-1 Forms',
    content: 'Your K-1 tax documents for the 2023 tax year are now available in your investor portal...',
    occurredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    emailFrom: 'tax@citadel.com',
    emailTo: 'robert.wilson@email.com',
    meetingAttendees: null,
    meetingDurationMinutes: null,
    callDirection: null,
    callDurationMinutes: null,
    source: 'email_sync',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['tax', 'k1', 'bulk-send'],
    investor: { id: '5', name: 'Robert Wilson', email: 'robert.wilson@email.com' },
    deal: null,
  },
];

// Mock deals for filter
const mockDeals = [
  { id: '1', name: 'Downtown Office Tower' },
  { id: '2', name: 'Eastside Industrial Park' },
  { id: '3', name: 'Riverside Apartments' },
  { id: '4', name: 'Tech Campus Development' },
];

// Mock investors for filter
const mockInvestors = [
  { id: '1', name: 'John Smith', email: 'john.smith@email.com' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@email.com' },
  { id: '3', name: 'Michael Chen', email: 'michael.chen@email.com' },
  { id: '4', name: 'Emily Davis', email: 'emily.davis@email.com' },
  { id: '5', name: 'Robert Wilson', email: 'robert.wilson@email.com' },
];

const filterOptions: { id: FilterType; label: string; icon: typeof Mail }[] = [
  { id: 'all', label: 'All', icon: MessageSquare },
  { id: 'email', label: 'Emails', icon: Mail },
  { id: 'meeting', label: 'Meetings', icon: Video },
  { id: 'phone_call', label: 'Calls', icon: Phone },
];

const typeConfig: Record<CommunicationType, {
  icon: typeof Mail;
  label: string;
  bgColor: string;
  iconColor: string;
}> = {
  email: {
    icon: Mail,
    label: 'Email',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  meeting: {
    icon: Video,
    label: 'Meeting',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  phone_call: {
    icon: Phone,
    label: 'Phone Call',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
};

interface CommunicationRowProps {
  communication: Communication;
  isSelected: boolean;
  onClick: () => void;
}

function CommunicationRow({ communication, isSelected, onClick }: CommunicationRowProps) {
  const config = typeConfig[communication.type];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b',
        isSelected && 'bg-primary/5 border-l-2 border-l-primary'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
          config.bgColor
        )}
      >
        <Icon className={cn('h-5 w-5', config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{communication.title}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{communication.investor.name}</span>
          </div>
          <span>•</span>
          <span className="whitespace-nowrap">{formatDate(communication.occurredAt)}</span>
        </div>
        {communication.deal && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{communication.deal.name}</span>
          </div>
        )}
        {communication.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {communication.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
            {communication.tags.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{communication.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

interface CommunicationDetailProps {
  communication: Communication;
  onBack: () => void;
}

// Compose Email Modal
interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  investors: { id: string; name: string; email: string }[];
  onSuccess: () => void;
}

function ComposeEmailModal({ isOpen, onClose, investors, onSuccess }: ComposeModalProps) {
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get email connection status
  const { data: emailStatus } = useQuery({
    queryKey: ['email', 'status'],
    queryFn: emailApi.getStatus,
  });

  const selectedInvestor = investors.find((i) => i.id === selectedInvestorId);

  const handleSend = async () => {
    if (!selectedInvestor || !subject.trim() || !body.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!emailStatus?.connected) {
      setError('Please connect your email account in Settings first');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Send the email
      const result = await emailApi.send({
        to: selectedInvestor.email,
        subject: subject.trim(),
        body: body.trim(),
      });

      // Log the communication in the database
      await communicationsApi.create(selectedInvestorId, {
        type: 'email',
        title: subject.trim(),
        content: body.trim(),
        occurredAt: new Date().toISOString(),
        emailFrom: result.from,
        emailTo: selectedInvestor.email,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        resetForm();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setSelectedInvestorId('');
    setSubject('');
    setBody('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-card rounded-xl shadow-xl border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Compose Email
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Email Status Warning */}
        {!emailStatus?.connected && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              No email connected.{' '}
              <Link to="/manager/settings" className="underline font-medium">
                Connect your email
              </Link>{' '}
              to send messages.
            </span>
          </div>
        )}

        {emailStatus?.connected && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 text-sm text-green-800">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              Sending from: <strong>{emailStatus.email}</strong>
            </span>
          </div>
        )}

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium mb-1.5">To:</label>
            <select
              value={selectedInvestorId}
              onChange={(e) => setSelectedInvestorId(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select an investor...</option>
              {investors.map((investor) => (
                <option key={investor.id} value={investor.id}>
                  {investor.name} ({investor.email})
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Message:</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={8}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Email sent successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !selectedInvestorId || !subject.trim() || !body.trim() || !emailStatus?.connected}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommunicationDetail({ communication, onBack }: CommunicationDetailProps) {
  const config = typeConfig[communication.type];
  const Icon = config.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 -ml-2 lg:hidden">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg',
              config.bgColor
            )}
          >
            <Icon className={cn('h-6 w-6', config.iconColor)} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{communication.title}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
              <Link
                to={`/manager/investors/${communication.investor.id}`}
                className="flex items-center gap-1 hover:underline"
              >
                <User className="h-4 w-4" />
                <span>{communication.investor.name}</span>
              </Link>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(communication.occurredAt)}</span>
              </div>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  config.bgColor,
                  config.iconColor
                )}
              >
                {config.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="border-b p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">To:</span>
          <span className="text-sm font-medium">{communication.investor.email}</span>
        </div>
        {communication.deal && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Deal:</span>
            <Link
              to={`/manager/deals/${communication.deal.id}`}
              className="text-sm font-medium hover:underline"
            >
              {communication.deal.name}
            </Link>
          </div>
        )}
        {communication.type === 'meeting' && communication.meetingAttendees && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Attendees:</span>
            <span className="text-sm font-medium">{communication.meetingAttendees.join(', ')}</span>
          </div>
        )}
        {communication.type === 'meeting' && communication.meetingDurationMinutes && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Duration:</span>
            <span className="text-sm font-medium">{communication.meetingDurationMinutes} minutes</span>
          </div>
        )}
        {communication.type === 'phone_call' && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {communication.callDirection === 'inbound' ? 'Inbound' : 'Outbound'} call
              {communication.callDurationMinutes && ` • ${communication.callDurationMinutes} min`}
            </span>
          </div>
        )}
        {communication.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {communication.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {communication.content ? (
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{communication.content}</p>
          </div>
        ) : (
          <p className="text-muted-foreground italic">No content available</p>
        )}
      </div>

      {/* Actions */}
      <div className="border-t p-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Mail className="h-4 w-4 mr-2" />
          Reply
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <Send className="h-4 w-4 mr-2" />
          Forward
        </Button>
      </div>
    </div>
  );
}

export function ManagerCommunications() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [dealFilter, setDealFilter] = useState<string | null>(
    searchParams.get('deal') || null
  );
  const [investorFilter, setInvestorFilter] = useState<string | null>(
    searchParams.get('investor') || null
  );
  const [tagFilter, setTagFilter] = useState<string | null>(
    searchParams.get('tag') || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);

  // Fetch real investors from API
  const { data: investorsList } = useQuery({
    queryKey: ['investors'],
    queryFn: investorsApi.getAll,
  });

  // Fetch real communications from API
  const { data: communicationsList, isLoading: communicationsLoading } = useQuery({
    queryKey: ['manager', 'communications'],
    queryFn: communicationsApi.getAll,
  });

  // Use real data or empty array
  const communications: Communication[] = (communicationsList || []).map((c) => ({
    id: c.id,
    type: c.type,
    title: c.title,
    content: c.content,
    occurredAt: c.occurredAt,
    emailFrom: c.emailFrom,
    emailTo: c.emailTo,
    meetingAttendees: c.meetingAttendees,
    meetingDurationMinutes: c.meetingDurationMinutes,
    callDirection: c.callDirection,
    callDurationMinutes: c.callDurationMinutes,
    source: c.source,
    createdAt: c.createdAt,
    tags: c.tags || [],
    investor: c.investor,
    deal: c.deal,
  }));

  // Transform investors for the modal
  const investorsForModal = (investorsList || []).map((inv) => ({
    id: inv.id,
    name: `${inv.firstName} ${inv.lastName}`,
    email: inv.email,
  }));

  // Use real investors if available, otherwise fall back to mock
  const displayInvestors = investorsForModal.length > 0 ? investorsForModal : mockInvestors;

  // Helper to determine if a communication is "sent" (to investor) or "received" (from investor)
  const isSentToInvestor = (comm: Communication): boolean => {
    if (comm.type === 'email') {
      // If emailTo matches investor email, it was sent TO the investor
      return comm.emailTo?.toLowerCase() === comm.investor.email.toLowerCase();
    }
    if (comm.type === 'phone_call') {
      // Outbound calls are "sent" to investor
      return comm.callDirection === 'outbound';
    }
    // Meetings are shown in both
    return true;
  };

  const filteredCommunications = communications.filter((c) => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (dealFilter && c.deal?.id !== dealFilter) return false;
    if (investorFilter && c.investor.id !== investorFilter) return false;
    if (tagFilter && !c.tags.includes(tagFilter)) return false;
    
    // Direction filter
    if (directionFilter !== 'all') {
      if (c.type === 'email' || c.type === 'phone_call') {
        const isSent = isSentToInvestor(c);
        if (directionFilter === 'sent' && !isSent) return false;
        if (directionFilter === 'received' && isSent) return false;
      }
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = c.title.toLowerCase().includes(query);
      const matchesContent = c.content?.toLowerCase().includes(query);
      const matchesInvestor = c.investor.name.toLowerCase().includes(query);
      const matchesDeal = c.deal?.name.toLowerCase().includes(query);
      if (!matchesTitle && !matchesContent && !matchesInvestor && !matchesDeal) return false;
    }
    return true;
  });

  // Count by direction
  const sentCount = communications.filter((c) => 
    c.type === 'email' || c.type === 'phone_call' ? isSentToInvestor(c) : true
  ).length;
  const receivedCount = communications.filter((c) => 
    c.type === 'email' || c.type === 'phone_call' ? !isSentToInvestor(c) : true
  ).length;

  const selectedCommunication = selectedId
    ? communications.find((c) => c.id === selectedId)
    : null;

  // Get unique tags from communications
  const availableTags = Array.from(
    new Set(communications.flatMap((c) => c.tags))
  );

  // Count by type
  const typeCounts = {
    all: communications.length,
    email: communications.filter((c) => c.type === 'email').length,
    meeting: communications.filter((c) => c.type === 'meeting').length,
    phone_call: communications.filter((c) => c.type === 'phone_call').length,
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setDirectionFilter('all');
    setDealFilter(null);
    setInvestorFilter(null);
    setTagFilter(null);
    setSearchQuery('');
    setSearchParams({});
  };

  const hasActiveFilters = typeFilter !== 'all' || directionFilter !== 'all' || dealFilter || investorFilter || tagFilter || searchQuery;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communications</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage all investor communications
          </p>
        </div>
        <Button onClick={() => setShowComposeModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Communication
        </Button>
      </div>

      {/* Compose Email Modal */}
      <ComposeEmailModal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        investors={displayInvestors}
        onSuccess={() => {
          // Refresh communications list
          queryClient.invalidateQueries({ queryKey: ['manager', 'communications'] });
        }}
      />

      {/* Direction Tabs (Sent/Received) */}
      <div className="flex items-center gap-2 border-b pb-3">
        {directionOptions.map((option) => {
          const Icon = option.icon;
          const count = option.id === 'all'
            ? communications.length
            : option.id === 'sent'
            ? sentCount
            : receivedCount;
          
          return (
            <button
              key={option.id}
              onClick={() => setDirectionFilter(option.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-3',
                directionFilter === option.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {option.label}
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                directionFilter === option.id
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            Total
          </div>
          <p className="mt-1 text-2xl font-bold">{typeCounts.all}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 text-blue-600" />
            Emails
          </div>
          <p className="mt-1 text-2xl font-bold">{typeCounts.email}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Video className="h-4 w-4 text-purple-600" />
            Meetings
          </div>
          <p className="mt-1 text-2xl font-bold">{typeCounts.meeting}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 text-green-600" />
            Calls
          </div>
          <p className="mt-1 text-2xl font-bold">{typeCounts.phone_call}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search communications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border bg-card pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Type Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setTypeFilter(option.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                  typeFilter === option.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {option.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs',
                    typeFilter === option.id
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-background'
                  )}
                >
                  {typeCounts[option.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Advanced Filters Row */}
        <div className="flex flex-wrap gap-3">
          {/* Deal Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <select
              value={dealFilter || ''}
              onChange={(e) => setDealFilter(e.target.value || null)}
              className="rounded-lg border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Deals</option>
              {mockDeals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.name}
                </option>
              ))}
            </select>
          </div>

          {/* Investor Filter */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <select
              value={investorFilter || ''}
              onChange={(e) => setInvestorFilter(e.target.value || null)}
              className="rounded-lg border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Investors</option>
              {mockInvestors.map((investor) => (
                <option key={investor.id} value={investor.id}>
                  {investor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <select
              value={tagFilter || ''}
              onChange={(e) => setTagFilter(e.target.value || null)}
              className="rounded-lg border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Communications List & Detail Panel */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* List */}
        <div
          className={cn(
            'lg:col-span-2 rounded-xl border bg-card overflow-hidden',
            selectedCommunication && 'hidden lg:block'
          )}
        >
          {filteredCommunications.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 font-semibold">No communications found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'No communications yet'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="max-h-[calc(100vh-420px)] overflow-y-auto">
              {filteredCommunications.map((communication) => (
                <CommunicationRow
                  key={communication.id}
                  communication={communication}
                  isSelected={selectedId === communication.id}
                  onClick={() => setSelectedId(communication.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div
          className={cn(
            'lg:col-span-3 rounded-xl border bg-card overflow-hidden',
            !selectedCommunication && 'hidden lg:flex lg:items-center lg:justify-center'
          )}
        >
          {selectedCommunication ? (
            <CommunicationDetail
              communication={selectedCommunication}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">
                Select a communication to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

