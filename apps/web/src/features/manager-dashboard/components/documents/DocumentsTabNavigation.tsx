import { FolderOpen, Briefcase, Building2, Users, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TabType } from './types';

interface DocumentsTabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingValidationCount?: number;
}

export function DocumentsTabNavigation({ activeTab, onTabChange, pendingValidationCount = 0 }: DocumentsTabNavigationProps) {
  const tabs: { id: TabType; label: string; icon: typeof FolderOpen; badge?: number }[] = [
    { id: 'all', label: 'All Documents', icon: FolderOpen },
    { id: 'fund', label: 'Fund Documents', icon: Briefcase },
    { id: 'by-deal', label: 'Deal Documents', icon: Building2 },
    { id: 'by-investor', label: 'Investor Documents', icon: Users },
    { id: 'validation', label: 'Validation Queue', icon: FileCheck, badge: pendingValidationCount },
  ];

  return (
    <div className="flex gap-1 border-b">
      {tabs.map(({ id, label, icon: Icon, badge }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === id
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
          {badge !== undefined && badge > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-500 px-1.5 text-xs font-semibold text-white">
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

