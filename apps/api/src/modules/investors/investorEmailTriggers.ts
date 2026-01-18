/**
 * Investor Email Triggers
 * Orchestration layer for investor onboarding email flows (Stage 02)
 */

import { supabaseAdmin } from '../../common/database/supabase';
import { emailService } from '../email/email.service';
import { investorJobScheduler } from './investorJobScheduler';
import { getManagerEmailsForFund } from '../team-invites/getManagerEmailsForFund';

// ============================================================
// Data Fetching Helpers
// ============================================================

interface InvestorData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  entityName: string | null;
  fundId: string;
  status: string;
  commitmentAmount: number;
}

interface FundData {
  id: string;
  name: string;
  platformName: string | null;
  documentReviewTimeframe: string | null;
  welcomeMessage: string | null;
  calendlyUrl: string | null;
}

interface ManagerData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  title: string | null;
}

async function getInvestor(investorId: string): Promise<InvestorData | null> {
  const { data, error } = await supabaseAdmin
    .from('investors')
    .select('id, email, first_name, last_name, entity_name, fund_id, status, commitment_amount')
    .eq('id', investorId)
    .single();

  if (error || !data) {
    console.error('[InvestorEmailTriggers] Failed to fetch investor:', error);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    entityName: data.entity_name,
    fundId: data.fund_id,
    status: data.status,
    commitmentAmount: data.commitment_amount || 0,
  };
}

async function getFundSettings(fundId: string): Promise<FundData | null> {
  const { data, error } = await supabaseAdmin
    .from('funds')
    .select('id, name, platform_name, document_review_timeframe, welcome_message, calendly_url')
    .eq('id', fundId)
    .single();

  if (error || !data) {
    console.error('[InvestorEmailTriggers] Failed to fetch fund:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    platformName: data.platform_name,
    documentReviewTimeframe: data.document_review_timeframe,
    welcomeMessage: data.welcome_message,
    calendlyUrl: data.calendly_url,
  };
}

async function getManager(fundId: string): Promise<ManagerData | null> {
  // Get the fund manager for this fund
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, first_name, last_name, email, title')
    .eq('fund_id', fundId)
    .eq('role', 'fund_manager')
    .limit(1)
    .single();

  if (error || !data) {
    // Try to get any manager associated with the fund
    const { data: altData } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, title')
      .eq('fund_id', fundId)
      .limit(1)
      .single();

    if (altData) {
      return {
        id: altData.id,
        firstName: altData.first_name,
        lastName: altData.last_name,
        email: altData.email,
        title: altData.title,
      };
    }
    return null;
  }

  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    title: data.title,
  };
}

/**
 * Get display name for investor
 */
function getDisplayName(investor: InvestorData): string {
  if (investor.firstName && investor.lastName) {
    return `${investor.firstName} ${investor.lastName}`;
  }
  if (investor.firstName) {
    return investor.firstName;
  }
  if (investor.entityName) {
    return investor.entityName;
  }
  return 'Investor';
}

/**
 * Get manager display name
 */
function getManagerName(manager: ManagerData): string {
  if (manager.firstName && manager.lastName) {
    return `${manager.firstName} ${manager.lastName}`;
  }
  return manager.email;
}

/**
 * Format amount as currency string
 */
function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US');
}

// ============================================================
// URL Builders
// ============================================================

function getPortalUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
}

function getOnboardingUrl(investorId: string): string {
  return `${getPortalUrl()}/investor/onboarding`;
}

function getDocumentsUrl(): string {
  return `${getPortalUrl()}/investor/documents`;
}

function getInvestorDashboardUrl(): string {
  return `${getPortalUrl()}/investor`;
}

// ============================================================
// Email Trigger Class
// ============================================================

export class InvestorEmailTriggers {
  /**
   * Called when account invitation is sent (02.01.A1)
   * Triggers: Post-meeting proceed
   */
  async onAccountInviteSent(
    investorId: string,
    fundId: string,
    accountCreationUrl: string,
    postMeetingRecap: string | undefined,
    timestamp: Date
  ): Promise<void> {
    const investor = await getInvestor(investorId);
    const fund = await getFundSettings(fundId);
    const manager = await getManager(fundId);

    if (!investor || !fund || !manager) {
      console.error('[InvestorEmailTriggers] Missing data for account invite');
      return;
    }

    await emailService.sendAccountInvitationEnhanced(investor.email, {
      recipientName: getDisplayName(investor),
      fundName: fund.name,
      accountCreationUrl,
      postMeetingRecap,
      platformName: fund.platformName || 'Investor Portal',
      managerName: getManagerName(manager),
      managerTitle: manager.title || 'Fund Manager',
    });

    // Schedule onboarding reminders starting from account creation
    await investorJobScheduler.scheduleOnboardingReminders(investorId, fundId, timestamp);
  }

