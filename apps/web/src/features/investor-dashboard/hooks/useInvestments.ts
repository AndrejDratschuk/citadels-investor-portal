import { useQuery } from '@tanstack/react-query';
import { investorsApi } from '@/lib/api/investors';

export function useInvestments() {
  return useQuery({
    queryKey: ['investor', 'investments'],
    queryFn: investorsApi.getMyInvestments,
  });
}


