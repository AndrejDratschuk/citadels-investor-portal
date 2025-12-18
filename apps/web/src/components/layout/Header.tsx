import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  User, 
  Zap, 
  UserPlus, 
  DollarSign, 
  Building2, 
  FileUp, 
  Bell,
  UserCheck,
  FileText,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { notificationsApi, Notification, getNotificationLink, getNotificationIconType } from '@/lib/api/notifications';
import { formatDistanceToNow } from 'date-fns';

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

// Map notification icon types to actual icons
const notificationIcons = {
  user: UserPlus,
  building: Building2,
  dollar: DollarSign,
  file: FileText,
  message: MessageSquare,
  check: UserCheck,
};

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const isManager = user?.role === 'manager';

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const [notifs, count] = await Promise.all([
        notificationsApi.getAll({ limit: 20 }),
        notificationsApi.getUnreadCount(),
      ]);
      console.log('[Header] Fetched notifications:', notifs.length, 'unread:', count);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('[Header] Failed to fetch notifications:', error);
    }
  }, [user]);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate to related entity
    const link = getNotificationLink(notification, user?.role);
    if (link) {
      setNotificationsOpen(false);
      navigate(link);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Get icon for notification
  const getNotificationIcon = (type: string) => {
    const iconType = getNotificationIconType(type);
    return notificationIcons[iconType] || MessageSquare;
  };

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

        {/* Notifications Bell */}
        {user && (
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute bottom-1.5 right-1.5 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0" sideOffset={8}>
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <p className="font-semibold">Notifications</p>
                  {unreadCount > 0 && (
                    <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-2 text-sm font-medium text-muted-foreground">No notifications</p>
                    <p className="text-xs text-muted-foreground">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      
                      return (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted',
                            !notification.isRead && 'bg-primary/5'
                          )}
                        >
                          <div className={cn(
                            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
                            !notification.isRead ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn(
                                'text-sm',
                                !notification.isRead && 'font-medium'
                              )}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground/70">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
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

