/**
 * useGuidedTour Hook
 * Manages guided tour state with localStorage persistence
 */

import { useState, useCallback, useEffect } from 'react';
import type { OnboardingTourState } from '@altsui/shared';

interface UseTourReturn {
  state: OnboardingTourState;
  isActive: boolean;
  currentStep: number;
  startTour: () => void;
  nextStep: () => void;
  goToStep: (step: number) => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
}

const STORAGE_KEY_PREFIX = 'onboarding_tour_';

function getStorageKey(tourId: string): string {
  return `${STORAGE_KEY_PREFIX}${tourId}`;
}

function loadTourState(tourId: string): OnboardingTourState | null {
  try {
    const stored = localStorage.getItem(getStorageKey(tourId));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveTourState(tourId: string, state: OnboardingTourState): void {
  try {
    localStorage.setItem(getStorageKey(tourId), JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function createInitialState(totalSteps: number): OnboardingTourState {
  return {
    isActive: false,
    currentStep: 1,
    totalSteps,
    startedAt: null,
    completedAt: null,
    skippedAt: null,
  };
}

/**
 * Hook for managing guided tour state
 * Persists progress to localStorage
 */
export function useGuidedTour(
  tourId: string,
  totalSteps: number = 4
): UseTourReturn {
  const [state, setState] = useState<OnboardingTourState>(() => {
    const stored = loadTourState(tourId);
    if (stored) {
      // If already completed or skipped, return stored state
      if (stored.completedAt || stored.skippedAt) {
        return stored;
      }
      // Resume from where left off
      return { ...stored, totalSteps };
    }
    return createInitialState(totalSteps);
  });

  // Persist state changes to localStorage
  useEffect(() => {
    saveTourState(tourId, state);
  }, [tourId, state]);

  const startTour = useCallback((): void => {
    // Don't restart if already completed
    const stored = loadTourState(tourId);
    if (stored?.completedAt) {
      return;
    }

    setState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 1,
      startedAt: new Date().toISOString(),
      completedAt: null,
      skippedAt: null,
    }));
  }, [tourId]);

  const nextStep = useCallback((): void => {
    setState(prev => {
      if (!prev.isActive) return prev;

      const nextStepNum = prev.currentStep + 1;
      
      if (nextStepNum > prev.totalSteps) {
        // Tour complete
        return {
          ...prev,
          isActive: false,
          completedAt: new Date().toISOString(),
        };
      }

      return {
        ...prev,
        currentStep: nextStepNum,
      };
    });
  }, []);

  const goToStep = useCallback((step: number): void => {
    setState(prev => {
      if (!prev.isActive) return prev;
      if (step < 1 || step > prev.totalSteps) return prev;

      return {
        ...prev,
        currentStep: step,
      };
    });
  }, []);

  const skipTour = useCallback((): void => {
    setState(prev => ({
      ...prev,
      isActive: false,
      skippedAt: new Date().toISOString(),
    }));
  }, []);

  const completeTour = useCallback((): void => {
    setState(prev => ({
      ...prev,
      isActive: false,
      completedAt: new Date().toISOString(),
    }));
  }, []);

  const resetTour = useCallback((): void => {
    setState(createInitialState(totalSteps));
    localStorage.removeItem(getStorageKey(tourId));
  }, [tourId, totalSteps]);

  return {
    state,
    isActive: state.isActive,
    currentStep: state.currentStep,
    startTour,
    nextStep,
    goToStep,
    skipTour,
    completeTour,
    resetTour,
  };
}

/**
 * Check if tour has been completed before
 */
export function hasCompletedTour(tourId: string): boolean {
  const stored = loadTourState(tourId);
  return stored?.completedAt !== null && stored?.completedAt !== undefined;
}

/**
 * Check if tour has been skipped before
 */
export function hasSkippedTour(tourId: string): boolean {
  const stored = loadTourState(tourId);
  return stored?.skippedAt !== null && stored?.skippedAt !== undefined;
}




