import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from './auth.middleware';
import { USER_ROLES } from '@flowveda/shared';

export function requireRole(...allowedRoles: string[]) {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
  };
}

export const requireManager = requireRole(USER_ROLES.MANAGER);
export const requireAccountant = requireRole(USER_ROLES.ACCOUNTANT);
export const requireAttorney = requireRole(USER_ROLES.ATTORNEY);
export const requireInvestor = requireRole(USER_ROLES.INVESTOR);

