/**
 * Mock data for communications
 * TODO: Replace with real API data when available
 */

export interface MockDeal {
  id: string;
  name: string;
}

export interface MockInvestor {
  id: string;
  name: string;
  email: string;
}

export const mockDeals: MockDeal[] = [
  { id: '1', name: 'Downtown Office Tower' },
  { id: '2', name: 'Eastside Industrial Park' },
  { id: '3', name: 'Riverside Apartments' },
  { id: '4', name: 'Tech Campus Development' },
];

export const mockInvestors: MockInvestor[] = [
  { id: '1', name: 'John Smith', email: 'john.smith@email.com' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@email.com' },
  { id: '3', name: 'Michael Chen', email: 'michael.chen@email.com' },
  { id: '4', name: 'Emily Davis', email: 'emily.davis@email.com' },
  { id: '5', name: 'Robert Wilson', email: 'robert.wilson@email.com' },
];
