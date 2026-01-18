import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { fundEmailService } from './fund-email.service';
import { updateEmailCustomizationSchema } from './funds.schema';

export class FundEmailController {
  /**
   * Get email customization settings
   */
  async getEmailCustomization(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const userId = request.user?.id;

    if (!fundId || !userId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const settings = await fundEmailService.getEmailCustomization(fundId, userId);

      return reply.send({
        success: true,
        data: settings,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get email customization';
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Update email customization settings
   */
  async updateEmailCustomization(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const userId = request.user?.id;

    if (!fundId || !userId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const input = updateEmailCustomizationSchema.parse(request.body);
      const settings = await fundEmailService.updateEmailCustomization(fundId, userId, input);

      return reply.send({
        success: true,
        data: settings,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          error: 'Invalid input: ' + error.message,
        });
      }
      const message = error instanceof Error ? error.message : 'Failed to update email customization';
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  }
}

export const fundEmailController = new FundEmailController();
