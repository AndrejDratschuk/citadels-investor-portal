import { supabaseAdmin } from '../../common/database/supabase';
import { SignupInput, LoginInput } from '@flowveda/shared';
import { User } from '@flowveda/shared';

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

    // Create user record in database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: input.email,
        role: input.role,
        fund_id: input.fundId || null,
      })
      .select()
      .single();

    if (userError || !userData) {
      // Rollback: delete auth user if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(userError?.message || 'Failed to create user record');
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
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, fund_id, created_at')
      .eq('id', data.user.id)
      .single();

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

