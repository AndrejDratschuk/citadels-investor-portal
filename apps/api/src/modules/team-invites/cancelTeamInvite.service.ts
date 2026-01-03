import { supabaseAdmin } from '../../common/database/supabase';
import { calculateTokenExpiry } from './generateInviteToken';

/**
 * Cancel a pending invite - Operator
 * Bubbles errors up (no try/catch)
 */
export async function cancelTeamInvite(
  inviteId: string,
  fundId: string,
  timestamp: Date
): Promise<void> {
  const { data: invite, error: fetchError } = await supabaseAdmin
    .from('team_invites')
    .select('id, fund_id, status')
    .eq('id', inviteId)
    .single();

  if (fetchError || !invite) {
    throw new Error('Invite not found');
  }

  if (invite.fund_id !== fundId) {
    throw new Error('Invite does not belong to this fund');
  }

  if (invite.status !== 'pending') {
    throw new Error('Only pending invites can be cancelled');
  }

  const { error: updateError } = await supabaseAdmin
    .from('team_invites')
    .update({
      status: 'cancelled',
      updated_at: timestamp.toISOString(),
    })
    .eq('id', inviteId);

  if (updateError) {
    throw new Error(`Failed to cancel invite: ${updateError.message}`);
  }
}

/**
 * Resend an invite - Operator
 * Resets the expiration and returns the invite for email sending
 */
export async function resendTeamInvite(
  inviteId: string,
  fundId: string,
  timestamp: Date
): Promise<{ email: string; fundName: string; token: string }> {
  const { data: invite, error: fetchError } = await supabaseAdmin
    .from('team_invites')
    .select(`
      id, email, token, fund_id, status,
      fund:funds(name)
    `)
    .eq('id', inviteId)
    .single();

  if (fetchError || !invite) {
    throw new Error('Invite not found');
  }

  if (invite.fund_id !== fundId) {
    throw new Error('Invite does not belong to this fund');
  }

  if (invite.status !== 'pending') {
    throw new Error('Only pending invites can be resent');
  }

  // Reset expiration
  const newExpiresAt = calculateTokenExpiry(timestamp, 7);

  const { error: updateError } = await supabaseAdmin
    .from('team_invites')
    .update({
      expires_at: newExpiresAt.toISOString(),
      updated_at: timestamp.toISOString(),
    })
    .eq('id', inviteId);

  if (updateError) {
    throw new Error(`Failed to update invite: ${updateError.message}`);
  }

  return {
    email: invite.email,
    fundName: invite.fund?.name || 'Unknown Fund',
    token: invite.token,
  };
}

/**
 * Update a team member's role - Operator
 */
export async function updateTeamMemberRole(
  userId: string,
  fundId: string,
  newRole: string
): Promise<void> {
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('id, fund_id')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    throw new Error('User not found');
  }

  if (user.fund_id !== fundId) {
    throw new Error('User is not a member of this fund');
  }

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to update role: ${updateError.message}`);
  }
}

/**
 * Remove a team member from the fund - Operator
 */
export async function removeTeamMember(
  userId: string,
  fundId: string
): Promise<void> {
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('id, fund_id')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    throw new Error('User not found');
  }

  if (user.fund_id !== fundId) {
    throw new Error('User is not a member of this fund');
  }

  // Remove from fund by setting fund_id to null
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ fund_id: null })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to remove member: ${updateError.message}`);
  }
}

