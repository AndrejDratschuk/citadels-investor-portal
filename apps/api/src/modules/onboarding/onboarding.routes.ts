import { FastifyInstance } from 'fastify';
import { OnboardingController } from './onboarding.controller';

const onboardingController = new OnboardingController();

export async function onboardingRoutes(fastify: FastifyInstance) {
  // Submit onboarding application (public - no auth required)
  fastify.post('/submit', async (request, reply) => {
    return onboardingController.submit(request, reply);
  });

  // Get onboarding status
  fastify.get('/status/:inviteCode', async (request, reply) => {
    return onboardingController.getStatus(request, reply);
  });
}

















