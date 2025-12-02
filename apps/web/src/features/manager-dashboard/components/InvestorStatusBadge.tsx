import { cn } from '@/lib/utils';

type InvestorStatus = 'prospect' | 'onboarding' | 'active' | 'inactive';
type AccreditationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

interface StatusBadgeProps {
  status: InvestorStatus | AccreditationStatus;
  type?: 'investor' | 'accreditation';
  className?: string;
}

const investorStatusStyles: Record<InvestorStatus, string> = {
  prospect: 'bg-gray-100 text-gray-700 border-gray-200',
  onboarding: 'bg-blue-50 text-blue-700 border-blue-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  inactive: 'bg-red-50 text-red-700 border-red-200',
};

const accreditationStatusStyles: Record<AccreditationStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  expired: 'bg-orange-50 text-orange-700 border-orange-200',
};

export function InvestorStatusBadge({
  status,
  type = 'investor',
  className,
}: StatusBadgeProps) {
  const styles =
    type === 'investor'
      ? investorStatusStyles[status as InvestorStatus]
      : accreditationStatusStyles[status as AccreditationStatus];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        styles,
        className
      )}
    >
      {status}
    </span>
  );
}


