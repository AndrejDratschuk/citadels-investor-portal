/**
 * Sample Data for Data Import Onboarding
 * Comprehensive dataset with Actual, Forecast, and Budget dimensions
 * for real estate analytics demonstration
 */

import type { SampleDataConfig, SampleDataRow, KpiDataType } from '@altsui/shared';

// ============================================
// Property Configuration for Sample Data
// ============================================
const PROPERTY_CONFIG = {
  name: 'Oakwood Apartments',
  type: 'Multifamily',
  totalUnits: 200,
  totalSqFt: 180000,
  purchasePrice: 45000000,
  equityInvested: 15000000,
};

// ============================================
// Base Values & Time Periods
// ============================================
const MONTHS_2024 = [
  '2024-01-01', '2024-02-01', '2024-03-01', '2024-04-01',
  '2024-05-01', '2024-06-01', '2024-07-01', '2024-08-01',
  '2024-09-01', '2024-10-01', '2024-11-01', '2024-12-01',
];

// Base values for a 200-unit multifamily property
const BASE = {
  gpr: 520000,              // $2,600/unit market rent
  revenue: 485000,          // Slightly below GPR due to vacancy/concessions
  expenses: 195000,         // ~40% expense ratio
  occupancy: 94,            // 94% physical occupancy
  propertyValue: 52000000,  // Current value
  loanBalance: 33000000,    // ~64% LTV
  monthlyDebtService: 175000,
  interestRate: 6.25,
};

// ============================================
// Deterministic Seed-based Random
// ============================================
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// ============================================
// ACTUAL Data Generation
// ============================================
function generateActualRows(): SampleDataRow[] {
  return MONTHS_2024.map((date, index): SampleDataRow => {
    const seed = index * 7 + 1;
    const seasonalFactor = 1 + Math.sin((index / 12) * Math.PI * 2) * 0.02;
    const trendFactor = 1 + (index * 0.004);
    const randomFactor = 1 + (seededRandom(seed) - 0.5) * 0.015;

    const grossPotentialRent = Math.round(BASE.gpr * trendFactor);
    const totalRevenue = Math.round(BASE.revenue * seasonalFactor * trendFactor * randomFactor);
    const totalExpenses = Math.round(BASE.expenses * (1 + index * 0.002) * (1 + (seededRandom(seed + 1) - 0.5) * 0.01));
    const occupancyRate = Number(Math.min(97, Math.max(92, BASE.occupancy + (index * 0.12) + (seededRandom(seed + 2) - 0.5) * 1.5)).toFixed(1));
    const currentPropertyValue = Math.round(BASE.propertyValue * (1 + index * 0.003));
    const currentLoanBalance = Math.round(BASE.loanBalance - (index * 45000));

    const concessions = Math.round(grossPotentialRent * 0.018 * (1 - occupancyRate / 100) * 2);
    const lossToLease = Math.round(grossPotentialRent * 0.028);
    const moveIns = Math.round(4 + seededRandom(seed + 3) * 4);
    const moveOuts = Math.round(3 + seededRandom(seed + 4) * 4);
    const avgDaysVacant = Math.round(18 + seededRandom(seed + 5) * 10);
    const renewalRate = Number((76 + seededRandom(seed + 6) * 14).toFixed(1));

    const noi = totalRevenue - totalExpenses;
    const noiMargin = Number((noi / totalRevenue * 100).toFixed(1));
    const capRate = Number((noi * 12 / currentPropertyValue * 100).toFixed(2));
    const dscr = Number((noi / BASE.monthlyDebtService).toFixed(2));
    const ltv = Number((currentLoanBalance / currentPropertyValue * 100).toFixed(1));

    return {
      date,
      'Date': date,
      'Period': date,
      'Total Revenue': totalRevenue,
      'Gross Potential Rent': grossPotentialRent,
      'Operating Expenses': totalExpenses,
      'Occupancy Rate': occupancyRate,
      'Property Value': currentPropertyValue,
      'Loan Balance': currentLoanBalance,
      'Monthly Debt Service': BASE.monthlyDebtService,
      'Concessions': concessions,
      'Loss to Lease': lossToLease,
      'Move-Ins': moveIns,
      'Move-Outs': moveOuts,
      'Avg Days Vacant': avgDaysVacant,
      'Renewal Rate': renewalRate,
      'Interest Rate': BASE.interestRate,
      'Net Operating Income': noi,
      'NOI Margin': noiMargin,
      'Cap Rate': capRate,
      'DSCR': dscr,
      'LTV': ltv,
    };
  });
}

