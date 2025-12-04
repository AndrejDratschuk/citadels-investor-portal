import { Link } from 'react-router-dom';
import { Clock, Mail, Phone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OnboardingPending() {
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
          {/* Pending Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>

          <h2 className="mt-6 text-3xl font-bold">Application Under Review</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Your investor application is currently being reviewed by our team.
          </p>
        </div>

        {/* Status Card */}
        <div className="mt-12 rounded-xl border bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-sm text-muted-foreground">Application Status</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
              <RefreshCw className="h-3.5 w-3.5" />
              Under Review
            </span>
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-medium">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expected Review Time</span>
              <span className="font-medium">1-2 Business Days</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> You will receive an email notification once your application has been reviewed. 
            If approved, you'll receive a subscription agreement to sign electronically.
          </p>
        </div>

        {/* Contact Info */}
        <div className="mt-8 rounded-xl border bg-white p-6">
          <h3 className="font-medium mb-4">Need to update your application?</h3>
          <div className="space-y-3">
            <a
              href="mailto:support@flowveda.com"
              className="flex items-center gap-3 text-sm hover:text-primary"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              support@flowveda.com
            </a>
            <a
              href="tel:+15551234567"
              className="flex items-center gap-3 text-sm hover:text-primary"
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
              (555) 123-4567
            </a>
          </div>
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








