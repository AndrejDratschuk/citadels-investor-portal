/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return part / total;
}

/**
 * Calculate capital call amount for an investor based on commitment
 */
export function calculateCapitalCallAmount(
  commitmentAmount: number,
  percentageOfFund: number
): number {
  return commitmentAmount * percentageOfFund;
}

/**
 * Calculate ownership percentage
 */
export function calculateOwnershipPercentage(
  investorAmount: number,
  totalDealAmount: number
): number {
  if (totalDealAmount === 0) return 0;
  return investorAmount / totalDealAmount;
}

/**
 * Calculate cap rate
 */
export function calculateCapRate(noi: number, propertyValue: number): number {
  if (propertyValue === 0) return 0;
  return noi / propertyValue;
}

/**
 * Calculate cash-on-cash return
 */
export function calculateCashOnCash(
  annualCashFlow: number,
  totalCashInvested: number
): number {
  if (totalCashInvested === 0) return 0;
  return annualCashFlow / totalCashInvested;
}

// ============================================
// KPI Calculation Functions (Pure/Deterministic)
// Per CODE_GUIDELINES.md #3: No Date/random/UUID instantiation
// ============================================

/**
 * Calculate NOI margin (NOI as percentage of total revenue)
 */
export function calculateNoiMargin(noi: number, totalRevenue: number): number {
  if (totalRevenue === 0) return 0;
  return noi / totalRevenue;
}

/**
 * Calculate Debt Service Coverage Ratio
 */
export function calculateDscr(noi: number, annualDebtService: number): number {
  if (annualDebtService === 0) return 0;
  return noi / annualDebtService;
}

/**
 * Calculate occupancy rate
 */
export function calculateOccupancyRate(
  occupiedUnits: number,
  totalUnits: number
): number {
  if (totalUnits === 0) return 0;
  return occupiedUnits / totalUnits;
}

/**
 * Calculate economic occupancy rate
 */
export function calculateEconomicOccupancy(
  actualRent: number,
  potentialRent: number
): number {
  if (potentialRent === 0) return 0;
  return actualRent / potentialRent;
}

/**
 * Calculate period-over-period change percentage
 */
export function calculateChangePercent(
  currentValue: number,
  previousValue: number
): number {
  if (previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Calculate Loan-to-Value ratio
 */
export function calculateLtv(
  loanBalance: number,
  propertyValue: number
): number {
  if (propertyValue === 0) return 0;
  return loanBalance / propertyValue;
}

/**
 * Calculate operating expense ratio
 */
export function calculateOperatingExpenseRatio(
  operatingExpenses: number,
  totalRevenue: number
): number {
  if (totalRevenue === 0) return 0;
  return operatingExpenses / totalRevenue;
}

/**
 * Calculate equity multiple
 */
export function calculateEquityMultiple(
  totalDistributions: number,
  totalEquityInvested: number
): number {
  if (totalEquityInvested === 0) return 0;
  return totalDistributions / totalEquityInvested;
}

/**
 * Calculate revenue per unit
 */
export function calculateRevenuePerUnit(
  totalRevenue: number,
  unitCount: number
): number {
  if (unitCount === 0) return 0;
  return totalRevenue / unitCount;
}

/**
 * Calculate revenue per square foot
 */
export function calculateRevenuePerSqFt(
  totalRevenue: number,
  squareFootage: number
): number {
  if (squareFootage === 0) return 0;
  return totalRevenue / squareFootage;
}

