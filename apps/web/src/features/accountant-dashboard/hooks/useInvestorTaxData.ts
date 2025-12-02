import { useQuery } from '@tanstack/react-query';
import { InvestorTaxRecord } from '../components';

// Mock data - will be replaced with API call
const mockInvestorTaxRecords: InvestorTaxRecord[] = [
  {
    id: 'inv-1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    entityType: 'individual',
    taxIdType: 'ssn',
    totalInvested: 250000,
    ownershipPercentage: 3.65,
    status: 'active',
    phone: '(555) 123-4567',
    address: '123 Main Street, Austin, TX 78701',
    dateJoined: '2023-03-15',
    lastK1Date: '2024-02-15',
  },
  {
    id: 'inv-2',
    name: 'Sarah Johnson Family Trust',
    email: 'sarah.johnson@email.com',
    entityType: 'trust',
    taxIdType: 'ein',
    totalInvested: 500000,
    ownershipPercentage: 7.30,
    status: 'active',
    phone: '(555) 234-5678',
    address: '456 Oak Avenue, Dallas, TX 75201',
    dateJoined: '2023-02-01',
    lastK1Date: '2024-02-15',
  },
  {
    id: 'inv-3',
    name: 'Acme Holdings LLC',
    email: 'investments@acmeholdings.com',
    entityType: 'llc',
    taxIdType: 'ein',
    totalInvested: 1000000,
    ownershipPercentage: 14.60,
    status: 'active',
    phone: '(555) 345-6789',
    address: '789 Corporate Blvd, Houston, TX 77001',
    dateJoined: '2023-01-15',
    lastK1Date: '2024-02-14',
  },
  {
    id: 'inv-4',
    name: 'Michael Chen',
    email: 'mchen@gmail.com',
    entityType: 'individual',
    taxIdType: 'ssn',
    totalInvested: 150000,
    ownershipPercentage: 2.19,
    status: 'active',
    phone: '(555) 456-7890',
    address: '321 Elm Street, San Antonio, TX 78201',
    dateJoined: '2023-06-20',
    lastK1Date: '2024-02-16',
  },
  {
    id: 'inv-5',
    name: 'Williams Family Trust',
    email: 'trust@williamsfamily.com',
    entityType: 'trust',
    taxIdType: 'ein',
    totalInvested: 750000,
    ownershipPercentage: 10.95,
    status: 'active',
    phone: '(555) 567-8901',
    address: '654 Pine Road, Fort Worth, TX 76101',
    dateJoined: '2023-04-10',
  },
  {
    id: 'inv-6',
    name: 'Tech Ventures Corp',
    email: 'invest@techventures.com',
    entityType: 'corporation',
    taxIdType: 'ein',
    totalInvested: 2000000,
    ownershipPercentage: 29.20,
    status: 'active',
    phone: '(555) 678-9012',
    address: '987 Innovation Way, Austin, TX 78702',
    dateJoined: '2022-11-01',
    lastK1Date: '2024-02-15',
  },
  {
    id: 'inv-7',
    name: 'Robert & Maria Garcia',
    email: 'garcia.family@email.com',
    entityType: 'joint',
    taxIdType: 'ssn',
    totalInvested: 300000,
    ownershipPercentage: 4.38,
    status: 'active',
    phone: '(555) 789-0123',
    address: '246 Cedar Lane, El Paso, TX 79901',
    dateJoined: '2023-05-15',
  },
  {
    id: 'inv-8',
    name: 'Davis Capital Partners',
    email: 'info@daviscapital.com',
    entityType: 'llc',
    taxIdType: 'ein',
    totalInvested: 850000,
    ownershipPercentage: 12.41,
    status: 'active',
    phone: '(555) 890-1234',
    address: '135 Finance District, Dallas, TX 75202',
    dateJoined: '2023-03-01',
    lastK1Date: '2024-02-14',
  },
  {
    id: 'inv-9',
    name: 'Jennifer Martinez',
    email: 'jmartinez@outlook.com',
    entityType: 'individual',
    taxIdType: 'ssn',
    totalInvested: 175000,
    ownershipPercentage: 2.55,
    status: 'inactive',
    phone: '(555) 901-2345',
    address: '864 Sunset Blvd, Plano, TX 75024',
    dateJoined: '2023-07-20',
  },
  {
    id: 'inv-10',
    name: 'Pacific Rim Investments Inc',
    email: 'invest@pacificrim.com',
    entityType: 'corporation',
    taxIdType: 'ein',
    totalInvested: 1500000,
    ownershipPercentage: 21.90,
    status: 'active',
    phone: '(555) 012-3456',
    address: '753 International Tower, Houston, TX 77002',
    dateJoined: '2022-12-15',
    lastK1Date: '2024-02-15',
  },
];

async function fetchInvestorTaxData(): Promise<InvestorTaxRecord[]> {
  // TODO: Replace with actual API call
  // const response = await apiClient.get('/accountant/investors');
  // return response.data;
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockInvestorTaxRecords;
}

export function useInvestorTaxData() {
  return useQuery({
    queryKey: ['investor-tax-data'],
    queryFn: fetchInvestorTaxData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useExportInvestorTaxCSV() {
  const exportToCSV = (records: InvestorTaxRecord[]) => {
    const headers = ['Name', 'Email', 'Entity Type', 'Tax ID Type', 'Total Invested', 'Ownership %', 'Status'];
    const rows = records.map((r) => [
      r.name,
      r.email,
      r.entityType,
      r.taxIdType.toUpperCase(),
      r.totalInvested.toString(),
      r.ownershipPercentage.toFixed(2) + '%',
      r.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `investor-tax-data-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return { exportToCSV };
}

