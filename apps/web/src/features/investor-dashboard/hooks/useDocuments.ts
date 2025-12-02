import { useQuery } from '@tanstack/react-query';
import { investorsApi } from '@/lib/api/investors';

export function useDocuments() {
  return useQuery({
    queryKey: ['investor', 'documents'],
    queryFn: investorsApi.getMyDocuments,
  });
}


