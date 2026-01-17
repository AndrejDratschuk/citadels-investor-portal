/**
 * Milestone Variance Calculation Utilities
 * Pure functions for calculating and formatting milestone variances
 * 
 * Note: All functions are deterministic - dates must be passed as arguments
 */

import type { DealMilestone, MilestoneVarianceStatus } from '../types/dealNotes.types';

// ============================================
// Types
// ============================================

export interface MilestoneVariance {
  /** Variance in days (positive = delayed, negative = ahead) */
  varianceDays: number;
  /** Variance as percentage of planned duration */
  variancePercent: number;
  /** Status for color coding */
  status: MilestoneVarianceStatus;
  /** Human-readable display string (e.g., "+2 months") */
  display: string;
  /** Whether milestone has actual dates to compare */
  hasActualData: boolean;
}

// ============================================
// Date Calculation Helpers (Pure)
// ============================================

/** Calculate days between two ISO date strings */
export function daysBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr + 'T00:00:00Z');
  const end = new Date(endDateStr + 'T00:00:00Z');
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** Format ISO date string to Date object (UTC normalized) */
function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00Z');
}

// ============================================
// Variance Status Calculation
// ============================================

/** Determine variance status based on percentage */
export function getVarianceStatus(variancePercent: number): MilestoneVarianceStatus {
  if (variancePercent <= 0) {
    return variancePercent < 0 ? 'ahead' : 'on_track';
  }
  if (variancePercent <= 20) {
    return 'slight_delay';
  }
  return 'major_delay';
}

// ============================================
// Variance Display Formatting
// ============================================

/** Format variance days into human-readable string */
export function formatVarianceDisplay(varianceDays: number): string {
  const absDays = Math.abs(varianceDays);
  const sign = varianceDays > 0 ? '+' : varianceDays < 0 ? '-' : '';
  
  if (absDays === 0) {
    return 'On track';
  }
  
  // Less than a week - show days
  if (absDays < 7) {
    return `${sign}${absDays} day${absDays !== 1 ? 's' : ''}`;
  }
  
  // Less than ~5 weeks - show weeks
  if (absDays < 35) {
    const weeks = Math.round(absDays / 7);
    return `${sign}${weeks} week${weeks !== 1 ? 's' : ''}`;
  }
  
  // Show months
  const months = Math.round(absDays / 30);
  return `${sign}${months} mo${months !== 1 ? 's' : ''}`;
}

// ============================================
// Main Variance Calculation
// ============================================

/**
 * Calculate variance between planned and actual milestone dates
 * 
 * @param milestone - The milestone to calculate variance for
 * @param currentDate - Current date string (ISO format) for in-progress calculations
 * @returns Variance data including days, percent, status, and display string
 */
export function calculateMilestoneVariance(
  milestone: DealMilestone,
  currentDate: string
): MilestoneVariance {
  // No actual data - return not started
  if (!milestone.actualStartDate && !milestone.actualCompletionDate) {
    return {
      varianceDays: 0,
      variancePercent: 0,
      status: 'not_started',
      display: 'Not started',
      hasActualData: false,
    };
  }

  // Calculate planned duration
  const plannedStart = milestone.startDate;
  const plannedEnd = milestone.endDate ?? milestone.startDate;
  const plannedDuration = daysBetween(plannedStart, plannedEnd) + 1; // +1 for inclusive

  // Determine actual dates (use planned if actual not set)
  const actualStart = milestone.actualStartDate ?? plannedStart;
  const actualEnd = milestone.actualCompletionDate ?? currentDate;
  const actualDuration = daysBetween(actualStart, actualEnd) + 1;

  // Calculate variance
  const varianceDays = actualDuration - plannedDuration;
  const variancePercent = plannedDuration > 0 
    ? (varianceDays / plannedDuration) * 100 
    : 0;

  const status = getVarianceStatus(variancePercent);
  const display = formatVarianceDisplay(varianceDays);

  return {
    varianceDays,
    variancePercent,
    status,
    display,
    hasActualData: true,
  };
}

/**
 * Calculate start date variance (when actual start differs from planned)
 */
export function calculateStartVariance(
  plannedStart: string,
  actualStart: string
): { varianceDays: number; display: string } {
  const varianceDays = daysBetween(plannedStart, actualStart);
  
  if (varianceDays === 0) {
    return { varianceDays: 0, display: 'On time' };
  }
  
  const display = varianceDays > 0 
    ? `Started ${formatVarianceDisplay(varianceDays).replace('+', '')} late`
    : `Started ${formatVarianceDisplay(varianceDays).replace('-', '')} early`;
    
  return { varianceDays, display };
}

/**
 * Determine if milestone is in progress (has start but no completion)
 */
export function isMilestoneInProgress(milestone: DealMilestone): boolean {
  return milestone.actualStartDate !== null && milestone.actualCompletionDate === null;
}

/**
 * Determine if milestone is completed (has completion date)
 */
export function isMilestoneCompleted(milestone: DealMilestone): boolean {
  return milestone.actualCompletionDate !== null;
}

/**
 * Get the effective end date for display (actual if completed, current if in progress, planned if not started)
 */
export function getEffectiveEndDate(
  milestone: DealMilestone,
  currentDate: string
): string {
  if (milestone.actualCompletionDate) {
    return milestone.actualCompletionDate;
  }
  if (milestone.actualStartDate) {
    // In progress - use current date as projected end
    return currentDate;
  }
  // Not started - use planned end
  return milestone.endDate ?? milestone.startDate;
}

