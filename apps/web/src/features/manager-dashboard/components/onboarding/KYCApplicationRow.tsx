import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KYCApplication, investorTypeLabels } from './types';
import { getKycDisplayName, getKycStatusLabel, formatTimeAgo } from './kycHelpers';

interface KYCApplicationRowProps {
  app: KYCApplication;
  isExpanded: boolean;
  onToggle: () => void;
}

export function KYCApplicationRow({ app, isExpanded, onToggle }: KYCApplicationRowProps) {
  const statusInfo = getKycStatusLabel(app.status);

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-muted/50 transition-colors',
        isExpanded && 'bg-muted/30'
      )}
      onClick={onToggle}
    >
      <button className="shrink-0">
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
        {(
          app.firstName?.[0] ||
          app.authorizedSignerFirstName?.[0] ||
          app.email[0]
        ).toUpperCase()}
        {(app.lastName?.[0] || app.authorizedSignerLastName?.[0] || '').toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium">{getKycDisplayName(app)}</p>
        <p className="text-sm text-muted-foreground truncate">{app.email}</p>
      </div>

      <div className="hidden sm:block text-right">
        <p className="text-sm font-medium capitalize">
          {app.investorCategory === 'entity' ? 'Entity' : 'Individual'}
        </p>
        <p className="text-xs text-muted-foreground">
          {investorTypeLabels[app.investorType] || app.investorType}
        </p>
      </div>

      <div className="hidden md:block text-right">
        <p className="text-sm text-muted-foreground">{formatTimeAgo(app.createdAt)}</p>
      </div>

      <div>
        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', statusInfo.color)}>
          {statusInfo.label}
        </span>
      </div>
    </div>
  );
}

