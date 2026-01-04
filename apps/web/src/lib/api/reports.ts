import { api } from './client';
import type { FundMetrics, DealRollup, DealSummary } from '@altsui/shared';

// Re-export types for convenience
export type { FundMetrics, DealRollup, DealSummary };

export const reportsApi = {
  /**
   * Get fund-level metrics (AUM, NAV, commitments, etc.)
   */
  getFundMetrics: async (): Promise<FundMetrics> => {
    return api.get<FundMetrics>('/reports/fund');
  },

  /**
   * Get deal summaries for selection UI
   */
  getDealSummaries: async (): Promise<DealSummary[]> => {
    return api.get<DealSummary[]>('/reports/deals');
  },

  /**
   * Get aggregated deal rollups
   * @param dealIds - Optional array of deal IDs to include. If not provided, all deals are included.
   */
  getDealRollups: async (dealIds?: string[]): Promise<DealRollup> => {
    const query = dealIds && dealIds.length > 0 
      ? `?dealIds=${dealIds.join(',')}`
      : '';
    return api.get<DealRollup>(`/reports/deals/rollup${query}`);
  },
};
