import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investorsApi, UpdateProfileInput } from '@/lib/api/investors';

export function useInvestorProfile() {
  return useQuery({
    queryKey: ['investor', 'profile'],
    queryFn: investorsApi.getMe,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => investorsApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor', 'profile'] });
    },
  });
}

export function useInvestorStats() {
  return useQuery({
    queryKey: ['investor', 'stats'],
    queryFn: investorsApi.getMyStats,
  });
}


