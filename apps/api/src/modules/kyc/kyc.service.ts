import { supabaseAdmin } from '../../common/database/supabase';

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
   * Submit KYC application and determine eligibility
   */
  async submit(id: string): Promise<{ application: KYCApplication; eligible: boolean }> {
    // Get the current application
    const application = await this.getById(id);

    // Check if at least one accreditation basis is selected
    const accreditationBases = application.accreditationBases || [];
    const eligible = accreditationBases.length > 0;

    // Update status based on eligibility
    const newStatus = eligible ? 'pre_qualified' : 'not_eligible';

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

    return {
      application: this.formatKYCApplication(data),
      eligible,
    };
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