  /**
   * Called when verification code is requested (02.02.A1)
   * Triggers: User requests 2FA during account setup
   */
  async onVerificationCodeRequested(
    email: string,
    recipientName: string,
    verificationCode: string,
    expiresInMinutes: number
  ): Promise<void> {
    await emailService.sendVerificationCode(email, {
      recipientName,
      verificationCode,
      expiresInMinutes,
    });
  }

  /**
   * Called when account is created (02.02.A2)
   * Triggers: Account setup complete
   */
  async onAccountCreated(
    investorId: string,
    fundId: string
  ): Promise<void> {
    const investor = await getInvestor(investorId);
    const fund = await getFundSettings(fundId);

    if (!investor || !fund) {
      console.error('[InvestorEmailTriggers] Missing data for account created');
      return;
    }

    await emailService.sendAccountCreated(investor.email, {
      recipientName: getDisplayName(investor),
      fundName: fund.name,
      portalUrl: getPortalUrl(),
      onboardingUrl: getOnboardingUrl(investorId),
    });
  }

  /**
   * Called when profile is completed
   * Cancels onboarding reminders
   */
  async onProfileCompleted(investorId: string): Promise<void> {
    await investorJobScheduler.cancelOnboardingReminders(investorId);
  }

  /**
   * Called when a document is uploaded (02.03.B1)
   * Triggers: Doc uploaded by investor
   * Also sends internal notification to managers (07.02.A2)
   */
  async onDocumentUploaded(
    investorId: string,
    fundId: string,
    documentType: string,
    timestamp: Date
  ): Promise<void> {
    const investor = await getInvestor(investorId);
    const fund = await getFundSettings(fundId);

    if (!investor || !fund) {
      console.error('[InvestorEmailTriggers] Missing data for document uploaded');
      return;
    }

    // Send confirmation to investor
    await emailService.sendDocumentUploadedPending(investor.email, {
      recipientName: getDisplayName(investor),
      fundName: fund.name,
      documentType,
      reviewTimeframe: fund.documentReviewTimeframe || '1-2 business days',
      portalUrl: getDocumentsUrl(),
    });

    // Send internal notification to all managers (07.02.A2)
    try {
      const managerEmails = await getManagerEmailsForFund(fundId);
      const reviewDocumentUrl = `${getPortalUrl()}/manager/documents?investorId=${investorId}`;
      
      for (const managerEmail of managerEmails) {
        await emailService.sendInternalDocumentReview(managerEmail, {
          investorName: getDisplayName(investor),
          documentType,
          uploadTimestamp: timestamp.toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          fundName: fund.name,
          reviewDocumentUrl,
        });
      }
      
      if (managerEmails.length > 0) {
        console.log(`[InvestorEmailTriggers] Sent internal doc review notification to ${managerEmails.length} manager(s)`);
      }
    } catch (err) {
      // Don't fail the main flow if internal notification fails
      console.error('[InvestorEmailTriggers] Failed to send internal doc review notification:', err);
    }
  }

  /**
   * Called when a document is approved (02.03.A1)
   * Triggers: Fund ops approves doc
   */
  async onDocumentApproved(
    investorId: string,
    fundId: string,
    documentName: string,
    documentType: string
  ): Promise<void> {
    const investor = await getInvestor(investorId);
    const fund = await getFundSettings(fundId);

    if (!investor || !fund) {
      console.error('[InvestorEmailTriggers] Missing data for document approved');
      return;
    }

    await emailService.sendDocumentApproved(investor.email, {
      recipientName: getDisplayName(investor),
      fundName: fund.name,
      documentName,
      documentType,
      portalUrl: getDocumentsUrl(),
    });
  }

  /**
   * Called when a document is rejected (02.03.B2)
   * Triggers: Fund ops rejects doc
   */
  async onDocumentRejected(
    investorId: string,
    fundId: string,
    documentName: string,
    documentType: string,
    rejectionReason: string
  ): Promise<void> {
    const investor = await getInvestor(investorId);
    const fund = await getFundSettings(fundId);

    if (!investor || !fund) {
      console.error('[InvestorEmailTriggers] Missing data for document rejected');
      return;
    }

    await emailService.sendDocumentRejection(investor.email, {
      recipientName: getDisplayName(investor),
      fundName: fund.name,
      documentName,
      documentType,
      rejectionReason,
      portalUrl: getDocumentsUrl(),
    });
  }

