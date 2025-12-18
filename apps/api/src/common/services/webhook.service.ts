/**
 * Webhook Service
 * 
 * Sends webhook notifications to external services (e.g., n8n) when events occur.
 * Configured via WEBHOOK_URL environment variable.
 */

export type WebhookEvent = 
  | 'investor.created'
  | 'investor.updated'
  | 'kyc.status_changed'
  | 'capital_call.created'
  | 'deal.created'
  | 'deal.updated'
  | 'communication.received';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
}

class WebhookService {
  private webhookUrl: string | null;

  constructor() {
    this.webhookUrl = process.env.WEBHOOK_URL || null;
    
    if (this.webhookUrl) {
      console.log('[WebhookService] Initialized with webhook URL');
    } else {
      console.log('[WebhookService] No WEBHOOK_URL configured - webhooks disabled');
    }
  }

  /**
   * Send a webhook notification
   * This is fire-and-forget - it won't block the main operation if it fails
   */
  async sendWebhook(event: WebhookEvent, data: Record<string, any>): Promise<void> {
    if (!this.webhookUrl) {
      console.log(`[WebhookService] Skipping webhook for ${event} - no URL configured`);
      return;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Fire and forget - don't await, just log errors
    this.send(payload).catch((error) => {
      console.error(`[WebhookService] Failed to send webhook for ${event}:`, error.message);
    });
  }

  /**
   * Internal send method
   */
  private async send(payload: WebhookPayload): Promise<void> {
    if (!this.webhookUrl) return;

    console.log(`[WebhookService] Sending webhook: ${payload.event}`);

    const response = await fetch(this.webhookUrl, {
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
   * Check if webhooks are enabled
   */
  isEnabled(): boolean {
    return !!this.webhookUrl;
  }
}

// Export singleton instance
export const webhookService = new WebhookService();

