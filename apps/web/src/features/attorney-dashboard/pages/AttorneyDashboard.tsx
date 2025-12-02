import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  FileSignature,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentStatsCard, SigningActivityFeed, SigningActivityItem } from '../components';
import { useDocumentStats } from '../hooks';

// Mock activity data - will be replaced with real data
const mockActivities: SigningActivityItem[] = [
  {
    id: '1',
    type: 'signed',
    investorName: 'John Smith',
    documentName: 'Subscription Agreement',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    type: 'viewed',
    investorName: 'Sarah Johnson Family Trust',
    documentName: 'Subscription Agreement',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    type: 'sent',
    investorName: 'Acme Holdings LLC',
    documentName: 'Subscription Agreement',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '4',
    type: 'declined',
    investorName: 'Tech Ventures Corp',
    documentName: 'Side Letter Agreement',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '5',
    type: 'reminded',
    investorName: 'Davis Capital Partners',
    documentName: 'Capital Call Notice',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

// Documents awaiting review
const documentsAwaitingReview = [
  { id: '1', name: 'Subscription Agreement - Tech Ventures', type: 'Subscription', daysOld: 2 },
  { id: '2', name: 'Side Letter - New Investor', type: 'Side Letter', daysOld: 1 },
  { id: '3', name: 'Amendment to Operating Agreement', type: 'Amendment', daysOld: 5 },
];

export function AttorneyDashboard() {
  const { data: stats, isLoading } = useDocumentStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Legal Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Document management and signing status
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DocumentStatsCard
          title="Total Documents"
          value={isLoading ? '...' : stats?.totalDocuments ?? 0}
          icon={FileText}
          description="All legal documents"
        />
        <DocumentStatsCard
          title="Pending Signatures"
          value={isLoading ? '...' : stats?.pendingSignatures ?? 0}
          icon={Clock}
          description="Awaiting signature"
        />
        <DocumentStatsCard
          title="Signed"
          value={isLoading ? '...' : stats?.signedDocuments ?? 0}
          icon={CheckCircle2}
          description="Completed signatures"
        />
        <DocumentStatsCard
          title="Declined"
          value={isLoading ? '...' : stats?.declinedDocuments ?? 0}
          icon={XCircle}
          description="Need attention"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/attorney/documents">
            <Button variant="default" className="w-full justify-start gap-2">
              <FileText className="h-4 w-4" />
              View Documents
            </Button>
          </Link>
          <Link to="/attorney/signing-status">
            <Button variant="outline" className="w-full justify-start gap-2">
              <FileSignature className="h-4 w-4" />
              Check Signing Status
            </Button>
          </Link>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Clock className="h-4 w-4" />
            Send Reminders
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Users className="h-4 w-4" />
            View Investors
          </Button>
        </div>
      </div>

      {/* Documents Awaiting Review */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Documents Awaiting Review</h2>
          <Link
            to="/attorney/documents"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {documentsAwaitingReview.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{doc.name}</p>
                  <p className="text-sm text-muted-foreground">{doc.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {doc.daysOld} day{doc.daysOld !== 1 ? 's' : ''} old
                </span>
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SigningActivityFeed activities={mockActivities} />
        </div>
        
        {/* Signing Summary */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold">Signing Summary</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total sent for signature</span>
              <span className="font-semibold">
                {isLoading ? '...' : (stats?.pendingSignatures ?? 0) + (stats?.signedDocuments ?? 0) + (stats?.declinedDocuments ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completion rate</span>
              <span className="font-semibold text-emerald-600">
                {isLoading
                  ? '...'
                  : stats
                  ? `${Math.round((stats.signedDocuments / (stats.pendingSignatures + stats.signedDocuments + stats.declinedDocuments || 1)) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{
                  width: isLoading
                    ? '0%'
                    : stats
                    ? `${Math.round((stats.signedDocuments / (stats.pendingSignatures + stats.signedDocuments + stats.declinedDocuments || 1)) * 100)}%`
                    : '0%',
                }}
              />
            </div>
            <Link
              to="/attorney/signing-status"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View signing status <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