// ============================================
// BUDGET Data Generation
// Budget = Annual plan set at year start, static targets
// ============================================
function generateBudgetRows(): SampleDataRow[] {
  return MONTHS_2024.map((date, index): SampleDataRow => {
    // Budget is typically set conservatively at year start
    // Linear growth assumptions, no seasonal variation (simplified planning)
    const monthlyGrowth = 0.003; // 0.3% monthly growth planned
    const growthFactor = 1 + (index * monthlyGrowth);

    const grossPotentialRent = Math.round(BASE.gpr * growthFactor);
    const totalRevenue = Math.round(BASE.revenue * growthFactor);
    const totalExpenses = Math.round(BASE.expenses * (1 + index * 0.0015)); // Lower expense growth budgeted
    const occupancyRate = Number(Math.min(96, BASE.occupancy + (index * 0.1)).toFixed(1)); // Steady improvement target
    const currentPropertyValue = Math.round(BASE.propertyValue * (1 + index * 0.0025));
    const currentLoanBalance = Math.round(BASE.loanBalance - (index * 45000));

    const concessions = Math.round(grossPotentialRent * 0.015); // Lower concessions target
    const lossToLease = Math.round(grossPotentialRent * 0.025); // Target to reduce loss to lease
    const moveIns = 5; // Steady state target
    const moveOuts = 4;
    const avgDaysVacant = 20; // Target days vacant
    const renewalRate = 82.0; // Target renewal rate

    const noi = totalRevenue - totalExpenses;
    const noiMargin = Number((noi / totalRevenue * 100).toFixed(1));
    const capRate = Number((noi * 12 / currentPropertyValue * 100).toFixed(2));
    const dscr = Number((noi / BASE.monthlyDebtService).toFixed(2));
    const ltv = Number((currentLoanBalance / currentPropertyValue * 100).toFixed(1));

    return {
      date,
      'Date': date,
      'Period': date,
      'Total Revenue': totalRevenue,
      'Gross Potential Rent': grossPotentialRent,
      'Operating Expenses': totalExpenses,
      'Occupancy Rate': occupancyRate,
      'Property Value': currentPropertyValue,
      'Loan Balance': currentLoanBalance,
      'Monthly Debt Service': BASE.monthlyDebtService,
      'Concessions': concessions,
      'Loss to Lease': lossToLease,
      'Move-Ins': moveIns,
      'Move-Outs': moveOuts,
      'Avg Days Vacant': avgDaysVacant,
      'Renewal Rate': renewalRate,
      'Interest Rate': BASE.interestRate,
      'Net Operating Income': noi,
      'NOI Margin': noiMargin,
      'Cap Rate': capRate,
      'DSCR': dscr,
      'LTV': ltv,
    };
  });
}

// ============================================
// FORECAST Data Generation
// Forecast = Updated projections, more optimistic early, converges to actual
// ============================================
function generateForecastRows(): SampleDataRow[] {
  return MONTHS_2024.map((date, index): SampleDataRow => {
    // Forecast is typically 2-4% more optimistic than actual results
    // Shows what management expected before results came in
    const optimismFactor = 1.025 - (index * 0.001); // Starts 2.5% optimistic, decreases over year
    const trendFactor = 1 + (index * 0.0045); // Slightly higher growth expectation

    const grossPotentialRent = Math.round(BASE.gpr * trendFactor);
    const totalRevenue = Math.round(BASE.revenue * trendFactor * optimismFactor);
    const totalExpenses = Math.round(BASE.expenses * (1 + index * 0.0018)); // Slightly better expense control expected
    const occupancyRate = Number(Math.min(97.5, BASE.occupancy + (index * 0.15) + 0.5).toFixed(1)); // Higher occupancy forecast
    const currentPropertyValue = Math.round(BASE.propertyValue * (1 + index * 0.0035));
    const currentLoanBalance = Math.round(BASE.loanBalance - (index * 45000));

    const concessions = Math.round(grossPotentialRent * 0.016);
    const lossToLease = Math.round(grossPotentialRent * 0.026);
    const moveIns = 6; // Slightly more optimistic
    const moveOuts = 4;
    const avgDaysVacant = 18; // Better turnover expected
    const renewalRate = 84.0; // Higher renewal target

    const noi = totalRevenue - totalExpenses;
    const noiMargin = Number((noi / totalRevenue * 100).toFixed(1));
    const capRate = Number((noi * 12 / currentPropertyValue * 100).toFixed(2));
    const dscr = Number((noi / BASE.monthlyDebtService).toFixed(2));
    const ltv = Number((currentLoanBalance / currentPropertyValue * 100).toFixed(1));

    return {
      date,
      'Date': date,
      'Period': date,
      'Total Revenue': totalRevenue,
      'Gross Potential Rent': grossPotentialRent,
      'Operating Expenses': totalExpenses,
      'Occupancy Rate': occupancyRate,
      'Property Value': currentPropertyValue,
      'Loan Balance': currentLoanBalance,
      'Monthly Debt Service': BASE.monthlyDebtService,
      'Concessions': concessions,
      'Loss to Lease': lossToLease,
      'Move-Ins': moveIns,
      'Move-Outs': moveOuts,
      'Avg Days Vacant': avgDaysVacant,
      'Renewal Rate': renewalRate,
      'Interest Rate': BASE.interestRate,
      'Net Operating Income': noi,
      'NOI Margin': noiMargin,
      'Cap Rate': capRate,
      'DSCR': dscr,
      'LTV': ltv,
    };
  });
}

