import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../database/supabase';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    fundId: string | null;
  };
}

export async function authenticate(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    // Get user role from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, fund_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    // Attach user to request
    request.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      fundId: userData.fund_id,
    };
  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}

