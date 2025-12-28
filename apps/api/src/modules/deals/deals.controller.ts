import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { dealsService, CreateDealInput } from './deals.service';

export class DealsController {
  /**
   * Get all deals for the fund
   */
  async getAll(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const deals = await dealsService.getAllByFundId(fundId);

      return reply.send({
        success: true,
        data: deals,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch deals',
      });
    }
  }

  /**
   * Get a single deal by ID
   */
  async getById(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const { id } = request.params as { id: string };

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const deal = await dealsService.getById(fundId, id);

      if (!deal) {
        return reply.status(404).send({
          success: false,
          error: 'Deal not found',
        });
      }

      return reply.send({
        success: true,
        data: deal,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch deal',
      });
    }
  }

  /**
   * Get investors for a specific deal
   */
  async getDealInvestors(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const { id } = request.params as { id: string };

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const investors = await dealsService.getDealInvestors(fundId, id);

      return reply.send({
        success: true,
        data: investors,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch deal investors',
      });
    }
  }

  /**
   * Create a new deal
   */
  async create(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    const input = request.body as CreateDealInput;

    if (!input.name) {
      return reply.status(400).send({
        success: false,
        error: 'Deal name is required',
      });
    }

    try {
      const deal = await dealsService.create(fundId, input);

      return reply.status(201).send({
        success: true,
        data: deal,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to create deal',
      });
    }
  }

  /**
   * Update a deal
   */
  async update(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const { id } = request.params as { id: string };

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    const input = request.body as Partial<CreateDealInput>;

    try {
      const deal = await dealsService.update(fundId, id, input);

      return reply.send({
        success: true,
        data: deal,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to update deal',
      });
    }
  }

  /**
   * Delete a deal
   */
  async delete(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const { id } = request.params as { id: string };

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      await dealsService.delete(fundId, id);

      return reply.send({
        success: true,
        data: { message: 'Deal deleted successfully' },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to delete deal',
      });
    }
  }

  /**
   * Upload deal image
   */
  async uploadImage(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const { id } = request.params as { id: string };

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
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid file type. Allowed: PNG, JPEG, WebP',
        });
      }

      // Validate file size (max 5MB for deal images)
      const maxSize = 5 * 1024 * 1024;
      const buffer = await data.toBuffer();
      if (buffer.length > maxSize) {
        return reply.status(400).send({
          success: false,
          error: 'File too large. Maximum size is 5MB',
        });
      }

      const imageUrl = await dealsService.uploadImage(
        fundId,
        id,
        buffer,
        data.filename,
        data.mimetype
      );

      return reply.send({
        success: true,
        data: { imageUrl },
      });
    } catch (error: any) {
      console.error('Deal image upload error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to upload deal image',
      });
    }
  }

  /**
   * Delete deal image
   */
  async deleteImage(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const { id } = request.params as { id: string };

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      await dealsService.deleteImage(fundId, id);

      return reply.send({
        success: true,
        data: { message: 'Deal image deleted successfully' },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to delete deal image',
      });
    }
  }
}

export const dealsController = new DealsController();







