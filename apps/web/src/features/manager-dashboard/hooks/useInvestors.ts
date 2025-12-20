import { useQuery } from '@tanstack/react-query';
import { investorsApi, InvestorProfile } from '@/lib/api/investors';

export function useInvestors() {
  return useQuery<InvestorProfile[], Error>({
    queryKey: ['investors'],
    queryFn: () => investorsApi.getAll(),
  });
}

export function useInvestor(investorId: string | undefined) {
  return useQuery<InvestorProfile, Error>({
    queryKey: ['investor', investorId],
    queryFn: () => investorsApi.getById(investorId!),
    enabled: !!investorId,
  });
}















