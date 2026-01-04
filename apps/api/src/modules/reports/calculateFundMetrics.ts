import type { FundMetrics, DealDbRow, InvestorDbRow } from './reports.types';

/**
 * Pure function to calculate fund-level metrics from raw data
 * No side effects, no DB access - just computation
 */
export function calculateFundMetrics(
  deals: DealDbRow[],
  investors: InvestorDbRow[]
): FundMetrics {
  const aum = sumDealCurrentValues(deals);
  const nav = aum; // Simplified: NAV = AUM (real world would subtract liabilities)

  const totalCommitments = sumInvestorCommitments(investors);
  const capitalDeployed = sumInvestorDeployed(investors);
  const uncommittedCapital = Math.max(0, totalCommitments - capitalDeployed);

  const dealCount = deals.length;
  const investorCount = investors.length;
  const activeInvestorCount = investors.filter((inv) => inv.status === 'active').length;

  return {
    aum,
    nav,
    totalCommitments,
    capitalDeployed,
    uncommittedCapital,
    dealCount,
    investorCount,
    activeInvestorCount,
  };
}

function sumDealCurrentValues(deals: DealDbRow[]): number {
  return deals.reduce((sum, deal) => {
    return sum + (parseFloat(deal.current_value ?? '0') || 0);
  }, 0);
}

function sumInvestorCommitments(investors: InvestorDbRow[]): number {
  return investors.reduce((sum, inv) => {
    return sum + (parseFloat(inv.commitment_amount ?? '0') || 0);
  }, 0);
}

function sumInvestorDeployed(investors: InvestorDbRow[]): number {
  return investors.reduce((sum, inv) => {
    return sum + (parseFloat(inv.total_invested ?? '0') || 0);
  }, 0);
}

