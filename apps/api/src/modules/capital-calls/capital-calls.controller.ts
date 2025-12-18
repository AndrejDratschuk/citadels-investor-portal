import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { capitalCallsService, CreateCapitalCallInput } from './capital-calls.service';
import { supabaseAdmin } from '../../common/database/supabase';

class CapitalCallsController {
  /**
   * Get all capital calls for the manager's fund
   */
  async getAll(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    // Get the manager's fund
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    try {
      const capitalCalls = await capitalCallsService.getAllByFundId(manager.fund_id);
      return reply.send({ success: true, data: capitalCalls });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  }

  /**
   * Get a single capital call by ID
   */
  async getById(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };

    // Get the manager's fund
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    try {
      const capitalCall = await capitalCallsService.getById(id, manager.fund_id);
      return reply.send({ success: true, data: capitalCall });
    } catch (error: any) {
      return reply.status(404).send({ success: false, error: error.message });
    }
  }

  /**
   * Create a new capital call
   */
  async create(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const input = request.body as CreateCapitalCallInput;

    // Validate input
    if (!input.dealId || !input.totalAmount || !input.deadline) {
      return reply.status(400).send({ 
        success: false, 
        error: 'Missing required fields: dealId, totalAmount, deadline' 
      });
    }

    // Get the manager's fund
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    try {
      const capitalCall = await capitalCallsService.create(
        manager.fund_id, 
        input, 
        request.user.id
      );
      return reply.status(201).send({ success: true, data: capitalCall });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  }
}

export const capitalCallsController = new CapitalCallsController();

