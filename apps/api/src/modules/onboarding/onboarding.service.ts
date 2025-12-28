import { supabaseAdmin } from '../../common/database/supabase';
import { USER_ROLES } from '@altsui/shared';
import { webhookService } from '../../common/services/webhook.service';

export interface OnboardingSubmissionData {
  // Personal info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: string;
  
  // Address
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Entity
  entityType: string;
  entityName?: string;
  
  // Tax & Accreditation
  taxResidency: string;
  taxIdType: string;
  taxIdNumber: string;
  accreditationType: string;
  accreditationDetails?: string;
  
  // Investment
  commitmentAmount: number;
  
  // Banking
  distributionMethod: string;
  bankName: string;
  bankAddress: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
  beneficiaryName: string;
  beneficiaryInfo?: string;
  
  // Optional KYC link
  kycApplicationId?: string;
  
  // Optional pre-created user ID (from account creation step)
  userId?: string;
}

export class OnboardingService {
  /**
   * Submit onboarding application and create investor account
   * If userId is provided, it means the account was already created in the frontend
   */
  async submit(
    fundId: string,
    inviteCode: string,
    data: OnboardingSubmissionData,
    password: string
  ) {
    let authUserId: string;
    let createdAuthUser = false;

    // Check if user account was already created (from AccountCreationStep)
    if (data.userId) {
      // Use the pre-created user ID
      authUserId = data.userId;
      
      // Verify the user exists in Supabase Auth
      const { data: existingUser, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(data.userId);
      if (verifyError || !existingUser.user) {
        throw new Error('Invalid user account. Please try again.');
      }
    } else {
      // Create Supabase Auth user (legacy path for backwards compatibility)
      const userPassword = password || this.generateTempPassword();
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: userPassword,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create user account');
      }
      
      authUserId = authData.user.id;
      createdAuthUser = true;
    }

    try {
      // Check if user record already exists (from frontend signup)
      const { data: existingUserRecord } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', authUserId)
        .single();

      // Create user record only if it doesn't exist
      if (!existingUserRecord) {
        const { error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authUserId,
            email: data.email,
            role: USER_ROLES.INVESTOR,
            fund_id: fundId,
          });

        if (userError) {
          throw new Error(userError.message);
        }
      } else {
        // Update existing user record with fund_id if needed
        await supabaseAdmin
          .from('users')
          .update({
            fund_id: fundId,
            role: USER_ROLES.INVESTOR,
          })
          .eq('id', authUserId);
      }

      // Create investor record with all details
      // Status is 'onboarding' - will change to 'active' when docs approved + agreements signed
      console.log('[Onboarding] Creating investor record with fund_id:', fundId, 'email:', data.email);
      const { data: investor, error: investorError } = await supabaseAdmin
        .from('investors')
        .insert({
          user_id: authUserId,
          fund_id: fundId,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          address: {
            address1: data.address1,
            address2: data.address2,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: data.country,
          },
          entity_type: data.entityType,
          entity_name: data.entityName,
          tax_id_type: data.taxIdType,
          tax_id_number: data.taxIdNumber,
          accreditation_status: 'approved', // Auto-approve since they passed KYC
          accreditation_type: data.accreditationType,
          commitment_amount: data.commitmentAmount,
          total_called: 0,
          total_invested: 0,
          status: 'onboarding', // Changed from 'active' - will be updated when onboarding completes
          onboarding_step: 5,
          onboarded_at: null, // Not fully onboarded yet
          // Banking info (encrypted fields would need additional handling)
          distribution_method: data.distributionMethod,
          bank_name: data.bankName,
          bank_address: data.bankAddress,
          routing_number_encrypted: data.routingNumber, // TODO: Encrypt
          account_number_encrypted: data.accountNumber, // TODO: Encrypt
          account_type: data.accountType,
          beneficiary_name: data.beneficiaryName,
          beneficiary_info: data.beneficiaryInfo,
        })
        .select()
        .single();

      if (investorError) {
        console.error('[Onboarding] Error creating investor:', investorError);
        throw new Error(investorError.message);
      }

      console.log('[Onboarding] Successfully created investor:', investor.id, 'in fund:', investor.fund_id);

      // Send webhook for new investor
      webhookService.sendWebhook('investor.created', {
        id: investor.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        fundId: fundId,
        commitmentAmount: data.commitmentAmount,
        source: 'onboarding',
        status: 'onboarding',
      });

      // Create onboarding application record
      const { error: applicationError } = await supabaseAdmin
        .from('onboarding_applications')
        .insert({
          invite_code: inviteCode,
          fund_id: fundId,
          investor_id: investor.id,
          kyc_application_id: data.kycApplicationId || null,
          status: 'approved',
          data: data,
          submitted_at: new Date().toISOString(),
        });

      if (applicationError) {
        console.error('Failed to create onboarding application record:', applicationError);
        // Don't throw - investor is already created
      }

      // Update KYC application status if linked
      if (data.kycApplicationId) {
        await supabaseAdmin
          .from('kyc_applications')
          .update({
            status: 'account_created',
            investor_id: investor.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.kycApplicationId);
      }

      // Also try to update prospect by inviteCode (which is often the prospect ID)
      // This handles the case where inviteCode is the prospect ID from the email link
      const { error: prospectUpdateError } = await supabaseAdmin
        .from('kyc_applications')
        .update({
          status: 'account_created',
          investor_id: investor.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inviteCode);

      if (prospectUpdateError) {
        console.log('Note: Could not update prospect by inviteCode (may not be a prospect ID):', inviteCode);
      } else {
        console.log('Updated prospect status to account_created for:', inviteCode);
      }

      return {
        userId: authUserId,
        investorId: investor.id,
        email: data.email,
      };
    } catch (error) {
      // Rollback: delete auth user if we created it and something fails
      if (createdAuthUser) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
      }
      throw error;
    }
  }

