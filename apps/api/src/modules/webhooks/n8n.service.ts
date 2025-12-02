import { env } from '../../config/env.js';

// Types for n8n webhook payloads
export interface OnboardingSubmittedPayload {
  applicationId: string;
  investorName: string;
  investorEmail: string;
  entityType: string;
  commitmentAmount: number;
  submittedAt: string;
  fundId: string;
}

export interface InvestorApprovedPayload {
  applicationId: string;
  investorId: string;
  investorName: string;
  investorEmail: string;
  commitmentAmount: number;
  approvedAt: string;
  approvedBy: string;
  fundId: string;
}

export interface InvestorRejectedPayload {
  applicationId: string;
  investorName: string;
  investorEmail: string;
  rejectionReason: string;
  rejectedAt: string;
  rejectedBy: string;
  fundId: string;
}

// n8n Webhook URLs (configured in environment)
const N8N_WEBHOOKS = {
  onboardingSubmitted: `${env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook'}/onboarding-submitted`,
  investorApproved: `${env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook'}/investor-approved`,
  investorRejected: `${env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook'}/investor-rejected`,
};

/**
 * Generic function to trigger an n8n webhook
 */
async function triggerWebhook<T>(url: string, payload: T): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Type assertion for Node.js native fetch Response
    const response = res as unknown as { ok: boolean; status: number; statusText: string };

    if (!response.ok) {
      console.error(`n8n webhook failed: ${response.status} ${response.statusText}`);
      return false;
    }

    console.log(`n8n webhook triggered successfully: ${url}`);
    return true;
  } catch (error) {
    console.error(`n8n webhook error:`, error);
    return false;
  }
}

/**
 * Trigger when a new investor application is submitted
 * n8n workflow should:
 * - Send email notification to manager
 * - Log the event
 */
export async function triggerOnboardingSubmitted(
  payload: OnboardingSubmittedPayload
): Promise<boolean> {
  console.log('Triggering onboarding submitted webhook:', payload);
  return triggerWebhook(N8N_WEBHOOKS.onboardingSubmitted, payload);
}

/**
 * Trigger when an investor application is approved
 * n8n workflow should:
 * - Create DocuSign envelope with subscription agreement
 * - Send welcome email to investor
 * - Update investor status in database
 */
export async function triggerInvestorApproved(
  payload: InvestorApprovedPayload
): Promise<boolean> {
  console.log('Triggering investor approved webhook:', payload);
  return triggerWebhook(N8N_WEBHOOKS.investorApproved, payload);
}

/**
 * Trigger when an investor application is rejected
 * n8n workflow should:
 * - Send rejection email to investor with reason
 * - Log the rejection event
 */
export async function triggerInvestorRejected(
  payload: InvestorRejectedPayload
): Promise<boolean> {
  console.log('Triggering investor rejected webhook:', payload);
  return triggerWebhook(N8N_WEBHOOKS.investorRejected, payload);
}

export const n8nService = {
  triggerOnboardingSubmitted,
  triggerInvestorApproved,
  triggerInvestorRejected,
};




