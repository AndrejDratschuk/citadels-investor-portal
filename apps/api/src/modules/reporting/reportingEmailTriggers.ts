/**
 * Reporting & Tax Email Triggers (Email Orchestration Layer)
 * Separates email logic from business logic for reporting workflows.
 * Handles quarterly/annual reports, meeting invites, property updates, and K-1 documents.
 * Follows Single Level of Abstraction principle.
 */

import { EmailService, SendEmailResult } from '../email/email.service';
import {
  emailLogger,
  AutomationType,
  TriggerEvent,
} from '../email/emailLogger';
import type {
  QuarterlyReportTemplateData,
  AnnualReportTemplateData,
  AnnualMeetingInviteTemplateData,
  PropertyAcquisitionTemplateData,
  PropertyDispositionTemplateData,
  K1AvailableTemplateData,
  K1EstimateTemplateData,
  K1AmendedTemplateData,
} from '../email/templates';
import { supabaseAdmin } from '../../common/database/supabase';

// Base URL for email links
const getBaseUrl = (): string => {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
};

// ============================================================
// CONTEXT INTERFACES
// ============================================================

export interface FundReportContext {
  id: string;
  fundId: string;
  reportType: 'quarterly' | 'annual';
  periodYear: number;
  periodQuarter?: number;
  title: string;
  summaryContent?: string;
  filePath?: string;
}

export interface InvestorMeetingContext {
  id: string;
  fundId: string;
  meetingYear: number;
  title: string;
  meetingDate: string;
  meetingTime: string;
  timezone: string;
  meetingFormat: string;
  agendaPreview?: string;
  rsvpUrl?: string;
}

export interface K1DocumentContext {
  id: string;
  fundId: string;
  investorId: string;
  taxYear: number;
  documentType: 'final' | 'estimate' | 'amended';
  filePath?: string;
  expectedFinalDate?: string;
  amendmentReason?: string;
}

export interface PropertyAnnouncementContext {
  id: string;
  fundId: string;
  dealId: string;
  announcementType: 'acquisition' | 'disposition';
  summaryContent: string;
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

export interface DealContext {
  id: string;
  name: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Fetch all investors for a fund
 */
async function getFundInvestors(fundId: string): Promise<InvestorContext[]> {
  const { data, error } = await supabaseAdmin
    .from('investors')
    .select('id, email, first_name, last_name')
    .eq('fund_id', fundId)
    .eq('status', 'active');

  if (error || !data) {
    console.error(`[ReportingEmailTriggers] Failed to fetch fund investors: ${error?.message}`);
    return [];
  }

  return data.map((inv) => ({
    id: inv.id,
    email: inv.email,
    firstName: inv.first_name,
    lastName: inv.last_name,
  }));
}

/**
 * Fetch fund details
 */
async function getFundDetails(fundId: string): Promise<FundContext | null> {
  const { data, error } = await supabaseAdmin
    .from('funds')
    .select('id, name')
    .eq('id', fundId)
    .single();

  if (error || !data) {
    console.error(`[ReportingEmailTriggers] Failed to fetch fund: ${error?.message}`);
    return null;
  }

  return { id: data.id, name: data.name };
}

/**
 * Fetch deal details
 */
async function getDealDetails(dealId: string): Promise<DealContext | null> {
  const { data, error } = await supabaseAdmin
    .from('deals')
    .select('id, name')
    .eq('id', dealId)
    .single();

  if (error || !data) {
    console.error(`[ReportingEmailTriggers] Failed to fetch deal: ${error?.message}`);
    return null;
  }

  return { id: data.id, name: data.name };
}

/**
 * Fetch investor details
 */
async function getInvestorDetails(investorId: string): Promise<InvestorContext | null> {
  const { data, error } = await supabaseAdmin
    .from('investors')
    .select('id, email, first_name, last_name')
    .eq('id', investorId)
    .single();

  if (error || !data) {
    console.error(`[ReportingEmailTriggers] Failed to fetch investor: ${error?.message}`);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
  };
}

/**
 * Update email tracking in fund_reports table
 */
async function updateFundReportEmailTracking(reportId: string, sentCount: number): Promise<void> {
  await supabaseAdmin
    .from('fund_reports')
    .update({
      email_sent_at: new Date().toISOString(),
      email_sent_count: sentCount,
    })
    .eq('id', reportId);
}

/**
 * Update email tracking in investor_meetings table
 */
async function updateMeetingEmailTracking(meetingId: string, sentCount: number): Promise<void> {
  await supabaseAdmin
    .from('investor_meetings')
    .update({
      invite_sent_at: new Date().toISOString(),
      invite_sent_count: sentCount,
      status: 'sent',
    })
    .eq('id', meetingId);
}

/**
 * Update email tracking in k1_documents table
 */
async function updateK1EmailTracking(k1Id: string): Promise<void> {
  await supabaseAdmin
    .from('k1_documents')
    .update({
      email_sent_at: new Date().toISOString(),
      status: 'sent',
    })
    .eq('id', k1Id);
}

/**
 * Update email tracking in property_announcements table
 */
async function updatePropertyAnnouncementTracking(announcementId: string, sentCount: number): Promise<void> {
  await supabaseAdmin
    .from('property_announcements')
    .update({
      sent_at: new Date().toISOString(),
      email_sent_count: sentCount,
      status: 'sent',
    })
    .eq('id', announcementId);
}

// ============================================================
// MAIN CLASS
// ============================================================

export class ReportingEmailTriggers {
  constructor(private emailService: EmailService) {}

