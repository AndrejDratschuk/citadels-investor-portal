import { supabaseAdmin } from '../../common/database/supabase';
import type { TeamMember, TeamInvite, TeamRole, ListTeamMembersResponse } from '@altsui/shared';

/**
 * List all team members and pending invites for a fund - Operator
 * Bubbles errors up (no try/catch)
 */
export async function listTeamMembers(fundId: string): Promise<ListTeamMembersResponse> {
  // Get team members (users with this fund_id and non-investor roles)
  const { data: membersData, error: membersError } = await supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, role, fund_id, created_at')
    .eq('fund_id', fundId)
    .in('role', ['manager', 'accountant', 'attorney']);

  if (membersError) {
    throw new Error(`Failed to fetch team members: ${membersError.message}`);
  }

  // Get pending invites
  const { data: invitesData, error: invitesError } = await supabaseAdmin
    .from('team_invites')
    .select('*')
    .eq('fund_id', fundId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (invitesError) {
    throw new Error(`Failed to fetch invites: ${invitesError.message}`);
  }

  const members: TeamMember[] = (membersData || []).map((user) => ({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role as TeamRole,
    fundId: user.fund_id,
    joinedAt: user.created_at,
  }));

  const pendingInvites: TeamInvite[] = (invitesData || []).map((invite) => ({
    id: invite.id,
    email: invite.email,
    fundId: invite.fund_id,
    role: invite.role as TeamRole,
    token: invite.token,
    status: invite.status,
    invitedByUserId: invite.invited_by_user_id,
    expiresAt: invite.expires_at,
    acceptedAt: invite.accepted_at,
    createdAt: invite.created_at,
  }));

  return { members, pendingInvites };
}

/**
 * Get a single invite by ID - Operator
 */
export async function getInviteById(inviteId: string): Promise<TeamInvite | null> {
  const { data, error } = await supabaseAdmin
    .from('team_invites')
    .select('*')
    .eq('id', inviteId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    fundId: data.fund_id,
    role: data.role as TeamRole,
    token: data.token,
    status: data.status,
    invitedByUserId: data.invited_by_user_id,
    expiresAt: data.expires_at,
    acceptedAt: data.accepted_at,
    createdAt: data.created_at,
  };
}

/**
 * Verify an invite token - Operator
 */
export async function verifyInviteToken(
  token: string,
  timestamp: Date
): Promise<{
  valid: boolean;
  invite?: TeamInvite & { fundName: string; invitedByName: string };
  isExistingUser?: boolean;
  error?: string;
}> {
  const { data, error } = await supabaseAdmin
    .from('team_invites')
    .select(`
      *,
      fund:funds(name),
      inviter:users!invited_by_user_id(first_name, last_name, email)
    `)
    .eq('token', token)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid invite token' };
  }

  // Check if expired
  if (new Date(data.expires_at) < timestamp) {
    return { valid: false, error: 'Invite has expired' };
  }

  // Check if already used
  if (data.status !== 'pending') {
    return { valid: false, error: 'Invite has already been used or cancelled' };
  }

  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', data.email)
    .single();

  const inviterName = data.inviter?.first_name && data.inviter?.last_name
    ? `${data.inviter.first_name} ${data.inviter.last_name}`
    : data.inviter?.email || 'A team member';

  return {
    valid: true,
    invite: {
      id: data.id,
      email: data.email,
      fundId: data.fund_id,
      fundName: data.fund?.name || 'Unknown Fund',
      role: data.role as TeamRole,
      token: data.token,
      status: data.status,
      invitedByUserId: data.invited_by_user_id,
      invitedByName: inviterName,
      expiresAt: data.expires_at,
      acceptedAt: data.accepted_at,
      createdAt: data.created_at,
    },
    isExistingUser: !!existingUser,
  };
}

