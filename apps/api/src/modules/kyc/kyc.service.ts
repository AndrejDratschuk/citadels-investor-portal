import { supabaseAdmin } from '../../common/database/supabase';
import { webhookService } from '../../common/services/webhook.service';

export interface KYCApplicationData {
  investorCategory: 'individual' | 'entity';
  investorType: string;
  
  // Individual fields
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  
  // Entity fields
  entityLegalName?: string;
  countryOfFormation?: string;
  stateOfFormation?: string;
  authorizedSignerFirstName?: string;
  authorizedSignerLastName?: string;
  authorizedSignerTitle?: string;
  workEmail?: string;
  workPhone?: string;
  principalOfficeCity?: string;
  principalOfficeState?: string;
  principalOfficeCountry?: string;
  
  // Accreditation
  accreditationBases?: string[];
  
  // Investment Intent
  indicativeCommitment?: number;
  timeline?: 'asap' | '30_60_days' | '60_90_days' | 'over_90_days';
  investmentGoals?: string[];
  investmentGoalsOther?: string;
  likelihood?: 'low' | 'medium' | 'high';
  questionsForManager?: string;
  
  // Consent
  preferredContact?: 'email' | 'phone' | 'sms' | 'whatsapp' | 'other';
  consentGiven?: boolean;
}

