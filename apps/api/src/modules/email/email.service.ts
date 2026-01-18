import { Resend } from 'resend';
import {
  emailTemplates,
  AccountInviteTemplateData,
  VerificationCodeTemplateData,
  AccountCreatedTemplateData,
  DocumentRejectionTemplateData,
  DocumentApprovedTemplateData,
  DocumentsApprovedDocuSignTemplateData,
  WelcomeInvestorTemplateData,
  OnboardingReminderTemplateData,
  CapitalCallRequestTemplateData,
  WireConfirmationTemplateData,
  WireIssueTemplateData,
  // Prospect templates (Stage 01)
  KYCInviteTemplateData,
  KYCAutoSendTemplateData,
  KYCReminder1TemplateData,
  KYCReminder2TemplateData,
  KYCReminder3TemplateData,
  MeetingInviteTemplateData,
  KYCNotEligibleTemplateData,
  MeetingReminder24hrTemplateData,
  MeetingReminder15minTemplateData,
  MeetingNoShowTemplateData,
  PostMeetingProceedTemplateData,
  PostMeetingConsideringTemplateData,
  PostMeetingNotFitTemplateData,
  NurtureDay15TemplateData,
  NurtureDay23TemplateData,
  NurtureDay30TemplateData,
  DormantCloseoutTemplateData,
  // Investor onboarding templates (Stage 02)
  OnboardingReminder1TemplateData,
  OnboardingReminder2TemplateData,
  OnboardingReminder3TemplateData,
  DocumentUploadedPendingTemplateData,
  DocumentsReadySignatureTemplateData,
  SignatureReminder1TemplateData,
  SignatureReminder2TemplateData,
  DocumentsFullyExecutedTemplateData,
  FundingInstructionsTemplateData,
  FundingDiscrepancyTemplateData,
  WelcomeInvestorEnhancedTemplateData,
  AccountInvitationEnhancedTemplateData,
  // Capital Operations templates (Stage 03)
  CapitalCallReminderTemplateData,
  CapitalCallPastDueTemplateData,
  CapitalCallPastDue7TemplateData,
  CapitalCallDefaultTemplateData,
  DistributionNoticeTemplateData,
  DistributionSentTemplateData,
  DistributionElectionTemplateData,
  RefinanceNoticeTemplateData,
  // Reporting & Tax templates (Stage 04)
  QuarterlyReportTemplateData,
  AnnualReportTemplateData,
  AnnualMeetingInviteTemplateData,
  PropertyAcquisitionTemplateData,
  PropertyDispositionTemplateData,
  K1AvailableTemplateData,
  K1EstimateTemplateData,
  K1AmendedTemplateData,
  // Compliance & Re-Verification templates (Stage 05)
  RekycRequiredTemplateData,
  AccreditationReverificationTemplateData,
  BankingUpdateRequestTemplateData,
  PpmAmendmentTemplateData,
  MaterialEventTemplateData,
  // Legacy types
  KYCReminderTemplateData,
  PostMeetingOnboardingTemplateData,
} from './templates';

