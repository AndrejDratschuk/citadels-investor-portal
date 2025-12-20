/**
 * Dashboard Metric Calculations
 * Pure functions - no side effects, no DB access
 * Time is passed in for determinism
 */

import type {
  FundKpis,
  DealRollups,
  TopDeal,
  InvestorStatusCounts,
  TopInvestor,
  PortfolioAllocation,
} from './dashboard.types.js';

// --- Fund KPIs ---

export function calculateCashOnHand(
  committed: number | null,
  deployed: number | null
): number | null {
  if (committed === null || deployed === null) return null;
  return committed - deployed;
}

export function calculateFundRoi(
  aum: number | null,
  deployed: number | null
): number | null {
  if (aum === null || deployed === null || deployed === 0) return null;
  return ((aum - deployed) / deployed) * 100;
}

export function buildFundKpis(raw: {
  totalAum: number | null;
  committedCapital: number | null;
  capitalCalled: number | null;
  capitalDeployed: number | null;
  debtOutstanding: number | null;
}): FundKpis {
  const cashOnHand = calculateCashOnHand(raw.committedCapital, raw.capitalDeployed);
  const fundRoiPercent = calculateFundRoi(raw.totalAum, raw.capitalDeployed);

  return {
    totalAum: raw.totalAum,
    committedCapital: raw.committedCapital,
    capitalCalled: raw.capitalCalled,
    capitalDeployed: raw.capitalDeployed,
    cashOnHand,
    debtOutstanding: raw.debtOutstanding,
    fundRoiPercent,
    irrPercent: null, // No cashflow data available
  };
}

// --- Deal Rollups ---

export function calculateCapitalReserves(
  committed: number | null,
  called: number | null
): number {
  if (committed === null || called === null) return 0;
  return Math.max(0, committed - called);
}

export function buildDealRollups(raw: {
  capitalInvested: number;
  capitalCollected: number;
  capitalOutstanding: number;
  committedCapital: number | null;
  capitalCalled: number | null;
}): DealRollups {
  return {
    capitalInvested: raw.capitalInvested,
    capitalCollected: raw.capitalCollected,
    capitalOutstanding: raw.capitalOutstanding,
    capitalReserves: calculateCapitalReserves(raw.committedCapital, raw.capitalCalled),
  };
}

// --- Top Deals ---

export function calculateDealRoi(
  currentValue: number | null,
  acquisitionPrice: number | null
): number | null {
  if (currentValue === null || acquisitionPrice === null || acquisitionPrice === 0) {
    return null;
  }
  return ((currentValue - acquisitionPrice) / acquisitionPrice) * 100;
}

export function calculateHoldPeriodDays(
  acquisitionDate: string | null,
  currentDate: Date
): number | null {
  if (!acquisitionDate) return null;
  const acqDate = new Date(acquisitionDate);
  const diffMs = currentDate.getTime() - acqDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function buildTopDeal(
  raw: {
    id: string;
    name: string;
    acquisitionPrice: number | null;
    currentValue: number | null;
    acquisitionDate: string | null;
  },
  currentDate: Date
): TopDeal {
  return {
    id: raw.id,
    name: raw.name,
    capitalInvested: raw.acquisitionPrice,
    currentValue: raw.currentValue,
    roiPercent: calculateDealRoi(raw.currentValue, raw.acquisitionPrice),
    acquisitionDate: raw.acquisitionDate,
    holdPeriodDays: calculateHoldPeriodDays(raw.acquisitionDate, currentDate),
  };
}

// --- Portfolio Allocation ---

export function buildPortfolioAllocation(deals: Array<{
  id: string;
  name: string;
  currentValue: number | null;
}>): PortfolioAllocation[] {
  return deals
    .filter((d) => d.currentValue !== null && d.currentValue > 0)
    .map((d) => ({
      dealId: d.id,
      dealName: d.name,
      value: d.currentValue!,
    }));
}

// --- Investor Status ---

export function buildInvestorStatusCounts(
  investors: Array<{ status: string }>
): InvestorStatusCounts {
  const counts: InvestorStatusCounts = {
    active: 0,
    onboarding: 0,
    prospect: 0,
    inactive: 0,
  };

  for (const inv of investors) {
    if (inv.status === 'active') counts.active++;
    else if (inv.status === 'onboarding') counts.onboarding++;
    else if (inv.status === 'prospect') counts.prospect++;
    else if (inv.status === 'inactive') counts.inactive++;
  }

  return counts;
}

// --- Top Investors ---

export function buildTopInvestor(raw: {
  id: string;
  firstName: string;
  lastName: string;
  commitmentAmount: number | null;
  totalCalled: number | null;
}): TopInvestor {
  return {
    id: raw.id,
    name: `${raw.firstName} ${raw.lastName}`.trim(),
    capitalCommitted: raw.commitmentAmount ?? 0,
    capitalCalled: raw.totalCalled ?? 0,
  };
}