// ============================================
// Sample Data Configurations
// ============================================

const SAMPLE_COLUMNS: readonly string[] = [
  'Date',
  'Total Revenue',
  'Gross Potential Rent',
  'Operating Expenses',
  'Occupancy Rate',
  'Property Value',
  'Loan Balance',
  'Monthly Debt Service',
  'Concessions',
  'Loss to Lease',
  'Move-Ins',
  'Move-Outs',
  'Avg Days Vacant',
  'Renewal Rate',
  'Interest Rate',
  'Net Operating Income',
  'NOI Margin',
  'Cap Rate',
  'DSCR',
  'LTV',
];

export const SAMPLE_DATA_CONFIG: SampleDataConfig = {
  name: `Sample Property - ${PROPERTY_CONFIG.name}`,
  description: `12 months of financial and operational data for a ${PROPERTY_CONFIG.totalUnits}-unit multifamily property`,
  propertyType: PROPERTY_CONFIG.type,
  columns: SAMPLE_COLUMNS,
  rows: generateActualRows(),
};

export const SAMPLE_BUDGET_CONFIG: SampleDataConfig = {
  name: `Sample Budget - ${PROPERTY_CONFIG.name}`,
  description: `Annual budget targets for a ${PROPERTY_CONFIG.totalUnits}-unit multifamily property`,
  propertyType: PROPERTY_CONFIG.type,
  columns: SAMPLE_COLUMNS,
  rows: generateBudgetRows(),
};

export const SAMPLE_FORECAST_CONFIG: SampleDataConfig = {
  name: `Sample Forecast - ${PROPERTY_CONFIG.name}`,
  description: `Updated projections for a ${PROPERTY_CONFIG.totalUnits}-unit multifamily property`,
  propertyType: PROPERTY_CONFIG.type,
  columns: SAMPLE_COLUMNS,
  rows: generateForecastRows(),
};

export const MINIMAL_SAMPLE_DATA_CONFIG: SampleDataConfig = {
  name: `Minimal Sample - ${PROPERTY_CONFIG.name}`,
  description: 'Essential metrics only - system will calculate the rest',
  propertyType: PROPERTY_CONFIG.type,
  columns: [
    'Date',
    'Total Revenue',
    'Gross Potential Rent',
    'Operating Expenses',
    'Occupancy Rate',
    'Property Value',
    'Loan Balance',
    'Monthly Debt Service',
  ],
  rows: generateActualRows().map(row => ({
    date: row.date,
    'Date': row['Date'],
    'Period': row['Period'],
    'Total Revenue': row['Total Revenue'],
    'Gross Potential Rent': row['Gross Potential Rent'],
    'Operating Expenses': row['Operating Expenses'],
    'Occupancy Rate': row['Occupancy Rate'],
    'Property Value': row['Property Value'],
    'Loan Balance': row['Loan Balance'],
    'Monthly Debt Service': row['Monthly Debt Service'],
  })),
};

// ============================================
// Export Functions
// ============================================

export function getSampleDataRows(): Array<Record<string, unknown>> {
  return SAMPLE_DATA_CONFIG.rows.map(({ date, ...rest }) => rest);
}

export function getSampleBudgetRows(): Array<Record<string, unknown>> {
  return SAMPLE_BUDGET_CONFIG.rows.map(({ date, ...rest }) => rest);
}

export function getSampleForecastRows(): Array<Record<string, unknown>> {
  return SAMPLE_FORECAST_CONFIG.rows.map(({ date, ...rest }) => rest);
}

export function getMinimalSampleDataRows(): Array<Record<string, unknown>> {
  return MINIMAL_SAMPLE_DATA_CONFIG.rows.map(({ date, ...rest }) => rest);
}

export function getSampleDataColumns(): string[] {
  return [...SAMPLE_DATA_CONFIG.columns];
}

export function getMinimalSampleDataColumns(): string[] {
  return [...MINIMAL_SAMPLE_DATA_CONFIG.columns];
}

// ============================================
// Column Mappings for Each Dimension
// ============================================

