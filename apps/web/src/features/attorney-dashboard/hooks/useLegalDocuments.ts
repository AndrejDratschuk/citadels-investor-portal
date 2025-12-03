import { useQuery } from '@tanstack/react-query';
import { LegalDocument } from '../components';

// Mock data - will be replaced with API call
const mockDocuments: LegalDocument[] = [
  {
    id: '1',
    name: 'FlowVeda Growth Fund I - PPM',
    type: 'ppm',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    fileSize: '2.4 MB',
  },
  {
    id: '2',
    name: 'Subscription Agreement - John Smith',
    type: 'subscription',
    status: 'active',
    investorName: 'John Smith',
    createdAt: '2024-02-10T14:20:00Z',
    updatedAt: '2024-02-12T09:00:00Z',
    fileSize: '856 KB',
  },
  {
    id: '3',
    name: 'Subscription Agreement - Acme Holdings',
    type: 'subscription',
    status: 'active',
    investorName: 'Acme Holdings LLC',
    createdAt: '2024-02-08T11:00:00Z',
    updatedAt: '2024-02-10T16:30:00Z',
    fileSize: '912 KB',
  },
  {
    id: '4',
    name: 'Capital Call Notice #3',
    type: 'capital_call',
    status: 'active',
    dealName: 'Downtown Office Tower',
    createdAt: '2024-02-20T09:00:00Z',
    updatedAt: '2024-02-20T09:00:00Z',
    fileSize: '324 KB',
  },
  {
    id: '5',
    name: 'Q4 2023 Quarterly Report',
    type: 'report',
    status: 'active',
    createdAt: '2024-01-30T08:00:00Z',
    updatedAt: '2024-01-30T08:00:00Z',
    fileSize: '1.8 MB',
  },
  {
    id: '6',
    name: 'KYC Documents - Sarah Johnson',
    type: 'kyc',
    status: 'active',
    investorName: 'Sarah Johnson',
    createdAt: '2024-02-05T13:45:00Z',
    updatedAt: '2024-02-05T13:45:00Z',
    fileSize: '4.2 MB',
  },
  {
    id: '7',
    name: 'Subscription Agreement - Tech Ventures',
    type: 'subscription',
    status: 'draft',
    investorName: 'Tech Ventures Corp',
    createdAt: '2024-02-22T10:00:00Z',
    updatedAt: '2024-02-22T10:00:00Z',
    fileSize: '890 KB',
  },
  {
    id: '8',
    name: 'Operating Agreement Amendment',
    type: 'other',
    status: 'active',
    createdAt: '2024-01-20T15:00:00Z',
    updatedAt: '2024-01-25T11:30:00Z',
    fileSize: '456 KB',
  },
  {
    id: '9',
    name: 'K-1 Tax Document 2023 - Williams Trust',
    type: 'k1',
    status: 'active',
    investorName: 'Williams Family Trust',
    createdAt: '2024-02-15T09:00:00Z',
    updatedAt: '2024-02-15T09:00:00Z',
    fileSize: '128 KB',
  },
  {
    id: '10',
    name: 'Side Letter - Davis Capital',
    type: 'other',
    status: 'archived',
    investorName: 'Davis Capital Partners',
    createdAt: '2023-11-10T14:00:00Z',
    updatedAt: '2023-12-01T09:00:00Z',
    fileSize: '234 KB',
  },
];

async function fetchLegalDocuments(): Promise<LegalDocument[]> {
  // TODO: Replace with actual API call
  // const response = await apiClient.get('/documents');
  // return response.data;
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockDocuments;
}

export function useLegalDocuments() {
  return useQuery({
    queryKey: ['legal-documents'],
    queryFn: fetchLegalDocuments,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}





