import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(
  error: FastifyError | ZodError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error
  request.log.error(error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: 'Validation error',
      details: error.errors,
    });
  }

  const fastifyError = error as FastifyError;

  // Fastify validation errors
  if (fastifyError.validation) {
    return reply.status(400).send({
      success: false,
      error: 'Validation error',
      details: fastifyError.validation,
    });
  }

  // JWT errors
  if (fastifyError.statusCode === 401) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: fastifyError.message || 'Invalid or expired token',
    });
  }

  // Default error response
  const statusCode = fastifyError.statusCode || 500;
  const message = fastifyError.message || 'Internal server error';

  return reply.status(statusCode).send({
    success: false,
    error: statusCode === 500 ? 'Internal server error' : message,
    message: process.env.NODE_ENV === 'development' ? message : undefined,
  });
}

