import { FastifyInstance } from 'fastify';
import { authRoutes } from './modules/auth/auth.routes';
import { investorsRoutes } from './modules/investors/investors.routes';
import { webhooksRoutes } from './modules/webhooks/webhooks.routes';
import { communicationsRoutes } from './modules/communications/communications.routes';
import { kycRoutes } from './modules/kyc/kyc.routes';
import { onboardingRoutes } from './modules/onboarding/onboarding.routes';
import { emailRoutes } from './modules/email/email.routes';
import { fundsRoutes } from './modules/funds/funds.routes';
import { documentsRoutes } from './modules/documents/documents.routes';
import { dealsRoutes } from './modules/deals/deals.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { capitalCallsRoutes } from './modules/capital-calls/capital-calls.routes';
import { docuSignRoutes } from './modules/docusign/docusign.routes';
import { kpisRoutes, dealKpisRoutes } from './modules/kpis/kpis.routes';
import { dataImportRoutes } from './modules/data-import/data-import.routes';
import { accountCreationRoutes } from './modules/account-creation/account-creation.routes';
import { prospectsRoutes } from './modules/prospects/prospects.routes';
import { teamInvitesRoutes } from './modules/team-invites/teamInvites.routes';

export async function registerRoutes(fastify: FastifyInstance) {
  // Register all module routes
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(investorsRoutes, { prefix: '/investors' });
  await fastify.register(webhooksRoutes, { prefix: '/webhooks' });
  await fastify.register(communicationsRoutes); // No prefix, routes have full paths
  await fastify.register(kycRoutes, { prefix: '/kyc' });
  await fastify.register(onboardingRoutes, { prefix: '/onboarding' });
  await fastify.register(emailRoutes, { prefix: '/email' });
  await fastify.register(fundsRoutes, { prefix: '/funds' });
  await fastify.register(documentsRoutes, { prefix: '/documents' });
  await fastify.register(dealsRoutes, { prefix: '/deals' });
  await fastify.register(notificationsRoutes, { prefix: '/notifications' });
  await fastify.register(capitalCallsRoutes, { prefix: '/capital-calls' });
  await fastify.register(docuSignRoutes, { prefix: '/docusign' });
  await fastify.register(kpisRoutes, { prefix: '/kpis' });
  await fastify.register(dealKpisRoutes, { prefix: '/deals' });
  await fastify.register(dataImportRoutes, { prefix: '/import' });
  await fastify.register(accountCreationRoutes, { prefix: '/account-creation' });
  await fastify.register(prospectsRoutes, { prefix: '/prospects' });
  await fastify.register(teamInvitesRoutes, { prefix: '/team-invites' });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}

