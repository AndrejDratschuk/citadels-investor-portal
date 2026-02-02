import { Mail, Phone, MapPin } from 'lucide-react';
import { formatDate } from '@altsui/shared';

interface InvestorAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface OverviewTabProps {
  investor: {
    email: string;
    phone?: string | null;
    address?: InvestorAddress | null;
    entityType?: string | null;
    accreditationType?: string | null;
    accreditationDate?: string | null;
    createdAt: string;
  };
}

function formatAddressLine(address: InvestorAddress): string {
  const parts = [address.city, address.state, address.zip].filter(Boolean);
  return parts.join(', ');
}

export function OverviewTab({ investor }: OverviewTabProps): JSX.Element {
  return (
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
                {investor.address.street && <p>{investor.address.street}</p>}
                <p>{formatAddressLine(investor.address)}</p>
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
            <span className="capitalize">{investor.entityType || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Accreditation Type</span>
            <span className="capitalize">
              {investor.accreditationType?.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Accredited Since</span>
            <span>{investor.accreditationDate ? formatDate(investor.accreditationDate) : '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Member Since</span>
            <span>{formatDate(investor.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
