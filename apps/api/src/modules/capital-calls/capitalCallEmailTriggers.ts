/**
 * Capital Call Email Triggers (Email Orchestration Layer)
 * Separates email logic from business logic for capital call workflows.
 * Handles capital calls, reminders, past due notices, distributions, and refinancing.
 * Follows Single Level of Abstraction principle.
 */

import { EmailService, SendEmailResult } from '../email/email.service';
import {
  emailLogger,
  AutomationType,
  TriggerEvent,
} from '../email/emailLogger';
import type {
  CapitalCallRequestTemplateData,
  WireConfirmationTemplateData,
  WireIssueTemplateData,
  CapitalCallReminderTemplateData,
  CapitalCallPastDueTemplateData,
  CapitalCallPastDue7TemplateData,
  CapitalCallDefaultTemplateData,
  DistributionNoticeTemplateData,
  DistributionSentTemplateData,
  DistributionElectionTemplateData,
  RefinanceNoticeTemplateData,
} from '../email/templates';
import { capitalCallJobScheduler } from './capitalCallJobScheduler';
import { supabaseAdmin } from '../../common/database/supabase';

// Base URL for email links
const getBaseUrl = (): string => {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
};

// ============================================================
// CONTEXT INTERFACES
// ============================================================

export interface CapitalCallContext {
  id: string;
  dealName: string;
  totalAmount: number;
  deadline: string;
  callNumber: string;
  purpose?: string;
}

export interface CapitalCallItemContext {
  id: string;
  amountDue: number;
  capitalCallId: string;
  status?: string;
}

export interface InvestorContext {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface FundContext {
  id: string;
  name: string;
  wireInstructions?: {
    bankName: string;
    routingNumber: string;
    accountNumber: string;
  };
  defaultSection?: string;
  legalDefaultNoticeContent?: string;
}

export interface ManagerContext {
  name: string;
  title: string;
  phone?: string;
}

export interface DistributionContext {
  id: string;
  fundId: string;
  amount: number;
  distributionType: string;
  paymentDate: string;
  paymentMethod: string;
  confirmationNumber?: string;
  dateSent?: string;
  arrivalTimeframe?: string;
}

export interface DistributionElectionContext {
  id: string;
  fundId: string;
  eligibleAmount: number;
  source: string;
  electionDeadline: string;
}

export interface RefinanceContext {
  id: string;
  fundId: string;
  propertyName: string;
  refinanceSummary: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Fetch capital call item with related data from database
 */
async function getCapitalCallItemWithContext(capitalCallItemId: string): Promise<{
  item: CapitalCallItemContext;
  capitalCall: CapitalCallContext;
  investor: InvestorContext;
  fund: FundContext;
} | null> {
  const { data, error } = await supabaseAdmin
    .from('capital_call_items')
    .select(`
      id,
      amount_due,
      capital_call_id,
      status,
      investor:investors!inner(id, email, first_name, last_name),
      capital_call:capital_calls!inner(
        id,
        call_number,
        deadline,
        total_amount,
        deal:deals(name),
        fund:funds!inner(id, name, wire_instructions, default_section, legal_default_notice_content)
      )
    `)
    .eq('id', capitalCallItemId)
    .single();

  if (error || !data) {
    console.error(`[CapitalCallEmailTriggers] Failed to fetch capital call item: ${error?.message}`);
    return null;
  }

  const capitalCallData = data.capital_call as any;
  const investorData = data.investor as any;
  const fundData = capitalCallData.fund as any;
  const dealData = capitalCallData.deal as any;

  return {
    item: {
      id: data.id,
      amountDue: data.amount_due,
      capitalCallId: data.capital_call_id,
      status: data.status,
    },
    capitalCall: {
      id: capitalCallData.id,
      callNumber: capitalCallData.call_number,
      deadline: capitalCallData.deadline,
      totalAmount: capitalCallData.total_amount,
      dealName: dealData?.name || 'Investment',
    },
    investor: {
      id: investorData.id,
      email: investorData.email,
      firstName: investorData.first_name,
      lastName: investorData.last_name,
    },
    fund: {
      id: fundData.id,
      name: fundData.name,
      wireInstructions: fundData.wire_instructions,
      defaultSection: fundData.default_section || 'Section 4.2',
      legalDefaultNoticeContent: fundData.legal_default_notice_content,
    },
  };
}

/**
 * Calculate days past due
 */
function calculateDaysPastDue(deadline: string, now: Date): number {
  const deadlineDate = new Date(deadline);
  const diffMs = now.getTime() - deadlineDate.getTime();
  return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
}

// ============================================================
// MAIN CLASS
// ============================================================

export class CapitalCallEmailTriggers {
  constructor(private emailService: EmailService) {}

