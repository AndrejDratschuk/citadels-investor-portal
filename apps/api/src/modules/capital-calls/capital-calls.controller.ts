import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { capitalCallsService, CreateCapitalCallInput } from './capital-calls.service';
import { capitalCallEmailTriggers } from './capitalCallEmailTriggers';
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
    } catch (error: unknown) {
      const err = error as Error;
      return reply.status(500).send({ success: false, error: err.message });
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
    } catch (error: unknown) {
      const err = error as Error;
      return reply.status(404).send({ success: false, error: err.message });
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
    } catch (error: unknown) {
      const err = error as Error;
      return reply.status(500).send({ success: false, error: err.message });
    }
  }

  /**
   * Get capital call items for a specific capital call
   */
  async getItems(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };

    // Get the manager's fund to verify access
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    try {
      // Verify capital call belongs to this fund
      const capitalCall = await capitalCallsService.getById(id, manager.fund_id);
      if (!capitalCall) {
        return reply.status(404).send({ success: false, error: 'Capital call not found' });
      }

      const items = await capitalCallsService.getItemsByCapitalCallId(id);
      return reply.send({ success: true, data: items });
    } catch (error: unknown) {
      const err = error as Error;
      return reply.status(500).send({ success: false, error: err.message });
    }
  }

  /**
   * Confirm wire received for a capital call item
   */
  async confirmWire(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id, itemId } = request.params as { id: string; itemId: string };
    const { amountReceived } = request.body as { amountReceived: number };

    if (!amountReceived || amountReceived <= 0) {
      return reply.status(400).send({
        success: false,
        error: 'Amount received is required and must be greater than 0',
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

    const now = new Date();

    try {
      // Verify capital call belongs to this fund
      const capitalCall = await capitalCallsService.getById(id, manager.fund_id);
      if (!capitalCall) {
        return reply.status(404).send({ success: false, error: 'Capital call not found' });
      }

      // Confirm the wire
      const item = await capitalCallsService.confirmWireReceived(itemId, amountReceived, now);

      // Get fund context for email
      const fund = await capitalCallsService.getFundContext(manager.fund_id);
      const callNumber = await capitalCallsService.getCallNumber(id, manager.fund_id);

      // Send confirmation email via orchestration layer
      let emailSent = false;
      if (fund && item.investor.email) {
        const result = await capitalCallEmailTriggers.onWireConfirmed(
          { id: item.id, amountDue: item.amountDue, capitalCallId: item.capitalCallId },
          item.investor,
          fund,
          amountReceived,
          callNumber,
          now
        );
        emailSent = result.success;
      }

      return reply.send({
        success: true,
        data: item,
        emailSent,
      });
    } catch (error: unknown) {
      const err = error as Error;
      return reply.status(500).send({ success: false, error: err.message });
    }
  }

  /**
   * Report wire issue for a capital call item
   */
  async reportWireIssue(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id, itemId } = request.params as { id: string; itemId: string };
    const { issueDescription, expectedAmount, receivedAmount } = request.body as {
      issueDescription: string;
      expectedAmount?: number;
      receivedAmount?: number;
    };

    if (!issueDescription || issueDescription.length < 10) {
      return reply.status(400).send({
        success: false,
        error: 'Issue description is required (at least 10 characters)',
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

    const now = new Date();

    try {
      // Verify capital call belongs to this fund
      const capitalCall = await capitalCallsService.getById(id, manager.fund_id);
      if (!capitalCall) {
        return reply.status(404).send({ success: false, error: 'Capital call not found' });
      }

      // Get the capital call item
      const item = await capitalCallsService.getItemForWireIssue(itemId);
      if (!item) {
        return reply.status(404).send({ success: false, error: 'Capital call item not found' });
      }

      // Get fund context for email
      const fund = await capitalCallsService.getFundContext(manager.fund_id);
      const callNumber = await capitalCallsService.getCallNumber(id, manager.fund_id);

      // Send wire issue email via orchestration layer
      let emailSent = false;
      if (fund && item.investor.email) {
        const result = await capitalCallEmailTriggers.onWireIssue(
          { id: item.id, amountDue: item.amountDue, capitalCallId: item.capitalCallId },
          item.investor,
          fund,
          issueDescription,
          callNumber,
          expectedAmount,
          receivedAmount,
          now
        );
        emailSent = result.success;
      }

      return reply.send({
        success: true,
        message: 'Wire issue notification sent',
        emailSent,
      });
    } catch (error: unknown) {
      const err = error as Error;
      return reply.status(500).send({ success: false, error: err.message });
    }
  }
}

export const capitalCallsController = new CapitalCallsController();

