import { FastifyRequest, FastifyReply } from 'fastify';
import { AccountCreationService } from './account-creation.service';
import {
  verifyTokenInputSchema,
  sendVerificationCodeInputSchema,
  createAccountInputSchema,
  sendAccountInviteInputSchema,
} from '@flowveda/shared';
import { ZodError } from 'zod';

/**
 * Account Creation Controller - Orchestrator pattern
 * Handles HTTP, validation, error catching, dependency injection
 */
export class AccountCreationController {
  constructor(private service: AccountCreationService) {}

  /**
   * GET /account-creation/verify-token/:token
   * Verify a token and return pre-filled data
   */
  async verifyToken(request: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply): Promise<void> {
    const now = new Date();

    try {
      const { token } = verifyTokenInputSchema.parse({ token: request.params.token });
      const result = await this.service.verifyToken(token, now);
      return reply.send({ data: result });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /account-creation/send-code
   * Send a verification code to the user's email
   */
  async sendCode(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const now = new Date();

    try {
      const { token } = sendVerificationCodeInputSchema.parse(request.body);
      const result = await this.service.sendVerificationCode(token, now);
      return reply.send({ data: result });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /account-creation/create
   * Create a new investor account
   */
  async createAccount(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const now = new Date();

    try {
      const input = createAccountInputSchema.parse(request.body);
      const result = await this.service.createAccount(input, now);
      return reply.status(201).send({ data: result });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /account-creation/send-invite
   * Send an account creation invite (fund manager only)
   */
  async sendInvite(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const now = new Date();

    try {
      const { kycApplicationId, fundId } = sendAccountInviteInputSchema.parse(request.body);
      const result = await this.service.sendAccountInvite(kycApplicationId, fundId, now);
      return reply.send({ data: result });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * Error handler
   */
  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('Invalid token') || error.message.includes('expired')) {
        return reply.status(401).send({ error: error.message });
      }

      if (error.message.includes('not found')) {
        return reply.status(404).send({ error: error.message });
      }

      if (error.message.includes('already been used')) {
        return reply.status(409).send({ error: error.message });
      }

      console.error('Account creation error:', error);
      return reply.status(500).send({ error: error.message });
    }

    console.error('Unknown error:', error);
    return reply.status(500).send({ error: 'An unexpected error occurred' });
  }
}
