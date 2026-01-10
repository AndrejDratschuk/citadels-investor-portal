/**
 * Sample Data for Data Import Onboarding
 * Comprehensive dataset with all essential metrics for real estate analytics
 */

import type { SampleDataConfig, SampleDataRow } from '@altsui/shared';

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
// Sample Data Generation
// ============================================

/**
 * Generate 12 months of comprehensive KPI data
 * Includes all ESSENTIAL metrics users need to provide
 */
function generateComprehensiveSampleRows(): SampleDataRow[] {
  const months = [
    '2024-01-01', '2024-02-01', '2024-03-01', '2024-04-01',
    '2024-05-01', '2024-06-01', '2024-07-01', '2024-08-01',
    '2024-09-01', '2024-10-01', '2024-11-01', '2024-12-01',
  ];

  // Base values for a 200-unit multifamily property
  const baseGPR = 520000;        // $2,600/unit market rent
  const baseRevenue = 485000;    // Slightly below GPR due to vacancy/concessions
  const baseExpenses = 195000;   // ~40% expense ratio
  const baseOccupancy = 94;      // 94% physical occupancy
  const propertyValue = 52000000; // Current value (appreciated from purchase)
  const loanBalance = 33000000;   // ~64% LTV
  const monthlyDebtService = 175000; // P&I payment
  const interestRate = 6.25;      // Current rate

  return months.map((date, index): SampleDataRow => {
    // Add realistic seasonal and trend variations
    const seasonalFactor = 1 + Math.sin((index / 12) * Math.PI * 2) * 0.02;
    const trendFactor = 1 + (index * 0.004); // 0.4% monthly growth
    const randomFactor = 1 + (Math.random() - 0.5) * 0.01;

    // ESSENTIAL METRICS (Must come from user)
    const grossPotentialRent = Math.round(baseGPR * trendFactor);
    const totalRevenue = Math.round(baseRevenue * seasonalFactor * trendFactor * randomFactor);
    const totalExpenses = Math.round(baseExpenses * (1 + index * 0.002) * randomFactor);
    const occupancyRate = Number(Math.min(98, Math.max(91, baseOccupancy + (index * 0.15) + (Math.random() - 0.5) * 2)).toFixed(1));
    const currentPropertyValue = Math.round(propertyValue * (1 + index * 0.003));
    const currentLoanBalance = Math.round(loanBalance - (index * 45000)); // Amortization
    
    // OPTIONAL BUT VALUABLE METRICS
    const concessions = Math.round(grossPotentialRent * 0.02 * (1 - occupancyRate / 100) * 2);
    const lossToLease = Math.round(grossPotentialRent * 0.03); // 3% below market on avg
    const moveIns = Math.round(4 + Math.random() * 4);  // 4-8 move-ins
    const moveOuts = Math.round(3 + Math.random() * 4); // 3-7 move-outs
    const avgDaysVacant = Math.round(18 + Math.random() * 10); // 18-28 days
    const renewalRate = Number((75 + Math.random() * 15).toFixed(1)); // 75-90%

    // CALCULATED METRICS (System computes these)
    const noi = totalRevenue - totalExpenses;
    const noiMargin = Number((noi / totalRevenue * 100).toFixed(1));
    const expenseRatio = Number((totalExpenses / totalRevenue * 100).toFixed(1));
    const capRate = Number((noi * 12 / currentPropertyValue * 100).toFixed(2));
    const dscr = Number((noi / monthlyDebtService).toFixed(2));
    const ltv = Number((currentLoanBalance / currentPropertyValue * 100).toFixed(1));
    const annualDebtService = monthlyDebtService * 12;
    const economicOccupancy = Number((totalRevenue / grossPotentialRent * 100).toFixed(1));
    const vacancyRate = Number((100 - occupancyRate).toFixed(1));
    
    return {
      date,
      // Period identifier
      'Date': date,
      'Period': date,
      
      // ESSENTIAL USER INPUTS
      'Total Revenue': totalRevenue,
      'Gross Potential Rent': grossPotentialRent,
      'Operating Expenses': totalExpenses,
      'Occupancy Rate': occupancyRate,
      'Property Value': currentPropertyValue,
      'Loan Balance': currentLoanBalance,
      'Monthly Debt Service': monthlyDebtService,
      
      // OPTIONAL USER INPUTS
      'Concessions': concessions,
      'Loss to Lease': lossToLease,
      'Move-Ins': moveIns,
      'Move-Outs': moveOuts,
      'Avg Days Vacant': avgDaysVacant,
      'Renewal Rate': renewalRate,
      'Interest Rate': interestRate,
      
      // CALCULATED METRICS (shown for reference)
      'Net Operating Income': noi,
      'NOI Margin': noiMargin,
      'Expense Ratio': expenseRatio,
      'Cap Rate': capRate,
      'DSCR': dscr,
      'LTV': ltv,
      'Annual Debt Service': annualDebtService,
      'Economic Occupancy': economicOccupancy,
      'Vacancy Rate': vacancyRate,
    };
  });
}

// ============================================
// Exported Sample Data Configuration
// ============================================

/**
 * Full sample data config with comprehensive metrics
 */
