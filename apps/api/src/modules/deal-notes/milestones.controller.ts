/**
 * Milestones Controller (Request Handling Layer)
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { MilestonesService } from './milestones.service';
import { createDealMilestoneSchema, updateDealMilestoneSchema } from '@altsui/shared';
import { supabaseAdmin } from '../../common/database/supabase';

const milestonesService = new MilestonesService();

interface DealParams {
  dealId: string;
}

interface MilestoneParams extends DealParams {
  milestoneId: string;
}

async function getDealFundId(dealId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('deals')
    .select('fund_id')
    .eq('id', dealId)
    .single();
  return data?.fund_id ?? null;
}

export class MilestonesController {
  async list(
    request: FastifyRequest<{ Params: DealParams }>,
    reply: FastifyReply
  ): Promise<void> {
    const { dealId } = request.params;
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const result = await milestonesService.listMilestones(dealId);
    return reply.send({ success: true, data: result });
  }

  async create(
    request: FastifyRequest<{ Params: DealParams; Body: unknown }>,
    reply: FastifyReply
  ): Promise<void> {
    const { dealId } = request.params;
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    if (user.role !== 'manager') {
      return reply.status(403).send({ success: false, error: 'Only managers can create milestones' });
    }

    const parsed = createDealMilestoneSchema.safeParse({ ...request.body, dealId });
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Invalid input', details: parsed.error.issues });
    }

    const fundId = await getDealFundId(dealId);
    if (!fundId) {
      return reply.status(404).send({ success: false, error: 'Deal not found' });
    }

    const milestone = await milestonesService.createMilestone({
      dealId: parsed.data.dealId,
      fundId,
      title: parsed.data.title,
      description: parsed.data.description,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      status: parsed.data.status,
      category: parsed.data.category,
      sortOrder: parsed.data.sortOrder,
      createdBy: user.id,
    });

    return reply.status(201).send({ success: true, data: milestone });
  }

  async update(
    request: FastifyRequest<{ Params: MilestoneParams; Body: unknown }>,
    reply: FastifyReply
  ): Promise<void> {
    const { milestoneId } = request.params;
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    if (user.role !== 'manager') {
      return reply.status(403).send({ success: false, error: 'Only managers can update milestones' });
    }

    const parsed = updateDealMilestoneSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Invalid input', details: parsed.error.issues });
    }

    const existingMilestone = await milestonesService.getMilestoneById(milestoneId);
    if (!existingMilestone) {
      return reply.status(404).send({ success: false, error: 'Milestone not found' });
    }

    const updatedMilestone = await milestonesService.updateMilestone(milestoneId, parsed.data);
    return reply.send({ success: true, data: updatedMilestone });
  }

  async delete(
    request: FastifyRequest<{ Params: MilestoneParams }>,
    reply: FastifyReply
  ): Promise<void> {
    const { milestoneId } = request.params;
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    if (user.role !== 'manager') {
      return reply.status(403).send({ success: false, error: 'Only managers can delete milestones' });
    }

    const existingMilestone = await milestonesService.getMilestoneById(milestoneId);
    if (!existingMilestone) {
      return reply.status(404).send({ success: false, error: 'Milestone not found' });
    }

    await milestonesService.deleteMilestone(milestoneId);
    return reply.status(204).send();
  }
}

