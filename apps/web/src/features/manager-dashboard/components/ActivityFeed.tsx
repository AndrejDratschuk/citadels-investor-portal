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
  investor_signup: 'text-blue-500',
  document_signed: 'text-emerald-500',
  wire_received: 'text-green-500',
  document_sent: 'text-purple-500',
  deal_created: 'text-indigo-500',
  capital_call_sent: 'text-amber-500',
};

const statusIcons = {
  success: CheckCircle2,
  pending: Clock,
  warning: AlertCircle,
};

const statusColors = {
  success: 'text-emerald-500',
  pending: 'text-amber-500',
  warning: 'text-red-500',
};

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className={cn('rounded-xl border bg-card p-5', className)}>
        <h3 className="font-semibold">Activity</h3>
        <div className="mt-4 flex flex-col items-center justify-center py-6 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/30" />
          <p className="mt-2 text-xs text-muted-foreground">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card p-5', className)}>
      <h3 className="font-semibold mb-3">Activity</h3>
      <div className="space-y-1">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type];
          const StatusIcon = activity.status ? statusIcons[activity.status] : null;

          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className={cn('shrink-0', activityColors[activity.type])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{activity.description}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {StatusIcon && (
                  <StatusIcon className={cn('h-3 w-3', statusColors[activity.status!])} />
                )}
                <span className="text-[10px] text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