export const SAMPLE_DATA_CONFIG: SampleDataConfig = {
  name: `Sample Property - ${PROPERTY_CONFIG.name}`,
  description: `12 months of financial and operational data for a ${PROPERTY_CONFIG.totalUnits}-unit multifamily property`,
  propertyType: PROPERTY_CONFIG.type,
  columns: [
    // Essential columns - users MUST provide these
    'Date',
    'Total Revenue',
    'Gross Potential Rent',
    'Operating Expenses',
    'Occupancy Rate',
    'Property Value',
    'Loan Balance',
    'Monthly Debt Service',
    // Optional but valuable
    'Concessions',
    'Loss to Lease',
    'Move-Ins',
    'Move-Outs',
    'Avg Days Vacant',
    'Renewal Rate',
    'Interest Rate',
    // Calculated (for reference)
    'Net Operating Income',
    'NOI Margin',
    'Cap Rate',
    'DSCR',
    'LTV',
  ],
  rows: generateComprehensiveSampleRows(),
};

/**
 * Minimal sample data - only essential metrics
 * Use this when you want the simplest possible import
 */
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
  rows: generateComprehensiveSampleRows().map(row => ({
    date: row.date,
    'Date': row['Date'],
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

/**
 * Get sample data as array of records for import
 */
export function getSampleDataRows(): Array<Record<string, unknown>> {
  return SAMPLE_DATA_CONFIG.rows.map(row => {
    const { date, ...rest } = row;
    return rest;
  });
}

/**
 * Get minimal sample data (essential metrics only)
 */
export function getMinimalSampleDataRows(): Array<Record<string, unknown>> {
  return MINIMAL_SAMPLE_DATA_CONFIG.rows.map(row => {
    const { date, ...rest } = row;
    return rest;
  });
}

/**
 * Get sample data column names
 */
export function getSampleDataColumns(): string[] {
  return SAMPLE_DATA_CONFIG.columns;
}

/**
 * Get minimal sample data column names
 */
export function getMinimalSampleDataColumns(): string[] {
  return MINIMAL_SAMPLE_DATA_CONFIG.columns;
}

/**
 * Pre-defined column mappings for sample data
 * Maps column names to KPI codes
 */
export const SAMPLE_DATA_MAPPINGS = [
  // Essential metrics
  { columnName: 'Total Revenue', kpiCode: 'total_revenue', dataType: 'actual' as const },
  { columnName: 'Gross Potential Rent', kpiCode: 'gpr', dataType: 'actual' as const },
  { columnName: 'Operating Expenses', kpiCode: 'total_expenses', dataType: 'actual' as const },
  { columnName: 'Occupancy Rate', kpiCode: 'physical_occupancy', dataType: 'actual' as const },
  { columnName: 'Property Value', kpiCode: 'property_value', dataType: 'actual' as const },
  { columnName: 'Loan Balance', kpiCode: 'principal_balance', dataType: 'actual' as const },
  { columnName: 'Monthly Debt Service', kpiCode: 'monthly_debt_service', dataType: 'actual' as const },
  // Optional metrics
  { columnName: 'Concessions', kpiCode: 'concessions', dataType: 'actual' as const },
  { columnName: 'Loss to Lease', kpiCode: 'loss_to_lease', dataType: 'actual' as const },
  { columnName: 'Move-Ins', kpiCode: 'move_ins', dataType: 'actual' as const },
  { columnName: 'Move-Outs', kpiCode: 'move_outs', dataType: 'actual' as const },
  { columnName: 'Avg Days Vacant', kpiCode: 'avg_days_vacant', dataType: 'actual' as const },
  { columnName: 'Renewal Rate', kpiCode: 'lease_renewal_rate', dataType: 'actual' as const },
  { columnName: 'Interest Rate', kpiCode: 'interest_rate', dataType: 'actual' as const },
  // Calculated metrics (shown in sample for reference)
  { columnName: 'Net Operating Income', kpiCode: 'noi', dataType: 'actual' as const },
  { columnName: 'NOI Margin', kpiCode: 'noi_margin', dataType: 'actual' as const },
  { columnName: 'Cap Rate', kpiCode: 'cap_rate', dataType: 'actual' as const },
  { columnName: 'DSCR', kpiCode: 'dscr', dataType: 'actual' as const },
  { columnName: 'LTV', kpiCode: 'ltv', dataType: 'actual' as const },
];

/**
 * Essential metrics - the minimum a user needs to provide
 * Everything else can be calculated from these
 */
export const ESSENTIAL_METRICS = [
  { code: 'total_revenue', name: 'Total Revenue', description: 'All income received from the property' },
  { code: 'gpr', name: 'Gross Potential Rent', description: 'Max rent if 100% occupied at market rates' },
  { code: 'total_expenses', name: 'Operating Expenses', description: 'All operating costs (excluding debt service)' },
  { code: 'physical_occupancy', name: 'Occupancy Rate', description: 'Percentage of units occupied' },
  { code: 'property_value', name: 'Property Value', description: 'Current estimated market value' },
  { code: 'principal_balance', name: 'Loan Balance', description: 'Outstanding mortgage principal' },
  { code: 'monthly_debt_service', name: 'Monthly Debt Service', description: 'Monthly mortgage payment (P&I)' },
];

/**
 * Calculated metrics - system derives these from essential metrics
 */
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
