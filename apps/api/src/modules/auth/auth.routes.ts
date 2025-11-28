import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const authController = new AuthController();

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/signup', async (request, reply) => {
    return authController.signup(request, reply);
  });

  fastify.post('/login', async (request, reply) => {
    return authController.login(request, reply);
  });

  fastify.post('/refresh', async (request, reply) => {
    return authController.refresh(request, reply);
  });

  // Protected routes
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    return authController.me(request, reply);
  });

  fastify.post('/logout', { preHandler: authenticate }, async (request, reply) => {
    return authController.logout(request, reply);
  });
}

