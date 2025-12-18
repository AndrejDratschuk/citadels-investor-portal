import { supabaseAdmin } from '../../common/database/supabase';
import { USER_ROLES } from '@flowveda/shared';

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
  taxIdLast4: string;
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
}

export class OnboardingService {
  /**
   * Submit onboarding application and create investor account
   */
  async submit(
    fundId: string,
    inviteCode: string,
    data: OnboardingSubmissionData,
    password: string
  ) {
    // Generate a random password if not provided (user will need to reset)
    const userPassword = password || this.generateTempPassword();

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: userPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create user account');
    }

    try {
      // 2. Create user record
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          role: USER_ROLES.INVESTOR,
          fund_id: fundId,
        });

      if (userError) {
        throw new Error(userError.message);
      }

      // 3. Create investor record with all details
      const { data: investor, error: investorError } = await supabaseAdmin
        .from('investors')
        .insert({
          user_id: authData.user.id,
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
          tax_id_last4: data.taxIdLast4,
          accreditation_status: 'approved', // Auto-approve since they passed KYC
          accreditation_type: data.accreditationType,
          commitment_amount: data.commitmentAmount,
          total_called: 0,
          total_invested: 0,
          status: 'active',
          onboarding_step: 5,
          onboarded_at: new Date().toISOString(),
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
        throw new Error(investorError.message);
      }

      // 4. Create onboarding application record
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

      // 5. Update KYC application status if linked
      if (data.kycApplicationId) {
        await supabaseAdmin
          .from('kyc_applications')
          .update({
            status: 'meeting_complete',
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.kycApplicationId);
      }

      return {
        userId: authData.user.id,
        investorId: investor.id,
        email: data.email,
        tempPassword: password ? undefined : userPassword, // Only return if generated
      };
    } catch (error) {
      // Rollback: delete auth user if anything fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw error;
    }
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













