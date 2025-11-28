import { DocumentType, SigningStatus } from '../constants/status';

export interface Document {
  id: string;
  fundId: string;
  dealId: string | null;
  investorId: string | null;
  type: DocumentType;
  name: string;
  filePath: string | null;
  requiresSignature: boolean;
  docusignEnvelopeId: string | null;
  signingStatus: SigningStatus | null;
  signedAt: string | null;
  visibleTo: string[] | null;
  createdAt: string;
  createdBy: string | null;
}

