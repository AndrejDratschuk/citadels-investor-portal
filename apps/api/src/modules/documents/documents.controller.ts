import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { documentsService, CreateDocumentInput, DocumentFilters, DocumentCategory, DocumentDepartment, DocumentStatus, ValidationStatus } from './documents.service';
import { emailService } from '../email/email.service';
import { onboardingService } from '../onboarding/onboarding.service';

export class DocumentsController {
  /**
   * Get all documents for the fund with advanced filters
   */
  async getAll(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    const { type, category, department, status, dealId, investorId, tag } = request.query as {
      type?: string;
      category?: DocumentCategory;
      department?: DocumentDepartment;
      status?: DocumentStatus;
      dealId?: string;
      investorId?: string;
      tag?: string;
    };

    const filters: DocumentFilters = {
      type,
      category,
      department,
      status,
      dealId,
      investorId,
      tag,
    };

    try {
      const documents = await documentsService.getAllByFundId(fundId, filters);

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

  /**
   * Get validation documents for fund manager review
   */
  async getValidationDocuments(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    const { status } = request.query as { status?: ValidationStatus };

    try {
      const documents = await documentsService.getValidationDocuments(fundId, status);

      return reply.send({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch validation documents',
      });
    }
  }

  /**
   * Approve a validation document
   */
  async approveDocument(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const userId = request.user?.id;
    const { id } = request.params as { id: string };

    if (!fundId || !userId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    const { triggerDocusign } = request.body as { triggerDocusign?: boolean };
    const now = new Date();

    try {
      const document = await documentsService.approveDocument(fundId, id, userId, now);

      // Send approval email to investor using service methods (no direct DB access)
      let emailSent = false;
      if (document.investorId) {
        // Get email context from services (proper architecture - no direct DB access in controller)
        const [investor, fund] = await Promise.all([
          documentsService.getInvestorEmailContext(document.investorId),
          documentsService.getFundEmailContext(fundId),
        ]);

        if (investor?.email) {
          const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const result = await emailService.sendDocumentApproved(investor.email, {
            recipientName: `${investor.firstName || ''} ${investor.lastName || ''}`.trim() || 'Investor',
            fundName: fund?.name || 'Investment Fund',
            documentName: document.name,
            documentType: document.type,
            portalUrl: `${portalUrl}/investor/documents`,
          });
          emailSent = result.success;
        }
      }

      // TODO: If triggerDocusign is true, trigger DocuSign flow

      // Check if investor's onboarding is now complete
      let onboardingUpdated = false;
      if (document.investorId) {
        const statusResult = await onboardingService.checkAndUpdateStatus(document.investorId);
        onboardingUpdated = statusResult.updated;
      }

      return reply.send({
        success: true,
        data: document,
        emailSent,
        onboardingUpdated,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to approve document',
      });
    }
  }

  /**
   * Reject a validation document
   */
  async rejectDocument(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const userId = request.user?.id;
    const { id } = request.params as { id: string };

    if (!fundId || !userId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    const { reason } = request.body as { reason: string };

    if (!reason || reason.length < 10) {
      return reply.status(400).send({
        success: false,
        error: 'A detailed rejection reason is required (at least 10 characters)',
      });
    }

    const now = new Date();

    try {
      const document = await documentsService.rejectDocument(fundId, id, userId, reason, now);

      // Send rejection email to investor using service methods (no direct DB access)
      let emailSent = false;
      if (document.investorId) {
        // Get email context from services (proper architecture - no direct DB access in controller)
        const [investor, fund] = await Promise.all([
          documentsService.getInvestorEmailContext(document.investorId),
          documentsService.getFundEmailContext(fundId),
        ]);

        if (investor?.email) {
          const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const result = await emailService.sendDocumentRejection(investor.email, {
            recipientName: `${investor.firstName || ''} ${investor.lastName || ''}`.trim() || 'Investor',
            fundName: fund?.name || 'Investment Fund',
            documentName: document.name,
            documentType: document.type,
            rejectionReason: reason,
            portalUrl: `${portalUrl}/investor/documents`,
          });
          emailSent = result.success;
        }
      }

      return reply.send({
        success: true,
        data: document,
        emailSent,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to reject document',
      });
    }
  }

  /**
   * Get investor's own validation documents
   */
  async getMyValidationDocuments(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user?.id;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    try {
      // Get investor ID from user ID (using service method - no direct DB access)
      const investorId = await documentsService.getInvestorIdByUserId(userId);

      if (!investorId) {
        return reply.status(404).send({
          success: false,
          error: 'Investor not found',
        });
      }

      const documents = await documentsService.getMyValidationDocuments(investorId);

      return reply.send({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch validation documents',
      });
    }
  }
}

export const documentsController = new DocumentsController();





