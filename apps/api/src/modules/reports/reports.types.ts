// Re-export shared types for API responses
export type { FundMetrics, DealRollup, DealSummary } from '@altsui/shared';

/**
 * Raw deal data from database (internal use only)
 */
export interface DealDbRow {
  id: string;
  current_value: string | null;
  acquisition_price: string | null;
  unit_count: number | null;
  square_footage: number | null;
  status: string;
  name: string;
  property_type: string | null;
  kpis: DealKpis | null;
}

/**
 * KPIs stored in deal.kpis JSONB column (internal use only)
 */
export interface DealKpis {
  noi?: number;
  capRate?: number;
  cashOnCash?: number;
  occupancyRate?: number;
  renovationBudget?: number;
  renovationSpent?: number;
}

/**
 * Raw investor data from database (internal use only)
 */
export interface InvestorDbRow {
  id: string;
  commitment_amount: string | null;
  total_invested: string | null;
  status: string;
}
