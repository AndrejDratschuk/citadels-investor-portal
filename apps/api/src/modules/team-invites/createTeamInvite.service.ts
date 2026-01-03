import { supabaseAdmin } from '../../common/database/supabase';
import { calculateTokenExpiry } from './generateInviteToken';
import type { CreateTeamInviteInput, TeamInvite, TeamRole } from '@altsui/shared';

interface CreateTeamInviteParams {
  input: CreateTeamInviteInput;
  fundId: string;
  invitedByUserId: string;
  timestamp: Date;
  tokenGenerator: () => string;
}

/**
 * Create a new team invite - Operator (pure business logic)
 * Follows CODE_GUIDELINES.md: determinism via injected timestamp and tokenGenerator
 * Bubbles errors up (no try/catch)
 */
export async function createTeamInvite({
  input,
  fundId,
  invitedByUserId,
  timestamp,
  tokenGenerator,
}: CreateTeamInviteParams): Promise<TeamInvite> {
  // Check if email is already a member of this fund
  const { data: existingMember } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', input.email)
    .eq('fund_id', fundId)
    .single();

  if (existingMember) {
    throw new Error('This email is already a team member of this fund');
  }

  // Check if there's already a pending invite for this email + fund
  const { data: existingInvite } = await supabaseAdmin
    .from('team_invites')
    .select('id')
    .eq('email', input.email)
    .eq('fund_id', fundId)
    .eq('status', 'pending')
    .single();

  if (existingInvite) {
    throw new Error('A pending invite already exists for this email');
  }

  const token = tokenGenerator();
  const expiresAt = calculateTokenExpiry(timestamp, 7);

  const { data, error } = await supabaseAdmin
    .from('team_invites')
    .insert({
      email: input.email,
      fund_id: fundId,
      role: input.role,
      token,
      invited_by_user_id: invitedByUserId,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      created_at: timestamp.toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create invite: ${error.message}`);
  }

  return mapToTeamInvite(data);
}

function mapToTeamInvite(data: Record<string, unknown>): TeamInvite {
  return {
    id: data.id as string,
    email: data.email as string,
    fundId: data.fund_id as string,
    role: data.role as TeamRole,
    token: data.token as string,
    status: data.status as TeamInvite['status'],
    invitedByUserId: data.invited_by_user_id as string,
    expiresAt: data.expires_at as string,
    acceptedAt: (data.accepted_at as string) || null,
    createdAt: data.created_at as string,
  };
}

