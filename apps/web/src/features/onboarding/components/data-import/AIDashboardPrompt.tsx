/**
 * AIDashboardPrompt Component
 * Modal offering auto-generated dashboard after import
 */

import { BarChart3, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface AIDashboardPromptProps {
  onGenerate: () => void;
  onSkip: () => void;
  isOpen: boolean;
  isGenerating?: boolean;
}

export function AIDashboardPrompt({
  onGenerate,
  onSkip,
  isOpen,
  isGenerating = false,
}: AIDashboardPromptProps): JSX.Element | null {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleSkip = (): void => {
    if (dontShowAgain) {
      localStorage.setItem('ai_dashboard_prompt_dismissed', 'true');
    }
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>

          {/* Illustration */}
          <div className="px-8 pt-10 pb-6">
            <div className="relative">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-100 rounded-2xl" />
              
              {/* Chart illustration */}
              <div className="relative p-8 flex items-center justify-center">
                <div className="relative">
                  {/* Data arrow */}
                  <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center">
                      <span className="text-xs font-mono">XLS</span>
                    </div>
                    <svg className="w-8 h-4 text-slate-300" viewBox="0 0 24 12">
                      <path 
                        d="M0 6h20M16 1l5 5-5 5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill="none"
                      />
                    </svg>
                  </div>
                  
                  {/* Chart icon */}
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center">
                    <BarChart3 className="h-10 w-10 text-primary" />
                  </div>
                  
                  {/* Sparkle decoration */}
                  <div className="absolute -top-2 -right-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-6 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Generate Your Dashboard
            </h2>
            <p className="text-slate-600">
              We can analyze your imported data and instantly create relevant 
              charts and insights. You can also build your own dashboard from scratch.
            </p>
          </div>

          {/* Don't show again checkbox */}
          <div className="px-8 pb-4">
            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              Don't show this again
            </label>
          </div>

          {/* Actions */}
          <div className="px-8 pb-8 flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleSkip}
              disabled={isGenerating}
            >
              No, I'll build my own
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Yes, generate dashboard
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}