export interface KYCApplication extends KYCApplicationData {
  id: string;
  fundId: string;
  status: 'draft' | 'submitted' | 'pre_qualified' | 'not_eligible' | 'meeting_scheduled' | 'meeting_complete';
  calendlyEventUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export class KYCService {
  /**
   * Start a new KYC application
   */
  async create(fundId: string, email: string): Promise<KYCApplication> {
    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .insert({
        fund_id: fundId,
        email,
        investor_category: 'individual', // Default
        investor_type: 'hnw', // Default
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating KYC application:', error);
      throw new Error('Failed to create KYC application');
    }

    return this.formatKYCApplication(data);
  }

  /**
   * Get KYC application by ID
   */
  async getById(id: string): Promise<KYCApplication> {
    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error('KYC application not found');
    }

    return this.formatKYCApplication(data);
  }

  /**
   * Update KYC application (autosave)
   */
  async update(id: string, updates: Partial<KYCApplicationData>): Promise<KYCApplication> {
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case
    if (updates.investorCategory !== undefined) dbUpdates.investor_category = updates.investorCategory;
    if (updates.investorType !== undefined) dbUpdates.investor_type = updates.investorType;
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.country !== undefined) dbUpdates.country = updates.country;
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.postalCode !== undefined) dbUpdates.postal_code = updates.postalCode;
    if (updates.entityLegalName !== undefined) dbUpdates.entity_legal_name = updates.entityLegalName;
    if (updates.countryOfFormation !== undefined) dbUpdates.country_of_formation = updates.countryOfFormation;
    if (updates.stateOfFormation !== undefined) dbUpdates.state_of_formation = updates.stateOfFormation;
    if (updates.authorizedSignerFirstName !== undefined) dbUpdates.authorized_signer_first_name = updates.authorizedSignerFirstName;
    if (updates.authorizedSignerLastName !== undefined) dbUpdates.authorized_signer_last_name = updates.authorizedSignerLastName;
    if (updates.authorizedSignerTitle !== undefined) dbUpdates.authorized_signer_title = updates.authorizedSignerTitle;
    if (updates.workEmail !== undefined) dbUpdates.work_email = updates.workEmail;
    if (updates.workPhone !== undefined) dbUpdates.work_phone = updates.workPhone;
    if (updates.principalOfficeCity !== undefined) dbUpdates.principal_office_city = updates.principalOfficeCity;
    if (updates.principalOfficeState !== undefined) dbUpdates.principal_office_state = updates.principalOfficeState;
    if (updates.principalOfficeCountry !== undefined) dbUpdates.principal_office_country = updates.principalOfficeCountry;
    if (updates.accreditationBases !== undefined) dbUpdates.accreditation_bases = updates.accreditationBases;
    if (updates.indicativeCommitment !== undefined) dbUpdates.indicative_commitment = updates.indicativeCommitment;
    if (updates.timeline !== undefined) dbUpdates.timeline = updates.timeline;
    if (updates.investmentGoals !== undefined) dbUpdates.investment_goals = updates.investmentGoals;
    if (updates.investmentGoalsOther !== undefined) dbUpdates.investment_goals_other = updates.investmentGoalsOther;
    if (updates.likelihood !== undefined) dbUpdates.likelihood = updates.likelihood;
    if (updates.questionsForManager !== undefined) dbUpdates.questions_for_manager = updates.questionsForManager;
    if (updates.preferredContact !== undefined) dbUpdates.preferred_contact = updates.preferredContact;
    if (updates.consentGiven !== undefined) dbUpdates.consent_given = updates.consentGiven;

    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating KYC application:', error);
      throw new Error('Failed to update KYC application');
    }

    return this.formatKYCApplication(data);
  }

  /**
   * Submit KYC application for manager review
   * Status becomes 'submitted' (pending) - manager must approve/reject manually
   * Investor record is NOT created until approval
   */
  async submit(id: string): Promise<{ application: KYCApplication; message: string }> {
    // Get the current application
    const application = await this.getById(id);

    // Always set to 'submitted' for manual manager review
    const newStatus = 'submitted';

    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error submitting KYC application:', error);
      throw new Error('Failed to submit KYC application');
    }

    // Send webhook for KYC status change
    webhookService.sendWebhook('kyc.status_changed', {
      id: application.id,
      email: application.email,
      firstName: application.firstName,
      lastName: application.lastName,
      fundId: application.fundId,
      oldStatus: application.status,
      newStatus: newStatus,
    });

    return {
      application: this.formatKYCApplication(data),
      message: 'Your application has been submitted and is pending review.',
    };
  }

  /**
   * Create an investor record from KYC application data
   */
  private async createInvestorFromKYC(application: KYCApplication): Promise<string> {
    console.log('[createInvestorFromKYC] Starting for application:', application.id);
    console.log('[createInvestorFromKYC] Category:', application.investorCategory, 'Type:', application.investorType);
    
    // Map KYC data to investor fields
    const isEntity = application.investorCategory === 'entity';
    
    // Determine entity type from investor type
    let entityType: string | null = null;
    if (isEntity) {
      const typeMap: Record<string, string> = {
        'corp_llc': 'llc',
        'trust': 'trust',
        'family_office': 'corporation',
        'family_client': 'individual',
        'erisa': 'corporation',
        '501c3': 'corporation',
        'entity_5m': 'corporation',
        'foreign_entity': 'corporation',
      };
      entityType = typeMap[application.investorType] || 'corporation';
    } else {
      const typeMap: Record<string, string> = {
        'hnw': 'individual',
        'joint': 'joint',
        'foreign_individual': 'individual',
      };
      entityType = typeMap[application.investorType] || 'individual';
    }

    // Build address JSONB
    const address = isEntity
      ? {
          city: application.principalOfficeCity,
          state: application.principalOfficeState,
          country: application.principalOfficeCountry,
          zip: application.postalCode,
        }
      : {
          city: application.city,
          state: application.state,
          country: application.country,
          zip: application.postalCode,
        };

    const investorData = {
      fund_id: application.fundId,
      first_name: isEntity ? application.authorizedSignerFirstName : application.firstName,
      last_name: isEntity ? application.authorizedSignerLastName : application.lastName,
      email: isEntity ? (application.workEmail || application.email) : application.email,
      phone: isEntity ? application.workPhone : application.phone,
      address: address,
      entity_type: entityType,
      entity_name: isEntity ? application.entityLegalName : null,
      commitment_amount: application.indicativeCommitment || 0,
      accreditation_status: 'pending',
      accreditation_type: this.mapAccreditationType(application.accreditationBases || []),
      status: 'prospect',
      onboarding_step: 1,
    };

    console.log('[createInvestorFromKYC] Inserting investor data:', JSON.stringify(investorData, null, 2));

    const { data, error } = await supabaseAdmin
      .from('investors')
      .insert(investorData)
      .select('*')
      .single();

    if (error) {
      console.error('[createInvestorFromKYC] Supabase error:', error);
      console.error('[createInvestorFromKYC] Error code:', error.code);
      console.error('[createInvestorFromKYC] Error details:', error.details);
      throw new Error(`Failed to create investor: ${error.message}`);
    }

    // Send webhook for new investor
    webhookService.sendWebhook('investor.created', {
      id: data.id,
      email: investorData.email,
      firstName: investorData.first_name,
      lastName: investorData.last_name,
      fundId: application.fundId,
      entityName: investorData.entity_name,
      commitmentAmount: investorData.commitment_amount,
      source: 'kyc',
    });

    return data.id;
  }

  /**
   * Map accreditation bases to a primary accreditation type
   */
  private mapAccreditationType(accreditationBases: string[]): string | null {
    if (accreditationBases.includes('income_200k')) return 'income';
    if (accreditationBases.includes('net_worth_1m')) return 'net_worth';
    if (accreditationBases.includes('licensed_professional')) return 'professional';
    if (accreditationBases.length > 0) return 'income'; // Default
    return null;
  }

  /**
   * Update Calendly event URL after scheduling
   */
  async updateCalendlyEvent(id: string, eventUrl: string): Promise<KYCApplication> {
    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .update({
        calendly_event_url: eventUrl,
        status: 'meeting_scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating Calendly event:', error);
      throw new Error('Failed to update Calendly event');
    }

    return this.formatKYCApplication(data);
  }

  // ==================== Manager Methods ====================

  /**
   * Get all KYC applications for a fund (manager only)
   */
  async getAllByFundId(fundId: string): Promise<KYCApplication[]> {
    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .select('*')
      .eq('fund_id', fundId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching KYC applications:', error);
      throw new Error('Failed to fetch KYC applications');
    }

    return data.map((item) => this.formatKYCApplication(item));
  }

  /**
   * Approve a KYC application (manager only)
   * Creates the investor record and updates the KYC status
   */
  async approve(id: string): Promise<KYCApplication> {
    // Get current application to capture old status
    const current = await this.getById(id);

    // Guard: only allow approval from submitted/meeting statuses
    const allowedStatuses = ['submitted', 'meeting_scheduled', 'meeting_complete'];
    if (!allowedStatuses.includes(current.status)) {
      throw new Error(`Cannot approve application with status: ${current.status}`);
    }

    // Create investor record from KYC data (if not already created)
    let investorId: string | undefined;
    try {
      investorId = await this.createInvestorFromKYC(current);
      console.log('[KYC Approve] Created investor:', investorId);
    } catch (err) {
      console.error('[KYC Approve] Error creating investor:', err);
      throw new Error('Failed to create investor record during approval');
    }

    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .update({
        status: 'pre_qualified',
        investor_id: investorId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error approving KYC application:', error);
      throw new Error('Failed to approve KYC application');
    }

    // Send webhook for KYC status change
    webhookService.sendWebhook('kyc.status_changed', {
      id: current.id,
      email: current.email,
      firstName: current.firstName,
      lastName: current.lastName,
      fundId: current.fundId,
      oldStatus: current.status,
      newStatus: 'pre_qualified',
      investorId,
    });

    // Send webhook for manager decision (acknowledged)
    webhookService.sendWebhook('kyc.acknowledged', {
      id: current.id,
      email: current.email,
      firstName: current.firstName,
      lastName: current.lastName,
      fundId: current.fundId,
      decision: 'approved',
      reason: null,
      investorId,
    });

    return this.formatKYCApplication(data);
  }

  /**
   * Reject a KYC application (manager only)
   */
  async reject(id: string, reason?: string): Promise<KYCApplication> {
    // Get current application to capture old status
    const current = await this.getById(id);

    // Guard: only allow rejection from submitted/meeting statuses
    const allowedStatuses = ['submitted', 'meeting_scheduled', 'meeting_complete'];
    if (!allowedStatuses.includes(current.status)) {
      throw new Error(`Cannot reject application with status: ${current.status}`);
    }

    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .update({
        status: 'not_eligible',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting KYC application:', error);
      throw new Error('Failed to reject KYC application');
    }

    // Send webhook for KYC status change
    webhookService.sendWebhook('kyc.status_changed', {
      id: current.id,
      email: current.email,
      firstName: current.firstName,
      lastName: current.lastName,
      fundId: current.fundId,
      oldStatus: current.status,
      newStatus: 'not_eligible',
      rejectionReason: reason,
    });

    // Send webhook for manager decision (acknowledged)
    webhookService.sendWebhook('kyc.acknowledged', {
      id: current.id,
      email: current.email,
      firstName: current.firstName,
      lastName: current.lastName,
      fundId: current.fundId,
      decision: 'rejected',
      reason: reason || null,
    });

    return this.formatKYCApplication(data);
  }

  private formatKYCApplication(data: any): KYCApplication {
    return {
      id: data.id,
      fundId: data.fund_id,
      investorCategory: data.investor_category,
      investorType: data.investor_type,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      country: data.country,
      state: data.state,
      city: data.city,
      postalCode: data.postal_code,
      entityLegalName: data.entity_legal_name,
      countryOfFormation: data.country_of_formation,
      stateOfFormation: data.state_of_formation,
      authorizedSignerFirstName: data.authorized_signer_first_name,
      authorizedSignerLastName: data.authorized_signer_last_name,
      authorizedSignerTitle: data.authorized_signer_title,
      workEmail: data.work_email,
      workPhone: data.work_phone,
      principalOfficeCity: data.principal_office_city,
      principalOfficeState: data.principal_office_state,
      principalOfficeCountry: data.principal_office_country,
      accreditationBases: data.accreditation_bases || [],
      indicativeCommitment: data.indicative_commitment ? parseFloat(data.indicative_commitment) : undefined,
      timeline: data.timeline,
      investmentGoals: data.investment_goals || [],
      investmentGoalsOther: data.investment_goals_other,
      likelihood: data.likelihood,
      questionsForManager: data.questions_for_manager,
      preferredContact: data.preferred_contact,
      consentGiven: data.consent_given,
      status: data.status,
      calendlyEventUrl: data.calendly_event_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

