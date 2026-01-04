/**
 * Fund-level metrics for reports
 */
export interface FundMetrics {
  aum: number;
  nav: number;
  totalCommitments: number;
  capitalDeployed: number;
  uncommittedCapital: number;
  dealCount: number;
  investorCount: number;
  activeInvestorCount: number;
}

/**
 * Deal rollup - aggregated metrics across selected deals
 */
export interface DealRollup {
  dealCount: number;
  totalNoi: number;
  avgOccupancy: number;
  totalUnits: number;
  totalSqFt: number;
  totalAcquisitionCost: number;
  totalCurrentValue: number;
  weightedCapRate: number;
  totalAppreciation: number;
  appreciationPercent: number;
}

/**
 * Deal summary for selection UI
 */
export interface DealSummary {
  id: string;
  name: string;
  status: string;
  currentValue: number | null;
  acquisitionPrice: number | null;
  unitCount: number | null;
  propertyType: string | null;
}

