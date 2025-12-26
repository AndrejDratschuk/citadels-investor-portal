import { FastifyInstance } from 'fastify';
import { AccountCreationController } from './account-creation.controller';
import { AccountCreationService } from './account-creation.service';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { emailService } from '../email/email.service';

// Create email service adapter using professional templates
const emailServiceAdapter = {
  async sendVerificationCode(email: string, code: string): Promise<void> {
    await emailService.sendVerificationCode(email, {
      recipientName: 'Investor',
      verificationCode: code,
      expiresInMinutes: 10,
    });
  },

  async sendAccountCreationInvite(
    email: string,
    firstName: string,
    fundName: string,
    createAccountUrl: string
  ): Promise<void> {
    await emailService.sendAccountInvite(email, {
      recipientName: firstName,
      fundName: fundName,
      accountCreationUrl: createAccountUrl,
    });
  },

  async sendAccountCreatedConfirmation(
    email: string,
    firstName: string,
    portalUrl: string
  ): Promise<void> {
    await emailService.sendAccountCreated(email, {
      recipientName: firstName,
      fundName: 'Investment Fund', // Will be fetched from context in production
      portalUrl: portalUrl,
      onboardingUrl: `${portalUrl}/onboarding`,
    });
  },
};

// Create service and controller instances
const service = new AccountCreationService(emailServiceAdapter);
const controller = new AccountCreationController(service);

export async function accountCreationRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Public routes (no auth required - for account creation flow)
   */

  // GET /account-creation/verify-token/:token
  // Verify a token and return pre-filled data
  fastify.get<{ Params: { token: string } }>('/verify-token/:token', async (request, reply) => {
    return controller.verifyToken(request, reply);
  });

  // POST /account-creation/send-code
  // Send a verification code to the user's email
  fastify.post('/send-code', async (request, reply) => {
    return controller.sendCode(request, reply);
  });

  // POST /account-creation/create
  // Create a new investor account
  fastify.post('/create', async (request, reply) => {
    return controller.createAccount(request, reply);
  });

  /**
   * Protected routes (fund manager only)
   */

  // POST /account-creation/send-invite
  // Send an account creation invite to a KYC applicant
  fastify.post('/send-invite', { preHandler: authenticate }, async (request: AuthenticatedRequest, reply) => {
    // Check role
    if (request.user?.role !== 'manager') {
      return reply.status(403).send({ error: 'Only fund managers can send account invites' });
    }
    return controller.sendInvite(request, reply);
  });
}
