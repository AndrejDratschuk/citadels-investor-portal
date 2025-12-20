import { useQuery } from '@tanstack/react-query';

export interface TaxSummary {
  totalInvestors: number;
  totalK1sGenerated: number;
  totalK1sPending: number;
  totalK1sSent: number;
  totalInvested: number;
  taxYear: number;
}

// Mock data - will be replaced with API call
const getMockTaxSummary = (year: number): TaxSummary => ({
  totalInvestors: 47,
  totalK1sGenerated: 32,
  totalK1sPending: 15,
  totalK1sSent: 28,
  totalInvested: 68500000,
  taxYear: year,
});

async function fetchTaxSummary(year: number): Promise<TaxSummary> {
  // TODO: Replace with actual API call
  // const response = await apiClient.get(`/reports/k1/summary?year=${year}`);
  // return response.data;
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return getMockTaxSummary(year);
}

export function useTaxSummary(year: number) {
  return useQuery({
    queryKey: ['tax-summary', year],
    queryFn: () => fetchTaxSummary(year),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}






















