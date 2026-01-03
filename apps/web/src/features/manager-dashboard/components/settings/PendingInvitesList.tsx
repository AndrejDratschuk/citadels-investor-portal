import { Mail, RefreshCw, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import type { TeamInvite } from '@altsui/shared';

interface PendingInvitesListProps {
  invites: TeamInvite[];
  onResend: (inviteId: string) => void;
  onCancel: (inviteId: string) => void;
  resendingId: string | null;
  cancelingId: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  manager: 'Manager',
  accountant: 'Accountant',
  attorney: 'Attorney',
  investor: 'Investor',
};

export function PendingInvitesList({
  invites,
  onResend,
  onCancel,
  resendingId,
  cancelingId,
}: PendingInvitesListProps): JSX.Element {
  const pendingInvites = invites.filter(invite => invite.status === 'pending');

  if (pendingInvites.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <Mail className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No pending invites</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-muted-foreground">Pending Invites</h4>
      <div className="rounded-xl border bg-card divide-y">
        {pendingInvites.map((invite) => {
          const expiresAt = new Date(invite.expiresAt);
          const isExpired = expiresAt < new Date();
          const expiresIn = formatDistanceToNow(expiresAt, { addSuffix: true });

          return (
            <div
              key={invite.id}
              className="flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <Mail className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">{invite.email}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="capitalize">{ROLE_LABELS[invite.role] || invite.role}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {isExpired ? (
                        <span className="text-red-500">Expired</span>
                      ) : (
                        <span>Expires {expiresIn}</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResend(invite.id)}
                  disabled={resendingId === invite.id}
                >
                  <RefreshCw className={`mr-1 h-3 w-3 ${resendingId === invite.id ? 'animate-spin' : ''}`} />
                  Resend
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(invite.id)}
                  disabled={cancelingId === invite.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

