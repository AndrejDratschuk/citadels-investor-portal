/**
 * Webhook Service
 * 
 * Sends webhook notifications to external services (e.g., n8n) when events occur.
 * 
 * Configuration via environment variables:
 * - WEBHOOK_URL: Default URL for all events (fallback)
 * - WEBHOOK_URL_INVESTOR_CREATED: URL for investor.created events
 * - WEBHOOK_URL_KYC_STATUS_CHANGED: URL for kyc.status_changed events
 * - WEBHOOK_URL_KYC_ACKNOWLEDGED: URL for kyc.acknowledged events (manager approve/reject)
 * - WEBHOOK_URL_CAPITAL_CALL_CREATED: URL for capital_call.created events
 * - WEBHOOK_URL_DEAL_CREATED: URL for deal.created events
 * - WEBHOOK_URL_DEAL_UPDATED: URL for deal.updated events
 * - WEBHOOK_URL_COMMUNICATION_RECEIVED: URL for communication.received events
 */

export type WebhookEvent = 
  | 'investor.created'
  | 'investor.updated'
  | 'investor.onboarding_complete'
  | 'kyc.status_changed'
  | 'kyc.acknowledged'
  | 'kyc.account_invite_sent'
  | 'capital_call.created'
  | 'deal.created'
  | 'deal.updated'
  | 'communication.received';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
}

export interface SendWebhookOptions {
  timestamp?: string;
}

// Map event types to environment variable names
const eventToEnvVar: Record<WebhookEvent, string> = {
  'investor.created': 'WEBHOOK_URL_INVESTOR_CREATED',
  'investor.updated': 'WEBHOOK_URL_INVESTOR_UPDATED',
  'investor.onboarding_complete': 'WEBHOOK_URL_INVESTOR_ONBOARDING_COMPLETE',
  'kyc.status_changed': 'WEBHOOK_URL_KYC_STATUS_CHANGED',
  'kyc.acknowledged': 'WEBHOOK_URL_KYC_ACKNOWLEDGED',
  'kyc.account_invite_sent': 'WEBHOOK_URL_KYC_ACCOUNT_INVITE_SENT',
  'capital_call.created': 'WEBHOOK_URL_CAPITAL_CALL_CREATED',
  'deal.created': 'WEBHOOK_URL_DEAL_CREATED',
  'deal.updated': 'WEBHOOK_URL_DEAL_UPDATED',
  'communication.received': 'WEBHOOK_URL_COMMUNICATION_RECEIVED',
};

class WebhookService {
  private defaultUrl: string | null;
  private eventUrls: Map<WebhookEvent, string | null>;

  constructor() {
    // Default fallback URL
    this.defaultUrl = process.env.WEBHOOK_URL || null;
    
    // Event-specific URLs
    this.eventUrls = new Map();
    for (const [event, envVar] of Object.entries(eventToEnvVar)) {
      const url = process.env[envVar] || null;
      this.eventUrls.set(event as WebhookEvent, url);
    }

    // Log configured webhooks
    const configuredEvents = Array.from(this.eventUrls.entries())
      .filter(([_, url]) => url)
      .map(([event]) => event);
    
    if (configuredEvents.length > 0) {
      console.log('[WebhookService] Configured webhooks for:', configuredEvents.join(', '));
    }
    if (this.defaultUrl) {
      console.log('[WebhookService] Default webhook URL configured (fallback for unconfigured events)');
    }
    if (!this.defaultUrl && configuredEvents.length === 0) {
      console.log('[WebhookService] No webhook URLs configured - webhooks disabled');
    }
  }

  /**
   * Get the URL for a specific event
   * Returns event-specific URL if configured, otherwise falls back to default
   */
  private getUrlForEvent(event: WebhookEvent): string | null {
    return this.eventUrls.get(event) || this.defaultUrl;
  }

  /**
   * Send a webhook notification
   * This is fire-and-forget - it won't block the main operation if it fails
   */
  async sendWebhook(event: WebhookEvent, data: Record<string, any>, options?: SendWebhookOptions): Promise<void> {
    const url = this.getUrlForEvent(event);
    
    if (!url) {
      console.log(`[WebhookService] Skipping webhook for ${event} - no URL configured`);
      return;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: options?.timestamp ?? new Date().toISOString(),
      data,
    };

    // Fire and forget - don't await, just log errors
    this.send(url, payload).catch((error) => {
      console.error(`[WebhookService] Failed to send webhook for ${event}:`, error.message);
    });
  }

  /**
   * Internal send method
   */
  private async send(url: string, payload: WebhookPayload): Promise<void> {
    console.log(`[WebhookService] Sending webhook: ${payload.event} to ${url.substring(0, 50)}...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Flowveda-Webhook/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}: ${response.statusText}`);
    }

    console.log(`[WebhookService] Webhook sent successfully: ${payload.event}`);
  }

  /**
   * Check if webhooks are enabled for a specific event
   */
  isEnabledForEvent(event: WebhookEvent): boolean {
    return !!this.getUrlForEvent(event);
  }

  /**
   * Check if any webhooks are enabled
   */
  isEnabled(): boolean {
    return !!this.defaultUrl || Array.from(this.eventUrls.values()).some(url => !!url);
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