  // ============================================================
  // QUARTERLY REPORTS
  // ============================================================

  /**
   * Trigger emails when a quarterly report is published
   * Broadcasts to all fund investors
   */
  async onQuarterlyReportPublished(
    report: FundReportContext,
    timestamp: Date
  ): Promise<{ total: number; sent: number; failed: number }> {
    const results = { total: 0, sent: 0, failed: 0 };

    const fund = await getFundDetails(report.fundId);
    if (!fund) {
      console.error(`[ReportingEmailTriggers] Fund not found for quarterly report: ${report.fundId}`);
      return results;
    }

    const investors = await getFundInvestors(report.fundId);
    results.total = investors.length;

    const reportUrl = `${getBaseUrl()}/reports/${report.id}`;

    for (const investor of investors) {
      const templateData: QuarterlyReportTemplateData = {
        recipientName: `${investor.firstName} ${investor.lastName}`,
        fundName: fund.name,
        quarter: String(report.periodQuarter),
        year: String(report.periodYear),
        reportUrl,
        reportSummary: report.summaryContent,
      };

      const result = await this.emailService.sendQuarterlyReport(investor.email, templateData);

      if (result.success) {
        results.sent++;
        await emailLogger.logEmail({
          investorId: investor.id,
          fundId: fund.id,
          templateKey: 'quarterly_report',
          automationType: 'auto_trigger' as AutomationType,
          triggerEvent: 'report_published' as TriggerEvent,
          metadata: {
            reportId: report.id,
            quarter: report.periodQuarter,
            year: report.periodYear,
          },
        });
      } else {
        results.failed++;
      }
    }

    console.log(
      `[ReportingEmailTriggers] Quarterly report emails sent: ${results.sent}/${results.total}, failed: ${results.failed}`
    );

    return results;
  }

  // ============================================================
  // ANNUAL REPORTS
  // ============================================================

  /**
   * Trigger emails when an annual report is published
   * Broadcasts to all fund investors
   */
  async onAnnualReportPublished(
    report: FundReportContext,
    timestamp: Date
  ): Promise<{ total: number; sent: number; failed: number }> {
    const results = { total: 0, sent: 0, failed: 0 };

    const fund = await getFundDetails(report.fundId);
    if (!fund) {
      console.error(`[ReportingEmailTriggers] Fund not found for annual report: ${report.fundId}`);
      return results;
    }

    const investors = await getFundInvestors(report.fundId);
    results.total = investors.length;

    const reportUrl = `${getBaseUrl()}/reports/${report.id}`;

    for (const investor of investors) {
      const templateData: AnnualReportTemplateData = {
        recipientName: `${investor.firstName} ${investor.lastName}`,
        fundName: fund.name,
        year: String(report.periodYear),
        reportUrl,
        reportSummary: report.summaryContent,
      };

      const result = await this.emailService.sendAnnualReport(investor.email, templateData);

      if (result.success) {
        results.sent++;
        await emailLogger.logEmail({
          investorId: investor.id,
          fundId: fund.id,
          templateKey: 'annual_report',
          automationType: 'auto_trigger' as AutomationType,
          triggerEvent: 'report_published' as TriggerEvent,
          metadata: {
            reportId: report.id,
            year: report.periodYear,
          },
        });
      } else {
        results.failed++;
      }
    }

    console.log(
      `[ReportingEmailTriggers] Annual report emails sent: ${results.sent}/${results.total}, failed: ${results.failed}`
    );

    return results;
  }

