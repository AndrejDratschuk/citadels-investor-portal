import { DealStatus, PropertyType } from '../constants/status';
import { Address } from './fund.types';

export interface DealKPIs {
  noi?: number;
  capRate?: number;
  cashOnCash?: number;
  occupancyRate?: number;
  renovationBudget?: number;
  renovationSpent?: number;
}

export interface Deal {
  id: string;
  fundId: string;
  name: string;
  description: string | null;
  status: DealStatus;
  address: Address | null;
  propertyType: PropertyType | null;
  unitCount: number | null;
  squareFootage: number | null;
  acquisitionPrice: number | null;
  acquisitionDate: string | null;
  currentValue: number | null;
  totalInvestment: number | null;
  kpis: DealKPIs | null;
  createdAt: string;
  updatedAt: string;
}