  // ============================================================
  // CAPITAL CALL NOTICE
  // ============================================================

  /**
   * Trigger emails when a capital call is created - sends to all investors
   * Also schedules reminder emails for each investor
   */
  async onCapitalCallCreated(
    capitalCall: CapitalCallContext,
    investors: Array<InvestorContext & { amountDue: number; capitalCallItemId: string }>,
    fund: FundContext,
    timestamp: Date
  ): Promise<{ total: number; sent: number; failed: number }> {
    const results = { total: investors.length, sent: 0, failed: 0 };
    const deadline = new Date(capitalCall.deadline);

    for (const investor of investors) {
      // Send the capital call notice
      const result = await this.sendCapitalCallRequest(
        capitalCall,
        investor,
        investor.amountDue,
        fund,
        timestamp
      );

      if (result.success) {
        results.sent++;

        // Schedule reminder emails
        await capitalCallJobScheduler.scheduleCapitalCallReminders(
          investor.capitalCallItemId,
          investor.id,
          fund.id,
          deadline,
          timestamp
        );

        // Schedule past due emails
        await capitalCallJobScheduler.schedulePastDueEmails(
          investor.capitalCallItemId,
          investor.id,
          fund.id,
          deadline,
          timestamp
        );
      } else {
        results.failed++;
      }
    }

    console.log(
      `[CapitalCallEmailTriggers] Capital call emails sent: ${results.sent}/${results.total}, failed: ${results.failed}`
    );

    return results;
  }

  /**
   * Send a capital call request email to a single investor
   */
  async sendCapitalCallRequest(
    capitalCall: CapitalCallContext,
    investor: InvestorContext,
    amountDue: number,
    fund: FundContext,
    timestamp: Date
  ): Promise<SendEmailResult> {
    const recipientName = this.formatName(investor.firstName, investor.lastName);
    const wireInstructionsUrl = `${getBaseUrl()}/investor/capital-calls/${capitalCall.id}`;
    const referenceCode = `CC-${capitalCall.callNumber}-${investor.id.substring(0, 8).toUpperCase()}`;

    const templateData: CapitalCallRequestTemplateData = {
      recipientName,
      fundName: fund.name,
      dealName: capitalCall.dealName,
      amountDue: amountDue.toLocaleString(),
      deadline: capitalCall.deadline,
      capitalCallNumber: capitalCall.callNumber,
      wireInstructionsUrl,
      wireInstructions: {
        bankName: fund.wireInstructions?.bankName || 'Contact fund manager',
        routingNumber: fund.wireInstructions?.routingNumber || 'Contact fund manager',
        accountNumber: fund.wireInstructions?.accountNumber || 'Contact fund manager',
        referenceCode,
      },
      purpose: capitalCall.purpose,
    };

    const subject = `Capital Call Notice - ${fund.name}`;

    console.log(`[CapitalCallEmailTriggers] Sending capital call email to ${investor.email}`);
    const result = await this.emailService.sendCapitalCallRequest(investor.email, templateData);

    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'capital_call_request',
      automationType: 'capital_call_request' as AutomationType,
      triggerEvent: 'manager_created_capital_call' as TriggerEvent,
      recipientEmail: investor.email,
      subject,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'capital_call',
      relatedEntityId: capitalCall.id,
      metadata: { amountDue, deadline: capitalCall.deadline, dealName: capitalCall.dealName, capitalCallNumber: capitalCall.callNumber },
      timestamp,
    });

    return result;
  }

  // ============================================================
  // WIRE CONFIRMATION
  // ============================================================