  /**
   * Called when all documents are approved and ready for signature (02.04.A1)
   * Triggers: All docs approved
   */
  async onAllDocumentsApproved(
    investorId: string,
    fundId: string,
    docusignUrl: string,
    timestamp: Date
  ): Promise<void> {
    const investor = await getInvestor(investorId);
    const fund = await getFundSettings(fundId);

    if (!investor || !fund) {
      console.error('[InvestorEmailTriggers] Missing data for docs ready signature');
      return;
    }

    // Cancel any remaining onboarding reminders
    await investorJobScheduler.cancelOnboardingReminders(investorId);

    await emailService.sendDocumentsReadySignature(investor.email, {
      recipientName: getDisplayName(investor),
      fundName: fund.name,
      docusignUrl,
    });

    // Schedule signature reminders
    await investorJobScheduler.scheduleSignatureReminders(investorId, fundId, timestamp);
  }

  /**
   * Called when investor signs documents (02.04.B1/B2 suppression)
   * Triggers: Documents signed by investor
   */
  async onDocumentsSigned(investorId: string): Promise<void> {
    await investorJobScheduler.cancelSignatureReminders(investorId);
  }

  /**
   * Called when documents are fully executed (02.05.A1)
   * Triggers: Manager countersigns
   */
  async onDocumentsFullyExecuted(
    investorId: string,
    fundId: string
  ): Promise<void> {
    const investor = await getInvestor(investorId);
    const fund = await getFundSettings(fundId);

    if (!investor || !fund) {
      console.error('[InvestorEmailTriggers] Missing data for docs executed');
      return;
    }

    // Cancel any remaining signature reminders
    await investorJobScheduler.cancelSignatureReminders(investorId);

    await emailService.sendDocumentsFullyExecuted(investor.email, {
      recipientName: getDisplayName(investor),
      fundName: fund.name,
      portalUrl: getDocumentsUrl(),
    });
  }

  /**
   * Called to send funding instructions (02.06.A1)
   * Triggers: Docs executed
   */
  async onSendFundingInstructions(
    investorId: string,
    fundId: string,
    fundingDeadline: string,
    wireInstructions: {
      bankName: string;
      routingNumber: string;
      accountNumber: string;
      referenceCode: string;
    }
  ): Promise<void> {
    const investor = await getInvestor(investorId);
    const fund = await getFundSettings(fundId);

    if (!investor || !fund) {
      console.error('[InvestorEmailTriggers] Missing data for funding instructions');
      return;
    }

    await emailService.sendFundingInstructions(investor.email, {
      recipientName: getDisplayName(investor),
      fundName: fund.name,
      commitmentAmount: formatAmount(investor.commitmentAmount),
      fundingDeadline,
      bankName: wireInstructions.bankName,
      routingNumber: wireInstructions.routingNumber,
      accountNumber: wireInstructions.accountNumber,
      referenceCode: wireInstructions.referenceCode,
      portalUrl: getInvestorDashboardUrl(),
    });
  }

  /**
   * Called when funding is received with discrepancy (02.06.B1)
   * Triggers: Wire amount mismatch
   */
  async onFundingDiscrepancy(
    investorId: string,
    fundId: string,
    receivedAmount: number,
    varianceAmount: number
  ): Promise<void> {
    const investor = await getInvestor(investorId);
    const fund = await getFundSettings(fundId);
    const manager = await getManager(fundId);

    if (!investor || !fund || !manager) {
      console.error('[InvestorEmailTriggers] Missing data for funding discrepancy');
      return;
    }

    await emailService.sendFundingDiscrepancy(investor.email, {
      recipientName: getDisplayName(investor),
      fundName: fund.name,
      commitmentAmount: formatAmount(investor.commitmentAmount),
      receivedAmount: formatAmount(receivedAmount),
      varianceAmount: formatAmount(Math.abs(varianceAmount)),
      managerName: getManagerName(manager),
      managerTitle: manager.title || 'Fund Manager',
    });
  }