  // ============================================================
  // ANNUAL MEETING INVITES
  // ============================================================

  /**
   * Trigger emails when an annual investor meeting is scheduled
   * Broadcasts to all fund investors
   */
  async onAnnualMeetingScheduled(
    meeting: InvestorMeetingContext,
    timestamp: Date
  ): Promise<{ total: number; sent: number; failed: number }> {
    const results = { total: 0, sent: 0, failed: 0 };

    const fund = await getFundDetails(meeting.fundId);
    if (!fund) {
      console.error(`[ReportingEmailTriggers] Fund not found for meeting: ${meeting.fundId}`);
      return results;
    }

    const investors = await getFundInvestors(meeting.fundId);
    results.total = investors.length;

    const rsvpUrl = meeting.rsvpUrl || `${getBaseUrl()}/meetings/${meeting.id}/rsvp`;

    for (const investor of investors) {
      const templateData: AnnualMeetingInviteTemplateData = {
        recipientName: `${investor.firstName} ${investor.lastName}`,
        fundName: fund.name,
        year: String(meeting.meetingYear),
        meetingDate: meeting.meetingDate,
        meetingTime: meeting.meetingTime,
        timezone: meeting.timezone,
        meetingFormat: meeting.meetingFormat,
        rsvpUrl,
        agendaPreview: meeting.agendaPreview,
      };

      const result = await this.emailService.sendAnnualMeetingInvite(investor.email, templateData);

      if (result.success) {
        results.sent++;
        await emailLogger.logEmail({
          investorId: investor.id,
          fundId: fund.id,
          templateKey: 'annual_meeting_invite',
          automationType: 'auto_trigger' as AutomationType,
          triggerEvent: 'meeting_scheduled' as TriggerEvent,
          metadata: {
            meetingId: meeting.id,
            meetingYear: meeting.meetingYear,
            meetingDate: meeting.meetingDate,
          },
        });
      } else {
        results.failed++;
      }
    }

    // Update meeting tracking
    await updateMeetingEmailTracking(meeting.id, results.sent);

    console.log(
      `[ReportingEmailTriggers] Annual meeting invite emails sent: ${results.sent}/${results.total}, failed: ${results.failed}`
    );

    return results;
  }

  // ============================================================
  // PROPERTY ACQUISITION
  // ============================================================

  /**
   * Trigger emails when a property acquisition closes
   * Broadcasts to all fund investors
   */
  async onPropertyAcquired(
    announcement: PropertyAnnouncementContext,
    timestamp: Date
  ): Promise<{ total: number; sent: number; failed: number }> {
    const results = { total: 0, sent: 0, failed: 0 };

    const fund = await getFundDetails(announcement.fundId);
    if (!fund) {
      console.error(`[ReportingEmailTriggers] Fund not found for property acquisition: ${announcement.fundId}`);
      return results;
    }

    const deal = await getDealDetails(announcement.dealId);
    if (!deal) {
      console.error(`[ReportingEmailTriggers] Deal not found for property acquisition: ${announcement.dealId}`);
      return results;
    }

    const investors = await getFundInvestors(announcement.fundId);
    results.total = investors.length;

    const propertyDetailsUrl = `${getBaseUrl()}/deals/${announcement.dealId}`;

    for (const investor of investors) {
      const templateData: PropertyAcquisitionTemplateData = {
        recipientName: `${investor.firstName} ${investor.lastName}`,
        fundName: fund.name,
        propertyName: deal.name,
        propertyDetailsUrl,
        acquisitionSummary: announcement.summaryContent,
      };

      const result = await this.emailService.sendPropertyAcquisition(investor.email, templateData);

      if (result.success) {
        results.sent++;
        await emailLogger.logEmail({
          investorId: investor.id,
          fundId: fund.id,
          templateKey: 'property_acquisition',
          automationType: 'auto_trigger' as AutomationType,
          triggerEvent: 'acquisition_closed' as TriggerEvent,
          metadata: {
            announcementId: announcement.id,
            dealId: announcement.dealId,
            propertyName: deal.name,
          },
        });
      } else {
        results.failed++;
      }
    }

    // Update announcement tracking
    await updatePropertyAnnouncementTracking(announcement.id, results.sent);

    console.log(
      `[ReportingEmailTriggers] Property acquisition emails sent: ${results.sent}/${results.total}, failed: ${results.failed}`
    );

    return results;
  }

