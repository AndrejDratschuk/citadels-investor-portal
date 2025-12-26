import { supabaseAdmin } from '../../common/database/supabase';

export type DocumentCategory = 'fund' | 'deal' | 'investor';
export type DocumentDepartment = 'tax' | 'finance' | 'marketing' | 'strategy' | 'operations' | 'legal' | 'compliance';
export type DocumentStatus = 'draft' | 'review' | 'final';
export type ValidationStatus = 'pending' | 'approved' | 'rejected';
export type UploadedBy = 'investor' | 'fund_manager' | 'docusign_auto' | 'system';

export interface Document {
  id: string;
  fundId: string;
  dealId: string | null;
  investorId: string | null;
  type: 'ppm' | 'subscription' | 'k1' | 'report' | 'capital_call' | 'kyc' | 'other';
  name: string;
  filePath: string | null;
  requiresSignature: boolean;
  signingStatus: 'not_sent' | 'sent' | 'viewed' | 'signed' | 'declined' | null;
  signedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  // New categorization fields
  category?: DocumentCategory;
  department?: DocumentDepartment | null;
  status?: DocumentStatus;
  tags?: string[];
  // Joined data
  dealName?: string | null;
  investorName?: string | null;
}

export interface DocumentWithRelations extends Document {
  deal?: {
    id: string;
    name: string;
  } | null;
  investor?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface CreateDocumentInput {
  name: string;
  type: Document['type'];
  category?: DocumentCategory;
  department?: DocumentDepartment;
  status?: DocumentStatus;
  tags?: string[];
  dealId?: string;
  investorId?: string;
  filePath?: string;
  requiresSignature?: boolean;
  // Validation document fields
  subcategory?: string;
  validationStatus?: ValidationStatus;
  uploadedBy?: UploadedBy;
  documentType?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface ValidationDocument extends Document {
  subcategory: 'validation';
  validationStatus: ValidationStatus;
  uploadedBy: UploadedBy;
  validatedBy?: string | null;
  validatedAt?: string | null;
  rejectionReason?: string | null;
  fileSize?: number;
  mimeType?: string;
  // Email notification context
  investorEmail?: string | null;
}

export interface InvestorEmailContext {
  investorId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface FundEmailContext {
  fundId: string;
  name: string;
}

export interface DocumentFilters {
  type?: string;
  category?: DocumentCategory;
  department?: DocumentDepartment;
  status?: DocumentStatus;
  dealId?: string;
  investorId?: string;
  tag?: string;
}

export interface DocumentsByDeal {
  dealId: string;
  dealName: string;
  dealStatus: string;
  closeDate: string | null;
  totalEquity: number;
  investorCount: number;
  documentCount: number;
}

export interface DocumentsByInvestor {
  investorId: string;
  investorName: string;
  email: string;
  documentCount: number;
}

export class DocumentsService {
  /**
   * Get all documents for a fund with advanced filters
   */
  async getAllByFundId(fundId: string, filters?: DocumentFilters): Promise<Document[]> {
    let query = supabaseAdmin
      .from('documents')
      .select(`
        *,
        deals:deal_id (id, name),
        investors:investor_id (id, first_name, last_name)
      `)
      .eq('fund_id', fundId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.department) {
      query = query.eq('department', filters.department);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.dealId) {
      query = query.eq('deal_id', filters.dealId);
    }
    if (filters?.investorId) {
      query = query.eq('investor_id', filters.investorId);
    }
    if (filters?.tag) {
      query = query.contains('tags', [filters.tag]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Failed to fetch documents');
    }

    return data.map(this.formatDocument);
  }

  /**
   * Get documents grouped by deal
   */
  async getByDeal(fundId: string): Promise<DocumentsByDeal[]> {
    // Get all deals for the fund with document counts
    const { data: deals, error: dealsError } = await supabaseAdmin
      .from('deals')
      .select('id, name, status, acquisition_date, acquisition_price')
      .eq('fund_id', fundId)
      .order('created_at', { ascending: false });

    if (dealsError) {
      console.error('Error fetching deals:', dealsError);
      throw new Error('Failed to fetch deals');
    }

    // Get document counts per deal
    const { data: docCounts, error: docError } = await supabaseAdmin
      .from('documents')
      .select('deal_id')
      .eq('fund_id', fundId)
      .not('deal_id', 'is', null);

    if (docError) {
      console.error('Error fetching document counts:', docError);
    }

    // Get investor counts per deal
    const { data: investorDeals, error: investorError } = await supabaseAdmin
      .from('investor_deals')
      .select('deal_id, investor_id');

    if (investorError) {
      console.error('Error fetching investor counts:', investorError);
    }

    // Count documents and investors per deal
    const docCountMap: Record<string, number> = {};
    const investorCountMap: Record<string, number> = {};

    docCounts?.forEach(doc => {
      if (doc.deal_id) {
        docCountMap[doc.deal_id] = (docCountMap[doc.deal_id] || 0) + 1;
      }
    });

    investorDeals?.forEach(inv => {
      if (inv.deal_id) {
        investorCountMap[inv.deal_id] = (investorCountMap[inv.deal_id] || 0) + 1;
      }
    });

    return deals.map(deal => ({
      dealId: deal.id,
      dealName: deal.name,
      dealStatus: deal.status,
      closeDate: deal.acquisition_date,
      totalEquity: deal.acquisition_price || 0,
      investorCount: investorCountMap[deal.id] || 0,
      documentCount: docCountMap[deal.id] || 0,
    }));
  }

  /**
   * Get documents grouped by investor
   */
  async getByInvestor(fundId: string): Promise<DocumentsByInvestor[]> {
    // Get all investors for the fund
    const { data: investors, error: investorsError } = await supabaseAdmin
      .from('investors')
      .select('id, first_name, last_name, email')
      .eq('fund_id', fundId)
      .order('last_name', { ascending: true });

    if (investorsError) {
      console.error('Error fetching investors:', investorsError);
      throw new Error('Failed to fetch investors');
    }

    // Get document counts per investor
    const { data: docCounts, error: docError } = await supabaseAdmin
      .from('documents')
      .select('investor_id')
      .eq('fund_id', fundId)
      .not('investor_id', 'is', null);

    if (docError) {
      console.error('Error fetching document counts:', docError);
    }

    // Count documents per investor
    const docCountMap: Record<string, number> = {};
    docCounts?.forEach(doc => {
      if (doc.investor_id) {
        docCountMap[doc.investor_id] = (docCountMap[doc.investor_id] || 0) + 1;
      }
    });

    return investors.map(inv => ({
      investorId: inv.id,
      investorName: `${inv.first_name} ${inv.last_name}`,
      email: inv.email,
      documentCount: docCountMap[inv.id] || 0,
    }));
  }

  /**
   * Get documents for a specific deal
   */
  async getDocumentsForDeal(fundId: string, dealId: string): Promise<Document[]> {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select(`
        *,
        investors:investor_id (id, first_name, last_name)
      `)
      .eq('fund_id', fundId)
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents for deal:', error);
      throw new Error('Failed to fetch documents');
    }

    return data.map(this.formatDocument);
  }

  /**
   * Get documents for a specific investor
   */
  async getDocumentsForInvestor(fundId: string, investorId: string): Promise<Document[]> {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select(`
        *,
        deals:deal_id (id, name)
      `)
      .eq('fund_id', fundId)
      .eq('investor_id', investorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents for investor:', error);
      throw new Error('Failed to fetch documents');
    }

    return data.map(this.formatDocument);
  }

  /**
   * Create a new document
   */
  async create(fundId: string, userId: string, input: CreateDocumentInput): Promise<Document> {
    // Determine category based on input or presence of deal/investor
    let category = input.category;
    if (!category) {
      if (input.dealId && !input.investorId) {
        category = 'deal';
      } else if (input.investorId) {
        category = 'investor';
      } else {
        category = 'fund';
      }
    }

    const insertData: Record<string, any> = {
      fund_id: fundId,
      deal_id: input.dealId || null,
      investor_id: input.investorId || null,
      type: input.type,
      name: input.name,
      file_path: input.filePath || null,
      requires_signature: input.requiresSignature || false,
      created_by: userId,
      // Categorization fields
      category,
      department: input.department || null,
      status: input.status || 'final',
      tags: input.tags || [],
    };

    // Add validation document fields if provided
    if (input.subcategory) {
      insertData.subcategory = input.subcategory;
    }
    if (input.validationStatus) {
      insertData.validation_status = input.validationStatus;
    }
    if (input.uploadedBy) {
      insertData.uploaded_by = input.uploadedBy;
    }
    if (input.fileSize) {
      insertData.file_size = input.fileSize;
    }
    if (input.mimeType) {
      insertData.mime_type = input.mimeType;
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create document');
    }

    return this.formatDocument(data);
  }

  /**
   * Upload document file to Supabase Storage
   */
  async uploadFile(
    fundId: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    const timestamp = Date.now();
    const filePath = `documents/${fundId}/${timestamp}-${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('fund-assets')
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error('Failed to upload file');
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('fund-assets')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  /**
   * Delete a document
   */
  async delete(fundId: string, documentId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('fund_id', fundId);

    if (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  /**
   * Get validation documents for fund manager review
   */
  async getValidationDocuments(
    fundId: string, 
    validationStatus?: ValidationStatus
  ): Promise<ValidationDocument[]> {
    let query = supabaseAdmin
      .from('documents')
      .select(`
        *,
        investors:investor_id (id, first_name, last_name, email)
      `)
      .eq('fund_id', fundId)
      .eq('subcategory', 'validation')
      .order('created_at', { ascending: false });

    if (validationStatus) {
      query = query.eq('validation_status', validationStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching validation documents:', error);
      throw new Error('Failed to fetch validation documents');
    }

    return data.map(this.formatValidationDocument);
  }

  /**
   * Approve a validation document
   */
  async approveDocument(
    fundId: string, 
    documentId: string, 
    userId: string,
    timestamp: Date
  ): Promise<ValidationDocument> {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .update({
        validation_status: 'approved',
        validated_by: userId,
        validated_at: timestamp.toISOString(),
      })
      .eq('id', documentId)
      .eq('fund_id', fundId)
      .eq('subcategory', 'validation')
      .select(`
        *,
        investors:investor_id (id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Error approving document:', error);
      throw new Error('Failed to approve document');
    }

    return this.formatValidationDocument(data);
  }

  /**
   * Reject a validation document
   */
  async rejectDocument(
    fundId: string, 
    documentId: string, 
    userId: string,
    reason: string,
    timestamp: Date
  ): Promise<ValidationDocument> {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .update({
        validation_status: 'rejected',
        validated_by: userId,
        validated_at: timestamp.toISOString(),
        rejection_reason: reason,
      })
      .eq('id', documentId)
      .eq('fund_id', fundId)
      .eq('subcategory', 'validation')
      .select(`
        *,
        investors:investor_id (id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Error rejecting document:', error);
      throw new Error('Failed to reject document');
    }

    return this.formatValidationDocument(data);
  }

  /**
   * Get investor's own validation documents
   */
  async getMyValidationDocuments(investorId: string): Promise<ValidationDocument[]> {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('investor_id', investorId)
      .eq('subcategory', 'validation')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching investor validation documents:', error);
      throw new Error('Failed to fetch validation documents');
    }

    return data.map(this.formatValidationDocument);
  }

  /**
   * Get fund details for email context
   */
  async getFundEmailContext(fundId: string): Promise<FundEmailContext | null> {
    const { data, error } = await supabaseAdmin
      .from('funds')
      .select('id, name')
      .eq('id', fundId)
      .single();

    if (error || !data) {
      console.error('Error fetching fund for email context:', error);
      return null;
    }

    return {
      fundId: data.id,
      name: data.name,
    };
  }

  /**
   * Get investor details for email context
   */
  async getInvestorEmailContext(investorId: string): Promise<InvestorEmailContext | null> {
    const { data, error } = await supabaseAdmin
      .from('investors')
      .select('id, email, first_name, last_name')
      .eq('id', investorId)
      .single();

    if (error || !data) {
      console.error('Error fetching investor for email context:', error);
      return null;
    }

    return {
      investorId: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
    };
  }

  /**
   * Get investor ID from user ID
   */
  async getInvestorIdByUserId(userId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('investors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  }

  private formatValidationDocument(data: any): ValidationDocument {
    const investorData = data.investors;

    return {
      id: data.id,
      fundId: data.fund_id,
      dealId: data.deal_id,
      investorId: data.investor_id,
      type: data.type,
      name: data.name,
      filePath: data.file_path,
      requiresSignature: data.requires_signature,
      signingStatus: data.signing_status,
      signedAt: data.signed_at,
      createdAt: data.created_at,
      createdBy: data.created_by,
      category: data.category || 'investor',
      department: data.department,
      status: data.status,
      tags: data.tags || [],
      investorName: investorData 
        ? `${investorData.first_name} ${investorData.last_name}` 
        : null,
      // Validation-specific fields
      subcategory: 'validation',
      validationStatus: data.validation_status || 'pending',
      uploadedBy: data.uploaded_by || 'investor',
      validatedBy: data.validated_by,
      validatedAt: data.validated_at,
      rejectionReason: data.rejection_reason,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      // Email notification context
      investorEmail: investorData?.email || null,
    };
  }

  private formatDocument(data: any): Document {
    const dealData = data.deals;
    const investorData = data.investors;

    return {
      id: data.id,
      fundId: data.fund_id,
      dealId: data.deal_id,
      investorId: data.investor_id,
      type: data.type,
      name: data.name,
      filePath: data.file_path,
      requiresSignature: data.requires_signature,
      signingStatus: data.signing_status,
      signedAt: data.signed_at,
      createdAt: data.created_at,
      createdBy: data.created_by,
      // New fields
      category: data.category || 'deal',
      department: data.department,
      status: data.status || 'final',
      tags: data.tags || [],
      // Joined data
      dealName: dealData?.name || null,
      investorName: investorData 
        ? `${investorData.first_name} ${investorData.last_name}` 
        : null,
    };
  }
}

export const documentsService = new DocumentsService();





