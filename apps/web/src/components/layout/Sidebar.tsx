import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@flowveda/shared';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  DollarSign,
  Receipt,
  Settings,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const investorNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/investor/dashboard', icon: LayoutDashboard },
  { title: 'Investments', href: '/investor/investments', icon: Building2 },
  { title: 'Documents', href: '/investor/documents', icon: FileText },
  { title: 'Profile', href: '/investor/profile', icon: Settings },
];

const managerNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
  { title: 'Investors', href: '/manager/investors', icon: Users },
  { title: 'Deals', href: '/manager/deals', icon: Building2 },
  { title: 'Capital Calls', href: '/manager/capital-calls', icon: DollarSign },
  { title: 'Documents', href: '/manager/documents', icon: FileText },
  { title: 'Reports', href: '/manager/reports', icon: Receipt },
  { title: 'Settings', href: '/manager/settings', icon: Settings },
];

const accountantNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/accountant/dashboard', icon: LayoutDashboard },
  { title: 'K-1 Management', href: '/accountant/k1', icon: Receipt },
  { title: 'Investors', href: '/accountant/investors', icon: Users },
];

const attorneyNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/attorney/dashboard', icon: LayoutDashboard },
  { title: 'Documents', href: '/attorney/documents', icon: FileText },
  { title: 'Signing Status', href: '/attorney/signing-status', icon: FileText },
];

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case USER_ROLES.INVESTOR:
      return investorNavItems;
    case USER_ROLES.MANAGER:
      return managerNavItems;
    case USER_ROLES.ACCOUNTANT:
      return accountantNavItems;
    case USER_ROLES.ATTORNEY:
      return attorneyNavItems;
    default:
      return [];
  }
}

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const navItems = user ? getNavItems(user.role) : [];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">FlowVeda</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

