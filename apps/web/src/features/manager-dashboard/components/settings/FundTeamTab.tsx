import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { teamInvitesApi } from '@/lib/api/teamInvites';
import { TeamMembersList } from './TeamMembersList';
import { PendingInvitesList } from './PendingInvitesList';
import { InviteMemberModal } from './InviteMemberModal';
import type { TeamMember, TeamInvite, TeamRole, CreateTeamInviteInput } from '@altsui/shared';

export function FundTeamTab(): JSX.Element {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  
  // Action states
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  
  // Toast/notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTeam = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await teamInvitesApi.listTeam();
      setMembers(data.members);
      setInvites(data.pendingInvites);
    } catch (err) {
      console.error('Failed to fetch team:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleCreateInvite = async (data: CreateTeamInviteInput): Promise<void> => {
    setInviteLoading(true);
    setInviteError(null);
    try {
      await teamInvitesApi.createInvite(data);
      setShowInviteModal(false);
      await fetchTeam();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite');
      throw err;
    } finally {
      setInviteLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string): void => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleResendInvite = async (inviteId: string): Promise<void> => {
    setResendingId(inviteId);
    try {
      await teamInvitesApi.resendInvite(inviteId);
      showToast('success', 'Invite email sent successfully!');
      await fetchTeam();
    } catch (err) {
      console.error('Failed to resend invite:', err);
      showToast('error', err instanceof Error ? err.message : 'Failed to send invite email');
    } finally {
      setResendingId(null);
    }
  };

  const handleCancelInvite = async (inviteId: string): Promise<void> => {
    if (!confirm('Are you sure you want to cancel this invite?')) return;
    
    setCancelingId(inviteId);
    try {
      await teamInvitesApi.cancelInvite(inviteId);
      await fetchTeam();
    } catch (err) {
      console.error('Failed to cancel invite:', err);
    } finally {
      setCancelingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: TeamRole): Promise<void> => {
    try {
      await teamInvitesApi.updateMemberRole(userId, newRole);
      await fetchTeam();
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleRemoveMember = async (userId: string): Promise<void> => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    
    try {
      await teamInvitesApi.removeMember(userId);
      await fetchTeam();
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error}</p>
        <Button variant="outline" onClick={fetchTeam} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Members</h3>
        <Button onClick={() => setShowInviteModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <TeamMembersList
        members={members}
        onRoleChange={handleRoleChange}
        onRemove={handleRemoveMember}
        currentUserId={user?.id || ''}
      />

      <PendingInvitesList
        invites={invites}
        onResend={handleResendInvite}
        onCancel={handleCancelInvite}
        resendingId={resendingId}
        cancelingId={cancelingId}
      />

      <div className="rounded-xl border bg-muted/50 p-6 text-center">
        <Users className="mx-auto h-8 w-8 text-muted-foreground" />
        <h4 className="mt-2 font-medium">Role Permissions</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          Manager: Full access • Accountant: View + K-1s • Attorney: Documents only • Investor: Portfolio view
        </p>
      </div>

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteError(null);
        }}
        onSubmit={handleCreateInvite}
        isLoading={inviteLoading}
        error={inviteError}
      />
    </div>
  );
}

