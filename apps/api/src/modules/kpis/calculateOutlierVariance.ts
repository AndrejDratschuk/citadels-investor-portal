/**
 * Pure Functions for Outlier Variance Calculation
 * OPERATORS: No side effects, no try/catch, bubble errors up
 */

import type {
  OutlierStatus,
  OutlierComparisonBaseline,
  KpiOutlier,
  KpiDefinition,
  KpiDataPoint,
  KpiOutlierConfig,
  KpiFormat,
  KpiCategory,
} from '@altsui/shared';

// ============================================
// Variance Calculation (Pure)
// ============================================

/**
 * Calculate percentage variance between actual and baseline values.
 * For inverse metrics (expenses), flips the sign so positive = good.
 * 
 * @throws Error if baseline is zero (division by zero)
 */
export function calculateVariance(
  actual: number,
  baseline: number,
  isInverse: boolean
): number {
  if (baseline === 0) {
    throw new Error('Cannot calculate variance with zero baseline');
  }
  const variance = ((actual - baseline) / baseline) * 100;
  return isInverse ? -variance : variance;
}

// ============================================
// Status Determination (Pure)
// ============================================

/**
 * Determine outlier status based on variance and thresholds.
 * Green = exceeding expectations, Red = missing targets, Yellow = attention needed
 */
export function determineOutlierStatus(
  variancePercent: number,
  greenThreshold: number,
  redThreshold: number
): OutlierStatus {
  if (variancePercent >= greenThreshold) return 'green';
  if (variancePercent <= -redThreshold) return 'red';
  return 'yellow';
}

// ============================================
// Outlier Identification (Pure)
// ============================================

interface KpiWithBaseline {
  definition: KpiDefinition;
  actualValue: number;
  baselineValue: number;
  baselineType: OutlierComparisonBaseline;
}

interface OutlierConfig {
  alertThreshold: number;
  greenThreshold: number;
  redThreshold: number;
  isInverseMetric: boolean;
}

const DEFAULT_CONFIG: OutlierConfig = {
  alertThreshold: 20,
  greenThreshold: 20,
  redThreshold: 20,
  isInverseMetric: false,
};

/**
 * Process a single KPI and return an outlier if it exceeds threshold.
 * Returns null if variance is within acceptable range.
 */
export function processKpiForOutlier(
  kpi: KpiWithBaseline,
  config: OutlierConfig
): KpiOutlier | null {
  const { definition, actualValue, baselineValue, baselineType } = kpi;
  const { alertThreshold, greenThreshold, redThreshold, isInverseMetric } = config;

  // Skip if baseline is zero
  if (baselineValue === 0) {
    return null;
  }

  const variancePercent = calculateVariance(actualValue, baselineValue, isInverseMetric);

  // Check if variance exceeds alert threshold
  if (Math.abs(variancePercent) < alertThreshold) {
    return null;
  }

  const status = determineOutlierStatus(variancePercent, greenThreshold, redThreshold);

  return {
    kpiId: definition.id,
    kpiCode: definition.code,
    kpiName: definition.name,
    category: definition.category,
    variancePercent,
    actualValue,
    baselineValue,
    baselineType,
    absoluteDifference: actualValue - baselineValue,
    status,
    format: definition.format,
  };
}

// ============================================
// Batch Processing (Pure)
// ============================================

interface IdentifyOutliersInput {
  kpisWithBaselines: KpiWithBaseline[];
  configsByKpiId: Map<string, KpiOutlierConfig>;
  defaultInverseKpiCodes: string[];
}

/**
 * Identify all outliers from a list of KPIs with their baselines.
 * Returns sorted arrays of top and bottom performers.
 */
export function identifyOutliers(input: IdentifyOutliersInput): {
  topPerformers: KpiOutlier[];
  bottomPerformers: KpiOutlier[];
} {
  const { kpisWithBaselines, configsByKpiId, defaultInverseKpiCodes } = input;

  const outliers: KpiOutlier[] = [];

  for (const kpi of kpisWithBaselines) {
    const customConfig = configsByKpiId.get(kpi.definition.id);
    
    // Skip if explicitly disabled
    if (customConfig?.enabledInOutliers === false) {
      continue;
    }

    // Build config from custom settings or defaults
    const isInverseDefault = defaultInverseKpiCodes.includes(kpi.definition.code);
    const config: OutlierConfig = {
      alertThreshold: customConfig?.alertThreshold ?? DEFAULT_CONFIG.alertThreshold,
      greenThreshold: customConfig?.greenThreshold ?? DEFAULT_CONFIG.greenThreshold,
      redThreshold: customConfig?.redThreshold ?? DEFAULT_CONFIG.redThreshold,
      isInverseMetric: customConfig?.isInverseMetric ?? isInverseDefault,
    };

    const outlier = processKpiForOutlier(kpi, config);
    if (outlier) {
      outliers.push(outlier);
    }
  }

  // Split and sort by variance magnitude
  const topPerformers = outliers
    .filter(o => o.variancePercent > 0)
    .sort((a, b) => b.variancePercent - a.variancePercent);

  const bottomPerformers = outliers
    .filter(o => o.variancePercent < 0)
    .sort((a, b) => a.variancePercent - b.variancePercent);

  return { topPerformers, bottomPerformers };
}

