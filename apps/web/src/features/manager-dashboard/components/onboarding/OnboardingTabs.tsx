import { ClipboardCheck, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OnboardingTabType } from './types';

interface OnboardingTabsProps {
  activeTab: OnboardingTabType;
  onTabChange: (tab: OnboardingTabType) => void;
  kycPendingCount: number;
  investorPendingCount: number;
}

export function OnboardingTabs({
  activeTab,
  onTabChange,
  kycPendingCount,
  investorPendingCount,
}: OnboardingTabsProps) {
  return (
    <div className="flex gap-2 border-b">
      <button
        onClick={() => onTabChange('kyc')}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
          activeTab === 'kyc'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        )}
      >
        <ClipboardCheck className="h-4 w-4" />
        KYC Pre-Qualification
        {kycPendingCount > 0 && (
          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {kycPendingCount}
          </span>
        )}
      </button>
      <button
        onClick={() => onTabChange('investor')}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
          activeTab === 'investor'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        )}
      >
        <UserCheck className="h-4 w-4" />
        Investor Applications
        {investorPendingCount > 0 && (
          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {investorPendingCount}
          </span>
        )}
      </button>
    </div>
  );
}

