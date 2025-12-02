import { z } from 'zod';
import { DOCUMENT_TYPE } from '../constants/status';

export const createDocumentSchema = z.object({
  fundId: z.string().uuid(),
  dealId: z.string().uuid().optional(),
  investorId: z.string().uuid().optional(),
  type: z.enum(Object.values(DOCUMENT_TYPE) as [string, ...string[]]),
  name: z.string().min(1, 'Document name is required'),
  filePath: z.string().optional(),
  requiresSignature: z.boolean().default(false),
  visibleTo: z.array(z.string()).optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

export const sendForSignatureSchema = z.object({
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1, 'Recipient name is required'),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type SendForSignatureInput = z.infer<typeof sendForSignatureSchema>;

