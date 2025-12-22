import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investorsApi, InvestorProfile, UpdateInvestorInput } from '@/lib/api/investors';

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

export function useUpdateInvestor(investorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: UpdateInvestorInput) => investorsApi.update(investorId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor', investorId] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
    },
  });
}

export function useDeleteInvestor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (investorId: string) => investorsApi.delete(investorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
    },
  });
}














