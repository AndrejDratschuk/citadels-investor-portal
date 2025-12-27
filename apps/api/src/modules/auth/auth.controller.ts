import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { signupSchema, loginSchema } from '@flowveda/shared';

const authService = new AuthService();

export class AuthController {
  async signup(request: FastifyRequest, reply: FastifyReply) {
    const body = signupSchema.parse(request.body);
    const user = await authService.signup(body);

    return reply.status(201).send({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = loginSchema.parse(request.body);
    const result = await authService.login(body);

    return reply.send({
      success: true,
      data: result,
    });
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    const token = authHeader.substring(7);
    const user = await authService.getCurrentUser(token);

    return reply.send({
      success: true,
      data: user,
    });
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = request.body as { refreshToken: string };
    if (!refreshToken) {
      return reply.status(400).send({
        success: false,
        error: 'Refresh token is required',
      });
    }

    const tokens = await authService.refreshToken(refreshToken);

    return reply.send({
      success: true,
      data: tokens,
    });
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    const token = authHeader.substring(7);
    await authService.logout(token);

    return reply.send({
      success: true,
      message: 'Logged out successfully',
    });
  }

  async createOnboardingAccount(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = request.body as { email: string; password: string };

    if (!email || !password) {
      return reply.status(400).send({
        success: false,
        error: 'Email and password are required',
      });
    }

    try {
      const result = await authService.createOnboardingAccount(email, password);

      return reply.status(201).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to create account',
      });
    }
  }
}

