import { useState } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Shield,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@flowveda/shared';
import { cn } from '@/lib/utils';

// Types
interface OnboardingApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  entityType: string;
  entityName?: string;
  taxResidency: string;
  taxIdType: string;
  taxIdLast4: string;
  accreditationType: string;
  commitmentAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

// Mock data
const mockApplications: OnboardingApplication[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    address: '123 Main Street',
    city: 'Austin',
    state: 'Texas',
    country: 'United States',
    entityType: 'individual',
    taxResidency: 'United States',
    taxIdType: 'ssn',
    taxIdLast4: '1234',
    accreditationType: 'income',
    commitmentAmount: 250000,
    status: 'pending',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '(555) 234-5678',
    address: '456 Oak Avenue',
    city: 'Dallas',
    state: 'Texas',
    country: 'United States',
    entityType: 'trust',
    entityName: 'Johnson Family Trust',
    taxResidency: 'United States',
    taxIdType: 'ein',
    taxIdLast4: '5678',
    accreditationType: 'net_worth',
    commitmentAmount: 500000,
    status: 'pending',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'mchen@company.com',
    phone: '(555) 345-6789',
    address: '789 Corporate Blvd',
    city: 'Houston',
    state: 'Texas',
    country: 'United States',
    entityType: 'llc',
    entityName: 'Chen Investments LLC',
    taxResidency: 'United States',
    taxIdType: 'ein',
    taxIdLast4: '9012',
    accreditationType: 'entity',
    commitmentAmount: 1000000,
    status: 'pending',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const accreditationLabels: Record<string, string> = {
  income: 'Income ($200k+ individual / $300k+ joint)',
  net_worth: 'Net Worth ($1M+ excluding primary residence)',
  professional: 'Licensed Professional',
  entity: 'Qualified Entity ($5M+ assets)',
};

const entityLabels: Record<string, string> = {
  individual: 'Individual',
  joint: 'Joint',
  trust: 'Trust',
  llc: 'LLC',
  corporation: 'Corporation',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function OnboardingQueue() {
  const [applications, setApplications] = useState(mockApplications);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleApprove = (id: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status: 'approved' as const } : app
      )
    );
    // TODO: Trigger n8n webhook for approval
    console.log('Approved application:', id);
  };

  const handleReject = (id: string) => {
    if (rejectingId === id && rejectionReason.trim()) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: 'rejected' as const } : app
        )
      );
      // TODO: Trigger n8n webhook for rejection
      console.log('Rejected application:', id, 'Reason:', rejectionReason);
      setRejectingId(null);
      setRejectionReason('');
    } else {
      setRejectingId(id);
    }
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investor Applications</h1>
          <p className="mt-1 text-muted-foreground">
            Review and approve new investor onboarding applications
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {applications.filter((a) => a.status === 'approved').length}
              </p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {applications.filter((a) => a.status === 'rejected').length}
              </p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Applications ({applications.length})</h2>
        </div>

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">No applications to review</p>
          </div>
        ) : (
          <div className="divide-y">
            {applications.map((app) => (
              <div key={app.id}>
                {/* Application Row */}
                <div
                  className={cn(
                    'flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-muted/50 transition-colors',
                    expandedId === app.id && 'bg-muted/30'
                  )}
                  onClick={() => toggleExpand(app.id)}
                >
                  <button className="shrink-0">
                    {expandedId === app.id ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                    {app.firstName[0]}{app.lastName[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {app.firstName} {app.lastName}
                      {app.entityName && (
                        <span className="text-muted-foreground font-normal">
                          {' '}({app.entityName})
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{app.email}</p>
                  </div>

                  <div className="hidden sm:block text-right">
                    <p className="font-medium">{formatCurrency(app.commitmentAmount)}</p>
                    <p className="text-xs text-muted-foreground">Commitment</p>
                  </div>

                  <div className="hidden md:block text-right">
                    <p className="text-sm text-muted-foreground">{formatTimeAgo(app.submittedAt)}</p>
                  </div>

                  <div>
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                        app.status === 'pending' && 'bg-amber-100 text-amber-700',
                        app.status === 'approved' && 'bg-green-100 text-green-700',
                        app.status === 'rejected' && 'bg-red-100 text-red-700'
                      )}
                    >
                      {app.status === 'pending' ? 'Pending' : app.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === app.id && (
                  <div className="border-t bg-muted/20 px-4 py-6">
                    <div className="ml-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Contact Info */}
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                          Contact Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {app.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {app.phone}
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>{app.address}, {app.city}, {app.state}, {app.country}</span>
                          </div>
                        </div>
                      </div>

                      {/* Entity Info */}
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                          Entity Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {entityLabels[app.entityType]}
                          </div>
                          {app.entityName && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {app.entityName}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tax Info */}
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                          Tax Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-muted-foreground">Residency:</span>{' '}
                            {app.taxResidency}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Tax ID:</span>{' '}
                            {app.taxIdType.toUpperCase()} ••••{app.taxIdLast4}
                          </p>
                        </div>
                      </div>

                      {/* Investment Info */}
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                          Investment Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            {formatCurrency(app.commitmentAmount)}
                          </div>
                          <div className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>{accreditationLabels[app.accreditationType]}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {app.status === 'pending' && (
                      <div className="ml-10 mt-6 pt-4 border-t">
                        {rejectingId === app.id ? (
                          <div className="space-y-3">
                            <p className="text-sm font-medium">Rejection Reason</p>
                            <Input
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Enter reason for rejection..."
                              className="max-w-md"
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(app.id)}
                                disabled={!rejectionReason.trim()}
                              >
                                Confirm Rejection
                              </Button>
                              <Button variant="outline" size="sm" onClick={cancelReject}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApprove(app.id)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve & Send Contract
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(app.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {app.status === 'approved' && (
                      <div className="ml-10 mt-6 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Application approved. Contract sent via DocuSign.
                        </div>
                      </div>
                    )}

                    {app.status === 'rejected' && (
                      <div className="ml-10 mt-6 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <XCircle className="h-4 w-4" />
                          Application rejected.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


