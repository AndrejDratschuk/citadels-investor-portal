/**
 * GuidedTooltip Component
 * Tooltip for guided tour with progress indicator and navigation
 */

import { useEffect, useRef, useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GuidedTooltipProps {
  targetRef: React.RefObject<HTMLElement>;
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  isVisible?: boolean;
  nextLabel?: string;
  showSkip?: boolean;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

export function GuidedTooltip({
  targetRef,
  title,
  description,
  step,
  totalSteps,
  onNext,
  onSkip,
  position = 'bottom',
  isVisible = true,
  nextLabel = 'Next',
  showSkip = true,
}: GuidedTooltipProps): JSX.Element | null {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);

  useEffect(() => {
    if (!isVisible || !targetRef.current || !tooltipRef.current) return;

    const calculatePosition = (): void => {
      const target = targetRef.current;
      const tooltip = tooltipRef.current;
      if (!target || !tooltip) return;

      const targetRect = target.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const padding = 12;

      let top = 0;
      let left = 0;
      let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = position;

      switch (position) {
        case 'bottom':
          top = targetRect.bottom + padding;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          arrowPosition = 'top';
          break;
        case 'top':
          top = targetRect.top - tooltipRect.height - padding;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          arrowPosition = 'bottom';
          break;
        case 'left':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.left - tooltipRect.width - padding;
          arrowPosition = 'right';
          break;
        case 'right':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.right + padding;
          arrowPosition = 'left';
          break;
      }

      // Keep tooltip within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left < padding) left = padding;
      if (left + tooltipRect.width > viewportWidth - padding) {
        left = viewportWidth - tooltipRect.width - padding;
      }
      if (top < padding) top = padding;
      if (top + tooltipRect.height > viewportHeight - padding) {
        top = viewportHeight - tooltipRect.height - padding;
      }

      setTooltipPosition({ top, left, arrowPosition });
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [isVisible, targetRef, position]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onSkip();
      }
    };

    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onSkip]);

  // Highlight target element
  useEffect(() => {
    if (!isVisible || !targetRef.current) return;

    const target = targetRef.current;
    target.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'relative', 'z-50');

    return () => {
      target.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'relative', 'z-50');
    };
  }, [isVisible, targetRef]);

  if (!isVisible) return null;

  const progressPercent = (step / totalSteps) * 100;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onSkip}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          'fixed z-50 w-80 rounded-xl bg-white shadow-2xl border border-slate-200',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
        style={{
          top: tooltipPosition?.top ?? -9999,
          left: tooltipPosition?.left ?? -9999,
          visibility: tooltipPosition ? 'visible' : 'hidden',
        }}
      >
        {/* Arrow */}
        <div
          className={cn(
            'absolute w-3 h-3 bg-white border-slate-200 transform rotate-45',
            tooltipPosition?.arrowPosition === 'top' && '-top-1.5 left-1/2 -translate-x-1/2 border-l border-t',
            tooltipPosition?.arrowPosition === 'bottom' && '-bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b',
            tooltipPosition?.arrowPosition === 'left' && '-left-1.5 top-1/2 -translate-y-1/2 border-l border-b',
            tooltipPosition?.arrowPosition === 'right' && '-right-1.5 top-1/2 -translate-y-1/2 border-r border-t'
          )}
        />

        {/* Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onSkip}
              className="p-1 rounded-md hover:bg-slate-100 transition-colors -mr-1 -mt-1"
              aria-label="Close tour"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 mb-4">{description}</p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            {showSkip ? (
              <button
                onClick={onSkip}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Skip tour
              </button>
            ) : (
              <div />
            )}
            <Button size="sm" onClick={onNext}>
              {nextLabel}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}









