/**
 * Milestones Service (Business Logic Layer)
 */

import { MilestonesRepository } from './milestones.repository';
import type { DealMilestone, MilestoneStatus, MilestoneCategory } from '@altsui/shared';

const milestonesRepository = new MilestonesRepository();

export class MilestonesService {
  async listMilestones(dealId: string): Promise<{ milestones: DealMilestone[]; total: number }> {
    const milestones = await milestonesRepository.listByDealId(dealId);
    return {
      milestones,
      total: milestones.length,
    };
  }

  async getMilestoneById(milestoneId: string): Promise<DealMilestone | null> {
    return milestonesRepository.getById(milestoneId);
  }

  async createMilestone(input: {
    dealId: string;
    fundId: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    status?: MilestoneStatus;
    category?: MilestoneCategory;
    sortOrder?: number;
    createdBy: string;
  }): Promise<DealMilestone> {
    return milestonesRepository.create(input);
  }

  async updateMilestone(
    milestoneId: string,
    input: {
      title?: string;
      description?: string | null;
      startDate?: string;
      endDate?: string | null;
      status?: MilestoneStatus;
      category?: MilestoneCategory;
      actualCompletionDate?: string | null;
      sortOrder?: number;
    }
  ): Promise<DealMilestone> {
    return milestonesRepository.update(milestoneId, input);
  }

  async deleteMilestone(milestoneId: string): Promise<void> {
    return milestonesRepository.delete(milestoneId);
  }
}

