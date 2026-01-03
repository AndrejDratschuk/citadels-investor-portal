import { supabaseAdmin } from '../../common/database/supabase';
import { verifyInviteToken } from './listTeamInvites.service';
import type { AcceptTeamInviteInput, TeamRole } from '@altsui/shared';

interface AcceptInviteResult {
  user: {
    id: string;
    email: string;
    role: TeamRole;
    fundId: string;
  };
  accessToken: string;
  refreshToken: string;
  isExistingUser: boolean;
}

interface AcceptTeamInviteParams {
  input: AcceptTeamInviteInput;
  timestamp: Date;
}

/**
 * Accept a team invite - Operator
 * Creates user account if new, or adds existing user to fund
 * Bubbles errors up (no try/catch)
 */
export async function acceptTeamInvite({
  input,
  timestamp,
}: AcceptTeamInviteParams): Promise<AcceptInviteResult> {
  // Verify the token
  const verification = await verifyInviteToken(input.token, timestamp);

  if (!verification.valid || !verification.invite) {
    throw new Error(verification.error || 'Invalid invite');
  }

  const { invite, isExistingUser } = verification;

  let userId: string;
  let accessToken = '';
  let refreshToken = '';

  if (isExistingUser) {
    // Existing user - update their fund_id and role
    const { data: existingUser, error: userFetchError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', invite.email)
      .single();

    if (userFetchError || !existingUser) {
      throw new Error('Failed to find existing user');
    }

    userId = existingUser.id;

    // Update user's fund, role, and mark onboarding as complete
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        fund_id: invite.fundId,
        role: invite.role,
        onboarding_completed: true,
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`);
    }

    // If role is investor, check if they need an investors record
    if (invite.role === 'investor') {
      // Check if they already have an investor record for this fund
      const { data: existingInvestor } = await supabaseAdmin
        .from('investors')
        .select('id')
        .eq('user_id', userId)
        .eq('fund_id', invite.fundId)
        .single();

      if (!existingInvestor) {
        // Get user's name for the investor record
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('first_name, last_name')
          .eq('id', userId)
          .single();

        const { error: investorError } = await supabaseAdmin
          .from('investors')
          .insert({
            user_id: userId,
            fund_id: invite.fundId,
            first_name: userData?.first_name || '',
            last_name: userData?.last_name || '',
            email: invite.email,
            status: 'active',
          });

        if (investorError) {
          console.error('Failed to create investor record for existing user:', investorError);
          // Don't throw - user is already updated, they can be added to investors later
        }
      }
    }

    // Existing users don't get tokens - they need to log in separately
    // accessToken and refreshToken remain empty strings
  } else {
    // New user - create account
    if (!input.password || !input.firstName || !input.lastName) {
      throw new Error('Password, first name, and last name are required for new users');
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invite.email,
      password: input.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create user: ${authError?.message || 'Unknown error'}`);
    }

    userId = authData.user.id;

    // Create user record
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: invite.email,
        role: invite.role,
        fund_id: invite.fundId,
        first_name: input.firstName,
        last_name: input.lastName,
        onboarding_completed: true, // They're joining an existing fund
      });

    if (userError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create user record: ${userError.message}`);
    }

    // If role is investor, also create an investors record
    // This is needed for RLS policies on investments, documents, etc.
    if (invite.role === 'investor') {
      const { error: investorError } = await supabaseAdmin
        .from('investors')
        .insert({
          user_id: userId,
          fund_id: invite.fundId,
          first_name: input.firstName,
          last_name: input.lastName,
          email: invite.email,
          status: 'active',
        });

      if (investorError) {
        // Rollback: delete user record and auth user
        await supabaseAdmin.from('users').delete().eq('id', userId);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        throw new Error(`Failed to create investor record: ${investorError.message}`);
      }
    }

    // Sign in to get tokens
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: invite.email,
      password: input.password,
    });

    if (signInError || !signInData.session) {
      throw new Error(`Failed to sign in: ${signInError?.message || 'Unknown error'}`);
    }

    accessToken = signInData.session.access_token;
    refreshToken = signInData.session.refresh_token;
  }

  // Mark invite as accepted
  const { error: inviteUpdateError } = await supabaseAdmin
    .from('team_invites')
    .update({
      status: 'accepted',
      accepted_at: timestamp.toISOString(),
    })
    .eq('token', input.token);

  if (inviteUpdateError) {
    console.error('Failed to update invite status:', inviteUpdateError);
    // Don't throw - user is already created
  }

  return {
    user: {
      id: userId,
      email: invite.email,
      role: invite.role,
      fundId: invite.fundId,
    },
    accessToken,
    refreshToken,
    isExistingUser: !!isExistingUser,
  };
}