  // ============================================================
  // PROPERTY DISPOSITION
  // ============================================================

  /**
   * Trigger emails when a property sale closes
   * Broadcasts to all fund investors
   */
  async onPropertySold(
    announcement: PropertyAnnouncementContext,
    timestamp: Date
  ): Promise<{ total: number; sent: number; failed: number }> {
    const results = { total: 0, sent: 0, failed: 0 };

    const fund = await getFundDetails(announcement.fundId);
    if (!fund) {
      console.error(`[ReportingEmailTriggers] Fund not found for property disposition: ${announcement.fundId}`);
      return results;
    }

    const deal = await getDealDetails(announcement.dealId);
    if (!deal) {
      console.error(`[ReportingEmailTriggers] Deal not found for property disposition: ${announcement.dealId}`);
      return results;
    }

    const investors = await getFundInvestors(announcement.fundId);
    results.total = investors.length;

    const detailsUrl = `${getBaseUrl()}/deals/${announcement.dealId}`;

    for (const investor of investors) {
      const templateData: PropertyDispositionTemplateData = {
        recipientName: `${investor.firstName} ${investor.lastName}`,
        fundName: fund.name,
        propertyName: deal.name,
        detailsUrl,
        dispositionSummary: announcement.summaryContent,
      };

      const result = await this.emailService.sendPropertyDisposition(investor.email, templateData);

      if (result.success) {
        results.sent++;
        await emailLogger.logEmail({
          investorId: investor.id,
          fundId: fund.id,
          templateKey: 'property_disposition',
          automationType: 'auto_trigger' as AutomationType,
          triggerEvent: 'sale_closed' as TriggerEvent,
          metadata: {
            announcementId: announcement.id,
            dealId: announcement.dealId,
            propertyName: deal.name,
          },
        });
      } else {
        results.failed++;
      }
    }

    // Update announcement tracking
    await updatePropertyAnnouncementTracking(announcement.id, results.sent);

    console.log(
      `[ReportingEmailTriggers] Property disposition emails sent: ${results.sent}/${results.total}, failed: ${results.failed}`
    );

    return results;
  }

  // ============================================================
  // K-1 AVAILABLE
  // ============================================================

  /**
   * Trigger email when final K-1 is uploaded
   * Sends to specific investor
   */
  async onK1Uploaded(
    k1Document: K1DocumentContext,
    timestamp: Date
  ): Promise<SendEmailResult> {
    const fund = await getFundDetails(k1Document.fundId);
    if (!fund) {
      console.error(`[ReportingEmailTriggers] Fund not found for K-1: ${k1Document.fundId}`);
      return { success: false, error: 'Fund not found' };
    }

    const investor = await getInvestorDetails(k1Document.investorId);
    if (!investor) {
      console.error(`[ReportingEmailTriggers] Investor not found for K-1: ${k1Document.investorId}`);
      return { success: false, error: 'Investor not found' };
    }

    const downloadUrl = `${getBaseUrl()}/documents/${k1Document.id}/download`;

    const templateData: K1AvailableTemplateData = {
      recipientName: `${investor.firstName} ${investor.lastName}`,
      fundName: fund.name,
      taxYear: String(k1Document.taxYear),
      downloadUrl,
    };

    const result = await this.emailService.sendK1Available(investor.email, templateData);

    if (result.success) {
      await emailLogger.logEmail({
        investorId: investor.id,
        fundId: fund.id,
        templateKey: 'k1_available',
        automationType: 'auto_trigger' as AutomationType,
        triggerEvent: 'k1_uploaded' as TriggerEvent,
        metadata: {
          k1Id: k1Document.id,
          taxYear: k1Document.taxYear,
        },
      });
      await updateK1EmailTracking(k1Document.id);
    }

    console.log(
      `[ReportingEmailTriggers] K-1 available email ${result.success ? 'sent' : 'failed'} to ${investor.email}`
    );

    return result;
  }

