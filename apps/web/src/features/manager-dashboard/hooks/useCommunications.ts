import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi } from '@/lib/api/communications';
import { CommunicationType, CreatePhoneCallInput } from '@flowveda/shared';

export function useCommunications(investorId: string, type?: CommunicationType) {
  return useQuery({
    queryKey: ['communications', investorId, type],
    queryFn: () => communicationsApi.getByInvestorId(investorId, type),
    enabled: !!investorId,
  });
}

export function useCreatePhoneCall(investorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreatePhoneCallInput, 'investorId'>) =>
      communicationsApi.createPhoneCall(investorId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', investorId] });
    },
  });
}

export function useDeleteCommunication(investorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (communicationId: string) =>
      communicationsApi.delete(communicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', investorId] });
    },
  });
}

