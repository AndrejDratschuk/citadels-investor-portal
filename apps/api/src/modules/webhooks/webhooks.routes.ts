import { FastifyInstance } from 'fastify';
import { n8nService } from './n8n.service.js';

// Schemas for request validation
const onboardingSubmittedSchema = {
  body: {
    type: 'object',
    required: ['applicationId', 'investorName', 'investorEmail', 'entityType', 'commitmentAmount', 'fundId'],
    properties: {
      applicationId: { type: 'string' },
      investorName: { type: 'string' },
      investorEmail: { type: 'string' },
      entityType: { type: 'string' },
      commitmentAmount: { type: 'number' },
      submittedAt: { type: 'string' },
      fundId: { type: 'string' },
    },
  },
};

const investorApprovedSchema = {
  body: {
    type: 'object',
    required: ['applicationId', 'investorId', 'investorName', 'investorEmail', 'commitmentAmount', 'approvedBy', 'fundId'],
    properties: {
      applicationId: { type: 'string' },
      investorId: { type: 'string' },
      investorName: { type: 'string' },
      investorEmail: { type: 'string' },
      commitmentAmount: { type: 'number' },
      approvedAt: { type: 'string' },
      approvedBy: { type: 'string' },
      fundId: { type: 'string' },
    },
  },
};

const investorRejectedSchema = {
  body: {
    type: 'object',
    required: ['applicationId', 'investorName', 'investorEmail', 'rejectionReason', 'rejectedBy', 'fundId'],
    properties: {
      applicationId: { type: 'string' },
      investorName: { type: 'string' },
      investorEmail: { type: 'string' },
      rejectionReason: { type: 'string' },
      rejectedAt: { type: 'string' },
      rejectedBy: { type: 'string' },
      fundId: { type: 'string' },
    },
  },
};

export async function webhooksRoutes(fastify: FastifyInstance) {
  // Trigger n8n webhook when onboarding form is submitted
  fastify.post('/n8n/onboarding-submitted', {
    schema: onboardingSubmittedSchema,
  }, async (request, reply) => {
    const payload = request.body as {
      applicationId: string;
      investorName: string;
      investorEmail: string;
      entityType: string;
      commitmentAmount: number;
      submittedAt?: string;
      fundId: string;
    };

    const success = await n8nService.triggerOnboardingSubmitted({
      ...payload,
      submittedAt: payload.submittedAt || new Date().toISOString(),
    });

    if (success) {
      return reply.status(200).send({ success: true, message: 'Webhook triggered' });
    } else {
      return reply.status(500).send({ success: false, message: 'Failed to trigger webhook' });
    }
  });

  // Trigger n8n webhook when investor is approved
  fastify.post('/n8n/investor-approved', {
    schema: investorApprovedSchema,
  }, async (request, reply) => {
    const payload = request.body as {
      applicationId: string;
      investorId: string;
      investorName: string;
      investorEmail: string;
      commitmentAmount: number;
      approvedAt?: string;
      approvedBy: string;
      fundId: string;
    };

    const success = await n8nService.triggerInvestorApproved({
      ...payload,
      approvedAt: payload.approvedAt || new Date().toISOString(),
    });

    if (success) {
      return reply.status(200).send({ success: true, message: 'Webhook triggered' });
    } else {
      return reply.status(500).send({ success: false, message: 'Failed to trigger webhook' });
    }
  });

  // Trigger n8n webhook when investor is rejected
  fastify.post('/n8n/investor-rejected', {
    schema: investorRejectedSchema,
  }, async (request, reply) => {
    const payload = request.body as {
      applicationId: string;
      investorName: string;
      investorEmail: string;
      rejectionReason: string;
      rejectedAt?: string;
      rejectedBy: string;
      fundId: string;
    };

    const success = await n8nService.triggerInvestorRejected({
      ...payload,
      rejectedAt: payload.rejectedAt || new Date().toISOString(),
    });

    if (success) {
      return reply.status(200).send({ success: true, message: 'Webhook triggered' });
    } else {
      return reply.status(500).send({ success: false, message: 'Failed to trigger webhook' });
    }
  });
}




















