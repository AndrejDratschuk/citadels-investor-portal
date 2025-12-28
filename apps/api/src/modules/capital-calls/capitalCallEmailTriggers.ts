/**
 * Capital Call Email Triggers (Email Orchestration Layer)
 * Separates email logic from business logic for capital call workflows.
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
} from '../email/templates';

// Base URL for email links
const getBaseUrl = (): string => {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
};

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
}

export class CapitalCallEmailTriggers {
  constructor(private emailService: EmailService) {}

  /**
   * Trigger emails when a capital call is created - sends to all investors
   */
  async onCapitalCallCreated(
    capitalCall: CapitalCallContext,
    investors: Array<InvestorContext & { amountDue: number }>,
    fund: FundContext,
    timestamp: Date
  ): Promise<{ total: number; sent: number; failed: number }> {
    const results = { total: investors.length, sent: 0, failed: 0 };

    for (const investor of investors) {
      const result = await this.sendCapitalCallRequest(
        capitalCall,
        investor,
        investor.amountDue,
        fund,
        timestamp
      );
      if (result.success) {
        results.sent++;
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

    // Generate a reference code for the wire
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

    // Log the automation execution
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
      metadata: {
        amountDue,
        deadline: capitalCall.deadline,
        dealName: capitalCall.dealName,
        capitalCallNumber: capitalCall.callNumber,
      },
      timestamp,
    });

    return result;
  }

  /**
   * Trigger email when wire is confirmed for a capital call
   */
  async onWireConfirmed(
    capitalCallItem: CapitalCallItemContext,
    investor: InvestorContext,
    fund: FundContext,
    amountReceived: number,
    capitalCallNumber: string,
    timestamp: Date
  ): Promise<SendEmailResult> {
    const recipientName = this.formatName(investor.firstName, investor.lastName);
    const dashboardUrl = `${getBaseUrl()}/investor/dashboard`;

    // Generate confirmation number
    const confirmationNumber = `CONF-${Date.now().toString(36).toUpperCase()}-${capitalCallItem.id.substring(0, 6).toUpperCase()}`;

    const templateData: WireConfirmationTemplateData = {
      recipientName,
      fundName: fund.name,
      amountReceived: amountReceived.toLocaleString(),
      dateReceived: timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      capitalCallNumber,
      confirmationNumber,
      dashboardUrl,
    };

    const subject = `Wire Transfer Received - ${fund.name}`;

    console.log(`[CapitalCallEmailTriggers] Sending wire confirmation email to ${investor.email}`);
    const result = await this.emailService.sendWireConfirmation(investor.email, templateData);

    // Log the automation execution
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
      metadata: {
        amountReceived,
        capitalCallNumber,
        confirmationNumber,
      },
      timestamp,
    });

    if (result.success) {
      console.log(`[CapitalCallEmailTriggers] Wire confirmation email sent to ${investor.email}`);
    } else {
      console.error(`[CapitalCallEmailTriggers] Failed to send wire confirmation email: ${result.error}`);
    }

    return result;
  }

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

    // Generate reference code
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

    // Log the automation execution
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
      metadata: {
        issueDescription,
        expectedAmount,
        receivedAmount,
        capitalCallNumber,
      },
      timestamp,
    });

    if (result.success) {
      console.log(`[CapitalCallEmailTriggers] Wire issue email sent to ${investor.email}`);
    } else {
      console.error(`[CapitalCallEmailTriggers] Failed to send wire issue email: ${result.error}`);
    }

    return result;
  }

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

