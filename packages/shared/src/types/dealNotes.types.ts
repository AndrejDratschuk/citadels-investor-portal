// Deal Notes & Milestones Types

export type NoteVisibility = 'manager' | 'accountant' | 'attorney' | 'investor';

export type MilestoneStatus = 'planned' | 'in_progress' | 'completed' | 'delayed';

export type MilestoneCategory = 
  | 'acquisition' 
  | 'renovation' 
  | 'financing' 
  | 'operations' 
  | 'disposition' 
  | 'other';

export interface DealNote {
  id: string;
  dealId: string;
  fundId: string;
  content: string;
  visibility: NoteVisibility[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated from join
  createdByName?: string;
}

export interface DealMilestone {
  id: string;
  dealId: string;
  fundId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  status: MilestoneStatus;
  category: MilestoneCategory;
  actualCompletionDate: string | null;
  sortOrder: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealNoteInput {
  dealId: string;
  content: string;
  visibility: NoteVisibility[];
}

export interface UpdateDealNoteInput {
  content?: string;
  visibility?: NoteVisibility[];
}

export interface CreateDealMilestoneInput {
  dealId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status?: MilestoneStatus;
  category?: MilestoneCategory;
  sortOrder?: number;
}

export interface UpdateDealMilestoneInput {
  title?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string | null;
  status?: MilestoneStatus;
  category?: MilestoneCategory;
  actualCompletionDate?: string | null;
  sortOrder?: number;
}

export interface DealNotesListResponse {
  notes: DealNote[];
  total: number;
}

export interface DealMilestonesListResponse {
  milestones: DealMilestone[];
  total: number;
}

