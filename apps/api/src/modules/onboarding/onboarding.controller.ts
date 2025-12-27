import { FastifyRequest, FastifyReply } from 'fastify';
import { OnboardingService, OnboardingSubmissionData } from './onboarding.service';
import { supabaseAdmin } from '../../common/database/supabase';

const onboardingService = new OnboardingService();

interface SubmitOnboardingBody extends OnboardingSubmissionData {
  inviteCode: string;
  password?: string;
  userId?: string; // Pre-created user ID from AccountCreationStep
}

export class OnboardingController {
  /**
   * Submit onboarding application
   */
  async submit(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as SubmitOnboardingBody;

    if (!body.inviteCode) {
      return reply.status(400).send({
        success: false,
        error: 'Invite code is required',
      });
    }

    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone',
      'address1', 'city', 'state', 'zipCode', 'country',
      'taxResidency', 'taxIdType', 'taxIdNumber', 'accreditationType',
      'commitmentAmount',
      'distributionMethod', 'bankName', 'bankAddress', 
      'routingNumber', 'accountNumber', 'accountType', 'beneficiaryName',
    ];

    for (const field of requiredFields) {
      if (!body[field as keyof SubmitOnboardingBody]) {
        return reply.status(400).send({
          success: false,
          error: `${field} is required`,
        });
      }
    }

    // Look up fund - first try from KYC application if provided
    let fundId: string | null = null;
    
    // If KYC application ID is provided, get fund from there (most reliable)
    if (body.kycApplicationId) {
      const { data: kycApp } = await supabaseAdmin
        .from('kyc_applications')
        .select('fund_id')
        .eq('id', body.kycApplicationId)
        .single();
      
      if (kycApp?.fund_id) {
        fundId = kycApp.fund_id;
      }
    }

    // If not found via KYC, try invite code as fund code (e.g., "citadel-2024")
    if (!fundId) {
      const { data: fundByCode } = await supabaseAdmin
        .from('funds')
        .select('id')
        .ilike('name', `%${body.inviteCode.split('-')[0]}%`)
        .single();

      if (fundByCode) {
        fundId = fundByCode.id;
      }
    }

    // Try as fund name
    if (!fundId) {
      const { data: fundByName } = await supabaseAdmin
        .from('funds')
        .select('id')
        .eq('name', body.inviteCode)
        .single();

      if (fundByName) {
        fundId = fundByName.id;
      }
    }

    // Try as direct fund ID (UUID)
    if (!fundId) {
      const { data: fundById } = await supabaseAdmin
        .from('funds')
        .select('id')
        .eq('id', body.inviteCode)
        .single();

      if (fundById) {
        fundId = fundById.id;
      }
    }

    // Last resort: use default fund
    if (!fundId) {
      const { data: defaultFund } = await supabaseAdmin
        .from('funds')
        .select('id')
        .limit(1)
        .single();

      if (defaultFund) {
        fundId = defaultFund.id;
      }
    }

    if (!fundId) {
      return reply.status(404).send({
        success: false,
        error: 'Fund not found',
      });
    }

    // Check if email already exists (but skip if userId is provided - account was created in step 1)
    if (!body.userId) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', body.email)
        .single();

      if (existingUser) {
        return reply.status(409).send({
          success: false,
          error: 'An account with this email already exists',
        });
      }
    }

    try {
      const result = await onboardingService.submit(
        fundId,
        body.inviteCode,
        body,
        body.password || ''
      );

      return reply.status(201).send({
        success: true,
        data: {
          userId: result.userId,
          investorId: result.investorId,
          email: result.email,
        },
        message: 'Application submitted successfully. You can now log in to your account.',
      });
    } catch (error: any) {
      console.error('Onboarding submission error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to submit application',
      });
    }
  }

  /**
   * Get onboarding status by invite code
   */
  async getStatus(request: FastifyRequest, reply: FastifyReply) {
    const { inviteCode } = request.params as { inviteCode: string };

    const { data: application, error } = await supabaseAdmin
      .from('onboarding_applications')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (error || !application) {
      return reply.status(404).send({
        success: false,
        error: 'Application not found',
      });
    }

    return reply.send({
      success: true,
      data: application,
    });
  }
}























