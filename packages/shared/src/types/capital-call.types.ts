import { CapitalCallStatus, CapitalCallItemStatus } from '../constants/status';

export interface CapitalCallItem {
  id: string;
  capitalCallId: string;
  investorId: string;
  amountDue: number;
  amountReceived: number;
  status: CapitalCallItemStatus;
  wireReceivedAt: string | null;
  reminderCount: number;
  lastReminderAt: string | null;
  createdAt: string;
}

export interface CapitalCall {
  id: string;
  fundId: string;
  dealId: string;
  totalAmount: number;
  percentageOfFund: number;
  deadline: string;
  status: CapitalCallStatus;
  sentAt: string | null;
  createdAt: string;
  items?: CapitalCallItem[];
}

