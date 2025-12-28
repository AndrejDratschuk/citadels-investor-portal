/**
 * Document Email Triggers (Email Orchestration Layer)
 * Separates email logic from business logic for document-related workflows.
 * Follows Single Level of Abstraction principle.
 */

import { EmailService, SendEmailResult } from '../email/email.service';
import {
  emailLogger,
  AutomationType,
  TriggerEvent,
} from '../email/emailLogger';
import type {
  DocumentApprovedTemplateData,
  DocumentRejectionTemplateData,
  DocumentsApprovedDocuSignTemplateData,
} from '../email/templates';

// Base URL for email links
const getBaseUrl = (): string => {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
};

export interface DocumentContext {
  id: string;
  name: string;
  type: string;
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
}

// Type adapters for converting service types to our context types
export function toInvestorContext(ctx: { investorId: string; email: string; firstName: string; lastName: string }): InvestorContext {
  return {
    id: ctx.investorId,
    email: ctx.email,
    firstName: ctx.firstName,
    lastName: ctx.lastName,
  };
}

export function toFundContext(ctx: { fundId: string; name: string }): FundContext {
  return {
    id: ctx.fundId,
    name: ctx.name,
  };
}

export class DocumentEmailTriggers {
  constructor(private emailService: EmailService) {}

  /**
   * Trigger email when a document is approved
   */
  async onDocumentApproved(
    document: DocumentContext,
    investor: InvestorContext,
    fund: FundContext,
    timestamp: Date
  ): Promise<SendEmailResult> {
    const recipientName = this.formatName(investor.firstName, investor.lastName);
    const portalUrl = `${getBaseUrl()}/investor/documents`;

    const templateData: DocumentApprovedTemplateData = {
      recipientName,
      fundName: fund.name,
      documentName: document.name,
      documentType: document.type,
      portalUrl,
    };

    const subject = `Document Approved - ${fund.name}`;

    console.log(`[DocumentEmailTriggers] Sending document approved email to ${investor.email}`);
    const result = await this.emailService.sendDocumentApproved(investor.email, templateData);

    // Log the automation execution
    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'document_approved',
      automationType: 'document_approval' as AutomationType,
      triggerEvent: 'manager_approved_document' as TriggerEvent,
      recipientEmail: investor.email,
      subject,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'document',
      relatedEntityId: document.id,
      metadata: {
        documentName: document.name,
        documentType: document.type,
      },
      timestamp,
    });

    if (result.success) {
      console.log(`[DocumentEmailTriggers] Document approved email sent to ${investor.email}`);
    } else {
      console.error(`[DocumentEmailTriggers] Failed to send document approved email: ${result.error}`);
    }

    return result;
  }

  /**
   * Trigger email when a document is rejected
   */
  async onDocumentRejected(
    document: DocumentContext,
    investor: InvestorContext,
    fund: FundContext,
    rejectionReason: string,
    timestamp: Date
  ): Promise<SendEmailResult> {
    const recipientName = this.formatName(investor.firstName, investor.lastName);
    const portalUrl = `${getBaseUrl()}/investor/documents`;

    const templateData: DocumentRejectionTemplateData = {
      recipientName,
      fundName: fund.name,
      documentName: document.name,
      documentType: document.type,
      rejectionReason,
      portalUrl,
    };

    const subject = `Document Requires Attention - ${fund.name}`;

    console.log(`[DocumentEmailTriggers] Sending document rejected email to ${investor.email}`);
    const result = await this.emailService.sendDocumentRejection(investor.email, templateData);

    // Log the automation execution
    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'document_rejection',
      automationType: 'document_rejection' as AutomationType,
      triggerEvent: 'manager_rejected_document' as TriggerEvent,
      recipientEmail: investor.email,
      subject,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'document',
      relatedEntityId: document.id,
      metadata: {
        documentName: document.name,
        documentType: document.type,
        rejectionReason,
      },
      timestamp,
    });

    if (result.success) {
      console.log(`[DocumentEmailTriggers] Document rejected email sent to ${investor.email}`);
    } else {
      console.error(`[DocumentEmailTriggers] Failed to send document rejected email: ${result.error}`);
    }

    return result;
  }

  /**
   * Trigger email when all validation documents are approved (ready for DocuSign)
   */
  async onAllDocumentsApproved(
    investor: InvestorContext,
    fund: FundContext,
    docusignUrl: string,
    commitmentAmount: number | undefined,
    timestamp: Date
  ): Promise<SendEmailResult> {
    const recipientName = this.formatName(investor.firstName, investor.lastName);

    const templateData: DocumentsApprovedDocuSignTemplateData = {
      recipientName,
      fundName: fund.name,
      docusignUrl,
      commitmentAmount: commitmentAmount?.toLocaleString(),
    };

    const subject = `Documents Ready for Signature - ${fund.name}`;

    console.log(`[DocumentEmailTriggers] Sending DocuSign ready email to ${investor.email}`);
    const result = await this.emailService.sendDocumentsApprovedDocuSign(investor.email, templateData);

    // Log the automation execution
    await emailLogger.log({
      fundId: fund.id,
      investorId: investor.id,
      emailType: 'documents_approved_docusign',
      automationType: 'documents_approved_docusign' as AutomationType,
      triggerEvent: 'all_documents_approved' as TriggerEvent,
      recipientEmail: investor.email,
      subject,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      errorMessage: result.error,
      relatedEntityType: 'investor',
      relatedEntityId: investor.id,
      metadata: {
        commitmentAmount,
        hasDocusignUrl: !!docusignUrl,
      },
      timestamp,
    });

    if (result.success) {
      console.log(`[DocumentEmailTriggers] DocuSign ready email sent to ${investor.email}`);
    } else {
      console.error(`[DocumentEmailTriggers] Failed to send DocuSign ready email: ${result.error}`);
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
export const documentEmailTriggers = new DocumentEmailTriggers(emailService);

