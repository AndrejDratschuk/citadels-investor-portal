import { supabaseAdmin } from '../../common/database/supabase';
import {
  createAccountToken,
  verifyToken,
  markTokenUsed,
  getKycApplicationData,
} from './token.service';
import {
  createVerificationCode,
  verifyCode as verifyEmailCode,
} from './verification.service';
import type {
  CreateAccountInput,
  VerifyTokenResponse,
  SendCodeResponse,
  CreateAccountResponse,
  SendInviteResponse,
} from '@altsui/shared';

interface AccountCreationServiceDeps {
  emailService: {
    sendVerificationCode: (email: string, code: string) => Promise<void>;
    sendAccountCreationInvite: (
      email: string,
      firstName: string,
      fundName: string,
      createAccountUrl: string
    ) => Promise<void>;
    sendAccountCreatedConfirmation: (
      email: string,
      firstName: string,
      portalUrl: string
    ) => Promise<void>;
  };
}

/**
 * Account Creation Service - Operator pattern
 * Pure business logic, receives dependencies, bubbles errors up
 */
export class AccountCreationService {
  constructor(private deps: AccountCreationServiceDeps) {}

  /**
   * Verify a token and return pre-filled data for account creation
   */
  async verifyToken(
    token: string,
    timestamp: Date
  ): Promise<VerifyTokenResponse> {
    const result = await verifyToken(token, timestamp);

    if (!result.valid || !result.data) {
      throw new Error(result.error || 'Invalid token');
    }

    // Get KYC data to pre-fill the form
    const kycData = await getKycApplicationData(result.data.kycApplicationId);

    if (!kycData) {
      throw new Error('KYC application not found');
    }

    return {
      valid: true,
      email: result.data.email,
      firstName: kycData.firstName,
      lastName: kycData.lastName,
      kycApplicationId: result.data.kycApplicationId,
      fundId: result.data.fundId,
      fundName: kycData.fundName,
      expiresAt: result.data.expiresAt,
    };
  }

  /**
   * Send a verification code to the user's email
   */
  async sendVerificationCode(
    token: string,
    timestamp: Date
  ): Promise<SendCodeResponse> {
    // First verify the token is still valid
    const tokenResult = await verifyToken(token, timestamp);

    if (!tokenResult.valid || !tokenResult.data) {
      throw new Error(tokenResult.error || 'Invalid token');
    }

    // Create a new verification code
    const { code, expiresIn } = await createVerificationCode(
      tokenResult.data.email,
      'account_creation',
      timestamp
    );

    // Send the code via email
    await this.deps.emailService.sendVerificationCode(tokenResult.data.email, code);

    return { sent: true, expiresIn };
  }

  /**
   * Create a new investor account
   */
  async createAccount(
    input: CreateAccountInput,
    timestamp: Date
  ): Promise<CreateAccountResponse> {
    // Verify token
    const tokenResult = await verifyToken(input.token, timestamp);

    if (!tokenResult.valid || !tokenResult.data) {
      throw new Error(tokenResult.error || 'Invalid token');
    }

    // Verify the email code
    const codeResult = await verifyEmailCode(
      tokenResult.data.email,
      input.verificationCode,
      'account_creation',
      timestamp
    );

    if (!codeResult.valid) {
      throw new Error(codeResult.error || 'Invalid verification code');
    }

    // Get KYC data
    const kycData = await getKycApplicationData(tokenResult.data.kycApplicationId);

    if (!kycData) {
      throw new Error('KYC application not found');
    }

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: tokenResult.data.email,
      password: input.password,
      email_confirm: true, // Auto-confirm since we verified via 2FA
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create user: ${authError?.message || 'Unknown error'}`);
    }

    // Create user record
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: tokenResult.data.email,
        role: 'investor',
        fund_id: tokenResult.data.fundId,
      });

    if (userError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user record: ${userError.message}`);
    }

    // Create investor record
    const { data: investorData, error: investorError } = await supabaseAdmin
      .from('investors')
      .insert({
        user_id: authData.user.id,
        fund_id: tokenResult.data.fundId,
        first_name: kycData.firstName || '',
        last_name: kycData.lastName || '',
        email: tokenResult.data.email,
        status: 'account_created',
      })
      .select()
      .single();

    if (investorError || !investorData) {
      // Rollback: delete user record and auth user
      await supabaseAdmin.from('users').delete().eq('id', authData.user.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create investor record: ${investorError?.message || 'Unknown error'}`);
    }

    // Update KYC application status
    await supabaseAdmin
      .from('kyc_applications')
      .update({ status: 'account_created' })
      .eq('id', tokenResult.data.kycApplicationId);

    // Mark token as used
    await markTokenUsed(input.token, timestamp);

    // Generate session tokens
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: tokenResult.data.email,
    });

    // Get access tokens by signing in
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: tokenResult.data.email,
      password: input.password,
    });

    if (signInError || !signInData.session) {
      throw new Error(`Failed to generate session: ${signInError?.message || 'Unknown error'}`);
    }

    // Send confirmation email
    await this.deps.emailService.sendAccountCreatedConfirmation(
      tokenResult.data.email,
      kycData.firstName || 'Investor',
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/investor`
    );

    return {
      user: {
        id: authData.user.id,
        email: tokenResult.data.email,
        role: 'investor',
      },
      investor: {
        id: investorData.id,
        firstName: investorData.first_name,
        lastName: investorData.last_name,
        status: investorData.status,
      },
      accessToken: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
    };
  }

  /**
   * Send an account creation invite to a KYC applicant
   */
  async sendAccountInvite(
    kycApplicationId: string,
    fundId: string,
    timestamp: Date
  ): Promise<SendInviteResponse> {
    // Get KYC data
    const kycData = await getKycApplicationData(kycApplicationId);

    if (!kycData) {
      throw new Error('KYC application not found');
    }

    // Create token
    const { token, expiresAt } = await createAccountToken(
      kycApplicationId,
      fundId,
      kycData.email,
      timestamp
    );

    // Update KYC status
    await supabaseAdmin
      .from('kyc_applications')
      .update({ status: 'account_invite_sent' })
      .eq('id', kycApplicationId);

    // Build the create account URL
    const createAccountUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/create-account/${token}`;

    // Send the invite email
    await this.deps.emailService.sendAccountCreationInvite(
      kycData.email,
      kycData.firstName || 'Investor',
      kycData.fundName || 'the fund',
      createAccountUrl
    );

    // Get the token ID for the response
    const { data: tokenData } = await supabaseAdmin
      .from('account_creation_tokens')
      .select('id')
      .eq('token', token)
      .single();

    return {
      tokenId: tokenData?.id || '',
      expiresAt: expiresAt.toISOString(),
      emailSent: true,
    };
  }
}

