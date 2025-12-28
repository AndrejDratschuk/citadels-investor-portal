import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi, CreateCommunicationInput } from '@/lib/api/communications';
import { CommunicationType } from '@altsui/shared';

export function useCommunications(investorId: string, type?: CommunicationType) {
  return useQuery({
    queryKey: ['communications', investorId, type],
    queryFn: () => communicationsApi.getByInvestorId(investorId, type),
    enabled: !!investorId,
  });
}

export function useCreateCommunication(investorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommunicationInput) =>
      communicationsApi.create(investorId, input),
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


