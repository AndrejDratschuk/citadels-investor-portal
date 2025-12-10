import { cn } from '@/lib/utils';
import { FileText, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export interface K1ActivityItem {
  id: string;
  type: 'generated' | 'sent' | 'viewed' | 'error';
  investorName: string;
  description: string;
  timestamp: string;
}

interface K1ActivityFeedProps {
  activities: K1ActivityItem[];
  className?: string;
}

const activityConfig = {
  generated: {
    icon: FileText,
    className: 'bg-emerald-100 text-emerald-600',
  },
  sent: {
    icon: Send,
    className: 'bg-blue-100 text-blue-600',
  },
  viewed: {
    icon: CheckCircle2,
    className: 'bg-purple-100 text-purple-600',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-100 text-red-600',
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

export function K1ActivityFeed({ activities, className }: K1ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className={cn('rounded-xl border bg-card p-6', className)}>
        <h3 className="font-semibold">Recent K-1 Activity</h3>
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No recent K-1 activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      <h3 className="font-semibold">Recent K-1 Activity</h3>
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