  /**
   * Check if investor has completed all onboarding requirements and update status
   * Requirements:
   * 1. All validation documents must be approved
   * 2. All DocuSign agreements must be signed
   */
  async checkAndUpdateStatus(investorId: string): Promise<{ updated: boolean; newStatus?: string }> {
    // Check validation documents status
    const { data: pendingDocs } = await supabaseAdmin
      .from('documents')
      .select('id')
      .eq('investor_id', investorId)
      .eq('subcategory', 'validation')
      .neq('validation_status', 'approved');

    // Check DocuSign documents status
    const { data: unsignedDocs } = await supabaseAdmin
      .from('documents')
      .select('id')
      .eq('investor_id', investorId)
      .eq('requires_signature', true)
      .neq('signing_status', 'signed');

    const allDocsApproved = !pendingDocs || pendingDocs.length === 0;
    const allDocsSigned = !unsignedDocs || unsignedDocs.length === 0;

    // Check if investor has any required signature documents
    const { data: sigDocs } = await supabaseAdmin
      .from('documents')
      .select('id')
      .eq('investor_id', investorId)
      .eq('requires_signature', true);

    // Only require signing if there are signature documents
    const signingComplete = !sigDocs || sigDocs.length === 0 || allDocsSigned;

    if (allDocsApproved && signingComplete) {
      // All requirements met - update status to active
      const { error } = await supabaseAdmin
        .from('investors')
        .update({
          status: 'active',
          onboarded_at: new Date().toISOString(),
        })
        .eq('id', investorId)
        .eq('status', 'onboarding'); // Only update if still in onboarding

      if (!error) {
        // Send webhook for status change
        webhookService.sendWebhook('investor.onboarding_complete', {
          investorId,
          status: 'active',
        });

        return { updated: true, newStatus: 'active' };
      }
    }

    return { updated: false };
  }

  /**
   * Get investor by ID
   */
  async getInvestorById(investorId: string) {
    const { data, error } = await supabaseAdmin
      .from('investors')
      .select('*')
      .eq('id', investorId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

export const onboardingService = new OnboardingService();













