import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { fundsService, FundBranding } from './funds.service';

export class FundsController {
  /**
   * Get current fund (for authenticated manager)
   */
  async getCurrent(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const fund = await fundsService.getById(fundId);

      if (!fund) {
        return reply.status(404).send({
          success: false,
          error: 'Fund not found',
        });
      }

      return reply.send({
        success: true,
        data: fund,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get fund',
      });
    }
  }

  /**
   * Get fund branding (public - for forms)
   * Used by KYC and onboarding forms to display fund logo
   */
  async getBranding(request: FastifyRequest, reply: FastifyReply) {
    const { fundId } = request.params as { fundId: string };

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'Fund ID is required',
      });
    }

    try {
      const branding = await fundsService.getBranding(fundId);

      if (!branding) {
        return reply.status(404).send({
          success: false,
          error: 'Fund not found',
        });
      }

      return reply.send({
        success: true,
        data: branding,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get fund branding',
      });
    }
  }

  /**
   * Update fund branding (colors)
   */
  async updateBranding(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    const { primaryColor, secondaryColor } = request.body as FundBranding;

    try {
      const fund = await fundsService.updateBranding(fundId, {
        primaryColor,
        secondaryColor,
      });

      return reply.send({
        success: true,
        data: fund,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to update branding',
      });
    }
  }

  /**
   * Upload fund logo
   */
  async uploadLogo(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      // Get the file from multipart
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'No file uploaded',
        });
      }

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid file type. Allowed: PNG, JPEG, WebP, SVG',
        });
      }

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024;
      const buffer = await data.toBuffer();
      if (buffer.length > maxSize) {
        return reply.status(400).send({
          success: false,
          error: 'File too large. Maximum size is 2MB',
        });
      }

      const logoUrl = await fundsService.uploadLogo(
        fundId,
        buffer,
        data.filename,
        data.mimetype
      );

      return reply.send({
        success: true,
        data: { logoUrl },
      });
    } catch (error: any) {
      console.error('Logo upload error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to upload logo',
      });
    }
  }

  /**
   * Delete fund logo
   */
  async deleteLogo(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      await fundsService.deleteLogo(fundId);

      return reply.send({
        success: true,
        data: { message: 'Logo deleted successfully' },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to delete logo',
      });
    }
  }
}

export const fundsController = new FundsController();

