import { FastifyRequest, FastifyReply } from 'fastify';
import { CommunicationsService } from './communications.service';
import { createPhoneCallSchema, CommunicationType } from '@flowveda/shared';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { supabaseAdmin } from '../../common/database/supabase';

const communicationsService = new CommunicationsService();

export class CommunicationsController {
  async getByInvestorId(request: FastifyRequest, reply: FastifyReply) {
    const { investorId } = request.params as { investorId: string };
    const { type } = request.query as { type?: CommunicationType };

    const communications = await communicationsService.getByInvestorId(
      investorId,
      type
    );

    return reply.send({
      success: true,
      data: communications,
    });
  }

  async createPhoneCall(request: AuthenticatedRequest, reply: FastifyReply) {
    const { investorId } = request.params as { investorId: string };
    const body = createPhoneCallSchema.parse({
      ...request.body,
      investorId,
    });

    // Get the investor to find fund_id
    const { data: investor, error: investorError } = await supabaseAdmin
      .from('investors')
      .select('fund_id')
      .eq('id', investorId)
      .single();

    if (investorError || !investor) {
      return reply.status(404).send({
        success: false,
        error: 'Investor not found',
      });
    }

    const communication = await communicationsService.createPhoneCall(
      body,
      investor.fund_id,
      request.user.id
    );

    return reply.status(201).send({
      success: true,
      data: communication,
      message: 'Phone call logged successfully',
    });
  }

  async delete(request: AuthenticatedRequest, reply: FastifyReply) {
    const { communicationId } = request.params as { communicationId: string };

    await communicationsService.delete(communicationId);

    return reply.send({
      success: true,
      message: 'Communication deleted successfully',
    });
  }
}

