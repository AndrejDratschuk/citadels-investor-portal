import { FastifyRequest, FastifyReply } from 'fastify';
import { CommunicationsService } from './communications.service';
import { CommunicationType } from '@flowveda/shared';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { supabaseAdmin } from '../../common/database/supabase';

const communicationsService = new CommunicationsService();

interface CreateCommunicationBody {
  type: CommunicationType;
  title: string;
  content?: string;
  occurredAt: string;
  // Phone call specific
  callDirection?: 'inbound' | 'outbound';
  callDurationMinutes?: number;
  // Email specific
  emailFrom?: string;
  emailTo?: string;
  // Meeting specific
  meetingAttendees?: string[];
  meetingDurationMinutes?: number;
}

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

  async create(request: AuthenticatedRequest, reply: FastifyReply) {
    const { investorId } = request.params as { investorId: string };
    const body = request.body as CreateCommunicationBody;

    if (!body.type || !body.title || !body.occurredAt) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: type, title, occurredAt',
      });
    }

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

    let communication;

    switch (body.type) {
      case 'phone_call':
        communication = await communicationsService.createPhoneCall(
          {
            investorId,
            title: body.title,
            content: body.content,
            occurredAt: body.occurredAt,
            callDirection: body.callDirection || 'outbound',
            callDurationMinutes: body.callDurationMinutes,
          },
          investor.fund_id,
          request.user.id
        );
        break;
      case 'email':
        communication = await communicationsService.createEmail(
          {
            investorId,
            title: body.title,
            content: body.content,
            occurredAt: body.occurredAt,
            emailFrom: body.emailFrom || '',
            emailTo: body.emailTo || '',
          },
          investor.fund_id,
          request.user.id
        );
        break;
      case 'meeting':
        communication = await communicationsService.createMeeting(
          {
            investorId,
            title: body.title,
            content: body.content,
            occurredAt: body.occurredAt,
            meetingAttendees: body.meetingAttendees,
            meetingDurationMinutes: body.meetingDurationMinutes,
          },
          investor.fund_id,
          request.user.id
        );
        break;
      default:
        return reply.status(400).send({
          success: false,
          error: 'Invalid communication type',
        });
    }

    return reply.status(201).send({
      success: true,
      data: communication,
      message: 'Communication logged successfully',
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


