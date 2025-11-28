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

