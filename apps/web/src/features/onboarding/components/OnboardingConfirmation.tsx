import { Link } from 'react-router-dom';
import { CheckCircle2, FileText, Pen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingConfirmationProps {
  investorName?: string;
}

export function OnboardingConfirmation({ investorName }: OnboardingConfirmationProps) {
  return (
    <div className="text-center py-8">
      {/* Success Icon */}
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Application Submitted!
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        {investorName ? `Thank you, ${investorName}! ` : 'Thank you! '}
        Your investor application has been submitted successfully.
      </p>

      {/* Next Steps */}
      <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left max-w-lg mx-auto">
        <h3 className="font-semibold mb-4">What happens next?</h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Document Review</p>
              <p className="text-sm text-muted-foreground">
                Our team will review your uploaded documents. You'll be notified once they're approved.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Pen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Sign Agreements</p>
              <p className="text-sm text-muted-foreground">
                You'll receive investment documents via DocuSign to review and sign electronically.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Complete Onboarding</p>
              <p className="text-sm text-muted-foreground">
                Once all steps are complete, your investor status will be activated.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-700 mb-8">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        Status: Onboarding in Progress
      </div>

      {/* Dashboard Button */}
      <div>
        <Button asChild size="lg">
          <Link to="/investor/dashboard">
            Go to Your Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        You can track your onboarding progress in your dashboard
      </p>
    </div>
  );
}

