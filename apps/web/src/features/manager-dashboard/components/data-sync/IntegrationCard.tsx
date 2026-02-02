/**
 * IntegrationCard Component
 * Displays a single data integration provider card with connection status
 */

import { Button } from '@/components/ui/button';
import { RefreshCw, Settings, Trash2 } from 'lucide-react';
import type { DataConnection } from '@altsui/shared';

// ============================================
// Types
// ============================================
export interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  connections: DataConnection[];
  comingSoon?: boolean;
  onConnect: () => void;
  onManage?: (connection: DataConnection) => void;
  onSync?: (connection: DataConnection) => void;
  onDisconnect?: (connection: DataConnection) => void;
}

// ============================================
// Helper Functions
// ============================================
function formatLastSync(lastSyncedAt: string | null): string {
  if (!lastSyncedAt) return 'Never synced';

  const date = new Date(lastSyncedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function getSyncStatusStyles(status: string): string {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-600 border-green-200';
    case 'syncing':
      return 'bg-blue-100 text-blue-600 border-blue-200';
    case 'error':
      return 'bg-red-100 text-red-600 border-red-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

// ============================================
// Component
// ============================================
export function IntegrationCard({
  title,
  description,
  icon,
  connected,
  connections,
  comingSoon = false,
  onConnect,
  onManage,
  onSync,
  onDisconnect,
}: IntegrationCardProps): JSX.Element {
  if (comingSoon) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-6 opacity-60">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                Coming Soon
              </span>
            </div>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="outline" disabled>
            Connect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              {connected && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600">
                  Connected
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {connected && connections.length > 0 ? (
          <div className="space-y-3">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{connection.name}</div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    {connection.googleEmail && (
                      <>
                        <span className="truncate max-w-[180px]">{connection.googleEmail}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{formatLastSync(connection.lastSyncedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getSyncStatusStyles(connection.syncStatus)}`}
                    >
                      {connection.syncStatus}
                    </span>
                    {connection.syncEnabled && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                        Auto: {connection.syncFrequency}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {onSync && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSync(connection)}
                      disabled={connection.syncStatus === 'syncing'}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${connection.syncStatus === 'syncing' ? 'animate-spin' : ''}`}
                      />
                    </Button>
                  )}
                  {onManage && (
                    <Button variant="outline" size="sm" onClick={() => onManage(connection)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                  {onDisconnect && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:border-red-200"
                      onClick={() => onDisconnect(connection)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={onConnect} className="w-full">
              Add Another Connection
            </Button>
          </div>
        ) : (
          <Button onClick={onConnect}>{connected ? 'Reconnect' : 'Connect'}</Button>
        )}
      </div>
    </div>
  );
}
