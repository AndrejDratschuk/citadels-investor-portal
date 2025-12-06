import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { emailService, SendEmailInput } from './email.service';

export class EmailController {
  /**
   * Send an email
   */
  async send(request: AuthenticatedRequest, reply: FastifyReply) {
    const { to, subject, body } = request.body as SendEmailInput;

    // Validate required fields
    if (!to || !subject || !body) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: to, subject, body',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid email address',
      });
    }

    try {
      const result = await emailService.sendEmail({ to, subject, body });

      if (!result.success) {
        return reply.status(500).send({
          success: false,
          error: result.error || 'Failed to send email',
        });
      }

      return reply.send({
        success: true,
        data: {
          messageId: result.messageId,
          message: 'Email sent successfully',
        },
      });
    } catch (error: any) {
      console.error('Email controller error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to send email',
      });
    }
  }
}

export const emailController = new EmailController();

