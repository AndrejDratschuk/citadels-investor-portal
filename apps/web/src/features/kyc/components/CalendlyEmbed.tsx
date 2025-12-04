import { useEffect } from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';

interface CalendlyEmbedProps {
  calendlyUrl: string;
  prefillName?: string;
  prefillEmail?: string;
  onEventScheduled?: (eventUrl: string) => void;
}

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: {
          name?: string;
          email?: string;
        };
      }) => void;
    };
  }
}

export function CalendlyEmbed({
  calendlyUrl,
  prefillName,
  prefillEmail,
  onEventScheduled,
}: CalendlyEmbedProps) {
  useEffect(() => {
    // Load Calendly script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const container = document.getElementById('calendly-embed');
      if (container && window.Calendly) {
        window.Calendly.initInlineWidget({
          url: calendlyUrl,
          parentElement: container,
          prefill: {
            name: prefillName,
            email: prefillEmail,
          },
        });
      }
    };

    // Listen for Calendly events
    const handleMessage = (e: MessageEvent) => {
      if (e.data.event === 'calendly.event_scheduled' && onEventScheduled) {
        onEventScheduled(e.data.payload?.event?.uri || '');
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      document.body.removeChild(script);
      window.removeEventListener('message', handleMessage);
    };
  }, [calendlyUrl, prefillName, prefillEmail, onEventScheduled]);

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h3 className="mt-4 text-xl font-semibold text-green-900">
          Congratulations! You're Pre-Qualified
        </h3>
        <p className="mt-2 text-green-700">
          You meet the requirements to be an accredited investor. 
          Schedule a meeting below to discuss the investment opportunity.
        </p>
      </div>

      {/* Calendly Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold">Schedule Your Meeting</h4>
          <p className="text-sm text-muted-foreground">
            Select a time that works best for you
          </p>
        </div>
      </div>

      {/* Calendly Widget */}
      <div
        id="calendly-embed"
        className="min-h-[650px] rounded-lg border"
        style={{ minWidth: '320px' }}
      />
    </div>
  );
}

// Fallback component when no Calendly URL is provided
export function CalendlyFallback({ meetingLink }: { meetingLink: string }) {
  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h3 className="mt-4 text-xl font-semibold text-green-900">
          Congratulations! You're Pre-Qualified
        </h3>
        <p className="mt-2 text-green-700">
          You meet the requirements to be an accredited investor.
        </p>
      </div>

      {/* Meeting Link */}
      <div className="rounded-lg border p-6 text-center">
        <Calendar className="mx-auto h-12 w-12 text-primary" />
        <h4 className="mt-4 text-lg font-semibold">Schedule Your Meeting</h4>
        <p className="mt-2 text-muted-foreground">
          Click the button below to schedule a meeting with the fund manager.
        </p>
        <a
          href={meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Meeting
        </a>
      </div>
    </div>
  );
}

