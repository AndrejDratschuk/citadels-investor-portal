import { cn } from '@/lib/utils';
import { Send, Eye, CheckCircle2, XCircle, Clock, Bell } from 'lucide-react';

export interface SigningActivityItem {
  id: string;
  type: 'sent' | 'viewed' | 'signed' | 'declined' | 'reminded';
  investorName: string;
  documentName: string;
  timestamp: string;
}

interface SigningActivityFeedProps {
  activities: SigningActivityItem[];
  className?: string;
}

const activityConfig = {
  sent: {
    icon: Send,
    label: 'Document sent',
    className: 'bg-blue-100 text-blue-600',
  },
  viewed: {
    icon: Eye,
    label: 'Document viewed',
    className: 'bg-purple-100 text-purple-600',
  },
  signed: {
    icon: CheckCircle2,
    label: 'Document signed',
    className: 'bg-emerald-100 text-emerald-600',
  },
  declined: {
    icon: XCircle,
    label: 'Signature declined',
    className: 'bg-red-100 text-red-600',
  },
  reminded: {
    icon: Bell,
    label: 'Reminder sent',
    className: 'bg-amber-100 text-amber-600',
  },
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

export function SigningActivityFeed({ activities, className }: SigningActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className={cn('rounded-xl border bg-card p-6', className)}>
        <h3 className="font-semibold">Recent Signing Activity</h3>
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      <h3 className="font-semibold">Recent Signing Activity</h3>
      <div className="mt-4 space-y-4">
        {activities.map((activity, index) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;

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
                  config.className
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{activity.investorName}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {config.label}: {activity.documentName}
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






