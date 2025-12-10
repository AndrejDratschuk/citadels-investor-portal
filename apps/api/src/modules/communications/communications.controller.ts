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
  /**
   * Get all communications for the fund (manager view)
   */
  async getAll(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    console.log('[getAll communications] User:', request.user?.email, 'Fund ID:', fundId);

    if (!fundId) {
      console.error('[getAll communications] No fund_id for user');
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized - no fund associated with user',
      });
    }

    try {
      const communications = await communicationsService.getAllByFundId(fundId);
      console.log('[getAll communications] Returning', communications.length, 'communications');

      return reply.send({
        success: true,
        data: communications,
      });
    } catch (error: any) {
      console.error('[getAll communications] Error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch communications',
      });
    }
  }

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

    console.log('[create communication] Creating for investor_id:', investorId);
    console.log('[create communication] Body:', JSON.stringify(body));

    if (!body.type || !body.title || !body.occurredAt) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: type, title, occurredAt',
      });
    }

    // Get the investor to find fund_id
    const { data: investor, error: investorError } = await supabaseAdmin
      .from('investors')
      .select('fund_id, email')
      .eq('id', investorId)
      .single();

    console.log('[create communication] Found investor:', investor?.email || 'NOT FOUND', 'fund_id:', investor?.fund_id || 'NONE');

    if (investorError || !investor) {
      console.error('[create communication] Investor not found:', investorError);
      return reply.status(404).send({
        success: false,
        error: 'Investor not found',
      });
    }

    console.log('[create communication] Storing with fund_id:', investor.fund_id);

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


