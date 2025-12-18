import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Zap, UserPlus, DollarSign, Building2, FileUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const quickActions = [
  {
    label: 'Add Investor',
    href: '/manager/investors/new',
    icon: UserPlus,
    description: 'Onboard a new investor',
  },
  {
    label: 'Create Capital Call',
    href: '/manager/capital-calls/new',
    icon: DollarSign,
    description: 'Request capital from investors',
  },
  {
    label: 'Add Deal',
    href: '/manager/deals/new',
    icon: Building2,
    description: 'Add a new property deal',
  },
  {
    label: 'Upload Document',
    href: '/manager/documents?upload=true',
    icon: FileUp,
    description: 'Upload investor documents',
  },
];

export function Header() {
  const { user, logout } = useAuth();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const isManager = user?.role === 'manager';

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Investor Portal</h2>
      </div>
      <div className="flex items-center gap-2">
        {/* Quick Actions - Manager Only */}
        {user && isManager && (
          <HoverCard open={quickActionsOpen} onOpenChange={setQuickActionsOpen} openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full text-amber-500 hover:bg-amber-500/10 hover:text-amber-500"
              >
                <Zap className="h-5 w-5" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent align="end" className="w-72 p-2" sideOffset={8}>
              <div className="mb-2 px-2 py-1.5">
                <p className="text-sm font-semibold">Quick Actions</p>
                <p className="text-xs text-muted-foreground">Shortcuts to common tasks</p>
              </div>
              <div className="space-y-1">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    to={action.href}
                    onClick={() => setQuickActionsOpen(false)}
                    className="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <action.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </HoverCardContent>
          </HoverCard>
        )}

        {/* Profile Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

