import { useQuery } from '@tanstack/react-query';

export interface DocumentStats {
  totalDocuments: number;
  pendingSignatures: number;
  signedDocuments: number;
  declinedDocuments: number;
  viewedDocuments: number;
  notSentDocuments: number;
}

// Mock data - will be replaced with API call
const getMockDocumentStats = (): DocumentStats => ({
  totalDocuments: 156,
  pendingSignatures: 23,
  signedDocuments: 118,
  declinedDocuments: 5,
  viewedDocuments: 8,
  notSentDocuments: 10,
});

async function fetchDocumentStats(): Promise<DocumentStats> {
  // TODO: Replace with actual API call
  // const response = await apiClient.get('/documents/stats');
  // return response.data;
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return getMockDocumentStats();
}

export function useDocumentStats() {
  return useQuery({
    queryKey: ['document-stats'],
    queryFn: fetchDocumentStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}






























