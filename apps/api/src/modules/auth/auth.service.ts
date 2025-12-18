import { supabaseAdmin } from '../../common/database/supabase';
import { SignupInput, LoginInput, USER_ROLES } from '@flowveda/shared';
import { User } from '@flowveda/shared';
import { webhookService } from '../../common/services/webhook.service';

export class AuthService {
  async signup(input: SignupInput) {
    console.log('[AuthService.signup] Starting signup for:', input.email, 'role:', input.role);
    
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true, // Auto-confirm for now
    });

    if (authError || !authData.user) {
      console.error('[AuthService.signup] Failed to create auth user:', authError);
      throw new Error(authError?.message || 'Failed to create user');
    }

    console.log('[AuthService.signup] Auth user created:', authData.user.id);

    // For investors, find an existing fund or use the provided one
    let fundId = input.fundId;
    
    if (input.role === USER_ROLES.INVESTOR && !fundId) {
      // Try to find an existing fund to assign the investor to
      const { data: existingFund } = await supabaseAdmin
        .from('funds')
        .select('id')
        .limit(1)
        .single();
      
      if (existingFund) {
        fundId = existingFund.id;
        console.log('[AuthService.signup] Assigned investor to existing fund:', fundId);
      } else {
        console.log('[AuthService.signup] No fund found for investor - investor record will not be created');
      }
    }

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
      console.log('[AuthService.signup] Creating investor record for fund:', fundId);
      
      const { data: investorData, error: investorError } = await supabaseAdmin
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
        })
        .select()
        .single();

      if (investorError) {
        console.error('[AuthService.signup] Failed to create investor record:', investorError);
        // Don't rollback - user can still login, investor record can be created later
      } else if (investorData) {
        console.log('[AuthService.signup] Investor record created:', investorData.id);
        
        // Send webhook for new investor
        console.log('[AuthService.signup] Sending investor.created webhook...');
        webhookService.sendWebhook('investor.created', {
          id: investorData.id,
          email: input.email,
          firstName: input.firstName || 'New',
          lastName: input.lastName || 'Investor',
          fundId: fundId,
          source: 'signup',
        });
      }
    } else {
      console.log('[AuthService.signup] Skipping investor record - role:', input.role, 'fundId:', fundId);
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