  // ============================================================
  // K-1 ESTIMATE
  // ============================================================

  /**
   * Trigger email when K-1 estimate is ready (final delayed)
   * Sends to specific investor
   */
  async onK1EstimateReady(
    k1Document: K1DocumentContext,
    timestamp: Date
  ): Promise<SendEmailResult> {
    const fund = await getFundDetails(k1Document.fundId);
    if (!fund) {
      console.error(`[ReportingEmailTriggers] Fund not found for K-1 estimate: ${k1Document.fundId}`);
      return { success: false, error: 'Fund not found' };
    }

    const investor = await getInvestorDetails(k1Document.investorId);
    if (!investor) {
      console.error(`[ReportingEmailTriggers] Investor not found for K-1 estimate: ${k1Document.investorId}`);
      return { success: false, error: 'Investor not found' };
    }

    const estimateUrl = `${getBaseUrl()}/documents/${k1Document.id}`;

    const templateData: K1EstimateTemplateData = {
      recipientName: `${investor.firstName} ${investor.lastName}`,
      fundName: fund.name,
      taxYear: String(k1Document.taxYear),
      expectedFinalDate: k1Document.expectedFinalDate || 'TBD',
      estimateUrl,
    };

    const result = await this.emailService.sendK1Estimate(investor.email, templateData);

    if (result.success) {
      await emailLogger.logEmail({
        investorId: investor.id,
        fundId: fund.id,
        templateKey: 'k1_estimate',
        automationType: 'auto_trigger' as AutomationType,
        triggerEvent: 'k1_estimate_ready' as TriggerEvent,
        metadata: {
          k1Id: k1Document.id,
          taxYear: k1Document.taxYear,
          expectedFinalDate: k1Document.expectedFinalDate,
        },
      });
      await updateK1EmailTracking(k1Document.id);
    }

    console.log(
      `[ReportingEmailTriggers] K-1 estimate email ${result.success ? 'sent' : 'failed'} to ${investor.email}`
    );

    return result;
  }

  // ============================================================
  // K-1 AMENDED
  // ============================================================

  /**
   * Trigger email when amended K-1 is issued
   * Sends to specific investor
   */
  async onK1Amended(
    k1Document: K1DocumentContext,
    timestamp: Date
  ): Promise<SendEmailResult> {
    const fund = await getFundDetails(k1Document.fundId);
    if (!fund) {
      console.error(`[ReportingEmailTriggers] Fund not found for amended K-1: ${k1Document.fundId}`);
      return { success: false, error: 'Fund not found' };
    }

    const investor = await getInvestorDetails(k1Document.investorId);
    if (!investor) {
      console.error(`[ReportingEmailTriggers] Investor not found for amended K-1: ${k1Document.investorId}`);
      return { success: false, error: 'Investor not found' };
    }

    const downloadUrl = `${getBaseUrl()}/documents/${k1Document.id}/download`;

    const templateData: K1AmendedTemplateData = {
      recipientName: `${investor.firstName} ${investor.lastName}`,
      fundName: fund.name,
      taxYear: String(k1Document.taxYear),
      amendmentReason: k1Document.amendmentReason || 'Corrections to previously issued K-1',
      downloadUrl,
    };

    const result = await this.emailService.sendK1Amended(investor.email, templateData);

    if (result.success) {
      await emailLogger.logEmail({
        investorId: investor.id,
        fundId: fund.id,
        templateKey: 'k1_amended',
        automationType: 'auto_trigger' as AutomationType,
        triggerEvent: 'k1_amended' as TriggerEvent,
        metadata: {
          k1Id: k1Document.id,
          taxYear: k1Document.taxYear,
          amendmentReason: k1Document.amendmentReason,
        },
      });
      await updateK1EmailTracking(k1Document.id);
    }

    console.log(
      `[ReportingEmailTriggers] K-1 amended email ${result.success ? 'sent' : 'failed'} to ${investor.email}`
    );

    return result;
  }
}

// Export singleton instance
import { emailService } from '../email/email.service';
export const reportingEmailTriggers = new ReportingEmailTriggers(emailService);
