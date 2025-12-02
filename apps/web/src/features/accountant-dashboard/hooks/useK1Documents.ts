import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { K1Record } from '../components';

// Mock data - will be replaced with API call
const getMockK1Records = (_year: number): K1Record[] => [
  {
    id: '1',
    investorId: 'inv-1',
    investorName: 'John Smith',
    entityType: 'individual',
    taxIdType: 'ssn',
    totalInvested: 250000,
    ownershipPercentage: 3.65,
    k1Status: 'sent',
    generatedAt: '2024-02-15T10:30:00Z',
    sentAt: '2024-02-16T14:00:00Z',
  },
  {
    id: '2',
    investorId: 'inv-2',
    investorName: 'Sarah Johnson',
    entityType: 'trust',
    taxIdType: 'ein',
    totalInvested: 500000,
    ownershipPercentage: 7.30,
    k1Status: 'generated',
    generatedAt: '2024-02-15T10:30:00Z',
  },
  {
    id: '3',
    investorId: 'inv-3',
    investorName: 'Acme Holdings LLC',
    entityType: 'llc',
    taxIdType: 'ein',
    totalInvested: 1000000,
    ownershipPercentage: 14.60,
    k1Status: 'pending',
  },
  {
    id: '4',
    investorId: 'inv-4',
    investorName: 'Michael Chen',
    entityType: 'individual',
    taxIdType: 'ssn',
    totalInvested: 150000,
    ownershipPercentage: 2.19,
    k1Status: 'sent',
    generatedAt: '2024-02-15T10:30:00Z',
    sentAt: '2024-02-16T14:00:00Z',
  },
  {
    id: '5',
    investorId: 'inv-5',
    investorName: 'Williams Family Trust',
    entityType: 'trust',
    taxIdType: 'ein',
    totalInvested: 750000,
    ownershipPercentage: 10.95,
    k1Status: 'pending',
  },
  {
    id: '6',
    investorId: 'inv-6',
    investorName: 'Tech Ventures Corp',
    entityType: 'corporation',
    taxIdType: 'ein',
    totalInvested: 2000000,
    ownershipPercentage: 29.20,
    k1Status: 'generated',
    generatedAt: '2024-02-15T10:30:00Z',
  },
  {
    id: '7',
    investorId: 'inv-7',
    investorName: 'Robert & Maria Garcia',
    entityType: 'joint',
    taxIdType: 'ssn',
    totalInvested: 300000,
    ownershipPercentage: 4.38,
    k1Status: 'pending',
  },
  {
    id: '8',
    investorId: 'inv-8',
    investorName: 'Davis Capital Partners',
    entityType: 'llc',
    taxIdType: 'ein',
    totalInvested: 850000,
    ownershipPercentage: 12.41,
    k1Status: 'sent',
    generatedAt: '2024-02-14T09:00:00Z',
    sentAt: '2024-02-15T11:00:00Z',
  },
];

async function fetchK1Documents(year: number): Promise<K1Record[]> {
  // TODO: Replace with actual API call
  // const response = await apiClient.get(`/reports/k1?year=${year}`);
  // return response.data;
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return getMockK1Records(year);
}

async function generateK1s(ids: string[]): Promise<void> {
  // TODO: Replace with actual API call
  // await apiClient.post('/reports/k1/generate', { ids });
  
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Generated K-1s for:', ids);
}

async function sendK1s(ids: string[]): Promise<void> {
  // TODO: Replace with actual API call
  // await apiClient.post('/reports/k1/send', { ids });
  
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Sent K-1s for:', ids);
}

export function useK1Documents(year: number) {
  return useQuery({
    queryKey: ['k1-documents', year],
    queryFn: () => fetchK1Documents(year),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGenerateK1s() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateK1s,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k1-documents'] });
      queryClient.invalidateQueries({ queryKey: ['tax-summary'] });
    },
  });
}

export function useSendK1s() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendK1s,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k1-documents'] });
      queryClient.invalidateQueries({ queryKey: ['tax-summary'] });
    },
  });
}




