import { useQuery } from '@tanstack/react-query';
import { investorsApi } from '@/lib/api/investors';

export function useCapitalCalls() {
  return useQuery({
    queryKey: ['investor', 'capitalCalls'],
    queryFn: investorsApi.getMyCapitalCalls,
  });
}


