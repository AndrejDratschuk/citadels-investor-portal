import { supabaseAdmin } from '../../common/database/supabase';
import { SignupInput, LoginInput, USER_ROLES } from '@flowveda/shared';
import { User } from '@flowveda/shared';

// Default fund ID for new investors (created by seed data)
const DEFAULT_FUND_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export class AuthService {
  async signup(input: SignupInput) {
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true, // Auto-confirm for now
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create user');
    }

    // For investors, assign to default fund if no fund specified
    const fundId = input.fundId || (input.role === USER_ROLES.INVESTOR ? DEFAULT_FUND_ID : null);

    // Create user record in database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: input.email,
        role: input.role,
        fund_id: fundId,
      })
      .select()
      .single();

    if (userError || !userData) {
      // Rollback: delete auth user if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(userError?.message || 'Failed to create user record');
    }

    // If user is an investor, create an investor record
    if (input.role === USER_ROLES.INVESTOR && fundId) {
      const { error: investorError } = await supabaseAdmin
        .from('investors')
        .insert({
          user_id: authData.user.id,
          fund_id: fundId,
          first_name: input.firstName || 'New',
          last_name: input.lastName || 'Investor',
          email: input.email,
          commitment_amount: 0,
          total_called: 0,
          total_invested: 0,
          accreditation_status: 'pending',
          status: 'onboarding',
        });

      if (investorError) {
        console.error('Failed to create investor record:', investorError);
        // Don't rollback - user can still login, investor record can be created later
      }
    }

    return {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      fundId: userData.fund_id,
      createdAt: userData.created_at,
    };
  }

  async login(input: LoginInput) {
    // Use admin client but create a regular session
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user || !data.session) {
      throw new Error(error?.message || 'Invalid credentials');
    }

    // Get user role from database
    console.log('Looking for user with ID:', data.user.id);
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, fund_id, created_at')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      console.error('Database error fetching user:', userError);
    }
    
    if (!userData) {
      console.error('User data is null for ID:', data.user.id);
    }

    if (userError || !userData) {
      throw new Error('User not found');
    }

    return {
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        fundId: userData.fund_id,
        createdAt: userData.created_at,
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async getCurrentUser(accessToken: string): Promise<User> {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !user) {
      throw new Error('Invalid token');
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, fund_id, created_at')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      throw new Error('User not found');
    }

    return {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      fundId: userData.fund_id,
      createdAt: userData.created_at,
    };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new Error(error?.message || 'Failed to refresh token');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async logout(accessToken: string) {
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (user) {
      await supabaseAdmin.auth.admin.signOut(user.id);
    }

    return { success: true };
  }
}