function createMappings(dataType: KpiDataType) {
  return [
    { columnName: 'Total Revenue', kpiCode: 'total_revenue', dataType },
    { columnName: 'Gross Potential Rent', kpiCode: 'gpr', dataType },
    { columnName: 'Operating Expenses', kpiCode: 'total_expenses', dataType },
    { columnName: 'Occupancy Rate', kpiCode: 'physical_occupancy', dataType },
    { columnName: 'Property Value', kpiCode: 'property_value', dataType },
    { columnName: 'Loan Balance', kpiCode: 'principal_balance', dataType },
    { columnName: 'Monthly Debt Service', kpiCode: 'monthly_debt_service', dataType },
    { columnName: 'Concessions', kpiCode: 'concessions', dataType },
    { columnName: 'Loss to Lease', kpiCode: 'loss_to_lease', dataType },
    { columnName: 'Move-Ins', kpiCode: 'move_ins', dataType },
    { columnName: 'Move-Outs', kpiCode: 'move_outs', dataType },
    { columnName: 'Avg Days Vacant', kpiCode: 'avg_days_vacant', dataType },
    { columnName: 'Renewal Rate', kpiCode: 'lease_renewal_rate', dataType },
    { columnName: 'Interest Rate', kpiCode: 'interest_rate', dataType },
    { columnName: 'Net Operating Income', kpiCode: 'noi', dataType },
    { columnName: 'NOI Margin', kpiCode: 'noi_margin', dataType },
    { columnName: 'Cap Rate', kpiCode: 'cap_rate', dataType },
    { columnName: 'DSCR', kpiCode: 'dscr', dataType },
    { columnName: 'LTV', kpiCode: 'ltv', dataType },
  ];
}

/** Column mappings for Actual data (default, maintains backwards compatibility) */
export const SAMPLE_DATA_MAPPINGS = createMappings('actual');

/** Column mappings for Budget data */
export const SAMPLE_BUDGET_MAPPINGS = createMappings('budget');

/** Column mappings for Forecast data */
export const SAMPLE_FORECAST_MAPPINGS = createMappings('forecast');

/** All mappings grouped by dimension */
export const SAMPLE_DATA_MAPPINGS_BY_DIMENSION = {
  actual: SAMPLE_DATA_MAPPINGS,
  forecast: SAMPLE_FORECAST_MAPPINGS,
  budget: SAMPLE_BUDGET_MAPPINGS,
} as const;

/** All sample data grouped by dimension */
export const SAMPLE_DATA_BY_DIMENSION = {
  actual: { config: SAMPLE_DATA_CONFIG, rows: getSampleDataRows, mappings: SAMPLE_DATA_MAPPINGS },
  forecast: { config: SAMPLE_FORECAST_CONFIG, rows: getSampleForecastRows, mappings: SAMPLE_FORECAST_MAPPINGS },
  budget: { config: SAMPLE_BUDGET_CONFIG, rows: getSampleBudgetRows, mappings: SAMPLE_BUDGET_MAPPINGS },
} as const;

// ============================================
// Metric Definitions
// ============================================

export const ESSENTIAL_METRICS = [
  { code: 'total_revenue', name: 'Total Revenue', description: 'All income received from the property' },
  { code: 'gpr', name: 'Gross Potential Rent', description: 'Max rent if 100% occupied at market rates' },
  { code: 'total_expenses', name: 'Operating Expenses', description: 'All operating costs (excluding debt service)' },
  { code: 'physical_occupancy', name: 'Occupancy Rate', description: 'Percentage of units occupied' },
  { code: 'property_value', name: 'Property Value', description: 'Current estimated market value' },
  { code: 'principal_balance', name: 'Loan Balance', description: 'Outstanding mortgage principal' },
  { code: 'monthly_debt_service', name: 'Monthly Debt Service', description: 'Monthly mortgage payment (P&I)' },
];

export const CALCULATED_METRICS = [
  { code: 'noi', name: 'Net Operating Income', formula: 'Total Revenue - Operating Expenses' },
  { code: 'noi_margin', name: 'NOI Margin', formula: 'NOI / Total Revenue × 100' },
  { code: 'operating_expense_ratio', name: 'Expense Ratio', formula: 'Operating Expenses / Total Revenue × 100' },
  { code: 'cap_rate', name: 'Cap Rate', formula: '(NOI × 12) / Property Value × 100' },
  { code: 'dscr', name: 'DSCR', formula: 'NOI / Monthly Debt Service' },
  { code: 'ltv', name: 'LTV', formula: 'Loan Balance / Property Value × 100' },
  { code: 'vacancy_rate', name: 'Vacancy Rate', formula: '100 - Occupancy Rate' },
  { code: 'economic_occupancy', name: 'Economic Occupancy', formula: 'Total Revenue / GPR × 100' },
  { code: 'annual_debt_service', name: 'Annual Debt Service', formula: 'Monthly Debt Service × 12' },
];
