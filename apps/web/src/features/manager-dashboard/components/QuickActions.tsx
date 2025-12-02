import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon, Plus, UserPlus, FileUp, DollarSign, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'secondary';
}

const defaultActions: QuickAction[] = [
  {
    label: 'Add Investor',
    href: '/manager/investors/new',
    icon: UserPlus,
    variant: 'primary',
  },
  {
    label: 'Create Capital Call',
    href: '/manager/capital-calls/new',
    icon: DollarSign,
  },
  {
    label: 'Add Deal',
    href: '/manager/deals/new',
    icon: Building2,
  },
  {
    label: 'Upload Document',
    href: '/manager/documents?upload=true',
    icon: FileUp,
  },
];

interface QuickActionsProps {
  actions?: QuickAction[];
  className?: string;
}

export function QuickActions({ actions = defaultActions, className }: QuickActionsProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      <h3 className="font-semibold">Quick Actions</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link key={action.href} to={action.href}>
            <Button
              variant={action.variant === 'primary' ? 'default' : 'outline'}
              className="w-full justify-start gap-2"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}