// ============================================
// Data Extraction Helpers (Pure)
// ============================================

interface KpiDataByType {
  actual: KpiDataPoint | null;
  forecast: KpiDataPoint | null;
  budget: KpiDataPoint | null;
  lastPeriod: KpiDataPoint | null;
}

/**
 * Extract baseline value based on comparison type.
 * Returns null if baseline data is not available.
 */
export function extractBaselineValue(
  dataByType: KpiDataByType,
  comparisonBaseline: OutlierComparisonBaseline
): number | null {
  switch (comparisonBaseline) {
    case 'forecast':
      return dataByType.forecast?.value ?? null;
    case 'budget':
      return dataByType.budget?.value ?? null;
    case 'last_period':
      return dataByType.lastPeriod?.value ?? null;
  }
}

/**
 * Group KPI data points by KPI ID and data type.
 */
export function groupKpiDataByKpiAndType(
  dataPoints: KpiDataPoint[]
): Map<string, KpiDataByType> {
  const grouped = new Map<string, KpiDataByType>();

  for (const point of dataPoints) {
    if (!grouped.has(point.kpiId)) {
      grouped.set(point.kpiId, {
        actual: null,
        forecast: null,
        budget: null,
        lastPeriod: null,
      });
    }

    const entry = grouped.get(point.kpiId)!;
    
    // Keep the most recent for each type
    switch (point.dataType) {
      case 'actual':
        if (!entry.actual || point.periodDate > entry.actual.periodDate) {
          entry.actual = point;
        }
        break;
      case 'forecast':
        if (!entry.forecast || point.periodDate > entry.forecast.periodDate) {
          entry.forecast = point;
        }
        break;
      case 'budget':
        if (!entry.budget || point.periodDate > entry.budget.periodDate) {
          entry.budget = point;
        }
        break;
    }
  }

  return grouped;
}

// ============================================
// KPI Variance Calculation (Pure)
// ============================================

import type { KpiVariance, KpiFormat } from '@altsui/shared';

/**
 * Calculate variance between actual and baseline values.
 * For percentage KPIs, returns point difference instead of percent-of-percent.
 * For inverse metrics (expenses), flips the status interpretation.
 */
export function calculateKpiVariance(
  actualValue: number | null,
  baselineValue: number | null,
  format: KpiFormat,
  isInverse: boolean
): KpiVariance | null {
  if (actualValue === null || baselineValue === null || baselineValue === 0) {
    return null;
  }

  const amount = actualValue - baselineValue;
  
  // For percentage KPIs, don't calculate percent-of-percent
  // Instead, return the point difference
  const isPercentageKpi = format === 'percentage';
  const percent = isPercentageKpi 
    ? null 
    : ((actualValue - baselineValue) / baselineValue) * 100;

  // Determine status based on variance
  const varianceForStatus = isPercentageKpi 
    ? amount * 100 // Convert decimal difference to percentage points for status
    : percent!;
  
  const status = determineVarianceStatus(varianceForStatus, isInverse);

  return { amount, percent, status };
}

/**
 * Determine variance status color based on percentage and direction.
 * For inverse metrics (expenses), lower is better.
 */
export function determineVarianceStatus(
  variancePercent: number,
  isInverse: boolean
): 'green' | 'yellow' | 'red' | 'neutral' {
  // Flip interpretation for inverse metrics
  const adjustedVariance = isInverse ? -variancePercent : variancePercent;

  if (adjustedVariance >= 10) return 'green';     // Significantly above baseline
  if (adjustedVariance >= 0) return 'neutral';    // At or slightly above
  if (adjustedVariance >= -10) return 'yellow';   // Slightly below
  return 'red';                                    // Significantly below
}

