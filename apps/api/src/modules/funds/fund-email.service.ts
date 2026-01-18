import { supabaseAdmin } from '../../common/database/supabase';

export interface EmailCustomizationSettings {
  preMeetingMaterialsType: 'website' | 'teaser_doc' | null;
  preMeetingMaterialsUrl: string | null;
  accreditationEducationType: 'standard_video' | 'custom_text';
  accreditationEducationContent: string | null;
  postMeetingRecapTemplate: string | null;
  consideringSupportMessage: string | null;
  nurtureUpdateTemplates: string[];
  documentReviewTimeframe: string | null;
  welcomeMessage: string | null;
  transferProcessNote: string | null;
  transferNextSteps: string | null;
  transferDenialOptions: string | null;
  exitClosingMessage: string | null;
  userCredentials: string | null;
}

export interface UpdateEmailCustomizationInput {
  preMeetingMaterialsType?: 'website' | 'teaser_doc' | null;
  preMeetingMaterialsUrl?: string | null;
  accreditationEducationType?: 'standard_video' | 'custom_text';
  accreditationEducationContent?: string | null;
  postMeetingRecapTemplate?: string | null;
  consideringSupportMessage?: string | null;
  nurtureUpdateTemplates?: string[];
  documentReviewTimeframe?: string | null;
  welcomeMessage?: string | null;
  transferProcessNote?: string | null;
  transferNextSteps?: string | null;
  transferDenialOptions?: string | null;
  exitClosingMessage?: string | null;
  userCredentials?: string | null;
}

export class FundEmailService {
  /**
   * Get email customization settings for a fund
   */
  async getEmailCustomization(fundId: string, userId: string): Promise<EmailCustomizationSettings> {
    // Fetch fund email settings and user credentials in parallel
    const [fundResult, userResult] = await Promise.all([
      supabaseAdmin
        .from('funds')
        .select(`
          pre_meeting_materials_type,
          pre_meeting_materials_url,
          accreditation_education_type,
          accreditation_education_content,
          post_meeting_recap_template,
          considering_support_message,
          nurture_update_templates,
          document_review_timeframe,
          welcome_message,
          transfer_process_note,
          transfer_next_steps,
          transfer_denial_options,
          exit_closing_message
        `)
        .eq('id', fundId)
        .single(),
      supabaseAdmin
        .from('users')
        .select('credentials')
        .eq('id', userId)
        .single(),
    ]);

    const { data: fundData, error: fundError } = fundResult;
    const { data: userData, error: userError } = userResult;

    if (fundError) {
      console.error('Error fetching email customization:', fundError);
      throw new Error('Failed to fetch email customization settings');
    }

    if (userError) {
      console.error('Error fetching user credentials:', userError);
    }

    return {
      preMeetingMaterialsType: fundData.pre_meeting_materials_type,
      preMeetingMaterialsUrl: fundData.pre_meeting_materials_url,
      accreditationEducationType: fundData.accreditation_education_type || 'standard_video',
      accreditationEducationContent: fundData.accreditation_education_content,
      postMeetingRecapTemplate: fundData.post_meeting_recap_template,
      consideringSupportMessage: fundData.considering_support_message,
      nurtureUpdateTemplates: fundData.nurture_update_templates || [],
      documentReviewTimeframe: fundData.document_review_timeframe,
      welcomeMessage: fundData.welcome_message,
      transferProcessNote: fundData.transfer_process_note,
      transferNextSteps: fundData.transfer_next_steps,
      transferDenialOptions: fundData.transfer_denial_options,
      exitClosingMessage: fundData.exit_closing_message,
      userCredentials: userData?.credentials || null,
    };
  }

  /**
   * Update email customization settings for a fund
   */
  async updateEmailCustomization(
    fundId: string,
    userId: string,
    input: UpdateEmailCustomizationInput
  ): Promise<EmailCustomizationSettings> {
    const fundUpdate: Record<string, unknown> = {};

    if (input.preMeetingMaterialsType !== undefined) {
      fundUpdate.pre_meeting_materials_type = input.preMeetingMaterialsType;
    }
    if (input.preMeetingMaterialsUrl !== undefined) {
      fundUpdate.pre_meeting_materials_url = input.preMeetingMaterialsUrl;
    }
    if (input.accreditationEducationType !== undefined) {
      fundUpdate.accreditation_education_type = input.accreditationEducationType;
    }
    if (input.accreditationEducationContent !== undefined) {
      fundUpdate.accreditation_education_content = input.accreditationEducationContent;
    }
    if (input.postMeetingRecapTemplate !== undefined) {
      fundUpdate.post_meeting_recap_template = input.postMeetingRecapTemplate;
    }
    if (input.consideringSupportMessage !== undefined) {
      fundUpdate.considering_support_message = input.consideringSupportMessage;
    }
    if (input.nurtureUpdateTemplates !== undefined) {
      fundUpdate.nurture_update_templates = input.nurtureUpdateTemplates;
    }
    if (input.documentReviewTimeframe !== undefined) {
      fundUpdate.document_review_timeframe = input.documentReviewTimeframe;
    }
    if (input.welcomeMessage !== undefined) {
      fundUpdate.welcome_message = input.welcomeMessage;
    }
    if (input.transferProcessNote !== undefined) {
      fundUpdate.transfer_process_note = input.transferProcessNote;
    }
    if (input.transferNextSteps !== undefined) {
      fundUpdate.transfer_next_steps = input.transferNextSteps;
    }
    if (input.transferDenialOptions !== undefined) {
      fundUpdate.transfer_denial_options = input.transferDenialOptions;
    }
    if (input.exitClosingMessage !== undefined) {
      fundUpdate.exit_closing_message = input.exitClosingMessage;
    }

    if (Object.keys(fundUpdate).length > 0) {
      const { error: fundError } = await supabaseAdmin
        .from('funds')
        .update(fundUpdate)
        .eq('id', fundId);

      if (fundError) {
        console.error('Error updating fund email settings:', fundError);
        throw new Error('Failed to update email customization settings');
      }
    }

    if (input.userCredentials !== undefined) {
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update({ credentials: input.userCredentials })
        .eq('id', userId);

      if (userError) {
        console.error('Error updating user credentials:', userError);
        throw new Error('Failed to update user credentials');
      }
    }

    return this.getEmailCustomization(fundId, userId);
  }
}

export const fundEmailService = new FundEmailService();