  /**
   * Trigger email when wire is confirmed for a capital call
   * Also cancels all pending reminder and past due emails
   */
  async onWireConfirmed(
    capitalCallItem: CapitalCallItemContext,
    investor: InvestorContext,
    fund: FundContext,
    amountReceived: number,
    capitalCallNumber: string,
    timestamp: Date
  ): Promise<SendEmailResult> {
    // Cancel all pending emails for this capital call item
    await capitalCallJobScheduler.cancelAllCapitalCallEmails(capitalCallItem.id);

    const recipientName = this.formatName(investor.firstName, investor.lastName);
    const dashboardUrl = `${getBaseUrl()}/investor/dashboard`;
    const confirmationNumber = `CONF-${Date.now().toString(36).toUpperCase()}-${capitalCallItem.id.substring(0, 6).toUpperCase()}`;

    const templateData: WireConfirmationTemplateData = {
      recipientName,
      fundName: fund.name,
      amountReceived: amountReceived.toLocaleString(),
      dateReceived: timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      capitalCallNumber,
      confirmationNumber,
      dashboardUrl,
    };

    const subject = `Wire Transfer Received - ${fund.name}`;

    console.log(`[CapitalCallEmailTriggers] Sending wire confirmation email to ${investor.email}`);
    const result = await this.emailService.sendWireConfirmation(investor.email, templateData);

    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'wire_confirmation',
      automationType: 'wire_confirmation' as AutomationType,
      triggerEvent: 'manager_confirmed_wire' as TriggerEvent,
      recipientEmail: investor.email,
      subject,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'capital_call_item',
      relatedEntityId: capitalCallItem.id,
      metadata: { amountReceived, capitalCallNumber, confirmationNumber },
      timestamp,
    });

    return result;
  }

  // ============================================================
  // WIRE ISSUE
  // ============================================================

  /**
   * Trigger email when there's an issue with a wire transfer
   */
  async onWireIssue(
    capitalCallItem: CapitalCallItemContext,
    investor: InvestorContext,
    fund: FundContext,
    issueDescription: string,
    capitalCallNumber: string,
    expectedAmount: number | undefined,
    receivedAmount: number | undefined,
    timestamp: Date
  ): Promise<SendEmailResult> {
    const recipientName = this.formatName(investor.firstName, investor.lastName);
    const wireInstructionsUrl = `${getBaseUrl()}/investor/capital-calls/${capitalCallItem.capitalCallId}`;
    const referenceCode = `CC-${capitalCallNumber}-${investor.id.substring(0, 8).toUpperCase()}`;

    const templateData: WireIssueTemplateData = {
      recipientName,
      fundName: fund.name,
      issueDescription,
      expectedAmount: expectedAmount?.toLocaleString(),
      receivedAmount: receivedAmount?.toLocaleString(),
      capitalCallNumber,
      wireInstructionsUrl,
      wireInstructions: {
        bankName: fund.wireInstructions?.bankName || 'Contact fund manager',
        routingNumber: fund.wireInstructions?.routingNumber || 'Contact fund manager',
        accountNumber: fund.wireInstructions?.accountNumber || 'Contact fund manager',
        referenceCode,
      },
    };

    const subject = `Action Required - Wire Transfer Issue - ${fund.name}`;

    console.log(`[CapitalCallEmailTriggers] Sending wire issue email to ${investor.email}`);
    const result = await this.emailService.sendWireIssue(investor.email, templateData);

    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'wire_issue',
      automationType: 'wire_issue' as AutomationType,
      triggerEvent: 'manager_reported_wire_issue' as TriggerEvent,
      recipientEmail: investor.email,
      subject,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'capital_call_item',
      relatedEntityId: capitalCallItem.id,
      metadata: { issueDescription, expectedAmount, receivedAmount, capitalCallNumber },
      timestamp,
    });

    return result;
  }

  // ============================================================
  // SCHEDULED REMINDER METHODS (Called by EmailWorker)
  // ============================================================

  /**
   * Send 7-day reminder email (called by worker)
   */
  async sendScheduledReminder7d(capitalCallItemId: string, timestamp: Date): Promise<SendEmailResult | null> {
    const context = await getCapitalCallItemWithContext(capitalCallItemId);
    if (!context) return null;

    // Check if item is still pending
    if (context.item.status === 'paid' || context.item.status === 'cancelled') {
      console.log(`[CapitalCallEmailTriggers] Skipping 7d reminder - item ${capitalCallItemId} is ${context.item.status}`);
      return { success: true, messageId: 'skipped' };
    }

    const { investor, fund, capitalCall, item } = context;
    const recipientName = this.formatName(investor.firstName, investor.lastName);

    const templateData: CapitalCallReminderTemplateData = {
      recipientName,
      fundName: fund.name,
      amountDue: item.amountDue.toLocaleString(),
      deadline: capitalCall.deadline,
      capitalCallNumber: capitalCall.callNumber,
      wireInstructionsUrl: `${getBaseUrl()}/investor/capital-calls/${capitalCall.id}`,
    };

    const result = await this.emailService.sendCapitalCallReminder7(investor.email, templateData);

    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'capital_call_reminder_7d',
      automationType: 'capital_call_reminder' as AutomationType,
      triggerEvent: 'scheduled_reminder_7d' as TriggerEvent,
      recipientEmail: investor.email,
      subject: `Capital Call Reminder - 7 Days Remaining - ${fund.name}`,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'capital_call_item',
      relatedEntityId: capitalCallItemId,
      metadata: { amountDue: item.amountDue, deadline: capitalCall.deadline },
      timestamp,
    });

    return result;
  }

  /**
   * Send 3-day reminder email (called by worker)
   */
  async sendScheduledReminder3d(capitalCallItemId: string, timestamp: Date): Promise<SendEmailResult | null> {
    const context = await getCapitalCallItemWithContext(capitalCallItemId);
    if (!context) return null;

    if (context.item.status === 'paid' || context.item.status === 'cancelled') {
      console.log(`[CapitalCallEmailTriggers] Skipping 3d reminder - item ${capitalCallItemId} is ${context.item.status}`);
      return { success: true, messageId: 'skipped' };
    }

    const { investor, fund, capitalCall, item } = context;
    const recipientName = this.formatName(investor.firstName, investor.lastName);

    const templateData: CapitalCallReminderTemplateData = {
      recipientName,
      fundName: fund.name,
      amountDue: item.amountDue.toLocaleString(),
      deadline: capitalCall.deadline,
      capitalCallNumber: capitalCall.callNumber,
      wireInstructionsUrl: `${getBaseUrl()}/investor/capital-calls/${capitalCall.id}`,
    };

    const result = await this.emailService.sendCapitalCallReminder3(investor.email, templateData);

    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'capital_call_reminder_3d',
      automationType: 'capital_call_reminder' as AutomationType,
      triggerEvent: 'scheduled_reminder_3d' as TriggerEvent,
      recipientEmail: investor.email,
      subject: `Capital Call Reminder - 3 Days Remaining - ${fund.name}`,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'capital_call_item',
      relatedEntityId: capitalCallItemId,
      metadata: { amountDue: item.amountDue, deadline: capitalCall.deadline },
      timestamp,
    });

    return result;
  }

  /**
   * Send 1-day reminder email (called by worker)
   */
  async sendScheduledReminder1d(capitalCallItemId: string, timestamp: Date): Promise<SendEmailResult | null> {
    const context = await getCapitalCallItemWithContext(capitalCallItemId);
    if (!context) return null;

    if (context.item.status === 'paid' || context.item.status === 'cancelled') {
      console.log(`[CapitalCallEmailTriggers] Skipping 1d reminder - item ${capitalCallItemId} is ${context.item.status}`);
      return { success: true, messageId: 'skipped' };
    }

    const { investor, fund, capitalCall, item } = context;
    const recipientName = this.formatName(investor.firstName, investor.lastName);

    const templateData: CapitalCallReminderTemplateData = {
      recipientName,
      fundName: fund.name,
      amountDue: item.amountDue.toLocaleString(),
      deadline: capitalCall.deadline,
      capitalCallNumber: capitalCall.callNumber,
      wireInstructionsUrl: `${getBaseUrl()}/investor/capital-calls/${capitalCall.id}`,
    };

    const result = await this.emailService.sendCapitalCallReminder1(investor.email, templateData);

    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'capital_call_reminder_1d',
      automationType: 'capital_call_reminder' as AutomationType,
      triggerEvent: 'scheduled_reminder_1d' as TriggerEvent,
      recipientEmail: investor.email,
      subject: `REMINDER: Capital Call Due Tomorrow - ${fund.name}`,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'capital_call_item',
      relatedEntityId: capitalCallItemId,
      metadata: { amountDue: item.amountDue, deadline: capitalCall.deadline },
      timestamp,
    });

    return result;
  }

  // ============================================================
  // PAST DUE METHODS
  // ============================================================

  /**
   * Send past due email (called by worker)
   */
  async sendScheduledPastDue(capitalCallItemId: string, timestamp: Date): Promise<SendEmailResult | null> {
    const context = await getCapitalCallItemWithContext(capitalCallItemId);
    if (!context) return null;

    if (context.item.status === 'paid' || context.item.status === 'cancelled') {
      console.log(`[CapitalCallEmailTriggers] Skipping past due - item ${capitalCallItemId} is ${context.item.status}`);
      return { success: true, messageId: 'skipped' };
    }

    const { investor, fund, capitalCall, item } = context;
    const recipientName = this.formatName(investor.firstName, investor.lastName);
    const daysPastDue = calculateDaysPastDue(capitalCall.deadline, timestamp);

    const templateData: CapitalCallPastDueTemplateData = {
      recipientName,
      fundName: fund.name,
      amountDue: item.amountDue.toLocaleString(),
      deadline: capitalCall.deadline,
      daysPastDue: daysPastDue.toString(),
      capitalCallNumber: capitalCall.callNumber,
      wireInstructionsUrl: `${getBaseUrl()}/investor/capital-calls/${capitalCall.id}`,
      managerName: 'Fund Manager', // Would come from fund settings
      managerTitle: 'Managing Partner',
    };

    const result = await this.emailService.sendCapitalCallPastDue(investor.email, templateData);

    // Update tracking field
    await supabaseAdmin
      .from('capital_call_items')
      .update({ past_due_email_sent_at: timestamp.toISOString() })
      .eq('id', capitalCallItemId);

    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'capital_call_past_due',
      automationType: 'capital_call_past_due' as AutomationType,
      triggerEvent: 'deadline_passed' as TriggerEvent,
      recipientEmail: investor.email,
      subject: `URGENT: Capital Call Past Due - ${fund.name}`,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'capital_call_item',
      relatedEntityId: capitalCallItemId,
      metadata: { amountDue: item.amountDue, deadline: capitalCall.deadline, daysPastDue },
      timestamp,
    });

    return result;
  }

  /**
   * Send +7 days past due email (called by worker)
   */
  async sendScheduledPastDue7(capitalCallItemId: string, timestamp: Date): Promise<SendEmailResult | null> {
    const context = await getCapitalCallItemWithContext(capitalCallItemId);
    if (!context) return null;

    if (context.item.status === 'paid' || context.item.status === 'cancelled' || context.item.status === 'defaulted') {
      console.log(`[CapitalCallEmailTriggers] Skipping past due +7 - item ${capitalCallItemId} is ${context.item.status}`);
      return { success: true, messageId: 'skipped' };
    }

    const { investor, fund, capitalCall, item } = context;
    const recipientName = this.formatName(investor.firstName, investor.lastName);
    const daysPastDue = calculateDaysPastDue(capitalCall.deadline, timestamp);

    const templateData: CapitalCallPastDue7TemplateData = {
      recipientName,
      fundName: fund.name,
      amountDue: item.amountDue.toLocaleString(),
      deadline: capitalCall.deadline,
      daysPastDue: daysPastDue.toString(),
      capitalCallNumber: capitalCall.callNumber,
      defaultSection: fund.defaultSection || 'Section 4.2',
      managerName: 'Fund Manager',
      managerPhone: 'Contact support',
    };

    const result = await this.emailService.sendCapitalCallPastDue7(investor.email, templateData);

    // Update tracking field
    await supabaseAdmin
      .from('capital_call_items')
      .update({ past_due_7_email_sent_at: timestamp.toISOString() })
      .eq('id', capitalCallItemId);

    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'capital_call_past_due_7',
      automationType: 'capital_call_past_due' as AutomationType,
      triggerEvent: 'past_due_7_days' as TriggerEvent,
      recipientEmail: investor.email,
      subject: `URGENT: Capital Call 7+ Days Past Due - ${fund.name}`,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'capital_call_item',
      relatedEntityId: capitalCallItemId,
      metadata: { amountDue: item.amountDue, deadline: capitalCall.deadline, daysPastDue },
      timestamp,
    });

    return result;
  }

  // ============================================================
  // DEFAULT NOTICE
  // ============================================================

  /**
   * Send default notice when manager initiates default proceedings
   */
  async onDefaultInitiated(
    capitalCallItem: CapitalCallItemContext,
    investor: InvestorContext,
    fund: FundContext,
    capitalCallNumber: string,
    timestamp: Date
  ): Promise<SendEmailResult> {
    // Cancel any pending past due emails
    await capitalCallJobScheduler.cancelPastDueEmails(capitalCallItem.id);

    const recipientName = this.formatName(investor.firstName, investor.lastName);
    const daysPastDue = calculateDaysPastDue(timestamp.toISOString(), timestamp);

    const templateData: CapitalCallDefaultTemplateData = {
      recipientName,
      fundName: fund.name,
      amountDue: capitalCallItem.amountDue.toLocaleString(),
      daysPastDue: daysPastDue.toString(),
      capitalCallNumber,
      defaultSection: fund.defaultSection || 'Section 4.2',
      legalDefaultNoticeContent: fund.legalDefaultNoticeContent || 
        '<p>Per the Operating Agreement, your failure to fund this capital call constitutes a default. ' +
        'You may be subject to penalties including but not limited to: forfeiture of a portion of your interest, ' +
        'reduction of your capital account, and liability for damages to the Fund.</p>',
    };

    const result = await this.emailService.sendCapitalCallDefault(investor.email, templateData);

    // Update tracking fields
    await supabaseAdmin
      .from('capital_call_items')
      .update({ 
        default_initiated_at: timestamp.toISOString(),
        default_notice_sent_at: result.success ? timestamp.toISOString() : null,
      })
      .eq('id', capitalCallItem.id);

    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'capital_call_default',
      automationType: 'capital_call_default' as AutomationType,
      triggerEvent: 'manager_initiated_default' as TriggerEvent,
      recipientEmail: investor.email,
      subject: `Notice of Default - Capital Call #${capitalCallNumber} - ${fund.name}`,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'capital_call_item',
      relatedEntityId: capitalCallItem.id,
      metadata: { amountDue: capitalCallItem.amountDue, capitalCallNumber },
      timestamp,
    });

    return result;
  }

  // ============================================================
  // DISTRIBUTION METHODS
  // ============================================================

  /**
   * Send distribution notice when distribution is approved
   */
  async onDistributionApproved(
    distribution: DistributionContext,
    investor: InvestorContext,
    fund: FundContext,
    timestamp: Date
  ): Promise<SendEmailResult> {
    const recipientName = this.formatName(investor.firstName, investor.lastName);

    const templateData: DistributionNoticeTemplateData = {
      recipientName,
      fundName: fund.name,
      distributionAmount: distribution.amount.toLocaleString(),
      distributionType: distribution.distributionType,
      paymentDate: distribution.paymentDate,
      paymentMethod: distribution.paymentMethod,
      distributionDetailsUrl: `${getBaseUrl()}/investor/distributions/${distribution.id}`,
    };

    const result = await this.emailService.sendDistributionNotice(investor.email, templateData);

    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'distribution_notice',
      automationType: 'distribution_notice' as AutomationType,
      triggerEvent: 'distribution_approved' as TriggerEvent,
      recipientEmail: investor.email,
      subject: `Distribution Notice - ${fund.name}`,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'distribution',
      relatedEntityId: distribution.id,
      metadata: { amount: distribution.amount, distributionType: distribution.distributionType },
      timestamp,
    });

    return result;
  }

  /**
   * Send distribution sent notification when wire/ACH is initiated
   */
  async onDistributionSent(
    distribution: DistributionContext,
    investor: InvestorContext,
    fund: FundContext,
    timestamp: Date
  ): Promise<SendEmailResult> {
    const recipientName = this.formatName(investor.firstName, investor.lastName);

    const templateData: DistributionSentTemplateData = {
      recipientName,
      fundName: fund.name,
      distributionAmount: distribution.amount.toLocaleString(),
      dateSent: distribution.dateSent || timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      paymentMethod: distribution.paymentMethod,
      confirmationNumber: distribution.confirmationNumber || `DIST-${Date.now().toString(36).toUpperCase()}`,
      arrivalTimeframe: distribution.arrivalTimeframe || '1-3 business days',
      portalUrl: `${getBaseUrl()}/investor/distributions`,
    };

    const result = await this.emailService.sendDistributionSent(investor.email, templateData);

    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'distribution_sent',
      automationType: 'distribution_sent' as AutomationType,
      triggerEvent: 'distribution_wire_initiated' as TriggerEvent,
      recipientEmail: investor.email,
      subject: `Distribution Sent - ${fund.name}`,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'distribution',
      relatedEntityId: distribution.id,
      metadata: { amount: distribution.amount, paymentMethod: distribution.paymentMethod },
      timestamp,
    });

    return result;
  }

  /**
   * Send distribution election request when proceeds require election
   */
  async onDistributionElectionRequired(
    election: DistributionElectionContext,
    investor: InvestorContext,
    fund: FundContext,
    timestamp: Date
  ): Promise<SendEmailResult> {
    const recipientName = this.formatName(investor.firstName, investor.lastName);

    const templateData: DistributionElectionTemplateData = {
      recipientName,
      fundName: fund.name,
      eligibleAmount: election.eligibleAmount.toLocaleString(),
      source: election.source,
      electionDeadline: election.electionDeadline,
      receiveDistributionUrl: `${getBaseUrl()}/investor/elections/${election.id}?action=distribute`,
      reinvestUrl: `${getBaseUrl()}/investor/elections/${election.id}?action=reinvest`,
    };

    const result = await this.emailService.sendDistributionElection(investor.email, templateData);

    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'distribution_election',
      automationType: 'distribution_election' as AutomationType,
      triggerEvent: 'election_required' as TriggerEvent,
      recipientEmail: investor.email,
      subject: `Distribution Election Required - ${fund.name}`,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'distribution_election',
      relatedEntityId: election.id,
      metadata: { eligibleAmount: election.eligibleAmount, source: election.source },
      timestamp,
    });

    return result;
  }

  // ============================================================
  // REFINANCE NOTICE
  // ============================================================

  /**
   * Send refinance notice when refinance is completed
   */
  async onRefinanceCompleted(
    refinance: RefinanceContext,
    investor: InvestorContext,
    fund: FundContext,
    timestamp: Date
  ): Promise<SendEmailResult> {
    const recipientName = this.formatName(investor.firstName, investor.lastName);

    const templateData: RefinanceNoticeTemplateData = {
      recipientName,
      fundName: fund.name,
      propertyName: refinance.propertyName,
      refinanceSummary: refinance.refinanceSummary,
      propertyDetailsUrl: `${getBaseUrl()}/investor/properties/${refinance.id}`,
    };

    const result = await this.emailService.sendRefinanceNotice(investor.email, templateData);

    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'refinance_notice',
      automationType: 'refinance_notice' as AutomationType,
      triggerEvent: 'refinance_completed' as TriggerEvent,
      recipientEmail: investor.email,
      subject: `Refinance Completed - ${refinance.propertyName} - ${fund.name}`,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'refinance_notice',
      relatedEntityId: refinance.id,
      metadata: { propertyName: refinance.propertyName },
      timestamp,
    });

    return result;
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  /**
   * Format investor name for email greeting
   */
  private formatName(firstName: string, lastName: string): string {
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    return fullName || 'Investor';
  }
}

// Export singleton instance
import { emailService } from '../email/email.service';
export const capitalCallEmailTriggers = new CapitalCallEmailTriggers(emailService);