// Initialize Resend with API key from environment
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.warn('[Email] WARNING: RESEND_API_KEY is not set - emails will not be sent');
}
const resend = new Resend(resendApiKey);

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  from?: string;
  html?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  /**
   * Send an email using Resend
   */
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const { to, subject, body, from, html } = input;

    // Default from address - should be configured in fund settings
    const fromAddress = from || process.env.EMAIL_FROM_ADDRESS || 'noreply@altsui.com';

    if (!resendApiKey) {
      console.error('[Email] Cannot send email - RESEND_API_KEY is not configured');
      return {
        success: false,
        error: 'Email service not configured - RESEND_API_KEY is missing',
      };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject: subject,
        text: body, // Plain text version
        html: html || body.replace(/\n/g, '<br>'), // HTML version
      });

      if (error) {
        console.error('Resend error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send email',
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Email send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  // ============================================================
  // Account & Onboarding Email Methods
  // ============================================================

  /**
   * Send account creation invite email
   */
  async sendAccountInvite(to: string, data: AccountInviteTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Create Your Investor Account - ${data.fundName}`,
      body: `Hi ${data.recipientName}, please create your investor account at: ${data.accountCreationUrl}`,
      html: emailTemplates.accountInvite(data),
    });
  }

  /**
   * Send email verification code
   */
  async sendVerificationCode(to: string, data: VerificationCodeTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: 'Verify Your Email Address',
      body: `Hi ${data.recipientName}, your verification code is: ${data.verificationCode}. This code expires in ${data.expiresInMinutes} minutes.`,
      html: emailTemplates.verificationCode(data),
    });
  }

  /**
   * Send account created confirmation email
   */
  async sendAccountCreated(to: string, data: AccountCreatedTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Account Created Successfully - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your investor account has been created. Complete your profile at: ${data.onboardingUrl}`,
      html: emailTemplates.accountCreated(data),
    });
  }

  /**
   * Send onboarding reminder email
   */
  async sendOnboardingReminder(to: string, data: OnboardingReminderTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Complete Your Investor Profile - ${data.fundName}`,
      body: `Hi ${data.recipientName}, please complete your investor profile: ${data.onboardingUrl}`,
      html: emailTemplates.onboardingReminder(data),
    });
  }

  /**
   * Send welcome investor email
   */
  async sendWelcomeInvestor(to: string, data: WelcomeInvestorTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Welcome to ${data.fundName}!`,
      body: `Hi ${data.recipientName}, congratulations! Your investment of $${data.investmentAmount} in ${data.fundName} is confirmed. Access your portal: ${data.portalUrl}`,
      html: emailTemplates.welcomeInvestor(data),
    });
  }

  // ============================================================
  // Document Email Methods
  // ============================================================

  /**
   * Send document rejection notification email
   */
  async sendDocumentRejection(to: string, data: DocumentRejectionTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Document Requires Attention - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your document "${data.documentName}" was rejected. Reason: ${data.rejectionReason}. Please upload a new document at: ${data.portalUrl}`,
      html: emailTemplates.documentRejection(data),
    });
  }

  /**
   * Send document approved notification email
   */
  async sendDocumentApproved(to: string, data: DocumentApprovedTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Document Approved - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your document "${data.documentName}" has been approved. View your documents at: ${data.portalUrl}`,
      html: emailTemplates.documentApproved(data),
    });
  }

  /**
   * Send documents approved + DocuSign email
   */
  async sendDocumentsApprovedDocuSign(to: string, data: DocumentsApprovedDocuSignTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Documents Ready for Signature - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your documents have been approved. Sign your investment documents here: ${data.docusignUrl}`,
      html: emailTemplates.documentsApprovedDocuSign(data),
    });
  }

  // ============================================================
  // Prospect/KYC Email Methods (Stage 01 - 17 emails)
  // ============================================================

  // --- Primary Flow ---

  /**
   * 01.01.A1 - KYC invite email (manual send)
   */
  async sendKYCInvite(to: string, data: KYCInviteTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Investment Opportunity - ${data.fundName}`,
      body: `Hi ${data.recipientName}, ${data.managerName} from ${data.fundName} has invited you to complete a pre-qualification form. Complete it here: ${data.kycUrl}`,
      html: emailTemplates.kycInvite(data),
    });
  }

  /**
   * 01.02.A1 - KYC auto-send email (from interest form)
   */
  async sendKYCAutoSend(to: string, data: KYCAutoSendTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Thanks for Your Interest - ${data.fundName}`,
      body: `Hi ${data.recipientName}, thank you for your interest in ${data.fundName}. Complete your pre-qualification here: ${data.kycUrl}`,
      html: emailTemplates.kycAutoSend(data),
    });
  }

  /**
   * 01.03.A1 - Meeting invite email (KYC approved)
   */
  async sendMeetingInvite(to: string, data: MeetingInviteTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Pre-Qualified - Schedule Your Call - ${data.fundName}`,
      body: `Hi ${data.recipientName}, you're pre-qualified for ${data.fundName}. Schedule your call here: ${data.calendlyUrl}`,
      html: emailTemplates.meetingInvite(data),
    });
  }

  // --- KYC Reminders ---

  /**
   * 01.02.B1 - KYC reminder #1 (+48hr)
   */
  async sendKYCReminder1(to: string, data: KYCReminder1TemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Complete Your Pre-Qualification - ${data.fundName}`,
      body: `Hi ${data.recipientName}, you started the pre-qualification process but haven't completed it yet. Continue here: ${data.kycUrl}`,
      html: emailTemplates.kycReminder1(data),
    });
  }

  /**
   * 01.02.B2 - KYC reminder #2 (+5 days)
   */
  async sendKYCReminder2(to: string, data: KYCReminder2TemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Still Interested? - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your pre-qualification form is still waiting for you: ${data.kycUrl}`,
      html: emailTemplates.kycReminder2(data),
    });
  }

  /**
   * 01.02.B3 - KYC reminder #3 (Final, +10 days)
   */
  async sendKYCReminder3(to: string, data: KYCReminder3TemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Last Reminder - ${data.fundName}`,
      body: `Hi ${data.recipientName}, this is a final reminder to complete your pre-qualification for ${data.fundName}: ${data.kycUrl}`,
      html: emailTemplates.kycReminder3(data),
    });
  }

  /**
   * @deprecated Use sendKYCReminder1 instead
   */
  async sendKYCReminder(to: string, data: KYCReminderTemplateData): Promise<SendEmailResult> {
    return this.sendKYCReminder1(to, data);
  }

  // --- KYC Rejection ---

  /**
   * 01.03.C1 - KYC not eligible email
   */
  async sendKYCNotEligible(to: string, data: KYCNotEligibleTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Thank You for Your Interest - ${data.fundName}`,
      body: `Hi ${data.recipientName}, thank you for your interest in ${data.fundName}. Based on the information provided, this investment opportunity is limited to accredited investors under SEC regulations.`,
      html: emailTemplates.kycNotEligible(data),
    });
  }

  // --- Meeting Reminders ---

  /**
   * 01.04.A1 - Meeting reminder (24hr before)
   */
  async sendMeetingReminder24hr(to: string, data: MeetingReminder24hrTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Tomorrow: Your Call with ${data.managerName} - ${data.fundName}`,
      body: `Hi ${data.recipientName}, this is a reminder of your scheduled call on ${data.meetingDate} at ${data.meetingTime} ${data.timezone}. Join here: ${data.meetingLink}`,
      html: emailTemplates.meetingReminder24hr(data),
    });
  }

  /**
   * 01.04.A2 - Meeting reminder (15min before)
   */
  async sendMeetingReminder15min(to: string, data: MeetingReminder15minTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Starting Soon: Your Call with ${data.managerName}`,
      body: `Hi ${data.recipientName}, your call starts in 15 minutes. Join here: ${data.meetingLink}`,
      html: emailTemplates.meetingReminder15min(data),
    });
  }

  /**
   * 01.05.B1 - Meeting no-show email
   */
  async sendMeetingNoShow(to: string, data: MeetingNoShowTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Let's Reschedule - ${data.fundName}`,
      body: `Hi ${data.recipientName}, we missed you for our scheduled call. No problem—schedules change. Pick a new time: ${data.calendlyUrl}`,
      html: emailTemplates.meetingNoShow(data),
    });
  }

  // --- Post-Meeting ---

  /**
   * 01.06.A1 - Post-meeting proceed (create account)
   */
  async sendPostMeetingProceed(to: string, data: PostMeetingProceedTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Create Your Investor Account - ${data.fundName}`,
      body: `Hi ${data.recipientName}, thank you for our conversation. To move forward with your investment, please create your secure investor account: ${data.accountCreationUrl}`,
      html: emailTemplates.postMeetingProceed(data),
    });
  }

  /**
   * 01.06.B1 - Post-meeting considering (nurture entry)
   */
  async sendPostMeetingConsidering(to: string, data: PostMeetingConsideringTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `${data.fundName} - Next Steps When You're Ready`,
      body: `Hi ${data.recipientName}, thank you for taking the time to discuss ${data.fundName}. When you're ready to move forward, click here: ${data.readyToInvestUrl}`,
      html: emailTemplates.postMeetingConsidering(data),
    });
  }

  /**
   * 01.06.C1 - Post-meeting not a fit
   */
  async sendPostMeetingNotFit(to: string, data: PostMeetingNotFitTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Thank You for Your Time - ${data.fundName}`,
      body: `Hi ${data.recipientName}, thank you for taking the time to speak with us about ${data.fundName}. After our conversation, we've determined that this particular opportunity may not be the best fit at this time.`,
      html: emailTemplates.postMeetingNotFit(data),
    });
  }

  /**
   * @deprecated Use sendPostMeetingProceed instead
   */
  async sendPostMeetingOnboarding(to: string, data: PostMeetingOnboardingTemplateData): Promise<SendEmailResult> {
    return this.sendPostMeetingProceed(to, {
      recipientName: data.recipientName,
      fundName: data.fundName,
      managerName: data.managerName || data.fundName,
      accountCreationUrl: data.accountCreationUrl,
    });
  }

  // --- Nurture Sequence ---

  /**
   * 01.06.B2 - Nurture day 15
   */
  async sendNurtureDay15(to: string, data: NurtureDay15TemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Checking In - ${data.fundName}`,
      body: `Hi ${data.recipientName}, I wanted to follow up on our conversation about ${data.fundName}. If you have any questions or would like to discuss further, I'm happy to connect.`,
      html: emailTemplates.nurtureDay15(data),
    });
  }

  /**
   * 01.06.B3 - Nurture day 23
   */
  async sendNurtureDay23(to: string, data: NurtureDay23TemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `${data.fundName} - Quick Update`,
      body: `Hi ${data.recipientName}, I wanted to share a quick update on ${data.fundName} and see if you had any remaining questions.`,
      html: emailTemplates.nurtureDay23(data),
    });
  }

  /**
   * 01.06.B4 - Nurture day 30 (final)
   */
  async sendNurtureDay30(to: string, data: NurtureDay30TemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Final Follow-Up - ${data.fundName}`,
      body: `Hi ${data.recipientName}, I'm reaching out one more time regarding ${data.fundName}. If this isn't the right time, I completely understand.`,
      html: emailTemplates.nurtureDay30(data),
    });
  }

  /**
   * 01.06.B5 - Dormant close-out
   */
  async sendDormantCloseout(to: string, data: DormantCloseoutTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Thank You - ${data.fundName}`,
      body: `Hi ${data.recipientName}, thank you for taking the time to learn about ${data.fundName}. I understand the timing isn't right at the moment.`,
      html: emailTemplates.dormantCloseout(data),
    });
  }

  // ============================================================
  // Capital Call Email Methods
  // ============================================================

  /**
   * Send capital call request email
   */
  async sendCapitalCallRequest(to: string, data: CapitalCallRequestTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Capital Call Notice - ${data.fundName}`,
      body: `Hi ${data.recipientName}, a capital call of $${data.amountDue} has been issued for ${data.dealName}. Deadline: ${data.deadline}. View wire instructions: ${data.wireInstructionsUrl}`,
      html: emailTemplates.capitalCallRequest(data),
    });
  }

  /**
   * Send wire confirmation email
   */
  async sendWireConfirmation(to: string, data: WireConfirmationTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Wire Transfer Received - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your wire transfer of $${data.amountReceived} has been received. Confirmation: ${data.confirmationNumber}`,
      html: emailTemplates.wireConfirmation(data),
    });
  }

  /**
   * Send wire issue notification email
   */
  async sendWireIssue(to: string, data: WireIssueTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Action Required - Wire Transfer Issue - ${data.fundName}`,
      body: `Hi ${data.recipientName}, there was an issue with your wire transfer: ${data.issueDescription}. Please contact us to resolve.`,
      html: emailTemplates.wireIssue(data),
    });
  }

  /**
   * 03.01.A2 - Capital Call Reminder (7 Day)
   */
  async sendCapitalCallReminder7(to: string, data: CapitalCallReminderTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Capital Call Reminder - 7 Days Remaining - ${data.fundName}`,
      body: `Hi ${data.recipientName}, Capital Call #${data.capitalCallNumber} is due in 7 days. Amount: $${data.amountDue}. Deadline: ${data.deadline}`,
      html: emailTemplates.capitalCallReminder7(data),
    });
  }

  /**
   * 03.01.A3 - Capital Call Reminder (3 Day)
   */
  async sendCapitalCallReminder3(to: string, data: CapitalCallReminderTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Capital Call Reminder - 3 Days Remaining - ${data.fundName}`,
      body: `Hi ${data.recipientName}, Capital Call #${data.capitalCallNumber} is due in 3 days. Amount: $${data.amountDue}. Deadline: ${data.deadline}`,
      html: emailTemplates.capitalCallReminder3(data),
    });
  }

  /**
   * 03.01.A4 - Capital Call Reminder (1 Day)
   */
  async sendCapitalCallReminder1(to: string, data: CapitalCallReminderTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `REMINDER: Capital Call Due Tomorrow - ${data.fundName}`,
      body: `Hi ${data.recipientName}, Capital Call #${data.capitalCallNumber} is due tomorrow. Amount: $${data.amountDue}. Deadline: ${data.deadline}`,
      html: emailTemplates.capitalCallReminder1(data),
    });
  }

  /**
   * 03.01.B2 - Capital Call Past Due
   */
  async sendCapitalCallPastDue(to: string, data: CapitalCallPastDueTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `URGENT: Capital Call Past Due - ${data.fundName}`,
      body: `Hi ${data.recipientName}, Capital Call #${data.capitalCallNumber} was due on ${data.deadline} and remains unfunded. Amount: $${data.amountDue}. Days past due: ${data.daysPastDue}. Please contact us immediately.`,
      html: emailTemplates.capitalCallPastDue(data),
    });
  }

  /**
   * 03.01.B3 - Capital Call Past Due +7
   */
  async sendCapitalCallPastDue7(to: string, data: CapitalCallPastDue7TemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `URGENT: Capital Call 7+ Days Past Due - ${data.fundName}`,
      body: `Hi ${data.recipientName}, Capital Call #${data.capitalCallNumber} is now ${data.daysPastDue} days past due. Amount: $${data.amountDue}. Per ${data.defaultSection}, continued failure to fund may result in default proceedings.`,
      html: emailTemplates.capitalCallPastDue7(data),
    });
  }

  /**
   * 03.01.B4 - Capital Call Default Notice
   */
  async sendCapitalCallDefault(to: string, data: CapitalCallDefaultTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Notice of Default - Capital Call #${data.capitalCallNumber} - ${data.fundName}`,
      body: `Hi ${data.recipientName}, this is formal notice that you are in default on Capital Call #${data.capitalCallNumber}. Amount: $${data.amountDue}. Days past due: ${data.daysPastDue}.`,
      html: emailTemplates.capitalCallDefault(data),
    });
  }

  /**
   * 03.02.A1 - Distribution Notice
   */
  async sendDistributionNotice(to: string, data: DistributionNoticeTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Distribution Notice - ${data.fundName}`,
      body: `Hi ${data.recipientName}, a distribution of $${data.distributionAmount} has been approved for your investment in ${data.fundName}. Payment date: ${data.paymentDate}. Method: ${data.paymentMethod}.`,
      html: emailTemplates.distributionNotice(data),
    });
  }

  /**
   * 03.02.A2 - Distribution Sent
   */
  async sendDistributionSent(to: string, data: DistributionSentTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Distribution Sent - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your distribution of $${data.distributionAmount} has been sent. Confirmation: ${data.confirmationNumber}. Funds should arrive within ${data.arrivalTimeframe}.`,
      html: emailTemplates.distributionSent(data),
    });
  }

  /**
   * 03.02.B1 - Distribution Election Request
   */
  async sendDistributionElection(to: string, data: DistributionElectionTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Distribution Election Required - ${data.fundName}`,
      body: `Hi ${data.recipientName}, proceeds of $${data.eligibleAmount} are available from ${data.source}. Please elect to receive distribution or reinvest by ${data.electionDeadline}.`,
      html: emailTemplates.distributionElection(data),
    });
  }

  /**
   * 03.03.A1 - Refinance Notice
   */
  async sendRefinanceNotice(to: string, data: RefinanceNoticeTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Refinance Completed - ${data.propertyName} - ${data.fundName}`,
      body: `Hi ${data.recipientName}, the refinance of ${data.propertyName} has been completed. You will be notified separately regarding any distribution elections if proceeds are available.`,
      html: emailTemplates.refinanceNotice(data),
    });
  }

  // ============================================================
  // Investor Onboarding Email Methods (Stage 02)
  // ============================================================

  /**
   * 02.01.A1 - Account Invitation (Enhanced)
   */
  async sendAccountInvitationEnhanced(to: string, data: AccountInvitationEnhancedTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Create Your Investor Account - ${data.fundName}`,
      body: `Hi ${data.recipientName}, please create your investor account at: ${data.accountCreationUrl}`,
      html: emailTemplates.accountInvitationEnhanced(data),
    });
  }

  /**
   * 02.02.B1 - Onboarding Reminder #1 (+48hr)
   */
  async sendOnboardingReminder1(to: string, data: OnboardingReminder1TemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Complete Your Investor Profile - ${data.fundName}`,
      body: `Hi ${data.recipientName}, please complete your investor profile: ${data.onboardingUrl}`,
      html: emailTemplates.onboardingReminder1(data),
    });
  }

  /**
   * 02.02.B2 - Onboarding Reminder #2 (+96hr)
   */
  async sendOnboardingReminder2(to: string, data: OnboardingReminder2TemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Your Investor Profile is Incomplete - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your investor profile is still incomplete. Please finish it: ${data.onboardingUrl}`,
      html: emailTemplates.onboardingReminder2(data),
    });
  }

  /**
   * 02.02.B3 - Onboarding Reminder #3 (+144hr, Final)
   */
  async sendOnboardingReminder3(to: string, data: OnboardingReminder3TemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Final Reminder - Complete Your Profile - ${data.fundName}`,
      body: `Hi ${data.recipientName}, this is a final reminder to complete your investor profile: ${data.onboardingUrl}`,
      html: emailTemplates.onboardingReminder3(data),
    });
  }

  /**
   * 02.03.B1 - Document Uploaded Pending
   */
  async sendDocumentUploadedPending(to: string, data: DocumentUploadedPendingTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Document Received - ${data.fundName}`,
      body: `Hi ${data.recipientName}, we've received your ${data.documentType} and it's under review. You'll hear from us within ${data.reviewTimeframe}.`,
      html: emailTemplates.documentUploadedPending(data),
    });
  }

  /**
   * 02.04.A1 - Documents Ready for Signature
   */
  async sendDocumentsReadySignature(to: string, data: DocumentsReadySignatureTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Investment Documents Ready for Signature - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your documents are approved and ready for signature: ${data.docusignUrl}`,
      html: emailTemplates.documentsReadySignature(data),
    });
  }

  /**
   * 02.04.B1 - Signature Reminder #1 (+48hr)
   */
  async sendSignatureReminder1(to: string, data: SignatureReminder1TemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Documents Awaiting Your Signature - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your investment documents are waiting for your signature: ${data.docusignUrl}`,
      html: emailTemplates.signatureReminder1(data),
    });
  }

  /**
   * 02.04.B2 - Signature Reminder #2 (+96hr, Final)
   */
  async sendSignatureReminder2(to: string, data: SignatureReminder2TemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Final Reminder - Documents Awaiting Signature - ${data.fundName}`,
      body: `Hi ${data.recipientName}, this is a reminder that your investment documents are still awaiting signature: ${data.docusignUrl}`,
      html: emailTemplates.signatureReminder2(data),
    });
  }

  /**
   * 02.05.A1 - Documents Fully Executed
   */
  async sendDocumentsFullyExecuted(to: string, data: DocumentsFullyExecutedTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Investment Documents Executed - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your investment documents have been fully executed. View them at: ${data.portalUrl}`,
      html: emailTemplates.documentsFullyExecuted(data),
    });
  }

  /**
   * 02.06.A1 - Funding Instructions
   */
  async sendFundingInstructions(to: string, data: FundingInstructionsTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Funding Instructions - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your subscription has been accepted. Commitment: $${data.commitmentAmount}. Deadline: ${data.fundingDeadline}.`,
      html: emailTemplates.fundingInstructions(data),
    });
  }

  /**
   * 02.06.B1 - Funding Discrepancy
   */
  async sendFundingDiscrepancy(to: string, data: FundingDiscrepancyTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Funding Discrepancy - ${data.fundName}`,
      body: `Hi ${data.recipientName}, we received $${data.receivedAmount} but expected $${data.commitmentAmount}. Please contact us to resolve.`,
      html: emailTemplates.fundingDiscrepancy(data),
    });
  }

  /**
   * 02.07.A1 - Welcome Investor (Enhanced)
   */
  async sendWelcomeInvestorEnhanced(to: string, data: WelcomeInvestorEnhancedTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Welcome to ${data.fundName}!`,
      body: `Hi ${data.recipientName}, congratulations! Your investment of $${data.investmentAmount} is confirmed. Access your portal: ${data.portalUrl}`,
      html: emailTemplates.welcomeInvestorEnhanced(data),
    });
  }

  // ===========================================================================
  // STAGE 04: REPORTING & TAX EMAILS
  // ===========================================================================

  /**
   * 04.01.A1 - Quarterly Report
   * Sent when quarterly report is published (Q+30 days per PPM)
   */
  async sendQuarterlyReport(to: string, data: QuarterlyReportTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Q${data.quarter} ${data.year} Report Available - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your Q${data.quarter} ${data.year} performance report is now available in your portal: ${data.reportUrl}`,
      html: emailTemplates.quarterlyReport(data),
    });
  }

  /**
   * 04.02.A1 - Annual Report
   * Sent when annual report is published
   */
  async sendAnnualReport(to: string, data: AnnualReportTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `${data.year} Annual Report Available - ${data.fundName}`,
      body: `Hi ${data.recipientName}, the ${data.year} Annual Report for ${data.fundName} is now available in your portal: ${data.reportUrl}`,
      html: emailTemplates.annualReport(data),
    });
  }

  /**
   * 04.03.A1 - Annual Meeting Invite
   * Sent when manager schedules the annual investor meeting
   */
  async sendAnnualMeetingInvite(to: string, data: AnnualMeetingInviteTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Annual Investor Meeting Invitation - ${data.fundName}`,
      body: `Hi ${data.recipientName}, you are invited to the ${data.year} Annual Investor Meeting for ${data.fundName}. Date: ${data.meetingDate}, Time: ${data.meetingTime} ${data.timezone}. RSVP: ${data.rsvpUrl}`,
      html: emailTemplates.annualMeetingInvite(data),
    });
  }

  /**
   * 04.04.A1 - Property Acquisition
   * Sent when acquisition closes
   */
  async sendPropertyAcquisition(to: string, data: PropertyAcquisitionTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `New Acquisition: ${data.propertyName} - ${data.fundName}`,
      body: `Hi ${data.recipientName}, we are pleased to announce the acquisition of ${data.propertyName}. View details: ${data.propertyDetailsUrl}`,
      html: emailTemplates.propertyAcquisition(data),
    });
  }

  /**
   * 04.04.A2 - Property Disposition
   * Sent when sale closes
   */
  async sendPropertyDisposition(to: string, data: PropertyDispositionTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Property Sale Completed: ${data.propertyName} - ${data.fundName}`,
      body: `Hi ${data.recipientName}, we have completed the sale of ${data.propertyName}. View details: ${data.detailsUrl}`,
      html: emailTemplates.propertyDisposition(data),
    });
  }

  /**
   * 04.05.A1 - K-1 Available
   * Sent when K-1 is uploaded to portal
   */
  async sendK1Available(to: string, data: K1AvailableTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `${data.taxYear} Schedule K-1 Available - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your ${data.taxYear} Schedule K-1 for ${data.fundName} is now available: ${data.downloadUrl}`,
      html: emailTemplates.k1Available(data),
    });
  }

  /**
   * 04.05.B1 - K-1 Estimate
   * Sent when estimate is ready (final delayed)
   */
  async sendK1Estimate(to: string, data: K1EstimateTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `${data.taxYear} K-1 Estimate Available - ${data.fundName}`,
      body: `Hi ${data.recipientName}, preliminary K-1 estimates for ${data.taxYear} are now available for tax planning purposes. Final K-1s expected by ${data.expectedFinalDate}. View: ${data.estimateUrl}`,
      html: emailTemplates.k1Estimate(data),
    });
  }

  /**
   * 04.05.B2 - K-1 Amended
   * Sent when amended K-1 is issued
   */
  async sendK1Amended(to: string, data: K1AmendedTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Amended ${data.taxYear} Schedule K-1 - ${data.fundName}`,
      body: `Hi ${data.recipientName}, an amended Schedule K-1 for ${data.taxYear} has been issued for your investment in ${data.fundName}. Reason: ${data.amendmentReason}. Download: ${data.downloadUrl}`,
      html: emailTemplates.k1Amended(data),
    });
  }

  // ===========================================================================
  // STAGE 05: COMPLIANCE & RE-VERIFICATION EMAILS
  // ===========================================================================

  /**
   * 05.01.A1 - Re-KYC Required
   * Sent when periodic or event-based re-verification is required
   */
  async sendRekycRequired(to: string, data: RekycRequiredTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Verification Update Required - ${data.fundName}`,
      body: `Hi ${data.recipientName}, per ${data.fundName}'s compliance requirements, we need to verify your current information. Reason: ${data.reverificationReason}. Please complete this within ${data.deadline}. Update here: ${data.verificationUrl}`,
      html: emailTemplates.rekycRequired(data),
    });
  }

  /**
   * 05.02.A1 - Accreditation Re-Verification
   * Sent when accreditation status expires (506c compliance)
   */
  async sendAccreditationReverification(to: string, data: AccreditationReverificationTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Accreditation Verification Required - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your accredited investor status requires periodic re-verification. This is required to maintain your investment eligibility under SEC Regulation D. Complete verification here: ${data.verificationUrl}`,
      html: emailTemplates.accreditationReverification(data),
    });
  }

  /**
   * 05.03.A1 - Banking Update Request
   * Sent when ACH fails or wire is returned
   */
  async sendBankingUpdateRequest(to: string, data: BankingUpdateRequestTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Banking Information Update Needed - ${data.fundName}`,
      body: `Hi ${data.recipientName}, we were unable to process a payment to your account on file. Reason: ${data.failureReason}. Please update your banking information: ${data.updateBankingUrl}`,
      html: emailTemplates.bankingUpdateRequest(data),
    });
  }

  /**
   * 05.04.A1 - PPM Amendment Notice
   * Sent when PPM/OA is amended
   */
  async sendPpmAmendment(to: string, data: PpmAmendmentTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Important: Fund Document Amendment - ${data.fundName}`,
      body: `Hi ${data.recipientName}, the ${data.documentName} for ${data.fundName} has been amended. Effective Date: ${data.effectiveDate}. Review the amendment here: ${data.reviewUrl}`,
      html: emailTemplates.ppmAmendment(data),
    });
  }

  /**
   * 05.05.A1 - Material Event Notice
   * Sent when a material event is published
   */
  async sendMaterialEvent(to: string, data: MaterialEventTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Important Update - ${data.fundName}`,
      body: `Hi ${data.recipientName}, there is an important update regarding ${data.fundName}. View details: ${data.detailsUrl}`,
      html: emailTemplates.materialEvent(data),
    });
  }
}

