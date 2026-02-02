import { Clock } from 'lucide-react';
import { formatDate } from '@altsui/shared';
import { cn } from '@/lib/utils';
import type { MockActivity } from './investorDetailMockData';

interface ActivityTabProps {
  activities: MockActivity[];
}

export function ActivityTab({ activities }: ActivityTabProps): JSX.Element {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="space-y-4">
        {activities.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'flex items-start gap-4',
              index !== activities.length - 1 && 'pb-4 border-b'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{item.description}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(item.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
