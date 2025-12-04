import { Link } from 'react-router-dom';
import { CheckCircle2, Mail, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OnboardingSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-xl font-bold">FlowVeda</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>

          <h2 className="mt-6 text-3xl font-bold">Application Submitted!</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Thank you for submitting your investor application. We've received your information and will review it shortly.
          </p>
        </div>

        {/* What Happens Next */}
        <div className="mt-12 rounded-xl border bg-white p-6 sm:p-8">
          <h3 className="text-lg font-semibold mb-6">What happens next?</h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Confirmation Email</p>
                <p className="text-sm text-muted-foreground">
                  You'll receive a confirmation email with your application details.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Application Review</p>
                <p className="text-sm text-muted-foreground">
                  Our team will review your application within 1-2 business days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Subscription Agreement</p>
                <p className="text-sm text-muted-foreground">
                  Upon approval, you'll receive a subscription agreement via DocuSign for electronic signature.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Questions about your application?
          </p>
          <p className="mt-1 text-sm">
            Contact us at{' '}
            <a href="mailto:support@flowveda.com" className="text-primary hover:underline">
              support@flowveda.com
            </a>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link to="/">
            <Button variant="outline">Return to Homepage</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}