export const emailService = new EmailService();

// Re-export template types for convenience
export type {
  AccountInviteTemplateData,
  VerificationCodeTemplateData,
  AccountCreatedTemplateData,
  DocumentRejectionTemplateData,
  DocumentApprovedTemplateData,
  DocumentsApprovedDocuSignTemplateData,
  WelcomeInvestorTemplateData,
  OnboardingReminderTemplateData,
  CapitalCallRequestTemplateData,
  WireConfirmationTemplateData,
  WireIssueTemplateData,
  // Prospect templates (Stage 01)
  KYCInviteTemplateData,
  KYCAutoSendTemplateData,
  KYCReminder1TemplateData,
  KYCReminder2TemplateData,
  KYCReminder3TemplateData,
  MeetingInviteTemplateData,
  KYCNotEligibleTemplateData,
  MeetingReminder24hrTemplateData,
  MeetingReminder15minTemplateData,
  MeetingNoShowTemplateData,
  PostMeetingProceedTemplateData,
  PostMeetingConsideringTemplateData,
  PostMeetingNotFitTemplateData,
  NurtureDay15TemplateData,
  NurtureDay23TemplateData,
  NurtureDay30TemplateData,
  DormantCloseoutTemplateData,
  // Investor onboarding templates (Stage 02)
  OnboardingReminder1TemplateData,
  OnboardingReminder2TemplateData,
  OnboardingReminder3TemplateData,
  DocumentUploadedPendingTemplateData,
  DocumentsReadySignatureTemplateData,
  SignatureReminder1TemplateData,
  SignatureReminder2TemplateData,
  DocumentsFullyExecutedTemplateData,
  FundingInstructionsTemplateData,
  FundingDiscrepancyTemplateData,
  WelcomeInvestorEnhancedTemplateData,
  AccountInvitationEnhancedTemplateData,
  // Reporting & Tax templates (Stage 04)
  QuarterlyReportTemplateData,
  AnnualReportTemplateData,
  AnnualMeetingInviteTemplateData,
  PropertyAcquisitionTemplateData,
  PropertyDispositionTemplateData,
  K1AvailableTemplateData,
  K1EstimateTemplateData,
  K1AmendedTemplateData,
  // Compliance & Re-Verification templates (Stage 05)
  RekycRequiredTemplateData,
  AccreditationReverificationTemplateData,
  BankingUpdateRequestTemplateData,
  PpmAmendmentTemplateData,
  MaterialEventTemplateData,
  // Legacy types
  KYCReminderTemplateData,
  PostMeetingOnboardingTemplateData,
};
