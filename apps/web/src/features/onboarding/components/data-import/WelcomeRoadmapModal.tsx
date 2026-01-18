/**
 * WelcomeRoadmapModal Component
 * Welcome modal with 3-step visual roadmap for data import onboarding
 */

import { Upload, Settings, BarChart3, X, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WelcomeRoadmapModalProps {
  fundName?: string;
  onGetStarted: () => void;
  onSkip: () => void;
  isOpen: boolean;
}

interface RoadmapStep {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const ROADMAP_STEPS: RoadmapStep[] = [
  {
    number: 1,
    title: 'Connect Data',
    description: 'Upload a file or connect Google Sheets',
    icon: Upload,
    color: 'bg-blue-500',
  },
  {
    number: 2,
    title: 'Map Metrics',
    description: 'Match your columns to KPIs',
    icon: Settings,
    color: 'bg-purple-500',
  },
  {
    number: 3,
    title: 'See Insights',
    description: 'Get instant visualizations',
    icon: BarChart3,
    color: 'bg-emerald-500',
  },
];

export function WelcomeRoadmapModal({
  fundName,
  onGetStarted,
  onSkip,
  isOpen,
}: WelcomeRoadmapModalProps): JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onSkip}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Close button */}
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>

          {/* Header with gradient */}
          <div className="relative px-8 pt-10 pb-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm mb-4">
                <Clock className="h-4 w-4" />
                <span>Takes about 2 minutes</span>
              </div>
              
              <h1 className="text-3xl font-bold mb-2">
                Let's set up your dashboard
                {fundName && <span className="text-primary-300">, {fundName}</span>}
              </h1>
              <p className="text-slate-300 text-lg">
                Import your financial data and get instant insights into your portfolio performance.
              </p>
            </div>
          </div>

          {/* Roadmap Steps */}
          <div className="px-8 py-8">
            <div className="flex items-start justify-between gap-4">
              {ROADMAP_STEPS.map((step, index) => (
                <div key={step.number} className="flex-1 relative">
                  {/* Connector line */}
                  {index < ROADMAP_STEPS.length - 1 && (
                    <div className="absolute top-6 left-[calc(50%+24px)] right-0 h-0.5 bg-slate-200" />
                  )}
                  
                  <div className="flex flex-col items-center text-center">
                    {/* Icon circle */}
                    <div className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-xl mb-3 relative z-10',
                      step.color
                    )}>
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                    
                    {/* Step number */}
                    <div className="text-xs font-medium text-slate-400 mb-1">
                      Step {step.number}
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {step.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 pb-8 pt-2">
            <div className="flex items-center justify-between gap-4 pt-4 border-t">
              <button
                onClick={onSkip}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Skip for now, I'll add data later
              </button>
              
              <Button size="lg" onClick={onGetStarted} className="gap-2">
                <Play className="h-4 w-4" />
                Get Started
              </Button>
            </div>
          </div>

          {/* Help sidebar hint */}
          <div className="px-8 pb-6">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">💡</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600">
                  Don't have your data ready?{' '}
                  <span className="font-medium text-slate-900">
                    Use our sample data to explore
                  </span>{' '}
                  the platform first.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









