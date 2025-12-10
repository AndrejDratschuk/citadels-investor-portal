import { useQuery } from '@tanstack/react-query';
import { fundsApi, Fund, FundBrandingPublic } from '@/lib/api/funds';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook to get the current fund for authenticated managers
 */
export function useFund() {
  const { user, isAuthenticated } = useAuthStore();
  const isManager = user?.role === 'manager';

  return useQuery<Fund>({
    queryKey: ['fund', 'current'],
    queryFn: () => fundsApi.getCurrent(),
    enabled: isAuthenticated && isManager,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
}

/**
 * Hook to get fund branding by ID (public - for forms)
 */
export function useFundBranding(fundId: string | undefined) {
  return useQuery<FundBrandingPublic>({
    queryKey: ['fund', 'branding', fundId],
    queryFn: () => fundsApi.getBranding(fundId!),
    enabled: !!fundId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}