  /**
   * Called when funding is received and investment confirmed (02.07.A1)
   * Triggers: Funding received
   * Also sends internal notification to managers (07.02.A1)
   */
  async onFundingReceived(
    investorId: string,
    fundId: string,
    investmentAmount: number,
    investmentDate: string
  ): Promise<void> {
    const investor = await getInvestor(investorId);
    const fund = await getFundSettings(fundId);
    const manager = await getManager(fundId);

    if (!investor || !fund || !manager) {
      console.error('[InvestorEmailTriggers] Missing data for funding received');
      return;
    }

    // Cancel all pending emails
    await investorJobScheduler.cancelAllInvestorEmails(investorId);

    // Send welcome email to investor
    await emailService.sendWelcomeInvestorEnhanced(investor.email, {
      recipientName: getDisplayName(investor),
      fundName: fund.name,
      investmentAmount: formatAmount(investmentAmount),
      investmentDate,
      portalUrl: getInvestorDashboardUrl(),
      platformName: fund.platformName || 'Investor Portal',
      welcomeMessage: fund.welcomeMessage || undefined,
      managerName: getManagerName(manager),
      managerTitle: manager.title || 'Fund Manager',
    });

    // Send internal notification to all managers (07.02.A1)
    try {
      const managerEmails = await getManagerEmailsForFund(fundId);
      const viewInvestorUrl = `${getPortalUrl()}/manager/investors/${investorId}`;
      
      for (const managerEmail of managerEmails) {
        await emailService.sendInternalNewInvestor(managerEmail, {
          investorName: getDisplayName(investor),
          investmentAmount: formatAmount(investmentAmount),
          investmentDate,
          fundName: fund.name,
          viewInvestorUrl,
        });
      }
      
      if (managerEmails.length > 0) {
        console.log(`[InvestorEmailTriggers] Sent internal new investor notification to ${managerEmails.length} manager(s)`);
      }
    } catch (err) {
      // Don't fail the main flow if internal notification fails
      console.error('[InvestorEmailTriggers] Failed to send internal new investor notification:', err);
    }
  }

  /**
   * Handle status change - suppression logic
   */
  async onStatusChanged(
    investorId: string,
    newStatus: string,
    oldStatus: string
  ): Promise<void> {
    await investorJobScheduler.handleStatusChange(investorId, newStatus, oldStatus);
  }

  // ============================================================
  // Scheduled Email Handlers (called by worker)
  // ============================================================

  /**
   * Send scheduled onboarding reminder
   * Called by email worker for scheduled jobs
   */
  async sendScheduledOnboardingReminder(
    investorId: string,
    fundId: string,
    reminderNumber: 1 | 2 | 3
  ): Promise<void> {
    const investor = await getInvestor(investorId);
    const fund = await getFundSettings(fundId);

    if (!investor || !fund) {
      console.error('[InvestorEmailTriggers] Missing data for scheduled onboarding reminder');
      return;
    }

    // Check if investor has already completed profile
    if (investor.status !== 'account_created' && investor.status !== 'onboarding') {
      console.log(
        `[InvestorEmailTriggers] Skipping onboarding reminder ${reminderNumber} - investor ${investorId} status is ${investor.status}`
      );
      return;
    }

    const data = {
      recipientName: getDisplayName(investor),
      fundName: fund.name,
      onboardingUrl: getOnboardingUrl(investorId),
    };

    switch (reminderNumber) {
      case 1:
        await emailService.sendOnboardingReminder1(investor.email, data);
        break;
      case 2:
        await emailService.sendOnboardingReminder2(investor.email, data);
        break;
      case 3:
        await emailService.sendOnboardingReminder3(investor.email, data);
        break;
    }
  }

  /**
   * Send scheduled signature reminder
   * Called by email worker for scheduled jobs
   */
  async sendScheduledSignatureReminder(
    investorId: string,
    fundId: string,
    reminderNumber: 1 | 2
  ): Promise<void> {
    const investor = await getInvestor(investorId);
    const fund = await getFundSettings(fundId);

    if (!investor || !fund) {
      console.error('[InvestorEmailTriggers] Missing data for scheduled signature reminder');
      return;
    }

    // Check if investor has already signed
    if (investor.status !== 'documents_sent' && investor.status !== 'awaiting_signature') {
      console.log(
        `[InvestorEmailTriggers] Skipping signature reminder ${reminderNumber} - investor ${investorId} status is ${investor.status}`
      );
      return;
    }

    // Get the DocuSign URL - would typically be stored on investor or fetched from DocuSign
    const docusignUrl = `${getPortalUrl()}/investor/sign`;

    const data = {
      recipientName: getDisplayName(investor),
      fundName: fund.name,
      docusignUrl,
    };

    switch (reminderNumber) {
      case 1:
        await emailService.sendSignatureReminder1(investor.email, data);
        break;
      case 2:
        await emailService.sendSignatureReminder2(investor.email, data);
        break;
    }
  }
}

// Singleton instance
export const investorEmailTriggers = new InvestorEmailTriggers();
