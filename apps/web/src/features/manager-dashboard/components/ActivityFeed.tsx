import { cn } from '@/lib/utils';
import {
  UserPlus,
  FileSignature,
  DollarSign,
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'investor_signup' | 'document_signed' | 'wire_received' | 'document_sent' | 'deal_created' | 'capital_call_sent';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'warning';
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

const activityIcons = {
  investor_signup: UserPlus,
  document_signed: FileSignature,
  wire_received: DollarSign,
  document_sent: FileText,
  deal_created: Building2,
  capital_call_sent: DollarSign,
};

const activityColors = {
  investor_signup: 'bg-blue-100 text-blue-600',
  document_signed: 'bg-green-100 text-green-600',
  wire_received: 'bg-emerald-100 text-emerald-600',
  document_sent: 'bg-purple-100 text-purple-600',
  deal_created: 'bg-indigo-100 text-indigo-600',
  capital_call_sent: 'bg-orange-100 text-orange-600',
};

const statusIcons = {
  success: CheckCircle2,
  pending: Clock,
  warning: AlertCircle,
};

const statusColors = {
  success: 'text-green-500',
  pending: 'text-yellow-500',
  warning: 'text-red-500',
};

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className={cn('rounded-xl border bg-card p-6', className)}>
        <h3 className="font-semibold">Recent Activity</h3>
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      <h3 className="font-semibold">Recent Activity</h3>
      <div className="mt-4 space-y-4">
        {activities.map((activity, index) => {
          const Icon = activityIcons[activity.type];
          const StatusIcon = activity.status ? statusIcons[activity.status] : null;

          return (
            <div
              key={activity.id}
              className={cn(
                'flex items-start gap-4',
                index !== activities.length - 1 && 'pb-4 border-b'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  activityColors[activity.type]
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{activity.title}</p>
                  {StatusIcon && (
                    <StatusIcon
                      className={cn('h-4 w-4 shrink-0', statusColors[activity.status!])}
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


