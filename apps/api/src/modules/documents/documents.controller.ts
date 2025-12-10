import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { documentsService, CreateDocumentInput } from './documents.service';

export class DocumentsController {
  /**
   * Get all documents for the fund
   */
  async getAll(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    const { type } = request.query as { type?: string };

    try {
      const documents = await documentsService.getAllByFundId(fundId, { type });

      return reply.send({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch documents',
      });
    }
  }

  /**
   * Get documents grouped by deal
   */
  async getByDeal(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const deals = await documentsService.getByDeal(fundId);

      return reply.send({
        success: true,
        data: deals,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch documents by deal',
      });
    }
  }

  /**
   * Get documents grouped by investor
   */
  async getByInvestor(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const investors = await documentsService.getByInvestor(fundId);

      return reply.send({
        success: true,
        data: investors,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch documents by investor',
      });
    }
  }

  /**
   * Get documents for a specific deal
   */
  async getDocumentsForDeal(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const { dealId } = request.params as { dealId: string };

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const documents = await documentsService.getDocumentsForDeal(fundId, dealId);

      return reply.send({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch documents for deal',
      });
    }
  }

  /**
   * Get documents for a specific investor
   */
  async getDocumentsForInvestor(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const { investorId } = request.params as { investorId: string };

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const documents = await documentsService.getDocumentsForInvestor(fundId, investorId);

      return reply.send({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch documents for investor',
      });
    }
  }

  /**
   * Create a new document
   */
  async create(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const userId = request.user?.id;

    if (!fundId || !userId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    const input = request.body as CreateDocumentInput;

    if (!input.name || !input.type) {
      return reply.status(400).send({
        success: false,
        error: 'Name and type are required',
      });
    }

    try {
      const document = await documentsService.create(fundId, userId, input);

      return reply.status(201).send({
        success: true,
        data: document,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to create document',
      });
    }
  }

  /**
   * Upload document file
   */
  async uploadFile(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'No file uploaded',
        });
      }

      const buffer = await data.toBuffer();
      const fileUrl = await documentsService.uploadFile(
        fundId,
        data.filename,
        buffer,
        data.mimetype
      );

      return reply.send({
        success: true,
        data: { fileUrl },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to upload file',
      });
    }
  }

  /**
   * Delete a document
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
      await documentsService.delete(fundId, id);

      return reply.send({
        success: true,
        data: { message: 'Document deleted successfully' },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to delete document',
      });
    }
  }
}

export const documentsController = new DocumentsController();



